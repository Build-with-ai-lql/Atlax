'use client'

import type { InboxEntry, EntryStatus } from '@/lib/repository'

const STATUS_CONFIG: Record<EntryStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  suggested: { label: '已建议', color: 'text-blue-700', bg: 'bg-blue-100' },
  archived: { label: '已归档', color: 'text-green-700', bg: 'bg-green-100' },
  ignored: { label: '已忽略', color: 'text-gray-600', bg: 'bg-gray-100' },
}

function StatusBadge({ status }: { status: EntryStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  )
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface InboxEntryCardProps {
  entry: InboxEntry
  onSuggest: (id: number) => Promise<void>
  onArchive: (id: number) => Promise<void>
  onIgnore: (id: number) => Promise<void>
  onRestore: (id: number) => Promise<void>
  actionLoading: number | null
}

export default function InboxEntryCard({
  entry,
  onSuggest,
  onArchive,
  onIgnore,
  onRestore,
  actionLoading,
}: InboxEntryCardProps) {
  const isLoading = actionLoading === entry.id!

  const category = entry.suggestions.find((s) => s.type === 'category')
  const tags = entry.suggestions.filter((s) => s.type === 'tag')
  const actions = entry.suggestions.filter((s) => s.type === 'action')
  const projects = entry.suggestions.filter((s) => s.type === 'project')

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start justify-between gap-2">
        <p className="text-gray-800 whitespace-pre-wrap flex-1">{entry.rawText}</p>
        <StatusBadge status={entry.status} />
      </div>

      <div className="mt-2 text-sm text-gray-500">
        {formatDate(entry.createdAt)}
      </div>

      {entry.status === 'suggested' && entry.suggestions.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-100">
          {category && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">分类</span>
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-sm font-medium">
                {category.label}
              </span>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">标签</span>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span key={tag.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {actions.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">动作</span>
              <div className="flex flex-wrap gap-1">
                {actions.map((action) => (
                  <span key={action.id} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                    {action.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">项目</span>
              <div className="flex flex-wrap gap-1">
                {projects.map((project) => (
                  <span key={project.id} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                    {project.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {entry.status === 'pending' && (
          <button
            onClick={() => onSuggest(entry.id!)}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '生成中...' : '生成建议'}
          </button>
        )}

        {entry.status === 'suggested' && (
          <>
            <button
              onClick={() => onArchive(entry.id!)}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? '处理中...' : '接受归档'}
            </button>
            <button
              onClick={() => onIgnore(entry.id!)}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50"
            >
              {isLoading ? '处理中...' : '忽略'}
            </button>
          </>
        )}

        {entry.status === 'ignored' && (
          <button
            onClick={() => onRestore(entry.id!)}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            {isLoading ? '恢复中...' : '恢复'}
          </button>
        )}

        {entry.status === 'archived' && (
          <span className="text-sm text-green-600">已归档完成</span>
        )}
      </div>
    </div>
  )
}