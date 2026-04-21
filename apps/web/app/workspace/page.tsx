'use client'

import { useEffect, useState, useCallback } from 'react'

import {
  addTagToEntry,
  archiveEntry,
  createInboxEntry,
  createStoredTag,
  ignoreEntry,
  listInboxEntries,
  listTags,
  removeTagFromEntry,
  restoreEntry,
  suggestEntry,
  type InboxEntry,
  type StoredTag,
} from '@/lib/repository'

import type { ViewType } from './_components/Sidebar'
import DetailPanel from './_components/DetailPanel'
import MainPanel from './_components/MainPanel'
import QuickInputBar from './_components/QuickInputBar'
import Sidebar from './_components/Sidebar'

export default function WorkspacePage() {
  const [activeView, setActiveView] = useState<ViewType>('inbox')
  const [entries, setEntries] = useState<InboxEntry[]>([])
  const [existingTags, setExistingTags] = useState<StoredTag[]>([])
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedEntry = activeView === 'inbox'
    ? entries.find((e) => e.id === selectedEntryId) ?? null
    : null

  const pendingCount = entries.filter(
    (e) => e.status === 'pending' || e.status === 'suggested'
  ).length

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listInboxEntries()
      const tags = await listTags()
      setEntries(data)
      setExistingTags(tags)
    } catch {
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const refreshList = useCallback(async (): Promise<InboxEntry[]> => {
    try {
      const data = await listInboxEntries()
      const tags = await listTags()
      setEntries(data)
      setExistingTags(tags)
      setError(null)
      return data
    } catch {
      setError('刷新失败，请重试')
      return []
    }
  }, [])

  const handleCapture = async (text: string) => {
    try {
      await createInboxEntry(text)
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

  const handleViewChange = (view: ViewType) => {
    setActiveView(view)
    if (view !== 'inbox') {
      setSelectedEntryId(null)
    }
  }

  const wrapAction = useCallback(
    async (action: () => Promise<InboxEntry | null>) => {
      if (actionLoading) return
      setActionLoading(true)
      setError(null)
      try {
        const result = await action()
        if (result) {
          setEntries((current) =>
            current.map((e) => (e.id === result.id ? result : e))
          )
        } else {
          await refreshList()
        }
      } catch {
        setError('操作失败，请重试')
      } finally {
        setActionLoading(false)
      }
    },
    [actionLoading, refreshList]
  )

  const handleSuggest = async (id: number) => {
    await wrapAction(() => suggestEntry(id))
  }

  const handleArchive = async (id: number) => {
    await wrapAction(() => archiveEntry(id))
  }

  const handleIgnore = async (id: number) => {
    await wrapAction(() => ignoreEntry(id))
  }

  const handleRestore = async (id: number) => {
    await wrapAction(() => restoreEntry(id))
  }

  const handleAddTag = async (id: number, tagName: string) => {
    await wrapAction(async () => {
      await createStoredTag(tagName)
      return addTagToEntry(id, tagName)
    })
  }

  const handleRemoveTag = async (id: number, tagName: string) => {
    await wrapAction(() => removeTagFromEntry(id, tagName))
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        inboxCount={pendingCount}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {error && (
          <div className="flex-shrink-0 px-5 py-2 bg-red-50 border-b border-red-200 flex items-center justify-between">
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              关闭
            </button>
          </div>
        )}
        <div className="flex-1 flex min-h-0">
          <MainPanel
            activeView={activeView}
            entries={entries}
            selectedEntryId={selectedEntryId}
            onSelectEntry={handleSelectEntry}
            loading={loading}
            error={error}
            onRetry={loadEntries}
          />
          <DetailPanel
            activeView={activeView}
            entry={selectedEntry}
            existingTags={existingTags}
            onSuggest={handleSuggest}
            onArchive={handleArchive}
            onIgnore={handleIgnore}
            onRestore={handleRestore}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            actionLoading={actionLoading}
          />
        </div>
        <QuickInputBar onSubmit={handleCapture} />
      </div>
    </div>
  )
}