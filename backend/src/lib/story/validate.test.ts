import { describe, expect, it } from 'vitest';
import type { GeneratedStory } from '../../schemas.js';
import { buildStoryPrompt } from './prompt.js';
import { validateStoryLocally, validateStoryWithModel } from './validate.js';

const validStory: GeneratedStory = {
  title: 'Sami visits the dentist',
  characterBlock: 'Sami has curly dark hair and wears a blue shirt.',
  bridgeQuestion: 'What helps you feel calm?',
  pages: [
    {
      page: 1,
      text: 'Sami arrives at the dentist. He feels calm. His shoulders are low.',
      scene: 'Sami stands beside his mother outside a friendly dentist office.',
      animation: 'zoom-in',
      checkIn: null,
    },
    {
      page: 2,
      text: 'The chair rises slowly. Sami can hold his train. His hands stay close together.',
      scene: 'Sami sits in a dentist chair and holds his small train.',
      animation: 'pan-lr',
      checkIn: null,
    },
    {
      page: 3,
      text: 'The visit ends calmly. Sami feels proud. He smiles and holds his train.',
      scene: 'Sami smiles beside the dentist while holding his train.',
      animation: 'zoom-out',
      checkIn: null,
    },
  ],
};

const input = { length: 3, readingLevel: 'beginner' as const, checkIns: false };

describe('validateStoryLocally', () => {
  it('accepts a story within the beginner sentence budget', () => {
    expect(validateStoryLocally(validStory, input)).toEqual({ valid: true, reasons: [] });
  });

  it('rejects a sentence over the ten-word budget', () => {
    const story = structuredClone(validStory);
    story.pages[0].text = 'Sami walks very slowly through the quiet friendly dentist waiting room today. He feels calm.';

    expect(validateStoryLocally(story, input).reasons).toContain('Page 1 sentence 1 exceeds 10 words.');
  });

  it('rejects banned child-facing vocabulary', () => {
    const story = structuredClone(validStory);
    story.pages[1].text = 'This is a quiz. Sami can hold his train. His hands stay close together.';

    expect(validateStoryLocally(story, input).reasons).toContain('Banned term found: "quiz".');
  });

  it('does not apply child-facing lexicon rules to scene metadata', () => {
    const story = structuredClone(validStory);
    story.pages[0].scene = 'Sami stands outside a dentist office. No text appears on the building.';

    expect(validateStoryLocally(story, input)).toEqual({ valid: true, reasons: [] });
  });

  it('gives the model reviewer the complete qualitative rubric', async () => {
    let receivedRequest: unknown;
    const client = {
      responses: {
        create: async (request: unknown) => {
          receivedRequest = request;
          return { output_text: '{"valid":true,"reasons":[]}' };
        },
      },
    };

    await expect(validateStoryWithModel(validStory, input, client)).resolves.toEqual({ valid: true, reasons: [] });
    expect(JSON.stringify(receivedRequest)).toContain('Mark invalid only for a clear, specific violation.');
    expect(JSON.stringify(receivedRequest)).toContain('Scenes and characterBlock are internal illustration metadata');
  });

  it('turns an unhelpful invalid model review into revision feedback', async () => {
    const client = {
      responses: {
        create: async () => ({ output_text: '{"valid":false,"reasons":[]}' }),
      },
    };

    await expect(validateStoryWithModel(validStory, input, client)).resolves.toEqual({
      valid: false,
      reasons: ['The story review found an issue. Recheck every qualitative rule and return a complete corrected story.'],
    });
  });

  it('requires null check-ins when check-ins are off', () => {
    const prompt = buildStoryPrompt({
      firstName: 'Sami',
      pronoun: 'they/them',
      readingLevel: 'beginner',
      interests: [],
      companion: 'BeBoo',
      situationCategory: 'health',
      situationText: 'A dentist visit',
      length: 3,
      checkIns: false,
      targetEmotions: ['nervous', 'calm'],
    });

    expect(prompt).toContain('Set checkIn to null on every page.');
    expect(prompt).toContain('Every page must include a checkIn field.');
  });

  it('gives beginner stories an exact page-text sentence target inside their budget', () => {
    const prompt = buildStoryPrompt({
      firstName: 'Sami',
      pronoun: 'they/them',
      readingLevel: 'beginner',
      interests: [],
      companion: 'BeBoo',
      situationCategory: 'school',
      situationText: 'A fire drill at school',
      length: 5,
      checkIns: true,
      targetEmotions: ['nervous', 'calm'],
    });

    expect(prompt).toContain('exactly 2 complete sentences');
    expect(prompt).toContain('Do not use fragments, bullets, or line breaks in page text.');
  });
});
