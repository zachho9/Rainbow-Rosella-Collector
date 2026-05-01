import type { MutableRefObject } from 'react'

interface Props {
  highScore: number
  mutedRef: MutableRefObject<boolean>
  onPlay: () => void
}

export default function StartScreen({ onPlay }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <button onClick={onPlay} style={{ fontSize: 32, padding: '16px 40px' }}>▶ Play</button>
    </div>
  )
}
