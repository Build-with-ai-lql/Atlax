'use client'

import type { InboxEntry, StoredEntry } from '@/lib/repository'

import type { ViewType } from './Sidebar'
import EntriesFilterBar from './EntriesFilterBar'
import EntryListItem from './EntryListItem'
import EmptyState from './EmptyState'
import InboxListItem from './InboxListItem'
import QuickInputBar from './QuickInputBar'
import ReviewPanel from './ReviewPanel'

interface MainPanelProps {
  activeView: ViewType
  entries: InboxEntry[]
  archivedEntries: StoredEntry[]
  selectedEntryId: number | null
  selectedArchivedEntryId: number | null
  onSelectEntry: (id: number) => void
  onSelectArchivedEntry: (id: number) => void
  loading: boolean
  error: string | null
  onRetry: () => void
  onCapture: (text: string) => Promise<void>
  onExpandEditor: () => void
  filterType: string | null
  filterTag: string | null
  filterProject: string | null
  onFilterType: (type: string | null) => void
  onFilterTag: (tag: string | null) => void
  onFilterProject: (project: string | null) => void
  reviewStats: {
    totalEntries: number
    pendingCount: number
    suggestedCount: number
    archivedCount: number
    ignoredCount: number
    tagCount: number
  }
  onGotoInbox: () => void
}

const VIEW_TITLES: Record<ViewType, string> = {
  inbox: 'Inbox',
  entries: 'Entries',
  review: 'Review',
}

export default function MainPanel({
  activeView,
  entries,
  archivedEntries,
  selectedEntryId,
  selectedArchivedEntryId,
  onSelectEntry,
  onSelectArchivedEntry,
  loading,
  error,
  onRetry,
  onCapture,
  onExpandEditor,
  filterType,
  filterTag,
  filterProject,
  onFilterType,
  onFilterTag,
  onFilterProject,
  reviewStats,
  onGotoInbox,
}: MainPanelProps) {
  const availableTypes = Array.from(new Set(archivedEntries.map((e) => e.type)))
  const availableTags = Array.from(new Set(archivedEntries.flatMap((e) => e.tags)))
  const availableProjects = Array.from(new Set(archivedEntries.map((e) => e.project).filter(Boolean))) as string[]

  if (activeView === 'entries') {
    let filtered = archivedEntries
    if (filterType) {
      filtered = filtered.filter((e) => e.type === filterType)
    }
    if (filterTag) {
      filtered = filtered.filter((e) => e.tags.includes(filterTag))
    }
    if (filterProject) {
      filtered = filtered.filter((e) => e.project === filterProject)
    }

    return (
      <div className="w-[360px] flex-shrink-0 border-r border-gray-200 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {VIEW_TITLES.entries}
          </h2>
          <span className="ml-auto text-xs text-gray-400">
            {filtered.length}{filterType || filterTag || filterProject ? ' / ' + archivedEntries.length : ''} 条
          </span>
        </div>
        <EntriesFilterBar
          filterType={filterType}
          filterTag={filterTag}
          filterProject={filterProject}
          availableTypes={availableTypes}
          availableTags={availableTags}
          availableProjects={availableProjects}
          onFilterType={onFilterType}
          onFilterTag={onFilterTag}
          onFilterProject={onFilterProject}
        />
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">加载中…</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Entries"
              description={archivedEntries.length === 0 ? "归档后的内容会出现在这里" : "没有符合筛选条件的内容"}
              hint={archivedEntries.length === 0 ? "在 Inbox 中接受归档后，内容将自动出现在此列表" : "尝试调整筛选条件"}
            />
          ) : (
            <div className="p-2 space-y-0.5">
              {filtered.map((entry) => (
                <EntryListItem
                  key={entry.id}
                  entry={entry}
                  isSelected={selectedArchivedEntryId === entry.id}
                  onSelect={onSelectArchivedEntry}
                />
              ))}
            </div>
          )}
        </div>
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
        <ReviewPanel
          stats={reviewStats}
          recentEntries={archivedEntries.slice(0, 5)}
          onSelectEntry={onSelectArchivedEntry}
          onGotoInbox={onGotoInbox}
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
      <QuickInputBar onSubmit={onCapture} onExpand={onExpandEditor} />
    </div>
  )
}
