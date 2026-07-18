import { describe, expect, it } from 'vitest';
import type { GeneratedStory } from '../../schemas.js';
import { validateStoryLocally } from './validate.js';

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
});
