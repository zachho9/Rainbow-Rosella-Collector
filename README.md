# Rosella Collector

A browser-based collection game built for kids. Move the mouse to guide a Rainbow Rosella (🦜) around the screen and collect hearts, stars, and gems before the timer runs out.

## Getting Started

```bash
npm install
npm run dev        # dev server at localhost:5173
```

```bash
npm run build      # TypeScript compile + Vite bundle
npm run preview    # serve built output at localhost:4173
npm test           # unit tests (watch mode)
```

## How to Play

- Move the mouse — the rosella follows the cursor
- Collect items by touching them with the rosella
- Click pulsing bubbles for bonus items
- 60-second timer; highest score is saved between sessions

| Item | Points |
|------|--------|
| ❤️ Heart | 1 |
| ⭐ Star | 3 |
| 🌈 Gem | 5 |

## Project Structure

```
src/
  components/     UI components, each with a co-located CSS Module
  hooks/          useMousePosition, useGameLoop, useHighScore, useLeaderboard
  utils/          collision, spawn, particles, sound
  types/          shared TypeScript types
public/sounds/    audio assets (collect, bubble-pop, game-start, game-end, high-score, music)
docs/             requirements, design spec, implementation plan, bug write-ups
```

## Architecture Notes

**Hybrid React + refs for the game loop.** The rosella position and mouse coordinates are stored in refs and applied directly via `element.style.transform` — not React state. This keeps the 60fps `requestAnimationFrame` loop from triggering React re-renders. React state is only updated when something visually meaningful changes (score, timer, collectibles, particles).

**Audio.** All sounds are preloaded at startup. Background music starts muted (browser-compatible) and unmutes on first user interaction. See [`docs/game-music-start-issue.md`](docs/game-music-start-issue.md) for a known issue with music autoplay on fresh origins.

**Storage.** No backend. High score and leaderboard (top 10) are stored in `localStorage` under `rosellaHighScore` and `rosellaLeaderboard`.

## Tech Stack

- React 19 + TypeScript
- Vite (build + dev server)
- CSS Modules
- Vitest + Testing Library (unit tests for collision, spawn, storage hooks)
