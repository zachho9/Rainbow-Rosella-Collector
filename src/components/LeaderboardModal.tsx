import { useLeaderboard } from '../hooks/useLeaderboard'
import styles from './LeaderboardModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
}

const MEDALS = ['🥇', '🥈', '🥉']

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function LeaderboardModal({ open, onClose }: Props) {
  const [entries] = useLeaderboard()

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <div className={styles.panel}>
          <div className={styles.title}>🏆 Top Scores</div>
          {entries.length === 0 ? (
            <div className={styles.empty}>No scores yet — play a game!</div>
          ) : (
            entries.map((entry, i) => (
              <div key={entry.timestamp} className={`${styles.row} ${i === 0 ? styles.rowFirst : ''}`}>
                {i < 3
                  ? <span className={styles.rank}>{MEDALS[i]}</span>
                  : <span className={styles.rankNum}>{i + 1}</span>
                }
                <span className={`${styles.score} ${i === 0 ? styles.scoreFirst : ''}`}>
                  {entry.score} ⭐
                </span>
                <span className={styles.time}>{formatTimestamp(entry.timestamp)}</span>
              </div>
            ))
          )}
        </div>
        <button className={styles.closeBtn} onClick={onClose}>✕ Close</button>
      </div>
    </div>
  )
}
