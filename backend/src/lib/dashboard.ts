import { emotionIds, type EmotionId } from '../schemas.js';

const canonicalEmotions = new Set<string>(emotionIds);

export interface DashboardCheckInResult {
  emotionId: string;
  correctEmotionId: string | null;
  correct: boolean;
  attempt: number;
}

export interface EmotionAccuracy {
  emotionId: EmotionId;
  correct: number;
  total: number;
}

export interface ConfusionPair {
  emotionIds: [EmotionId, EmotionId];
  count: number;
}

function isEmotionId(value: string | null): value is EmotionId {
  return value !== null && canonicalEmotions.has(value);
}

function pairKey(first: EmotionId, second: EmotionId): string {
  return [first, second].sort().join('\u0000');
}

function pairFromKey(key: string): [EmotionId, EmotionId] {
  const [first, second] = key.split('\u0000') as [EmotionId, EmotionId];
  return [first, second];
}

/** First answers are the useful signal: later attempts are learning, not accuracy. */
export function firstAttemptAccuracy(results: DashboardCheckInResult[]): EmotionAccuracy[] {
  const totals = new Map<EmotionId, { correct: number; total: number }>();

  for (const result of results) {
    if (result.attempt !== 1 || !isEmotionId(result.correctEmotionId)) continue;
    const current = totals.get(result.correctEmotionId) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (result.correct) current.correct += 1;
    totals.set(result.correctEmotionId, current);
  }

  return emotionIds.flatMap((emotionId) => {
    const value = totals.get(emotionId);
    return value ? [{ emotionId, ...value }] : [];
  });
}

/** Misses are symmetric: nervous -> scared and scared -> nervous are one pair. */
export function detectedConfusionPairs(results: DashboardCheckInResult[]): ConfusionPair[] {
  const counts = new Map<string, number>();

  for (const result of results) {
    if (result.correct || !isEmotionId(result.emotionId) || !isEmotionId(result.correctEmotionId)) {
      continue;
    }
    if (result.emotionId === result.correctEmotionId) continue;

    const key = pairKey(result.emotionId, result.correctEmotionId);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([key, count]) => ({ emotionIds: pairFromKey(key), count }))
    .sort((left, right) => right.count - left.count || left.emotionIds.join().localeCompare(right.emotionIds.join()))
    .slice(0, 2);
}

export function readSummary(storyIds: string[]): { distinctStories: number; total: number } {
  return { distinctStories: new Set(storyIds).size, total: storyIds.length };
}
