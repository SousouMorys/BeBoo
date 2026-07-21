# BeBoo — Architecture

## 1. System overview

```
┌──────────────────────┐          ┌─────────────────────────────────┐
│  Browser (SPA)       │  static  │  Express server (Node 20)       │
│  child zone / parent │ ◀─────── │  • serves frontend/dist         │
│  zone (React+Vite)   │  /api    │  • Zod-validated JSON routes    │
│                      │ ◀──────▶ │  • async generation pipeline    │
└──────────────────────┘          └────────┬───────────────┬────────┘
        ▲  /api/media/:id (long cache)     │ Prisma        │ server-side only
        └──────────────────────────────────┤               ▼
                                  ┌────────▼──────┐  ┌─────────────────────────┐
                                  │  Postgres     │  │  OpenAI API             │
                                  │  (Neon free)  │  │  gpt-5.6-terra write+val│
                                  │  incl. media  │  │  IMAGE_MODEL  draw      │
                                  │  as bytea     │  │  gpt-4o-mini-tts  voice │
                                  └───────────────┘  │  whisper-1  timings     │
                                                     └─────────────────────────┘
```

## 2. Why this stack (say it in the README — judges read reasoning)

- **Persistent Node process** fits a multi-minute async pipeline: no serverless
  timeout gymnastics, the parent zone simply polls `/api/stories/:id/status`.
- **One deployable artifact** (Express serves `frontend/dist`): one URL, one
  host, trivial for judges to run.
- **$0 hosting.** Render free web service + Neon free Postgres (verified
  limits in §6). The only spend is OpenAI usage, covered by hackathon credits.
- **Media as `bytea` in Postgres** behind `GET /api/media/:id` with long-lived
  cache headers: zero third-party storage, and "one-tap delete all data" is a
  single cascade — a privacy feature, not a shortcut. A 5-page story is
  ~6–10 MB; comfortably fine at hackathon scale. If BeBoo grows, swap `Media`
  bytes for object-storage keys behind the same route.

## 3. Prisma schema (draft — `backend/prisma/schema.prisma` is canonical)

```prisma
model AppConfig {                      // singleton: id = 1
  id      Int    @id @default(1)
  pinHash String                       // bcrypt
}

model Child {
  id           String   @id @default(cuid())
  firstName    String
  pronoun      String
  readingLevel ReadingLevel
  interests    Json     // chips + free text, max 3 active
  companion    String   // description or "BeBoo"
  settings     Json     // {animations, highlighting, checkIns, ambience, narrationSpeed}
  sheetId      String?  // character-sheet Media id
  stories      Story[]
  results      CheckInResult[]
  stats        EmotionStat[]
  createdAt    DateTime @default(now())
}

model Story {
  id                String      @id @default(cuid())
  child             Child       @relation(fields: [childId], references: [id], onDelete: Cascade)
  childId           String
  title             String
  situationCategory String
  situationText     String
  characterBlock    String
  bridgeQuestion    String
  length            Int
  checkIns          Boolean
  status            StoryStatus @default(writing)
  pages             Page[]
  createdAt         DateTime    @default(now())
}

model Page {
  id       String    @id @default(cuid())
  story    Story     @relation(fields: [storyId], references: [id], onDelete: Cascade)
  storyId  String
  index    Int
  text     String
  scene    String
  animation Animation
  imageId  String?   // Media id
  audioId  String?   // Media id
  timings  Json?     // [{word,start,end}]
  checkIn  Json?     // {question, options[3], correctId, scaffold, reveal}
  @@unique([storyId, index])
}

model Media {
  id        String    @id @default(cuid())
  kind      MediaKind
  mime      String
  bytes     Bytes
  hash      String    @unique     // content-hash cache key
  createdAt DateTime  @default(now())
}

model CheckInResult {
  id        String   @id @default(cuid())
  storyId   String
  page      Int
  child     Child    @relation(fields: [childId], references: [id], onDelete: Cascade)
  childId   String
  emotionId String   // one of the eight
  correct   Boolean
  attempt   Int      // 1 or 2
  createdAt DateTime @default(now())
}

model EmotionStat {                    // maintained by adaptive/
  child      Child  @relation(fields: [childId], references: [id], onDelete: Cascade)
  childId    String
  emotionId  String
  correct    Int    @default(0)
  missed     Int    @default(0)
  confusions Json   // {"scared": 3, ...} — what was chosen instead
  @@id([childId, emotionId])
}

enum ReadingLevel { pre_reader beginner reader }
enum StoryStatus  { writing drawing voicing ready failed }
enum Animation    { zoom_in zoom_out pan_lr none }
enum MediaKind    { image audio }
```

