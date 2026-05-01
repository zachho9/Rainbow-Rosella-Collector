# Rainbow Rosella Collector — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-screen browser collection game where a 🦜 emoji follows the mouse, collecting hearts/stars/gems for points in 60 seconds, with bubbles to pop, sparkle effects, and bundled sound.

**Architecture:** Hybrid React + refs. The rAF game loop reads/writes refs directly for 60fps rosella movement and collision detection. React state (score, timer, collectibles, bubble, particles) is only updated when values actually change. Three screens (`start` | `playing` | `results`) managed in `App.tsx`.

**Tech Stack:** React 18, TypeScript, Vite, CSS Modules, Vitest + @testing-library/react, HTML5 Audio API, localStorage.

---

## File Map

```
index.html                              — Google Fonts link, root div
vite.config.ts                          — Vite + Vitest config
src/
  main.tsx                              — mount app, call preloadSounds()
  index.css                             — CSS reset, full-screen body, cursor:none
  App.tsx                               — screen state machine, high score, mutedRef
  test-setup.ts                         — @testing-library/jest-dom import
  types/
    game.ts                             — Screen, Collectible, Bubble, Particle types
  utils/
    collision.ts                        — distance(), isColliding()
    collision.test.ts
    spawn.ts                            — pickCollectibleType(), spawnPosition()
    spawn.test.ts
    particles.ts                        — spawnCollectSparkle(), spawnBubbleConfetti()
    sound.ts                            — preloadSounds(), playSound(), stopSound()
  hooks/
    useMousePosition.ts                 — cursor → ref, no re-renders
    useGameLoop.ts                      — rAF lifecycle, active flag
    useHighScore.ts                     — localStorage read/write
    useHighScore.test.ts
  components/
    Background.tsx / .module.css        — sky + clouds + grass (memo'd)
    StartScreen.tsx / .module.css       — title, play btn, high score pill, mute
    GameScreen.tsx / .module.css        — owns all game logic
    Rosella.tsx / .module.css           — forwardRef, positioned via style.transform
    Collectible.tsx / .module.css       — single collectible emoji
    TimerBar.tsx / .module.css          — rainbow bar, shrinks, red pulse <10s
    ScoreDisplay.tsx / .module.css      — ⭐ pill, top-right
    Bubble.tsx / .module.css            — CSS circle, pulse anim, fading state
    ParticleEffect.tsx / .module.css    — burst particles, CSS keyframes
    ResultsScreen.tsx / .module.css     — score, high score badge, play again
public/
  sounds/
    collect.mp3
    bubble-pop.mp3
    game-start.mp3
    game-end.mp3
    high-score.mp3
    music.mp3
```

---

## Task 1: Scaffold Vite + React + TypeScript + Vitest

**Files:**
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `src/test-setup.ts`
- Create: `src/main.tsx`
- Create: `src/index.css`

- [ ] **Step 1: Scaffold project**

```bash
cd E:/Coding/Rosella-Collector
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty. Remove existing files and continue?" — choose **Yes**.

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom @vitest/coverage-v8
```

- [ ] **Step 3: Replace `vite.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 4: Create `src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Update `tsconfig.app.json` — add vitest globals**

Open `tsconfig.app.json`. Inside `"compilerOptions"`, add to the `"types"` array (create it if missing):

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

- [ ] **Step 6: Replace `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rainbow Rosella</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Replace `src/index.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Nunito', sans-serif;
  color: #2C3E50;
}

body {
  cursor: none;
}
```

- [ ] **Step 8: Replace `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 9: Delete boilerplate files**

```bash
rm -f src/App.css src/App.tsx public/vite.svg
rm -rf src/assets
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts. Browser shows an error (no App.tsx yet) — that's fine.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript + Vitest"
```

---

## Task 2: TypeScript game types

**Files:**
- Create: `src/types/game.ts`

- [ ] **Step 1: Create `src/types/game.ts`**

```typescript
export type Screen = 'start' | 'playing' | 'results'

export type CollectibleType = 'heart' | 'star' | 'gem'

export interface Collectible {
  id: string
  type: CollectibleType
  x: number        // % of viewport width
  y: number        // % of viewport height
  points: number   // heart=1, star=3, gem=5
}

export interface Bubble {
  id: string
  x: number        // % of viewport width
  y: number        // % of viewport height
  spawnedAt: number  // Date.now()
  fading: boolean
}

export interface Particle {
  id: string
  x: number        // px absolute
  y: number        // px absolute
  angle: number    // radians
  symbol: string   // '✨' | '⭐' | 'circle'
  color?: string   // hex — only used when symbol === 'circle'
  duration: number // ms
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/game.ts
git commit -m "feat: add TypeScript game types"
```

---

## Task 3: Utility functions with tests

**Files:**
- Create: `src/utils/collision.ts`
- Create: `src/utils/collision.test.ts`
- Create: `src/utils/spawn.ts`
- Create: `src/utils/spawn.test.ts`
- Create: `src/utils/particles.ts`

- [ ] **Step 1: Create `src/utils/collision.ts`**

```typescript
export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

export function isColliding(
  ax: number, ay: number, aRadius: number,
  bx: number, by: number, bRadius: number,
): boolean {
  return distance(ax, ay, bx, by) < aRadius + bRadius
}
```

- [ ] **Step 2: Create `src/utils/collision.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { distance, isColliding } from './collision'

describe('distance', () => {
  it('returns 0 for the same point', () => {
    expect(distance(0, 0, 0, 0)).toBe(0)
  })
  it('returns 5 for a 3-4-5 triangle', () => {
    expect(distance(0, 0, 3, 4)).toBe(5)
  })
  it('is symmetric', () => {
    expect(distance(1, 2, 4, 6)).toBe(distance(4, 6, 1, 2))
  })
})

describe('isColliding', () => {
  it('returns true when circles overlap', () => {
    // circles at (0,0) r=30 and (20,0) r=30 — overlap by 40px
    expect(isColliding(0, 0, 30, 20, 0, 30)).toBe(true)
  })
  it('returns false when circles are apart', () => {
    // circles at (0,0) r=10 and (100,0) r=10 — gap of 80px
    expect(isColliding(0, 0, 10, 100, 0, 10)).toBe(false)
  })
  it('returns false when circles just touch (not strictly less than)', () => {
    // circles at (0,0) r=30 and (60,0) r=30 — distance === sum of radii
    expect(isColliding(0, 0, 30, 60, 0, 30)).toBe(false)
  })
})
```

- [ ] **Step 3: Run collision tests**

```bash
npx vitest run src/utils/collision.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 4: Create `src/utils/spawn.ts`**

```typescript
import type { CollectibleType } from '../types/game'

interface WeightEntry {
  type: CollectibleType
  weight: number
  points: number
}

const WEIGHTS: WeightEntry[] = [
  { type: 'heart', weight: 70, points: 1 },
  { type: 'star',  weight: 20, points: 3 },
  { type: 'gem',   weight: 10, points: 5 },
]

export function pickCollectibleType(): { type: CollectibleType; points: number } {
  const total = WEIGHTS.reduce((s, w) => s + w.weight, 0)
  let r = Math.random() * total
  for (const w of WEIGHTS) {
    r -= w.weight
    if (r <= 0) return { type: w.type, points: w.points }
  }
  return { type: 'heart', points: 1 }
}

export interface SpawnOptions {
  existing: Array<{ x: number; y: number }>
  rosellaX: number   // % viewport
  rosellaY: number   // % viewport
  vpW: number        // viewport width px
  vpH: number        // viewport height px
  margin?: number    // % from edges, default 8
  minFromOthers?: number   // px, default 80
  minFromRosella?: number  // px, default 100
  maxRetries?: number      // default 5
}

export function spawnPosition(opts: SpawnOptions): { x: number; y: number } {
  const {
    existing, rosellaX, rosellaY, vpW, vpH,
    margin = 8, minFromOthers = 80, minFromRosella = 100, maxRetries = 5,
  } = opts

  const rosXpx = (rosellaX / 100) * vpW
  const rosYpx = (rosellaY / 100) * vpH

  for (let i = 0; i < maxRetries; i++) {
    const x = margin + Math.random() * (100 - margin * 2)
    const y = margin + Math.random() * (100 - margin * 2)
    const xpx = (x / 100) * vpW
    const ypx = (y / 100) * vpH

    const distRosella = Math.hypot(xpx - rosXpx, ypx - rosYpx)
    if (distRosella < minFromRosella) continue

    const tooClose = existing.some(c => {
      const cx = (c.x / 100) * vpW
      const cy = (c.y / 100) * vpH
      return Math.hypot(xpx - cx, ypx - cy) < minFromOthers
    })
    if (tooClose) continue

    return { x, y }
  }

  return {
    x: margin + Math.random() * (100 - margin * 2),
    y: margin + Math.random() * (100 - margin * 2),
  }
}
```

- [ ] **Step 5: Create `src/utils/spawn.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { pickCollectibleType, spawnPosition } from './spawn'

