import React, { useEffect, useRef, useState } from 'react'
import { useTaskStore } from '../store/taskStore'
import TimeRing from '../components/timeline/TimeRing'
import TaskForm from '../components/TaskForm'
import TaskList from '../components/timeline/TaskList'
import OverdueModal from '../components/OverdueModal'
import type { Task, TaskUpdate } from '../types'
import { useBreakMinutes } from '../hooks/useBreakMinutes'
import { useSleepTime } from '../hooks/useSleepTime'

const HomePage: React.FC = () => {
  const { tasks, currentDate, isLoading, setDate, fetchTasks, updateTask, removeTask, createTask } = useTaskStore()
  const [selectedDate, setSelectedDate] = useState(currentDate)
  const [overdueTask, setOverdueTask] = useState<Task | null>(null)
  const snoozedIds = useRef<Set<string>>(new Set())
  const { breakMinutes, setBreakMinutes } = useBreakMinutes()
  const { sleepStart, sleepEnd, setSleepTime } = useSleepTime()

  useEffect(() => {
    fetchTasks(selectedDate)
  }, [])

  useEffect(() => {
    setDate(selectedDate)
  }, [selectedDate])

  // 超时检测：每分钟检查一次有无 pending/active 任务超时
  useEffect(() => {
    const check = () => {
      if (overdueTask) return // 已有弹窗，不再叠加
      const now = new Date()
      const nowMs = now.getTime()
      const pad = (n: number) => String(n).padStart(2, '0')
      const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
      if (selectedDate !== today) return

      const overdue = tasks.find((t) => {
        if (t.status === 'done') return false
        if (snoozedIds.current.has(t.id)) return false
        const start = new Date(t.start_time)
        const sd = start
        const taskDate = `${sd.getFullYear()}-${pad(sd.getMonth() + 1)}-${pad(sd.getDate())}`
        // 跨午夜子任务属于明天，今天不检测
        if (taskDate !== today) return false
        const endMs = start.getTime() + t.duration_minutes * 60 * 1000
        return nowMs >= endMs
      })
      if (overdue) setOverdueTask(overdue)
    }

    check()
    const id = setInterval(check, 60000)
    return () => clearInterval(id)
  }, [tasks, selectedDate, overdueTask])

  const handleUpdate = async (id: string, data: TaskUpdate) => {
    await updateTask(id, data)
  }

  return (
    <div className="min-h-screen bg-[#F5F4F1] p-4">
      {overdueTask && (
        <OverdueModal
          task={overdueTask}
          onClose={() => {
            snoozedIds.current.add(overdueTask.id)
            setOverdueTask(null)
          }}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-[#4A4550]">时律</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#7A7580]">休息间隔</span>
              <input
                type="number"
                min={0}
                max={30}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 text-sm px-2 py-1 rounded-lg border border-[#E2E0DC] bg-white outline-none text-center text-[#4A4550]"
              />
              <span className="text-xs text-[#7A7580]">分钟</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#7A7580]">睡眠</span>
              <input
                type="time"
                value={sleepStart}
                onChange={(e) => setSleepTime({ start: e.target.value, end: sleepEnd })}
                className="text-sm px-2 py-1 rounded-lg border border-[#E2E0DC] bg-white outline-none text-[#4A4550]"
              />
              <span className="text-xs text-[#7A7580]">至</span>
              <input
                type="time"
                value={sleepEnd}
                onChange={(e) => setSleepTime({ start: sleepStart, end: e.target.value })}
                className="text-sm px-2 py-1 rounded-lg border border-[#E2E0DC] bg-white outline-none text-[#4A4550]"
              />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-[#E2E0DC] bg-white outline-none text-[#4A4550]"
            />
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-4 text-sm text-[#7A7580]">加载中...</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col items-center">
            <TimeRing tasks={tasks} onUpdateTask={handleUpdate} />
          </div>

          <div className="space-y-4">
            <TaskForm selectedDate={selectedDate} onSubmit={createTask} />
            <TaskList tasks={tasks} onUpdate={handleUpdate} onDelete={removeTask} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