## 4. Pipeline states (status drives P3 and the shelf)

| Stage | Module | Calls | On success |
|---|---|---|---|
| `writing` | `story/generate.ts` → `story/validate.ts` | gpt-5.6-terra ×1 (+ ≤2 validator retries) | → `drawing` |
| `drawing` | `images/` | character sheet (cached) + Edits per page | → `voicing` |
| `voicing` | `audio/` | gpt-4o-mini-tts + whisper-1 per page | → `ready` |

- One automatic retry per model call (2 s backoff) for transient errors; any
  stage that still fails sets `failed` and logs the stage + reason server-side.
- **`failed` is parent-facing only.** P3 shows a neutral message per BRAND
  ("We couldn't finish this story. Try again.") in `bb-ink-soft` on `bb-sand`;
  a story reaches the child's shelf only when `ready`. The child never meets
  an error state.

## 5. Cost controls (hackathon credits are finite)

- Per story ≈ 1–2 gpt-5.6-terra calls + (length) images + (length) short TTS clips +
  (length) whisper transcriptions. With `IMAGE_MODEL=gpt-image-1-mini` at low
  quality (≈ half a cent per image), a full 5-page story costs pennies.
- The character sheet is generated once per child and cached; page images are
  cached by content hash — regenerating a story after a validator retry never
  re-draws unchanged scenes.
- For the demo recording: flip `IMAGE_MODEL` to `gpt-image-1.5` (or
  `gpt-image-2` if credits allow), quality medium, and regenerate the hero
  story once. Credits must be used by Jul 21, 5 PM PT.

## 6. Deployment — free stack (Render + Neon, verified Jul 17 2026)

**Total hosting cost: $0.** The only spend is OpenAI usage (hackathon credits).

- **Database — Neon Free plan** (permanent, no credit card): 0.5 GB storage
  per project, 100 CU-hours of compute per month, scale-to-zero after 5 min
  idle with fast resume on the next query. With media stored as `bytea`,
  0.5 GB ≈ 50 five-page stories at dev image quality — ample for the
  hackathon. Do NOT use Render's own free Postgres: it expires after 30 days.
- **App — Render free web service**: 750 instance-hours/month; one service
  runs Express and serves `frontend/dist`. Free services spin down after
  15 min without traffic and take up to ~1 min to wake (Render shows a
  loading page). Status polling during generation keeps it alive. Before any
  demo or judging session, open the URL once to warm it, and put one line in
  the README: "First load may take a minute while the free instance wakes."
- Railway is NOT a free option anymore (one-time trial credit only) — Render
  is the target.

Steps:
1. Neon: create project → copy the pooled `DATABASE_URL`.
2. Render: new Web Service from the repo → build command
   `npm run build && npx prisma migrate deploy` → start command
   `node backend/dist/index.js` → env: `DATABASE_URL`, `OPENAI_API_KEY`,
   `PORT`, `IMAGE_MODEL`, `TTS_VOICE`.
3. Run `npm run seed` once from the Render shell.
4. Add `GET /api/health` → `{ok:true}` for the platform's health check.
5. Smoke test in production: onboarding → generate one story end-to-end →
   read it with audio — before recording the video.

## 7. Security & privacy

- PIN bcrypt-hashed in `AppConfig`; `POST /api/pin/verify` gets a small delay
  after repeated misses (neutral copy, never lockout drama).
- Data minimization: child's first name only; no photos; no accounts.
  `DELETE /api/children/:id` cascades child → stories → pages → media →
  results → stats in one transaction.
- All OpenAI calls server-side; the client never sees keys.
- Parent zone carries the AI-generation disclosure (BRAND §9).

## 8. Build plan (deadline **Tue Jul 21, 5:00 PM PT** = Wed Jul 22, 1:00 AM Tunis)

