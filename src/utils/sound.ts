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
