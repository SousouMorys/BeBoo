import { createHash } from 'node:crypto';
import { toFile } from 'openai';
import { db } from '../../db.js';
import { getOpenAI } from '../../openai.js';
import { withModelRetry } from '../modelRetry.js';
import { styleBlock } from './style.js';
import { ensureCharacterSheet } from './characterSheet.js';

const imageModel = process.env.IMAGE_MODEL ?? 'gpt-image-1-mini';

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

  for (const page of story.pages) {
    const prompt = [styleBlock, story.characterBlock, page.scene].join('\n\n');
    const hash = contentHash(`${styleBlock}\n${story.characterBlock}\n${page.scene}\n${imageModel}\nlow`);
    const cached = await db.media.findUnique({ where: { hash }, select: { id: true } });

    if (cached) {
      await db.page.update({ where: { id: page.id }, data: { imageId: cached.id } });
      continue;
    }

    const response = await withModelRetry(`page ${page.index} image`, async () => {
      const referenceImage = await toFile(Buffer.from(sheet.bytes), 'character-sheet.png', {
        type: sheet.mime,
      });
      return getOpenAI().images.edit({
        model: imageModel,
        image: referenceImage,
        prompt,
        quality: 'low',
        size: '1024x1024',
      });
    });
    const media = await db.media.upsert({
      where: { hash },
      create: { hash, kind: 'image', mime: 'image/png', bytes: Uint8Array.from(imageBytes(response)) },
      update: {},
      select: { id: true },
    });
    await db.page.update({ where: { id: page.id }, data: { imageId: media.id } });
  }
}
