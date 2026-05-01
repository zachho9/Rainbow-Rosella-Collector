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
