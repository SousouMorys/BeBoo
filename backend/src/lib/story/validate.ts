import { getOpenAI } from '../../openai.js';
import { generationConfig } from '../../config.js';
import { z } from 'zod';
import { withModelRetry } from '../modelRetry.js';
import {
  emotionIds,
  generatedStorySchema,
  type EmotionId,
  type GeneratedStory,
  type ReadingLevel,
} from '../../schemas.js';

export const maxValidationRetries = 2;

export interface StoryValidationInput {
  length: number;
  readingLevel: ReadingLevel;
  checkIns: boolean;
  targetEmotions?: readonly EmotionId[];
}

export interface StoryValidationResult {
  valid: boolean;
  reasons: string[];
}

interface StoryValidatorClient {
  responses: {
    create(request: unknown): Promise<{ output_text: string }>;
  };
}

const sentenceLimits: Record<ReadingLevel, readonly [number, number]> = {
  'pre-reader': [1, 2],
  beginner: [2, 3],
  reader: [3, 4],
};
const bannedTerms = [
  'quiz',
  'test',
  'question round',
  'wrong',
  'incorrect',
  'no',
  'oops',
  'you win',
  'score',
  'points',
  'error',
  'empty',
  'nothing here',
  'replay level',
  'retry',
];
const sceneStyleTerms = ['style', 'illustration', 'render', 'lighting', 'pastel', '3d', 'vector', 'watercolor'];

