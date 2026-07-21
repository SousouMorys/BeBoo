import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Prisma } from '@prisma/client';
import 'dotenv/config';
import { db } from './db.js';

interface SeedPage {
  page: number;
  text: string;
  scene: string;
  animation: 'zoom-in' | 'zoom-out' | 'pan-lr' | 'none';
  timings: unknown;
  checkIn: unknown | null;
}

interface SeedStory {
  id: string;
  title: string;
  situationCategory: string;
  childProfile: {
    name: string;
    readingLevel: 'pre-reader' | 'beginner' | 'reader';
    interests: string[];
    companion: string;
  };
  characterBlock: string;
  pages: SeedPage[];
  bridgeQuestion: string;
}

interface SeedDocument {
  stories: SeedStory[];
}

const defaultSettings = {
  reduceAnimations: false,
  highlighting: true,
  checkIns: true,
  ambience: false,
  narrationSpeed: 1,
  autoplay: false,
};

const demoChildId = 'seed-demo-child';
const dayMs = 24 * 60 * 60 * 1_000;

function repoFile(relativePath: string): string {
  const roots = [process.cwd(), path.resolve(process.cwd(), '..')];
  const match = roots.map((root) => path.resolve(root, relativePath)).find(existsSync);
  if (!match) throw new Error(`Could not find ${relativePath}.`);
  return match;
}

