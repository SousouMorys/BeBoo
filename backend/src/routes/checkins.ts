import { Router } from 'express';
import { db } from '../db.js';
import { checkInAttemptSchema, checkInSchema } from '../schemas.js';
import { asyncRoute, body } from './helpers.js';

export const checkInsRouter = Router();

checkInsRouter.post(
  '/checkins',
  asyncRoute(async (request, response) => {
    const input = body(checkInAttemptSchema, request);
    const story = await db.story.findUnique({
      where: { id: input.storyId },
      select: {
        childId: true,
        pages: { where: { index: input.page }, select: { checkIn: true } },
      },
    });
    if (!story || story.childId !== input.childId || story.pages.length === 0) {
      response.status(400).json({ error: 'That check-in could not be saved.' });
      return;
    }

    const pageCheckIn = checkInSchema.safeParse(story.pages[0].checkIn);
    const selectedEmotionIsAnOption = pageCheckIn.success
      && pageCheckIn.data.options.some((option) => option.id === input.emotionId);
    if (
      !pageCheckIn.success
      || pageCheckIn.data.correctId !== input.correctEmotionId
      || !selectedEmotionIsAnOption
    ) {
      response.status(400).json({ error: 'That check-in could not be saved.' });
      return;
    }

    const result = await db.checkInResult.create({ data: input });
    response.status(201).json({ checkIn: result });
  }),
);
