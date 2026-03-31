import React from 'react'
import type { Task } from '../types'
import { useTaskStore } from '../store/taskStore'
import { toLocalISO } from './timeline/ringUtils'

interface Props {
  task: Task
  onClose: () => void
}

const OverdueModal: React.FC<Props> = ({ task, onClose }) => {
  const { updateTask, tasks } = useTaskStore()

  const handleExtend = async (minutes: number) => {
    // 1. 延长当前任务时长
    await updateTask(task.id, { duration_minutes: task.duration_minutes + minutes })

    // 2. 若是子任务，顺延同父任务的后续兄弟子任务
    if (task.parent_id) {
      const siblings = tasks
        .filter((t) => t.parent_id === task.parent_id)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

      const myIndex = siblings.findIndex((t) => t.id === task.id)
      const later = siblings.slice(myIndex + 1)

      for (const sibling of later) {
        const newStart = toLocalISO(new Date(new Date(sibling.start_time).getTime() + minutes * 60 * 1000))
        await updateTask(sibling.id, { start_time: newStart })
      }

      // 3. 更新父任务时长（最后一个子任务结束时间 - 父任务开始时间）
      const parent = tasks.find((t) => t.id === task.parent_id)
      if (parent) {
        const updatedSiblings = useTaskStore.getState().tasks
          .filter((t) => t.parent_id === task.parent_id)
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        const last = updatedSiblings[updatedSiblings.length - 1]
        if (last) {
          const parentStart = new Date(parent.start_time).getTime()
          const lastEnd = new Date(last.start_time).getTime() + last.duration_minutes * 60 * 1000
          const newParentDuration = Math.ceil((lastEnd - parentStart) / 60000)
          await updateTask(parent.id, { duration_minutes: newParentDuration })
        }
      }
    }

    onClose()
  }

  const handleDone = async () => {
    await updateTask(task.id, { status: 'done' })
    onClose()
  }

  const handleSnooze = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-sm mx-0 sm:mx-4 p-6">
        <div className="text-center mb-5">
          <p className="text-2xl mb-2">🌿</p>
          <h2 className="text-base font-medium text-[#4A4550] mb-1">需要更多时间吗？</h2>
          <p className="text-sm text-[#7A7580]">
            「{task.title}」的预计时间已到，
            <br />没关系，慢慢来。
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleExtend(15)}
              className="flex-1 py-2.5 text-sm rounded-xl border border-[#E2E0DC] text-[#4A4550] hover:bg-[#F5F4F1] transition-colors"
            >
              再给我 15 分钟
            </button>
            <button
              onClick={() => handleExtend(30)}
              className="flex-1 py-2.5 text-sm rounded-xl border border-[#E2E0DC] text-[#4A4550] hover:bg-[#F5F4F1] transition-colors"
            >
              再给我 30 分钟
            </button>
          </div>
          <button
            onClick={handleDone}
            className="w-full py-2.5 text-sm rounded-xl bg-[#A8B5A2] text-white font-medium hover:bg-[#96a390] transition-colors"
          >
            已完成，继续下一个
          </button>
          <button
            onClick={handleSnooze}
            className="w-full py-2 text-xs text-[#B8B6B2] hover:text-[#7A7580] transition-colors"
          >
            稍后提醒
          </button>
        </div>
      </div>
    </div>
  )
}

export default OverdueModal
