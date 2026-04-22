'use client'

import type { LocalUser } from '@/lib/auth'

interface ChatPanelProps {
  user: LocalUser
}

export default function ChatPanel({ user }: ChatPanelProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Chat
        </h2>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-1">
            你好，{user.name}
          </p>
          <p className="text-xs text-gray-400">
            Chat 引导式整理即将上线
          </p>
          <p className="text-xs text-gray-300 mt-2">
            当前请使用 Classic 模式完成知识整理
          </p>
        </div>
      </div>
    </div>
  )
}
