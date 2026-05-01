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
