import { createHash } from 'node:crypto';
import { toFile } from 'openai';
import { generationConfig } from '../../config.js';
import { db } from '../../db.js';
import { getOpenAI } from '../../openai.js';
import { errorMessage, withModelRetry } from '../modelRetry.js';
import { styleBlock } from './style.js';
import { ensureCharacterSheet } from './characterSheet.js';

const { imageModel, imageQuality } = generationConfig;

function contentHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function imageBytes(response: { data?: Array<{ b64_json?: string | null }> }): Buffer {
  const encoded = response.data?.[0]?.b64_json;
  if (!encoded) {
    throw new Error('The image model returned no image bytes.');
  }

  return Buffer.from(encoded, 'base64');
}

/** GPT Image 2 applies high reference fidelity itself and rejects this legacy edit parameter. */
function usesBuiltInHighFidelity(model: string): boolean {
  return model.startsWith('gpt-image-2');
}

type PageImageJob = {
  id: string;
  index: number;
  scene: string;
};

type ReferenceSheet = {
  bytes: Uint8Array;
  mime: string;
};

const pageImageConcurrency = 3;

async function drawPageImage(
  page: PageImageJob,
  characterBlock: string,
  sheet: ReferenceSheet,
): Promise<void> {
  const prompt = [styleBlock, characterBlock, page.scene].join('\n\n');
  const hash = contentHash(
    [styleBlock, characterBlock, page.scene, imageModel, imageQuality].join('\n'),
  );
  const cached = await db.media.findUnique({ where: { hash }, select: { id: true } });

  if (cached) {
    await db.page.update({ where: { id: page.id }, data: { imageId: cached.id } });
    return;
  }

  const response = await withModelRetry(`page ${page.index} image`, async () => {
    const referenceImage = await toFile(Buffer.from(sheet.bytes), 'character-sheet.png', {
      type: sheet.mime,
    });
    const request = {
      model: imageModel,
      image: referenceImage,
      prompt,
      quality: imageQuality,
      size: '1024x1024' as const,
    };
    return getOpenAI().images.edit(
      usesBuiltInHighFidelity(imageModel)
        ? request
        : { ...request, input_fidelity: 'high' },
    );
  });
  const media = await db.media.upsert({
    where: { hash },
    create: { hash, kind: 'image', mime: 'image/png', bytes: Uint8Array.from(imageBytes(response)) },
    update: {},
    select: { id: true },
  });
  await db.page.update({ where: { id: page.id }, data: { imageId: media.id } });
}

/**
 * Keeps at most three image requests active and lets every page finish its
 * retry path before reporting a failed story to the pipeline.
 */
async function drawRemainingPages(
  pages: PageImageJob[],
  characterBlock: string,
  sheet: ReferenceSheet,
): Promise<void> {
  const failures: Array<{ pageIndex: number; error: unknown }> = [];
  let nextPage = 0;

  async function worker(): Promise<void> {
    while (nextPage < pages.length) {
      const page = pages[nextPage];
      nextPage += 1;

      try {
        await drawPageImage(page, characterBlock, sheet);
      } catch (error) {
        failures.push({ pageIndex: page.index, error });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(pageImageConcurrency, pages.length) }, () => worker()),
  );

  if (failures.length > 0) {
    throw new Error(
      `Image drawing failed after processing all pages: ${failures
        .map(({ pageIndex, error }) => `page ${pageIndex}: ${errorMessage(error)}`)
        .join('; ')}`,
    );
  }
}

/** Draws each page from the cached character sheet, avoiding repeated scene costs. */
export async function drawStoryPages(storyId: string): Promise<void> {
  const story = await db.story.findUnique({
    where: { id: storyId },
    include: { child: true, pages: { orderBy: { index: 'asc' } } },
  });
  if (!story) {
    throw new Error(`Cannot draw pages for missing story ${storyId}.`);
  }

  const sheetId = await ensureCharacterSheet(story.childId, story.characterBlock);
  const sheet = await db.media.findUnique({ where: { id: sheetId } });
  if (!sheet) {
    throw new Error(`Character sheet ${sheetId} is missing.`);
  }

  await drawRemainingPages(story.pages, story.characterBlock, sheet);
}
