import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'

interface Props {
  onSuccess: () => void
}

const AuthPage: React.FC<Props> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, username, password)
        await login(email, password)
      }
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '操作失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-[#E2E0DC] p-6">
        <h1 className="text-2xl font-medium text-[#4A4550] mb-1">时律</h1>
        <p className="text-sm text-[#7A7580] mb-6">让时间看得见</p>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E0DC] bg-[#F5F4F1] outline-none focus:border-[#A8B5A2]"
          />
          {mode === 'register' && (
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E0DC] bg-[#F5F4F1] outline-none focus:border-[#A8B5A2]"
            />
          )}
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E0DC] bg-[#F5F4F1] outline-none focus:border-[#A8B5A2]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-sm rounded-xl bg-[#A8B5A2] text-white font-medium disabled:opacity-50 hover:bg-[#96a390] transition-colors"
          >
            {loading ? '请稍候...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <p className="text-center text-xs text-[#7A7580] mt-4">
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="ml-1 text-[#A8B5A2] hover:underline"
          >
            {mode === 'login' ? '注册' : '登录'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthPage
