import { memo } from 'react'
import styles from './Background.module.css'

const CLOUDS = [
  { top: '5%',  left: '6%',   width: 90,  height: 34 },
  { top: '3%',  left: '13%',  width: 65,  height: 24 },
  { top: '7%',  left: '33%',  width: 110, height: 38 },
  { top: '4%',  right: '18%', width: 80,  height: 30 },
  { top: '9%',  right: '6%',  width: 100, height: 36 },
]

export default memo(function Background() {
  return (
    <div className={styles.bg}>
      <div className={styles.sky} />
      {CLOUDS.map((c, i) => (
        <div key={i} className={styles.cloud} style={c as React.CSSProperties} />
      ))}
      <div className={styles.grass} />
      <div className={styles.grassShadow} />
      <div className={styles.flowers}>
        <span style={{ bottom: 38, left: 40 }}>🌷</span>
        <span style={{ bottom: 34, left: 90 }}>🌸</span>
        <span style={{ bottom: 38, left: 200 }}>🌷</span>
        <span style={{ bottom: 34, right: 40 }}>🌷</span>
        <span style={{ bottom: 38, right: 90 }}>🌸</span>
        <span style={{ bottom: 34, right: 200 }}>🌸</span>
      </div>
    </div>
  )
})
