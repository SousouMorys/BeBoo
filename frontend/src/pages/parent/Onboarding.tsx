import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { BebooMascot } from '../../components/BebooMascot';
import { ProgressDots } from '../../components/ProgressDots';
import { api } from '../../lib/api';
import type { ChildInput, ReadingLevel } from '../../lib/types';

interface OnboardingProps {
  onComplete: () => void;
}

type SetupStep = 'welcome' | 'profile' | 'pin';
type CompanionChoice = 'BeBoo' | 'none' | 'custom';

const defaultSettings: ChildInput['settings'] = {
  reduceAnimations: false,
  highlighting: true,
  checkIns: true,
  ambience: false,
  narrationSpeed: 1,
};

const sensoryOptions: Array<{
  key: 'reduceAnimations' | 'highlighting' | 'checkIns' | 'ambience';
  label: string;
}> = [
  { key: 'reduceAnimations', label: 'Reduce animations' },
  { key: 'highlighting', label: 'Show word highlighting' },
  { key: 'checkIns', label: 'Show emotion check-ins' },
  { key: 'ambience', label: 'Play gentle ambience' },
];

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<SetupStep>('welcome');
  const [firstName, setFirstName] = useState('');
  const [pronoun, setPronoun] = useState('they/them');
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>('beginner');
  const [interests, setInterests] = useState<string[]>([]);
  const [interestDraft, setInterestDraft] = useState('');
  const [companionChoice, setCompanionChoice] = useState<CompanionChoice>('BeBoo');
  const [customCompanion, setCustomCompanion] = useState('');
  const [settings, setSettings] = useState(defaultSettings);
  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  function addInterest() {
    const interest = interestDraft.trim();
    if (!interest || interests.length >= 3 || interests.includes(interest)) {
      return;
    }
    setInterests([...interests, interest]);
    setInterestDraft('');
  }

  function handleInterestKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addInterest();
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firstName.trim()) {
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      await api.createChild({
        firstName,
        pronoun,
        readingLevel,
        interests,
        companion: companionChoice === 'custom' ? customCompanion : companionChoice,
        settings,
      });
      setStep('pin');
    } catch {
      setError('We could not save the profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function savePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin.length !== 4) {
      return;
    }

    setIsSaving(true);
    try {
      await api.setPin(pin);
      onComplete();
    } catch {
      setError('We could not save the code. Please try again.');
      setIsSaving(false);
    }
  }

  const stepIndex = step === 'welcome' ? 0 : step === 'profile' ? 1 : 2;

  return (
    <main className="min-h-[100dvh] bg-bb-cream px-5 py-8 text-bb-ink sm:px-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="m-0 text-[18px] font-extrabold text-bb-teal-deep">beboo</p>
          <ProgressDots activeIndex={stepIndex} total={3} />
        </div>

        {step === 'welcome' ? (
          <section className="rounded-bb-lg bg-bb-surface p-7 text-center shadow-sm sm:p-10">
            <div className="flex justify-center">
              <BebooMascot expression="happy" size={132} />
            </div>
            <h1 className="mt-6 text-[32px] font-extrabold leading-tight">Welcome to BeBoo.</h1>
            <p className="mx-auto mt-4 max-w-md text-[18px] leading-relaxed text-bb-ink-soft">
              Set up a calm story space for your child.
            </p>
            <button
              className="bb-parent-target mt-8 w-full bg-bb-teal-deep px-5 text-[16px] font-extrabold text-bb-surface sm:w-auto"
              onClick={() => setStep('profile')}
              type="button"
            >
              Set up profile
            </button>
          </section>
        ) : null}

        {step === 'profile' ? (
          <form className="rounded-bb-lg bg-bb-surface p-6 shadow-sm sm:p-8" onSubmit={saveProfile}>
            <h1 className="m-0 text-[30px] font-extrabold leading-tight">Child profile</h1>
            <p className="mt-2 text-[16px] leading-relaxed text-bb-ink-soft">
              These choices help shape story time.
            </p>

            <div className="mt-7 grid gap-5">
              <label className="grid gap-2 text-[16px] font-bold" htmlFor="child-first-name">
                First name
                <input
                  autoComplete="given-name"
                  className="h-12 rounded-bb border-2 border-bb-sand bg-bb-cream px-4 font-normal text-bb-ink outline-none focus:border-bb-teal-deep"
                  id="child-first-name"
                  maxLength={40}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  value={firstName}
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-[16px] font-bold" htmlFor="child-pronoun">
                  Pronouns
                  <select
                    className="h-12 rounded-bb border-2 border-bb-sand bg-bb-cream px-4 font-normal text-bb-ink outline-none focus:border-bb-teal-deep"
                    id="child-pronoun"
                    onChange={(event) => setPronoun(event.target.value)}
                    value={pronoun}
                  >
                    <option value="she/her">she/her</option>
                    <option value="he/him">he/him</option>
                    <option value="they/them">they/them</option>
                  </select>
                </label>
                <label className="grid gap-2 text-[16px] font-bold" htmlFor="reading-level">
                  Reading level
                  <select
                    className="h-12 rounded-bb border-2 border-bb-sand bg-bb-cream px-4 font-normal text-bb-ink outline-none focus:border-bb-teal-deep"
                    id="reading-level"
                    onChange={(event) => setReadingLevel(event.target.value as ReadingLevel)}
                    value={readingLevel}
                  >
                    <option value="pre-reader">pre-reader</option>
                    <option value="beginner">beginner</option>
                    <option value="reader">reader</option>
                  </select>
                </label>
              </div>

              <fieldset className="rounded-bb border-2 border-bb-sand p-4">
                <legend className="px-2 text-[16px] font-bold">Interests (up to 3)</legend>
                <div className="flex gap-2">
                  <input
                    className="h-12 min-w-0 flex-1 rounded-bb border-2 border-bb-sand bg-bb-cream px-4 text-bb-ink outline-none focus:border-bb-teal-deep"
                    disabled={interests.length >= 3}
                    maxLength={40}
                    onChange={(event) => setInterestDraft(event.target.value)}
                    onKeyDown={handleInterestKeyDown}
                    placeholder="For example, trains"
                    value={interestDraft}
                  />
                  <button
                    className="bb-parent-target bg-bb-sand px-4 text-[16px] font-extrabold text-bb-ink disabled:opacity-50"
                    disabled={!interestDraft.trim() || interests.length >= 3}
                    onClick={addInterest}
                    type="button"
                  >
                    Add
                  </button>
                </div>
                {interests.length > 0 ? (
                  <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                    {interests.map((interest) => (
                      <li key={interest}>
                        <button
                          aria-label={`Remove ${interest}`}
                          className="bb-parent-target bg-bb-sky px-3 text-[16px] font-bold text-bb-ink"
                          onClick={() => setInterests(interests.filter((item) => item !== interest))}
                          type="button"
                        >
                          {interest} ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </fieldset>

              <label className="grid gap-2 text-[16px] font-bold" htmlFor="companion-choice">
                Companion
                <select
                  className="h-12 rounded-bb border-2 border-bb-sand bg-bb-cream px-4 font-normal text-bb-ink outline-none focus:border-bb-teal-deep"
                  id="companion-choice"
                  onChange={(event) => setCompanionChoice(event.target.value as CompanionChoice)}
                  value={companionChoice}
                >
                  <option value="BeBoo">BeBoo</option>
                  <option value="none">none</option>
                  <option value="custom">Describe a companion</option>
                </select>
              </label>
              {companionChoice === 'custom' ? (
                <label className="grid gap-2 text-[16px] font-bold" htmlFor="custom-companion">
                  Companion description
                  <input
                    className="h-12 rounded-bb border-2 border-bb-sand bg-bb-cream px-4 font-normal text-bb-ink outline-none focus:border-bb-teal-deep"
                    id="custom-companion"
                    maxLength={80}
                    onChange={(event) => setCustomCompanion(event.target.value)}
                    required
                    value={customCompanion}
                  />
                </label>
              ) : null}

              <fieldset className="rounded-bb border-2 border-bb-sand p-4">
                <legend className="px-2 text-[16px] font-bold">Sensory preferences</legend>
                <div className="grid gap-2">
                  {sensoryOptions.map(({ key, label }) => (
                    <label className="flex min-h-11 items-center gap-3 text-[16px]" key={key}>
                      <input
                        checked={settings[key]}
                        className="h-5 w-5 accent-bb-teal-deep"
                        onChange={(event) =>
                          setSettings({
                            ...settings,
                            [key]: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-[16px] font-bold">Narration speed</p>
                  <div className="flex flex-wrap gap-2">
                    {[0.8, 1].map((speed) => (
                      <label className="flex min-h-11 items-center gap-2 rounded-bb bg-bb-cream px-3 text-[16px]" key={speed}>
                        <input
                          checked={settings.narrationSpeed === speed}
                          name="narration-speed"
                          onChange={() => setSettings({ ...settings, narrationSpeed: speed as 0.8 | 1 })}
                          type="radio"
                        />
                        {speed}×
                      </label>
                    ))}
                  </div>
                </div>
                <p className="mt-4 mb-0 rounded-bb bg-bb-sand px-3 py-3 text-[16px] text-bb-ink-soft">
                  Autoplay is always off. Your child starts audio with the speaker button.
                </p>
              </fieldset>
            </div>

            {error ? <p className="mt-5 text-[16px] text-bb-ink-soft">{error}</p> : null}
            <div className="mt-7 flex flex-wrap justify-between gap-3">
              <button className="bb-parent-target px-4 text-[16px] font-bold text-bb-teal-deep" onClick={() => setStep('welcome')} type="button">
                Back
              </button>
              <button
                className="bb-parent-target bg-bb-teal-deep px-5 text-[16px] font-extrabold text-bb-surface disabled:opacity-50"
                disabled={!firstName.trim() || isSaving}
                type="submit"
              >
                {isSaving ? 'Saving profile' : 'Continue to parent code'}
              </button>
            </div>
          </form>
        ) : null}

        {step === 'pin' ? (
          <form className="rounded-bb-lg bg-bb-surface p-7 shadow-sm sm:p-10" onSubmit={savePin}>
            <div className="flex justify-center">
              <BebooMascot expression="calm" size={112} />
            </div>
            <h1 className="mt-6 text-center text-[30px] font-extrabold leading-tight">Set a parent code</h1>
            <p className="mt-3 text-center text-[16px] leading-relaxed text-bb-ink-soft">
              Use four digits to open the parent area.
            </p>
            <label className="mt-7 block text-[16px] font-bold" htmlFor="new-pin">
              4-digit code
              <input
                autoComplete="new-password"
                className="mt-2 h-14 w-full rounded-bb border-2 border-bb-sand bg-bb-cream px-4 text-center text-[24px] font-extrabold tracking-[0.45em] text-bb-ink outline-none focus:border-bb-teal-deep"
                id="new-pin"
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => setPin(onlyDigits(event.target.value))}
                pattern="[0-9]*"
                placeholder="••••"
                type="password"
                value={pin}
              />
            </label>
            {error ? <p className="mt-5 text-[16px] text-bb-ink-soft">{error}</p> : null}
            <div className="mt-7 flex flex-wrap justify-between gap-3">
              <button className="bb-parent-target px-4 text-[16px] font-bold text-bb-teal-deep" onClick={() => setStep('profile')} type="button">
                Back
              </button>
              <button
                className="bb-parent-target bg-bb-teal-deep px-5 text-[16px] font-extrabold text-bb-surface disabled:opacity-50"
                disabled={pin.length !== 4 || isSaving}
                type="submit"
              >
                {isSaving ? 'Saving code' : 'Finish setup'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </main>
  );
}
