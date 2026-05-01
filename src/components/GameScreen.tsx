import { useRef, useState, useEffect, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import Rosella from './Rosella'
import TimerBar from './TimerBar'
import ScoreDisplay from './ScoreDisplay'
import { useMousePosition } from '../hooks/useMousePosition'
import { useGameLoop } from '../hooks/useGameLoop'
import { playSound, stopSound } from '../utils/sound'

const LERP = 0.18
const GAME_DURATION = 60

interface Props {
  mutedRef: MutableRefObject<boolean>
  onGameEnd: (score: number) => void
}

export default function GameScreen({ mutedRef, onGameEnd }: Props) {
  const [score] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [active, setActive] = useState(true)

  const rosellaRef = useRef<HTMLDivElement>(null)
  const rosellaPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const mousePos = useMousePosition()
  const scoreRef = useRef(0)
  const activeRef = useRef(true)

  // Start BGM
  useEffect(() => {
    playSound('music', mutedRef.current)
    return () => stopSound('music')
  }, [mutedRef])

  const tick = useCallback(() => {
    if (!activeRef.current) return
    const target = mousePos.current
    const pos = rosellaPos.current
    pos.x += (target.x - pos.x) * LERP
    pos.y += (target.y - pos.y) * LERP
    if (rosellaRef.current) {
      rosellaRef.current.style.transform =
        `translate(${Math.round(pos.x - 35)}px, ${Math.round(pos.y - 35)}px)`
    }
  }, [mousePos])

  useGameLoop(tick, active)

  // Countdown tick — pure updater, no side effects
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      setTimeLeft(t => (t <= 1 ? 0 : t - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [active])

  // End-game trigger — fires once when timer hits 0
  useEffect(() => {
    if (timeLeft > 0) return
    activeRef.current = false
    setActive(false)
    const tid = setTimeout(() => {
      playSound('game-end', mutedRef.current)
      onGameEnd(scoreRef.current)
    }, 300)
    return () => clearTimeout(tid)
  }, [timeLeft, mutedRef, onGameEnd])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Background />
      <TimerBar timeLeft={timeLeft} />
      <ScoreDisplay score={score} />
      <Rosella ref={rosellaRef} />
    </div>
  )
}
