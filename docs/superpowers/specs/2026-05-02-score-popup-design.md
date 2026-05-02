# Score Popup — Design Spec

**Date:** 2026-05-02
**Status:** Approved

---

## Overview

When the 🦜 rosella collects a collectible, a floating score label appears slightly above the item, rises upward, and fades out. Gives the child immediate visual feedback on how many points they earned.

---

## Visual Design

| Item | Points | Colour |
|---|---|---|
| ❤️ Heart | +1 | `#FF6B6B` (red) |
| ⭐ Star | +3 | `#FFD93D` (yellow) |
| 🌈 Gem | +5 | `#845ec2` (purple) |

- Font: **Fredoka One**, 28px
- Text shadow: `0 2px 4px rgba(0,0,0,0.25)` for legibility against the sky

---

## Position & Animation

- Spawns **30px above** the collectible's centre (i.e. `y - 30` in px)
- Horizontally centred on the collectible (`x - ~20px` to account for text width)
- Floats **straight up ~50px** over **600ms**
- Fades to opacity 0 in the final 200ms
- CSS keyframe — same infrastructure as existing `ParticleEffect`

```css
@keyframes floatUp {
  0%   { transform: translate(var(--px), var(--py)); opacity: 1; }
  66%  { opacity: 1; }
  100% { transform: translate(var(--px), calc(var(--py) - 50px)); opacity: 0; }
}
```

---

## Architecture

### New type — `ScorePopup`

```typescript
// src/types/game.ts
export interface ScorePopup {
  id: string
  x: number      // px — collectible centre x
  y: number      // px — collectible centre y
  points: number // 1 | 3 | 5
  duration: number // ms — 600
}
```

### New component — `ScorePopupEffect`

**Files:**
- `src/components/ScorePopupEffect.tsx`
- `src/components/ScorePopupEffect.module.css`

Renders all active `ScorePopup` items. Each popup is a `position: fixed; top:0; left:0` div with CSS custom properties `--px` and `--py` driving the `floatUp` animation. `z-index: 26` (above particles at 25).

### New utility — `spawnScorePopup`

```typescript
// src/utils/particles.ts  (added alongside existing spawn functions)
export function spawnScorePopup(x: number, y: number, points: number): ScorePopup
```

### GameScreen changes

- Add `scorePopups: ScorePopup[]` state
- Add `addScorePopup(popup: ScorePopup)` callback (same pattern as `addParticles`)
- On collect collision: call `addScorePopup(spawnScorePopup(itemX, itemY, pts))`
- Render `<ScorePopupEffect scorePopups={scorePopups} />` above `<ParticleEffect>` in JSX

### No changes to existing Particle system

Sparkle particles continue to burst outward as before. Score popups are a separate concern.

---

## File Map

```
src/
  types/game.ts                     — add ScorePopup interface
  utils/particles.ts                — add spawnScorePopup()
  components/
    ScorePopupEffect.tsx            — new
    ScorePopupEffect.module.css     — new
    GameScreen.tsx                  — add scorePopups state + render
```

---

## Acceptance Criteria

- `+1` in red appears above a heart when collected, floats up, fades out
- `+3` in yellow appears above a star
- `+5` in purple appears above a gem
- Popup spawns ~30px above the collectible, not on top of it
- Duration ~600ms, disappears cleanly
- Multiple popups can be on screen simultaneously without interference
- No impact on existing sparkle particle effects
