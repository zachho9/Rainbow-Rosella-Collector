# Score Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the rosella collects a collectible, a coloured score label (+1/+3/+5) floats up from just above the item and fades out, giving the child immediate visual feedback.

**Architecture:** New `ScorePopup` type added to `game.ts`. New `spawnScorePopup()` utility in `particles.ts`. New `ScorePopupEffect` component (CSS keyframe, `position:fixed top:0 left:0`, same infrastructure pattern as `ParticleEffect`). `GameScreen` gets a `scorePopups` state array managed identically to `particles` — appended on collect, removed via `setTimeout`.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vite, Vitest.

---

## File Map

```
src/
  types/game.ts                         — add ScorePopup interface
  utils/particles.ts                    — add spawnScorePopup()
  components/
    ScorePopupEffect.module.css         — new: floatUp keyframe + .popup class
    ScorePopupEffect.tsx                — new: renders scorePopups array
    GameScreen.tsx                      — add scorePopups state, addScorePopup callback, render
```

---

## Task 1: Add `ScorePopup` type

**Files:**
- Modify: `src/types/game.ts`

- [ ] **Step 1: Add `ScorePopup` interface to `src/types/game.ts`**

Append after the existing `Particle` interface:

```typescript
export interface ScorePopup {
  id: string
  x: number      // px — spawn position (collectible centre x, offset for text)
  y: number      // px — spawn position (collectible centre y - 30px)
  points: number // 1 | 3 | 5
  duration: number // ms — 600
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
git commit -m "feat: add ScorePopup type"
```

---

## Task 2: Add `spawnScorePopup` utility

**Files:**
- Modify: `src/utils/particles.ts`

- [ ] **Step 1: Add import and function to `src/utils/particles.ts`**

Add to the top of the file, alongside the existing `Particle` import:

```typescript
import type { Particle, ScorePopup } from '../types/game'
```

Replace the existing `import type { Particle } from '../types/game'` line with the line above.

Then append `spawnScorePopup` after the existing `spawnBubbleConfetti` function:

```typescript
export function spawnScorePopup(x: number, y: number, points: number): ScorePopup {
  return {
    id: Math.random().toString(36).slice(2, 10),
    x: x - 20,   // offset left ~half text width to visually centre
    y: y - 30,   // 30px above collectible centre
    points,
    duration: 600,
  }
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Run existing tests to confirm no regression**

```bash
npx vitest run
```

Expected: all 16 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/utils/particles.ts src/types/game.ts
git commit -m "feat: add spawnScorePopup utility"
```

---

## Task 3: Create `ScorePopupEffect` component

**Files:**
- Create: `src/components/ScorePopupEffect.module.css`
- Create: `src/components/ScorePopupEffect.tsx`

- [ ] **Step 1: Create `src/components/ScorePopupEffect.module.css`**

```css
.popup {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 26;
  font-family: 'Fredoka One', cursive;
  font-size: 28px;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
  animation: floatUp linear forwards;
}

@keyframes floatUp {
  0%   { transform: translate(var(--px), var(--py)); opacity: 1; }
  66%  { transform: translate(var(--px), calc(var(--py) - 33px)); opacity: 1; }
  100% { transform: translate(var(--px), calc(var(--py) - 50px)); opacity: 0; }
}
```

- [ ] **Step 2: Create `src/components/ScorePopupEffect.tsx`**

```tsx
import type { CSSProperties } from 'react'
import type { ScorePopup } from '../types/game'
import styles from './ScorePopupEffect.module.css'

const COLOURS: Record<number, string> = {
  1: '#FF6B6B',   // red — heart
  3: '#FFD93D',   // yellow — star
  5: '#845ec2',   // purple — gem
}

interface Props { scorePopups: ScorePopup[] }

export default function ScorePopupEffect({ scorePopups }: Props) {
  return (
    <>
      {scorePopups.map(p => (
        <div
          key={p.id}
          className={styles.popup}
          style={{
            '--px': `${p.x}px`,
            '--py': `${p.y}px`,
            animationDuration: `${p.duration}ms`,
            color: COLOURS[p.points] ?? '#FFD93D',
          } as CSSProperties & Record<string, string | number>}
        >
          +{p.points}
        </div>
      ))}
    </>
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
git add src/components/ScorePopupEffect.tsx src/components/ScorePopupEffect.module.css
git commit -m "feat: add ScorePopupEffect component"
```

---

