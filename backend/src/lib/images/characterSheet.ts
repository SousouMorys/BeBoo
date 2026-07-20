import { createHash } from 'node:crypto';
import { generationConfig } from '../../config.js';
import { db } from '../../db.js';
import { getOpenAI } from '../../openai.js';
import { withModelRetry } from '../modelRetry.js';
import { styleBlock } from './style.js';

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

/** Creates a calm, reusable visual reference only when this child lacks one. */
export async function ensureCharacterSheet(childId: string, characterBlock: string): Promise<string> {
  const child = await db.child.findUnique({
    where: { id: childId },
    select: { id: true, sheetId: true },
  });
  if (!child) {
    throw new Error(`Cannot create a character sheet for missing child ${childId}.`);
  }

  const prompt = [
    styleBlock,
    characterBlock,
    'Create one character reference image: front view, neutral relaxed pose, plain warm cream background. Keep every recurring character visible, with calm readable faces. No text, letters, numbers, or logos.',
  ].join('\n\n');
  const hash = contentHash(
    `character-sheet\n${styleBlock}\n${characterBlock}\n${imageModel}\n${imageQuality}`,
  );

  if (child.sheetId) {
    const existing = await db.media.findUnique({
      where: { id: child.sheetId },
      select: { id: true, hash: true },
    });
    if (existing?.hash === hash) {
      return existing.id;
    }
  }

  const cached = await db.media.findUnique({ where: { hash }, select: { id: true } });

  if (cached) {
    await db.child.update({ where: { id: childId }, data: { sheetId: cached.id } });
    return cached.id;
  }

  const response = await withModelRetry('character-sheet image', () =>
    getOpenAI().images.generate({
      model: imageModel,
      prompt,
      quality: imageQuality,
      size: '1024x1024',
    }),
  );
  const media = await db.media.upsert({
    where: { hash },
    create: { hash, kind: 'image', mime: 'image/png', bytes: Uint8Array.from(imageBytes(response)) },
    update: {},
    select: { id: true },
  });

  await db.child.update({ where: { id: childId }, data: { sheetId: media.id } });
  return media.id;
}
