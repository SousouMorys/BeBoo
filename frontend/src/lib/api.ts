import seedStories from '../../../data/beboo-seed-stories.json';
import type {
  AnimationName,
  CheckIn,
  Child,
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

const seed = seedStories as unknown as SeedDocument;
const recentStoryStorageKey = 'beboo-recent-story-ids';

const currentChild: Child = {
  id: 'child-sami',
  firstName: 'Sami',
  pronoun: 'he/him',
  readingLevel: 'beginner',
  settings: {
    reduceAnimations: false,
    highlighting: true,
    checkIns: true,
    ambience: false,
    narrationSpeed: 1,
  },
};

const stories: Story[] = seed.stories.map((story) => ({
  ...story,
  coverUrl: `/seed/${story.id}-cover.svg`,
  pages: story.pages.map((page): StoryPageData => ({
    ...page,
    imageUrl: `/seed/${story.id}-p${page.page}.svg`,
  })),
}));

function getRecentStoryIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(recentStoryStorageKey);
    if (!stored) {
      return [];
    }

    const candidate: unknown = JSON.parse(stored);
    if (!Array.isArray(candidate)) {
      return [];
    }

    return candidate.filter(
      (storyId): storyId is string =>
        typeof storyId === 'string' && stories.some((story) => story.id === storyId),
    );
  } catch {
    return [];
  }
}

function sortByMostRecentlyRead(items: Story[]): Story[] {
  const recentIds = getRecentStoryIds();
  const recentRank = new Map(recentIds.map((storyId, index) => [storyId, index]));

  return [...items].sort(
    (first, second) =>
      (recentRank.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
      (recentRank.get(second.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

/**
 * The only client data boundary. During Phase 1 this reads the validated seed
 * JSON and browser-local placeholder preferences; Phase 3 will keep this API
 * while swapping the implementation to the backend.
 */
export const api = {
  async getCurrentChild(): Promise<Child> {
    return currentChild;
  },

  async listStories(): Promise<Story[]> {
    return sortByMostRecentlyRead(stories);
  },

  async getStory(storyId: string): Promise<Story | null> {
    return stories.find((story) => story.id === storyId) ?? null;
  },

  async markStoryRead(storyId: string): Promise<void> {
    if (typeof window === 'undefined' || !stories.some((story) => story.id === storyId)) {
      return;
    }

    const otherIds = getRecentStoryIds().filter((id) => id !== storyId);
    window.localStorage.setItem(recentStoryStorageKey, JSON.stringify([storyId, ...otherIds]));
  },
};