## Task 4: Wire into GameScreen

**Files:**
- Modify: `src/components/GameScreen.tsx`

- [ ] **Step 1: Add import for `ScorePopupEffect`, `spawnScorePopup`, and `ScorePopup` type**

At the top of `GameScreen.tsx`, add to the existing import lines:

```typescript
import ScorePopupEffect from './ScorePopupEffect'
import { spawnCollectSparkle, spawnBubbleConfetti, spawnScorePopup } from '../utils/particles'
import type { Collectible, Bubble, Particle, ScorePopup, CollectibleType } from '../types/game'
```

Replace the two existing import lines for `particles` and `types/game` with the lines above.

- [ ] **Step 2: Add `scorePopups` state and `addScorePopup` callback**

In the state declarations block (around line 46), add after the `particles` state line:

```typescript
const [scorePopups, setScorePopups] = useState<ScorePopup[]>([])
```

After the existing `addParticles` callback (around line 77), add:

```typescript
const addScorePopup = useCallback((popup: ScorePopup) => {
  setScorePopups(prev => [...prev, popup])
  setTimeout(() => {
    if (!mountedRef.current) return
    setScorePopups(prev => prev.filter(p => p.id !== popup.id))
  }, popup.duration + 50)
}, [])
```

- [ ] **Step 3: Call `addScorePopup` in the collect collision block**

In the `tick` callback, find the collect collision block (where `addParticles(spawnCollectSparkle(...))` is called). Add the `addScorePopup` call on the line immediately after:

```typescript
if (isColliding(rosX, rosY, ROSELLA_RADIUS, itemX, itemY, COLLECTIBLE_RADIUS)) {
  collectingIds.current.add(item.id)
  playSound('collect', mutedRef.current)
  addParticles(spawnCollectSparkle(itemX, itemY))
  addScorePopup(spawnScorePopup(itemX, itemY, item.points))  // ← add this line
  const pts = item.points
  setScore(s => { scoreRef.current = s + pts; return s + pts })
  setCollectibles(prev => prev.filter(c => c.id !== item.id))
  spawnReplacement()
  setTimeout(() => collectingIds.current.delete(item.id), 1500)
}
```

Also add `addScorePopup` to the `tick` useCallback dependency array:

```typescript
}, [mousePos, mutedRef, spawnReplacement, addParticles, addScorePopup])
```

- [ ] **Step 4: Render `ScorePopupEffect` in the JSX**

In the return block, add `<ScorePopupEffect>` between `<ParticleEffect>` and `<Rosella>`:

```tsx
return (
  <div style={{ position: 'fixed', inset: 0 }}>
    <Background />
    <TimerBar timeLeft={timeLeft} />
    <ScoreDisplay score={score} />
    {collectibles.map(c => <CollectibleItem key={c.id} collectible={c} />)}
    {bubble && <BubbleComponent bubble={bubble} onClick={handleBubblePop} />}
    <ParticleEffect particles={particles} />
    <ScorePopupEffect scorePopups={scorePopups} />
    <Rosella ref={rosellaRef} />
  </div>
)
```

- [ ] **Step 5: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: all 16 tests pass.

- [ ] **Step 7: Verify in browser**

```bash
npm run dev
```

Navigate to `http://localhost:5173`, click Play. Move the rosella over collectibles and verify:
- A `+1` in red floats up above hearts
- A `+3` in yellow floats up above stars
- A `+5` in purple floats up above gems
- The number appears ~30px above the collectible, not on top of it
- It floats upward ~50px and fades out over ~600ms
- Sparkle particles still burst outward as before (no regression)
- Multiple popups on screen simultaneously work correctly

- [ ] **Step 8: Commit**

```bash
git add src/components/GameScreen.tsx
git commit -m "feat: score popup floats up on collectible collect"
```

---

## Acceptance Criteria Checklist

- [ ] `+1` in red (`#FF6B6B`) appears above a heart when collected
- [ ] `+3` in yellow (`#FFD93D`) appears above a star
- [ ] `+5` in purple (`#845ec2`) appears above a gem
- [ ] Popup spawns ~30px above collectible centre, not overlapping the emoji
- [ ] Duration ~600ms, fades cleanly, no lingering DOM nodes
- [ ] Multiple popups coexist on screen without interference
- [ ] Existing sparkle particles unaffected
- [ ] All 16 tests pass
- [ ] `npx tsc --noEmit` clean
