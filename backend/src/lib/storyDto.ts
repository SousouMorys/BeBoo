type DbPage = {
  index: number;
  text: string;
  scene: string;
  animation: string;
  imageId: string | null;
  audioId: string | null;
  timings: unknown;
  checkIn: unknown;
};

type DbStory = {
  id: string;
  title: string;
  situationCategory: string;
  characterBlock: string;
  bridgeQuestion: string;
  status: string;
  child: {
    firstName: string;
    pronoun: string;
    readingLevel: string;
    interests: unknown;
    companion: string;
  };
  pages: DbPage[];
};

const animationNames: Record<string, 'zoom-in' | 'zoom-out' | 'pan-lr' | 'none'> = {
  zoom_in: 'zoom-in',
  zoom_out: 'zoom-out',
  pan_lr: 'pan-lr',
  none: 'none',
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function nullableArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Converts Prisma records to the browser story shape without leaking bytes. */
export function toStoryDto(story: DbStory) {
  const pages = [...story.pages]
    .sort((first, second) => first.index - second.index)
    .map((page) => ({
      page: page.index,
      text: page.text,
      scene: page.scene,
      animation: animationNames[page.animation] ?? 'none',
      imageUrl: page.imageId ? `/api/media/${page.imageId}` : null,
      audioUrl: page.audioId ? `/api/media/${page.audioId}` : null,
      timings: nullableArray(page.timings),
      checkIn: page.checkIn ?? null,
    }));

  return {
    id: story.id,
    title: story.title,
    situationCategory: story.situationCategory,
    childProfile: {
      name: story.child.firstName,
      pronoun: story.child.pronoun,
      readingLevel: story.child.readingLevel === 'pre_reader' ? 'pre-reader' : story.child.readingLevel,
      interests: stringArray(story.child.interests),
      companion: story.child.companion,
    },
    characterBlock: story.characterBlock,
    bridgeQuestion: story.bridgeQuestion,
    status: story.status,
    coverUrl: pages[0]?.imageUrl ?? null,
    pages,
  };
}