Phases: **P1 static-first** — the entire child zone runs on `frontend/` +
`data/beboo-seed-stories.json` through the mock `api.ts`; no backend, no
database needed. **P2** — backend, Prisma, generation pipeline. **P3** —
wire frontend to the real API, audio + timings, adaptive + parent data.
**P4** — deploy and ship. The day plan follows the phases:

| Day | Goal |
|---|---|
| Fri Jul 17 | **P1:** monorepo scaffold, tokens + Nunito, seed-stories JSON + placeholder SVG art, C1 shelf + C2 player fully working in mock mode (karaoke via stubbed narration clock) |
| Sat Jul 18 | **P1:** C3 check-ins with scaffold/reveal, C4 bridge, C5 ending, P0 PIN + onboarding, P1 hub shell |
| Sun Jul 19 | **P2:** backend scaffold + Prisma migrate + seed; pipeline `writing`+`drawing` (generate, validate, character sheet, Edits); P2 wizard; P3 polling |
| Mon Jul 20 | **P3:** pipeline `voicing` + timings, swap mock api.ts for real API, adaptive + P4 dashboard, settings/reduced-motion pass; **P4:** deploy, end-to-end smoke |
| Tue Jul 21 | Demo video (< 3 min), README (Codex collaboration section), **submit hours early** |

If a day slips: cut P4 dashboard visuals before anything child-facing; never
cut the check-in scaffolds or the calm states — they ARE the product.

## 9. Hackathon compliance checklist

- [ ] Built inside Codex; main build kept in ONE thread → `/feedback` Session ID captured for the submission form.
- [ ] Timestamped conventional commits across the Submission Period (Jul 13–21).
- [ ] README: what BeBoo is, setup + sample data, how judges run it, and a
      "Built with Codex + GPT-5.6 Terra" section (where Codex accelerated, key
      decisions, how GPT-5.6 Terra is used at runtime).
- [ ] Video: < 3 minutes, public on YouTube, audio narration covering what was
      built and how Codex AND GPT-5.6 Terra were used; no third-party trademarks or
      copyrighted music.
- [ ] Repo public with a license, or private + shared with
      `testing@devpost.com` and `build-week-event@openai.com`.
- [ ] Category: **Education**. Working deployed URL in the submission.

## 10. Judging criteria → BeBoo's answers

| Criterion | Our answer |
|---|---|
| Technological implementation | Codex-built full pipeline: GPT-5.6 Terra structured outputs + model-based validator pass, Edits-endpoint character consistency, word-level karaoke sync from whisper timestamps, adaptive emotion loop |
| Design | An evidence-informed design system (`docs/BRAND.md`) executed as a complete two-zone product — the calm constraints ARE the product thesis |
| Potential impact | Caregiver-guided preparation for real events (dentist, fire drill, plans changing) for an underserved audience; positioned honestly as support, not therapy |
| Quality of the idea | Not a generic story generator: personalization + adaptive emotion practice + locked visual consistency + no-fail interaction design |

## 11. Repository layout (folders & files)

Authoritative layout — create files in these locations; ask before adding
top-level folders. Phase tags: P1 = static frontend (mock data), P2 =
backend + pipeline, P3 = wiring + audio + adaptive.

