import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { toFile } from 'openai';
import { db } from '../../db.js';
import { getOpenAI } from '../../openai.js';
import { errorMessage, withModelRetry } from '../modelRetry.js';
import { proportionalTimings, timingsFromTranscription, type WordTiming } from './timings.js';

const ttsModel = 'gpt-4o-mini-tts';
const fallbackVoice = 'cedar';
type NarrationVoice = 'marin' | typeof fallbackVoice;

export const narrationInstructions = 'Warm, gentle storyteller reading to a young child. Speak slowly and clearly, with a calm, even tone. Short pauses between sentences. Softly cheerful. Never loud, fast, or dramatic.';

function configuredVoice(): NarrationVoice {
  return process.env.TTS_VOICE === fallbackVoice ? fallbackVoice : 'marin';
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
        model: 'whisper-1',
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

/** Creates and stores a calm MP3 plus word timings for every generated story page. */
export async function voiceStoryPages(storyId: string): Promise<void> {
  const story = await db.story.findUnique({
    where: { id: storyId },
    include: { pages: { orderBy: { index: 'asc' } } },
  });
  if (!story) throw new Error(`Cannot voice missing story ${storyId}.`);

  let voice = configuredVoice();
  for (let pageOffset = 0; pageOffset < story.pages.length; pageOffset += 1) {
    const page = story.pages[pageOffset];
    let audio;
    try {
      audio = await findOrCreateAudio(page.text, page.index, voice);
    } catch (error) {
      if (pageOffset !== 0 || voice === fallbackVoice) throw error;
      console.warn(`[audio] ${voice} was unavailable; using ${fallbackVoice} for this story: ${errorMessage(error)}`);
      voice = fallbackVoice;
      audio = await findOrCreateAudio(page.text, page.index, voice);
    }

    const timings = await wordTimings(page.text, audio.bytes, page.index);
    await db.page.update({
      where: { id: page.id },
      data: {
        audioId: audio.id,
        timings: timings as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