const BASE = { existing: [], rosellaX: 50, rosellaY: 50, vpW: 1280, vpH: 720 }

describe('pickCollectibleType', () => {
  it('always returns a valid type', () => {
    for (let i = 0; i < 100; i++) {
      expect(['heart', 'star', 'gem']).toContain(pickCollectibleType().type)
    }
  })
  it('hearts outnumber stars, stars outnumber gems over 1000 trials', () => {
    const counts = { heart: 0, star: 0, gem: 0 }
    for (let i = 0; i < 1000; i++) counts[pickCollectibleType().type]++
    expect(counts.heart).toBeGreaterThan(counts.star)
    expect(counts.star).toBeGreaterThan(counts.gem)
  })
  it('returns correct points for each type', () => {
    // Run enough trials to hit each type
    const seen = new Map<string, number>()
    for (let i = 0; i < 500; i++) {
      const { type, points } = pickCollectibleType()
      seen.set(type, points)
    }
    expect(seen.get('heart')).toBe(1)
    expect(seen.get('star')).toBe(3)
    expect(seen.get('gem')).toBe(5)
  })
})

describe('spawnPosition', () => {
  it('stays within safe margins', () => {
    for (let i = 0; i < 50; i++) {
      const { x, y } = spawnPosition(BASE)
      expect(x).toBeGreaterThanOrEqual(8)
      expect(x).toBeLessThanOrEqual(92)
      expect(y).toBeGreaterThanOrEqual(8)
      expect(y).toBeLessThanOrEqual(92)
    }
  })
  it('always returns a position even when all retries fail', () => {
    const packed = Array.from({ length: 50 }, (_, i) => ({ x: i * 1.5, y: 50 }))
    const pos = spawnPosition({ ...BASE, existing: packed })
    expect(typeof pos.x).toBe('number')
    expect(typeof pos.y).toBe('number')
  })
})
```

- [ ] **Step 6: Run spawn tests**

```bash
npx vitest run src/utils/spawn.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 7: Create `src/utils/particles.ts`**

```typescript
import type { Particle } from '../types/game'

const PASTELS = ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF']

function rid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function spawnCollectSparkle(x: number, y: number): Particle[] {
  const count = 6 + Math.floor(Math.random() * 3)
  return Array.from({ length: count }, (_, i) => ({
    id: rid(),
    x,
    y,
    angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8,
    symbol: Math.random() < 0.5 ? '✨' : '⭐',
    duration: 400 + Math.random() * 100,
  }))
}

export function spawnBubbleConfetti(x: number, y: number): Particle[] {
  const count = 12 + Math.floor(Math.random() * 5)
  return Array.from({ length: count }, (_, i) => ({
    id: rid(),
    x,
    y,
    angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
    symbol: Math.random() < 0.3 ? '✨' : Math.random() < 0.5 ? '🌟' : 'circle',
    color: PASTELS[Math.floor(Math.random() * PASTELS.length)],
    duration: 500 + Math.random() * 150,
  }))
}
```

- [ ] **Step 8: Commit**

```bash
git add src/utils/
git commit -m "feat: add collision, spawn, and particle utilities with tests"
```

---

## Task 4: Custom hooks with tests

**Files:**
- Create: `src/hooks/useMousePosition.ts`
- Create: `src/hooks/useGameLoop.ts`
- Create: `src/hooks/useHighScore.ts`
- Create: `src/hooks/useHighScore.test.ts`

- [ ] **Step 1: Create `src/hooks/useMousePosition.ts`**

```typescript
import { useEffect, useRef } from 'react'

export function useMousePosition() {
  const pos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return pos
}
```

- [ ] **Step 2: Create `src/hooks/useGameLoop.ts`**

```typescript
import { useEffect, useRef } from 'react'

export function useGameLoop(callback: () => void, active: boolean) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!active) return

    let rafId: number

    const loop = () => {
      callbackRef.current()
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [active])
}
```

- [ ] **Step 3: Create `src/hooks/useHighScore.ts`**

```typescript
import { useState, useCallback } from 'react'

const LS_KEY = 'rosellaHighScore'

export function useHighScore(): [number, (score: number) => boolean] {
  const [highScore, setHighScore] = useState<number>(() => {
    const stored = localStorage.getItem(LS_KEY)
    return stored ? parseInt(stored, 10) : 0
  })

  const maybeUpdate = useCallback((score: number): boolean => {
    if (score > highScore) {
      localStorage.setItem(LS_KEY, String(score))
      setHighScore(score)
      return true
    }
    return false
  }, [highScore])

  return [highScore, maybeUpdate]
}
```

- [ ] **Step 4: Create `src/hooks/useHighScore.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHighScore } from './useHighScore'

beforeEach(() => localStorage.clear())

describe('useHighScore', () => {
  it('returns 0 when nothing is saved', () => {
    const { result } = renderHook(() => useHighScore())
    expect(result.current[0]).toBe(0)
  })

  it('loads a persisted score on init', () => {
    localStorage.setItem('rosellaHighScore', '42')
    const { result } = renderHook(() => useHighScore())
    expect(result.current[0]).toBe(42)
  })

  it('saves and returns the new high score when beaten', () => {
    const { result } = renderHook(() => useHighScore())
    act(() => { result.current[1](99) })
    expect(result.current[0]).toBe(99)
    expect(localStorage.getItem('rosellaHighScore')).toBe('99')
  })

  it('returns true when a new high score is set', () => {
    const { result } = renderHook(() => useHighScore())
    let isNew!: boolean
    act(() => { isNew = result.current[1](50) })
    expect(isNew).toBe(true)
  })

  it('returns false and does not save when score is not higher', () => {
    localStorage.setItem('rosellaHighScore', '100')
    const { result } = renderHook(() => useHighScore())
    let isNew!: boolean
    act(() => { isNew = result.current[1](50) })
    expect(isNew).toBe(false)
    expect(localStorage.getItem('rosellaHighScore')).toBe('100')
  })
})
```

- [ ] **Step 5: Run hook tests**

```bash
npx vitest run src/hooks/useHighScore.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/
git commit -m "feat: add custom hooks with high score tests"
```

---

## Task 5: Background component + global styles

**Files:**
- Create: `src/components/Background.tsx`
- Create: `src/components/Background.module.css`

- [ ] **Step 1: Create `src/components/Background.module.css`**

```css
.bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.sky {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #B8E5F5 0%, #E0F4FA 100%);
}

.cloud {
  position: absolute;
  background: #ffffff;
  border-radius: 50px;
  opacity: 0.95;
}

.grassShadow {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: #7BC04A;
  border-radius: 60% 60% 0 0 / 20px 20px 0 0;
}

.grass {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: #A8D86E;
  border-radius: 60% 60% 0 0 / 40px 40px 0 0;
}

.flowers {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.flowers span {
  position: absolute;
  font-size: 20px;
  pointer-events: none;
  user-select: none;
}
```

- [ ] **Step 2: Create `src/components/Background.tsx`**

```tsx
import { memo } from 'react'
import styles from './Background.module.css'

const CLOUDS = [
  { top: '5%',  left: '6%',   width: 90,  height: 34 },
  { top: '3%',  left: '13%',  width: 65,  height: 24 },
  { top: '7%',  left: '33%',  width: 110, height: 38 },
  { top: '4%',  right: '18%', width: 80,  height: 30 },
  { top: '9%',  right: '6%',  width: 100, height: 36 },
]

export default memo(function Background() {
  return (
    <div className={styles.bg}>
      <div className={styles.sky} />
      {CLOUDS.map((c, i) => (
        <div key={i} className={styles.cloud} style={c as React.CSSProperties} />
      ))}
      <div className={styles.grass} />
      <div className={styles.grassShadow} />
      <div className={styles.flowers}>
        <span style={{ bottom: 38, left: 40 }}>🌷</span>
        <span style={{ bottom: 34, left: 90 }}>🌸</span>
        <span style={{ bottom: 38, left: 200 }}>🌷</span>
        <span style={{ bottom: 34, right: 40 }}>🌷</span>
        <span style={{ bottom: 38, right: 90 }}>🌸</span>
        <span style={{ bottom: 34, right: 200 }}>🌸</span>
      </div>
    </div>
  )
})
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Background.tsx src/components/Background.module.css
git commit -m "feat: add Background component (sky, clouds, grass)"
```

