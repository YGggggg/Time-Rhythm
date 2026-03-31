import { create } from 'zustand'
import type { User } from '../types'
import { authApi } from '../api/auth'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (email, password) => {
    const res = await authApi.login({ email, password })
    if (!res.success || !res.data) throw new Error(res.error ?? 'Login failed')
    localStorage.setItem('token', res.data.access_token)
    set({ token: res.data.access_token })
  },

  register: async (email, username, password) => {
    const res = await authApi.register({ email, username, password })
    if (!res.success) throw new Error(res.error ?? 'Registration failed')
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    set({ isLoading: true })
    try {
      const res = await authApi.me()
      if (res.success && res.data) set({ user: res.data })
    } finally {
      set({ isLoading: false })
    }
  },
}))
