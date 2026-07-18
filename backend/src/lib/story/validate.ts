import { getOpenAI } from '../../openai.js';
import { z } from 'zod';
import { withModelRetry } from '../modelRetry.js';
import {
  emotionIds,
  generatedStorySchema,
  type GeneratedStory,
  type ReadingLevel,
} from '../../schemas.js';

export const maxValidationRetries = 2;

export interface StoryValidationInput {
  length: number;
  readingLevel: ReadingLevel;
  checkIns: boolean;
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
  const allCopy = JSON.stringify(story).toLowerCase();
  const reasons = bannedTerms
    .filter((term) => includesWord(allCopy, term))
    .map((term) => `Banned term found: "${term}".`);

  story.pages.forEach((page) => {
    if (/\b[A-Z]{2,}\b/.test(page.text)) {
      reasons.push(`Page ${page.page} includes all-caps child-facing copy.`);
    }
  });
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
      model: 'gpt-5.6-terra',
      input: `Review this generated social story against STORY_RULES section 5. Check literal language, arc, visible body cues for featured emotions, check-in cues in scenes, safety, and scene focus. Return only JSON: {"valid": boolean, "reasons": string[]}.\n\n${JSON.stringify(story)}`,
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
  return parsed.data.valid ? local : { valid: false, reasons: parsed.data.reasons };
}
