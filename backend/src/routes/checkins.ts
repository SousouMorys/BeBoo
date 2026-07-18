import { Router } from 'express';
import { db } from '../db.js';
import { checkInAttemptSchema } from '../schemas.js';
import { asyncRoute, body } from './helpers.js';

export const checkInsRouter = Router();

checkInsRouter.post(
  '/checkins',
  asyncRoute(async (request, response) => {
    const input = body(checkInAttemptSchema, request);
    const story = await db.story.findUnique({
      where: { id: input.storyId },
      select: { childId: true, pages: { where: { index: input.page }, select: { id: true } } },
    });
    if (!story || story.childId !== input.childId || story.pages.length === 0) {
      response.status(400).json({ error: 'That check-in could not be saved.' });
      return;
    }

    const result = await db.checkInResult.create({ data: input });
    response.status(201).json({ checkIn: result });
  }),
);