---

## Task 6: App.tsx screen state machine

**Files:**
- Create: `src/App.tsx`
- Create: `src/components/StartScreen.tsx` (stub)
- Create: `src/components/GameScreen.tsx` (stub)
- Create: `src/components/ResultsScreen.tsx` (stub)

- [ ] **Step 1: Create stub screens**

`src/components/StartScreen.tsx`:
```tsx
import type { MutableRefObject } from 'react'

interface Props {
  highScore: number
  mutedRef: MutableRefObject<boolean>
  onPlay: () => void
}

export default function StartScreen({ onPlay }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <button onClick={onPlay} style={{ fontSize: 32, padding: '16px 40px' }}>▶ Play</button>
    </div>
  )
}
```

`src/components/GameScreen.tsx`:
```tsx
import type { MutableRefObject } from 'react'

interface Props {
  mutedRef: MutableRefObject<boolean>
  onGameEnd: (score: number) => void
}

export default function GameScreen({ onGameEnd }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <button onClick={() => onGameEnd(42)} style={{ fontSize: 24 }}>End Game (debug)</button>
    </div>
  )
}
```

`src/components/ResultsScreen.tsx`:
```tsx
interface Props {
  score: number
  highScore: number
  isNewHighScore: boolean
  onPlayAgain: () => void
  onHome: () => void
}

export default function ResultsScreen({ score, onPlayAgain }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24 }}>
      <p style={{ fontSize: 32 }}>Score: {score}</p>
      <button onClick={onPlayAgain} style={{ fontSize: 24, padding: '12px 32px' }}>Play Again</button>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/App.tsx`**

```tsx
import { useState, useRef, useCallback } from 'react'
import type { Screen } from './types/game'
import { useHighScore } from './hooks/useHighScore'
import StartScreen from './components/StartScreen'
import GameScreen from './components/GameScreen'
import ResultsScreen from './components/ResultsScreen'

export default function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [lastScore, setLastScore] = useState(0)
  const [isNewHighScore, setIsNewHighScore] = useState(false)
  const [highScore, maybeUpdateHighScore] = useHighScore()
  const mutedRef = useRef(false)

  const handlePlay = useCallback(() => setScreen('playing'), [])

  const handleGameEnd = useCallback((score: number) => {
    const isNew = maybeUpdateHighScore(score)
    setLastScore(score)
    setIsNewHighScore(isNew)
    setScreen('results')
  }, [maybeUpdateHighScore])

  const handlePlayAgain = useCallback(() => setScreen('playing'), [])
  const handleHome = useCallback(() => setScreen('start'), [])

  return (
    <>
      {screen === 'start' && (
        <StartScreen highScore={highScore} mutedRef={mutedRef} onPlay={handlePlay} />
      )}
      {screen === 'playing' && (
        <GameScreen mutedRef={mutedRef} onGameEnd={handleGameEnd} />
      )}
      {screen === 'results' && (
        <ResultsScreen
          score={lastScore}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      )}
    </>
  )
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected: Start screen with a Play button → click → Game screen with "End Game" button → click → Results screen with score 42 and "Play Again" → works.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/StartScreen.tsx src/components/GameScreen.tsx src/components/ResultsScreen.tsx
git commit -m "feat: screen state machine with stub screens"
```

---

## Task 7: Source sound files

**Files:**
- Create: `public/sounds/collect.mp3`
- Create: `public/sounds/bubble-pop.mp3`
- Create: `public/sounds/game-start.mp3`
- Create: `public/sounds/game-end.mp3`
- Create: `public/sounds/high-score.mp3`
- Create: `public/sounds/music.mp3`

- [ ] **Step 1: Create sounds directory**

```bash
mkdir -p public/sounds
```

- [ ] **Step 2: Download sounds from pixabay.com**

Go to **pixabay.com/sound-effects** and search for each. All sounds on Pixabay are free to use, no attribution required. Download as MP3 and save to `public/sounds/` with the exact filenames below.

| Filename | Search term | What to pick |
|---|---|---|
| `collect.mp3` | `ding collect` | A short soft ding or pop — under 1 second |
| `bubble-pop.mp3` | `bubble pop magic` | A satisfying pop with a little sparkle — distinct from collect |
| `game-start.mp3` | `game start chime` | A cheerful upward 2–3 note jingle |
| `game-end.mp3` | `fanfare ta-da kids` | A celebratory "ta-da" — 2–3 seconds |
| `high-score.mp3` | `achievement jingle` | An extra-celebratory chime — can be longer |
| `music.mp3` | `kids game music loop` | A gentle looping background track — pick a short loopable one |

- [ ] **Step 3: Verify files exist**

```bash
ls public/sounds/
```

Expected output:
```
bubble-pop.mp3  collect.mp3  game-end.mp3  game-start.mp3  high-score.mp3  music.mp3
```

- [ ] **Step 4: Commit**

```bash
git add public/sounds/
git commit -m "feat: add bundled royalty-free sound effects"
```

---

## Task 8: Sound utility

**Files:**
- Create: `src/utils/sound.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create `src/utils/sound.ts`**

```typescript
export type SoundKey = 'collect' | 'bubble-pop' | 'game-start' | 'game-end' | 'high-score' | 'music'

const FILES: Record<SoundKey, string> = {
  'collect':     '/sounds/collect.mp3',
  'bubble-pop':  '/sounds/bubble-pop.mp3',
  'game-start':  '/sounds/game-start.mp3',
  'game-end':    '/sounds/game-end.mp3',
  'high-score':  '/sounds/high-score.mp3',
  'music':       '/sounds/music.mp3',
}

const cache: Partial<Record<SoundKey, HTMLAudioElement>> = {}

export function preloadSounds(): void {
  for (const [key, path] of Object.entries(FILES) as [SoundKey, string][]) {
    const el = new Audio(path)
    el.preload = 'auto'
    if (key === 'music') el.loop = true
    cache[key] = el
  }
}

export function playSound(key: SoundKey, muted: boolean): void {
  if (muted) return
  const src = cache[key]
  if (!src) return
  if (key === 'music') {
    src.currentTime = 0
    src.play().catch(() => {})
    return
  }
  const clone = src.cloneNode() as HTMLAudioElement
  clone.play().catch(() => {})
}

export function stopSound(key: SoundKey): void {
  const src = cache[key]
  if (!src) return
  src.pause()
  src.currentTime = 0
}
```

- [ ] **Step 2: Call `preloadSounds()` in `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { preloadSounds } from './utils/sound'

preloadSounds()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/sound.ts src/main.tsx
git commit -m "feat: add sound preloader and playSound utility"
```

---

## Task 9: StartScreen (full implementation)

**Files:**
- Modify: `src/components/StartScreen.tsx`
- Create: `src/components/StartScreen.module.css`

- [ ] **Step 1: Create `src/components/StartScreen.module.css`**

```css
.screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 10;
}

.muteBtn {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 50%;
  width: 46px;
  height: 46px;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.highScore {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
  font-family: 'Fredoka One', cursive;
  font-size: clamp(36px, 6vw, 72px);
  color: #2C3E50;
  text-shadow: 0 3px 0 rgba(255, 255, 255, 0.6);
}

.mascot {
  font-size: clamp(80px, 12vw, 140px);
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.15));
  animation: float 3s ease-in-out infinite;
  user-select: none;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-14px); }
}

.playBtn {
  font-family: 'Fredoka One', cursive;
  font-size: 28px;
  color: #fff;
  background: #FF8FA3;
  border: none;
  border-radius: 28px;
  padding: 16px 52px;
  cursor: pointer;
  box-shadow: 0 6px 0 #E66B82;
  user-select: none;
  transition: transform 0.08s;
}

.playBtn:active {
  box-shadow: none;
  transform: translateY(6px);
}
```

- [ ] **Step 2: Replace `src/components/StartScreen.tsx`**

```tsx
import { useState } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import { playSound } from '../utils/sound'
import styles from './StartScreen.module.css'

interface Props {
  highScore: number
  mutedRef: MutableRefObject<boolean>
  onPlay: () => void
}

