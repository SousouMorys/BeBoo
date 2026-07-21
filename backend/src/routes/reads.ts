import { Router } from 'express';
import { db } from '../db.js';
import { readLogSchema } from '../schemas.js';
import { asyncRoute, body, notFound } from './helpers.js';

export const readsRouter = Router();

/** Child-facing callers deliberately ignore failures so reaching an ending stays calm. */
readsRouter.post(
  '/reads',
  asyncRoute(async (request, response) => {
    const input = body(readLogSchema, request);
    const [child, story] = await Promise.all([
      db.child.findUnique({ where: { id: input.childId }, select: { id: true } }),
      db.story.findUnique({ where: { id: input.storyId }, select: { id: true } }),
    ]);
    if (!child || !story) return notFound(response);

    const read = await db.readLog.create({ data: input, select: { id: true } });
    response.status(201).json({ id: read.id });
  }),
);
