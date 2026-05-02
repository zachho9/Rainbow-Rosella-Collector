import { useState, useCallback } from 'react'
import type { LeaderboardEntry } from '../types/game'

const LS_KEY = 'rosellaLeaderboard'

function load(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : []
  } catch {
    return []
  }
}

function save(entries: LeaderboardEntry[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(entries))
}

export function useLeaderboard(): [LeaderboardEntry[], (score: number) => void] {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => load())

  const addEntry = useCallback((score: number) => {
    setEntries(prev => {
      const next = [...prev, { score, timestamp: Date.now() }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
      save(next)
      return next
    })
  }, [])

  return [entries, addEntry]
}
