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