function hash(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function dbReadingLevel(level: SeedStory['childProfile']['readingLevel']) {
  return level === 'pre-reader' ? 'pre_reader' : level;
}

function dbAnimation(animation: SeedPage['animation']) {
  if (animation === 'zoom-in') return 'zoom_in' as const;
  if (animation === 'zoom-out') return 'zoom_out' as const;
  if (animation === 'pan-lr') return 'pan_lr' as const;
  return 'none' as const;
}

async function seedImage(storyId: string, page: number): Promise<string> {
  const bytes = await readFile(repoFile(`frontend/public/seed/${storyId}/${page}.jpeg`));
  const media = await db.media.upsert({
    where: { hash: hash(bytes) },
    create: { kind: 'image', mime: 'image/jpeg', bytes, hash: hash(bytes) },
    update: {},
    select: { id: true },
  });
  return media.id;
}

async function seedStory(story: SeedStory): Promise<void> {
  const childId = `seed-child-${story.id}`;
  await db.child.upsert({
    where: { id: childId },
    create: {
      id: childId,
      firstName: story.childProfile.name,
      pronoun: 'they/them',
      readingLevel: dbReadingLevel(story.childProfile.readingLevel),
      interests: story.childProfile.interests,
      companion: story.childProfile.companion,
      settings: defaultSettings,
    },
    update: {
      firstName: story.childProfile.name,
      readingLevel: dbReadingLevel(story.childProfile.readingLevel),
      interests: story.childProfile.interests,
      companion: story.childProfile.companion,
    },
  });

  await db.story.upsert({
    where: { id: story.id },
    create: {
      id: story.id,
      childId,
      title: story.title,
      situationCategory: story.situationCategory,
      situationText: story.title,
      characterBlock: story.characterBlock,
      bridgeQuestion: story.bridgeQuestion,
      length: story.pages.length,
      checkIns: story.pages.some((page) => page.checkIn !== null),
      status: 'ready',
    },
    update: {
      childId,
      title: story.title,
      situationCategory: story.situationCategory,
      situationText: story.title,
      characterBlock: story.characterBlock,
      bridgeQuestion: story.bridgeQuestion,
      length: story.pages.length,
      checkIns: story.pages.some((page) => page.checkIn !== null),
      status: 'ready',
    },
  });

  const indices = story.pages.map((page) => page.page);
  await db.page.deleteMany({ where: { storyId: story.id, index: { notIn: indices } } });
  for (const page of story.pages) {
    const imageId = await seedImage(story.id, page.page);
    await db.page.upsert({
      where: { storyId_index: { storyId: story.id, index: page.page } },
      create: {
        storyId: story.id,
        index: page.page,
        text: page.text,
        scene: page.scene,
        animation: dbAnimation(page.animation),
        imageId,
        timings: Array.isArray(page.timings) ? (page.timings as Prisma.InputJsonValue) : [],
        checkIn: page.checkIn === null ? Prisma.JsonNull : (page.checkIn as Prisma.InputJsonValue),
      },
      update: {
        text: page.text,
        scene: page.scene,
        animation: dbAnimation(page.animation),
        imageId,
        audioId: null,
        timings: Array.isArray(page.timings) ? (page.timings as Prisma.InputJsonValue) : [],
        checkIn: page.checkIn === null ? Prisma.JsonNull : (page.checkIn as Prisma.InputJsonValue),
      },
    });
  }
}

function recentDate(now: number, daysAgo: number, minuteOffset = 0): Date {
  return new Date(now - daysAgo * dayMs - minuteOffset * 60_000);
}

/** Gives the demo parent dashboard a calm, repeatable story of real-looking use. */
async function seedDemoHistory(stories: SeedStory[]): Promise<void> {
  const storyIds = new Set(stories.map((story) => story.id));
  const requiredStoryIds = [
    'story-dentist-sami',
    'story-firedrill-maya',
    'story-planchange-adam',
  ];
  if (requiredStoryIds.some((storyId) => !storyIds.has(storyId))) {
    throw new Error('Seed dashboard history needs all three bundled seed stories.');
  }

  await db.child.upsert({
    where: { id: demoChildId },
    create: {
      id: demoChildId,
      firstName: 'Sami',
      pronoun: 'they/them',
      readingLevel: 'beginner',
      interests: ['trains'],
      companion: 'a small red-and-teal toy train',
      settings: defaultSettings,
    },
    update: {
      firstName: 'Sami',
      pronoun: 'they/them',
      readingLevel: 'beginner',
      interests: ['trains'],
      companion: 'a small red-and-teal toy train',
      settings: defaultSettings,
    },
  });

  await db.$transaction([
    db.checkInResult.deleteMany({ where: { childId: demoChildId } }),
    db.readLog.deleteMany({ where: { childId: demoChildId } }),
    db.feelingLog.deleteMany({ where: { childId: demoChildId } }),
  ]);

  const now = Date.now();
  await db.checkInResult.createMany({
    data: [
      // Happy and calm are well established on first attempts.
      ...Array.from({ length: 4 }, (_, index) => ({
        storyId: 'story-planchange-adam',
        page: 4,
        childId: demoChildId,
        emotionId: 'happy',
        correctEmotionId: 'happy',
        correct: true,
        attempt: 1,
        createdAt: recentDate(now, index, 10),
      })),
      ...Array.from({ length: 3 }, (_, index) => ({
        storyId: 'story-firedrill-maya',
        page: 4,
        childId: demoChildId,
        emotionId: 'calm',
        correctEmotionId: 'calm',
        correct: true,
        attempt: 1,
        createdAt: recentDate(now, index + 1, 20),
      })),
      // Two matched misses create the one surfaced nervous/scared pair.
      {
        storyId: 'story-dentist-sami',
        page: 3,
        childId: demoChildId,
        emotionId: 'scared',
        correctEmotionId: 'nervous',
        correct: false,
        attempt: 1,
        createdAt: recentDate(now, 2, 30),
      },
      {
        storyId: 'story-dentist-sami',
        page: 3,
        childId: demoChildId,
        emotionId: 'nervous',
        correctEmotionId: 'nervous',
        correct: true,
        attempt: 1,
        createdAt: recentDate(now, 3, 40),
      },
      {
        storyId: 'story-dentist-sami',
        page: 3,
        childId: demoChildId,
        emotionId: 'scared',
        correctEmotionId: 'nervous',
        correct: false,
        attempt: 1,
        createdAt: recentDate(now, 4, 50),
      },
    ],
  });

  await db.readLog.createMany({
    data: [
      { childId: demoChildId, storyId: 'story-dentist-sami', createdAt: recentDate(now, 0, 5) },
      { childId: demoChildId, storyId: 'story-firedrill-maya', createdAt: recentDate(now, 1, 5) },
      { childId: demoChildId, storyId: 'story-planchange-adam', createdAt: recentDate(now, 2, 5) },
      { childId: demoChildId, storyId: 'story-dentist-sami', createdAt: recentDate(now, 4, 5) },
      { childId: demoChildId, storyId: 'story-firedrill-maya', createdAt: recentDate(now, 6, 5) },
    ],
  });

  await db.feelingLog.createMany({
    data: [
      { childId: demoChildId, emotionId: 'happy', createdAt: recentDate(now, 0, 1) },
      { childId: demoChildId, emotionId: 'calm', createdAt: recentDate(now, 1, 1) },
      { childId: demoChildId, emotionId: 'nervous', createdAt: recentDate(now, 2, 1) },
      { childId: demoChildId, emotionId: 'nervous', createdAt: recentDate(now, 4, 1) },
      { childId: demoChildId, emotionId: 'proud', createdAt: recentDate(now, 5, 1) },
      { childId: demoChildId, emotionId: 'sad', createdAt: recentDate(now, 6, 1) },
    ],
  });
}

async function main(): Promise<void> {
  const raw = await readFile(repoFile('data/beboo-seed-stories.json'), 'utf8');
  const document = JSON.parse(raw) as SeedDocument;
  for (const story of document.stories) {
    await seedStory(story);
  }
  await seedDemoHistory(document.stories);
  console.log(`Seeded ${document.stories.length} stories, their page art, and demo dashboard history.`);
}

main()
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
