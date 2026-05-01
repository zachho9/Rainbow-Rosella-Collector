import type { MutableRefObject } from 'react'

interface Props {
  score: number
  highScore: number
  isNewHighScore: boolean
  mutedRef: MutableRefObject<boolean>
  onPlayAgain: () => void
  onHome: () => void
}

export default function ResultsScreen({ score, onPlayAgain }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24 }}>
      <p style={{ fontSize: 32 }}>Score: {score}</p>
      <button onClick={onPlayAgain} style={{ fontSize: 24, padding: '12px 32px' }}>Play Again</button>
    </div>
  )
}