export default function StartScreen({ highScore, mutedRef, onPlay }: Props) {
  const [muted, setMuted] = useState(mutedRef.current)

  const toggleMute = () => {
    mutedRef.current = !mutedRef.current
    setMuted(mutedRef.current)
  }

  const handlePlay = () => {
    playSound('game-start', mutedRef.current)
    onPlay()
  }

  return (
    <>
      <Background />
      <div className={styles.screen}>
        <button className={styles.muteBtn} onClick={toggleMute} aria-label="Toggle sound">
          {muted ? '🔇' : '🔊'}
        </button>
        <div className={styles.highScore}>Best: {highScore} ⭐</div>
        <h1 className={styles.title}>Rainbow Rosella</h1>
        <div className={styles.mascot}>🦜</div>
        <button className={styles.playBtn} onClick={handlePlay}>▶ Play!</button>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected: Start screen shows sky/grass background, floating 🦜 emoji, "Rainbow Rosella" title, pink Play button, mute toggle top-left, high score top-right.

- [ ] **Step 4: Commit**

```bash
git add src/components/StartScreen.tsx src/components/StartScreen.module.css
git commit -m "feat: full StartScreen with background, mascot, mute toggle"
```

---

## Task 10: GameScreen — Rosella + timer + HUD

**Files:**
- Create: `src/components/Rosella.tsx`
- Create: `src/components/Rosella.module.css`
- Create: `src/components/TimerBar.tsx`
- Create: `src/components/TimerBar.module.css`
- Create: `src/components/ScoreDisplay.tsx`
- Create: `src/components/ScoreDisplay.module.css`
- Modify: `src/components/GameScreen.tsx`

- [ ] **Step 1: Create `src/components/Rosella.module.css`**

```css
.rosella {
  position: fixed;
  top: 0;
  left: 0;
  width: 70px;
  height: 70px;
  font-size: 64px;
  line-height: 70px;
  text-align: center;
  pointer-events: none;
  z-index: 20;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  user-select: none;
  will-change: transform;
}
```

- [ ] **Step 2: Create `src/components/Rosella.tsx`**

```tsx
import { forwardRef } from 'react'
import styles from './Rosella.module.css'

const Rosella = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className={styles.rosella}>🦜</div>
))
Rosella.displayName = 'Rosella'
export default Rosella
```

- [ ] **Step 3: Create `src/components/TimerBar.module.css`**

```css
.container {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 180px);
  background: white;
  border-radius: 20px;
  padding: 5px 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 30;
}

.bar {
  flex: 1;
  height: 14px;
  border-radius: 10px;
  background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #845ec2);
  transition: width 1s linear;
}

.barUrgent {
  background: #ff4444;
  animation: pulse 0.5s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { opacity: 1; }
  to   { opacity: 0.4; }
}

.label {
  font-size: 13px;
  font-weight: 800;
  color: #2C3E50;
  white-space: nowrap;
  min-width: 28px;
  text-align: right;
}
```

- [ ] **Step 4: Create `src/components/TimerBar.tsx`**

```tsx
import styles from './TimerBar.module.css'

interface Props {
  timeLeft: number
  total?: number
}

export default function TimerBar({ timeLeft, total = 60 }: Props) {
  const pct = Math.max(0, (timeLeft / total) * 100)
  const urgent = timeLeft <= 10

  return (
    <div className={styles.container}>
      <div
        className={`${styles.bar} ${urgent ? styles.barUrgent : ''}`}
        style={{ width: `${pct}%` }}
      />
      <span className={styles.label}>{timeLeft}s</span>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/components/ScoreDisplay.module.css`**

```css
.pill {
  position: fixed;
  top: 12px;
  right: 16px;
  background: white;
  border-radius: 20px;
  padding: 8px 18px;
  font-size: 20px;
  font-weight: 800;
  color: #2C3E50;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 30;
  user-select: none;
}
```

- [ ] **Step 6: Create `src/components/ScoreDisplay.tsx`**

```tsx
import styles from './ScoreDisplay.module.css'

export default function ScoreDisplay({ score }: { score: number }) {
  return <div className={styles.pill}>⭐ {score}</div>
}
```

- [ ] **Step 7: Replace `src/components/GameScreen.tsx`**

```tsx
import { useRef, useState, useEffect, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import Rosella from './Rosella'
import TimerBar from './TimerBar'
import ScoreDisplay from './ScoreDisplay'
import { useMousePosition } from '../hooks/useMousePosition'
import { useGameLoop } from '../hooks/useGameLoop'
import { playSound, stopSound } from '../utils/sound'

const LERP = 0.18
const GAME_DURATION = 60

interface Props {
  mutedRef: MutableRefObject<boolean>
  onGameEnd: (score: number) => void
}

export default function GameScreen({ mutedRef, onGameEnd }: Props) {
  const [score] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [active, setActive] = useState(true)

  const rosellaRef = useRef<HTMLDivElement>(null)
  const rosellaPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const mousePos = useMousePosition()
  const scoreRef = useRef(0)
  const activeRef = useRef(true)

  // Start BGM
  useEffect(() => {
    playSound('music', mutedRef.current)
    return () => stopSound('music')
  }, [mutedRef])

  const tick = useCallback(() => {
    if (!activeRef.current) return
    const target = mousePos.current
    const pos = rosellaPos.current
    pos.x += (target.x - pos.x) * LERP
    pos.y += (target.y - pos.y) * LERP
    if (rosellaRef.current) {
      rosellaRef.current.style.transform =
        `translate(${Math.round(pos.x - 35)}px, ${Math.round(pos.y - 35)}px)`
    }
  }, [mousePos])

  useGameLoop(tick, active)

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id)
          activeRef.current = false
          setActive(false)
          setTimeout(() => {
            playSound('game-end', mutedRef.current)
            onGameEnd(scoreRef.current)
          }, 300)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [onGameEnd, mutedRef])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Background />
      <TimerBar timeLeft={timeLeft} />
      <ScoreDisplay score={score} />
      <Rosella ref={rosellaRef} />
    </div>
  )
}
```

- [ ] **Step 8: Verify in browser**

```bash
npm run dev
```

Expected: Click Play → game screen shows rosella 🦜 following mouse cursor smoothly. Rainbow timer bar shrinks. After 60 seconds, transitions to results. Background music plays (if sound files are present).

- [ ] **Step 9: Commit**

```bash
git add src/components/Rosella.tsx src/components/Rosella.module.css \
        src/components/TimerBar.tsx src/components/TimerBar.module.css \
        src/components/ScoreDisplay.tsx src/components/ScoreDisplay.module.css \
        src/components/GameScreen.tsx
git commit -m "feat: GameScreen with rosella cursor-follow, timer bar, and score HUD"
```

---

## Task 11: GameScreen — Collectibles + collision + scoring

**Files:**
- Create: `src/components/Collectible.tsx`
- Create: `src/components/Collectible.module.css`
- Modify: `src/components/GameScreen.tsx`

- [ ] **Step 1: Create `src/components/Collectible.module.css`**

```css
.item {
  position: fixed;
  top: 0;
  left: 0;
  font-size: 50px;
  pointer-events: none;
  user-select: none;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
  animation: bob 2.2s ease-in-out infinite;
  will-change: transform;
}

@keyframes bob {
  0%, 100% { transform: translate(var(--tx), var(--ty)) scale(1); }
  50%       { transform: translate(var(--tx), var(--ty)) scale(1.1); }
}
```

- [ ] **Step 2: Create `src/components/Collectible.tsx`**

```tsx
import type { Collectible } from '../types/game'
import styles from './Collectible.module.css'

const EMOJI: Record<Collectible['type'], string> = {
  heart: '❤️',
  star: '⭐',
  gem: '🌈',
}

export default function CollectibleItem({ collectible }: { collectible: Collectible }) {
  const tx = `${(collectible.x / 100) * window.innerWidth - 25}px`
  const ty = `${(collectible.y / 100) * window.innerHeight - 25}px`
  return (
    <div
      className={styles.item}
      style={{ '--tx': tx, '--ty': ty } as React.CSSProperties}
    >
      {EMOJI[collectible.type]}
    </div>
  )
}
```

- [ ] **Step 3: Replace `src/components/GameScreen.tsx` with collectibles wired in**

```tsx
import { useRef, useState, useEffect, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import Rosella from './Rosella'
import TimerBar from './TimerBar'
import ScoreDisplay from './ScoreDisplay'
import CollectibleItem from './Collectible'
import { useMousePosition } from '../hooks/useMousePosition'
import { useGameLoop } from '../hooks/useGameLoop'
import { isColliding } from '../utils/collision'
import { pickCollectibleType, spawnPosition } from '../utils/spawn'
import { playSound, stopSound } from '../utils/sound'
import type { Collectible } from '../types/game'

const LERP = 0.18
const GAME_DURATION = 60
const ROSELLA_RADIUS = 45
const COLLECTIBLE_RADIUS = 30
const INITIAL_COUNT = 10
const MAX_COLLECTIBLES = 12
const SPAWN_DELAY = () => 500 + Math.random() * 500

function rid() { return Math.random().toString(36).slice(2, 10) }

function makeCollectible(existing: Collectible[], rosX: number, rosY: number): Collectible {
  const { type, points } = pickCollectibleType()
  const { x, y } = spawnPosition({
    existing,
    rosellaX: rosX,
    rosellaY: rosY,
    vpW: window.innerWidth,
    vpH: window.innerHeight,
  })
  return { id: rid(), type, x, y, points }
}

interface Props {
  mutedRef: MutableRefObject<boolean>
  onGameEnd: (score: number) => void
}

export default function GameScreen({ mutedRef, onGameEnd }: Props) {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [collectibles, setCollectibles] = useState<Collectible[]>([])
  const [active, setActive] = useState(true)

  const rosellaRef = useRef<HTMLDivElement>(null)
  const rosellaPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const mousePos = useMousePosition()
  const scoreRef = useRef(0)
  const activeRef = useRef(true)
  const collectiblesRef = useRef<Collectible[]>([])
  const collectingIds = useRef(new Set<string>())
  const mountedRef = useRef(true)

  useEffect(() => () => { mountedRef.current = false }, [])

  // Keep collectiblesRef in sync for stale-closure-free collision reads
  useEffect(() => { collectiblesRef.current = collectibles }, [collectibles])

  // Initial spawn
  useEffect(() => {
    const initial: Collectible[] = []
    for (let i = 0; i < INITIAL_COUNT; i++) {
      initial.push(makeCollectible(initial, 50, 50))
    }
    setCollectibles(initial)
  }, [])

  // Start BGM
  useEffect(() => {
    playSound('music', mutedRef.current)
    return () => stopSound('music')
  }, [mutedRef])

  const spawnReplacement = useCallback(() => {
    setTimeout(() => {
      if (!mountedRef.current) return
      setCollectibles(prev => {
        if (prev.length >= MAX_COLLECTIBLES) return prev
        const pos = rosellaPos.current
        return [...prev, makeCollectible(
          prev,
          (pos.x / window.innerWidth) * 100,
          (pos.y / window.innerHeight) * 100,
        )]
      })
    }, SPAWN_DELAY())
  }, [])

  const tick = useCallback(() => {
    if (!activeRef.current) return

    // Move rosella via lerp
    const target = mousePos.current
    const pos = rosellaPos.current
    pos.x += (target.x - pos.x) * LERP
    pos.y += (target.y - pos.y) * LERP
    if (rosellaRef.current) {
      rosellaRef.current.style.transform =
        `translate(${Math.round(pos.x - 35)}px, ${Math.round(pos.y - 35)}px)`
    }

    // Collision detection against ref mirror
    const rosX = pos.x
    const rosY = pos.y
    for (const item of collectiblesRef.current) {
      if (collectingIds.current.has(item.id)) continue
      const itemX = (item.x / 100) * window.innerWidth
      const itemY = (item.y / 100) * window.innerHeight
      if (isColliding(rosX, rosY, ROSELLA_RADIUS, itemX, itemY, COLLECTIBLE_RADIUS)) {
        collectingIds.current.add(item.id)
        playSound('collect', mutedRef.current)
        const pts = item.points
        setScore(s => { scoreRef.current = s + pts; return s + pts })
        setCollectibles(prev => prev.filter(c => c.id !== item.id))
        spawnReplacement()
        setTimeout(() => collectingIds.current.delete(item.id), 1500)
      }
    }
  }, [mousePos, mutedRef, spawnReplacement])

  useGameLoop(tick, active)

  // Timer
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id)
          activeRef.current = false
          setActive(false)
          setTimeout(() => {
            playSound('game-end', mutedRef.current)
            onGameEnd(scoreRef.current)
          }, 300)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [onGameEnd, mutedRef])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Background />
      <TimerBar timeLeft={timeLeft} />
      <ScoreDisplay score={score} />
      {collectibles.map(c => <CollectibleItem key={c.id} collectible={c} />)}
      <Rosella ref={rosellaRef} />
    </div>
  )
}
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Expected: Collectibles (❤️ ⭐ 🌈) appear scattered on screen. Moving the 🦜 over them makes them disappear and the score increases. New ones spawn after a short delay. The "collect" sound plays on pickup.

- [ ] **Step 5: Commit**

```bash
git add src/components/Collectible.tsx src/components/Collectible.module.css src/components/GameScreen.tsx
git commit -m "feat: collectibles with circle collision, rarity weights, and score"
```

---

## Task 12: ResultsScreen (full implementation)

**Files:**
- Modify: `src/components/ResultsScreen.tsx`
- Create: `src/components/ResultsScreen.module.css`

- [ ] **Step 1: Create `src/components/ResultsScreen.module.css`**

```css
.screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  z-index: 10;
}

.confettiRow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: 14px 40px;
  pointer-events: none;
}

