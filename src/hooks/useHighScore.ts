import { useState, useCallback } from 'react'

const LS_KEY = 'rosellaHighScore'

export function useHighScore(): [number, (score: number) => boolean] {
  const [highScore, setHighScore] = useState<number>(() => {
    const stored = localStorage.getItem(LS_KEY)
    return stored ? parseInt(stored, 10) : 0
  })

  const maybeUpdate = useCallback((score: number): boolean => {
    if (score > highScore) {
      localStorage.setItem(LS_KEY, String(score))
      setHighScore(score)
      return true
    }
    return false
  }, [highScore])

  return [highScore, maybeUpdate]
}
