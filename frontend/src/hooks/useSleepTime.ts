import { useState } from 'react'

const STORAGE_KEY = 'time_rhythm_sleep'
const DEFAULT_START = '23:00'
const DEFAULT_END = '07:00'

interface SleepTime {
  start: string  // HH:mm
  end: string    // HH:mm
}

export const getSleepTime = (): SleepTime => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v) return JSON.parse(v)
  } catch {}
  return { start: DEFAULT_START, end: DEFAULT_END }
}

export const saveSleepTime = (sleep: SleepTime) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sleep))
}

/** Convert HH:mm string to minutes since midnight */
const hmToMinutes = (hm: string): number => {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

/**
 * Returns true if the given Date falls within the sleep window.
 * Handles cross-midnight windows (e.g. 23:00–07:00).
 */
export const isInSleepWindow = (d: Date, start: string, end: string): boolean => {
  const cur = d.getHours() * 60 + d.getMinutes()
  const s = hmToMinutes(start)
  const e = hmToMinutes(end)
  if (s === e) return false  // no sleep window configured
  if (s < e) {
    // same-day window (e.g. 14:00–15:00)
    return cur >= s && cur < e
  } else {
    // cross-midnight window (e.g. 23:00–07:00)
    return cur >= s || cur < e
  }
}

/**
 * If cursor falls within the sleep window, advance it to the sleep end time
 * (on the same day or next day as appropriate).
 */
export const skipSleepWindow = (cursor: Date, start: string, end: string): Date => {
  if (!isInSleepWindow(cursor, start, end)) return cursor
  const result = new Date(cursor)
  const [eh, em] = end.split(':').map(Number)
  const s = hmToMinutes(start)
  const e = hmToMinutes(end)
  if (s > e) {
    // cross-midnight: if cursor is past sleep start (e.g. >= 23:00), end is next day
    const curMin = cursor.getHours() * 60 + cursor.getMinutes()
    if (curMin >= s) {
      // past midnight start → end is tomorrow
      result.setDate(result.getDate() + 1)
    }
    // if curMin < e, end is same day
  }
  result.setHours(eh, em, 0, 0)
  return result
}

export const useSleepTime = () => {
  const [sleep, setSleepState] = useState<SleepTime>(getSleepTime)

  const setSleepTime = (next: SleepTime) => {
    saveSleepTime(next)
    setSleepState(next)
  }

  return { sleepStart: sleep.start, sleepEnd: sleep.end, setSleepTime }
}
