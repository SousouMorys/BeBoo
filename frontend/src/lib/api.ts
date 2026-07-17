import seedStories from '../../../data/beboo-seed-stories.json';
import type {
  AnimationName,
  CheckIn,
  CheckInAttempt,
  CheckInAttemptInput,
  Child,
  ChildInput,
  EmotionId,
  Story,
  StoryChildProfile,
  StoryPageData,
  WordTiming,
} from './types';

interface SeedPage {
  page: number;
  text: string;
  scene: string;
  animation: AnimationName;
  audioUrl: string | null;
  timings: WordTiming[];
  checkIn: CheckIn | null;
}

interface SeedStory {
  id: string;
  title: string;
  situationCategory: string;
  childProfile: StoryChildProfile;
  characterBlock: string;
  pages: SeedPage[];
  bridgeQuestion: string;
}

interface SeedDocument {
  stories: SeedStory[];
}

interface MockState {
  child: Child | null;
  pin: string | null;
  pinAttempts: number;
  checkInAttempts: CheckInAttempt[];
  recentStoryIds: string[];
}

const seed = seedStories as unknown as SeedDocument;
const mockStateStorageKey = 'beboo-mock-state-v2';
const emotionIds: EmotionId[] = [
  'happy',
  'sad',
  'angry',
  'scared',
  'calm',
  'nervous',
  'proud',
  'disappointed',
];

let parentUnlocked = false;

const stories: Story[] = seed.stories.map((story) => ({
  ...story,
  coverUrl: `/seed/${story.id}/1.jpeg`,
  pages: story.pages.map((page): StoryPageData => ({
    ...page,
    imageUrl: `/seed/${story.id}/${page.page}.jpeg`,
  })),
}));

function emptyState(): MockState {
  return {
    child: null,
    pin: null,
    pinAttempts: 0,
    checkInAttempts: [],
    recentStoryIds: [],
  };
}

function isReadingLevel(value: unknown): value is Child['readingLevel'] {
  return value === 'pre-reader' || value === 'beginner' || value === 'reader';
}

function isEmotionId(value: unknown): value is EmotionId {
  return typeof value === 'string' && emotionIds.includes(value as EmotionId);
}

function readChild(value: unknown): Child | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<Child>;
  const settings = candidate.settings as Partial<Child['settings']> | undefined;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.firstName !== 'string' ||
    typeof candidate.pronoun !== 'string' ||
    !isReadingLevel(candidate.readingLevel) ||
    !Array.isArray(candidate.interests) ||
    !candidate.interests.every((interest) => typeof interest === 'string') ||
    typeof candidate.companion !== 'string' ||
    !settings ||
    typeof settings.reduceAnimations !== 'boolean' ||
    typeof settings.highlighting !== 'boolean' ||
    typeof settings.checkIns !== 'boolean' ||
    typeof settings.ambience !== 'boolean' ||
    (settings.narrationSpeed !== 0.8 && settings.narrationSpeed !== 1)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    firstName: candidate.firstName,
    pronoun: candidate.pronoun,
    readingLevel: candidate.readingLevel,
    interests: candidate.interests.slice(0, 3),
    companion: candidate.companion,
    settings: {
      reduceAnimations: settings.reduceAnimations,
      highlighting: settings.highlighting,
      checkIns: settings.checkIns,
      ambience: settings.ambience,
      narrationSpeed: settings.narrationSpeed,
      autoplay: false,
    },
  };
}

