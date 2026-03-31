import React, { useEffect, useState } from 'react'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import { useAuthStore } from './store/authStore'

const App: React.FC = () => {
  const { token, fetchMe } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (token) {
      fetchMe().finally(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [token, fetchMe])

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center">
        <p className="text-sm text-[#7A7580]">加载中...</p>
      </div>
    )
  }

  if (!token) {
    return <AuthPage onSuccess={() => window.location.reload()} />
  }

  return <HomePage />
}

export default App
