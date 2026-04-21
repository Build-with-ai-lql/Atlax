'use client'

import type { InboxEntry } from '@/lib/repository'
import type { EntryStatus } from '@/lib/types'

const STATUS_DOT: Record<EntryStatus, string> = {
  pending: 'bg-yellow-400',
  suggested: 'bg-blue-400',
  archived: 'bg-green-400',
  ignored: 'bg-gray-300',
}

interface InboxListItemProps {
  entry: InboxEntry
  isSelected: boolean
  onSelect: (id: number) => void
}

export default function InboxListItem({ entry, isSelected, onSelect }: InboxListItemProps) {
  const preview = entry.rawText.length > 80 ? entry.rawText.slice(0, 80) + '…' : entry.rawText

  return (
    <button
      onClick={() => onSelect(entry.id)}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
        isSelected
          ? 'bg-blue-50 ring-1 ring-blue-200'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[entry.status]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug line-clamp-2">{preview}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">
              {new Date(entry.createdAt).toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {entry.status === 'suggested' && entry.suggestions.length > 0 && (
              <span className="text-xs text-blue-500">
                {entry.suggestions.length} 条建议
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
