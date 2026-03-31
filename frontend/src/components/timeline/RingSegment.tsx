import React from 'react'
import { arcPath, minutesToAngle, datetimeToMinutes } from './ringUtils'
import type { Task } from '../../types'

interface Props {
  cx: number
  cy: number
  radius: number
  thickness: number
  task: Task
  isActive: boolean
  elapsedMinutes: number
  onPointerDown: (e: React.PointerEvent) => void
  outline?: boolean  // true = 父任务边框模式
}

/** Darken a hex color by mixing with black at the given ratio (0=no change, 1=black) */
const darkenHex = (hex: string, ratio: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const dr = Math.round(r * (1 - ratio))
  const dg = Math.round(g * (1 - ratio))
  const db = Math.round(b * (1 - ratio))
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`
}

const RingSegment: React.FC<Props> = ({
  cx, cy, radius, thickness, task, isActive, elapsedMinutes, onPointerDown, outline = false
}) => {
  const startMin = datetimeToMinutes(task.start_time)
  const visibleStart = isActive ? startMin + Math.floor(elapsedMinutes) : startMin
  const endMin = startMin + task.duration_minutes

  if (visibleStart >= endMin) return null

  const startAngle = minutesToAngle(outline ? startMin : visibleStart)
  const endAngle = minutesToAngle(endMin)

  const d = arcPath(cx, cy, radius, startAngle, endAngle, thickness)

  if (outline) {
    // 父任务：只渲染边框弧，不填充
    return (
      <path
        d={d}
        fill="none"
        stroke={darkenHex(task.color, 0.4)}
        strokeWidth={4}
        opacity={1}
        style={{ cursor: 'default', pointerEvents: 'none' }}
      >
        <title>{task.title}</title>
      </path>
    )
  }

  return (
    <path
      d={d}
      fill={task.color}
      opacity={task.status === 'done' ? 0.4 : 1}
      stroke={isActive ? '#fff' : 'none'}
      strokeWidth={isActive ? 1.5 : 0}
      style={{ cursor: 'grab', willChange: 'transform' }}
      onPointerDown={onPointerDown}
    >
      <title>{task.title}</title>
    </path>
  )
}

export default React.memo(RingSegment)
