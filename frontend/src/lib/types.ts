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
  age: number;
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
}

export interface ChildSettings {
  reduceAnimations: boolean;
  highlighting: boolean;
  checkIns: boolean;
  ambience: boolean;
  narrationSpeed: 0.8 | 1;
}

export interface Child {
  id: string;
  firstName: string;
  pronoun: string;
  readingLevel: ReadingLevel;
  settings: ChildSettings;
}
