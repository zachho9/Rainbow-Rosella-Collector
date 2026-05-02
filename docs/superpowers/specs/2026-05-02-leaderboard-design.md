# Leaderboard — Design Spec

**Date:** 2026-05-02
**Status:** Approved

---

## Overview

A top-10 leaderboard stored in `localStorage`. Accessible via a "🏆 Scores" button on the grass strip of the Start Screen and Results Screen. Opens as a modal overlay showing score + date/time (no username). Every completed game session is saved automatically.

---

## Data Model

### `LeaderboardEntry`

```typescript
// src/types/game.ts
export interface LeaderboardEntry {
  score: number
  timestamp: number  // Date.now()
}
```

### localStorage

- Key: `rosellaLeaderboard`
- Value: JSON array of `LeaderboardEntry[]`, max 10, sorted descending by score
- On each game end: push new entry, sort by score descending, trim to 10, save

---

## New Hook — `useLeaderboard`

**File:** `src/hooks/useLeaderboard.ts`

```typescript
export function useLeaderboard(): [LeaderboardEntry[], (score: number) => void]
```

- Initialises from `localStorage` on mount
- `addEntry(score)`: creates `{ score, timestamp: Date.now() }`, appends, sorts descending, trims to 10, saves to `localStorage` and updates state
- Returns `[entries, addEntry]`

---

## New Component — `LeaderboardModal`

**Files:**
- `src/components/LeaderboardModal.tsx`
- `src/components/LeaderboardModal.module.css`

**Props:**
```typescript
interface Props {
  open: boolean
  onClose: () => void
}
```

Reads leaderboard data via `useLeaderboard`. Renders as a fixed fullscreen overlay (`z-index: 50`) with a semi-transparent dark backdrop. Centre card with sky-gradient background, white inner panel.

### Layout

```
┌─────────────────────────────┐
│     🏆 Top Scores           │  ← Fredoka One, 24px
│                             │
│  🥇  142 ⭐   2025-05-01 14:32 │
│  🥈   98 ⭐   2025-05-01 10:15 │
│  🥉   75 ⭐   2025-04-30 18:07 │
│   4    63 ⭐   2025-04-30 09:44 │
│   5    51 ⭐   ...             │
│         · · · up to 10 · · ·  │
│                             │
│       [ ✕ Close ]           │  ← pink button, Fredoka One
└─────────────────────────────┘
```

- Rank 1–3: medal emoji (🥇🥈🥉)
- Rank 4–10: plain number in grey
- Score: bold, `#2C3E50`, with ⭐
- Timestamp formatted: `YYYY-MM-DD HH:mm` using local time
- Scrollable if entries fill the panel
- Empty state: "No scores yet — play a game!" in grey

---

## Visual Style

Matches existing game palette:
- Card background: `#FFFFFF`
- Row highlight (rank 1): `#FFF5F8`
- Other rows: `#F9F9F9`
- Card border-radius: `20px`
- Close button: `#FF8FA3` with shadow `#E66B82`, Fredoka One

---

## Button Placement

### Start Screen (`StartScreen.tsx`)

- White pill button `🏆 Scores` positioned at the **bottom-centre of the grass strip**
- `position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%)`
- `background: rgba(255,255,255,0.9); border-radius: 14px; padding: 6px 16px`
- `font-size: 14px; font-weight: 800; color: #2C3E50`
- Local state: `const [leaderboardOpen, setLeaderboardOpen] = useState(false)`
- Renders `<LeaderboardModal open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />`

### Results Screen (`ResultsScreen.tsx`)

- Same button, same position in the grass strip
- Same local `leaderboardOpen` state pattern

---

## Wiring — `App.tsx`

```typescript
const [entries, addEntry] = useLeaderboard()

const handleGameEnd = useCallback((score: number) => {
  addEntry(score)                    // ← new: always save to leaderboard
  const isNew = maybeUpdateHighScore(score)
  setLastScore(score)
  setIsNewHighScore(isNew)
  setScreen('results')
}, [addEntry, maybeUpdateHighScore])
```

`LeaderboardModal` reads from its own `useLeaderboard` hook instance — state is shared through `localStorage`, not through props.

---

## File Map

```
src/
  types/game.ts                     — add LeaderboardEntry interface
  hooks/
    useLeaderboard.ts               — new
    useLeaderboard.test.ts          — new (addEntry, sort, trim, persist)
  components/
    LeaderboardModal.tsx            — new
    LeaderboardModal.module.css     — new
    StartScreen.tsx                 — add button + modal render
    ResultsScreen.tsx               — add button + modal render
  App.tsx                           — call addEntry on game end
```

---

## Acceptance Criteria

- Every completed game adds an entry to the leaderboard
- Top 10 only — 11th entry is discarded
- Entries sorted by score descending
- Timestamp shown as local time `YYYY-MM-DD HH:mm`
- Modal opens from Start Screen grass button
- Modal opens from Results Screen grass button
- Modal is NOT accessible from Game Screen
- Empty state shown when no scores exist
- Data persists across page reloads
- Closing modal returns to same screen without any state change
