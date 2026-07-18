import { Router } from 'express';
import { db } from '../db.js';
import { runStoryPipeline } from '../lib/pipeline.js';
import { toStoryDto } from '../lib/storyDto.js';
import {
  generateStoryRequestSchema,
  idParamSchema,
  storyListQuerySchema,
} from '../schemas.js';
import { asyncRoute, body, notFound, params, query } from './helpers.js';

const mockChildSettings = {
  reduceAnimations: false,
  highlighting: true,
  checkIns: true,
  ambience: false,
  narrationSpeed: 1,
  autoplay: false,
};

async function generationChild(
  childId: string,
  profile?: {
    firstName: string;
    pronoun: string;
    readingLevel: 'pre-reader' | 'beginner' | 'reader';
    interests: string[];
    companion: string;
    settings: {
      reduceAnimations: boolean;
      highlighting: boolean;
      checkIns: boolean;
      ambience: boolean;
      narrationSpeed: 0.8 | 1;
      autoplay?: false;
    };
  },
) {
  const existing = await db.child.findUnique({ where: { id: childId } });
  if (existing) return existing;
  if (!childId.startsWith('child-')) return null;

  // Phase 2 bridge: the browser profile remains local until profile persistence moves server-side.
  const details = profile ?? {
    firstName: 'Sami',
    pronoun: 'they/them',
    readingLevel: 'beginner' as const,
    interests: [],
    companion: 'BeBoo',
    settings: mockChildSettings,
  };
  return db.child.upsert({
    where: { id: childId },
    create: {
      id: childId,
      firstName: details.firstName,
      pronoun: details.pronoun,
      readingLevel: details.readingLevel === 'pre-reader' ? 'pre_reader' : details.readingLevel,
      interests: details.interests,
      companion: details.companion,
      settings: { ...details.settings, autoplay: false },
    },
    update: {},
  });
}

export const storiesRouter = Router();

storiesRouter.post(
  '/stories/generate',
  asyncRoute(async (request, response) => {
    const input = body(generateStoryRequestSchema, request);
    const child = await generationChild(input.childId, input.childProfile);
    if (!child) {
      response.status(404).json({ error: 'Child not found.' });
      return;
    }

    const story = await db.story.create({
      data: {
        childId: child.id,
        title: 'Your new story',
        situationCategory: input.situation.category,
        situationText: input.situation.text,
        characterBlock: '',
        bridgeQuestion: '',
        length: input.length,
        checkIns: input.checkIns,
        status: 'writing',
      },
      select: { id: true },
    });

    response.status(202).json({ storyId: story.id });

    // Keep generation asynchronous: P3 can begin polling as soon as it has an id.
    // runStoryPipeline catches and records its own failures without exposing model details.
    queueMicrotask(() => {
      void runStoryPipeline(story.id);
    });
  }),
);

storiesRouter.get(
  '/stories',
  asyncRoute(async (request, response) => {
    const { childId } = query(storyListQuerySchema, request);
    const stories = await db.story.findMany({
      where: { childId, status: 'ready' },
      include: { child: true, pages: { orderBy: { index: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    response.json({ stories: stories.map(toStoryDto) });
  }),
);

storiesRouter.get(
  '/stories/:id/status',
  asyncRoute(async (request, response) => {
    const { id } = params(idParamSchema, request);
    const story = await db.story.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!story) return notFound(response);
    response.json({ storyId: story.id, status: story.status, step: story.status });
  }),
);

storiesRouter.get(
  '/stories/:id',
  asyncRoute(async (request, response) => {
    const { id } = params(idParamSchema, request);
    const story = await db.story.findUnique({
      where: { id },
      include: { child: true, pages: { orderBy: { index: 'asc' } } },
    });
    if (!story) return notFound(response);
    response.json({ story: toStoryDto(story) });
  }),
);
