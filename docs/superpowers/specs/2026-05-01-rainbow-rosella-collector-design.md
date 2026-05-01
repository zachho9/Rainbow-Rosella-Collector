# Rainbow Rosella Collector — Design Spec

**Date:** 2026-05-01  
**Status:** Approved

---

## Overview

A locally-run, browser-based collection game for a 5-year-old child. The player controls an Eastern Rosella (🦜 emoji) that follows the mouse cursor, collecting hearts, stars, and rainbow gems for points within a 60-second time limit. Three screens: Start, Game, Results.

**Target user:** 5-year-old child, mouse-only input, icon and sound based, purely positive experience.  
**Build target:** Local dev, `npm run dev`, Windows 11 browser.  
**Tech stack:** React + TypeScript + Vite, CSS modules, localStorage, HTML5 Audio API.

---

## Decisions Made in Brainstorming

| Decision | Choice | Rationale |
|---|---|---|
| Game canvas | Full-screen (fills browser window) | More roaming space for the rosella |
| Rosella asset | 🦜 emoji (large) | Fast to implement, charming, zero asset work |
| Audio | Bundle royalty-free sounds from pixabay.com | Game ships with real audio from day one |
| Architecture | Hybrid: refs for hot path, React for everything else | Matches rAF requirement, avoids 60fps re-renders |

---

## Architecture

### Screen State Machine

`App.tsx` holds a single `screen: 'start' | 'playing' | 'results'` string. All three screens are conditional renders of that value.

```
StartScreen  →(Play clicked)→  GameScreen  →(timer hits 0)→  ResultsScreen
ResultsScreen  →(Play Again)→  GameScreen
ResultsScreen  →(Home)→  StartScreen
```

### GameScreen — Two Layers

**React state (slow-changing — triggers re-renders only when values change):**
- `score: number` — updates on each collect
- `timeLeft: number` — decrements once per second via `setInterval`
- `collectibles: Collectible[]` — add on spawn, remove on collect
- `bubble: Bubble | null` — one bubble at a time
- `particles: Particle[]` — short-lived sparkle effects

**Refs (hot path — mutated every rAF frame, never trigger re-renders):**
- `rosellaRef` — the DOM element; position applied via `element.style.transform`
- `rosellaPos: {x, y}` — current interpolated position
- `mousePos: {x, y}` — live cursor coordinates from `mousemove`
- `rafId: number` — animation frame handle for cleanup
- `collectiblesRef` — mirror of collectibles state, kept in sync via `useEffect(() => { collectiblesRef.current = collectibles }, [collectibles])` — allows stale-closure-free collision reads in the rAF callback
- `mutedRef: boolean` — mute state; avoiding re-renders on toggle

### Component Tree

```
App                          — screen state, high score (localStorage)
├── StartScreen              — title, play button, high score pill, mute toggle
├── GameScreen               — owns rAF loop, collectible spawner, bubble timer
│   ├── Background           — sky gradient + clouds + grass hills (static, memo'd)
│   ├── TimerBar             — rainbow bar, shrinks with timeLeft
│   ├── ScoreDisplay         — ⭐ pill, top-right
│   ├── Rosella              — 🦜 emoji, absolutely positioned via ref
│   ├── Collectible ×8–12    — ❤️ ⭐ 🌈 at fixed % positions
│   ├── Bubble?              — pulsing circle, click to pop
│   └── ParticleEffect ×n   — sparkle burst, auto-removed after animation
└── ResultsScreen            — final score, high score, play again / home buttons
```

### Custom Hooks

| Hook | Responsibility |
|---|---|
| `useMousePosition` | Tracks cursor X/Y into a ref — no re-renders |
| `useGameLoop` | Manages rAF lifecycle (start/stop/cleanup); accepts a per-frame callback |
| `useHighScore` | Reads/writes `localStorage` key `rosellaHighScore`; returns `[highScore, maybeUpdate]` |

---

## Game Loop (per frame, ~60fps)

1. Read `mousePos` ref → lerp rosella position by factor 0.15–0.20
2. Apply new position to `rosellaRef.style.transform = translate(x, y)` — no React involvement
3. Loop `collectiblesRef` — check circle collision with rosella
4. On hit → play collect sound, spawn particle effect, call `setScore(s + points)`, remove collectible from state
5. After 0.5–1s `setTimeout`, spawn replacement collectible at a new random position
6. Timer runs via `setInterval` (1s tick) separate from rAF — on zero, transition to results

