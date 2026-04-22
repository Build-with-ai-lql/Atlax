'use client'

import type { AppMode } from '@/lib/events'

interface ModeSwitchProps {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
}

export default function ModeSwitch({ mode, onModeChange }: ModeSwitchProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onModeChange('classic')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          mode === 'classic'
            ? 'bg-white shadow-sm text-gray-900'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        Classic
      </button>
      <button
        onClick={() => onModeChange('chat')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          mode === 'chat'
            ? 'bg-white shadow-sm text-gray-900'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Chat
      </button>
    </div>
  )
}
