import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BebooMascot } from '../../components/BebooMascot';
import { BigButton } from '../../components/BigButton';
import { ProgressDots } from '../../components/ProgressDots';
import { api } from '../../lib/api';
import type { Child, SituationCategory, StoryGenerationInput } from '../../lib/types';

interface NewStoryWizardProps {
  onCancel: () => void;
  onGenerated: (storyId: string, request: StoryGenerationInput) => void;
}

type WizardStep = 'child' | 'situation' | 'options';

const categories: Array<{ id: SituationCategory; label: string; hint: string }> = [
  { id: 'health', label: 'Health', hint: 'Visits, appointments, or care' },
  { id: 'school', label: 'School', hint: 'A day, change, or practice' },
  { id: 'daily-life', label: 'Daily life', hint: 'Plans and everyday routines' },
  { id: 'social', label: 'Social', hint: 'People, play, or sharing space' },
  { id: 'custom', label: 'Describe your own', hint: 'A situation not listed here' },
];

const stepOrder: WizardStep[] = ['child', 'situation', 'options'];

function categoryFromQuery(value: string | null): SituationCategory {
  return value === 'health' || value === 'school' || value === 'daily-life' || value === 'social' || value === 'custom'
    ? value
    : 'health';
}

export function NewStoryWizard({ onCancel, onGenerated }: NewStoryWizardProps) {
  const [searchParams] = useSearchParams();
  const [child, setChild] = useState<Child | null | undefined>(undefined);
  const [step, setStep] = useState<WizardStep>('child');
  const [category, setCategory] = useState<SituationCategory>(() => categoryFromQuery(searchParams.get('category')));
  const [situationText, setSituationText] = useState('');
  const [length, setLength] = useState<3 | 4 | 5 | 6>(4);
  const [checkIns, setCheckIns] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    void api.getCurrentChild().then((currentChild) => {
      if (isCurrent) {
        setChild(currentChild);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const stepIndex = stepOrder.indexOf(step);

  async function generateStory() {
    if (!child || !situationText.trim() || isGenerating) {
      setError('Describe the situation before making the story.');
      return;
    }

    setError('');
    setIsGenerating(true);
    const request: StoryGenerationInput = {
      childId: child.id,
      childProfile: {
        firstName: child.firstName,
        pronoun: child.pronoun,
        readingLevel: child.readingLevel,
        interests: [...child.interests],
        companion: child.companion,
        settings: { ...child.settings },
      },
      situation: { category, text: situationText.trim() },
      length,
      checkIns,
    };

    try {
      const storyId = await api.generateStory(request);
      onGenerated(storyId, request);
    } catch {
      setError('We could not start this story. Please try again.');
      setIsGenerating(false);
    }
  }

  if (child === undefined) {
    return <LoadingWizard onCancel={onCancel} />;
  }

  if (!child) {
    return <LoadingWizard onCancel={onCancel} message="Set up a child profile before making a story." />;
  }

  return (
    <main className="min-h-[100dvh] bg-bb-cream px-5 py-8 text-bb-ink sm:px-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="m-0 text-[16px] font-bold text-bb-ink-soft">Parent area</p>
            <h1 className="mt-1 text-[30px] font-extrabold leading-tight">Make a new story</h1>
          </div>
          <ProgressDots activeIndex={stepIndex} total={3} />
        </header>

        {step === 'child' ? (
          <section className="mt-8 rounded-bb-lg bg-bb-surface p-6 shadow-sm sm:p-8">
            <div className="flex justify-center"><BebooMascot expression="happy" /></div>
            <h2 className="mt-5 text-center text-[24px] font-extrabold">Pick a child</h2>
            <button
              aria-pressed="true"
              className="bb-parent-target mt-6 flex w-full items-center gap-4 border-2 border-bb-teal-deep bg-bb-sand px-5 text-left"
              onClick={() => setError('')}
              type="button"
            >
              <BebooMascot expression="calm" size={48} />
              <span><strong className="block text-[18px]">{child.firstName}</strong><span className="text-[16px] text-bb-ink-soft">This child is selected.</span></span>
            </button>
            <div className="mt-7 flex justify-between gap-3"><button className="bb-parent-target px-4 text-[16px] font-bold text-bb-teal-deep" onClick={onCancel} type="button">Back to library</button><BigButton onClick={() => setStep('situation')} className="min-w-[150px]">Continue</BigButton></div>
          </section>
        ) : null}

        {step === 'situation' ? (
          <section className="mt-8 rounded-bb-lg bg-bb-surface p-6 shadow-sm sm:p-8">
            <h2 className="m-0 text-[24px] font-extrabold">Choose a situation</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2" role="group" aria-label="Situation category">
              {categories.map((item) => <button aria-pressed={category === item.id} className={`bb-parent-target rounded-bb border-2 px-4 py-3 text-left ${category === item.id ? 'border-bb-teal-deep bg-bb-sand' : 'border-bb-sand bg-bb-surface hover:bg-bb-sand'}`} key={item.id} onClick={() => setCategory(item.id)} type="button"><strong className="block text-[16px]">{item.label}</strong><span className="mt-1 block text-[14px] text-bb-ink-soft">{item.hint}</span></button>)}
            </div>
            <label className="mt-6 grid gap-2 text-[16px] font-bold" htmlFor="story-situation">Describe the situation<textarea className="min-h-28 rounded-bb border-2 border-bb-sand bg-bb-surface px-4 py-3 font-normal text-bb-ink outline-none hover:bg-bb-sand" id="story-situation" maxLength={280} onChange={(event) => setSituationText(event.target.value)} placeholder="For example, waiting for a turn at the doctor." value={situationText} /></label>
            <div className="mt-7 flex justify-between gap-3"><button className="bb-parent-target px-4 text-[16px] font-bold text-bb-teal-deep" onClick={() => setStep('child')} type="button">Back</button><BigButton onClick={() => situationText.trim() ? setStep('options') : setError('Describe the situation before continuing.')} className="min-w-[150px]">Continue</BigButton></div>
            {error ? <p className="mt-4 rounded-bb bg-bb-sand px-4 py-3 text-[16px] text-bb-ink-soft" role="status">{error}</p> : null}
          </section>
        ) : null}

        {step === 'options' ? (
          <section className="mt-8 rounded-bb-lg bg-bb-surface p-6 shadow-sm sm:p-8">
            <h2 className="m-0 text-[24px] font-extrabold">Story options</h2>
            <fieldset className="mt-6"><legend className="text-[16px] font-bold">Story length</legend><div className="mt-3 grid grid-cols-4 gap-2">{([3, 4, 5, 6] as const).map((value) => <button aria-pressed={length === value} className={`bb-parent-target border-2 text-[16px] font-extrabold ${length === value ? 'border-bb-teal-deep bg-bb-teal-deep text-bb-surface' : 'border-bb-sand bg-bb-surface text-bb-ink hover:bg-bb-sand'}`} key={value} onClick={() => setLength(value)} type="button">{value}</button>)}</div><p className="mb-0 mt-2 text-[14px] text-bb-ink-soft">Choose 3 to 6 pages.</p></fieldset>
            <label className="bb-parent-target bb-token-label mt-7 flex cursor-pointer items-center gap-3 rounded-bb bg-bb-cream px-4 text-[16px]"><input checked={checkIns} className="bb-token-input sr-only" onChange={(event) => setCheckIns(event.target.checked)} type="checkbox" /><span aria-hidden="true" className="bb-token-control bb-token-checkbox" /><span>Add gentle emotion check-ins</span></label>
            {error ? <p className="mt-5 rounded-bb bg-bb-sand px-4 py-3 text-[16px] text-bb-ink-soft" role="status">{error}</p> : null}
            <div className="mt-7 flex justify-between gap-3"><button className="bb-parent-target px-4 text-[16px] font-bold text-bb-teal-deep" onClick={() => setStep('situation')} type="button">Back</button><BigButton className="min-w-[150px]" disabled={isGenerating} onClick={() => void generateStory()}>{isGenerating ? 'Starting story' : 'Generate story'}</BigButton></div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function LoadingWizard({ onCancel, message = 'Loading the child profile.' }: { onCancel: () => void; message?: string }) {
  return <main className="min-h-[100dvh] bg-bb-cream px-5 py-10 text-bb-ink sm:px-8"><div className="mx-auto max-w-xl rounded-bb-lg bg-bb-surface p-7 shadow-sm"><p className="text-[16px] text-bb-ink-soft">{message}</p><button className="bb-parent-target mt-4 bg-bb-teal-deep px-5 text-[16px] font-extrabold text-bb-surface" onClick={onCancel} type="button">Back to library</button></div></main>;
}
