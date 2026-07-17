import type { EmotionId } from '../lib/types';

interface ExpressionPaths {
  leftBrow: string;
  rightBrow: string;
  mouth: string;
}

const expressions: Record<EmotionId, ExpressionPaths> = {
  happy: {
    leftBrow: 'M25 31 Q32 26 39 30',
    rightBrow: 'M81 30 Q88 26 95 31',
    mouth: 'M43 63 Q60 76 77 63',
  },
  sad: {
    leftBrow: 'M25 29 Q33 35 40 31',
    rightBrow: 'M80 31 Q87 35 95 29',
    mouth: 'M44 72 Q60 59 76 72',
  },
  angry: {
    leftBrow: 'M24 27 L40 34',
    rightBrow: 'M80 34 L96 27',
    mouth: 'M45 70 L75 70',
  },
  scared: {
    leftBrow: 'M25 35 Q32 25 40 32',
    rightBrow: 'M80 32 Q88 25 95 35',
    mouth: 'M50 69 Q60 60 70 69 L70 76 Q60 83 50 76 Z',
  },
  calm: {
    leftBrow: 'M25 32 Q32 29 40 32',
    rightBrow: 'M80 32 Q88 29 95 32',
    mouth: 'M47 68 Q60 73 73 68',
  },
  nervous: {
    leftBrow: 'M25 34 Q32 25 40 31',
    rightBrow: 'M80 31 Q88 25 95 34',
    mouth: 'M45 70 Q52 65 60 70 Q68 75 75 70',
  },
  proud: {
    leftBrow: 'M25 30 Q32 24 40 29',
    rightBrow: 'M80 29 Q88 24 95 30',
    mouth: 'M42 63 Q60 78 78 63',
  },
  disappointed: {
    leftBrow: 'M25 30 Q32 36 40 32',
    rightBrow: 'M80 32 Q88 36 95 30',
    mouth: 'M47 73 Q60 66 73 73',
  },
};

interface EmotionFaceProps {
  emotion: EmotionId;
  size?: number;
  className?: string;
  label?: string;
}

/** The canonical eight-expression face set used across BeBoo. */
export function EmotionFace({
  emotion,
  size = 96,
  className = '',
  label,
}: EmotionFaceProps) {
  const expression = expressions[emotion];

  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={className}
      height={size}
      role={label ? 'img' : undefined}
      viewBox="0 0 120 120"
      width={size}
    >
      <ellipse cx="60" cy="60" fill="var(--bb-surface)" rx="48" ry="45" />
      <path d={expression.leftBrow} fill="none" stroke="var(--bb-ink)" strokeLinecap="round" strokeWidth="5" />
      <path d={expression.rightBrow} fill="none" stroke="var(--bb-ink)" strokeLinecap="round" strokeWidth="5" />
      <ellipse cx="38" cy="49" fill="var(--bb-ink)" rx="7" ry="11" />
      <ellipse cx="82" cy="49" fill="var(--bb-ink)" rx="7" ry="11" />
      <path
        d={expression.mouth}
        fill={emotion === 'scared' ? 'var(--bb-ink-soft)' : 'none'}
        stroke="var(--bb-ink)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
    </svg>
  );
}
