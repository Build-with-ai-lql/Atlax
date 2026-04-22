'use client'

import type { DockItem, StoredEntry } from '@/lib/repository'
import type { EntryStatus } from '@/lib/types'

import type { ViewType } from './Sidebar'
import EntriesFilterBar from './EntriesFilterBar'
import EntryListItem from './EntryListItem'
import EmptyState from './EmptyState'
import DockListItem from './DockListItem'
import QuickInputBar from './QuickInputBar'
import ReviewPanel from './ReviewPanel'

interface MainPanelProps {
  activeView: ViewType
  items: DockItem[]
  archivedEntries: StoredEntry[]
  selectedItemId: number | null
  selectedArchivedEntryId: number | null
  onSelectItem: (id: number) => void
  onSelectArchivedEntry: (id: number) => void
  loading: boolean
  error: string | null
  onRetry: () => void
  onCapture: (text: string) => Promise<void>
  onExpandEditor: () => void
  filterType: string | null
  filterTag: string | null
  filterProject: string | null
  filterStatus: EntryStatus | null
  onFilterType: (type: string | null) => void
  onFilterTag: (tag: string | null) => void
  onFilterProject: (project: string | null) => void
  onFilterStatus: (status: EntryStatus | null) => void
  reviewStats: {
    totalEntries: number
    pendingCount: number
    suggestedCount: number
    archivedCount: number
    ignoredCount: number
    reopenedCount: number
    tagCount: number
  }
  onGotoDock: () => void
}

const VIEW_TITLES: Record<ViewType, string> = {
  dock: 'Dock',
  entries: 'Entries',
  review: 'Review',
}

export default function MainPanel({
  activeView,
  items,
  archivedEntries,
  selectedItemId,
  selectedArchivedEntryId,
  onSelectItem,
  onSelectArchivedEntry,
  loading,
  error,
  onRetry,
  onCapture,
  onExpandEditor,
  filterType,
  filterTag,
  filterProject,
  filterStatus,
  onFilterType,
  onFilterTag,
  onFilterProject,
  onFilterStatus,
  reviewStats,
  onGotoDock,
}: MainPanelProps) {
  const availableTypes = Array.from(new Set(archivedEntries.map((e) => e.type)))
  const availableTags = Array.from(new Set(archivedEntries.flatMap((e) => e.tags)))
  const availableProjects = Array.from(new Set(archivedEntries.map((e) => e.project).filter(Boolean))) as string[]

  const dockStatusMap = new Map<number, EntryStatus>()
  for (const item of items) {
    dockStatusMap.set(item.id, item.status)
  }

  const getEntryStatus = (entry: StoredEntry): EntryStatus => {
    return dockStatusMap.get(entry.sourceDockItemId) ?? 'archived'
  }

  const availableStatuses = Array.from(new Set(archivedEntries.map(getEntryStatus)))

  if (activeView === 'entries') {
    let filtered = archivedEntries
    if (filterStatus) {
      filtered = filtered.filter((e) => getEntryStatus(e) === filterStatus)
    }
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
            {filtered.length}{filterType || filterTag || filterProject || filterStatus ? ' / ' + archivedEntries.length : ''} 条
          </span>
        </div>
        <EntriesFilterBar
          filterType={filterType}
          filterTag={filterTag}
          filterProject={filterProject}
          filterStatus={filterStatus}
          availableTypes={availableTypes}
          availableTags={availableTags}
          availableProjects={availableProjects}
          availableStatuses={availableStatuses}
          onFilterType={onFilterType}
          onFilterTag={onFilterTag}
          onFilterProject={onFilterProject}
          onFilterStatus={onFilterStatus}
        />
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">加载中…</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Entries"
              description={archivedEntries.length === 0 ? "归档后的内容会出现在这里" : "没有符合筛选条件的内容"}
              hint={archivedEntries.length === 0 ? "在 Dock 中接受归档后，内容将自动出现在此列表" : "尝试调整筛选条件"}
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
          onGotoDock={onGotoDock}
        />
      </div>
    )
  }

  return (
    <div className="w-[360px] flex-shrink-0 border-r border-gray-200 flex flex-col">
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {VIEW_TITLES.dock}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">加载中…</div>
        ) : error && items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button
              onClick={onRetry}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              重试
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">Dock 为空</p>
            <p className="text-gray-300 text-xs mt-1">在下方输入框快速记录，或点击展开按钮写长内容</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {items.map((item) => (
              <DockListItem
                key={item.id}
                item={item}
                isSelected={selectedItemId === item.id}
                onSelect={onSelectItem}
              />
            ))}
          </div>
        )}
      </div>
      <QuickInputBar onSubmit={onCapture} onExpand={onExpandEditor} />
    </div>
  )
}