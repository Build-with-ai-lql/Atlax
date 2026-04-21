'use client'

import type { StoredEntry } from '@/lib/repository'

interface EntryListItemProps {
  entry: StoredEntry
  isSelected: boolean
  onSelect: (id: number) => void
}

const TYPE_LABELS: Record<string, string> = {
  note: '笔记',
  meeting: '会议',
  idea: '想法',
  task: '任务',
  reading: '阅读',
}

export default function EntryListItem({ entry, isSelected, onSelect }: EntryListItemProps) {
  return (
    <button
      onClick={() => onSelect(entry.id)}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
        isSelected
          ? 'bg-blue-50 ring-1 ring-blue-200'
          : 'hover:bg-gray-50'
      }`}
    >
      <p className="text-sm text-gray-800 leading-snug line-clamp-2 font-medium">
        {entry.title || entry.content.slice(0, 60)}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-gray-400">
          {TYPE_LABELS[entry.type] ?? entry.type}
        </span>
        <span className="text-xs text-gray-300">·</span>
        <span className="text-xs text-gray-400">
          {new Date(entry.archivedAt).toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
        {entry.tags.length > 0 && (
          <>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-blue-500">
              {entry.tags.slice(0, 2).join(', ')}
              {entry.tags.length > 2 ? ` +${entry.tags.length - 2}` : ''}
            </span>
          </>
        )}
      </div>
    </button>
  )
}
