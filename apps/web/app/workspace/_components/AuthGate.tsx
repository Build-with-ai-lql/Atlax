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
    <div className="flex h-screen atlax-page-bg items-center justify-center selection:bg-blue-200 dark:selection:bg-blue-900">
      <div className="w-full max-w-sm mx-auto p-8">
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 flex items-center justify-center mx-auto mb-6 group">
            <div className="absolute inset-0 bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/10"></div>
            <div className="absolute inset-[3px] rounded-[15px] bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-400 opacity-80 blur-[1.5px] group-hover:opacity-100 group-hover:blur-[2px] group-hover:scale-105 transition-all duration-700 ease-out"></div>
            <div className="absolute inset-[3px] rounded-[15px] bg-gradient-to-b from-white/80 dark:from-white/30 via-white/20 dark:via-transparent to-transparent border border-white/50 dark:border-white/20 z-10 pointer-events-none"></div>
            <div className="w-4 h-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.4)] z-20 group-hover:scale-110 transition-transform duration-300"></div>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
            <span className="font-bold text-slate-900 dark:text-white">Mind</span>
            <span className="font-light text-slate-500 dark:text-slate-400">Dock</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">本地优先的知识整理与结构化工作台</p>
        </div>

        <div className="atlax-card p-6">
          {localUsers.length > 0 && (
            <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-white/5 rounded-xl p-1">
              <button
                onClick={() => { setMode('login'); setLoginError(null) }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  mode === 'login'
                    ? 'bg-white dark:bg-[#2C2C2E] shadow-sm text-slate-900 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => { setMode('register'); setLoginError(null) }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  mode === 'register'
                    ? 'bg-white dark:bg-[#2C2C2E] shadow-sm text-slate-900 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                注册
              </button>
            </div>
          )}

          {mode === 'login' && localUsers.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">选择已有账号</p>
              {localUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleLoginByUserId(u.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-100 dark:from-blue-900 to-indigo-100 dark:to-indigo-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-300">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{u.name}</span>
                </button>
              ))}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLoginByName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  用户名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入用户名登录"
                  className="atlax-input"
                  autoFocus
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-500 dark:text-red-400">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={!name.trim()}
                className="atlax-btn-primary w-full py-2.5"
              >
                进入工作区
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  用户名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入新用户名"
                  className="atlax-input"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="atlax-btn-primary w-full py-2.5"
              >
                创建账号
              </button>
            </form>
          )}

          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 text-center">
            Demo 阶段使用本地身份，数据存储在浏览器中
          </p>
        </div>
      </div>
    </div>
  )
}
