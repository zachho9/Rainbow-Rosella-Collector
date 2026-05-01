import { useEffect } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import { playSound } from '../utils/sound'
import styles from './ResultsScreen.module.css'

const CONFETTI = ['🎊', '🌟', '🎉', '✨', '🎊', '🌟', '🎉', '✨']

interface Props {
  score: number
  highScore: number
  isNewHighScore: boolean
  mutedRef: MutableRefObject<boolean>
  onPlayAgain: () => void
  onHome: () => void
}

export default function ResultsScreen({ score, highScore, isNewHighScore, mutedRef, onPlayAgain, onHome }: Props) {
  useEffect(() => {
    if (isNewHighScore) playSound('high-score', mutedRef.current)
  }, [isNewHighScore, mutedRef])

  return (
    <>
      <Background />
      <div className={styles.screen}>
        <div className={styles.confettiRow} aria-hidden>
          {CONFETTI.map((e, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.15}s` }}>{e}</span>
          ))}
        </div>
        <h2 className={styles.heading}>Great job! 🎉</h2>
        <div className={styles.mascot}>🦜</div>
        <div className={styles.scorePill}>
          <span className={styles.scoreLabel}>You got</span>
          <span className={styles.scoreValue}>{score} ⭐</span>
        </div>
        {isNewHighScore
          ? <div className={styles.newHighScore}>🏆 New High Score!</div>
          : highScore > 0 && <div className={styles.bestScore}>Best: {highScore} ⭐</div>
        }
        <button className={styles.playAgainBtn} onClick={onPlayAgain}>▶ Play Again</button>
        <button className={styles.homeBtn} onClick={onHome}>🏠 Home</button>
      </div>
    </>
  )
}
