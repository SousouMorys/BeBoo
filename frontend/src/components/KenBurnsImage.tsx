import type { AnimationName } from '../lib/types';

const animationClass: Record<AnimationName, string> = {
  'zoom-in': 'bb-kenburns-zoom-in',
  'zoom-out': 'bb-kenburns-zoom-out',
  'pan-lr': 'bb-kenburns-pan-lr',
  none: '',
};

interface KenBurnsImageProps {
  imageUrl: string;
  alt: string;
  animation: AnimationName;
  reducedMotion: boolean;
}

export function KenBurnsImage({
  imageUrl,
  alt,
  animation,
  reducedMotion,
}: KenBurnsImageProps) {
  const motionClass = reducedMotion ? '' : animationClass[animation];

  return (
    <div className="h-full overflow-hidden bg-bb-sky">
      <img
        alt={alt}
        className={`h-full w-full object-cover ${motionClass}`}
        draggable="false"
        src={imageUrl}
      />
    </div>
  );
}
