interface SpeakerButtonProps {
  isComplete: boolean;
  isPlaying: boolean;
  onClick: () => void;
}

export function SpeakerButton({ isComplete, isPlaying, onClick }: SpeakerButtonProps) {
  const label = isPlaying ? 'Pause' : isComplete ? 'Read again' : 'Read aloud';

  return (
    <button
      aria-label={label}
      aria-pressed={isPlaying}
      className="bb-child-target inline-flex items-center gap-2 bg-bb-surface px-4 text-[18px] font-bold text-bb-teal-deep shadow-sm"
      onClick={onClick}
      type="button"
    >
      <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 28 28" width="28">
        <path d="M4 11.5H9L15 6V22L9 16.5H4V11.5Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M19 10C20.4 11.1 21 12.5 21 14C21 15.5 20.4 16.9 19 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