---

## Data Types

```typescript
type Screen = 'start' | 'playing' | 'results'

type CollectibleType = 'heart' | 'star' | 'gem'

type Collectible = {
  id: string           // crypto.randomUUID()
  type: CollectibleType
  x: number            // % of viewport width
  y: number            // % of viewport height
  points: number       // heart=1, star=3, gem=5
}

type Bubble = {
  id: string
  x: number            // % of viewport
  y: number
  spawnedAt: number    // Date.now() — used to check 8s expiry
  fading: boolean      // triggers CSS fade-out class
}

type Particle = {
  id: string
  x: number            // px — absolute spawn position
  y: number
  angle: number        // radians — direction of travel
  symbol: string       // '✨' | '⭐' | 'circle' (rendered as CSS div)
  color?: string       // pastel hex — used when symbol === 'circle'
  duration: number     // ms — removed from state after this
}
```

---

## Collectibles System

**Count:** Maintain 8–12 collectibles on screen at all times.

**Rarity weights:**
- ❤️ Heart — 70% — 1 point
- ⭐ Star — 20% — 3 points
- 🌈 Rainbow gem — 10% — 5 points

**Spawn position rules:**
- Stored as `%` of viewport (scales with full-screen layout)
- Safe margin: 8% from all edges
- Min distance 80px from other existing collectibles
- Min distance 100px from current rosella position
- Up to 5 retries; place anyway if retries exhausted

**Collision detection:**
```
rosellaRadius    = 45px   // sprite ~70px, +10px generous buffer
collectibleRadius = 30px  // emoji ~50px / 2, small buffer
collect if: distance(rosella, collectible) < rosellaRadius + collectibleRadius
```

---

## Treasure Bubble Mechanic

- One bubble at a time. Spawn every 10–15s (random interval) if no bubble is currently active.
- Visual: CSS-styled circle with radial gradient + rainbow shimmer glow + `pulse` keyframe animation. Clickable area 70–80px diameter.
- **On click:** pop sound + confetti burst (12–16 particles) + spawn 3–5 hearts/stars as real collectibles in a ~80px radius around the bubble → remove bubble.
- **On 8s expiry:** set `fading: true` → CSS fade-out over 0.5s → remove from state. No penalty.
- Expiry checked in the rAF loop against `Date.now() - bubble.spawnedAt`.

---

## Timer Bar

- Horizontal pill container at the top of the game screen (full width, with padding).
- Inner bar width: `(timeLeft / 60) * 100%`.
- Fill: `linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #845ec2)` — rainbow.
- CSS `transition: width 1s linear` for smooth shrinking.
- Under 10s: bar transitions to solid red, adds a `pulse` CSS keyframe animation.
- Seconds number displayed in small text at the right of the pill container.

---

## Particle Effects (CSS-only)

**Collect sparkle** (triggered on collectible pickup):
- 6–8 particles at the item's position
- Each particle: ✨ or ⭐ emoji, or small coloured circle
- Random angle 0–360°, travel ~40–60px outward
- CSS keyframe: `translate + scale(0) + opacity(0)` over 400–500ms
- Removed from React state via `setTimeout` matching duration

**Bubble pop confetti** (triggered on bubble click):
- 12–16 particles, larger burst radius (~80px)
- Mix of ✨ 🌟 and pastel-coloured circles
- Same keyframe pattern, 600ms duration

---

## Audio

All sounds preloaded at app start. A wrapper function `playSound(key)` clones and plays a new `Audio` instance per call so sounds can overlap freely.

| Key | Trigger | Character | File |
|---|---|---|---|
| `collect` | Item collected | Soft ding / pop | `collect.mp3` |
| `bubble-pop` | Bubble clicked | Magical chime / bigger pop | `bubble-pop.mp3` |
| `game-start` | Play clicked | Cheerful upward chime | `game-start.mp3` |
| `game-end` | Timer hits zero | Ta-da fanfare | `game-end.mp3` |
| `high-score` | New high score on results | Extra celebratory chime | `high-score.mp3` |
| `music` | Gameplay (looping BGM) | Gentle kid-friendly music | `music.mp3` |

