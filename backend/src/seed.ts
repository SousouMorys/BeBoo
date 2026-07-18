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

async function main(): Promise<void> {
  const raw = await readFile(repoFile('data/beboo-seed-stories.json'), 'utf8');
  const document = JSON.parse(raw) as SeedDocument;
  for (const story of document.stories) {
    await seedStory(story);
  }
  console.log(`Seeded ${document.stories.length} stories and their page art.`);
}

main()
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
