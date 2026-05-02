import { useState, useRef, useCallback, useEffect } from 'react'
import type { Screen } from './types/game'
import { useHighScore } from './hooks/useHighScore'
import { playSound } from './utils/sound'
import StartScreen from './components/StartScreen'
import GameScreen from './components/GameScreen'
import ResultsScreen from './components/ResultsScreen'

export default function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [lastScore, setLastScore] = useState(0)
  const [isNewHighScore, setIsNewHighScore] = useState(false)
  const [highScore, maybeUpdateHighScore] = useHighScore()
  const mutedRef = useRef(false)

  // Start music on the first unmuted user click — browser autoplay requires a gesture.
  // Only remove the listener once music actually starts; if the first click was the
  // mute button (which sets mutedRef before this listener fires), keep listening.
  useEffect(() => {
    const startMusic = () => {
      if (!mutedRef.current) {
        playSound('music', false)
        document.removeEventListener('click', startMusic)
      }
    }
    document.addEventListener('click', startMusic)
    return () => document.removeEventListener('click', startMusic)
  }, [])

  const handlePlay = useCallback(() => setScreen('playing'), [])

  const handleGameEnd = useCallback((score: number) => {
    const isNew = maybeUpdateHighScore(score)
    setLastScore(score)
    setIsNewHighScore(isNew)
    setScreen('results')
  }, [maybeUpdateHighScore])

  const handlePlayAgain = useCallback(() => setScreen('playing'), [])
  const handleHome = useCallback(() => setScreen('start'), [])

  return (
    <>
      {screen === 'start' && (
        <StartScreen highScore={highScore} mutedRef={mutedRef} onPlay={handlePlay} />
      )}
      {screen === 'playing' && (
        <GameScreen mutedRef={mutedRef} onGameEnd={handleGameEnd} />
      )}
      {screen === 'results' && (
        <ResultsScreen
          score={lastScore}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          mutedRef={mutedRef}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      )}
    </>
  )
}
