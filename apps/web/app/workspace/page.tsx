'use client'

import { useCallback, useEffect, useState } from 'react'

import { getCurrentUser, logoutUser, type LocalUser } from '@/lib/auth'
import {
  addTagToEntry,
  archiveEntry,
  createInboxEntry,
  createStoredTag,
  getWorkspaceStats,
  ignoreEntry,
  listArchivedEntries,
  listInboxEntries,
  listTags,
  removeTagFromEntry,
  reopenEntry,
  restoreEntry,
  suggestEntry,
  type InboxEntry,
  type StoredEntry,
  type StoredTag,
} from '@/lib/repository'
import type { EntryStatus } from '@/lib/types'

import AuthGate from './_components/AuthGate'
import type { ViewType } from './_components/Sidebar'
import DetailPanel from './_components/DetailPanel'
import ExpandedEditor from './_components/ExpandedEditor'
import MainPanel from './_components/MainPanel'
import Sidebar from './_components/Sidebar'

export default function WorkspacePage() {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [activeView, setActiveView] = useState<ViewType>('inbox')
  const [entries, setEntries] = useState<InboxEntry[]>([])
  const [archivedEntries, setArchivedEntries] = useState<StoredEntry[]>([])
  const [existingTags, setExistingTags] = useState<StoredTag[]>([])
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null)
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
    tagCount: 0,
  })

  useEffect(() => {
    const current = getCurrentUser()
    setUser(current)
    setAuthChecked(true)
  }, [])

  const userId = user?.id ?? ''

  const loadEntries = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [data, archived, tags, stats] = await Promise.all([
        listInboxEntries(userId),
        listArchivedEntries(userId),
        listTags(userId),
        getWorkspaceStats(userId),
      ])
      setEntries(data)
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
      loadEntries()
    }
  }, [user, loadEntries])

  const handleAuthenticated = () => {
    setUser(getCurrentUser())
  }

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    setEntries([])
    setArchivedEntries([])
    setExistingTags([])
    setSelectedEntryId(null)
    setSelectedArchivedEntryId(null)
    setFilterType(null)
    setFilterTag(null)
    setFilterProject(null)
    setFilterStatus(null)
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

  const selectedEntry = activeView === 'inbox'
    ? entries.find((e) => e.id === selectedEntryId) ?? null
    : null

  const selectedArchivedEntry = activeView === 'entries'
    ? archivedEntries.find((e) => e.id === selectedArchivedEntryId) ?? null
    : null

  const pendingCount = entries.filter(
    (e) => e.status === 'pending' || e.status === 'suggested'
  ).length

  const refreshList = async (): Promise<InboxEntry[]> => {
    try {
      const [data, archived, tags, stats] = await Promise.all([
        listInboxEntries(userId),
        listArchivedEntries(userId),
        listTags(userId),
        getWorkspaceStats(userId),
      ])
      setEntries(data)
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
      await createInboxEntry(userId, text)
      const updated = await refreshList()
      setActiveView('inbox')
      if (updated.length > 0 && updated[0]) {
        setSelectedEntryId(updated[0].id)
      }
    } catch {
      setError('保存失败，请重试')
    }
  }

  const handleSelectEntry = (id: number) => {
    setSelectedEntryId((prev) => (prev === id ? null : id))
  }

  const handleSelectArchivedEntry = (id: number) => {
    setSelectedArchivedEntryId((prev) => (prev === id ? null : id))
    if (activeView !== 'entries') {
      setActiveView('entries')
    }
  }

  const handleViewChange = (view: ViewType) => {
    setActiveView(view)
    if (view !== 'inbox') {
      setSelectedEntryId(null)
    }
    if (view !== 'entries') {
      setSelectedArchivedEntryId(null)
    }
  }

  const handleGotoInbox = () => {
    setActiveView('inbox')
    setSelectedEntryId(null)
    setSelectedArchivedEntryId(null)
  }

  const wrapAction = async (action: () => Promise<InboxEntry | null>) => {
    if (actionLoading) return
    setActionLoading(true)
    setError(null)
    try {
      const result = await action()
      if (result) {
        const archived = await listArchivedEntries(userId)
        setArchivedEntries(archived)
        setEntries((current) =>
          current.map((e) => (e.id === result.id ? result : e))
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
    await wrapAction(() => suggestEntry(userId, id))
  }

  const handleArchive = async (id: number) => {
    await wrapAction(() => archiveEntry(userId, id))
  }

  const handleIgnore = async (id: number) => {
    await wrapAction(() => ignoreEntry(userId, id))
  }

  const handleRestore = async (id: number) => {
    await wrapAction(() => restoreEntry(userId, id))
  }

  const handleReopen = async (inboxEntryId: number) => {
    if (actionLoading) return
    setActionLoading(true)
    setError(null)
    try {
      const result = await reopenEntry(userId, inboxEntryId)
      if (result) {
        const archived = await listArchivedEntries(userId)
        setArchivedEntries(archived)
        setEntries((current) =>
          current.map((e) => (e.id === result.id ? result : e))
        )
        setActiveView('inbox')
        setSelectedEntryId(result.id)
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
      return addTagToEntry(userId, id, tagName)
    })
  }

  const handleRemoveTag = async (id: number, tagName: string) => {
    await wrapAction(() => removeTagFromEntry(userId, id, tagName))
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        inboxCount={pendingCount}
        user={user}
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
        <MainPanel
          activeView={activeView}
          entries={entries}
          archivedEntries={archivedEntries}
          selectedEntryId={selectedEntryId}
          selectedArchivedEntryId={selectedArchivedEntryId}
          onSelectEntry={handleSelectEntry}
          onSelectArchivedEntry={handleSelectArchivedEntry}
          loading={loading}
          error={error}
          onRetry={loadEntries}
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
          onGotoInbox={handleGotoInbox}
        />
        <DetailPanel
          activeView={activeView}
          entry={selectedEntry}
          archivedEntry={selectedArchivedEntry}
          existingTags={existingTags}
          onSuggest={handleSuggest}
          onArchive={handleArchive}
          onIgnore={handleIgnore}
          onRestore={handleRestore}
          onReopen={handleReopen}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          actionLoading={actionLoading}
        />
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