function sentences(text: string): string[] {
  return text
    .replace(/(?:\.\.\.|\u2026)/g, '.')
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function wordCount(text: string): number {
  return text.match(/[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

function includesWord(text: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`, 'i').test(text);
}

/** Image metadata is not child-facing copy, so do not apply the brand lexicon to it. */
function childFacingCopy(story: GeneratedStory): string {
  return [
    story.title,
    story.bridgeQuestion,
    ...story.pages.flatMap((page) => [
      page.text,
      ...(page.checkIn
        ? [
            page.checkIn.question,
            ...page.checkIn.options.map((option) => option.label),
            page.checkIn.scaffold,
            page.checkIn.reveal,
          ]
        : []),
    ]),
  ].join('\n');
}

function validatePageBudgets(story: GeneratedStory, input: StoryValidationInput): string[] {
  const reasons: string[] = [];
  const [minimum, maximum] = sentenceLimits[input.readingLevel];

  for (const page of story.pages) {
    const pageSentences = sentences(page.text);
    if (pageSentences.length < minimum || pageSentences.length > maximum) {
      reasons.push(`Page ${page.page} must have ${minimum}-${maximum} sentences.`);
    }
    pageSentences.forEach((sentence, index) => {
      if (wordCount(sentence) > 10) {
        reasons.push(`Page ${page.page} sentence ${index + 1} exceeds 10 words.`);
      }
    });
    if ((page.text.match(/!/g) ?? []).length > 1) {
      reasons.push(`Page ${page.page} has more than one exclamation mark.`);
    }
  }

  return reasons;
}

function validateLexicon(story: GeneratedStory): string[] {
  const allCopy = childFacingCopy(story).toLowerCase();
  const reasons = bannedTerms
    .filter((term) => includesWord(allCopy, term))
    .map((term) => `Banned term found: "${term}".`);

  if (/\b[A-Z]{2,}\b/.test(allCopy)) reasons.push('Story includes all-caps child-facing copy.');
  return reasons;
}

function validateScenesAndCheckIns(story: GeneratedStory, input: StoryValidationInput): string[] {
  const reasons: string[] = [];

  story.pages.forEach((page) => {
    if (wordCount(page.scene) > 60) reasons.push(`Page ${page.page} scene exceeds 60 words.`);
    if (sceneStyleTerms.some((term) => includesWord(page.scene, term))) {
      reasons.push(`Page ${page.page} scene contains a style instruction.`);
    }
    if (!input.checkIns && page.checkIn) reasons.push(`Page ${page.page} has a check-in when disabled.`);
    if (!page.checkIn) return;

    const checkIn = page.checkIn;
    if (wordCount(checkIn.question) > 8) reasons.push(`Page ${page.page} check-in question exceeds 8 words.`);
    if (!checkIn.options.some((option) => option.id === checkIn.correctId)) {
      reasons.push(`Page ${page.page} correctId is not an option.`);
    }
    if (!emotionIds.includes(checkIn.correctId)) reasons.push(`Page ${page.page} uses an unknown emotion.`);
    if (!includesWord(page.text, checkIn.correctId)) {
      reasons.push(`Page ${page.page} check-in emotion is not named in its text.`);
    }
    if (!includesWord(checkIn.reveal, checkIn.correctId)) {
      reasons.push(`Page ${page.page} reveal does not name the correct emotion.`);
    }
  });

  return reasons;
}

/** Deterministic gates make malformed stories fail before a model review. */
export function validateStoryLocally(candidate: unknown, input: StoryValidationInput): StoryValidationResult {
  const parsed = generatedStorySchema.safeParse(candidate);
  if (!parsed.success) {
    return { valid: false, reasons: parsed.error.issues.map((issue) => issue.message) };
  }

  const story = parsed.data;
  const expectedPages = Array.from({ length: input.length }, (_, index) => index + 1);
  const actualPages = [...story.pages].map((page) => page.page).sort((first, second) => first - second);
  const reasons = [
    ...(story.pages.length === input.length ? [] : [`Expected ${input.length} pages.`]),
    ...(actualPages.every((page, index) => page === expectedPages[index])
      ? []
      : [`Pages must be numbered ${expectedPages.join(', ')}.`]),
    ...validatePageBudgets(story, input),
    ...validateLexicon(story),
    ...validateScenesAndCheckIns(story, input),
  ];
  return { valid: reasons.length === 0, reasons };
}

const modelResultSchema = z.object({
  valid: z.boolean(),
  reasons: z.array(z.string()),
});

function modelReviewPrompt(story: GeneratedStory, input: StoryValidationInput): string {
  const targetEmotions = input.targetEmotions?.join(', ') || 'the emotions central to this story';

  return `You are a precise, conservative reviewer for a calm social story for a child.

A deterministic validator has already confirmed the JSON shape, exactly ${input.length} pages, sentence and word budgets for the ${input.readingLevel} level, child-facing lexicon, option uniqueness, and check-in IDs. Review only the qualitative checklist below. Mark invalid only for a clear, specific violation. Do not invent extra requirements or reject ordinary literal language.

Checklist:
1. The prose is warm, concrete, literal, present tense, and has no idiom, metaphor, sarcasm, or wordplay.
2. The arc is clear: situation, helpful choices using “can,” then a calm positive ending with reassurance or pride.
3. Each named central feeling has a visible body cue in the page text or scene.
4. The requested target emotions are ${targetEmotions}. For a check-in, only correctId is the featured emotion; its other options are distractors and need no body cue or text mention. Each check-in matches its page emotion; its scaffold and reveal point to a cue visibly present in that scene.
5. Nothing is frightening, shaming, coercive, or framed as a negative surprise.
6. Each scene stays eye-level, concrete, and has one focal point with no text, letters, numbers, or logos.

Scenes and characterBlock are internal illustration metadata, not child-facing prose. A scene may say “no text” when protecting image generation; that is not a lexicon violation. Return valid=true with an empty reasons array when this story clearly meets the checklist. If invalid, give concise, actionable reasons only.

Story to review:
${JSON.stringify(story)}`;
}

/** Runs the qualitative STORY_RULES section 5 pass after deterministic validation. */
export async function validateStoryWithModel(
  story: GeneratedStory,
  input: StoryValidationInput,
  client?: StoryValidatorClient,
): Promise<StoryValidationResult> {
  const local = validateStoryLocally(story, input);
  if (!local.valid) return local;

  const validator = client ?? (getOpenAI() as unknown as StoryValidatorClient);
  const response = await withModelRetry('story validation', () =>
    validator.responses.create({
      model: generationConfig.textModel,
      input: modelReviewPrompt(story, input),
      text: {
        format: {
          type: 'json_schema',
          name: 'story_validation',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['valid', 'reasons'],
            properties: {
              valid: { type: 'boolean' },
              reasons: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    }),
  );
  let modelResult: unknown;
  try {
    modelResult = JSON.parse(response.output_text) as unknown;
  } catch {
    return { valid: false, reasons: ['The story review did not return valid JSON.'] };
  }
  const parsed = modelResultSchema.safeParse(modelResult);
  if (!parsed.success) {
    return { valid: false, reasons: ['The story review did not match the required format.'] };
  }
  if (parsed.data.valid) return local;
  return {
    valid: false,
    reasons: parsed.data.reasons.length > 0
      ? parsed.data.reasons
      : ['The story review found an issue. Recheck every qualitative rule and return a complete corrected story.'],
  };
}
