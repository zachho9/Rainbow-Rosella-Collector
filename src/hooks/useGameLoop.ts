import { useEffect, useRef } from 'react'

export function useGameLoop(callback: () => void, active: boolean) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback // eslint-disable-line react-hooks/refs

  useEffect(() => {
    if (!active) return

    let rafId: number

    const loop = () => {
      callbackRef.current()
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [active])
}
