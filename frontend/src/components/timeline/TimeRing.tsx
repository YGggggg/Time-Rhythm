import React, { useRef, useCallback } from 'react'
import type { Task, TaskUpdate } from '../../types'
import RingSegment from './RingSegment'
import CurrentTimeCursor from './CurrentTimeCursor'
import { useCurrentTime, useCurrentTimeSmooth, useRingDrag } from './useRingHooks'
import { datetimeToMinutes, degToMinutes, minutesToAngle, toLocalISO } from './ringUtils'

const SIZE = 400
const CX = SIZE / 2
const CY = SIZE / 2
const RADIUS = 160
const THICKNESS = 36

// Hour tick marks
const HOUR_TICKS = Array.from({ length: 24 }, (_, i) => i)

interface Props {
  tasks: Task[]
  onUpdateTask: (id: string, data: TaskUpdate) => Promise<void>
}

const TimeRing: React.FC<Props> = ({ tasks, onUpdateTask }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const currentMinutes = useCurrentTime()       // whole minutes, for task shrink
  const smoothMinutes = useCurrentTimeSmooth()  // sub-minute, for cursor needle

  const handleDragEnd = useCallback(
    (startAngle: number, endAngle: number, taskId: string) => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return
      const deltaDeg = endAngle - startAngle
      const deltaMinutes = Math.round(degToMinutes(deltaDeg))
      if (Math.abs(deltaMinutes) < 1) return

      const oldStart = new Date(task.start_time)
      oldStart.setMinutes(oldStart.getMinutes() + deltaMinutes)
      onUpdateTask(taskId, { start_time: toLocalISO(oldStart) })
    },
    [tasks, onUpdateTask]
  )

  const { startDrag } = useRingDrag(svgRef, handleDragEnd)

  const isActive = (task: Task): boolean => {
    const startMin = datetimeToMinutes(task.start_time)
    const endMin = startMin + task.duration_minutes
    return task.status !== 'done' && currentMinutes >= startMin && currentMinutes < endMin
  }

  const elapsedForTask = (task: Task): number => {
    const startMin = datetimeToMinutes(task.start_time)
    return Math.max(0, currentMinutes - startMin)
  }

  return (
    <div className="flex items-center justify-center">
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ userSelect: 'none' }}
      >
        {/* Background ring */}
        <circle
          cx={CX} cy={CY}
          r={RADIUS - THICKNESS / 2}
          fill="none"
          stroke="#E2E0DC"
          strokeWidth={THICKNESS}
        />

        {/* Hour tick marks */}
        {HOUR_TICKS.map((h) => {
          const angle = minutesToAngle(h * 60)
          const isMajor = h % 6 === 0
          const innerR = RADIUS - THICKNESS - (isMajor ? 16 : 8)
          const outerR = RADIUS - THICKNESS - 1
          const rad = ((angle - 90) * Math.PI) / 180
          return (
            <line
              key={h}
              x1={CX + innerR * Math.cos(rad)}
              y1={CY + innerR * Math.sin(rad)}
              x2={CX + outerR * Math.cos(rad)}
              y2={CY + outerR * Math.sin(rad)}
              stroke="#C4C2BE"
              strokeWidth={isMajor ? 2 : 1}
            />
          )
        })}

        {/* Hour labels (0, 6, 12, 18) */}
        {[0, 6, 12, 18].map((h) => {
          const angle = minutesToAngle(h * 60)
          const rad = ((angle - 90) * Math.PI) / 180
          const labelR = RADIUS - THICKNESS - 30
          return (
            <text
              key={h}
              x={CX + labelR * Math.cos(rad)}
              y={CY + labelR * Math.sin(rad)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill="#7A7580"
            >
              {h === 0 ? '0' : h}
            </text>
          )
        })}

        {/* Task segments: 父任务渲染边框弧，子任务/普通任务渲染实心色块 */}
        {(() => {
          const parentIds = new Set(tasks.filter((t) => t.parent_id).map((t) => t.parent_id!))
          // 先渲染父任务边框（在下层）
          const outlineTasks = tasks.filter((t) => parentIds.has(t.id))
          // 再渲染叶子任务实心色块（在上层）
          const leafTasks = tasks.filter((t) => !parentIds.has(t.id))
          return (
            <>
              {outlineTasks.map((task) => (
                <RingSegment
                  key={task.id}
                  cx={CX}
                  cy={CY}
                  radius={RADIUS}
                  thickness={THICKNESS}
                  task={task}
                  isActive={false}
                  elapsedMinutes={0}
                  onPointerDown={() => {}}
                  outline
                />
              ))}
              {leafTasks.map((task) => (
                <RingSegment
                  key={task.id}
                  cx={CX}
                  cy={CY}
                  radius={RADIUS}
                  thickness={THICKNESS}
                  task={task}
                  isActive={isActive(task)}
                  elapsedMinutes={elapsedForTask(task)}
                  onPointerDown={(e) => startDrag(task.id, 'move', e)}
                />
              ))}
            </>
          )
        })()}

        {/* Current time cursor */}
        <CurrentTimeCursor
          cx={CX}
          cy={CY}
          radius={RADIUS}
          currentMinutes={smoothMinutes}
        />

        {/* Center time display */}
        <text
          x={CX}
          y={CY - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={22}
          fontWeight={500}
          fill="#4A4550"
        >
          {String(Math.floor(smoothMinutes / 60)).padStart(2, '0')}:{String(Math.floor(smoothMinutes % 60)).padStart(2, '0')}
        </text>
        <text
          x={CX}
          y={CY + 18}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fill="#7A7580"
        >
          今日时律
        </text>
      </svg>
    </div>
  )
}

export default TimeRing
