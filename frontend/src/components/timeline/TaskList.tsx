import React, { useState } from 'react'
import type { Task, TaskUpdate } from '../../types'
import { datetimeToMinutes, isNextDay } from '../timeline/ringUtils'
import DecomposeModal from '../DecomposeModal'

interface Props {
  tasks: Task[]
  onUpdate: (id: string, data: TaskUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const statusLabel: Record<string, string> = {
  pending: '待开始',
  active: '进行中',
  done: '已完成',
}

const TaskList: React.FC<Props> = ({ tasks, onUpdate, onDelete }) => {
  const [decomposingTask, setDecomposingTask] = useState<Task | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-[#7A7580] text-sm">
        今天还没有任务，添加一个吧
      </div>
    )
  }

  const topLevel = [...tasks]
    .filter((t) => t.parent_id === null || t.parent_id === undefined)
    .sort((a, b) => datetimeToMinutes(a.start_time) - datetimeToMinutes(b.start_time))

  const childrenOf = (parentId: string) =>
    [...tasks]
      .filter((t) => t.parent_id === parentId)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const renderTask = (task: Task, isChild = false, parent?: Task) => {
    const children = childrenOf(task.id)
    const hasChildren = children.length > 0
    const isCollapsed = collapsed.has(task.id)
    const showNextDay = isChild && parent != null && isNextDay(parent.start_time, task.start_time)

    return (
      <li key={task.id}>
        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
            isChild
              ? 'ml-6 bg-[#FAFAF8] border-[#E2E0DC]'
              : 'bg-white border-[#E2E0DC]'
          }`}
          style={isChild ? { borderLeftWidth: 3, borderLeftColor: task.color } : {}}
        >
          {isChild && (
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-60" style={{ backgroundColor: task.color }} />
          )}
          {!isChild && (
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: task.color }} />
          )}
          <div className="flex-1 min-w-0">
            <p className={`truncate ${
              task.status === 'done'
                ? 'line-through text-[#7A7580]'
                : isChild
                ? 'text-xs text-[#6A6070]'
                : 'text-sm text-[#4A4550]'
            }`}>
              {task.title}
              {showNextDay && (
                <span className="ml-1 text-[10px] font-medium text-[#9BAFC4] align-middle">+1</span>
              )}
            </p>
            <p className="text-xs text-[#9A9AA0] mt-0.5">
              {new Date(task.start_time).toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' })}
              {' · '}{task.duration_minutes}分钟
              {' · '}{'⚡'.repeat(task.energy_level)}
            </p>
          </div>
          {!isChild && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F4F1] text-[#7A7580]">
              {statusLabel[task.status]}
            </span>
          )}
          {hasChildren && (
            <button
              onClick={() => toggleCollapse(task.id)}
              className="text-xs text-[#A8B0B5] hover:text-[#4A4550] transition-colors w-4 text-center"
              title={isCollapsed ? '展开' : '折叠'}
            >
              {isCollapsed ? '▶' : '▼'}
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={() => onUpdate(task.id, { status: 'done' })}
              className="text-xs text-[#A8B5A2] hover:text-[#7a9175] transition-colors"
              title="标记完成"
            >
              ✓
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="text-xs text-[#C4A59D] hover:text-[#a0847d] transition-colors"
            title="删除"
          >
            ✕
          </button>
          {!isChild && (
            <button
              onClick={() => setDecomposingTask(task)}
              className="text-xs text-[#A8B0B5] hover:text-[#7a9aab] transition-colors"
              title="AI 拆解"
            >
              ✨
            </button>
          )}
        </div>
        {hasChildren && !isCollapsed && (
          <div className="relative ml-6 mt-1 mb-1">
            <div
              className="absolute left-0 top-0 bottom-0 w-px"
              style={{ backgroundColor: task.color, opacity: 0.35 }}
            />
            <ul className="space-y-1 pl-0">
              {children.map((child) => renderTask(child, true, task))}
            </ul>
          </div>
        )}
      </li>
    )
  }

  return (
    <ul className="space-y-2">
      {decomposingTask && (
        <DecomposeModal task={decomposingTask} onClose={() => setDecomposingTask(null)} />
      )}
      {topLevel.map((task) => renderTask(task))}
    </ul>
  )
}

export default TaskList
