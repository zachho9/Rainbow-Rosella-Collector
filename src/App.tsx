import { useState, useRef, useCallback, useEffect } from 'react'
import type { Screen } from './types/game'
import { useHighScore } from './hooks/useHighScore'
import { useLeaderboard } from './hooks/useLeaderboard'
import { playSound, startMusicMuted, unmuteMusic } from './utils/sound'
import StartScreen from './components/StartScreen'
import GameScreen from './components/GameScreen'
import ResultsScreen from './components/ResultsScreen'

export default function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [lastScore, setLastScore] = useState(0)
  const [isNewHighScore, setIsNewHighScore] = useState(false)
  const [highScore, maybeUpdateHighScore] = useHighScore()
  const [, addEntry] = useLeaderboard()
  const mutedRef = useRef(false)

  // Start music muted on mount — muted autoplay is always allowed by browsers.
  useEffect(() => {
    startMusicMuted()
  }, [])

  // Unmute on first mousemove or click (whichever comes first), unless user muted.
  // mousemove fires as soon as the cursor enters the window — no click needed.
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!mutedRef.current) unmuteMusic()
      document.removeEventListener('mousemove', handleFirstInteraction)
      document.removeEventListener('click', handleFirstInteraction)
    }
    document.addEventListener('mousemove', handleFirstInteraction)
    document.addEventListener('click', handleFirstInteraction)
    return () => {
      document.removeEventListener('mousemove', handleFirstInteraction)
      document.removeEventListener('click', handleFirstInteraction)
    }
  }, [])

  const handlePlay = useCallback(() => setScreen('playing'), [])

  const handleGameEnd = useCallback((score: number) => {
    addEntry(score)
    const isNew = maybeUpdateHighScore(score)
    setLastScore(score)
    setIsNewHighScore(isNew)
    setScreen('results')
  }, [addEntry, maybeUpdateHighScore])

  const handlePlayAgain = useCallback(() => {
    playSound('music', mutedRef.current)
    setScreen('playing')
  }, [mutedRef])

  const handleHome = useCallback(() => {
    playSound('music', mutedRef.current)
    setScreen('start')
  }, [mutedRef])

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
