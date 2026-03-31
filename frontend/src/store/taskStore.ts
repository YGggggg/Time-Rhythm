import { create } from 'zustand'
import type { Task, TaskCreate, TaskUpdate } from '../types'
import { taskApi } from '../api/tasks'

interface TaskState {
  tasks: Task[]
  currentDate: string
  isLoading: boolean
  setDate: (date: string) => void
  fetchTasks: (date: string) => Promise<void>
  createTask: (data: TaskCreate) => Promise<void>
  updateTask: (id: string, data: TaskUpdate) => Promise<void>
  removeTask: (id: string) => Promise<void>
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentDate: todayISO(),
  isLoading: false,

  setDate: (date) => {
    set({ currentDate: date })
    get().fetchTasks(date)
  },

  fetchTasks: async (date) => {
    set({ isLoading: true })
    try {
      const res = await taskApi.list(date)
      if (res.success && res.data) set({ tasks: res.data })
    } finally {
      set({ isLoading: false })
    }
  },

  createTask: async (data) => {
    const res = await taskApi.create(data)
    if (!res.success || !res.data) throw new Error(res.error ?? 'Create failed')
    set((state) => ({ tasks: [...state.tasks, res.data!].sort((a, b) => a.order_index - b.order_index) }))
  },

  updateTask: async (id, data) => {
    const res = await taskApi.update(id, data)
    if (!res.success || !res.data) throw new Error(res.error ?? 'Update failed')
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? res.data! : t)),
    }))
  },

  removeTask: async (id) => {
    await taskApi.remove(id)
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
  },
}))
