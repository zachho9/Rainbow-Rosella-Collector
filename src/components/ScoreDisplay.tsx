import styles from './ScoreDisplay.module.css'

export default function ScoreDisplay({ score }: { score: number }) {
  return <div className={styles.pill}>⭐ {score}</div>
}
