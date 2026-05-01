import { forwardRef } from 'react'
import styles from './Rosella.module.css'

const Rosella = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className={styles.rosella}>🦜</div>
))
Rosella.displayName = 'Rosella'
export default Rosella
