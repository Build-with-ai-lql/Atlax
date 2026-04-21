'use client'

import { useEffect, useState, useCallback } from 'react'
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listInboxEntries()
      setEntries(data)
    } catch (e) {
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const refreshList = async () => {
    try {
      const updated = await listInboxEntries()
      setEntries(updated)
    } catch (e) {
      setError('刷新失败，请重试')
    }
  }

  const wrapAction = useCallback(
    async (id: number, action: () => Promise<unknown>, actionName: string) => {
      if (actionLoading !== null) return
      setActionLoading(id)
      setError(null)
      try {
        const result = await action()
        if (result === null || result === false) {
          setError(`${actionName}失败：当前状态不允许此操作`)
        }
      } catch (e) {
        setError(`${actionName}失败：${e instanceof Error ? e.message : '未知错误'}`)
      } finally {
        setActionLoading(null)
        await refreshList()
      }
    },
    [actionLoading]
  )

  const handleSuggest = async (id: number) => {
    await wrapAction(id, () => suggestEntry(id), '生成建议')
  }

  const handleArchive = async (id: number) => {
    await wrapAction(id, () => archiveEntry(id), '归档')
  }

  const handleIgnore = async (id: number) => {
    await wrapAction(id, () => ignoreEntry(id), '忽略')
  }

  const handleRestore = async (id: number) => {
    await wrapAction(id, () => restoreEntry(id), '恢复')
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Inbox</h1>
        <p className="text-gray-600 mb-8">待整理的内容</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

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
