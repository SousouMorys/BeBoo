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

## 2026-07-18 - Phase 1, Day 2 child flow and parent shell

- Added the one shared `EmotionFace` SVG component for all eight canonical
  emotions and the development-only `/dev/faces` review route. The child
  check-in choices now all use that single component.
- Completed the child story flow: C3 check-ins appear after configured story
  pages, persist each attempt through `api.ts`, give a warm first-miss
  scaffold, reveal the answer after a second miss, and use a single 200 ms
  highlight/nod success response. C4 bridge questions and C5 ending controls
  now follow the final story page (or its final check-in).
- Reworked the mock data boundary into a localStorage-backed Phase 1 store for
  the child profile, PIN, story recency, PIN attempts, and check-in attempts.
  The UI accesses none of that storage directly. The child profile now carries
  sensory preferences, with autoplay forced off by the API.
- Added the first-run onboarding sequence (welcome, profile and sensory form,
  then 4-digit PIN), the discreet shelf parent icon, P0 PIN gate, and P1
  Library / Progress / Settings shell. Parent access resets on a page reload
  and requires PIN verification again.
- Key decisions and fixes:
  - The player builds its complete page -> optional check-in -> bridge ->
    ending flow from story data, so disabling check-ins removes only those
    steps without changing the player UI.
  - Added an onboarding-complete guard so an interrupted setup cannot expose
    the child shelf before a PIN has been saved.
  - Kept all new motion to the brand limits: 280 ms crossfades and single
    200 ms nod/glow/wave feedback, all disabled by reduced motion.
- Verification:
  - Reviewed new child and parent screens against the BRAND ship checklist.
    Child controls are at least 64 px; parent controls are at least 44 px;
    no red error treatments, scores, story locks, timers, autoplay, or sound were
    added.
  - Manually tested the 390 px onboarding, neutral PIN mismatch, parent tabs,
    check-in scaffold/reveal/correct paths, bridge, ending, and `/dev/faces`.
  - `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test`
    pass. The test command remains configured to pass while Phase 1 has no
    dedicated test files.

## 2026-07-18 - Phase 1 polish before Phase 2

- Removed browser-default blue treatment from the frontend: `bb-teal` is now
  the global accent color; text fields, selects, and buttons receive a visible
  `bb-teal-deep` focus ring and a matching pressed treatment; text selection
  uses the palette too.
- Replaced the onboarding's native sensory checkboxes and narration-speed
  radios with accessible, token-styled controls. Their visual controls carry
  the focused, checked, and pressed states while the underlying inputs retain
  their native form semantics.
- Matched the resolved check-in footer structure to the story footer and
  reserved a stable scrollbar gutter. This keeps the home control and the
  Next control in fixed coordinates when moving between a scrollable story
  page and a shorter check-in screen.
- Verification:
  - Ran the BRAND section 11 checklist against onboarding, PIN gate, and all
    Parent Hub tabs: the screens remain calm, literal, contrast-safe, free of
    autoplay/flashing/red/score/timer UI, and use parent-sized 44 px targets.
  - Visually reviewed focused and pressed control states for onboarding text
    fields, selects, custom checkboxes/radios, PIN entry, parent navigation,
    and parent tabs. Measured matching 64 px Next/footer geometry between the
    story player and resolved check-in after the scrollbar fix.
  - `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test`
    pass. Vitest still has no Phase 1 test files and exits through
    `--passWithNoTests`.

## 2026-07-18 - Select styling follow-up

- Added the shared `SelectField` component for every in-app select (pronouns,
  reading level, and companion), with a custom chevron, token colors,
  light-only native controls, and no browser-blue focus treatment. Audited the
  remaining native inputs: checkboxes and radios already use the token
  controls; text/password inputs already use token classes; no number inputs
  or textareas are currently rendered. `npm run typecheck`, `npm run lint`,
  and `npm run build` pass.

## 2026-07-18 - Native select popup fix

- Replaced the native select popup inside `SelectField` with a fully in-app,
  keyboard-operable button/listbox. The opened options now use only
  `bb-surface`, `bb-sand`, and `bb-teal-deep`, so the operating system cannot
  inject its blue selected-option treatment. Verified opening, selection, and
  closing in the frontend preview; `npm run typecheck`, `npm run lint`, and
  `npm run build` pass.

## 2026-07-18 - Phase 2 illustration contract

- Locked `soft-3d` as BeBoo's official illustration style. The approved prompt
  block now appears in BRAND section 10, while the backend runtime owns its
  canonical `styleBlock` constant in `backend/src/lib/images/style.ts`.
