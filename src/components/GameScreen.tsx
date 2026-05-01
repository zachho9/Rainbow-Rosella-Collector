import { useRef, useState, useEffect, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import Rosella from './Rosella'
import TimerBar from './TimerBar'
import ScoreDisplay from './ScoreDisplay'
import CollectibleItem from './Collectible'
import { useMousePosition } from '../hooks/useMousePosition'
import { useGameLoop } from '../hooks/useGameLoop'
import { isColliding } from '../utils/collision'
import { pickCollectibleType, spawnPosition } from '../utils/spawn'
import { playSound, stopSound } from '../utils/sound'
import type { Collectible } from '../types/game'

const LERP = 0.18
const GAME_DURATION = 60
const ROSELLA_RADIUS = 45
const COLLECTIBLE_RADIUS = 30
const INITIAL_COUNT = 10
const MAX_COLLECTIBLES = 12
const SPAWN_DELAY = () => 500 + Math.random() * 500

function rid() { return Math.random().toString(36).slice(2, 10) }

function makeCollectible(existing: Collectible[], rosX: number, rosY: number): Collectible {
  const { type, points } = pickCollectibleType()
  const { x, y } = spawnPosition({
    existing,
    rosellaX: rosX,
    rosellaY: rosY,
    vpW: window.innerWidth,
    vpH: window.innerHeight,
  })
  return { id: rid(), type, x, y, points }
}

interface Props {
  mutedRef: MutableRefObject<boolean>
  onGameEnd: (score: number) => void
}

export default function GameScreen({ mutedRef, onGameEnd }: Props) {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [collectibles, setCollectibles] = useState<Collectible[]>([])
  const [active, setActive] = useState(true)

  const rosellaRef = useRef<HTMLDivElement>(null)
  const rosellaPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const mousePos = useMousePosition()
  const scoreRef = useRef(0)
  const activeRef = useRef(true)
  const collectiblesRef = useRef<Collectible[]>([])
  const collectingIds = useRef(new Set<string>())
  const mountedRef = useRef(true)

  useEffect(() => () => { mountedRef.current = false }, [])

  // Keep collectiblesRef in sync for stale-closure-free collision reads in rAF
  useEffect(() => { collectiblesRef.current = collectibles }, [collectibles])

  // Initial spawn
  useEffect(() => {
    const initial: Collectible[] = []
    for (let i = 0; i < INITIAL_COUNT; i++) {
      initial.push(makeCollectible(initial, 50, 50))
    }
    setCollectibles(initial)
  }, [])

  // Start BGM
  useEffect(() => {
    playSound('music', mutedRef.current)
    return () => stopSound('music')
  }, [mutedRef])

  const spawnReplacement = useCallback(() => {
    setTimeout(() => {
      if (!mountedRef.current) return
      setCollectibles(prev => {
        if (prev.length >= MAX_COLLECTIBLES) return prev
        const pos = rosellaPos.current
        return [...prev, makeCollectible(
          prev,
          (pos.x / window.innerWidth) * 100,
          (pos.y / window.innerHeight) * 100,
        )]
      })
    }, SPAWN_DELAY())
  }, [])

  const tick = useCallback(() => {
    if (!activeRef.current) return

    // Move rosella via lerp
    const target = mousePos.current
    const pos = rosellaPos.current
    pos.x += (target.x - pos.x) * LERP
    pos.y += (target.y - pos.y) * LERP
    if (rosellaRef.current) {
      rosellaRef.current.style.transform =
        `translate(${Math.round(pos.x - 35)}px, ${Math.round(pos.y - 35)}px)`
    }

    // Collision detection against ref mirror
    const rosX = pos.x
    const rosY = pos.y
    for (const item of collectiblesRef.current) {
      if (collectingIds.current.has(item.id)) continue
      const itemX = (item.x / 100) * window.innerWidth
      const itemY = (item.y / 100) * window.innerHeight
      if (isColliding(rosX, rosY, ROSELLA_RADIUS, itemX, itemY, COLLECTIBLE_RADIUS)) {
        collectingIds.current.add(item.id)
        playSound('collect', mutedRef.current)
        const pts = item.points
        setScore(s => { scoreRef.current = s + pts; return s + pts })
        setCollectibles(prev => prev.filter(c => c.id !== item.id))
        spawnReplacement()
        setTimeout(() => collectingIds.current.delete(item.id), 1500)
      }
    }
  }, [mousePos, mutedRef, spawnReplacement])

  useGameLoop(tick, active)

  // Countdown tick — pure updater
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      setTimeLeft(t => (t <= 1 ? 0 : t - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [active])

  // End-game trigger — fires when timer hits 0
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
      {collectibles.map(c => <CollectibleItem key={c.id} collectible={c} />)}
      <Rosella ref={rosellaRef} />
    </div>
  )
}
