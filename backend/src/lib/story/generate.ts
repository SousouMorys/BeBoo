import { getOpenAI } from '../../openai.js';
import { generationConfig } from '../../config.js';
import {
  generatedStorySchema,
  type GeneratedStory,
  type ReadingLevel,
} from '../../schemas.js';
import { errorMessage, withModelRetry } from '../modelRetry.js';
import { buildStoryPrompt, type StoryPromptInput } from './prompt.js';
import { maxValidationRetries, validateStoryWithModel } from './validate.js';

interface StoryWriterClient {
  responses: {
    create(request: unknown): Promise<{ output_text: string }>;
  };
}

export type GenerateStoryInput = StoryPromptInput;

const storyResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'characterBlock', 'pages', 'bridgeQuestion'],
  properties: {
    title: { type: 'string' },
    characterBlock: { type: 'string' },
    bridgeQuestion: { type: 'string' },
    pages: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['page', 'text', 'scene', 'animation', 'checkIn'],
        properties: {
          page: { type: 'integer', minimum: 1 },
          text: { type: 'string' },
          scene: { type: 'string' },
          animation: { type: 'string', enum: ['zoom-in', 'zoom-out', 'pan-lr', 'none'] },
          checkIn: {
            anyOf: [
              { type: 'null' },
              {
                type: 'object',
                additionalProperties: false,
                required: ['question', 'options', 'correctId', 'scaffold', 'reveal'],
                properties: {
                  question: { type: 'string' },
                  options: {
                    type: 'array',
                    minItems: 3,
                    maxItems: 3,
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['id', 'label'],
                      properties: {
                        id: { type: 'string', enum: ['happy', 'sad', 'angry', 'scared', 'calm', 'nervous', 'proud', 'disappointed'] },
                        label: { type: 'string', enum: ['happy', 'sad', 'angry', 'scared', 'calm', 'nervous', 'proud', 'disappointed'] },
                      },
                    },
                  },
                  correctId: { type: 'string', enum: ['happy', 'sad', 'angry', 'scared', 'calm', 'nervous', 'proud', 'disappointed'] },
                  scaffold: { type: 'string' },
                  reveal: { type: 'string' },
                },
              },
            ],
          },
        },
      },
    },
  },
} as const;

function revisionPrompt(
  input: GenerateStoryInput,
  reasons: string[],
  previousDraft?: GeneratedStory,
): string {
  const base = buildStoryPrompt(input);
  if (reasons.length === 0) return base;

  const draft = previousDraft ? `\n\nPRIOR DRAFT\n${JSON.stringify(previousDraft)}` : '';
  return `${base}\n\nREVISION REQUIRED\nThe prior draft did not pass review. Return a complete replacement JSON object and fix every issue:\n- ${reasons.join('\n- ')}${draft}`;
}

function readingLevelForValidation(level: ReadingLevel): ReadingLevel {
  return level;
}

/** Generates a strict story object and regenerates only when validation identifies fixes. */
export async function generateStory(input: GenerateStoryInput): Promise<GeneratedStory> {
  const writer = getOpenAI() as unknown as StoryWriterClient;
  let reasons: string[] = [];
  let previousDraft: GeneratedStory | undefined;

  for (let attempt = 0; attempt <= maxValidationRetries; attempt += 1) {
    const response = await withModelRetry(`story writing attempt ${attempt + 1}`, () =>
      writer.responses.create({
        model: generationConfig.textModel,
        input: revisionPrompt(input, reasons, previousDraft),
        text: {
          format: {
            type: 'json_schema',
            name: 'beboo_story',
            strict: true,
            schema: storyResponseSchema,
          },
        },
      }),
    );

    let candidate: unknown;
    try {
      candidate = JSON.parse(response.output_text);
    } catch (error) {
      reasons = [`The response was not valid JSON: ${errorMessage(error)}`];
      console.warn(`[story] draft ${attempt + 1} rejected: ${reasons.join(' ')}`);
      continue;
    }

    const parsed = generatedStorySchema.safeParse(candidate);
    if (!parsed.success) {
      reasons = parsed.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `${path}${issue.message}`;
      });
      console.warn(`[story] draft ${attempt + 1} rejected: ${reasons.join(' ')}`);
      continue;
    }
    previousDraft = parsed.data;

    const validation = await validateStoryWithModel(parsed.data, {
      length: input.length,
      readingLevel: readingLevelForValidation(input.readingLevel),
      checkIns: input.checkIns,
      targetEmotions: input.targetEmotions,
    });
    if (validation.valid) return parsed.data;
    reasons = validation.reasons;
    console.warn(`[story] draft ${attempt + 1} rejected: ${reasons.join(' ')}`);
  }

  throw new Error(
    `Story generation did not pass validation after ${maxValidationRetries + 1} drafts. ${reasons.join(' ')}`,
  );
}
