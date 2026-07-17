import type { EmotionId } from '../lib/types';
import { EmotionFace } from './EmotionFace';

interface BebooMascotProps {
  expression?: EmotionId;
  size?: number;
}

export function BebooMascot({ expression = 'happy', size = 112 }: BebooMascotProps) {
  const faceSize = Math.round(size * 0.58);

  return (
    <div
      aria-label="BeBoo"
      className="relative shrink-0"
      role="img"
      style={{ height: size, width: size }}
    >
      <svg aria-hidden="true" className="absolute inset-0" viewBox="0 0 120 120">
        <ellipse cx="60" cy="65" fill="var(--bb-teal)" rx="49" ry="40" />
        <circle cx="29" cy="51" fill="var(--bb-teal)" r="19" />
        <circle cx="52" cy="34" fill="var(--bb-teal)" r="25" />
        <circle cx="79" cy="39" fill="var(--bb-teal)" r="23" />
        <circle cx="96" cy="62" fill="var(--bb-teal)" r="18" />
        <ellipse cx="34" cy="93" fill="var(--bb-teal-deep)" opacity="0.15" rx="10" ry="5" />
        <ellipse cx="86" cy="93" fill="var(--bb-teal-deep)" opacity="0.15" rx="10" ry="5" />
      </svg>
      <EmotionFace
        className="absolute left-[21%] top-[25%]"
        emotion={expression}
        size={faceSize}
      />
    </div>
  );
}
