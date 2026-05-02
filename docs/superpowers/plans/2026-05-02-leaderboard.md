# Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a top-10 leaderboard stored in localStorage, accessible via a "🏆 Scores" button on the grass of the Start Screen and Results Screen, showing score + date/time in a modal overlay.

**Architecture:** `LeaderboardEntry` type added to `game.ts`. New `useLeaderboard` hook reads/writes localStorage key `rosellaLeaderboard` (JSON array, max 10, sorted descending). New `LeaderboardModal` component calls `useLeaderboard` directly — data flows through localStorage, not props. `App.tsx` calls `addEntry` on every game end. Both `StartScreen` and `ResultsScreen` get a grass-strip button that opens the modal via local `leaderboardOpen` state.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vite, Vitest + @testing-library/react.

---

## File Map

```
src/
  types/game.ts                         — add LeaderboardEntry interface
  hooks/
    useLeaderboard.ts                   — new: reads/writes rosellaLeaderboard
    useLeaderboard.test.ts              — new: TDD tests for hook behaviour
  components/
    LeaderboardModal.tsx                — new: overlay modal, calls useLeaderboard
    LeaderboardModal.module.css         — new: overlay, card, row styles
    StartScreen.tsx                     — add grass button + modal render
    StartScreen.module.css              — add .leaderboardBtn class
    ResultsScreen.tsx                   — add grass button + modal render
    ResultsScreen.module.css            — add .leaderboardBtn class
  App.tsx                               — call addEntry on game end
```

---

## Task 1: Add `LeaderboardEntry` type

**Files:**
- Modify: `src/types/game.ts`

- [ ] **Step 1: Append `LeaderboardEntry` interface to `src/types/game.ts`**

Add after the existing `Particle` interface:

```typescript
export interface LeaderboardEntry {
  score: number
  timestamp: number  // Date.now()
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add src/types/game.ts
git commit -m "feat: add LeaderboardEntry type"
```

---

## Task 2: `useLeaderboard` hook with tests

**Files:**
- Create: `src/hooks/useLeaderboard.ts`
- Create: `src/hooks/useLeaderboard.test.ts`

- [ ] **Step 1: Create failing tests in `src/hooks/useLeaderboard.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLeaderboard } from './useLeaderboard'

const LS_KEY = 'rosellaLeaderboard'

beforeEach(() => localStorage.clear())

describe('useLeaderboard', () => {
  it('returns empty array when nothing is saved', () => {
    const { result } = renderHook(() => useLeaderboard())
    expect(result.current[0]).toEqual([])
  })

  it('loads persisted entries on init', () => {
    const entries = [{ score: 42, timestamp: 1000 }]
    localStorage.setItem(LS_KEY, JSON.stringify(entries))
    const { result } = renderHook(() => useLeaderboard())
    expect(result.current[0]).toEqual(entries)
  })

  it('addEntry saves a new entry to localStorage', () => {
    const { result } = renderHook(() => useLeaderboard())
    act(() => { result.current[1](50) })
    const stored = JSON.parse(localStorage.getItem(LS_KEY)!)
    expect(stored).toHaveLength(1)
    expect(stored[0].score).toBe(50)
    expect(typeof stored[0].timestamp).toBe('number')
  })

  it('addEntry sorts entries by score descending', () => {
    const { result } = renderHook(() => useLeaderboard())
    act(() => { result.current[1](30) })
    act(() => { result.current[1](80) })
    act(() => { result.current[1](50) })
    expect(result.current[0][0].score).toBe(80)
    expect(result.current[0][1].score).toBe(50)
    expect(result.current[0][2].score).toBe(30)
  })

  it('addEntry trims to 10 entries, keeping highest scores', () => {
    const { result } = renderHook(() => useLeaderboard())
    act(() => {
      for (let i = 1; i <= 12; i++) result.current[1](i * 10)
    })
    expect(result.current[0]).toHaveLength(10)
    expect(result.current[0][0].score).toBe(120)
    expect(result.current[0][9].score).toBe(30)
  })

  it('addEntry updates React state so UI re-renders', () => {
    const { result } = renderHook(() => useLeaderboard())
    act(() => { result.current[1](99) })
    expect(result.current[0][0].score).toBe(99)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/hooks/useLeaderboard.test.ts
```

Expected: all 5 tests FAIL with "useLeaderboard is not a function" or similar.

- [ ] **Step 3: Create `src/hooks/useLeaderboard.ts`**

