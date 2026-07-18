# BeBoo — Practice section

Scope addition approved 2026-07-18. Extends `docs/PRODUCT.md`: the child zone
gains a Practice area (C6–C9) and the parent Progress tab gains one block.
`docs/BRAND.md` applies unchanged — no new tokens, no new emotion faces, no
new motion types.

Purpose in one line: fast, repeatable regulation tools the child can reach
any time. The product loop becomes: **learn it in the story → rehearse it in
the story (C2a/C2b) → use it any time (Practice) → the parent sees it
(dashboard).**

## 1. Evidence (reuse in README + video)

- Choice-making is an evidence-based antecedent intervention for autistic
  children — offering control improves engagement, behavior, and affect. A
  small fixed menu of tools is choice-making.
- Many autistic children have co-occurring alexithymia / interoception
  differences: identifying feelings from body signals is hard. A simple,
  visual "how I feel" check-in using the familiar symbol set is real
  practice, not decoration.
- Slow breathing and self-administered pressure (hand squeezes, hugs) are
  standard, low-risk calming strategies; self-administration keeps the child
  in control, which itself reduces anxiety. Hence: tap-to-start, always
  skippable, never tested.
- Skills transfer when symbols and strategies stay identical across
  contexts — Practice reuses the exact story-side components (shared
  `EmotionFace` set, C2a breathing circle).
- Calming skills are best learned while already calm — so positive feelings
  still invite practice ("You can practice breathing now.").

## 2. Entry point — C1 shelf amendment

- One fixed full-width `bb-sand` card between the greeting and the cover
  grid: small BeBoo + label "Practice". ≥64 px tall, same position on every
  visit, present even when the shelf is empty.
- No other C1 changes. C5 ending keeps exactly its two buttons — the shelf
  is the only bridge into Practice.

## 3. C6 — Practice menu (`/practice`)

- BeBoo + one line: "You can practice feeling calm."
- Three buttons, fixed order, ≥64 px: "How I feel now" · "Breathe with
  BeBoo" · "Squeeze and hug".
- Fixed top-left home control → shelf. Nothing else on the screen.

## 4. C7 — How I feel now (`/practice/feelings`)

- Question: "How do you feel now?" + all 8 canonical `EmotionFace` buttons
  in a 2×4 grid, lowercase labels, ≥64 px, generous spacing.
- Documented exception to the max-4-interactive-elements guideline: this is
  ONE decision over a familiar, identical symbol set, and self-report needs
  the full vocabulary — a subset would tell the child some feelings are not
  allowed here.
- On tap: record a `FeelingLog` (fire-and-forget — if the request fails the
  child experience is identical; there is no error state), 280 ms crossfade
  to the acknowledgment state, BeBoo nod (same 200 ms nod as check-in
  success).
- Acknowledgment copy (exact strings):

| feeling | line 1 | line 2 |
|---|---|---|
| happy | You feel happy. That is good! | You can practice breathing now. |
| calm | You feel calm. That is good. | You can practice breathing now. |
| proud | You feel proud. That is good. | You can practice breathing now. |
| sad | You feel sad. That is okay. | Breathing can help. Squeezing can help. |
| angry | You feel angry. That is okay. | Breathing can help. Squeezing can help. |
| scared | You feel scared. That is okay. | Breathing can help. Squeezing can help. |
| nervous | You feel nervous. That is okay. | Breathing can help. Squeezing can help. |
| disappointed | You feel disappointed. That is okay. | Breathing can help. Squeezing can help. |

- Below the lines, the SAME two buttons for every feeling, in fixed
  positions: "Breathe with BeBoo" · "Squeeze and hug". Fixed back
  control → C6.
- No correctness, no scoring, no adaptive coupling — self-report is not
  recognition practice, so it never feeds `nextFocus`.

## 5. C8 — Breathe with BeBoo (`/practice/breathe`)

- Reuse the C2a breathing circle component exactly: `bb-teal` circle, tap
  "Start breathing" (never auto), grows 4 s with "Breathe in.", shrinks 4 s
  with "Breathe out.", 3 cycles, BeBoo alongside. If the C2a component does
  not exist yet, build it to the C2a spec as a shared component first.
- Always skippable: the fixed back control works mid-cycle, no confirmation,
  no penalty.
- Reduced motion (profile setting OR `prefers-reduced-motion`): circle
  static, text cues advance on tap.
- End state: "All done! Breathing helps your body feel calm." + button
  "Breathe again". No cycle counters, no countdown numbers, no seconds
  visible anywhere.

## 6. C9 — Squeeze and hug (`/practice/squeeze`)

- Static SVG: BeBoo hugging a soft pillow — circles and ellipses only,
  brand palette, drawn in-app (no generated image).
- Exact copy, nothing else:
  - "You can squeeze your hands together."
  - "Squeeze slowly. Then open your hands."
  - "You can hug someone you trust."
  - "Squeezing helps your body feel calm."
- No interaction, no tracking. Fixed back control → C6.

## 7. Data & API

- Prisma: `FeelingLog { id, childId (→ Child, onDelete: Cascade),
  emotionId (one of the 8), createdAt }` + migration. One-tap delete wipes
  it with the child.
- `POST /api/practice/feelings` `{childId, emotionId}` — Zod-validated,
  `emotionId` ∈ the 8 → `201 {id}`.
- `GET /api/dashboard/:childId` response gains
  `feelings: { last7Days: [{emotionId, count}] }`.
- The frontend touches all of this only through `frontend/src/lib/api.ts`.

## 8. Parent dashboard — one block (Progress tab)

- Title: "Feelings {name} shared" · subtitle "Last 7 days".
- Row of `EmotionFace` chips (parent size ≥44 px) with counts; show only
  feelings with count > 0.
- Empty state: "No feelings shared yet." in `bb-ink-soft`. No trends, no
  alerts, no red.

## 9. Do not build (explicit)

No "Where are you?" location question. No quiet-place countdown or any
timer screen. No "Do you feel a bit better?" follow-up — coping tools are
never tested. No 9th emotion (no "tired"). No third button on C5. No
sounds, reminders, streaks, or child-visible practice history. No new
settings toggle this pass — Practice respects the existing reduced-motion
setting; a visibility toggle can join P5 later.

## 10. Ship check

Run `docs/BRAND.md` §11 on C6–C9 and the shelf amendment. Extra eyes on:
faces from the one shared SVG set only; fixed control positions across all
four screens; zero numbers or timers visible; reduced-motion pass on C8.
