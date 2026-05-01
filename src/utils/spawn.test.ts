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
