import React, { useState } from 'react'
import type { Task, SubTaskSuggestion } from '../types'
import { taskApi } from '../api/tasks'
import { useTaskStore } from '../store/taskStore'
import { useBreakMinutes } from '../hooks/useBreakMinutes'
import { useSleepTime, isInSleepWindow, skipSleepWindow } from '../hooks/useSleepTime'
import { toLocalISO, datetimeToDate } from './timeline/ringUtils'

interface Props {
  task: Task
  onClose: () => void
}

const DecomposeModal: React.FC<Props> = ({ task, onClose }) => {
  const [hint, setHint] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [subtasks, setSubtasks] = useState<SubTaskSuggestion[] | null>(null)
  const [editableDurations, setEditableDurations] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const { createTask, removeTask, fetchTasks, currentDate } = useTaskStore()
  const { breakMinutes, setBreakMinutes } = useBreakMinutes()
  const { sleepStart, sleepEnd } = useSleepTime()

  const runDecompose = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await taskApi.decompose(task.id, { hint: hint.trim() || undefined })
      if (res.success && res.data) {
        setSubtasks(res.data.subtasks)
        setEditableDurations(res.data.subtasks.map((s) => s.duration_minutes))
      } else {
        setError(res.error ?? '拆解失败，请重试')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = () => {
    setSubtasks(null)
    setEditableDurations([])
    runDecompose()
  }

  const handleConfirm = async () => {
    if (!subtasks) return
    setConfirming(true)
    setError(null)
    try {
      // B1: 先删除旧子任务
      const oldChildren = useTaskStore.getState().tasks.filter((t) => t.parent_id === task.id)
      await Promise.all(oldChildren.map((t) => removeTask(t.id)))

      // 创建子任务，间隔插入休息块，跳过睡眠窗口
      let cursor = new Date(task.start_time)
      cursor = skipSleepWindow(cursor, sleepStart, sleepEnd)
      for (let i = 0; i < subtasks.length; i++) {
        const s = subtasks[i]
        const duration = editableDurations[i] ?? s.duration_minutes
        await createTask({
          title: s.title,
          start_time: toLocalISO(cursor),
          duration_minutes: duration,
          color: s.color,
          energy_level: s.energy_level,
          parent_id: task.id,
        })
        cursor = new Date(cursor.getTime() + duration * 60 * 1000)

        if (breakMinutes > 0 && i < subtasks.length - 1) {
          await createTask({
            title: '休息',
            start_time: toLocalISO(cursor),
            duration_minutes: breakMinutes,
            color: '#D8D6D2',
            energy_level: 1,
            parent_id: task.id,
          })
          cursor = new Date(cursor.getTime() + breakMinutes * 60 * 1000)
          cursor = skipSleepWindow(cursor, sleepStart, sleepEnd)
        }
      }

      // 父任务时长 = 最后子任务结束 - 父任务开始
      const parentStart = new Date(task.start_time)
      const totalDuration = Math.ceil((cursor.getTime() - parentStart.getTime()) / 60000)
      await taskApi.update(task.id, { duration_minutes: totalDuration })

      await fetchTasks(currentDate)
      onClose()
    } catch {
      setError('创建任务失败，请重试')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-[#4A4550]">AI 任务拆解</h2>
          <button onClick={onClose} className="text-[#7A7580] hover:text-[#4A4550] text-lg leading-none">✕</button>
        </div>

        <div className="mb-4 px-3 py-2 rounded-lg bg-[#F5F4F1]">
          <p className="text-sm font-medium text-[#4A4550]">{task.title}</p>
          <p className="text-xs text-[#7A7580]">{task.duration_minutes} 分钟</p>
        </div>

        {!subtasks ? (
          <>
            <textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="补充说明（可选）：如具体要求、已有进展..."
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-xl border border-[#E2E0DC] outline-none resize-none focus:border-[#A8B5A2] text-[#4A4550] placeholder:text-[#C4C2BE]"
            />
            <div className="flex items-center gap-2 mt-3">
              <label className="text-xs text-[#7A7580] whitespace-nowrap">休息间隔</label>
              <input
                type="number"
                min={0}
                max={30}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 text-sm px-2 py-1 rounded-lg border border-[#E2E0DC] outline-none text-center text-[#4A4550]"
              />
              <span className="text-xs text-[#7A7580]">分钟</span>
            </div>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            <button
              onClick={runDecompose}
              disabled={loading}
              className="mt-4 w-full py-2 text-sm rounded-xl bg-[#A8B5A2] text-white font-medium disabled:opacity-50 hover:bg-[#96a390] transition-colors"
            >
              {loading ? '拆解中...' : '✨ 开始拆解'}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs text-[#7A7580] whitespace-nowrap">休息间隔</label>
              <input
                type="number"
                min={0}
                max={30}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 text-sm px-2 py-1 rounded-lg border border-[#E2E0DC] outline-none text-center text-[#4A4550]"
              />
              <span className="text-xs text-[#7A7580]">分钟</span>
            </div>
            <ul className="space-y-2 mb-4">
              {(() => {
                // 实时计算每个子任务的预计开始时间（考虑睡眠跳跃）
                const starts: Date[] = []
                let cur = skipSleepWindow(new Date(task.start_time), sleepStart, sleepEnd)
                for (let i = 0; i < subtasks.length; i++) {
                  starts.push(new Date(cur))
                  cur = new Date(cur.getTime() + (editableDurations[i] ?? subtasks[i].duration_minutes) * 60 * 1000)
                  if (breakMinutes > 0 && i < subtasks.length - 1) {
                    cur = new Date(cur.getTime() + breakMinutes * 60 * 1000)
                    cur = skipSleepWindow(cur, sleepStart, sleepEnd)
                  }
                }
                return subtasks.map((s, i) => (
                  <li key={i}>
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E2E0DC]"
                      style={{ borderLeftWidth: 3, borderLeftColor: s.color }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#4A4550] truncate">
                          {s.title}
                          {starts[i] && datetimeToDate(starts[i].toISOString()) > datetimeToDate(task.start_time) && (
                            <span className="ml-1 text-[10px] font-medium text-[#9BAFC4] align-middle">+1</span>
                          )}
                        </p>
                        <p className="text-xs text-[#7A7580]">
                          {starts[i] && starts[i].toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' })}
                          {' · '}能量 {s.energy_level}/5
                          {starts[i] && isInSleepWindow(starts[i], sleepStart, sleepEnd) && (
                            <span className="ml-2 text-[#B5A8C4]">🌙 已自动跳过睡眠时段</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <input
                          type="number"
                          min={5}
                          max={480}
                          value={editableDurations[i] ?? s.duration_minutes}
                          onChange={(e) => {
                            const v = Math.max(5, parseInt(e.target.value) || 5)
                            setEditableDurations((prev) => {
                              const next = [...prev]
                              next[i] = v
                              return next
                            })
                          }}
                          className="w-14 text-sm px-2 py-1 rounded-lg border border-[#E2E0DC] outline-none text-center text-[#4A4550]"
                        />
                        <span className="text-xs text-[#7A7580]">min</span>
                      </div>
                    </div>
                    {breakMinutes > 0 && i < subtasks.length - 1 && (
                      <div className="ml-3 mt-1 mb-1 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#D8D6D2]" />
                        <span className="text-xs text-[#B8B6B2]">休息 {breakMinutes} 分钟</span>
                      </div>
                    )}
                  </li>
                ))
              })()}
            </ul>
            <p className="text-xs text-[#7A7580] mb-3">
              总时长：{editableDurations.reduce((s, d) => s + d, 0) + breakMinutes * (subtasks.length - 1)} 分钟
              （含 {breakMinutes * (subtasks.length - 1)} 分钟休息）
            </p>
            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={loading || confirming}
                className="flex-1 py-2 text-sm rounded-xl border border-[#E2E0DC] text-[#7A7580] hover:bg-[#F5F4F1] transition-colors disabled:opacity-50"
              >
                {loading ? '生成中...' : '重新生成'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || loading}
                className="flex-1 py-2 text-sm rounded-xl bg-[#A8B5A2] text-white font-medium hover:bg-[#96a390] transition-colors disabled:opacity-50"
              >
                {confirming ? '创建中...' : '确认拆解'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DecomposeModal
