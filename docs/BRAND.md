# BeBoo — Brand DNA

This document is the single source of truth for how BeBoo looks, moves, sounds, and speaks. Every UI task must comply with it. When any design decision is unclear, apply the brand test: **"Could this startle, rush, test, or confuse a child? Then no."**

## 1. Essence
- **Name:** BeBoo — two soft syllables a young child can say. Lowercase wordmark: `beboo`.
- **One-liner:** A calm companion that turns any new situation into your child's own story.
- **Personality:** patient, warm, literal, quiet, steady. BeBoo never hurries, never tests, never surprises.
- **Positioning sentence (use everywhere):** BeBoo is a support tool for practice and preparation, guided by a caregiver — not a replacement for therapy.

## 2. Evidence-informed principles (the "why" behind every rule)
Derived from UK Home Office / National Autistic Society accessibility guidance and autism UX research:
1. **Predictability & consistency** — unpredictable outcomes cause anxiety; identical layouts and fixed control positions give control.
2. **Sensory load management** — heightened sensory awareness means muted colors, no sudden sound, no autoplay, ever.
3. **Clarity** — literal, plain language; descriptive buttons ("Read again", never "Go!").
4. **Low cognitive density** — one primary action per child screen; max 4 interactive elements; whitespace is a feature.
5. **Control & customization** — per-child sensory settings (animations, highlighting, check-ins, ambience).
6. **No coercive gamification** — no scores, streaks, timers, or lock-outs. Rereading is success, not stagnation.
Research bonus: eye-tracking studies show young autistic children attend strongly to geometric patterns — our flat geometric illustration style is a deliberate, evidence-aligned choice. Say this in the demo.

## 3. The mascot: BeBoo
- A small, round, mint-teal cloud-creature. Construction: circles and soft ellipses only — no sharp angles anywhere.
- Face grammar (identical across mascot, story characters, and answer buttons): big oval eyes, visible eyebrows, one simple mouth shape. Emotion must be readable at a glance from eyebrows + mouth + posture.
- **BeBoo IS the emotion reference set.** The 8 canonical expressions — happy, sad, angry, scared, calm, nervous, proud, disappointed — are one shared SVG set used everywhere (check-in buttons, dashboard, feedback nods). Never redraw them per screen.
- Intensity cap: emotions are clear but gentle. BeBoo is never terrified, sobbing, or furious.
- Roles: greets on the shelf, announces generation steps, nods on check-in success, waves at "The end."

## 4. Voice & tone
- Short sentences (child-facing ≤10 words). Present tense. Warm and concrete. Max one exclamation mark per page.
- No idioms, no figures of speech, no sarcasm in child-facing copy. No ALL CAPS, no italics in child copy.
- Lexicon:

| Say | Never say |
|---|---|
| check-in | quiz, test, question round |
| "Let's look again." | wrong, incorrect, no, oops |
| "All done!" | you win, score, points |
| "Your grown-up can make you a story." | error, empty, nothing here |
| "Read again" | replay level, retry |

## 5. Color tokens (Tailwind names → hex)
| Token | Hex | Use |
|---|---|---|
| `bb-cream` | `#FAF6EF` | app background (never pure white) |
| `bb-surface` | `#FFFDF8` | cards, text panels |
| `bb-ink` | `#33413C` | primary text (never pure black) |
| `bb-ink-soft` | `#5E6E68` | secondary text, neutral notices |
| `bb-teal` | `#4FA98F` | primary action, mascot body |
| `bb-teal-deep` | `#2E6F5E` | pressed/focus states, text on light teal |
| `bb-sand` | `#EADFCB` | secondary surfaces, parent chips |
| `bb-coral` | `#E8A08D` | small accents only — ≤10% of any screen |
| `bb-sky` | `#C7DDEA` | informational touches, ambient scenes |
| `bb-highlight` | `#F6E3B4` | karaoke word highlight |

Rules: low saturation everywhere; no bright red, no neon, no pure black/white. "Errors" (e.g., wrong PIN) render as `bb-ink-soft` text on `bb-sand` — never red. All text must pass 4.5:1 contrast (bb-ink on bb-cream passes).

## 6. Typography
- Family: **Nunito** (Google Fonts) — rounded, friendly, highly legible.
- Child-facing story text: 22–26 px, line-height 1.6, ~14 words per line max, sentence case.
- Child buttons/labels: 18–20 px semibold. Parent UI: 16 px base.

## 7. Shape, space, layout
- Corner radius 16–24 px on every interactive element. Child touch targets ≥64 px; parent ≥44 px.
- One primary action per child screen; navigation controls live in fixed positions on every page.
- Progress dots on every multi-page flow — knowing how much remains reduces anxiety.

## 8. Motion
Allowed (and nothing else):
- **Ken Burns on story images:** scale 1.00→1.05 OR a gentle horizontal pan, 12–15 s, linear easing, one direction per page.
- **Page transitions:** 280 ms crossfade, single direction.
- **Success feedback:** 200 ms soft glow (`bb-highlight`) + BeBoo nod.
Forbidden: parallax, bounce/spring overshoot, flashing, looping ornaments, anything under 200 ms or over-eager.
All motion sits behind `useReducedMotion()` combining the child profile setting and `prefers-reduced-motion`; when reduced, images and transitions are static.

## 9. Sound
- Tap-to-play only. The speaker button is the only sound trigger a child ever meets.
- No UI sound effects by default. Success is visual, never a fanfare.
- Narration voice: calm, slow, warm TTS. Optional per-scene soft ambience is parent-opt-in and OFF by default.
- Disclosure: the parent zone plainly states that stories are AI-generated and narration uses an AI-generated voice (an OpenAI usage-policy requirement). Child screens never mention it.

## 10. Illustration style (locked — inject verbatim into every image prompt)
> Flat 2D digital vector illustration in the style of a modern children's picture book series. Simple rounded characters built from soft geometric shapes, slightly large heads, and clearly expressive faces: big oval eyes, visible eyebrows, and simple mouth shapes so the emotion can be read at a glance. Smooth flat color fills, no outlines, very subtle soft shading, no gradients, no texture noise. Calm muted pastel palette of soft teal, warm cream, sand beige, dusty coral and gentle sky blue, low saturation, never neon or harsh primary colors. Soft, even, diffuse lighting with no hard shadows. Eye-level view, one clear focal point, generous negative space, background limited to three or four large simple shapes. Every image looks like a page from the same book, identical character designs and proportions throughout. No text, letters, numbers, or logos anywhere. No photorealism, no 3D render, no busy patterns, no dark or frightening shading, no exaggerated or distorted expressions.

## 11. Ship checklist (run before finishing any screen)
1. Could anything here startle, rush, test, or confuse a child?
2. Is there exactly one primary action, in its fixed position?
3. Any autoplay, flashing, red, score, or timer? (Must be no.)
4. Text ≥4.5:1 contrast, no pure black, sentence case, literal words?
5. Touch targets ≥64 px (child)?
6. Motion within §8 limits AND disabled under reduced motion?
7. Emotion faces from the one shared SVG set?
8. Does every button say exactly what it does?
