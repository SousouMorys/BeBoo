import { Prisma } from '@prisma/client';
import { db } from '../db.js';
import { errorMessage } from './modelRetry.js';
import { drawStoryPages } from './images/pages.js';
import { generateStory } from './story/generate.js';

type PipelineStage = 'writing' | 'drawing' | 'voicing';
const activePipelineStatuses: PipelineStage[] = ['writing', 'drawing', 'voicing'];

function clientReadingLevel(value: 'pre_reader' | 'beginner' | 'reader') {
  return value === 'pre_reader' ? 'pre-reader' : value;
}

function dbAnimation(value: 'zoom-in' | 'zoom-out' | 'pan-lr' | 'none') {
  if (value === 'zoom-in') return 'zoom_in' as const;
  if (value === 'zoom-out') return 'zoom_out' as const;
  if (value === 'pan-lr') return 'pan_lr' as const;
  return 'none' as const;
}

function interests(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

async function writeStory(storyId: string): Promise<void> {
  const story = await db.story.findUnique({ where: { id: storyId }, include: { child: true } });
  if (!story) throw new Error(`Story ${storyId} no longer exists.`);

  const generated = await generateStory({
    firstName: story.child.firstName,
    pronoun: story.child.pronoun,
    readingLevel: clientReadingLevel(story.child.readingLevel),
    interests: interests(story.child.interests),
    companion: story.child.companion,
    situationCategory: story.situationCategory,
    situationText: story.situationText,
    length: story.length,
    checkIns: story.checkIns,
    targetEmotions: ['nervous', 'calm'],
  });

  await db.$transaction(async (transaction) => {
    await transaction.story.update({
      where: { id: storyId },
      data: {
        title: generated.title,
        characterBlock: generated.characterBlock,
        bridgeQuestion: generated.bridgeQuestion,
      },
    });
    await transaction.page.deleteMany({ where: { storyId } });
    for (const page of generated.pages) {
      await transaction.page.create({
        data: {
          storyId,
          index: page.page,
          text: page.text,
          scene: page.scene,
          animation: dbAnimation(page.animation),
          timings: [] as Prisma.InputJsonValue,
          checkIn: page.checkIn
            ? (page.checkIn as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });
    }
  });
}

/** Audio arrives in the next phase; keeping this explicit preserves the pipeline contract. */
async function voiceStory(): Promise<void> {
  await Promise.resolve();
}

async function setStatus(storyId: string, status: 'writing' | 'drawing' | 'voicing' | 'ready'): Promise<void> {
  await db.story.update({ where: { id: storyId }, data: { status } });
}

/**
 * Generation runs in-process today. On a process restart, no worker remains to
 * advance an in-flight story, so expose the designed retry screen instead of
 * leaving it on "writing" forever.
 */
export async function failInterruptedStoryPipelines(): Promise<void> {
  const { count } = await db.story.updateMany({
    where: { status: { in: activePipelineStatuses } },
    data: { status: 'failed' },
  });

  if (count > 0) {
    console.warn(`[pipeline] marked ${count} interrupted generation${count === 1 ? '' : 's'} as failed`);
  }
}

/** Runs in-process after the HTTP response, with failure reasons held server-side only. */
export async function runStoryPipeline(storyId: string): Promise<void> {
  let stage: PipelineStage = 'writing';

  try {
    await setStatus(storyId, 'writing');
    await writeStory(storyId);

    stage = 'drawing';
    await setStatus(storyId, stage);
    await drawStoryPages(storyId);

    stage = 'voicing';
    await setStatus(storyId, stage);
    await voiceStory();

    await setStatus(storyId, 'ready');
  } catch (error) {
    console.error(`[pipeline] story=${storyId} stage=${stage} failed: ${errorMessage(error)}`);
    try {
      await db.story.update({ where: { id: storyId }, data: { status: 'failed' } });
    } catch (updateError) {
      console.error(`[pipeline] story=${storyId} could not record failure: ${errorMessage(updateError)}`);
    }
  }
}
