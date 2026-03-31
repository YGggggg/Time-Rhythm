import React, { useState } from 'react'
import type { TaskCreate, SubTaskSuggestion } from '../types'
import { taskApi } from '../api/tasks'
import { useTaskStore } from '../store/taskStore'
import { useBreakMinutes } from '../hooks/useBreakMinutes'
import { useSleepTime, isInSleepWindow, skipSleepWindow } from '../hooks/useSleepTime'
import { toLocalISO, datetimeToDate } from './timeline/ringUtils'

const COLORS = [
  { hex: '#A8B5A2', name: '鼠尾草绿' },
  { hex: '#C4A59D', name: '玫瑰棕' },
  { hex: '#9BAFC4', name: '雾霾蓝' },
  { hex: '#B5A8C4', name: '薰衣草紫' },
  { hex: '#C4B89D', name: '燕麦沙' },
  { hex: '#9DC4C0', name: '薄荷青' },
]

interface Props {
  selectedDate: string
  onSubmit: (data: TaskCreate) => Promise<void>
}

const TaskForm: React.FC<Props> = ({ selectedDate, onSubmit }) => {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState(30)
  const [color, setColor] = useState(COLORS[0].hex)
  const [energyLevel, setEnergyLevel] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiMode, setAiMode] = useState(false)
  const [confirmNextDay, setConfirmNextDay] = useState(false)
  const [previewSubtasks, setPreviewSubtasks] = useState<SubTaskSuggestion[] | null>(null)
  const [editableDurations, setEditableDurations] = useState<number[]>([])
  const [pendingStartTime, setPendingStartTime] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const { createTask, fetchTasks } = useTaskStore()
  const { breakMinutes, setBreakMinutes } = useBreakMinutes()
  const { sleepStart, sleepEnd } = useSleepTime()

  const calcCandidateDate = (nextDay: boolean) => {
    if (!nextDay) return selectedDate
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setError(null)

    const candidateDate = calcCandidateDate(confirmNextDay)
    const start_time = `${candidateDate}T${startTime}:00`

    if (!confirmNextDay && new Date(start_time) < new Date()) {
      setConfirmNextDay(true)
      return
    }
    setConfirmNextDay(false)

    if (!aiMode) {
      if (isInSleepWindow(new Date(start_time), sleepStart, sleepEnd)) {
        setError('该时间在睡眠时段内，建议修改')
        return
      }
      setLoading(true)
      try {
        await onSubmit({ title: title.trim(), start_time, duration_minutes: duration, color, energy_level: energyLevel })
        setTitle('')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '操作失败')
      } finally {
        setLoading(false)
      }
      return
    }

    // AI 模式：先获取预览，不直接创建
    setLoading(true)
    try {
      // 临时创建父任务用于拆解
      const parentRes = await taskApi.create({
        title: title.trim(),
        start_time,
        duration_minutes: 60,
        color,
        energy_level: 3,
      })
      if (!parentRes.success || !parentRes.data) throw new Error(parentRes.error ?? '创建任务失败')
      const parentTask = parentRes.data

      const decomposeRes = await taskApi.decompose(parentTask.id, { max_subtasks: 5 })
      if (!decomposeRes.success || !decomposeRes.data) {
        await taskApi.remove(parentTask.id)
        throw new Error(decomposeRes.error ?? 'AI 拆解失败')
      }

      // 删除临时父任务，等用户确认后再正式创建
      await taskApi.remove(parentTask.id)
      await fetchTasks(candidateDate)

      const subtasks = decomposeRes.data.subtasks
      setPendingStartTime(start_time)
      setPreviewSubtasks(subtasks)
      setEditableDurations(subtasks.map((s) => s.duration_minutes))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (!pendingStartTime) return
    setLoading(true)
    setError(null)
    try {
      const parentRes = await taskApi.create({
        title: title.trim(),
        start_time: pendingStartTime,
        duration_minutes: 60,
        color,
        energy_level: 3,
      })
      if (!parentRes.success || !parentRes.data) throw new Error(parentRes.error ?? '创建任务失败')
      const parentTask = parentRes.data

      const decomposeRes = await taskApi.decompose(parentTask.id, { max_subtasks: 5 })
      await taskApi.remove(parentTask.id)
      const candidateDate = calcCandidateDate(false)
      await fetchTasks(candidateDate)

      if (!decomposeRes.success || !decomposeRes.data) throw new Error(decomposeRes.error ?? 'AI 拆解失败')
      const subtasks = decomposeRes.data.subtasks
      setPreviewSubtasks(subtasks)
      setEditableDurations(subtasks.map((s) => s.duration_minutes))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDecompose = async () => {
    if (!previewSubtasks || !pendingStartTime) return
    setConfirming(true)
    setError(null)
    try {
      const candidateDate = pendingStartTime.slice(0, 10)
      const parentRes = await taskApi.create({
        title: title.trim(),
        start_time: pendingStartTime,
        duration_minutes: 60,
        color,
        energy_level: 3,
      })
      if (!parentRes.success || !parentRes.data) throw new Error(parentRes.error ?? '创建任务失败')
      const parentTask = parentRes.data

      let cursor = new Date(pendingStartTime)
      cursor = skipSleepWindow(cursor, sleepStart, sleepEnd)
      for (let i = 0; i < previewSubtasks.length; i++) {
        const s = previewSubtasks[i]
        const dur = editableDurations[i] ?? s.duration_minutes
        await createTask({
          title: s.title,
          start_time: toLocalISO(cursor),
          duration_minutes: dur,
          color: s.color,
          energy_level: s.energy_level,
          parent_id: parentTask.id,
        })
        cursor = new Date(cursor.getTime() + dur * 60 * 1000)
        if (breakMinutes > 0 && i < previewSubtasks.length - 1) {
          await createTask({
            title: '休息',
            start_time: toLocalISO(cursor),
            duration_minutes: breakMinutes,
            color: '#D8D6D2',
            energy_level: 1,
            parent_id: parentTask.id,
          })
          cursor = new Date(cursor.getTime() + breakMinutes * 60 * 1000)
          cursor = skipSleepWindow(cursor, sleepStart, sleepEnd)
        }
      }
      const totalDuration = Math.ceil((cursor.getTime() - new Date(pendingStartTime).getTime()) / 60000)
      await taskApi.update(parentTask.id, { duration_minutes: totalDuration })

      await fetchTasks(candidateDate)
      setTitle('')
      setPreviewSubtasks(null)
      setEditableDurations([])
      setPendingStartTime(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '创建任务失败')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-white rounded-2xl shadow-sm border border-[#E2E0DC]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#4A4550]">添加任务</h3>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <span className="text-xs text-[#7A7580]">AI 拆解</span>
          <div
            onClick={() => setAiMode((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              aiMode ? 'bg-[#A8B5A2]' : 'bg-[#D8D6D2]'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                aiMode ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </div>
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {confirmNextDay && (
        <div className="rounded-xl bg-[#FFF8F0] border border-[#F0DCC8] p-3 text-xs text-[#7A7580]">
          <p className="mb-2">该时间已过去，是否安排到明天 {startTime}？</p>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-1.5 rounded-lg bg-[#A8B5A2] text-white hover:bg-[#96a390] transition-colors"
            >
              安排到明天
            </button>
            <button
              type="button"
              onClick={() => setConfirmNextDay(false)}
              className="flex-1 py-1.5 rounded-lg border border-[#E2E0DC] text-[#4A4550] hover:bg-[#F5F4F1] transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div>
        <input
          type="text"
          placeholder={aiMode ? '任务内容（AI 将自动拆解）' : '任务名称'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-xl border border-[#E2E0DC] outline-none focus:border-[#A8B5A2] text-[#4A4550] placeholder:text-[#C4C2BE]"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-[#7A7580] block mb-1">开始时间</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-xl border border-[#E2E0DC] outline-none focus:border-[#A8B5A2] text-[#4A4550]"
          />
        </div>
        {!aiMode && (
          <div>
            <label className="text-xs text-[#7A7580] block mb-1">时长（分钟）</label>
            <input
              type="number"
              min={5}
              max={480}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-[#E2E0DC] outline-none focus:border-[#A8B5A2] text-[#4A4550]"
            />
          </div>
        )}
        {aiMode && (
          <div>
            <label className="text-xs text-[#7A7580] block mb-1">休息间隔（分钟）</label>
            <input
              type="number"
              min={0}
              max={30}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-sm px-3 py-2 rounded-xl border border-[#E2E0DC] outline-none focus:border-[#A8B5A2] text-[#4A4550]"
            />
          </div>
        )}
      </div>

      <div>
        <label className="text-xs text-[#7A7580] block mb-1">颜色</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.name}
              onClick={() => setColor(c.hex)}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c.hex,
                borderColor: color === c.hex ? '#4A4550' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      {!aiMode && (
      <div>
        <label className="text-xs text-[#7A7580] block mb-1">能量消耗 {energyLevel}/5</label>
        <input
          type="range"
          min={1}
          max={5}
          value={energyLevel}
          onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
          className="w-full accent-[#A8B5A2]"
        />
      </div>
      )}

      {aiMode && !previewSubtasks && (
        <p className="text-xs text-[#A8B5A2]">✨ AI 将自动拆解任务并插入休息时间块</p>
      )}

      {/* AI 预览区 */}
      {aiMode && previewSubtasks && pendingStartTime && (
        <div className="space-y-2">
          <p className="text-xs text-[#7A7580] font-medium">拆解预览</p>
          <ul className="space-y-1.5">
            {(() => {
              const starts: Date[] = []
              let cur = skipSleepWindow(new Date(pendingStartTime), sleepStart, sleepEnd)
              for (let i = 0; i < previewSubtasks.length; i++) {
                starts.push(new Date(cur))
                cur = new Date(cur.getTime() + (editableDurations[i] ?? previewSubtasks[i].duration_minutes) * 60 * 1000)
                if (breakMinutes > 0 && i < previewSubtasks.length - 1) {
                  cur = new Date(cur.getTime() + breakMinutes * 60 * 1000)
                  cur = skipSleepWindow(cur, sleepStart, sleepEnd)
                }
              }
              return previewSubtasks.map((s, i) => (
                <li key={i}>
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E2E0DC]"
                    style={{ borderLeftWidth: 3, borderLeftColor: s.color }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#4A4550] truncate">
                        {s.title}
                        {starts[i] && datetimeToDate(toLocalISO(starts[i])) > pendingStartTime.slice(0, 10) && (
                          <span className="ml-1 text-[10px] font-medium text-[#9BAFC4] align-middle">+1</span>
                        )}
                      </p>
                      <p className="text-xs text-[#7A7580]">
                        {starts[i] && starts[i].toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}能量 {s.energy_level}/5
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
                          setEditableDurations((prev) => { const next = [...prev]; next[i] = v; return next })
                        }}
                        className="w-14 text-sm px-2 py-1 rounded-lg border border-[#E2E0DC] outline-none text-center text-[#4A4550]"
                      />
                      <span className="text-xs text-[#7A7580]">min</span>
                    </div>
                  </div>
                  {breakMinutes > 0 && i < previewSubtasks.length - 1 && (
                    <div className="ml-3 mt-0.5 mb-0.5 text-xs text-[#B8B6B2]">💤 休息 {breakMinutes} 分钟</div>
                  )}
                </li>
              ))
            })()}
          </ul>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={loading || confirming}
              className="flex-1 py-2 text-sm rounded-xl border border-[#E2E0DC] text-[#7A7580] hover:bg-[#F5F4F1] transition-colors disabled:opacity-50"
            >
              {loading ? '生成中...' : '重新生成'}
            </button>
            <button
              type="button"
              onClick={handleConfirmDecompose}
              disabled={confirming || loading}
              className="flex-1 py-2 text-sm rounded-xl bg-[#A8B5A2] text-white font-medium hover:bg-[#96a390] transition-colors disabled:opacity-50"
            >
              {confirming ? '创建中...' : '确认拆解'}
            </button>
          </div>
        </div>
      )}

      {(!aiMode || !previewSubtasks) && (
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="w-full py-2 text-sm rounded-xl bg-[#A8B5A2] text-white font-medium disabled:opacity-50 hover:bg-[#96a390] transition-colors"
      >
        {loading ? (aiMode ? 'AI 拆解中...' : '添加中...') : (aiMode ? '✨ AI 拆解' : '添加到时律')}
      </button>
      )}
    </form>
  )
}

export default TaskForm