```
beboo/
├─ AGENTS.md                           # Codex contract — read first
├─ README.md                           # setup, judges' guide, Codex + GPT-5.6 Terra section (Day 5)
├─ package.json                        # npm workspaces: frontend, backend + root scripts
├─ .gitignore
├─ data/
│  └─ beboo-seed-stories.json          # 3 validated demo stories (P1 data source)
├─ docs/
│  ├─ BRAND.md · PRODUCT.md · STORY_RULES.md · ARCHITECTURE.md · BUILD_LOG.md
│
├─ frontend/                           # React 18 + Vite + TS strict + Tailwind + react-router
│  ├─ package.json · index.html · vite.config.ts · tsconfig.json
│  ├─ public/
│  │  └─ seed/                         # placeholder art: {storyId}-cover.svg, {storyId}-p{n}.svg
│  └─ src/
│     ├─ main.tsx                      # bootstrap + providers
│     ├─ App.tsx                       # react-router routes
│     ├─ index.css                     # Tailwind entry + bb-* tokens (BRAND §5) + Nunito
│     ├─ lib/
│     │  ├─ api.ts                     # THE data boundary — mock (seed JSON) in P1, real API in P3
│     │  └─ types.ts                   # Story, Page, CheckIn, Child — mirrors seed + Prisma
│     ├─ hooks/
│     │  ├─ useReducedMotion.ts        # child profile setting AND prefers-reduced-motion
│     │  └─ useNarration.ts            # play/pause + karaoke word index; stub clock in P1
│     ├─ components/
│     │  ├─ BebooMascot.tsx
│     │  ├─ EmotionFace.tsx            # the ONE shared 8-expression SVG set
│     │  ├─ KenBurnsImage.tsx          # image stage; animation prop; static when reduced
│     │  ├─ KaraokeText.tsx            # instant text + bb-highlight word sync
│     │  ├─ ProgressDots.tsx
│     │  ├─ SpeakerButton.tsx          # the only sound trigger in the app
│     │  └─ BigButton.tsx
│     └─ pages/
│        ├─ Shelf.tsx                  # C1  (P1, Day 1)
│        ├─ player/
│        │  ├─ Player.tsx              # C2 orchestrator: pages → check-ins → bridge → end
│        │  ├─ StoryPage.tsx           # C2  (P1, Day 1)
│        │  ├─ CheckInStep.tsx         # C3  (P1, Day 2)
│        │  ├─ BridgeStep.tsx          # C4  (P1, Day 2)
│        │  └─ EndingStep.tsx          # C5  (P1, Day 2)
│        └─ parent/
│           ├─ PinGate.tsx             # P0  (Day 2)
│           ├─ Onboarding.tsx          #     (Day 2)
│           ├─ ParentHub.tsx           # P1 hub (Day 2, shell)
│           ├─ NewStoryWizard.tsx      # P2 wizard (Phase 2, Day 3)
│           ├─ GenerationProgress.tsx  # P3 progress (Phase 2, Day 3)
│           ├─ Dashboard.tsx           # P4 dashboard (Phase 3, Day 4)
│           └─ Settings.tsx            # P5 settings (Phase 3, Day 4)
│
└─ backend/                            # Node 20 + Express + TS + Prisma (empty shell until P2)
   ├─ package.json · tsconfig.json
   ├─ .env.example                     # DATABASE_URL, OPENAI_API_KEY, PORT, IMAGE_MODEL, TTS_VOICE
   ├─ prisma/
   │  ├─ schema.prisma                 # §3 of this doc
   │  └─ migrations/
   └─ src/
      ├─ index.ts                      # Express bootstrap; serves ../frontend/dist in production
      ├─ seed.ts                       # npm run seed → loads data/beboo-seed-stories.json
      ├─ db.ts                         # Prisma client singleton
      ├─ openai.ts                     # OpenAI client (server-side only)
      ├─ schemas.ts                    # Zod schemas for every API boundary
      ├─ routes/                       # thin routes; logic lives in lib/
      │  ├─ health.ts · pin.ts · children.ts · stories.ts
      │  ├─ checkins.ts · dashboard.ts
      │  └─ media.ts                   # GET /api/media/:id, long cache headers
      └─ lib/
         ├─ pipeline.ts                # sequences writing → drawing → voicing, updates status
         ├─ story/
         │  ├─ prompt.ts               # STORY_RULES §4 template
         │  ├─ generate.ts             # gpt-5.6-terra structured output
         │  ├─ validate.ts             # STORY_RULES §5 model pass
         │  └─ validate.test.ts
         ├─ images/
         │  ├─ characterSheet.ts       # once per child, cached
         │  └─ pages.ts                # Edits endpoint + content-hash cache
         ├─ audio/
         │  ├─ tts.ts                  # gpt-4o-mini-tts
         │  ├─ timings.ts              # whisper-1 word timestamps + proportional fallback
         │  └─ timings.test.ts
         └─ adaptive/
            ├─ stats.ts                # EmotionStat upkeep + confusion pairs
            ├─ nextFocus.ts            # getNextFocus(childId)
            └─ nextFocus.test.ts
```

Design intent: C3/C4/C5 are steps inside the `/story/:id` player route (no
deep-linking past a check-in); `lib/api.ts` is the single mock↔real swap
point; the three `.test.ts` files are exactly the non-trivial logic AGENTS.md
names; `EmotionFace.tsx` with an `emotion` prop makes the shared-face rule
impossible to violate.
