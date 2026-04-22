'use client'

import type { LocalUser } from '@/lib/auth'
import type { AppMode } from '@/lib/events'

import ModeSwitch from './ModeSwitch'

export type ViewType = 'dock' | 'entries' | 'review'

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  dockCount: number
  user: LocalUser | null
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  onLogout: () => void
}

const NAV_ITEMS: { key: ViewType; label: string; icon: string }[] = [
  { key: 'dock', label: 'Dock', icon: '📥' },
  { key: 'entries', label: 'Entries', icon: '📂' },
  { key: 'review', label: 'Review', icon: '📊' },
]

export default function Sidebar({ activeView, onViewChange, dockCount, user, mode, onModeChange, onLogout }: SidebarProps) {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <span className="text-lg font-bold tracking-tight text-gray-900">Atlax</span>
      </div>
      <div className="px-3 pt-3 pb-1">
        <ModeSwitch mode={mode} onModeChange={onModeChange} />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => onViewChange(item.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === item.key
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
            {item.key === 'dock' && dockCount > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {dockCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-200">
        {user && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-blue-700">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              title="退出登录"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