.confettiRow span {
  font-size: 26px;
  animation: confettiFall 3s ease-in-out infinite;
}

@keyframes confettiFall {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 1; }
  50%       { transform: translateY(22px) rotate(180deg); opacity: 0.6; }
}

.heading {
  font-family: 'Fredoka One', cursive;
  font-size: clamp(32px, 5vw, 60px);
  color: #2C3E50;
  text-shadow: 0 3px 0 rgba(255, 255, 255, 0.6);
}

.mascot {
  font-size: clamp(70px, 10vw, 110px);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  animation: bounce 1s ease-in-out infinite;
  user-select: none;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-12px); }
}

.scorePill {
  background: white;
  border-radius: 24px;
  padding: 14px 36px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.scoreLabel {
  font-size: 15px;
  color: #888;
}

.scoreValue {
  font-size: 40px;
  font-weight: 900;
  color: #2C3E50;
}

.newHighScore {
  background: #FFD93D;
  border-radius: 16px;
  padding: 8px 22px;
  font-size: 20px;
  font-weight: 800;
  color: #2C3E50;
  box-shadow: 0 3px 0 #E6B82E;
  animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes pop {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

.bestScore {
  font-size: 16px;
  font-weight: 700;
  color: #2C3E50;
  opacity: 0.65;
}

.playAgainBtn {
  font-family: 'Fredoka One', cursive;
  font-size: 26px;
  color: #fff;
  background: #FF8FA3;
  border: none;
  border-radius: 28px;
  padding: 14px 44px;
  cursor: pointer;
  box-shadow: 0 6px 0 #E66B82;
  user-select: none;
  transition: transform 0.08s;
}

.playAgainBtn:active {
  box-shadow: none;
  transform: translateY(6px);
}

.homeBtn {
  font-family: 'Nunito', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #2C3E50;
  background: #FFD93D;
  border: none;
  border-radius: 24px;
  padding: 10px 30px;
  cursor: pointer;
  box-shadow: 0 4px 0 #E6B82E;
  user-select: none;
  transition: transform 0.08s;
}

.homeBtn:active {
  box-shadow: none;
  transform: translateY(4px);
}
```

- [ ] **Step 2: Replace `src/components/ResultsScreen.tsx`**

```tsx
import { useEffect } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import { playSound } from '../utils/sound'
import styles from './ResultsScreen.module.css'

const CONFETTI = ['🎊', '🌟', '🎉', '✨', '🎊', '🌟', '🎉', '✨']

interface Props {
  score: number
  highScore: number
  isNewHighScore: boolean
  mutedRef: MutableRefObject<boolean>
  onPlayAgain: () => void
  onHome: () => void
}

export default function ResultsScreen({ score, highScore, isNewHighScore, mutedRef, onPlayAgain, onHome }: Props) {
  useEffect(() => {
    if (isNewHighScore) playSound('high-score', mutedRef.current)
  }, [isNewHighScore, mutedRef])

  return (
    <>
      <Background />
      <div className={styles.screen}>
        <div className={styles.confettiRow} aria-hidden>
          {CONFETTI.map((e, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.15}s` }}>{e}</span>
          ))}
        </div>
        <h2 className={styles.heading}>Great job! 🎉</h2>
        <div className={styles.mascot}>🦜</div>
        <div className={styles.scorePill}>
          <span className={styles.scoreLabel}>You got</span>
          <span className={styles.scoreValue}>{score} ⭐</span>
        </div>
        {isNewHighScore
          ? <div className={styles.newHighScore}>🏆 New High Score!</div>
          : highScore > 0 && <div className={styles.bestScore}>Best: {highScore} ⭐</div>
        }
        <button className={styles.playAgainBtn} onClick={onPlayAgain}>▶ Play Again</button>
        <button className={styles.homeBtn} onClick={onHome}>🏠 Home</button>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Update `src/App.tsx` to pass `mutedRef` to ResultsScreen**

```tsx
import { useState, useRef, useCallback } from 'react'
import type { Screen } from './types/game'
import { useHighScore } from './hooks/useHighScore'
import StartScreen from './components/StartScreen'
import GameScreen from './components/GameScreen'
import ResultsScreen from './components/ResultsScreen'

export default function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [lastScore, setLastScore] = useState(0)
  const [isNewHighScore, setIsNewHighScore] = useState(false)
  const [highScore, maybeUpdateHighScore] = useHighScore()
  const mutedRef = useRef(false)

  const handlePlay = useCallback(() => setScreen('playing'), [])

  const handleGameEnd = useCallback((score: number) => {
    const isNew = maybeUpdateHighScore(score)
    setLastScore(score)
    setIsNewHighScore(isNew)
    setScreen('results')
  }, [maybeUpdateHighScore])

  const handlePlayAgain = useCallback(() => setScreen('playing'), [])
  const handleHome = useCallback(() => setScreen('start'), [])

  return (
    <>
      {screen === 'start' && (
        <StartScreen highScore={highScore} mutedRef={mutedRef} onPlay={handlePlay} />
      )}
      {screen === 'playing' && (
        <GameScreen mutedRef={mutedRef} onGameEnd={handleGameEnd} />
      )}
      {screen === 'results' && (
        <ResultsScreen
          score={lastScore}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          mutedRef={mutedRef}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      )}
    </>
  )
}
```

- [ ] **Step 4: Verify in browser**

Expected: After timer ends → Results screen shows score, bouncing 🦜, confetti row, "Great job!", Play Again + Home buttons. On a new high score: yellow badge pops in and high-score sound plays.

- [ ] **Step 5: Commit**

```bash
git add src/components/ResultsScreen.tsx src/components/ResultsScreen.module.css src/App.tsx
git commit -m "feat: full ResultsScreen with high score badge and sounds"
```

---

## Task 13: GameScreen — Bubble mechanic

**Files:**
- Create: `src/components/Bubble.tsx`
- Create: `src/components/Bubble.module.css`
- Modify: `src/components/GameScreen.tsx`

- [ ] **Step 1: Create `src/components/Bubble.module.css`**

```css
.bubble {
  position: fixed;
  top: 0;
  left: 0;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 35%,
    rgba(255, 255, 255, 0.92) 0%,
    rgba(155, 246, 255, 0.35) 50%,
    rgba(160, 196, 255, 0.2) 100%
  );
  border: 2px solid rgba(155, 246, 255, 0.75);
  box-shadow:
    0 0 18px rgba(155, 246, 255, 0.65),
    inset 0 0 12px rgba(255, 255, 255, 0.45);
  cursor: pointer;
  z-index: 15;
  animation: bubblePulse 1.6s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  user-select: none;
}

.fading {
  animation: fadeOut 0.5s ease-out forwards !important;
}

@keyframes bubblePulse {
  0%, 100% {
    transform: translate(var(--tx), var(--ty)) scale(1);
    box-shadow: 0 0 18px rgba(155, 246, 255, 0.65);
  }
  50% {
    transform: translate(var(--tx), var(--ty)) scale(1.1);
    box-shadow: 0 0 30px rgba(155, 246, 255, 0.9);
  }
}

@keyframes fadeOut {
  from { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 1; }
  to   { transform: translate(var(--tx), var(--ty)) scale(0.5); opacity: 0; }
}
```

- [ ] **Step 2: Create `src/components/Bubble.tsx`**

```tsx
import type { Bubble } from '../types/game'
import styles from './Bubble.module.css'

interface Props {
  bubble: Bubble
  onClick: () => void
}

export default function BubbleComponent({ bubble, onClick }: Props) {
  const tx = `${(bubble.x / 100) * window.innerWidth - 36}px`
  const ty = `${(bubble.y / 100) * window.innerHeight - 36}px`
  return (
    <div
      className={`${styles.bubble} ${bubble.fading ? styles.fading : ''}`}
      style={{ '--tx': tx, '--ty': ty } as React.CSSProperties}
      onClick={onClick}
    >
      🫧
    </div>
  )
}
```

- [ ] **Step 3: Replace `src/components/GameScreen.tsx` with bubble logic added**

```tsx
import { useRef, useState, useEffect, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import Rosella from './Rosella'
import TimerBar from './TimerBar'
import ScoreDisplay from './ScoreDisplay'
import CollectibleItem from './Collectible'
import BubbleComponent from './Bubble'
import { useMousePosition } from '../hooks/useMousePosition'
import { useGameLoop } from '../hooks/useGameLoop'
import { isColliding } from '../utils/collision'
import { pickCollectibleType, spawnPosition } from '../utils/spawn'
import { playSound, stopSound } from '../utils/sound'
import type { Collectible, Bubble, CollectibleType } from '../types/game'

const LERP = 0.18
const GAME_DURATION = 60
const ROSELLA_RADIUS = 45
const COLLECTIBLE_RADIUS = 30
const INITIAL_COUNT = 10
const MAX_COLLECTIBLES = 12
const SPAWN_DELAY = () => 500 + Math.random() * 500
const BUBBLE_EXPIRE_MS = 8000
const BUBBLE_INTERVAL_MIN = 10000
const BUBBLE_INTERVAL_RANGE = 5000

function rid() { return Math.random().toString(36).slice(2, 10) }

function makeCollectible(existing: Collectible[], rosX: number, rosY: number): Collectible {
  const { type, points } = pickCollectibleType()
  const { x, y } = spawnPosition({
    existing, rosellaX: rosX, rosellaY: rosY,
    vpW: window.innerWidth, vpH: window.innerHeight,
  })
  return { id: rid(), type, x, y, points }
}

interface Props {
  mutedRef: MutableRefObject<boolean>
  onGameEnd: (score: number) => void
}

export default function GameScreen({ mutedRef, onGameEnd }: Props) {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [collectibles, setCollectibles] = useState<Collectible[]>([])
  const [bubble, setBubble] = useState<Bubble | null>(null)
  const [active, setActive] = useState(true)

  const rosellaRef = useRef<HTMLDivElement>(null)
  const rosellaPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const mousePos = useMousePosition()
  const scoreRef = useRef(0)
  const activeRef = useRef(true)
  const collectiblesRef = useRef<Collectible[]>([])
  const bubbleRef = useRef<Bubble | null>(null)
  const collectingIds = useRef(new Set<string>())
  const mountedRef = useRef(true)
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => { mountedRef.current = false }, [])
  useEffect(() => { collectiblesRef.current = collectibles }, [collectibles])
  useEffect(() => { bubbleRef.current = bubble }, [bubble])

  // Initial spawn
  useEffect(() => {
    const initial: Collectible[] = []
    for (let i = 0; i < INITIAL_COUNT; i++) initial.push(makeCollectible(initial, 50, 50))
    setCollectibles(initial)
  }, [])

  // BGM
  useEffect(() => {
    playSound('music', mutedRef.current)
    return () => stopSound('music')
  }, [mutedRef])

  // Bubble spawn scheduler
  useEffect(() => {
    if (!active) return
    const schedule = () => {
      const delay = BUBBLE_INTERVAL_MIN + Math.random() * BUBBLE_INTERVAL_RANGE
      bubbleTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return
        if (!bubbleRef.current) {
          setBubble({
            id: rid(),
            x: 12 + Math.random() * 76,
            y: 18 + Math.random() * 60,
            spawnedAt: Date.now(),
            fading: false,
          })
        }
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(bubbleTimeoutRef.current)
  }, [active])

  const spawnReplacement = useCallback(() => {
    setTimeout(() => {
      if (!mountedRef.current) return
      setCollectibles(prev => {
        if (prev.length >= MAX_COLLECTIBLES) return prev
        const pos = rosellaPos.current
        return [...prev, makeCollectible(
          prev,
          (pos.x / window.innerWidth) * 100,
          (pos.y / window.innerHeight) * 100,
        )]
      })
    }, SPAWN_DELAY())
  }, [])

  const handleBubblePop = useCallback(() => {
    const b = bubbleRef.current
    if (!b || b.fading) return
    playSound('bubble-pop', mutedRef.current)
    setBubble(null)
    // Spawn 3–5 heart/star collectibles around bubble position
    const count = 3 + Math.floor(Math.random() * 3)
    setCollectibles(prev => {
      const burst: Collectible[] = Array.from({ length: count }, () => {
        const type: CollectibleType = Math.random() < 0.5 ? 'heart' : 'star'
        return {
          id: rid(),
          type,
          points: type === 'heart' ? 1 : 3,
          x: Math.min(92, Math.max(8, b.x + (Math.random() - 0.5) * 14)),
          y: Math.min(82, Math.max(15, b.y + (Math.random() - 0.5) * 14)),
        }
      })
      return [...prev.slice(0, MAX_COLLECTIBLES - count), ...burst]
    })
  }, [mutedRef])

  const tick = useCallback(() => {
    if (!activeRef.current) return

    const target = mousePos.current
    const pos = rosellaPos.current
    pos.x += (target.x - pos.x) * LERP
    pos.y += (target.y - pos.y) * LERP
    if (rosellaRef.current) {
      rosellaRef.current.style.transform =
        `translate(${Math.round(pos.x - 35)}px, ${Math.round(pos.y - 35)}px)`
    }

    // Collision
    const rosX = pos.x
    const rosY = pos.y
    for (const item of collectiblesRef.current) {
      if (collectingIds.current.has(item.id)) continue
      const itemX = (item.x / 100) * window.innerWidth
      const itemY = (item.y / 100) * window.innerHeight
      if (isColliding(rosX, rosY, ROSELLA_RADIUS, itemX, itemY, COLLECTIBLE_RADIUS)) {
        collectingIds.current.add(item.id)
        playSound('collect', mutedRef.current)
        const pts = item.points
        setScore(s => { scoreRef.current = s + pts; return s + pts })
        setCollectibles(prev => prev.filter(c => c.id !== item.id))
        spawnReplacement()
        setTimeout(() => collectingIds.current.delete(item.id), 1500)
      }
    }

    // Bubble expiry check
    const b = bubbleRef.current
    if (b && !b.fading && Date.now() - b.spawnedAt >= BUBBLE_EXPIRE_MS) {
      setBubble(prev => prev ? { ...prev, fading: true } : null)
      setTimeout(() => { if (mountedRef.current) setBubble(null) }, 500)
    }
  }, [mousePos, mutedRef, spawnReplacement])

  useGameLoop(tick, active)

  // Timer
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id)
          activeRef.current = false
          setActive(false)
          setTimeout(() => {
            playSound('game-end', mutedRef.current)
            onGameEnd(scoreRef.current)
          }, 300)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [onGameEnd, mutedRef])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Background />
      <TimerBar timeLeft={timeLeft} />
      <ScoreDisplay score={score} />
      {collectibles.map(c => <CollectibleItem key={c.id} collectible={c} />)}
      {bubble && <BubbleComponent bubble={bubble} onClick={handleBubblePop} />}
      <Rosella ref={rosellaRef} />
    </div>
  )
}
```

- [ ] **Step 4: Verify in browser**

Expected: After 10–15 seconds a shimmering 🫧 bubble appears, pulsing gently. Clicking it plays the pop sound and spawns 3–5 collectibles nearby. If not clicked within 8 seconds it fades out.

- [ ] **Step 5: Commit**

```bash
git add src/components/Bubble.tsx src/components/Bubble.module.css src/components/GameScreen.tsx
git commit -m "feat: treasure bubble mechanic with timed expiry and burst spawn"
```

---

## Task 14: Particle effects

**Files:**
- Create: `src/components/ParticleEffect.tsx`
- Create: `src/components/ParticleEffect.module.css`
- Modify: `src/components/GameScreen.tsx`

- [ ] **Step 1: Create `src/components/ParticleEffect.module.css`**

```css
.particle {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 25;
  line-height: 1;
  animation: burst linear forwards;
}

@keyframes burst {
  0%   { transform: translate(var(--ox), var(--oy)) scale(1); opacity: 1; }
  100% { transform: translate(var(--ex), var(--ey)) scale(0); opacity: 0; }
}
```

- [ ] **Step 2: Create `src/components/ParticleEffect.tsx`**

```tsx
import type { Particle } from '../types/game'
import styles from './ParticleEffect.module.css'

const TRAVEL_COLLECT = 55
const TRAVEL_CONFETTI = 85

interface Props { particles: Particle[] }

export default function ParticleEffect({ particles }: Props) {
  return (
    <>
      {particles.map(p => {
        const travel = p.duration > 450 ? TRAVEL_CONFETTI : TRAVEL_COLLECT
        const ex = `${Math.cos(p.angle) * travel}px`
        const ey = `${Math.sin(p.angle) * travel}px`
        const isCircle = p.symbol === 'circle'
        return (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              '--ox': `${p.x}px`,
              '--oy': `${p.y}px`,
              '--ex': `calc(${p.x}px + ${ex})`,
              '--ey': `calc(${p.y}px + ${ey})`,
              animationDuration: `${p.duration}ms`,
              ...(isCircle
                ? { width: 12, height: 12, borderRadius: '50%', background: p.color ?? '#FFD93D' }
                : { fontSize: 20 }
              ),
            } as React.CSSProperties}
          >
            {!isCircle ? p.symbol : ''}
          </div>
        )
      })}
    </>
  )
}
```

- [ ] **Step 3: Replace `src/components/GameScreen.tsx` with particles wired in**

Add `particles` state and the two spawn calls. This is the final version of GameScreen:

```tsx
import { useRef, useState, useEffect, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import Rosella from './Rosella'
import TimerBar from './TimerBar'
import ScoreDisplay from './ScoreDisplay'
import CollectibleItem from './Collectible'
import BubbleComponent from './Bubble'
import ParticleEffect from './ParticleEffect'
import { useMousePosition } from '../hooks/useMousePosition'
import { useGameLoop } from '../hooks/useGameLoop'
import { isColliding } from '../utils/collision'
import { pickCollectibleType, spawnPosition } from '../utils/spawn'
import { spawnCollectSparkle, spawnBubbleConfetti } from '../utils/particles'
import { playSound, stopSound } from '../utils/sound'
import type { Collectible, Bubble, Particle, CollectibleType } from '../types/game'

const LERP = 0.18
const GAME_DURATION = 60
const ROSELLA_RADIUS = 45
const COLLECTIBLE_RADIUS = 30
const INITIAL_COUNT = 10
const MAX_COLLECTIBLES = 12
const SPAWN_DELAY = () => 500 + Math.random() * 500
const BUBBLE_EXPIRE_MS = 8000
const BUBBLE_INTERVAL_MIN = 10000
const BUBBLE_INTERVAL_RANGE = 5000

function rid() { return Math.random().toString(36).slice(2, 10) }

function makeCollectible(existing: Collectible[], rosX: number, rosY: number): Collectible {
  const { type, points } = pickCollectibleType()
  const { x, y } = spawnPosition({
    existing, rosellaX: rosX, rosellaY: rosY,
    vpW: window.innerWidth, vpH: window.innerHeight,
  })
  return { id: rid(), type, x, y, points }
}

interface Props {
  mutedRef: MutableRefObject<boolean>
  onGameEnd: (score: number) => void
}

export default function GameScreen({ mutedRef, onGameEnd }: Props) {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [collectibles, setCollectibles] = useState<Collectible[]>([])
  const [bubble, setBubble] = useState<Bubble | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [active, setActive] = useState(true)

  const rosellaRef = useRef<HTMLDivElement>(null)
  const rosellaPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const mousePos = useMousePosition()
  const scoreRef = useRef(0)
  const activeRef = useRef(true)
  const collectiblesRef = useRef<Collectible[]>([])
  const bubbleRef = useRef<Bubble | null>(null)
  const collectingIds = useRef(new Set<string>())
  const mountedRef = useRef(true)
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => { mountedRef.current = false }, [])
  useEffect(() => { collectiblesRef.current = collectibles }, [collectibles])
  useEffect(() => { bubbleRef.current = bubble }, [bubble])

  useEffect(() => {
    const initial: Collectible[] = []
    for (let i = 0; i < INITIAL_COUNT; i++) initial.push(makeCollectible(initial, 50, 50))
    setCollectibles(initial)
  }, [])

  useEffect(() => {
    playSound('music', mutedRef.current)
    return () => stopSound('music')
  }, [mutedRef])

  const addParticles = useCallback((newPs: Particle[]) => {
    setParticles(prev => [...prev, ...newPs])
    const maxDuration = Math.max(...newPs.map(p => p.duration))
    setTimeout(() => {
      if (!mountedRef.current) return
      const ids = new Set(newPs.map(p => p.id))
      setParticles(prev => prev.filter(p => !ids.has(p.id)))
    }, maxDuration + 50)
  }, [])

  useEffect(() => {
    if (!active) return
    const schedule = () => {
      const delay = BUBBLE_INTERVAL_MIN + Math.random() * BUBBLE_INTERVAL_RANGE
      bubbleTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return
        if (!bubbleRef.current) {
          setBubble({
            id: rid(),
            x: 12 + Math.random() * 76,
            y: 18 + Math.random() * 60,
            spawnedAt: Date.now(),
            fading: false,
          })
        }
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(bubbleTimeoutRef.current)
  }, [active])

  const spawnReplacement = useCallback(() => {
    setTimeout(() => {
      if (!mountedRef.current) return
      setCollectibles(prev => {
        if (prev.length >= MAX_COLLECTIBLES) return prev
        const pos = rosellaPos.current
        return [...prev, makeCollectible(
          prev,
          (pos.x / window.innerWidth) * 100,
          (pos.y / window.innerHeight) * 100,
        )]
      })
    }, SPAWN_DELAY())
  }, [])

  const handleBubblePop = useCallback(() => {
    const b = bubbleRef.current
    if (!b || b.fading) return
    playSound('bubble-pop', mutedRef.current)
    const bx = (b.x / 100) * window.innerWidth
    const by = (b.y / 100) * window.innerHeight
    addParticles(spawnBubbleConfetti(bx, by))
    setBubble(null)
    const count = 3 + Math.floor(Math.random() * 3)
    setCollectibles(prev => {
      const burst: Collectible[] = Array.from({ length: count }, () => {
        const type: CollectibleType = Math.random() < 0.5 ? 'heart' : 'star'
        return {
          id: rid(), type, points: type === 'heart' ? 1 : 3,
          x: Math.min(92, Math.max(8, b.x + (Math.random() - 0.5) * 14)),
          y: Math.min(82, Math.max(15, b.y + (Math.random() - 0.5) * 14)),
        }
      })
      return [...prev.slice(0, MAX_COLLECTIBLES - count), ...burst]
    })
  }, [mutedRef, addParticles])

  const tick = useCallback(() => {
    if (!activeRef.current) return
    const target = mousePos.current
    const pos = rosellaPos.current
    pos.x += (target.x - pos.x) * LERP
    pos.y += (target.y - pos.y) * LERP
    if (rosellaRef.current) {
      rosellaRef.current.style.transform =
        `translate(${Math.round(pos.x - 35)}px, ${Math.round(pos.y - 35)}px)`
    }

    const rosX = pos.x
    const rosY = pos.y
    for (const item of collectiblesRef.current) {
      if (collectingIds.current.has(item.id)) continue
      const itemX = (item.x / 100) * window.innerWidth
      const itemY = (item.y / 100) * window.innerHeight
      if (isColliding(rosX, rosY, ROSELLA_RADIUS, itemX, itemY, COLLECTIBLE_RADIUS)) {
        collectingIds.current.add(item.id)
        playSound('collect', mutedRef.current)
        addParticles(spawnCollectSparkle(itemX, itemY))
        const pts = item.points
        setScore(s => { scoreRef.current = s + pts; return s + pts })
        setCollectibles(prev => prev.filter(c => c.id !== item.id))
        spawnReplacement()
        setTimeout(() => collectingIds.current.delete(item.id), 1500)
      }
    }

    const b = bubbleRef.current
    if (b && !b.fading && Date.now() - b.spawnedAt >= BUBBLE_EXPIRE_MS) {
      setBubble(prev => prev ? { ...prev, fading: true } : null)
      setTimeout(() => { if (mountedRef.current) setBubble(null) }, 500)
    }
  }, [mousePos, mutedRef, spawnReplacement, addParticles])

  useGameLoop(tick, active)

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id)
          activeRef.current = false
          setActive(false)
          setTimeout(() => {
            playSound('game-end', mutedRef.current)
            onGameEnd(scoreRef.current)
          }, 300)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [onGameEnd, mutedRef])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Background />
      <TimerBar timeLeft={timeLeft} />
      <ScoreDisplay score={score} />
      {collectibles.map(c => <CollectibleItem key={c.id} collectible={c} />)}
      {bubble && <BubbleComponent bubble={bubble} onClick={handleBubblePop} />}
      <ParticleEffect particles={particles} />
      <Rosella ref={rosellaRef} />
    </div>
  )
}
```

- [ ] **Step 4: Verify in browser**

Expected: Collecting an item spawns ✨ ⭐ sparkles that fly outward and fade. Clicking a bubble spawns a larger confetti burst.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass (collision, spawn, useHighScore).

- [ ] **Step 6: Commit**

```bash
git add src/components/ParticleEffect.tsx src/components/ParticleEffect.module.css src/components/GameScreen.tsx
git commit -m "feat: particle sparkle on collect and confetti burst on bubble pop"
```

---

## Task 15: Final verification and polish

- [ ] **Step 1: Full game loop test — manually verify all acceptance criteria**

Run `npm run dev` and test each item:

| Criterion | How to verify |
|---|---|
| All 3 screens transition correctly | Play → Game → wait 60s → Results → Play Again → Game → Home → Start |
| Rosella follows cursor smoothly | Move mouse quickly and slowly — should lag slightly, never snap |
| Collectibles collected on overlap | Move 🦜 over ❤️ ⭐ 🌈 — they disappear with sound and sparkle |
| Score updates live | Watch score pill increment on each collect |
| Bubble appears every 10–15s | Wait ~15s — 🫧 bubble appears with pulse animation |
| Bubble click spawns items | Click bubble — pop sound, confetti, 3–5 new collectibles appear |
| Bubble expires after 8s | Don't click — bubble fades after 8s |
| Timer bar shrinks over 60s | Rainbow bar visible at top, shrinks left to right |
| Timer bar turns red under 10s | With 10s left — bar turns red and pulses |
| Timer hits 0 → results | Wait for timer to end — results screen appears with final score |
| High score saves and loads | Beat your score → refresh → Start Screen shows updated best |
| New High Score badge | Beat high score → results shows gold "🏆 New High Score!" badge |
| Sounds play | collect, bubble-pop, game-start, game-end, high-score, BGM |
| Mute toggle works | Click 🔊 on Start Screen → 🔇 → sounds suppressed in gameplay |
| No console errors | DevTools console shows no errors during full game loop |

- [ ] **Step 2: Fix any issues found in Step 1**

Common things to tweak:
- Lerp factor too fast/slow: change `LERP = 0.18` in `GameScreen.tsx`
- Rosella offset feels off: adjust the `- 35` offset in the transform (half of 70px sprite)
- Collectibles too rare/common: adjust weights in `src/utils/spawn.ts` WEIGHTS array
- Timer too short/long: change `GAME_DURATION = 60` in `GameScreen.tsx`
- Bubble too infrequent: lower `BUBBLE_INTERVAL_MIN` in `GameScreen.tsx`

- [ ] **Step 3: Run all tests one final time**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Rainbow Rosella Collector game"
```

---

## Acceptance Criteria Checklist

- [ ] Runs locally with `npm run dev`, no console errors
- [ ] All three screens display and transition correctly
- [ ] Rosella smoothly follows mouse cursor (lerp, no snapping)
- [ ] Collectibles collected on hover with sound + sparkle feedback
- [ ] Bubble spawns every 10–15s, pops on click with confetti + item burst
- [ ] 60-second rainbow timer bar counts down and ends game at zero
- [ ] Score updates live; high score saves to localStorage
- [ ] All 6 sounds play without delay or overlap issues
- [ ] Visual style matches palette and typography spec
- [ ] Fun and independently playable by a 5-year-old