- Kept `storybook-flat` and `watercolor` documented as inactive alternates.
  The existing validated seed JSON remains unchanged.

## 2026-07-18 - Backend recovery checkpoint

- Verified the soft-3D brand contract and its canonical backend style block;
  the checked-in initial Prisma migration exactly matches the schema.
- Added the Express/TypeScript/Zod/Prisma backend scaffold, seed importer,
  hashed JPEG media import, validated API routes, production static serving,
  and the explicit failed-state story-generation stub.
- Verification: full typecheck, lint, build, and test pass (including the
  three story validator tests). backend/.env.example was redacted to safe
  placeholders. The untracked backend/.env is absent in this workspace, so
  Neon migration and database seeding remain pending secure local config.

## 2026-07-18 - Terra generation model check

- Set the story writer and model validator to `gpt-5.6-terra`, retaining the
  strict structured-output contract and bounded retry policy.
- Confirmed the drawing configuration uses `gpt-image-1-mini` at low quality,
  and that `gpt-4o-mini-tts` with the configured `marin` voice is available
  for the later voice stage. Voicing remains the intentional pass-through stub
  for this milestone; no audio was generated or autoplay added.
- Ran a live three-page health story from the wizard for Sami. Terra completed
  writing and validation, the image stage created the character sheet and page
  art, and the ready story opened from the child shelf with `/api/media/...`
  assets.
- Verification: `npm run typecheck`, `npm run lint`, `npm run test`, and
  `npm run build` pass. The live run is estimated at roughly $0.06-$0.12:
  about $0.02 for four low-quality mini image outputs plus an estimate for
  Terra writing and validation; TTS is excluded.

## 2026-07-18 - Practice section

- Added the fixed Shelf Practice card and C6-C9: the simple practice menu,
  all-eight-feeling self-report, shared C2a-ready breathing circle, and static
  BeBoo-hugs-pillow guidance. The feeling acknowledgment is warm and
  unscored; its two tool buttons remain fixed, and the child flow has no
  history, sounds, visible timers, countdowns, or follow-up test question.
- Added `FeelingLog`, the applied Neon migration, Zod-validated
  `POST /api/practice/feelings`, and seven-day dashboard counts. Practice
  lazily mirrors the still-local profile to the existing child API only when
  needed, so a first-run child can persist feelings before generating a story.
- Added the Parent Progress "Feelings {name} shared" block with the shared
  EmotionFace chips, counts, and neutral empty state.
- Verification:
  - Ran BRAND section 11 on the shelf amendment and C6-C9: the controls meet
    child target size, wording is literal, all faces use the shared set, the
    only new motion is the specified 280 ms acknowledgment / 200 ms nod /
    tap-start 4 s breathing cycle, and reduced motion keeps the circle static
    with tap-to-advance cues.
  - Visually reviewed the shelf card, menu, all eight-face grid, breathing
    start/skip path, and squeeze screen. A temporary non-user test child
    confirmed `calm:2` and `nervous:1` seven-day dashboard counts and was
    deleted afterwards; an unsupported ninth emotion returns 400.
  - `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`
    pass. Prisma reports both migrations applied.

## 2026-07-18 - Practice and child-layout polish

- Made the three Practice choices equal `bb-surface` cards, and returned the
  squeeze guidance to the same regular text weight as story copy.
- Centered the breathing exercise on a teal BeBoo body with the shared calm
  face. Its fixed cue slot prevents layout movement when a child starts;
  normal motion remains 4 s in / 4 s out for three cycles and reduced motion
  remains static with tap-to-advance cues.
- Added the shared 680 px child-zone column across Shelf, Practice, and all
  player steps. Story art now fills that column rather than the whole wide
  viewport.
- Verification: visual review of Practice, breathing, squeeze, and the wide
  player stage; `npm run typecheck`, `npm run lint`, `npm run test`, and
  `npm run build` pass.

## Proposed (not built)

- Printable PDF export of a story from the parent library, for practicing
  away from screens.
- Read-only share link for a story, so a co-parent or teacher can preview it.
- Optional display typeface (e.g. Baloo 2) for headings if the all-Nunito
  hierarchy feels flat in practice — BRAND.md stays the gate.
- Illustration style picker in P5 using the alternate `styleOptions` shipped
  in the seed file. For the hackathon, `soft-3d` is the only active style;
  BRAND section 10 stays locked.
- Convergent branching endings v2 (pre-generated, every path ends calm).
- Post-story calm-plan prompt on the ending screen.
- Quiet-break screen.
