'use client'

import type { InboxEntry } from '@/lib/repository'

import type { ViewType } from './Sidebar'
import InboxListItem from './InboxListItem'
import EmptyState from './EmptyState'

interface MainPanelProps {
  activeView: ViewType
  entries: InboxEntry[]
  selectedEntryId: number | null
  onSelectEntry: (id: number) => void
  loading: boolean
  error: string | null
  onRetry: () => void
}

const VIEW_TITLES: Record<ViewType, string> = {
  inbox: 'Inbox',
  entries: 'Entries',
  review: 'Review',
}

export default function MainPanel({
  activeView,
  entries,
  selectedEntryId,
  onSelectEntry,
  loading,
  error,
  onRetry,
}: MainPanelProps) {
  if (activeView === 'entries') {
    return (
      <div className="w-[360px] flex-shrink-0 border-r border-gray-200 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {VIEW_TITLES.entries}
          </h2>
        </div>
        <EmptyState
          title="Entries"
          description="归档后的内容会出现在这里"
          hint="Phase 2.3 将实现完整归档与 Entries 浏览"
        />
      </div>
    )
  }

  if (activeView === 'review') {
    return (
      <div className="w-[360px] flex-shrink-0 border-r border-gray-200 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {VIEW_TITLES.review}
          </h2>
        </div>
        <EmptyState
          title="Review"
          description="定期回顾帮助你激活沉没的知识"
          hint="Phase 2.5 将实现完整 Review 功能"
        />
      </div>
    )
  }

  return (
    <div className="w-[360px] flex-shrink-0 border-r border-gray-200 flex flex-col">
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {VIEW_TITLES.inbox}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">加载中…</div>
        ) : error && entries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button
              onClick={onRetry}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              重试
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">暂无待整理内容</p>
            <p className="text-gray-300 text-xs mt-1">在下方输入框记录你的想法</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {entries.map((entry) => (
              <InboxListItem
                key={entry.id}
                entry={entry}
                isSelected={selectedEntryId === entry.id}
                onSelect={onSelectEntry}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
