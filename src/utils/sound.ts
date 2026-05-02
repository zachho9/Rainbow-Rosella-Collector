export type SoundKey = 'collect' | 'bubble-pop' | 'game-start' | 'game-end' | 'high-score' | 'music'

const BASE = import.meta.env.BASE_URL

const FILES: Record<SoundKey, string> = {
  'collect':     `${BASE}sounds/collect.mp3`,
  'bubble-pop':  `${BASE}sounds/bubble-pop.mp3`,
  'game-start':  `${BASE}sounds/game-start.mp3`,
  'game-end':    `${BASE}sounds/game-end.mp3`,
  'high-score':  `${BASE}sounds/high-score.mp3`,
  'music':       `${BASE}sounds/music.mp3`,
}

const cache: Partial<Record<SoundKey, HTMLAudioElement>> = {}

export function preloadSounds(): void {
  for (const [key, path] of Object.entries(FILES) as [SoundKey, string][]) {
    const el = new Audio(path)
    el.preload = 'auto'
    if (key === 'music') {
      el.muted = true  // create muted so browsers treat it as always-muted for autoplay
      el.loop = true
    }
    cache[key] = el
  }
}

// Starts music silently on page load. Muted autoplay is always allowed by browsers.
// Call unmuteMusic() once the user interacts to make it audible.
export function startMusicMuted(): void {
  const src = cache['music']
  if (!src) return
  src.muted = true
  src.currentTime = 0
  src.play().catch((e) => {
    console.warn('[sound] muted start failed:', e)
  })
}

// Unmutes the music. If it never started (play() was rejected), tries to start it now.
// Call from a click handler to guarantee user-gesture context for play().
export function unmuteMusic(): void {
  const src = cache['music']
  if (!src) return
  src.muted = false
  if (src.paused) {
    src.play().catch((e) => {
      console.warn('[sound] unmute play failed:', e)
    })
  }
}

export function playSound(key: SoundKey, muted: boolean): void {
  if (muted) return
  const src = cache[key]
  if (!src) return
  if (key === 'music') {
    src.muted = false  // clear muted-autoplay state before explicit play
    src.currentTime = 0
    src.play().catch((e) => {
      console.warn('[sound] play failed:', key, e)
    })
    return
  }
  const clone = src.cloneNode() as HTMLAudioElement
  clone.play().catch((e) => {
    console.warn('[sound] play failed:', key, e)
  })
}

export function stopSound(key: SoundKey): void {
  const src = cache[key]
  if (!src) return
  src.pause()
  src.currentTime = 0
}
