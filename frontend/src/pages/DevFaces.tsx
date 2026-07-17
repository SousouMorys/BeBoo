import { EmotionFace } from '../components/EmotionFace';
import { emotionIds } from '../lib/types';

export function DevFaces() {
  return (
    <main className="min-h-[100dvh] bg-bb-cream px-6 py-10 text-bb-ink">
      <section className="mx-auto max-w-3xl">
        <p className="mb-2 text-[16px] font-bold text-bb-ink-soft">Development review</p>
        <h1 className="m-0 text-[32px] font-extrabold">BeBoo emotion faces</h1>
        <p className="mt-3 max-w-xl text-[18px] leading-relaxed text-bb-ink-soft">
          The one shared face set for child check-ins and future progress views.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {emotionIds.map((emotion) => (
            <div className="rounded-bb bg-bb-surface p-4 text-center shadow-sm" key={emotion}>
              <EmotionFace emotion={emotion} label={`${emotion} emotion`} size={112} />
              <p className="mb-0 mt-3 text-[18px] font-extrabold text-bb-ink">{emotion}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
