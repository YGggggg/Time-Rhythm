export type TaskStatus = 'pending' | 'active' | 'done'

export interface Task {
  id: string
  user_id: string
  title: string
  start_time: string  // ISO datetime
  duration_minutes: number
  color: string
  order_index: number
  status: TaskStatus
  energy_level: number
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  title: string
  start_time: string
  duration_minutes?: number
  color?: string
  energy_level?: number
  parent_id?: string
}

export interface TaskUpdate {
  title?: string
  start_time?: string
  duration_minutes?: number
  color?: string
  order_index?: number
  status?: TaskStatus
  energy_level?: number
}

export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

export interface SubTaskSuggestion {
  title: string
  duration_minutes: number
  energy_level: number
  color: string
}

export interface TaskDecomposeResult {
  original_task_id: string
  subtasks: SubTaskSuggestion[]
}
