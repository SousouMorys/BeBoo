# BeBoo — Build log

Append-only. After each milestone, add a dated entry: what was built, key
decisions, anything fixed. High-value ideas that are out of scope go under
**Proposed** instead of being built (see AGENTS.md → Scope guard).

---

## 2026-07-17 — Docs consolidated, models pinned

- Merged brainstorm outcomes into the docs set: added `ARCHITECTURE.md`
  (schema, pipeline states, deployment, build plan) and `STORY_RULES.md`
  (writing/check-in rules, generation prompt template, validator checklist,
  narration + image assembly). Added this build log.
- Key decisions:
  - Kept the Vite + Express + Prisma + Neon single-deploy stack over the
    earlier Next.js + Supabase + Vercel idea — a persistent server suits the
    async pipeline, and media-in-Postgres makes one-tap deletion a single
    cascade.
  - Pinned models to current API reality: DALL·E 3 was removed from the API
    (May 2026) → `gpt-image-1-mini` (dev) / `gpt-image-1.5` (demo) via the
    Edits endpoint with a cached character sheet; narration via
    `gpt-4o-mini-tts` (voice `marin`, steered instructions); karaoke timings
    via `whisper-1` word-level timestamps.
  - Added per-child narration speed (0.8×/1×) as a parent setting applied via
    `audio.playbackRate` — no extra child-facing control, no audio
    regeneration.
  - Added `reveal` to the check-in data shape so second-miss copy comes from
    generated data, not runtime improvisation.
  - Added the AI-generation disclosure to the parent zone (OpenAI
    usage-policy requirement).

## 2026-07-17 — Free hosting verified, structure finalized

- Renamed workspaces to `frontend/` and `backend/` across all docs.
- Free deployment locked and verified against current plans: **Neon Free**
  (permanent; 0.5 GB storage/project, 100 CU-hours/month, scale-to-zero) +
  **Render free web service** (750 h/month; spins down after 15 min idle,
  ~1 min wake — warm the URL before demos). Railway rejected: no ongoing
  free tier anymore. Render's own free Postgres rejected: 30-day expiry.
- Locked the static-first plan: Phase 1 builds the whole child zone on the
  mock `frontend/src/lib/api.ts` + seed JSON, no backend or database needed.
- First Codex session queued: scaffold + design system + seed data + C1/C2.

## 2026-07-17 — Seed stories reviewed, hardened, and validated

- Added `data/beboo-seed-stories.json` (3 stories: dentist / fire drill /
  plan change) after a rules pass. Fixed in the data: removed the all-caps
  "BEEP! BEEP!" line (the calm narration voice must never shout at a child
  scared of loud sounds); rewrote figurative language into literal sentences
  ("a storm inside his tummy", train/dinosaur similes); fixed sentence-count
  and 10-word budget violations and one past-tense slip; added the missing
  `reveal` line to all 6 check-ins; shortened one 9-word question; reduced
  the emotion set from 9 to the canonical 8 (replaced the "excited" option
  with "happy").
- Rules evolved where the seed's instinct was better than the doc:
  check-ins may sit on the final page (positive-emotion practice) with the
  bridge after; characterBlock now covers recurring adults (1–3 sentences);
  scene budget 60 words; bridge may be two short questions; interests ≤ 3;
  new rule — no all-caps sound effects in child text.
- Wrote a validation script mirroring the future `story/validate.ts`; the
  seed file passes with 0 errors.

## 2026-07-17 - Phase 1, Day 1 static child zone

- Scaffolded the npm-workspaces monorepo: a React 18 + Vite + strict
  TypeScript + Tailwind + React Router frontend and a deliberately empty
  backend placeholder for Phase 2. Root scripts now cover dev, build,
  typecheck, lint, test, and the future seed command.
- Built C1 Shelf and C2 Story Player against the sole mock data boundary,
  `frontend/src/lib/api.ts`. The three validated seed stories render with
  covers, most-recent-first local ordering, a local mock child profile
  (Sami), and no backend running.
- Added all 18 flat pastel placeholder SVG assets under `frontend/public/seed`:
  one cover plus five page illustrations for each seed story. Covers reuse
  their first-page art; no seed-story text changed.
- Implemented the Day 1 components and motion contracts: the shared emotion
  face set and BeBoo mascot, fixed player controls and progress dots, 14 s
  linear Ken Burns variants, a 280 ms page crossfade, reduced-motion support
  combining the mock child setting with `prefers-reduced-motion`, and a
  tap-only stub narration clock with proportional word highlighting. The
  clock resets on page changes; the final page returns to the shelf until
  C3/C4/C5 arrive.
- Key decisions and fixes:
  - Kept all client data knowledge inside `api.ts`, preserving the P3
    mock-to-real swap point.
  - Used the deeper teal for primary-button backgrounds after checking color
    contrast: `bb-teal` with light text is 2.79:1, while `bb-teal-deep` with
    `bb-surface` text is 5.82:1.
  - Kept the backend code-free, as required for the static-first milestone.
- Verification:
  - Reviewed the BRAND section 11 ship checklist against C1/C2: no autoplayed
    audio, score-like UI, error states, flashing, parallax, or child-visible
    timers; child touch targets are at least 64 px; copy is literal; controls
    stay in fixed positions; the reduced-motion CSS fallback is also present.
  - Manually checked the 390 px shelf and player, tap-to-start karaoke,
    narration reset on Next, page progress, and final-page shelf return.
  - `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test`
    pass. The Phase 1 Vitest command currently has no test files and uses
    `--passWithNoTests`; the planned non-trivial backend logic tests land in
    Phase 2.

## Proposed (not built)

- Printable PDF export of a story from the parent library, for practicing
  away from screens.
- Read-only share link for a story, so a co-parent or teacher can preview it.
- Optional display typeface (e.g. Baloo 2) for headings if the all-Nunito
  hierarchy feels flat in practice — BRAND.md stays the gate.
- Illustration style picker in P5 using the `styleOptions` shipped in the
  seed file (soft-3d, watercolor). For the hackathon, `storybook-flat` is
  the only style used; BRAND §10 stays locked.
