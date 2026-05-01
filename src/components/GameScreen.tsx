import type { MutableRefObject } from 'react'

interface Props {
  mutedRef: MutableRefObject<boolean>
  onGameEnd: (score: number) => void
}

export default function GameScreen({ onGameEnd }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <button onClick={() => onGameEnd(42)} style={{ fontSize: 24 }}>End Game (debug)</button>
    </div>
  )
}
