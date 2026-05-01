import type { CSSProperties } from 'react'
import type { Collectible } from '../types/game'
import styles from './Collectible.module.css'

const EMOJI: Record<Collectible['type'], string> = {
  heart: '❤️',
  star: '⭐',
  gem: '🌈',
}

export default function CollectibleItem({ collectible }: { collectible: Collectible }) {
  const tx = `${(collectible.x / 100) * window.innerWidth - 25}px`
  const ty = `${(collectible.y / 100) * window.innerHeight - 25}px`
  return (
    <div
      className={styles.item}
      style={{ '--tx': tx, '--ty': ty } as CSSProperties}
    >
      {EMOJI[collectible.type]}
    </div>
  )
}
