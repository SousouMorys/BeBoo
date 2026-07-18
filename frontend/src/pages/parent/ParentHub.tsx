import { useEffect, useState } from 'react';
import { EmotionFace } from '../../components/EmotionFace';
import { api } from '../../lib/api';
import { emotionIds } from '../../lib/types';
import type { Child, Dashboard, Story } from '../../lib/types';

interface ParentHubProps {
  onExit: () => void;
  onNewStory: () => void;
}

type ParentTab = 'library' | 'progress' | 'settings';

interface ParentModel {
  child: Child;
  dashboard: Dashboard | null;
  stories: Story[];
}

const tabs: Array<{ id: ParentTab; label: string }> = [
  { id: 'library', label: 'Library' },
  { id: 'progress', label: 'Progress' },
  { id: 'settings', label: 'Settings' },
];

function settingValue(value: boolean, onLabel: string, offLabel: string): string {
  return value ? onLabel : offLabel;
}

export function ParentHub({ onExit, onNewStory }: ParentHubProps) {
  const [model, setModel] = useState<ParentModel | null>(null);
  const [activeTab, setActiveTab] = useState<ParentTab>('library');

  useEffect(() => {
    let isCurrent = true;

    async function loadParentHub() {
      const child = await api.getCurrentChild();
      if (!child || !isCurrent) {
        return;
      }

      const [stories, dashboard] = await Promise.all([
        api.listStories(),
        api.getDashboard(child.id).catch(() => null),
      ]);
      if (isCurrent && child) {
        setModel({ child, dashboard, stories });
      }
    }

    void loadParentHub();
    return () => {
      isCurrent = false;
    };
  }, []);

  if (!model) {
    return (
      <main className="min-h-[100dvh] bg-bb-cream px-5 py-10 text-bb-ink sm:px-8">
        <div className="mx-auto max-w-xl rounded-bb-lg bg-bb-surface p-7 shadow-sm">
          <p className="text-[16px] leading-relaxed text-bb-ink-soft">Loading the parent area.</p>
          <button
            className="bb-parent-target mt-4 bg-bb-teal-deep px-5 text-[16px] font-extrabold text-bb-surface"
            onClick={onExit}
            type="button"
          >
            My stories
          </button>
        </div>
      </main>
    );
  }

  const { child, dashboard, stories } = model;
  const feelingCounts = emotionIds
    .map((emotionId) => ({
      emotionId,
      count: dashboard?.feelings.last7Days.find((feeling) => feeling.emotionId === emotionId)?.count ?? 0,
    }))
    .filter((feeling) => feeling.count > 0);

  return (
    <main className="min-h-[100dvh] bg-bb-cream px-5 py-8 text-bb-ink sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="m-0 text-[16px] font-bold text-bb-ink-soft">Parent area</p>
            <h1 className="mt-1 text-[30px] font-extrabold leading-tight">BeBoo for {child.firstName}</h1>
          </div>
          <button
            className="bb-parent-target border-2 border-bb-sand bg-bb-surface px-4 text-[16px] font-extrabold text-bb-teal-deep"
            onClick={onExit}
            type="button"
          >
            My stories
          </button>
        </header>

        <nav aria-label="Parent area sections" className="mt-8 border-b-2 border-bb-sand">
          <div className="flex gap-2" role="tablist">
            {tabs.map((tab) => (
              <button
                aria-controls={`${tab.id}-panel`}
                aria-selected={activeTab === tab.id}
                className={`bb-parent-target px-4 text-[16px] font-extrabold ${
                  activeTab === tab.id
                    ? 'bg-bb-teal-deep text-bb-surface'
                    : 'bg-transparent text-bb-ink-soft'
                }`}
                id={`${tab.id}-tab`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {activeTab === 'library' ? (
          <section
            aria-labelledby="library-tab"
            className="mt-7"
            id="library-panel"
            role="tabpanel"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="m-0 text-[24px] font-extrabold">Story library</h2>
                <p className="mt-2 text-[16px] text-bb-ink-soft">Stories ready for calm reading together.</p>
              </div>
              <button
                className="bb-parent-target bg-bb-teal-deep px-4 text-[16px] font-extrabold text-bb-surface"
                onClick={onNewStory}
                type="button"
              >
                Make a story
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <article className="overflow-hidden rounded-bb bg-bb-surface shadow-sm" key={story.id}>
                  <img alt="" className="aspect-[4/3] w-full object-cover" src={story.coverUrl} />
                  <div className="p-5">
                    <p className="m-0 text-[14px] font-bold text-bb-ink-soft">{story.situationCategory}</p>
                    <h3 className="mt-1 text-[20px] font-extrabold leading-snug">{story.title}</h3>
                    <p className="mb-0 text-[16px] text-bb-ink-soft">{story.pages.length} pages</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'progress' ? (
          <section
            aria-labelledby="progress-tab"
            className="mt-7 rounded-bb-lg bg-bb-surface p-6 shadow-sm sm:p-8"
            id="progress-panel"
            role="tabpanel"
          >
            <h2 className="m-0 text-[24px] font-extrabold">Feelings {child.firstName} shared</h2>
            <p className="mt-1 text-[16px] font-bold text-bb-ink-soft">Last 7 days</p>
            {feelingCounts.length > 0 ? (
              <ul aria-label={`Feelings ${child.firstName} shared in the last 7 days`} className="mt-6 flex list-none flex-wrap gap-3 p-0">
                {feelingCounts.map(({ emotionId, count }) => (
                  <li
                    className="flex min-h-11 items-center gap-2 rounded-bb bg-bb-sand px-3 py-2 text-[16px] font-extrabold text-bb-ink"
                    key={emotionId}
                  >
                    <EmotionFace emotion={emotionId} label={`${emotionId} feeling`} size={44} />
                    <span>{emotionId}</span>
                    <span aria-label={`${count} shared`} className="text-bb-ink-soft">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-0 mt-6 text-[16px] text-bb-ink-soft">No feelings shared yet.</p>
            )}
          </section>
        ) : null}

        {activeTab === 'settings' ? (
          <section
            aria-labelledby="settings-tab"
            className="mt-7 rounded-bb-lg bg-bb-surface p-6 shadow-sm sm:p-8"
            id="settings-panel"
            role="tabpanel"
          >
            <h2 className="m-0 text-[24px] font-extrabold">Profile settings</h2>
            <p className="mt-2 text-[16px] text-bb-ink-soft">These settings are read-only for now.</p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-bb bg-bb-cream p-4">
                <dt className="text-[14px] font-bold text-bb-ink-soft">First name</dt>
                <dd className="mt-1 text-[18px] font-extrabold">{child.firstName}</dd>
              </div>
              <div className="rounded-bb bg-bb-cream p-4">
                <dt className="text-[14px] font-bold text-bb-ink-soft">Pronouns</dt>
                <dd className="mt-1 text-[18px] font-extrabold">{child.pronoun}</dd>
              </div>
              <div className="rounded-bb bg-bb-cream p-4">
                <dt className="text-[14px] font-bold text-bb-ink-soft">Reading level</dt>
                <dd className="mt-1 text-[18px] font-extrabold">{child.readingLevel}</dd>
              </div>
              <div className="rounded-bb bg-bb-cream p-4">
                <dt className="text-[14px] font-bold text-bb-ink-soft">Companion</dt>
                <dd className="mt-1 text-[18px] font-extrabold">{child.companion}</dd>
              </div>
              <div className="rounded-bb bg-bb-cream p-4 sm:col-span-2">
                <dt className="text-[14px] font-bold text-bb-ink-soft">Interests</dt>
                <dd className="mt-1 text-[18px] font-extrabold">
                  {child.interests.length > 0 ? child.interests.join(', ') : 'No interests added'}
                </dd>
              </div>
            </dl>

            <h3 className="mt-7 text-[20px] font-extrabold">Sensory preferences</h3>
            <ul className="mt-4 grid list-none gap-3 p-0 text-[16px] sm:grid-cols-2">
              <li className="rounded-bb bg-bb-sand px-4 py-3">
                Animations: {settingValue(child.settings.reduceAnimations, 'reduced', 'on')}
              </li>
              <li className="rounded-bb bg-bb-sand px-4 py-3">
                Word highlighting: {settingValue(child.settings.highlighting, 'on', 'off')}
              </li>
              <li className="rounded-bb bg-bb-sand px-4 py-3">
                Emotion check-ins: {settingValue(child.settings.checkIns, 'on', 'off')}
              </li>
              <li className="rounded-bb bg-bb-sand px-4 py-3">
                Gentle ambience: {settingValue(child.settings.ambience, 'on', 'off')}
              </li>
              <li className="rounded-bb bg-bb-sand px-4 py-3">
                Narration speed: {child.settings.narrationSpeed}x
              </li>
              <li className="rounded-bb bg-bb-sand px-4 py-3">Autoplay: always off</li>
            </ul>
            <p className="mt-7 mb-0 rounded-bb bg-bb-sky px-4 py-3 text-[16px] leading-relaxed text-bb-ink-soft">
              Stories and narration are AI-generated.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
