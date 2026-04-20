'use client'

import { useEffect, useState } from 'react'
import { listInboxEntries, type InboxEntry } from '@/lib/repository'

export default function InboxPage() {
  const [entries, setEntries] = useState<InboxEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    setLoading(true)
    const data = await listInboxEntries()
    setEntries(data)
    setLoading(false)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
              <div
                key={entry.id}
                className="p-4 border rounded-lg hover:bg-gray-50"
              >
                <p className="text-gray-800 whitespace-pre-wrap">{entry.rawText}</p>
                <div className="mt-2 text-sm text-gray-500">
                  {formatDate(entry.createdAt)}
                </div>
              </div>
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