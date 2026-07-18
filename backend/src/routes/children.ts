import { Router } from 'express';
import { db } from '../db.js';
import {
  childCreateSchema,
  childPatchSchema,
  idParamSchema,
  toPrismaReadingLevel,
} from '../schemas.js';
import { asyncRoute, body, notFound, params } from './helpers.js';

function clientReadingLevel(level: 'pre_reader' | 'beginner' | 'reader') {
  return level === 'pre_reader' ? 'pre-reader' : level;
}

function childDto(child: {
  id: string;
  firstName: string;
  pronoun: string;
  readingLevel: 'pre_reader' | 'beginner' | 'reader';
  interests: unknown;
  companion: string;
  settings: unknown;
}) {
  return {
    id: child.id,
    firstName: child.firstName,
    pronoun: child.pronoun,
    readingLevel: clientReadingLevel(child.readingLevel),
    interests: Array.isArray(child.interests)
      ? child.interests.filter((interest): interest is string => typeof interest === 'string')
      : [],
    companion: child.companion,
    settings: child.settings,
  };
}

export const childrenRouter = Router();

childrenRouter.get(
  '/children',
  asyncRoute(async (_request, response) => {
    const children = await db.child.findMany({ orderBy: { createdAt: 'asc' } });
    response.json({ children: children.map(childDto) });
  }),
);

childrenRouter.post(
  '/children',
  asyncRoute(async (request, response) => {
    const input = body(childCreateSchema, request);
    const data = {
      firstName: input.firstName,
      pronoun: input.pronoun,
      readingLevel: toPrismaReadingLevel(input.readingLevel),
      interests: input.interests,
      companion: input.companion,
      settings: { ...input.settings, autoplay: false },
    };
    const child = input.id
      ? await db.child.upsert({ where: { id: input.id }, create: { id: input.id, ...data }, update: data })
      : await db.child.create({ data });
    response.status(201).json({ child: childDto(child) });
  }),
);

childrenRouter.get(
  '/children/:id',
  asyncRoute(async (request, response) => {
    const { id } = params(idParamSchema, request);
    const child = await db.child.findUnique({ where: { id } });
    if (!child) return notFound(response);
    response.json({ child: childDto(child) });
  }),
);

childrenRouter.patch(
  '/children/:id',
  asyncRoute(async (request, response) => {
    const { id } = params(idParamSchema, request);
    const input = body(childPatchSchema, request);
    const exists = await db.child.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return notFound(response);

    const child = await db.child.update({
      where: { id },
      data: {
        ...(input.firstName === undefined ? {} : { firstName: input.firstName }),
        ...(input.pronoun === undefined ? {} : { pronoun: input.pronoun }),
        ...(input.readingLevel === undefined
          ? {}
          : { readingLevel: toPrismaReadingLevel(input.readingLevel) }),
        ...(input.interests === undefined ? {} : { interests: input.interests }),
        ...(input.companion === undefined ? {} : { companion: input.companion }),
        ...(input.settings === undefined ? {} : { settings: { ...input.settings, autoplay: false } }),
      },
    });
    response.json({ child: childDto(child) });
  }),
);

childrenRouter.delete(
  '/children/:id',
  asyncRoute(async (request, response) => {
    const { id } = params(idParamSchema, request);
    const deleted = await db.$transaction(async (transaction) => {
      const child = await transaction.child.findUnique({
        where: { id },
        select: {
          sheetId: true,
          stories: { select: { pages: { select: { imageId: true, audioId: true } } } },
        },
      });
      if (!child) return false;

      const mediaIds = new Set<string>();
      if (child.sheetId) mediaIds.add(child.sheetId);
      child.stories.forEach((story) =>
        story.pages.forEach((page) => {
          if (page.imageId) mediaIds.add(page.imageId);
          if (page.audioId) mediaIds.add(page.audioId);
        }),
      );

      await transaction.child.delete({ where: { id } });
      if (mediaIds.size === 0) return true;

      const ids = [...mediaIds];
      const [remainingPages, remainingChildren] = await Promise.all([
        transaction.page.findMany({
          where: { OR: [{ imageId: { in: ids } }, { audioId: { in: ids } }] },
          select: { imageId: true, audioId: true },
        }),
        transaction.child.findMany({ where: { sheetId: { in: ids } }, select: { sheetId: true } }),
      ]);
      const stillReferenced = new Set<string>();
      remainingPages.forEach((page) => {
        if (page.imageId) stillReferenced.add(page.imageId);
        if (page.audioId) stillReferenced.add(page.audioId);
      });
      remainingChildren.forEach((remainingChild) => {
        if (remainingChild.sheetId) stillReferenced.add(remainingChild.sheetId);
      });
      const removable = ids.filter((mediaId) => !stillReferenced.has(mediaId));
      if (removable.length > 0) {
        await transaction.media.deleteMany({ where: { id: { in: removable } } });
      }
      return true;
    });

    if (!deleted) return notFound(response);
    response.status(204).end();
  }),
);
