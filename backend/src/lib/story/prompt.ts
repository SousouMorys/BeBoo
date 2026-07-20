import type { EmotionId, ReadingLevel } from '../../schemas.js';

export interface StoryPromptInput {
  firstName: string;
  pronoun: string;
  readingLevel: ReadingLevel;
  interests: string[];
  companion: string;
  situationCategory: string;
  situationText: string;
  length: number;
  checkIns: boolean;
  targetEmotions: EmotionId[];
}

const sentenceBudgets: Record<ReadingLevel, string> = {
  'pre-reader': '1-2',
  beginner: '2-3',
  reader: '3-4',
};

const targetSentenceCounts: Record<ReadingLevel, number> = {
  'pre-reader': 1,
  beginner: 2,
  reader: 3,
};

export function sentenceBudgetFor(readingLevel: ReadingLevel): string {
  return sentenceBudgets[readingLevel];
}

function sentenceFormatInstruction(readingLevel: ReadingLevel): string {
  const target = targetSentenceCounts[readingLevel];
  return `Each page text must contain exactly ${target} complete sentence${target === 1 ? '' : 's'}, each ending with a period. This stays within the ${sentenceBudgetFor(readingLevel)} sentence budget. Do not use fragments, bullets, or line breaks in page text.`;
}

export function buildStoryPrompt(input: StoryPromptInput): string {
  const interests = input.interests.length > 0 ? input.interests.join(', ') : 'none listed';
  const checkIns = input.checkIns
    ? `
CHECK-INS
- After each page that shows a target emotion (the final page included): question (<= 8 words), 3 options from [happy, sad, angry, scared, calm, nervous, proud, disappointed], one correctId matching the text, a scaffold line pointing at a visible cue, and a reveal line stating the answer warmly with the cue.`
    : '\nCHECK-INS\n- Do not create a check-in on any page. Set checkIn to null on every page.';

  return `You write calm, literal social stories for autistic children aged 4-10.
Follow every rule. The reader is ${input.firstName} (${input.pronoun}), reading level
${input.readingLevel}, who loves ${interests}. Companion: ${input.companion}.

STORY
- Situation to prepare for: ${input.situationText} (category: ${input.situationCategory}).
- Exactly ${input.length} pages. Sentences per page: ${sentenceBudgetFor(input.readingLevel)}. Every sentence has 10 words or fewer. Present tense. Warm and concrete.
- HARD PAGE-TEXT FORMAT: ${sentenceFormatInstruction(input.readingLevel)}
- No idioms, no metaphors, no sarcasm, no wordplay. Say feelings plainly and pair each named feeling with one visible body cue.
- Page 1 sets the place and situation. Middle pages show what happens and what ${input.firstName} CAN do (say "can", not "must"). The last page is a calm, good outcome ending with reassurance and pride.
- Nothing frightening or shaming. Hard moments are brief and always paired with what helps. At most one exclamation mark per page.
- Target emotions to feature this story: ${input.targetEmotions.join(', ')}.

CHARACTER BLOCK
- Write characterBlock: 1-3 visual sentences describing ${input.firstName} AND any recurring adults (parent, teacher, dentist) as simple rounded picture-book characters (hair, skin tone, one outfit each). Everyone who appears on more than one page must be described here -- it is reused verbatim for every illustration so the cast stays identical across pages.

SCENES (one per page)
- scene: <= 60 words, concrete, eye-level, ONE focal point, the character's emotion visible in face and posture (the same cue the scaffold will mention must be visible). Describe only content -- no style words, no text in the scene.

ANIMATION (one per page)
- Choose from zoom-in | zoom-out | pan-lr | none using the pacing rules: zoom-in for arriving/noticing, pan-lr for journeys, zoom-out for relief and endings, none for quiet or big-feeling pages (stillness lowers load exactly when the content is heaviest).${checkIns}

JSON OUTPUT
- Every page must include a checkIn field. Use null when that page has no check-in.
- In child-facing copy (title, page text, bridge, and check-ins), never use: quiz, test, question round, wrong, incorrect, no, oops, you win, score, points, error, empty, nothing here, replay level, retry.

BRIDGE
- bridgeQuestion: one or two short questions (each <= 8 words) that open a conversation with the grown-up, for example: "Have you ever felt like ${input.firstName}? What helps you feel calm?"`;
}