```typescript
import { useState, useCallback } from 'react'
import type { LeaderboardEntry } from '../types/game'

const LS_KEY = 'rosellaLeaderboard'

function load(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : []
  } catch {
    return []
  }
}

function save(entries: LeaderboardEntry[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(entries))
}

export function useLeaderboard(): [LeaderboardEntry[], (score: number) => void] {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => load())

  const addEntry = useCallback((score: number) => {
    setEntries(prev => {
      const next = [...prev, { score, timestamp: Date.now() }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
      save(next)
      return next
    })
  }, [])

  return [entries, addEntry]
}
```

- [ ] **Step 4: Run tests to confirm they all pass**

```bash
npx vitest run src/hooks/useLeaderboard.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
npx vitest run
```

Expected: all tests pass (16 existing + 5 new = 21 total).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useLeaderboard.ts src/hooks/useLeaderboard.test.ts
git commit -m "feat: add useLeaderboard hook with tests"
```

---

## Task 3: `LeaderboardModal` component

**Files:**
- Create: `src/components/LeaderboardModal.module.css`
- Create: `src/components/LeaderboardModal.tsx`

- [ ] **Step 1: Create `src/components/LeaderboardModal.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card {
  background: linear-gradient(180deg, #B8E5F5 0%, #E0F4FA 100%);
  border-radius: 24px;
  padding: 16px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.panel {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.title {
  font-family: 'Fredoka One', cursive;
  font-size: 24px;
  color: #2C3E50;
  text-align: center;
  margin-bottom: 16px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: #F9F9F9;
}

.rowFirst {
  background: #FFF5F8;
}

.rank {
  font-size: 22px;
  min-width: 28px;
  text-align: center;
}

.rankNum {
  font-size: 14px;
  font-weight: 700;
  color: #bbbbbb;
  min-width: 28px;
  text-align: center;
}

.score {
  font-size: 18px;
  font-weight: 900;
  color: #2C3E50;
  min-width: 56px;
}

.scoreFirst {
  color: #FF8FA3;
}

.time {
  font-size: 12px;
  color: #aaaaaa;
  flex: 1;
}

.empty {
  text-align: center;
  color: #aaaaaa;
  font-size: 15px;
  padding: 24px 0;
}

.closeBtn {
  display: block;
  width: 100%;
  margin-top: 16px;
  font-family: 'Fredoka One', cursive;
  font-size: 18px;
  color: #ffffff;
  background: #FF8FA3;
  border: none;
  border-radius: 20px;
  padding: 12px;
  cursor: pointer;
  box-shadow: 0 4px 0 #E66B82;
  transition: transform 0.08s;
}

.closeBtn:active {
  box-shadow: none;
  transform: translateY(4px);
}
```

- [ ] **Step 2: Create `src/components/LeaderboardModal.tsx`**

```tsx
import { useLeaderboard } from '../hooks/useLeaderboard'
import styles from './LeaderboardModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
}

const MEDALS = ['🥇', '🥈', '🥉']

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function LeaderboardModal({ open, onClose }: Props) {
  const [entries] = useLeaderboard()

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <div className={styles.panel}>
          <div className={styles.title}>🏆 Top Scores</div>
          {entries.length === 0 ? (
            <div className={styles.empty}>No scores yet — play a game!</div>
          ) : (
            entries.map((entry, i) => (
              <div key={entry.timestamp} className={`${styles.row} ${i === 0 ? styles.rowFirst : ''}`}>
                {i < 3
                  ? <span className={styles.rank}>{MEDALS[i]}</span>
                  : <span className={styles.rankNum}>{i + 1}</span>
                }
                <span className={`${styles.score} ${i === 0 ? styles.scoreFirst : ''}`}>
                  {entry.score} ⭐
                </span>
                <span className={styles.time}>{formatTimestamp(entry.timestamp)}</span>
              </div>
            ))
          )}
        </div>
        <button className={styles.closeBtn} onClick={onClose}>✕ Close</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/LeaderboardModal.tsx src/components/LeaderboardModal.module.css
git commit -m "feat: add LeaderboardModal component"
```

---

## Task 4: Wire `addEntry` into `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import `useLeaderboard` and call it in `App`**

Add the import at the top of `src/App.tsx`:

```typescript
import { useLeaderboard } from './hooks/useLeaderboard'
```

Inside the `App` function body, after the `useHighScore` line, add:

```typescript
const [, addEntry] = useLeaderboard()
```

- [ ] **Step 2: Call `addEntry` in `handleGameEnd`**

Replace the existing `handleGameEnd` callback:

```typescript
const handleGameEnd = useCallback((score: number) => {
  addEntry(score)
  const isNew = maybeUpdateHighScore(score)
  setLastScore(score)
  setIsNewHighScore(isNew)
  setScreen('results')
}, [addEntry, maybeUpdateHighScore])
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all 21 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: save leaderboard entry on every game end"
```

---

## Task 5: Add leaderboard button to Start Screen

**Files:**
- Modify: `src/components/StartScreen.tsx`
- Modify: `src/components/StartScreen.module.css`

- [ ] **Step 1: Add `.leaderboardBtn` to `src/components/StartScreen.module.css`**

Append after the existing `.playBtn:active` rule:

```css
.leaderboardBtn {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 14px;
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 800;
  color: #2C3E50;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  white-space: nowrap;
  transition: transform 0.08s;
}

.leaderboardBtn:active {
  transform: translateX(-50%) translateY(2px);
}
```

- [ ] **Step 2: Update `src/components/StartScreen.tsx`**

Replace the entire file:

```tsx
import { useState } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import LeaderboardModal from './LeaderboardModal'
import { playSound, stopSound } from '../utils/sound'
import styles from './StartScreen.module.css'

interface Props {
  highScore: number
  mutedRef: MutableRefObject<boolean>
  onPlay: () => void
}

export default function StartScreen({ highScore, mutedRef, onPlay }: Props) {
  const [muted, setMuted] = useState(mutedRef.current) // eslint-disable-line react-hooks/refs
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)

  const toggleMute = () => {
    mutedRef.current = !mutedRef.current
    setMuted(mutedRef.current)
    if (mutedRef.current) {
      stopSound('music')
    } else {
      playSound('music', false)
    }
  }

  const handlePlay = () => {
    playSound('music', mutedRef.current)
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
        <button className={styles.leaderboardBtn} onClick={() => setLeaderboardOpen(true)}>
          🏆 Scores
        </button>
      </div>
      <LeaderboardModal open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. On the Start Screen, verify:
- "🏆 Scores" button is visible on the grass strip at the bottom-centre
- Clicking it opens the modal overlay (empty state: "No scores yet — play a game!")
- Clicking "✕ Close" or the dark backdrop dismisses the modal
- After playing a game and returning to Start Screen, the leaderboard shows the score with date/time

- [ ] **Step 5: Commit**

```bash
git add src/components/StartScreen.tsx src/components/StartScreen.module.css
git commit -m "feat: add leaderboard button and modal to Start Screen"
```

---

## Task 6: Add leaderboard button to Results Screen

**Files:**
- Modify: `src/components/ResultsScreen.tsx`
- Modify: `src/components/ResultsScreen.module.css`

- [ ] **Step 1: Add `.leaderboardBtn` to `src/components/ResultsScreen.module.css`**

Append after the existing `.homeBtn:active` rule:

```css
.leaderboardBtn {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 14px;
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 800;
  color: #2C3E50;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  white-space: nowrap;
  transition: transform 0.08s;
}

.leaderboardBtn:active {
  transform: translateX(-50%) translateY(2px);
}
```

- [ ] **Step 2: Update `src/components/ResultsScreen.tsx`**

Replace the entire file:

```tsx
import { useState, useEffect } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import LeaderboardModal from './LeaderboardModal'
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
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)

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
        <button className={styles.leaderboardBtn} onClick={() => setLeaderboardOpen(true)}>
          🏆 Scores
        </button>
      </div>
      <LeaderboardModal open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all 21 tests pass.

- [ ] **Step 5: Verify in browser**

Play a full game (or temporarily lower `GAME_DURATION` to 5 in `GameScreen.tsx` to test quickly — restore to 60 before committing). On the Results Screen, verify:
- "🏆 Scores" button is visible on the grass strip
- Modal shows the just-played score at the top with correct date/time
- After multiple games, entries are sorted highest score first
- Only top 10 are shown
- Modal is NOT present during gameplay (GameScreen has no button)

- [ ] **Step 6: Commit**

```bash
git add src/components/ResultsScreen.tsx src/components/ResultsScreen.module.css
git commit -m "feat: add leaderboard button and modal to Results Screen"
```

---

## Acceptance Criteria Checklist

- [ ] Every completed game adds an entry to the leaderboard
- [ ] Top 10 only — 11th entry is discarded (lowest score removed)
- [ ] Entries sorted by score descending
- [ ] Timestamp shown as local time `YYYY-MM-DD HH:mm`
- [ ] Modal opens from Start Screen grass button
- [ ] Modal opens from Results Screen grass button
- [ ] Modal is NOT accessible from Game Screen
- [ ] Empty state: "No scores yet — play a game!" shown when no entries
- [ ] Data persists across page reloads
- [ ] Closing modal (Close button or backdrop click) returns to same screen unchanged
- [ ] All 21 tests pass
- [ ] `npx tsc --noEmit` clean
