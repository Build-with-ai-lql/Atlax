'use client'

import { useCallback, useEffect, useState } from 'react'

import { getCurrentUser, logoutUser, type LocalUser } from '@/lib/auth'
import {
  addTagToItem,
  archiveItem,
  createDockItem,
  createStoredTag,
  getWorkspaceStats,
  ignoreItem,
  listArchivedEntries,
  listDockItems,
  listTags,
  removeTagFromItem,
  reopenItem,
  restoreItem,
  suggestItem,
  updateArchivedEntry,
  type DockItem,
  type StoredEntry,
  type StoredTag,
} from '@/lib/repository'
import type { EntryStatus } from '@/lib/types'
import { recordEvent, type AppMode } from '@/lib/events'

import AuthGate from './_components/AuthGate'
import ChatPanel from './_components/ChatPanel'
import type { ViewType } from './_components/Sidebar'
import DetailPanel from './_components/DetailPanel'
import ExpandedEditor from './_components/ExpandedEditor'
import MainPanel from './_components/MainPanel'
import Sidebar from './_components/Sidebar'

export default function WorkspacePage() {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [mode, setMode] = useState<AppMode>('classic')
  const [activeView, setActiveView] = useState<ViewType>('dock')
  const [items, setItems] = useState<DockItem[]>([])
  const [archivedEntries, setArchivedEntries] = useState<StoredEntry[]>([])
  const [existingTags, setExistingTags] = useState<StoredTag[]>([])
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [selectedArchivedEntryId, setSelectedArchivedEntryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedEditorOpen, setExpandedEditorOpen] = useState(false)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [filterProject, setFilterProject] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<EntryStatus | null>(null)
  const [reviewStats, setReviewStats] = useState({
    totalEntries: 0,
    pendingCount: 0,
    suggestedCount: 0,
    archivedCount: 0,
    ignoredCount: 0,
    reopenedCount: 0,
    tagCount: 0,
  })

  useEffect(() => {
    const current = getCurrentUser()
    setUser(current)
    setAuthChecked(true)
  }, [])

  const userId = user?.id ?? ''

  const loadItems = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [data, archived, tags, stats] = await Promise.all([
        listDockItems(userId),
        listArchivedEntries(userId),
        listTags(userId),
        getWorkspaceStats(userId),
      ])
      setItems(data)
      setArchivedEntries(archived)
      setExistingTags(tags)
      setReviewStats(stats)
    } catch {
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (user) {
      loadItems()
    }
  }, [user, loadItems])

  const handleAuthenticated = () => {
    setUser(getCurrentUser())
  }

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    setItems([])
    setArchivedEntries([])
    setExistingTags([])
    setSelectedItemId(null)
    setSelectedArchivedEntryId(null)
    setFilterType(null)
    setFilterTag(null)
    setFilterProject(null)
    setFilterStatus(null)
  }

  const handleModeChange = (newMode: AppMode) => {
    if (newMode === mode) return
    recordEvent({ type: 'mode_switched', from: mode, to: newMode })
    setMode(newMode)
  }

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">加载中…</p>
      </div>
    )
  }

  if (!user) {
    return <AuthGate onAuthenticated={handleAuthenticated} />
  }

  const selectedItem = activeView === 'dock'
    ? items.find((i) => i.id === selectedItemId) ?? null
    : null

  const selectedArchivedEntry = activeView === 'entries'
    ? archivedEntries.find((e) => e.id === selectedArchivedEntryId) ?? null
    : null

  const pendingCount = items.filter(
    (i) => i.status === 'pending' || i.status === 'suggested'
  ).length

  const refreshList = async (): Promise<DockItem[]> => {
    try {
      const [data, archived, tags, stats] = await Promise.all([
        listDockItems(userId),
        listArchivedEntries(userId),
        listTags(userId),
        getWorkspaceStats(userId),
      ])
      setItems(data)
      setArchivedEntries(archived)
      setExistingTags(tags)
      setReviewStats(stats)
      setError(null)
      return data
    } catch {
      setError('刷新失败，请重试')
      return []
    }
  }

  const handleCapture = async (text: string) => {
    try {
      await createDockItem(userId, text)
      const updated = await refreshList()
      setActiveView('dock')
      if (updated.length > 0 && updated[0]) {
        setSelectedItemId(updated[0].id)
      }
    } catch {
      setError('保存失败，请重试')
    }
  }

  const handleChatSubmitToDock = async (text: string) => {
    const id = await createDockItem(userId, text, 'chat')
    recordEvent({ type: 'chat_guided_capture_created', dockItemId: id, rawText: text })
    await refreshList()
  }

  const handleSwitchToClassic = () => {
    setMode('classic')
    setActiveView('dock')
    setSelectedItemId(null)
    setSelectedArchivedEntryId(null)
  }

  const handleSelectItem = (id: number) => {
    setSelectedItemId((prev) => (prev === id ? null : id))
  }

  const handleSelectArchivedEntry = (id: number) => {
    setSelectedArchivedEntryId((prev) => (prev === id ? null : id))
    if (activeView !== 'entries') {
      setActiveView('entries')
    }
  }

  const handleViewChange = (view: ViewType) => {
    setActiveView(view)
    if (view !== 'dock') {
      setSelectedItemId(null)
    }
    if (view !== 'entries') {
      setSelectedArchivedEntryId(null)
    }
  }

  const handleGotoDock = () => {
    setActiveView('dock')
    setSelectedItemId(null)
    setSelectedArchivedEntryId(null)
  }

  const wrapAction = async (action: () => Promise<DockItem | null>) => {
    if (actionLoading) return
    setActionLoading(true)
    setError(null)
    try {
      const result = await action()
      if (result) {
        const archived = await listArchivedEntries(userId)
        setArchivedEntries(archived)
        setItems((current) =>
          current.map((i) => (i.id === result.id ? result : i))
        )
        const stats = await getWorkspaceStats(userId)
        setReviewStats(stats)
      } else {
        await refreshList()
      }
    } catch {
      setError('操作失败，请重试')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuggest = async (id: number) => {
    await wrapAction(() => suggestItem(userId, id))
  }

  const handleArchive = async (id: number) => {
    await wrapAction(() => archiveItem(userId, id))
  }

  const handleIgnore = async (id: number) => {
    await wrapAction(() => ignoreItem(userId, id))
  }

  const handleRestore = async (id: number) => {
    await wrapAction(() => restoreItem(userId, id))
  }

  const handleReopen = async (dockItemId: number) => {
    if (actionLoading) return
    setActionLoading(true)
    setError(null)
    try {
      const result = await reopenItem(userId, dockItemId)
      if (result) {
        const archived = await listArchivedEntries(userId)
        setArchivedEntries(archived)
        setItems((current) =>
          current.map((i) => (i.id === result.id ? result : i))
        )
        setActiveView('dock')
        setSelectedItemId(result.id)
        setSelectedArchivedEntryId(null)
        const stats = await getWorkspaceStats(userId)
        setReviewStats(stats)
      }
    } catch {
      setError('操作失败，请重试')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddTag = async (id: number, tagName: string) => {
    await wrapAction(async () => {
      await createStoredTag(userId, tagName)
      return addTagToItem(userId, id, tagName)
    })
  }

  const handleRemoveTag = async (id: number, tagName: string) => {
    await wrapAction(() => removeTagFromItem(userId, id, tagName))
  }

  const handleUpdateEntry = async (entryId: number, updates: { tags?: string[]; project?: string | null; content?: string; title?: string }) => {
    const result = await updateArchivedEntry(userId, entryId, updates)
    if (result) {
      setArchivedEntries((current) =>
        current.map((e) => (e.id === result.id ? result : e))
      )
    }
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        dockCount={pendingCount}
        user={user}
        mode={mode}
        onModeChange={handleModeChange}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex min-w-0">
        {error && (
          <div className="absolute top-0 left-56 right-0 z-10 px-5 py-2 bg-red-50 border-b border-red-200 flex items-center justify-between">
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              关闭
            </button>
          </div>
        )}
        {mode === 'chat' ? (
          <ChatPanel user={user} onSubmitToDock={handleChatSubmitToDock} onSwitchToClassic={handleSwitchToClassic} />
        ) : (
          <>
            <MainPanel
              activeView={activeView}
              items={items}
              archivedEntries={archivedEntries}
              selectedItemId={selectedItemId}
              selectedArchivedEntryId={selectedArchivedEntryId}
              onSelectItem={handleSelectItem}
              onSelectArchivedEntry={handleSelectArchivedEntry}
              loading={loading}
              error={error}
              onRetry={loadItems}
              onCapture={handleCapture}
              onExpandEditor={() => setExpandedEditorOpen(true)}
              filterType={filterType}
              filterTag={filterTag}
              filterProject={filterProject}
              filterStatus={filterStatus}
              onFilterType={setFilterType}
              onFilterTag={setFilterTag}
              onFilterProject={setFilterProject}
              onFilterStatus={setFilterStatus}
              reviewStats={reviewStats}
              onGotoDock={handleGotoDock}
            />
            <DetailPanel
              activeView={activeView}
              item={selectedItem}
              archivedEntry={selectedArchivedEntry}
              existingTags={existingTags}
              onSuggest={handleSuggest}
              onArchive={handleArchive}
              onIgnore={handleIgnore}
              onRestore={handleRestore}
              onReopen={handleReopen}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onUpdateEntry={handleUpdateEntry}
              actionLoading={actionLoading}
            />
          </>
        )}
      </div>
      {expandedEditorOpen && (
        <ExpandedEditor
          onSubmit={handleCapture}
          onClose={() => setExpandedEditorOpen(false)}
        />
      )}
    </div>
  )
}
