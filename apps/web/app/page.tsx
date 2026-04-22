'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { getCurrentUser, type LocalUser } from '@/lib/auth'

export default function Home() {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setUser(getCurrentUser())
    setChecked(true)
  }, [])

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">加载中…</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="w-full max-w-md mx-auto px-6 text-center">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Atlax MindDock
          </h1>
          <p className="text-base text-gray-500 mt-3">
            让知识开始替你工作
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/workspace"
            className="block w-full py-3 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            {user ? '继续整理' : '进入工作区'}
          </Link>

          {!user && (
            <p className="text-xs text-gray-400 mt-4">
              首次使用将引导你创建身份并进入工作区
            </p>
          )}
        </div>

        <p className="text-xs text-gray-300 mt-16">
          本地优先 · 结构化优先 · 知识整理工作台
        </p>
      </div>
    </div>
  )
}
