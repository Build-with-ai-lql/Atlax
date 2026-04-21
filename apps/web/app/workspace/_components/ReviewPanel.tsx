'use client'

import type { StoredEntry } from '@/lib/repository'

interface ReviewPanelProps {
  stats: {
    totalEntries: number
    pendingCount: number
    suggestedCount: number
    archivedCount: number
    ignoredCount: number
    tagCount: number
  }
  recentEntries: StoredEntry[]
  onSelectEntry: (id: number) => void
  onGotoInbox: () => void
}

export default function ReviewPanel({ stats, recentEntries, onSelectEntry, onGotoInbox }: ReviewPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">知识库概览</h2>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-700">{stats.totalEntries}</p>
          <p className="text-xs text-blue-500 mt-1">已归档条目</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-700">{stats.pendingCount + stats.suggestedCount}</p>
          <p className="text-xs text-amber-500 mt-1">待整理</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-700">{stats.tagCount}</p>
          <p className="text-xs text-emerald-500 mt-1">标签</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">最近归档</h3>
        <button
          onClick={onGotoInbox}
          className="text-xs text-blue-500 hover:text-blue-700 font-medium"
        >
          去 Inbox 整理 →
        </button>
      </div>

      {recentEntries.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-400">还没有归档内容</p>
          <p className="text-xs text-gray-300 mt-1">在 Inbox 中接受归档后，内容会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentEntries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onSelectEntry(entry.id)}
              className="w-full text-left bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800 truncate pr-4">{entry.title || '无标题'}</p>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded flex-shrink-0">
                  {entry.type}
                </span>
              </div>
              {entry.tags.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="text-xs text-gray-400">#{tag}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
