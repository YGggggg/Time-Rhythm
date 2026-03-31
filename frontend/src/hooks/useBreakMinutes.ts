import { useState } from 'react'

const STORAGE_KEY = 'time_rhythm_break_minutes'
const DEFAULT_BREAK = 5

export const getBreakMinutes = (): number => {
  const v = localStorage.getItem(STORAGE_KEY)
  const n = v ? parseInt(v, 10) : DEFAULT_BREAK
  return isNaN(n) || n < 0 ? DEFAULT_BREAK : n
}

export const saveBreakMinutes = (minutes: number) => {
  localStorage.setItem(STORAGE_KEY, String(minutes))
}

export const useBreakMinutes = () => {
  const [breakMinutes, setBreakMinutesState] = useState(getBreakMinutes)

  const setBreakMinutes = (minutes: number) => {
    saveBreakMinutes(minutes)
    setBreakMinutesState(minutes)
  }

  return { breakMinutes, setBreakMinutes }
}
