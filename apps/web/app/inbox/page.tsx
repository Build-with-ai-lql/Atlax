'use client'

import { useEffect, useState } from 'react'
import {
  listInboxEntries,
  suggestEntry,
  archiveEntry,
  ignoreEntry,
  restoreEntry,
  type InboxEntry,
} from '@/lib/repository'
import InboxEntryCard from './_components/InboxEntryCard'

export default function InboxPage() {
  const [entries, setEntries] = useState<InboxEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    setLoading(true)
    const data = await listInboxEntries()
    setEntries(data)
    setLoading(false)
  }

  const refreshEntry = async (id: number) => {
    const updated = await listInboxEntries()
    setEntries(updated)
  }

  const handleSuggest = async (id: number) => {
    setActionLoading(id)
    await suggestEntry(id)
    setActionLoading(null)
    await refreshEntry(id)
  }

  const handleArchive = async (id: number) => {
    setActionLoading(id)
    await archiveEntry(id)
    setActionLoading(null)
    await refreshEntry(id)
  }

  const handleIgnore = async (id: number) => {
    setActionLoading(id)
    await ignoreEntry(id)
    setActionLoading(null)
    await refreshEntry(id)
  }

  const handleRestore = async (id: number) => {
    setActionLoading(id)
    await restoreEntry(id)
    setActionLoading(null)
    await refreshEntry(id)
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Inbox</h1>
        <p className="text-gray-600 mb-8">待整理的内容</p>

        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">暂无待整理内容</p>
            <a href="/capture" className="text-blue-500 hover:underline">
              开始记录 →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <InboxEntryCard
                key={entry.id}
                entry={entry}
                onSuggest={handleSuggest}
                onArchive={handleArchive}
                onIgnore={handleIgnore}
                onRestore={handleRestore}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <a href="/capture" className="text-blue-500 hover:underline">
            继续记录 →
          </a>
          <button
            onClick={loadEntries}
            className="text-gray-500 hover:underline"
          >
            刷新列表
          </button>
        </div>
      </div>
    </main>
  )
}