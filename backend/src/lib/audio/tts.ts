import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { toFile } from 'openai';
import { generationConfig, type NarrationVoice } from '../../config.js';
import { db } from '../../db.js';
import { getOpenAI } from '../../openai.js';
import { errorMessage, withModelRetry } from '../modelRetry.js';
import { proportionalTimings, timingsFromTranscription, type WordTiming } from './timings.js';

const { transcriptionModel, ttsModel, ttsVoice } = generationConfig;
const fallbackVoice: NarrationVoice = 'cedar';

export const narrationInstructions = 'Warm, gentle storyteller reading to a young child. Speak slowly and clearly, with a calm, even tone. Short pauses between sentences. Softly cheerful. Never loud, fast, or dramatic.';

function configuredVoice(): NarrationVoice {
  return ttsVoice;
}

function audioHash(text: string, voice: NarrationVoice): string {
  return createHash('sha256')
    .update([ttsModel, voice, 'mp3', narrationInstructions, text].join('\n'))
    .digest('hex');
}

async function synthesize(text: string, pageIndex: number, voice: NarrationVoice): Promise<Buffer> {
  return withModelRetry(`page ${pageIndex} narration`, async () => {
    const response = await getOpenAI().audio.speech.create({
      model: ttsModel,
      voice,
      input: text,
      instructions: narrationInstructions,
      response_format: 'mp3',
    });
    return Buffer.from(await response.arrayBuffer());
  });
}

async function findOrCreateAudio(text: string, pageIndex: number, voice: NarrationVoice) {
  const hash = audioHash(text, voice);
  const cached = await db.media.findUnique({ where: { hash }, select: { id: true, bytes: true } });
  if (cached) return { id: cached.id, bytes: Buffer.from(cached.bytes) };

  const bytes = await synthesize(text, pageIndex, voice);
  const media = await db.media.upsert({
    where: { hash },
    create: { hash, kind: 'audio', mime: 'audio/mpeg', bytes: Uint8Array.from(bytes) },
    update: {},
    select: { id: true },
  });
  return { id: media.id, bytes };
}

async function wordTimings(text: string, bytes: Buffer, pageIndex: number): Promise<WordTiming[]> {
  try {
    const transcription = await withModelRetry(`page ${pageIndex} narration timings`, async () => {
      const file = await toFile(bytes, `page-${pageIndex}.mp3`, { type: 'audio/mpeg' });
      return getOpenAI().audio.transcriptions.create({
        file,
        model: transcriptionModel,
        language: 'en',
        response_format: 'verbose_json' as const,
        timestamp_granularities: ['word'],
      });
    });

    const exact = timingsFromTranscription(text, transcription);
    if (exact) return exact;

    console.warn(`[audio] page ${pageIndex} timing match was incomplete; using proportional timings`);
    return proportionalTimings(text, transcription.duration);
  } catch (error) {
    console.warn(`[audio] page ${pageIndex} timing transcription failed; player will use proportional timing: ${errorMessage(error)}`);
    return [];
  }
}

type NarrationPage = {
  id: string;
  index: number;
  text: string;
};

type NarrationAudio = {
  id: string;
  bytes: Buffer;
};

const pageNarrationConcurrency = 3;

async function storePageNarration(page: NarrationPage, audio: NarrationAudio): Promise<void> {
  const timings = await wordTimings(page.text, audio.bytes, page.index);
  await db.page.update({
    where: { id: page.id },
    data: {
      audioId: audio.id,
      timings: timings as unknown as Prisma.InputJsonValue,
    },
  });
}

async function voicePage(page: NarrationPage, voice: NarrationVoice): Promise<void> {
  const audio = await findOrCreateAudio(page.text, page.index, voice);
  await storePageNarration(page, audio);
}

/**
 * Runs the remaining pages in a small worker pool. Individual page failures
 * are collected rather than aborting workers, so completed pages retain their
 * audio and timings before the story pipeline transitions to failed.
 */
async function voiceRemainingPages(pages: NarrationPage[], voice: NarrationVoice): Promise<void> {
  const failures: Array<{ pageIndex: number; error: unknown }> = [];
  let nextPage = 0;

  async function worker(): Promise<void> {
    while (nextPage < pages.length) {
      const page = pages[nextPage];
      nextPage += 1;

      try {
        await voicePage(page, voice);
      } catch (error) {
        failures.push({ pageIndex: page.index, error });
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(pageNarrationConcurrency, pages.length) },
    () => worker(),
  );
  await Promise.all(workers);

  if (failures.length > 0) {
    const details = failures
      .map(({ pageIndex, error }) => `page ${pageIndex}: ${errorMessage(error)}`)
      .join('; ');
    throw new Error(`Narration failed after processing all pages: ${details}`);
  }
}

/** Creates and stores a calm MP3 plus word timings for every generated story page. */
export async function voiceStoryPages(storyId: string): Promise<void> {
  const story = await db.story.findUnique({
    where: { id: storyId },
    include: { pages: { orderBy: { index: 'asc' } } },
  });
  if (!story) throw new Error(`Cannot voice missing story ${storyId}.`);

  let voice = configuredVoice();
  const [firstPage, ...remainingPages] = story.pages;
  if (!firstPage) return;

  let firstAudio: NarrationAudio;
  try {
    firstAudio = await findOrCreateAudio(firstPage.text, firstPage.index, voice);
  } catch (error) {
    if (voice === fallbackVoice) throw error;
    console.warn(`[audio] ${voice} was unavailable; using ${fallbackVoice} for this story: ${errorMessage(error)}`);
    voice = fallbackVoice;
    firstAudio = await findOrCreateAudio(firstPage.text, firstPage.index, voice);
  }

  await storePageNarration(firstPage, firstAudio);
  await voiceRemainingPages(remainingPages, voice);
}
