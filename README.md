# Rainbow Rosella Collector

A browser-based collection game built for young kids. Move the mouse to guide a Rainbow Rosella (🦜) around the screen and collect hearts, stars, and gems before the timer runs out.
  
<img width="1318" height="591" alt="title" src="https://github.com/user-attachments/assets/7ac0dc54-a4f9-4036-b859-319c27aec3c9" />

## Running Locally

```bash
npm install
npm run dev        # dev server at localhost:5173
```

To verify the production build locally before pushing:

```bash
npm run build      # TypeScript compile + Vite bundle
npm run preview    # serve built output at localhost:4173
```

Other commands:

```bash
npm run lint       # ESLint
npm run test       # unit tests (watch mode)
```

## GitHub Pages

The live version is automatically deployed at:
**https://zachho9.github.io/Rainbow-Rosella-Collector/**


## How to Play

- Move the mouse, the rosella follows the cursor. Touch screen is not supported for now.
- Collect items by touching them with the rosella
- Click pulsing bubbles for bonus items
- 60-second timer. Highest score is saved between sessions

| Item | Points |
|------|--------|
| ❤️ Heart | 1 |
| ⭐ Star | 3 |
| 🌈 Gem | 5 |

## Project Structure

```
src/
  components/     UI components
  hooks/          useMousePosition, useGameLoop, useHighScore, useLeaderboard
  utils/          collision, spawn, particles, sound
  types/          shared TypeScript types
public/sounds/    audio assets
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
