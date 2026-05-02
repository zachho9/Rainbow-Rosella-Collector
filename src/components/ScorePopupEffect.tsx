import type { CSSProperties } from 'react'
import type { ScorePopup } from '../types/game'
import styles from './ScorePopupEffect.module.css'

const COLOURS: Record<number, string> = {
  1: '#FF6B6B',   // red — heart
  3: '#FFD93D',   // yellow — star
  5: '#845ec2',   // purple — gem
}

interface Props { scorePopups: ScorePopup[] }

export default function ScorePopupEffect({ scorePopups }: Props) {
  return (
    <>
      {scorePopups.map(p => (
        <div
          key={p.id}
          className={styles.popup}
          style={{
            '--px': `${p.x}px`,
            '--py': `${p.y}px`,
            animationDuration: `${p.duration}ms`,
            color: COLOURS[p.points] ?? '#FFD93D',
          } as CSSProperties & Record<string, string | number>}
        >
          +{p.points}
        </div>
      ))}
    </>
  )
}
