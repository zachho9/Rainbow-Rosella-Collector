import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLeaderboard } from './useLeaderboard'

const LS_KEY = 'rosellaLeaderboard'

beforeEach(() => localStorage.clear())

describe('useLeaderboard', () => {
  it('returns empty array when nothing is saved', () => {
    const { result } = renderHook(() => useLeaderboard())
    expect(result.current[0]).toEqual([])
  })

  it('loads persisted entries on init', () => {
    const entries = [{ score: 42, timestamp: 1000 }]
    localStorage.setItem(LS_KEY, JSON.stringify(entries))
    const { result } = renderHook(() => useLeaderboard())
    expect(result.current[0]).toEqual(entries)
  })

  it('addEntry saves a new entry to localStorage', () => {
    const { result } = renderHook(() => useLeaderboard())
    act(() => { result.current[1](50) })
    const stored = JSON.parse(localStorage.getItem(LS_KEY)!)
    expect(stored).toHaveLength(1)
    expect(stored[0].score).toBe(50)
    expect(typeof stored[0].timestamp).toBe('number')
  })

  it('addEntry sorts entries by score descending', () => {
    const { result } = renderHook(() => useLeaderboard())
    act(() => { result.current[1](30) })
    act(() => { result.current[1](80) })
    act(() => { result.current[1](50) })
    expect(result.current[0][0].score).toBe(80)
    expect(result.current[0][1].score).toBe(50)
    expect(result.current[0][2].score).toBe(30)
  })

  it('addEntry trims to 10 entries, keeping highest scores', () => {
    const { result } = renderHook(() => useLeaderboard())
    act(() => {
      for (let i = 1; i <= 12; i++) result.current[1](i * 10)
    })
    expect(result.current[0]).toHaveLength(10)
    expect(result.current[0][0].score).toBe(120)
    expect(result.current[0][9].score).toBe(30)
  })

  it('addEntry updates React state so UI re-renders', () => {
    const { result } = renderHook(() => useLeaderboard())
    act(() => { result.current[1](99) })
    expect(result.current[0][0].score).toBe(99)
  })
})
