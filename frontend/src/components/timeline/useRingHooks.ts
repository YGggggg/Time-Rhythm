import { useEffect, useRef, useState } from 'react'
import { nowMinutes } from './ringUtils'

/** Returns current time in minutes-since-midnight (whole minutes), updated every minute.
 *  Used for task shrink calculation — avoids per-second jitter on segments. */
export const useCurrentTime = () => {
  const [minutes, setMinutes] = useState(() => Math.floor(nowMinutes()))

  useEffect(() => {
    // Align to the next whole minute boundary
    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000
    const timeout = setTimeout(() => {
      setMinutes(Math.floor(nowMinutes()))
      const id = setInterval(() => setMinutes(Math.floor(nowMinutes())), 60000)
      return () => clearInterval(id)
    }, msUntilNextMinute)
    return () => clearTimeout(timeout)
  }, [])

  return minutes
}

/** Returns current time in minutes-since-midnight with sub-minute precision, updated every second.
 *  Used only for the time cursor needle. */
export const useCurrentTimeSmooth = () => {
  const [minutes, setMinutes] = useState(nowMinutes)

  useEffect(() => {
    const id = setInterval(() => setMinutes(nowMinutes()), 1000)
    return () => clearInterval(id)
  }, [])

  return minutes
}

/** Drag hook: returns current pointer angle relative to SVG center */
export const useRingDrag = (
  svgRef: React.RefObject<SVGSVGElement | null>,
  onDragEnd: (startAngle: number, endAngle: number, taskId: string) => void
) => {
  const dragging = useRef<{ taskId: string; startAngle: number; type: 'move' | 'resize' } | null>(null)
  const [dragAngle, setDragAngle] = useState<number | null>(null)

  const getAngle = (e: PointerEvent): number => {
    const svg = svgRef.current
    if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    if (angle < 0) angle += 360
    return angle
  }

  const startDrag = (taskId: string, type: 'move' | 'resize', e: React.PointerEvent) => {
    const angle = getAngle(e.nativeEvent)
    dragging.current = { taskId, startAngle: angle, type }
    setDragAngle(angle)
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      setDragAngle(getAngle(e))
    }
    const onUp = (e: PointerEvent) => {
      if (!dragging.current) return
      onDragEnd(dragging.current.startAngle, getAngle(e), dragging.current.taskId)
      dragging.current = null
      setDragAngle(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [onDragEnd])

  return { startDrag, dragAngle }
}