Source: pixabay.com (free, no attribution required).  
Mute toggle on Start Screen suppresses all SFX and stops BGM. Mute state stored in a ref.

---

## Scoring & High Score

- Score increments on every collect by the item's `points` value.
- Live score shown in a white pill `⭐ 42` at top-right of game screen.
- High score stored in `localStorage` under key `rosellaHighScore`.
- Displayed on Start Screen (`Best: 42 ⭐`) and Results Screen.
- On Results Screen: if `score > highScore`, save new value and show "🏆 New High Score!" badge with a confetti animation.

---

## Visual Design

### Colour Palette

| Role | Value |
|---|---|
| Sky top | `#B8E5F5` |
| Sky bottom | `#E0F4FA` |
| Grass | `#A8D86E` |
| Grass shadow | `#7BC04A` |
| Primary button | `#FF8FA3` (shadow `#E66B82`) |
| Secondary button | `#FFD93D` (shadow `#E6B82E`) |
| Text | `#2C3E50` |
| Card background | `#FFFFFF` / `#FFF5F8` |

### Typography
- Title: **Fredoka One** (Google Fonts)
- Body/UI: **Nunito** (Google Fonts)

### Buttons
```css
background: #FF8FA3;
box-shadow: 0 6px 0 #E66B82;
border-radius: 24–32px;
border: none;
padding: 16px 32px;

&:active {
  box-shadow: none;
  transform: translateY(6px);
}
```

### Layering
1. Sky gradient (background)
2. Clouds (mid-back)
3. Grass hills (midground)
4. Flowers, collectibles, bubble (foreground)
5. Rosella, particles (top foreground)
6. HUD (timer bar, score pill) — fixed overlay

---

## Screens

### Start Screen
- Sky+grass background, fluffy clouds, tulip flowers on grass
- Title "Rainbow Rosella" — Fredoka One, centred near top
- 🦜 emoji mascot, large, centre screen
- Big pink Play button below mascot
- `Best: 42 ⭐` pill — top-right
- 🔊 mute toggle — top-left

### Game Screen
- Same background for continuity
- Rainbow timer bar — top, full width pill
- `⭐ 18` score pill — top-right
- 🦜 following cursor (lerp)
- 8–12 collectibles scattered in play area
- Bubble (when active) — pulsing, clickable
- Particle effects on collect and pop events

### Results Screen
- Same background
- Confetti emojis scattered across top
- "Great job! 🎉" — large, Fredoka One
- 🦜 mascot — large, centre
- Score pill `You got 42 ⭐` — centred
- `🏆 New High Score!` badge (conditional, yellow)
- Pink "▶ Play Again" button
- Optional "Home" button (secondary yellow style)

---

## Project Structure

```
src/
├── components/
│   ├── StartScreen.tsx
│   ├── GameScreen.tsx
│   ├── ResultsScreen.tsx
│   ├── Background.tsx
│   ├── Rosella.tsx
│   ├── Collectible.tsx
│   ├── Bubble.tsx
│   ├── TimerBar.tsx
│   ├── ScoreDisplay.tsx
│   └── ParticleEffect.tsx
├── hooks/
│   ├── useMousePosition.ts
│   ├── useGameLoop.ts
│   └── useHighScore.ts
├── utils/
│   ├── collision.ts
│   ├── spawn.ts
│   └── sound.ts
├── types/
│   └── game.ts
├── styles/
│   └── (CSS modules per component)
├── assets/
│   └── sounds/
│       ├── collect.mp3
│       ├── bubble-pop.mp3
│       ├── game-start.mp3
│       ├── game-end.mp3
│       ├── high-score.mp3
│       └── music.mp3
├── App.tsx
└── main.tsx
```

---

## Acceptance Criteria

- Runs locally with `npm run dev`, no console errors
- All three screens display and transition correctly
- Rosella smoothly follows mouse cursor (lerp, no snapping)
- Collectibles collected on hover with sound + sparkle feedback
- Bubble spawns every 10–15s, pops on click with confetti + item burst
- 60-second rainbow timer bar counts down and ends game at zero
- Score updates live; high score saves to localStorage
- All 6 sounds play without delay or overlap issues
- Visual style matches palette and typography spec
- Fun and independently playable by a 5-year-old