function readState(): MockState {
  if (typeof window === 'undefined') {
    return emptyState();
  }

  try {
    const stored = window.localStorage.getItem(mockStateStorageKey);
    if (!stored) {
      return emptyState();
    }

    const candidate: unknown = JSON.parse(stored);
    if (!candidate || typeof candidate !== 'object') {
      return emptyState();
    }

    const value = candidate as Partial<MockState>;
    const attempts = Array.isArray(value.checkInAttempts)
      ? value.checkInAttempts.filter(
          (attempt): attempt is CheckInAttempt =>
            Boolean(attempt) &&
            typeof attempt === 'object' &&
            typeof attempt.storyId === 'string' &&
            typeof attempt.page === 'number' &&
            typeof attempt.childId === 'string' &&
            isEmotionId(attempt.emotionId) &&
            typeof attempt.correct === 'boolean' &&
            (attempt.attempt === 1 || attempt.attempt === 2) &&
            typeof attempt.createdAt === 'string',
        )
      : [];

    return {
      child: readChild(value.child),
      pin: typeof value.pin === 'string' && /^\d{4}$/.test(value.pin) ? value.pin : null,
      pinAttempts: typeof value.pinAttempts === 'number' ? Math.max(0, value.pinAttempts) : 0,
      checkInAttempts: attempts,
      recentStoryIds: Array.isArray(value.recentStoryIds)
        ? value.recentStoryIds.filter(
            (storyId): storyId is string =>
              typeof storyId === 'string' && stories.some((story) => story.id === storyId),
          )
        : [],
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: MockState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(mockStateStorageKey, JSON.stringify(state));
}

function sortByMostRecentlyRead(items: Story[], recentIds: string[]): Story[] {
  const recentRank = new Map(recentIds.map((storyId, index) => [storyId, index]));

  return [...items].sort(
    (first, second) =>
      (recentRank.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
      (recentRank.get(second.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

function makeChildId(): string {
  return `child-${Date.now().toString(36)}`;
}

/**
 * The only client data boundary. Phase 1 stores a local mock profile, PIN,
 * recency, and check-in attempts. Phase 3 keeps this interface and swaps the
 * implementation to the validated API.
 */
export const api = {
  async getCurrentChild(): Promise<Child | null> {
    return readState().child;
  },

  async createChild(input: ChildInput): Promise<Child> {
    const state = readState();
    const child: Child = {
      id: state.child?.id ?? makeChildId(),
      firstName: input.firstName.trim(),
      pronoun: input.pronoun.trim(),
      readingLevel: input.readingLevel,
      interests: input.interests.map((interest) => interest.trim()).filter(Boolean).slice(0, 3),
      companion: input.companion.trim() || 'BeBoo',
      settings: {
        ...input.settings,
        autoplay: false,
      },
    };

    writeState({ ...state, child });
    return child;
  },

  async setPin(pin: string): Promise<void> {
    if (!/^\d{4}$/.test(pin)) {
      return;
    }

    const state = readState();
    writeState({ ...state, pin });
  },

  async verifyPin(pin: string): Promise<boolean> {
    const state = readState();
    const matches = Boolean(state.pin && pin === state.pin);
    writeState({
      ...state,
      pinAttempts: matches ? state.pinAttempts : state.pinAttempts + 1,
    });
    parentUnlocked = matches;
    return matches;
  },

  isParentUnlocked(): boolean {
    return parentUnlocked;
  },

  isOnboardingComplete(): boolean {
    const state = readState();
    return Boolean(state.child && state.pin);
  },

  async listStories(): Promise<Story[]> {
    return sortByMostRecentlyRead(stories, readState().recentStoryIds);
  },

  async getStory(storyId: string): Promise<Story | null> {
    return stories.find((story) => story.id === storyId) ?? null;
  },

  async markStoryRead(storyId: string): Promise<void> {
    if (!stories.some((story) => story.id === storyId)) {
      return;
    }

    const state = readState();
    const recentStoryIds = [storyId, ...state.recentStoryIds.filter((id) => id !== storyId)];
    writeState({ ...state, recentStoryIds });
  },

  async recordCheckIn(input: CheckInAttemptInput): Promise<void> {
    const state = readState();
    const attempt: CheckInAttempt = {
      ...input,
      createdAt: new Date().toISOString(),
    };
    writeState({
      ...state,
      checkInAttempts: [...state.checkInAttempts, attempt],
    });
  },
};
