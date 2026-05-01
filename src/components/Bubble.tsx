import type { Bubble } from '../types/game'
import type { CSSProperties } from 'react'
import styles from './Bubble.module.css'

interface Props {
  bubble: Bubble
  onClick: () => void
}

export default function BubbleComponent({ bubble, onClick }: Props) {
  const tx = `${(bubble.x / 100) * window.innerWidth - 36}px`
  const ty = `${(bubble.y / 100) * window.innerHeight - 36}px`
  return (
    <div
      className={`${styles.bubble} ${bubble.fading ? styles.fading : ''}`}
      style={{ '--tx': tx, '--ty': ty } as CSSProperties}
      onClick={onClick}
    >
      🫧
    </div>
  )
}
