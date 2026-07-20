# BeBoo — Story rules

Single source of truth for everything the models produce: story text, check-ins,
scenes, animations, narration, and images. Read this before touching
`backend/src/lib/story/`, `images/`, `audio/`, or any check-in copy.
`generate.ts` enforces these rules going in (the prompt); `validate.ts` enforces
them coming out (the checklist in §5).

## 1. The eight emotions

`happy · sad · angry · scared · calm · nervous · proud · disappointed`

- These are the ONLY emotions that ever appear as check-in options, dashboard
  rows, or BeBoo expressions. IDs are these exact lowercase words.
- Faces always come from the one shared SVG set (`docs/BRAND.md` §3).
- Target emotions per story come from `adaptive/getNextFocus(childId)`.
- Distractors: plausible in context but visually distinct — prefer pairs the
  child has NOT confused before; deliberately reuse a known confusion pair
  (e.g. nervous/scared) only once per story, so practice happens gently.

## 2. Writing rules (enforced by prompt AND validator)

- Sentence budget by reading level — every sentence ≤ 10 words (BRAND §4):
  | Level | Sentences per page |
  |---|---|
  | pre-reader | 1–2 |
  | beginner | 2–3 |
  | reader | 3–4 |
- Present tense. Warm, concrete, literal. No idioms, metaphors, or figures of
  speech ("butterflies in your tummy", "piece of cake", "over the moon",
  "break the ice" — all forbidden; say the feeling plainly instead).
- Feelings are named explicitly and paired with one visible body cue at least
  once per emotional beat: "Sami feels nervous. His shoulders are up high."
- Arc (predictability is the product): first page sets the situation and place
  → middle pages show what happens and what {name} **can** do (frame choices
  as "can", never "must"; mostly descriptive sentences, coaching used
  sparingly) → final page is a calm good outcome + reassurance
  ("{name} feels proud.").
- Content safety: nothing frightening or shaming; hard moments are named
  briefly and always paired with what helps; surprises are never framed
  negatively; max one exclamation mark per page.
- Interests: woven naturally, ≤ 3 mentions per story, never forced.
- Sound words stay calm: never write loud all-caps onomatopoeia ("BEEP!")
  into child text — the narration voice reads everything, so the text itself
  must be readable calmly. Soft lowercase sound words (drip, whoosh) are
  fine, inside the one-exclamation budget.
- Companion (if set): a quiet helper who accompanies; it never speaks over or
  replaces {name}'s own actions.
- Per-page `animation`, chosen for pacing: `zoom-in` = arriving somewhere new
  or noticing something; `pan-lr` = a journey or looking around; `zoom-out` =
  relief, endings, wide calm; `none` = quiet moments or big-feeling pages
  (stillness lowers load exactly when the content is heaviest).

## 3. Check-in rules

- Placement: directly after the page where the emotion is shown — the final
  page included (ending on a good emotion like proud is valuable practice).
  When the last page has a check-in, the C4 bridge simply follows it.
  At most one check-in per page.
- Question ≤ 8 words, concrete: "How does {name} feel?"
- Exactly 3 options from the eight emotions, exactly one correct; `correctId`
  must match what the story text actually says.
- `scaffold` (first miss): points to a concrete visible cue in that scene —
  "Look at {name} again. He is holding his train very tight."
- `reveal` (second miss): states the answer warmly with the cue —
  "{name} feels nervous. His shoulders are up high."
- Never negation questions ("How does {name} NOT feel?"), never trick options,
  never mocking or scary options.

## 4. Generation prompt (template — lives in `backend/src/lib/story/prompt.ts`)

Inputs: `{firstName, pronoun, readingLevel, interests[], companion,
situationCategory, situationText, length (3–6), checkIns (on/off),
targetEmotions[]}`. Output: one JSON object matching the Story/Page shapes in
`docs/PRODUCT.md` §5 (strict structured output).

