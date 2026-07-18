import { Router } from 'express';
import { db } from '../db.js';
import { feelingLogSchema } from '../schemas.js';
import { asyncRoute, body, notFound } from './helpers.js';

export const practiceRouter = Router();

practiceRouter.post(
  '/practice/feelings',
  asyncRoute(async (request, response) => {
    const input = body(feelingLogSchema, request);
    const child = await db.child.findUnique({
      where: { id: input.childId },
      select: { id: true },
    });
    if (!child) return notFound(response);

    const feeling = await db.feelingLog.create({
      data: input,
      select: { id: true },
    });
    response.status(201).json({ id: feeling.id });
  }),
);
