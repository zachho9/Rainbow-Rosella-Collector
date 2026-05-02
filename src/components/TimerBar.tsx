import styles from './TimerBar.module.css'

interface Props {
  timeLeft: number
  total?: number
}

export default function TimerBar({ timeLeft, total = 60 }: Props) {
  const pct = Math.max(0, (timeLeft / total) * 100)
  const urgent = timeLeft <= 10

  return (
    <div className={styles.container}>
      <div className={styles.barWrapper}>
        <div
          className={`${styles.bar} ${urgent ? styles.barUrgent : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={styles.label}>{timeLeft}s</span>
    </div>
  )
}