```
You write calm, literal social stories for autistic children aged 4–10.
Follow every rule. The reader is {firstName} ({pronoun}), reading level
{readingLevel}, who loves {interests}. Companion: {companion}.

STORY
- Situation to prepare for: {situationText} (category: {situationCategory}).
- Exactly {length} pages. Sentences per page: {budget}. Every sentence
  has 10 words or fewer. Present tense. Warm and concrete.
- No idioms, no metaphors, no sarcasm, no wordplay. Say feelings plainly
  and pair each named feeling with one visible body cue.
- Page 1 sets the place and situation. Middle pages show what happens and
  what {firstName} CAN do (say "can", not "must"). The last page is a calm,
  good outcome ending with reassurance and pride.
- Nothing frightening or shaming. Hard moments are brief and always paired
  with what helps. At most one exclamation mark per page.
- Target emotions to feature this story: {targetEmotions}.

CHARACTER BLOCK
- Write characterBlock: 1–3 visual sentences describing {firstName} AND any
  recurring adults (parent, teacher, dentist) as simple rounded picture-book
  characters (hair, skin tone, one outfit each). Everyone who appears on
  more than one page must be described here — it is reused verbatim for
  every illustration so the cast stays identical across pages.

SCENES (one per page)
- scene: ≤ 60 words, concrete, eye-level, ONE focal point, the character's
  emotion visible in face and posture (the same cue the scaffold will
  mention must be visible). Describe only content — no style words, no text
  in the scene.

ANIMATION (one per page)
- Choose from zoom-in | zoom-out | pan-lr | none using the pacing rules:
  zoom-in for arriving/noticing, pan-lr for journeys, zoom-out for relief
  and endings, none for quiet or big-feeling pages.

CHECK-INS {only if checkIns is on}
- After each page that shows a target emotion (the final page included):
  question (≤ 8 words), 3 options from
  [happy, sad, angry, scared, calm, nervous, proud, disappointed],
  one correctId matching the text, a scaffold line pointing at a visible
  cue, and a reveal line stating the answer warmly with the cue.

BRIDGE
- bridgeQuestion: one or two short questions (each ≤ 8 words) that open a
  conversation with the grown-up, e.g. "Have you ever felt like
  {firstName}? What helps you feel calm?"
```

## 5. Validator checklist (`story/validate.ts` — fail → regenerate with reasons, max 2)

1. Page count == requested length; sentence and word budgets hold on every page.
2. Lexicon: none of the banned words from `docs/BRAND.md` §4 anywhere.
3. No idioms or figurative language (flag anything non-literal).
4. Arc present: situation → what {name} can do → calm positive ending.
5. Every featured emotion is named plainly with a visible body cue.
6. Check-ins (if on): options ⊆ the eight emotions; exactly one correct;
   `correctId` consistent with the text; scaffold cites a cue visible in that
   scene; reveal states answer + cue; the bridge always comes after the
   final check-in.
7. Scenes: ≤ 60 words, one focal point, no style words, no text/letters; the
   scaffold's cue is visible in the scene.
8. Nothing frightening, shaming, coercive, or surprise-framed-negatively;
   ≤ 1 exclamation mark per page; no all-caps sound effects; interests ≤ 3
   mentions.
9. JSON shape matches `docs/PRODUCT.md` §5 exactly (ids present and unique).

## 6. Narration (voice)

- Model `TTS_MODEL`, default `gpt-4o-mini-tts`; voice `TTS_VOICE`, default
  `marin` (story-wide fallback `cedar`). The SAME voice for every page of
  every story — voice consistency is a feature for our audience, not a
  limitation.
- Steering instructions (verbatim constant):
  > "Warm, gentle storyteller reading to a young child. Speak slowly and
  > clearly, with a calm, even tone. Short pauses between sentences. Softly
  > cheerful. Never loud, fast, or dramatic."
- Speed is applied client-side from the child's narration-speed setting via
  `audio.playbackRate` — never regenerate audio for speed.
- Voice page audio with a concurrency limit of 3. Each page retries
  independently; an unrecovered page failure keeps the existing story
  `failed` state and its calm caregiver retry/fallback path.
- Timings: transcribe the generated MP3 with fixed `whisper-1` (not an env
  override), `timestamp_granularities: ["word"]`. Karaoke synchronization
  depends on those word timestamps. Sanity-check (timestamps monotonic,
  ≥ 90% of words matched) → else fall back to proportional timings.
- The parent zone carries the AI-voice disclosure (`docs/BRAND.md` §9).

## 7. Image prompt assembly

- Final prompt = `styleBlock` (BRAND §10, verbatim, from config) +
  `characterBlock` + `scene`. Scene text never repeats style words.
- Character sheet: generated once per child at profile creation (front view,
  neutral pose, plain cream background) and cached; every page image is made
  with the **Edits** endpoint (`IMAGE_MODEL`) using the character sheet as the
  reference image, so the character is identical on every page.
- Runtime defaults: `IMAGE_MODEL=gpt-image-1-mini` and `IMAGE_QUALITY=low`.
  The flagship demo configuration is `TEXT_MODEL=gpt-5.6`,
  `IMAGE_MODEL=gpt-image-2`, and `IMAGE_QUALITY=high`.
- Both character-sheet generation and page-edit calls use `IMAGE_QUALITY`.
- Reference-image fidelity: GPT Image 2 applies high input fidelity
  automatically, so its page-edit request must omit `input_fidelity`. Other
  supported page-edit models receive `input_fidelity: "high"` to preserve the
  character sheet's visual identity.
- Draw page images with a concurrency limit of 3. A page retries independently;
  if any page still fails, keep the existing story `failed` state and its calm
  caregiver retry/fallback path.
- Cache key = hash(styleBlock + characterBlock + scene + model + quality).
