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

export type EmotionId = (typeof emotionIds)[number];
export type AnimationName = 'zoom-in' | 'zoom-out' | 'pan-lr' | 'none';
export type ReadingLevel = 'pre-reader' | 'beginner' | 'reader';
export type StoryStatus = 'writing' | 'drawing' | 'voicing' | 'ready' | 'failed';
export type SituationCategory = 'health' | 'school' | 'daily-life' | 'social' | 'custom';

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface CheckInOption {
  id: EmotionId;
  label: EmotionId;
}

export interface CheckIn {
  question: string;
  options: CheckInOption[];
  correctId: EmotionId;
  scaffold: string;
  reveal: string;
}

export interface StoryPageData {
  page: number;
  text: string;
  scene: string;
  animation: AnimationName;
  audioUrl: string | null;
  timings: WordTiming[];
  checkIn: CheckIn | null;
  imageUrl: string;
}

export interface StoryChildProfile {
  name: string;
  age?: number;
  readingLevel: ReadingLevel;
  interests: string[];
  companion: string;
}

export interface Story {
  id: string;
  title: string;
  situationCategory: string;
  childProfile: StoryChildProfile;
  characterBlock: string;
  pages: StoryPageData[];
  bridgeQuestion: string;
  coverUrl: string;
  status?: StoryStatus;
}

export interface ChildSettings {
  reduceAnimations: boolean;
  highlighting: boolean;
  checkIns: boolean;
  ambience: boolean;
  narrationSpeed: 0.8 | 1;
  autoplay: false;
}

export interface Child {
  id: string;
  firstName: string;
  pronoun: string;
  readingLevel: ReadingLevel;
  interests: string[];
  companion: string;
  settings: ChildSettings;
}

export interface ChildInput {
  firstName: string;
  pronoun: string;
  readingLevel: ReadingLevel;
  interests: string[];
  companion: string;
  settings: Omit<ChildSettings, 'autoplay'>;
}

export interface CheckInAttemptInput {
  storyId: string;
  page: number;
  childId: string;
  emotionId: EmotionId;
  correctEmotionId: EmotionId;
  correct: boolean;
  attempt: 1 | 2;
}

export interface CheckInAttempt extends CheckInAttemptInput {
  createdAt: string;
}

export interface FeelingLogInput {
  childId: string;
  emotionId: EmotionId;
}

export interface FeelingCount {
  emotionId: EmotionId;
  count: number;
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

export interface ReadSummary {
  distinctStories: number;
  total: number;
}

export interface Dashboard {
  accuracy: EmotionAccuracy[];
  confusionPairs: ConfusionPair[];
  reads: ReadSummary;
  feelings: {
    last7Days: FeelingCount[];
  };
}

export interface ReadLogInput {
  childId: string;
  storyId: string;
}

export interface StoryGenerationInput {
  childId: string;
  childProfile?: StoryGenerationChildProfile;
  situation: {
    category: SituationCategory;
    text: string;
  };
  length: 3 | 4 | 5 | 6;
  checkIns: boolean;
}

export interface StoryGenerationChildProfile {
  firstName: string;
  pronoun: string;
  readingLevel: ReadingLevel;
  interests: string[];
  companion: string;
  settings: ChildSettings;
}
