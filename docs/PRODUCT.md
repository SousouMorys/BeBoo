# BeBoo — Product specification

## 1. Users and promise
A caregiver (parent or teacher) creates a child profile and generates personalized social stories that prepare the child for real situations (dentist, fire drill, plans changing). The child reads and listens to immersive, calm, illustrated stories with gentle emotion check-ins. Check-in results quietly adapt the next story. BeBoo is a practice-and-preparation support tool with the caregiver as account holder — never a therapy replacement.

## 2. Information architecture
- **Child zone** — the app's default face after onboarding. Shelf + story player. No settings, no text-heavy navigation.
- **Parent zone** — behind a 4-digit PIN. Creation, library, progress, settings.

## 3. Child pages (build these with the most care)

### C1 — Shelf ("My stories")
- BeBoo greets by name: "Hello, Sami." Grid of large story covers (cover image + title, nothing else). Most recently read first.
- Tap a cover → C2. Rereading is expected and good — no "completed" badges, no locks.
- Empty state: BeBoo + "Your grown-up can make you a story." No call-to-action for the child.
- Small, discreet corner button (parent-shaped icon) → P0 PIN gate.

### C2 — Story player (the immersive core)
Layout, top to bottom (mobile-first 390 px):
- **Top bar:** small home icon (left) · progress dots (center) · "2/5" counter (right).
- **Image stage (~55–60% of viewport):** full-bleed illustration with slow Ken Burns per the page's `animation` value; static under reduced motion.
- **Text panel (`bb-surface` card):** the full page text, rendered instantly. During audio playback, word-by-word karaoke highlight (`bb-highlight`) driven by the page's `timings` map via `audio.currentTime` + `requestAnimationFrame`; proportional fallback if timings are missing.
- **Control row (fixed positions on every page):** speaker button (left, tap-to-play/replay, never autoplay) · big Next arrow (right).
Behavior: 280 ms crossfade between pages; audio stops on page change; audio replayable infinitely at the child's narration-speed setting (`audio.playbackRate`, no extra child-facing control); optional parent-enabled soft ambience (default OFF). Immersion = full-bleed art + slow motion + voice + synced highlight — calm absorption, never stimulation overload.

### C3 — Check-in page (appears between story pages where defined)
- Question ≤8 words ("How does Sami feel?") + small thumbnail of the scene just seen.
- Three emotion faces (shared SVG set, ≥64 px) with lowercase labels.
- Correct → 200 ms soft glow + BeBoo nod + affirmation ("Yes. Sami feels nervous.") → Next unlocks.
- Miss → warm scaffold from the page data ("Look at Sami again. He is holding his train very tight.") → retry.
- Second miss → show the answer warmly ("Sami feels nervous. His shoulders are up high.") → Next unlocks. Record all attempts.
- If the child's profile has check-ins OFF, these pages simply never appear.

### C4 — Bridge page (after the last story page)
- "Have you ever felt like Sami?" + one "Done" button. Unscored, no options, no recording — it exists to open a conversation with the adult sitting alongside.

### C5 — Ending page
- "The end." BeBoo waves. Two buttons: "Read again" · "My stories".

## 4. Parent pages
- **P0 PIN gate:** 4 digits; failure = neutral message ("That code doesn't match. Try again.") in `bb-ink-soft` on `bb-sand`; no sound, no red.
- **P1 Hub:** three tabs — Library / Progress / Settings.
- **P2 New story wizard:** pick child → situation (category grid: Health, School, Daily life, Social + free-text "Describe your own") → options (length 3–6 pages; check-ins on/off for this story) → Generate.
- **P3 Generation progress:** three visible steps with BeBoo — "Writing your story… Drawing the pictures… Recording the voice." Polling `GET /api/stories/:id/status`.
- **P4 Progress dashboard:** per-emotion accuracy bars, detected confusion pairs ("Often mixes frustrated with angry"), stories read count. No child-visible equivalent exists.
- **P5 Profile & settings:** child form (first name, pronoun, reading level: pre-reader / beginner / reader, interests chips + free text with max 3 active, companion description, "BeBoo", or "none"), sensory preferences (animations, highlighting, check-ins, ambience, narration speed 0.8×/1×, autoplay stays hard-off), PIN change, one-tap delete all data.
- **Onboarding (first run):** welcome → child form → set PIN → shelf.

## 5. Data model
Entities: `Child`, `Story`, `Page`, `CheckInResult`, `EmotionStat`, `Media`.
Page shape (source of truth = `data/beboo-seed-stories.json`):
`{ page, text, scene, animation: "zoom-in"|"zoom-out"|"pan-lr"|"none", audioUrl, timings: [{word,start,end}], checkIn?: { question, options: [{id,label}] x3, correctId, scaffold, reveal } }`
Story: `{ id, title, situationCategory, childProfile, characterBlock, pages[], bridgeQuestion }`. Global `styleBlock` in config. Final image prompt = `styleBlock + characterBlock + scene`.

## 6. API (Express, all JSON, Zod-validated)
- `POST /api/pin/verify`
- `POST /api/children` · `GET /api/children/:id` · `PATCH /api/children/:id` · `DELETE /api/children/:id` (full data wipe)
- `POST /api/stories/generate` `{childId, situation, length, checkIns}` → `{storyId}` (async pipeline)
- `GET /api/stories/:id/status` → `{step: "writing"|"drawing"|"voicing"|"ready"|"failed"}`
- `GET /api/stories?childId=` · `GET /api/stories/:id`
- `POST /api/checkins` `{storyId, page, childId, emotionId, correct, attempt}`
- `GET /api/dashboard/:childId` → accuracy per emotion + confusion pairs
- `GET /api/media/:id` (images/audio from Postgres, long cache headers)

## 7. Generation pipeline (backend/src/lib/)
1. `story/generate.ts` — one structured-output `gpt-5.6` call returning a complete story object (reading level → sentence budget; interests woven; per-page animation chosen; target emotions from adaptive module; prompt template in `docs/STORY_RULES.md`).
2. `story/validate.ts` — second model pass against social-story rules (checklist in `docs/STORY_RULES.md` §5); fail → regenerate with reasons, max 2 retries.
3. `images/` — character sheet at profile creation (front view, neutral pose, plain cream background) cached; per-page generation via the image **Edits** endpoint (`IMAGE_MODEL`) with the character sheet as reference image, prompt = styleBlock + characterBlock + scene; cache by content hash.
4. `audio/` — TTS per page (`gpt-4o-mini-tts`, voice `TTS_VOICE`, steering instructions in `docs/STORY_RULES.md` §6) → transcription with word-level timestamps (`whisper-1`, `timestamp_granularities: ["word"]`) → timings map; proportional fallback.
5. `adaptive/` — record results; per-emotion accuracy + confusion pairs; `getNextFocus(childId)` feeds generate.ts.

## 8. Non-goals (do not build)
Email/password accounts, UI internationalization, native apps, child photo uploads, offline mode beyond cached content, push notifications, multi-child leaderboards or any comparison features.
