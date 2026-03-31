import api from './client'
import type { ApiResponse, Task, TaskCreate, TaskUpdate, TaskDecomposeResult } from '../types'

export const taskApi = {
  list: (date: string) =>
    api.get<ApiResponse<Task[]>>('/tasks', { params: { date } }).then((r) => r.data),

  create: (data: TaskCreate) =>
    api.post<ApiResponse<Task>>('/tasks', data).then((r) => r.data),

  update: (id: string, data: TaskUpdate) =>
    api.put<ApiResponse<Task>>(`/tasks/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete<ApiResponse<null>>(`/tasks/${id}`).then((r) => r.data),

  decompose: (id: string, data: { hint?: string; max_subtasks?: number }) =>
    api.post<ApiResponse<TaskDecomposeResult>>(`/tasks/${id}/decompose`, data).then((r) => r.data),
}
