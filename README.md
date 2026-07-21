# BeBoo

BeBoo is a caregiver-guided web app that helps autistic children (roughly ages 4–10) prepare for unfamiliar situations through personalized, illustrated, narrated social stories. The child has a calm, predictable reader; the caregiver has a PIN-protected area for creating stories, reviewing progress, and choosing gentle practice activities.

**Live demo:** [beboo.onrender.com](https://beboo.onrender.com) — the free Render service can take about a minute to wake after it has been idle.

**Demo video:** _Add the submission video URL here before submitting._

## Try it in 2 minutes

This is the zero-key, frontend-only seed mode. Run these commands from the repository root:

```sh
npm install
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173). No database, backend,
`backend/.env`, or OpenAI API key is required.

On a fresh browser, complete the short local onboarding. Enter `Sami` if you
want to follow the demo copy, then choose any four-digit parent PIN. You will
see the child shelf with the three bundled stories, the full reading and
Practice flows, and a populated parent Progress tab backed by deterministic
mock data. In this mode, “seed” means the bundled sample data; do not run
`npm run seed`, which imports data into PostgreSQL.

## Full-stack setup

### Prerequisites

- Node.js 20 or later
- A PostgreSQL connection URL; Neon’s free tier works well for this project
- An OpenAI API key to generate new stories, illustrations, narration, and
  word timing

From the repository root:

```sh
npm install
```

Create `backend/.env` from the checked-in template.

```sh
cp backend/.env.example backend/.env
```

In PowerShell, the equivalent command is:

```powershell
Copy-Item backend/.env.example backend/.env
```

Set `DATABASE_URL` and `OPENAI_API_KEY` in `backend/.env`. These are every
environment variable in the template:

| Variable | Template value | Runtime default if omitted | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | PostgreSQL placeholder | None | Required PostgreSQL connection URL. |
| `OPENAI_API_KEY` | Empty | None | Required when generating stories; keep it server-side and out of Git. |
| `PORT` | `3001` | `3001` | Express port. |
| `TEXT_MODEL` | `gpt-5.6-terra` | `gpt-5.6-terra` | Structured story writing and review. |
| `IMAGE_MODEL` | `gpt-image-2` | `gpt-image-1-mini` | Character sheet and page illustration model. |
| `IMAGE_QUALITY` | `high` | `low` | Illustration quality setting. |
| `TTS_MODEL` | `gpt-4o-mini-tts` | `gpt-4o-mini-tts` | Page narration model. |
| `TTS_VOICE` | `marin` | `marin` | Narration voice; `cedar` is the story-wide fallback if the first voice fails. |

The template intentionally shows a supported flagship image configuration:
`gpt-image-2` at `high`. For the lower-cost runtime configuration, set
`IMAGE_MODEL=gpt-image-1-mini` and `IMAGE_QUALITY=low`, or omit those values.
`whisper-1` is fixed in code because the karaoke highlight needs word-level
timestamps.

Apply the checked-in migrations, load the sample data, and run both workspaces:

```sh
npm run prisma --workspace=@beboo/backend -- migrate deploy
npm run seed
npm run dev
```

Vite runs at [http://localhost:5173](http://localhost:5173). Express runs at
`http://localhost:3001` by default; the frontend development server proxies
`/api` requests there. To generate a story, finish onboarding, open
**Grown-up area**, enter the PIN you chose, then select **Make a story**.

### Quality checks

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```

## Sample data

[`data/beboo-seed-stories.json`](data/beboo-seed-stories.json) contains three
validated, five-page stories:

- `Sami goes to the dentist`
- `Maya and the fire drill`
- `Adam and the plan that changed`

Each includes two gentle emotion check-ins and matching JPEG art under
`frontend/public/seed/`. The static frontend uses those stories directly, so
the whole child flow works without a backend.

`npm run seed` imports the stories and their content-hashed media into
PostgreSQL. It also creates deterministic demo history: a `seed-demo-child`
with strong happy and calm first attempts, two nervous/scared misses, rereads
across the seed stories, and feelings across the last week. The frontend mock
also supplies a populated dashboard. This lets a judge see meaningful parent
progress without having to create dozens of check-ins first.

## How this was built with Codex and GPT-5.6 Terra

Before implementation, I wrote five working specifications covering the product flow, brand, architecture, story rules, and build plan. `AGENTS.md` then turned those decisions into durable guidance: its nine child-safety rules were treated as strict acceptance criteria throughout the build.

The core build was orchestrated through a main Codex thread (literally named "read project docs first") that leveraged **parallel sub-agents** for rapid, simultaneous execution. The Git history records timestamped milestone commits from July 17 to July 21; the dated [build log](docs/BUILD_LOG.md) records the decision, verification, and repair history alongside them.

Codex acted as a fully autonomous engineering team. I supplied the product constraints, safety boundaries, and final decisions; Codex orchestrated the parallel work:

| Area | What Codex accelerated | What I decided |
| --- | --- | --- |
| **Multi-Agent Orchestration** | Spawned specialized parallel sub-agents (backend foundation, backend runtime, frontend generation) to build simultaneously in clean contexts. | Structured the `/docs` folder and `AGENTS.md` so parallel agents shared a single source of truth without colliding. |
| **Static-first foundation** | Scaffolded the React/Express/Prisma workspace, the seed-backed `api.ts` boundary, and the child shelf/player so the first demo worked without a database or key. | A static-first path with one swappable frontend data boundary, so judges can run the child flow safely. |
| **Story safety** | Implemented structured-output generation, deterministic validation, reviewer tests, and a repair for false metadata vocabulary failures. | A two-pass GPT-5.6 Terra flow with strict JSON, bounded retries, and child-visible safety checks. |
| **Illustration consistency** | Built the cached character-sheet and page-edit pipeline, centralized model settings, and tested model-specific image-edit compatibility. | One reference character sheet plus image edits, not unrelated page images; no silent model fallback. |
| **Synchronized narration** | Wired TTS, Whisper alignment, the proportional-timing fallback, and a player clock driven by real audio time. | Tap-only playback, word highlighting when trustworthy, and a fallback that never blocks a calming story. |
| **Parent progress** | Added the schema migration, seeded history, dashboard calculations, tests, and parent-only Progress layout. | First-attempt signals only, a two-miss confusion threshold, rereads treated positively, and no child-visible scoring. |

### Key decisions I made

- Use GPT-5.6 Terra twice: once for strict structured story output and once for a
  qualitative validation pass, with deterministic rules as the final gate.
- Keep recurring characters consistent with a character sheet followed by
  image edits for each scene.
- Use `whisper-1` word timestamps for karaoke highlighting, with proportional
  timings if alignment is not reliable.
- Keep the emotion vocabulary to the eight shared faces only: happy, sad,
  angry, scared, calm, nervous, proud, and disappointed.
- Exclude gamification from the child experience: no scores, streaks, timers,
  red errors, or penalty states.
- Store generated media in PostgreSQL so Render plus Neon can be one simple,
  `$0` hosting deployment without a separate media service; OpenAI usage
  remains metered.

### Runtime models

| Runtime stage | Model | What it does |
| --- | --- | --- |
| Writing and review | `gpt-5.6-terra` | Produces the structured story and performs the qualitative review. |
| Illustration | `gpt-image-1-mini` at `low` by default; `gpt-image-2` at `high` as the supported flagship configuration | Creates the character sheet and page art. |
| Narration | `gpt-4o-mini-tts` | Produces a calm MP3 for each generated page. |
| Word timing | `whisper-1` | Produces word timestamps for the karaoke highlight. |

## Safety and privacy

BeBoo is a caregiver-guided support tool for practice and preparation. It is
not therapy, diagnosis, or a replacement for professional care.

- The child profile stores a first name and personalization preferences; it
  does not request child photos.
- Full child deletion is a single cascading backend request
  (`DELETE /api/children/:id`) that removes child-linked data and cleans up
  unreferenced generated media.
- The parent zone is behind a four-digit PIN with neutral failure copy. The
  OpenAI API key stays on the server.
- The parent area clearly says that stories and narration are AI-generated.
- Child-facing rules are intentionally strict: no autoplayed audio, no test-like
  feedback or gamification, warm check-in retries, literal copy, shared
  eight-face emotion art, fixed controls, large touch targets, and reduced
  motion support. See [AGENTS.md](AGENTS.md) for the full nine-rule contract.

This hackathon prototype keeps some onboarding, PIN, and seed-mode state in
browser local storage. It does not claim production privacy, clinical, or
regulatory compliance.

## Troubleshooting

- **The live demo is slow on first load.** Render’s free service may need
  about a minute to wake after idling.
- **A generated story takes a few minutes.** Writing, illustration, narration,
  and word alignment are separate stages; the parent view shows the current
  stage and provides a calm retry/fallback if generation fails.
- **Word highlighting is not exact.** If Whisper timing does not meet the
  alignment checks, narration still plays and the player uses proportional
  timings instead of failing the story.

## Repository map

The source of truth lives in the documents rather than duplicated summaries:

- [AGENTS.md](AGENTS.md) — durable development and child-safety contract
- [Product flow and API surface](docs/PRODUCT.md)
- [Brand, face grammar, motion, and ship checklist](docs/BRAND.md)
- [Story prompts, validation, image, and narration rules](docs/STORY_RULES.md)
- [Schema, pipeline, deployment, and project layout](docs/ARCHITECTURE.md)
- [Practice feature specification](docs/PRACTICE.md)
- [Dated decisions and verification](docs/BUILD_LOG.md)

## License

Released under the [MIT License](LICENSE). Copyright © 2026 SousouMorys.
