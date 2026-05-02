import { useState } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import { playSound, stopSound } from '../utils/sound'
import styles from './StartScreen.module.css'

interface Props {
  highScore: number
  mutedRef: MutableRefObject<boolean>
  onPlay: () => void
}

export default function StartScreen({ highScore, mutedRef, onPlay }: Props) {
  const [muted, setMuted] = useState(mutedRef.current) // eslint-disable-line react-hooks/refs

  const toggleMute = () => {
    mutedRef.current = !mutedRef.current
    setMuted(mutedRef.current)
    if (mutedRef.current) {
      stopSound('music')
    } else {
      playSound('music', false)
    }
  }

  const handlePlay = () => {
    playSound('music', mutedRef.current)
    playSound('game-start', mutedRef.current)
    onPlay()
  }

  return (
    <>
      <Background />
      <div className={styles.screen}>
        <button className={styles.muteBtn} onClick={toggleMute} aria-label="Toggle sound">
          {muted ? '🔇' : '🔊'}
        </button>
        <div className={styles.highScore}>Best: {highScore} ⭐</div>
        <h1 className={styles.title}>Rainbow Rosella</h1>
        <div className={styles.mascot}>🦜</div>
        <button className={styles.playBtn} onClick={handlePlay}>▶ Play!</button>
      </div>
    </>
  )
}
