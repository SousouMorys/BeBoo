import { Router } from 'express';
import { db } from '../db.js';
import { detectedConfusionPairs, firstAttemptAccuracy, readSummary } from '../lib/dashboard.js';
import { emotionIds, idParamSchema } from '../schemas.js';
import { asyncRoute, notFound, params } from './helpers.js';

export const dashboardRouter = Router();

function sevenDaysAgo(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date;
}

dashboardRouter.get(
  '/dashboard/:id',
  asyncRoute(async (request, response) => {
    const { id } = params(idParamSchema, request);
    const child = await db.child.findUnique({
      where: { id },
      select: {
        results: {
          select: { emotionId: true, correctEmotionId: true, correct: true, attempt: true },
        },
        readLogs: { select: { storyId: true } },
      },
    });
    if (!child) return notFound(response);

    const feelingCounts = await db.feelingLog.groupBy({
      by: ['emotionId'],
      where: { childId: id, createdAt: { gte: sevenDaysAgo() } },
      _count: { _all: true },
    });
    const countsByEmotion = new Map(
      feelingCounts.map((feeling) => [feeling.emotionId, feeling._count._all]),
    );

    response.json({
      accuracy: firstAttemptAccuracy(child.results),
      confusionPairs: detectedConfusionPairs(child.results),
      reads: readSummary(child.readLogs.map((read) => read.storyId)),
      feelings: {
        last7Days: emotionIds.flatMap((emotionId) => {
          const count = countsByEmotion.get(emotionId);
          return count === undefined ? [] : [{ emotionId, count }];
        }),
      },
    });
  }),
);
