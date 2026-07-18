import { z } from 'zod';

export const emotionIds = [
  'happy',
  'sad',
  'angry',
  'scared',
  'calm',
  'nervous',
  'proud',
  'disappointed',
] as const;

export const emotionIdSchema = z.enum(emotionIds);
export const readingLevelSchema = z.enum(['pre-reader', 'beginner', 'reader']);
export const animationSchema = z.enum(['zoom-in', 'zoom-out', 'pan-lr', 'none']);
export const storyStatusSchema = z.enum(['writing', 'drawing', 'voicing', 'ready', 'failed']);
export const recordIdSchema = z.string().trim().min(1).max(128);
export const idParamSchema = z.object({ id: recordIdSchema });

export const childSettingsSchema = z.object({
  reduceAnimations: z.boolean(),
  highlighting: z.boolean(),
  checkIns: z.boolean(),
  ambience: z.boolean(),
  narrationSpeed: z.union([z.literal(0.8), z.literal(1)]),
  autoplay: z.literal(false).optional(),
});

export const childInputSchema = z.object({
  firstName: z.string().trim().min(1).max(30),
  pronoun: z.enum(['they/them', 'she/her', 'he/him']),
  readingLevel: readingLevelSchema,
  interests: z.array(z.string().trim().min(1).max(60)).max(3),
  companion: z.string().trim().min(1).max(160),
  settings: childSettingsSchema,
});

/** Allows the local-profile bridge to preserve its opaque child id server-side. */
export const childCreateSchema = childInputSchema.extend({
  id: recordIdSchema.optional(),
});

export const childPatchSchema = childInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Provide at least one child field to update.',
);

export const pinVerifySchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must contain exactly four digits.'),
});

export const situationSchema = z.object({
  category: z.enum(['health', 'school', 'daily-life', 'social', 'custom']),
  text: z.string().trim().min(1).max(500),
});

export const generationChildProfileSchema = childInputSchema.pick({
  firstName: true,
  pronoun: true,
  readingLevel: true,
  interests: true,
  companion: true,
  settings: true,
});

export const generateStoryRequestSchema = z.object({
  childId: recordIdSchema,
  childProfile: generationChildProfileSchema.optional(),
  situation: situationSchema,
  length: z.number().int().min(3).max(6),
  checkIns: z.boolean(),
});

export const storyListQuerySchema = z.object({ childId: recordIdSchema });
export const storyStatusResponseSchema = z.object({ step: storyStatusSchema });

export const checkInOptionSchema = z.object({
  id: emotionIdSchema,
  label: emotionIdSchema,
});

export const checkInSchema = z
  .object({
    question: z.string().trim().min(1).max(160),
    options: z.array(checkInOptionSchema).length(3),
    correctId: emotionIdSchema,
    scaffold: z.string().trim().min(1).max(300),
    reveal: z.string().trim().min(1).max(300),
  })
  .superRefine((checkIn, context) => {
    const ids = checkIn.options.map((option) => option.id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Check-in options must be unique.' });
    }
    if (!ids.includes(checkIn.correctId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'correctId must be an option.' });
    }
  });

export const generatedPageSchema = z.object({
  page: z.number().int().positive(),
  text: z.string().trim().min(1).max(1_200),
  scene: z.string().trim().min(1).max(600),
  animation: animationSchema,
  checkIn: checkInSchema.nullable(),
});

export const generatedStorySchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    characterBlock: z.string().trim().min(1).max(1_000),
    pages: z.array(generatedPageSchema).min(3).max(6),
    bridgeQuestion: z.string().trim().min(1).max(300),
  })
  .superRefine((story, context) => {
    const pageNumbers = story.pages.map((page) => page.page);
    if (new Set(pageNumbers).size !== pageNumbers.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Page numbers must be unique.' });
    }
  });

export const checkInAttemptSchema = z.object({
  storyId: recordIdSchema,
  page: z.number().int().positive(),
  childId: recordIdSchema,
  emotionId: emotionIdSchema,
  correct: z.boolean(),
  attempt: z.union([z.literal(1), z.literal(2)]),
});

export const feelingLogSchema = z.object({
  childId: recordIdSchema,
  emotionId: emotionIdSchema,
});

export type EmotionId = z.infer<typeof emotionIdSchema>;
export type ReadingLevel = z.infer<typeof readingLevelSchema>;
export type StoryGenerationRequest = z.infer<typeof generateStoryRequestSchema>;
export type GeneratedStory = z.infer<typeof generatedStorySchema>;
export type GeneratedPage = z.infer<typeof generatedPageSchema>;

export function toPrismaReadingLevel(level: ReadingLevel): 'pre_reader' | 'beginner' | 'reader' {
  return level === 'pre-reader' ? 'pre_reader' : level;
}
