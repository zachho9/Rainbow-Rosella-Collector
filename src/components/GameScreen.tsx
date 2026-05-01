import { useRef, useState, useEffect, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import Background from './Background'
import Rosella from './Rosella'
import TimerBar from './TimerBar'
import ScoreDisplay from './ScoreDisplay'
import CollectibleItem from './Collectible'
import BubbleComponent from './Bubble'
import { useMousePosition } from '../hooks/useMousePosition'
import { useGameLoop } from '../hooks/useGameLoop'
import { isColliding } from '../utils/collision'
import { pickCollectibleType, spawnPosition } from '../utils/spawn'
import { playSound, stopSound } from '../utils/sound'
import type { Collectible, Bubble, CollectibleType } from '../types/game'

const LERP = 0.18
const GAME_DURATION = 60
const ROSELLA_RADIUS = 45
const COLLECTIBLE_RADIUS = 30
const INITIAL_COUNT = 10
const MAX_COLLECTIBLES = 12
const SPAWN_DELAY = () => 500 + Math.random() * 500
const BUBBLE_EXPIRE_MS = 8000
const BUBBLE_INTERVAL_MIN = 10000
const BUBBLE_INTERVAL_RANGE = 5000

function rid() { return Math.random().toString(36).slice(2, 10) }

function makeCollectible(existing: Collectible[], rosX: number, rosY: number): Collectible {
  const { type, points } = pickCollectibleType()
  const { x, y } = spawnPosition({
    existing, rosellaX: rosX, rosellaY: rosY,
    vpW: window.innerWidth, vpH: window.innerHeight,
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
  const [bubble, setBubble] = useState<Bubble | null>(null)
  const [active, setActive] = useState(true)

  const rosellaRef = useRef<HTMLDivElement>(null)
  const rosellaPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const mousePos = useMousePosition()
  const scoreRef = useRef(0)
  const activeRef = useRef(true)
  const collectiblesRef = useRef<Collectible[]>([])
  const bubbleRef = useRef<Bubble | null>(null)
  const collectingIds = useRef(new Set<string>())
  const mountedRef = useRef(true)
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => { mountedRef.current = false }, [])
  useEffect(() => { collectiblesRef.current = collectibles }, [collectibles])
  useEffect(() => { bubbleRef.current = bubble }, [bubble])

  // Initial spawn
  useEffect(() => {
    const initial: Collectible[] = []
    for (let i = 0; i < INITIAL_COUNT; i++) initial.push(makeCollectible(initial, 50, 50))
    setCollectibles(initial)
  }, [])

  // BGM
  useEffect(() => {
    playSound('music', mutedRef.current)
    return () => stopSound('music')
  }, [mutedRef])

  // Bubble spawn scheduler
  useEffect(() => {
    if (!active) return
    const schedule = () => {
      const delay = BUBBLE_INTERVAL_MIN + Math.random() * BUBBLE_INTERVAL_RANGE
      bubbleTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return
        if (!bubbleRef.current) {
          setBubble({
            id: rid(),
            x: 12 + Math.random() * 76,
            y: 18 + Math.random() * 60,
            spawnedAt: Date.now(),
            fading: false,
          })
        }
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(bubbleTimeoutRef.current)
  }, [active])

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

  const handleBubblePop = useCallback(() => {
    const b = bubbleRef.current
    if (!b || b.fading) return
    bubbleRef.current = null  // prevent double-pop before React re-renders
    playSound('bubble-pop', mutedRef.current)
    setBubble(null)
    // Spawn 3–5 heart/star collectibles around bubble position
    const count = 3 + Math.floor(Math.random() * 3)
    setCollectibles(prev => {
      const burst: Collectible[] = Array.from({ length: count }, () => {
        const type: CollectibleType = Math.random() < 0.5 ? 'heart' : 'star'
        return {
          id: rid(),
          type,
          points: type === 'heart' ? 1 : 3,
          x: Math.min(92, Math.max(8, b.x + (Math.random() - 0.5) * 14)),
          y: Math.min(82, Math.max(15, b.y + (Math.random() - 0.5) * 14)),
        }
      })
      return [...prev.slice(0, MAX_COLLECTIBLES - count), ...burst]
    })
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

    // Collision
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

    // Bubble expiry check
    const b = bubbleRef.current
    if (b && !b.fading && Date.now() - b.spawnedAt >= BUBBLE_EXPIRE_MS) {
      bubbleRef.current = { ...b, fading: true }  // break re-entry immediately
      setBubble(prev => prev ? { ...prev, fading: true } : null)
      setTimeout(() => { if (mountedRef.current) setBubble(null) }, 500)
    }
  }, [mousePos, mutedRef, spawnReplacement])

  useGameLoop(tick, active)

  // Countdown tick
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      setTimeLeft(t => (t <= 1 ? 0 : t - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [active])

  // End-game trigger
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
      {bubble && <BubbleComponent bubble={bubble} onClick={handleBubblePop} />}
      <Rosella ref={rosellaRef} />
    </div>
  )
}
