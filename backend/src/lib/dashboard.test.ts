import { describe, expect, it } from 'vitest';
import {
  detectedConfusionPairs,
  firstAttemptAccuracy,
  readSummary,
  type DashboardCheckInResult,
} from './dashboard.js';

function result(overrides: Partial<DashboardCheckInResult>): DashboardCheckInResult {
  return {
    emotionId: 'happy',
    correctEmotionId: 'happy',
    correct: true,
    attempt: 1,
    ...overrides,
  };
}

describe('firstAttemptAccuracy', () => {
  it('groups first attempts by the check-in correct emotion only', () => {
    const accuracy = firstAttemptAccuracy([
      result({ emotionId: 'happy', correctEmotionId: 'happy', correct: true }),
      result({ emotionId: 'sad', correctEmotionId: 'happy', correct: false, attempt: 2 }),
      result({ emotionId: 'scared', correctEmotionId: 'nervous', correct: false }),
      result({ emotionId: 'nervous', correctEmotionId: 'nervous', correct: true }),
      result({ emotionId: 'happy', correctEmotionId: 'frustrated', correct: false }),
    ]);

    expect(accuracy).toEqual([
      { emotionId: 'happy', correct: 1, total: 1 },
      { emotionId: 'nervous', correct: 1, total: 2 },
    ]);
  });
});

describe('detectedConfusionPairs', () => {
  it('requires two unordered misses before surfacing a pair', () => {
    const firstMiss = result({
      emotionId: 'scared',
      correctEmotionId: 'nervous',
      correct: false,
    });
    expect(detectedConfusionPairs([firstMiss])).toEqual([]);

    expect(
      detectedConfusionPairs([
        firstMiss,
        result({ emotionId: 'nervous', correctEmotionId: 'scared', correct: false }),
      ]),
    ).toEqual([{ emotionIds: ['nervous', 'scared'], count: 2 }]);
  });

  it('keeps only the two most frequent canonical pairs', () => {
    const nervousScared = result({
      emotionId: 'nervous',
      correctEmotionId: 'scared',
      correct: false,
    });
    const angrySad = result({ emotionId: 'angry', correctEmotionId: 'sad', correct: false });
    const happyProud = result({ emotionId: 'happy', correctEmotionId: 'proud', correct: false });

    const pairs = detectedConfusionPairs([
      nervousScared,
      nervousScared,
      nervousScared,
      angrySad,
      angrySad,
      happyProud,
      happyProud,
      result({ emotionId: 'happy', correctEmotionId: 'frustrated', correct: false }),
    ]);

    expect(pairs).toEqual([
      { emotionIds: ['nervous', 'scared'], count: 3 },
      { emotionIds: ['angry', 'sad'], count: 2 },
    ]);
  });
});

describe('readSummary', () => {
  it('keeps rereads in the total while counting distinct stories once', () => {
    expect(readSummary(['story-a', 'story-b', 'story-a'])).toEqual({
      distinctStories: 2,
      total: 3,
    });
  });
});
