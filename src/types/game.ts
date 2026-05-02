export type Screen = 'start' | 'playing' | 'results'

export type CollectibleType = 'heart' | 'star' | 'gem'

export interface Collectible {
  id: string
  type: CollectibleType
  x: number        // % of viewport width
  y: number        // % of viewport height
  points: number   // heart=1, star=3, gem=5
  spawnedAt: number  // Date.now() — used for expiry
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
