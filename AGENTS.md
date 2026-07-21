# BeBoo — Agent instructions

BeBoo generates personalized, illustrated, narrated social stories for autistic children (~4–10), with gentle emotion check-ins and an adaptive learning loop. The caregiver (parent/teacher) is the account holder behind a PIN; the child is the reader. This is a hackathon build: a finished, coherent product beats extra features.

## Commands (npm workspaces monorepo)
- `npm run dev` — runs frontend (Vite, :5173) and backend (Express, :3001) concurrently; `npm run dev:frontend` / `npm run dev:backend` run one side alone (Phase 1 needs only the frontend)
- `npm run seed` — loads `data/beboo-seed-stories.json` into the database
- `npm run build` — builds frontend into `frontend/dist`, then backend
- `npm run typecheck` / `npm run lint` / `npm run test`

## Stack
- `frontend/` — React 18 + Vite + TypeScript strict + Tailwind + react-router. Functional components and hooks only.
- `backend/` — Node 20 + Express + TypeScript + Prisma + Postgres (Neon free tier). Zod validation on every API boundary.
- The frontend talks to data ONLY through `frontend/src/lib/api.ts`. In Phase 1 (static-first) its mock implementation serves `data/beboo-seed-stories.json`, so every child screen works with no backend running; Phase 3 swaps in the real API behind the same interface.
- Generated media (images, audio) is stored in Postgres (`bytea`) and served via `GET /api/media/:id` with long-lived cache headers. No third-party storage service.
- Single deployment: the backend serves `frontend/dist` as static files. Target: **Render free web service + Neon free Postgres** — $0 hosting; limits and warm-up notes in `docs/ARCHITECTURE.md` §6.

## Conventions
- Keep modules under ~200 lines. Business logic lives in `backend/src/lib/` (`story/`, `images/`, `audio/`, `adaptive/`); routes stay thin.
- Conventional commits, one feature per commit.
- Unit tests (vitest) only for non-trivial logic: validator parsing, audio-timings fallback, adaptive selection.
- All user-facing copy is English, warm, and literal.

## Hard product rules (child-facing) — treat as acceptance criteria on every task
1. No autoplay of audio or motion. Audio is tap-to-play via a fixed speaker button.
2. Nothing that reads as testing: no error sounds, no red X, no scores, no timers, no streaks visible to the child.
3. A wrong check-in answer gets a warm scaffold line and a retry — never a penalty.
4. Page text renders fully and instantly. The only text animation is word-by-word highlight synced to audio playback.
5. Image motion: slow Ken Burns only (scale 1.00→1.05 or a gentle pan, 12–15 s, linear), one direction per page; honor the per-child "reduce animations" setting AND `prefers-reduced-motion`; `"none"` is a valid value.
6. Emotion faces always come from the one shared 8-expression SVG set (`docs/BRAND.md` §3) — never redrawn per screen; child touch targets ≥64 px (parent ≥44 px); fixed control positions; page-progress dots.
7. Muted pastel palette only, rounded shapes, no flashing, no parallax. Never pure black; text contrast ≥4.5:1.
8. Literal language: no idioms, no vague buttons — every button says what it does.
9. Privacy: store the child's first name only; no child photos; one-tap data deletion; parent zone behind a 4-digit PIN with a neutral failure message.

## Documentation duties
- Before ANY UI work: read `docs/BRAND.md`.
- Product flows, screens, and API contracts: `docs/PRODUCT.md`.
- Before touching story generation, validation, check-in copy, images, or audio: read `docs/STORY_RULES.md` (prompt templates + validator checklist).
- Database schema, pipeline wiring, deployment, and the day-by-day build plan: `docs/ARCHITECTURE.md` (folder & file layout in §11 — create files where it says).
- After each milestone: run typecheck + lint + build + tests, verify the acceptance criteria, then append a dated entry to `docs/BUILD_LOG.md` (what was built, key decisions, anything fixed).

## Scope guard
Build nothing outside `docs/PRODUCT.md` without asking. Record high-value ideas under a "Proposed" heading in `docs/BUILD_LOG.md` instead of building them.

## Hackathon duties (OpenAI Build Week — non-negotiable)
- Build inside Codex, and keep the main build in ONE thread: the submission requires that thread's `/feedback` Session ID (the thread where the majority of core functionality was built).
- Timestamped conventional commits throughout the Submission Period (Jul 13–21) — they are the evidence of work done during the period.
- The README must document how Codex and GPT-5.6 Terra were used and where Codex accelerated the work; judges score this directly.
- Deadline: Tue Jul 21, 5:00 PM PT (= Wed Jul 22, 1:00 AM Tunis). Full compliance checklist in `docs/ARCHITECTURE.md`.

## Environment
Backend `.env`: `DATABASE_URL`, `OPENAI_API_KEY`, `PORT`, `TEXT_MODEL`
(`gpt-5.6-terra` default), `IMAGE_MODEL` (`gpt-image-1-mini` runtime default;
`gpt-image-2` for the flagship demo), `IMAGE_QUALITY` (`low` runtime default;
`high` for the flagship demo), `TTS_MODEL` (`gpt-4o-mini-tts` default), and
`TTS_VOICE` (`marin`, fallback `cedar`). Transcription remains fixed at
`whisper-1` because karaoke sync requires `timestamp_granularities: ["word"]`.
Keep `.env.example` current. Never commit secrets.
