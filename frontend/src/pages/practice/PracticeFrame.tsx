import type { ReactNode } from 'react';

interface PracticeFrameProps {
  children: ReactNode;
  onBack: () => void;
  backLabel: string;
  home?: boolean;
}

/** Keeps the child navigation control in the same fixed position on C6–C9. */
export function PracticeFrame({ children, onBack, backLabel, home = false }: PracticeFrameProps) {
  return (
    <div className="min-h-[100dvh] bg-bb-cream text-bb-ink">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-bb-sand bg-bb-cream">
        <div className="mx-auto flex h-20 max-w-[560px] items-center px-3">
          <button
            aria-label={backLabel}
            className="bb-child-target inline-flex items-center justify-center bg-bb-surface text-bb-ink shadow-sm"
            onClick={onBack}
            type="button"
          >
            {home ? (
              <svg aria-hidden="true" fill="none" height="27" viewBox="0 0 28 28" width="27">
                <path d="M4 13.5L14 5L24 13.5V23H17.5V16H10.5V23H4V13.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.2" />
              </svg>
            ) : (
              <svg aria-hidden="true" fill="none" height="27" viewBox="0 0 28 28" width="27">
                <path d="M21 14H7M13 8L7 14L13 20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto flex min-h-[100dvh] max-w-[560px] flex-col px-4 pb-28 pt-24">
        {children}
      </main>
    </div>
  );
}
