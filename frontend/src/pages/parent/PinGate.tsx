import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';

interface PinGateProps {
  onVerified: () => void;
  onBack: () => void;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function PinGate({ onVerified, onBack }: PinGateProps) {
  const [pin, setPin] = useState('');
  const [showMismatch, setShowMismatch] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin.length !== 4 || isChecking) {
      return;
    }

    setIsChecking(true);
    const matches = await api.verifyPin(pin);
    setIsChecking(false);

    if (matches) {
      onVerified();
      return;
    }

    setPin('');
    setShowMismatch(true);
  }

  return (
    <main className="min-h-[100dvh] bg-bb-cream px-5 py-10 text-bb-ink sm:px-8">
      <div className="mx-auto max-w-sm">
        <button
          className="bb-parent-target mb-10 inline-flex items-center justify-center px-3 text-[16px] font-bold text-bb-teal-deep"
          onClick={onBack}
          type="button"
        >
          Back to stories
        </button>

        <section aria-labelledby="pin-title" className="rounded-bb-lg bg-bb-surface p-6 shadow-sm sm:p-8">
          <p className="m-0 text-[16px] font-bold text-bb-ink-soft">Parent area</p>
          <h1 className="mt-2 text-[30px] font-extrabold leading-tight" id="pin-title">
            Enter your 4-digit code
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-bb-ink-soft">
            This keeps the parent area separate from story time.
          </p>

          <form className="mt-7" onSubmit={handleSubmit}>
            <label className="block text-[16px] font-bold" htmlFor="parent-pin">
              Parent code
            </label>
            <input
              aria-describedby={showMismatch ? 'pin-message' : undefined}
              autoComplete="current-password"
              className="mt-2 h-14 w-full rounded-bb border-2 border-bb-sand bg-bb-cream px-4 text-center text-[24px] font-extrabold tracking-[0.45em] text-bb-ink outline-none placeholder:tracking-normal focus:border-bb-teal-deep"
              id="parent-pin"
              inputMode="numeric"
              maxLength={4}
              onChange={(event) => {
                setPin(onlyDigits(event.target.value));
                setShowMismatch(false);
              }}
              pattern="[0-9]*"
              placeholder="••••"
              type="password"
              value={pin}
            />
            {showMismatch ? (
              <p
                className="mt-4 rounded-bb bg-bb-sand px-4 py-3 text-[16px] leading-relaxed text-bb-ink-soft"
                id="pin-message"
                role="status"
              >
                That code doesn't match. Try again.
              </p>
            ) : null}
            <button
              className="bb-parent-target mt-6 w-full bg-bb-teal-deep px-5 text-[16px] font-extrabold text-bb-surface disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pin.length !== 4 || isChecking}
              type="submit"
            >
              {isChecking ? 'Checking code' : 'Open parent area'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
