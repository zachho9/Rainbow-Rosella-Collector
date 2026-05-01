import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHighScore } from './useHighScore'

beforeEach(() => localStorage.clear())

describe('useHighScore', () => {
  it('returns 0 when nothing is saved', () => {
    const { result } = renderHook(() => useHighScore())
    expect(result.current[0]).toBe(0)
  })

  it('loads a persisted score on init', () => {
    localStorage.setItem('rosellaHighScore', '42')
    const { result } = renderHook(() => useHighScore())
    expect(result.current[0]).toBe(42)
  })

  it('saves and returns the new high score when beaten', () => {
    const { result } = renderHook(() => useHighScore())
    act(() => { result.current[1](99) })
    expect(result.current[0]).toBe(99)
    expect(localStorage.getItem('rosellaHighScore')).toBe('99')
  })

  it('returns true when a new high score is set', () => {
    const { result } = renderHook(() => useHighScore())
    let isNew!: boolean
    act(() => { isNew = result.current[1](50) })
    expect(isNew).toBe(true)
  })

  it('returns false and does not save when score is not higher', () => {
    localStorage.setItem('rosellaHighScore', '100')
    const { result } = renderHook(() => useHighScore())
    let isNew!: boolean
    act(() => { isNew = result.current[1](50) })
    expect(isNew).toBe(false)
    expect(localStorage.getItem('rosellaHighScore')).toBe('100')
  })
})
