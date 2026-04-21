'use client'

export type ViewType = 'inbox' | 'entries' | 'review'

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  inboxCount: number
}

const NAV_ITEMS: { key: ViewType; label: string; icon: string }[] = [
  { key: 'inbox', label: 'Inbox', icon: '📥' },
  { key: 'entries', label: 'Entries', icon: '📂' },
  { key: 'review', label: 'Review', icon: '📊' },
]

export default function Sidebar({ activeView, onViewChange, inboxCount }: SidebarProps) {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <span className="text-lg font-bold tracking-tight text-gray-900">Atlax</span>
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
            {item.key === 'inbox' && inboxCount > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {inboxCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">Phase 2 Demo</p>
      </div>
    </aside>
  )
}
