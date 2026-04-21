'use client'

import { useState, useEffect } from 'react'

import { listLocalUsers, loginByUserId, loginUser, registerUser, type LocalUser } from '@/lib/auth'

interface AuthGateProps {
  onAuthenticated: () => void
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [localUsers, setLocalUsers] = useState<LocalUser[]>([])
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    const users = listLocalUsers()
    setLocalUsers(users)
    if (users.length === 0) {
      setMode('register')
    }
  }, [])

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoginError(null)
    registerUser(name.trim())
    onAuthenticated()
  }

  const handleLoginByName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoginError(null)
    const user = loginUser(name.trim())
    if (user) {
      onAuthenticated()
    } else {
      setLoginError('用户不存在，请先注册')
    }
  }

  const handleLoginByUserId = (userId: string) => {
    setLoginError(null)
    const user = loginByUserId(userId)
    if (user) {
      onAuthenticated()
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="w-full max-w-sm mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Atlax MindDock</h1>
          <p className="text-sm text-gray-500 mt-2">本地优先的知识整理与结构化工作台</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {localUsers.length > 0 && (
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => { setMode('login'); setLoginError(null) }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === 'login'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => { setMode('register'); setLoginError(null) }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === 'register'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                注册
              </button>
            </div>
          )}

          {mode === 'login' && localUsers.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs text-gray-500 font-medium">选择已有账号</p>
              {localUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleLoginByUserId(u.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-blue-700">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-700">{u.name}</span>
                </button>
              ))}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLoginByName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  用户名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入用户名登录"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400"
                  autoFocus
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-500">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                进入工作区
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  用户名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入新用户名"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                创建账号
              </button>
            </form>
          )}

          <p className="text-xs text-gray-400 mt-4 text-center">
            Demo 阶段使用本地身份，数据存储在浏览器中
          </p>
        </div>
      </div>
    </div>
  )
}
