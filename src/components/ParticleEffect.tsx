import type { Particle } from '../types/game'
import type { CSSProperties } from 'react'
import styles from './ParticleEffect.module.css'

const TRAVEL_COLLECT = 55
const TRAVEL_CONFETTI = 85

interface Props { particles: Particle[] }

export default function ParticleEffect({ particles }: Props) {
  return (
    <>
      {particles.map(p => {
        const travel = p.duration > 450 ? TRAVEL_CONFETTI : TRAVEL_COLLECT
        const ex = `${Math.cos(p.angle) * travel}px`
        const ey = `${Math.sin(p.angle) * travel}px`
        const isCircle = p.symbol === 'circle'
        return (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              '--ox': `${p.x}px`,
              '--oy': `${p.y}px`,
              '--ex': `calc(${p.x}px + ${ex})`,
              '--ey': `calc(${p.y}px + ${ey})`,
              animationDuration: `${p.duration}ms`,
              ...(isCircle
                ? { width: 12, height: 12, borderRadius: '50%', background: p.color ?? '#FFD93D' }
                : { fontSize: 20 }
              ),
            } as CSSProperties}
          >
            {!isCircle ? p.symbol : ''}
          </div>
        )
      })}
    </>
  )
}
