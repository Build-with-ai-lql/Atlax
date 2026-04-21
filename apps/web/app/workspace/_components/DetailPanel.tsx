'use client'

import { groupSuggestionsByType } from '@atlax/domain'

import type { InboxEntry } from '@/lib/repository'
import type { EntryStatus } from '@/lib/types'

import type { ViewType } from './Sidebar'
import EmptyState from './EmptyState'

const STATUS_CONFIG: Record<EntryStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  suggested: { label: '已建议', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  archived: { label: '已归档', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  ignored: { label: '已忽略', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
}

const VIEW_EMPTY_HINTS: Record<Exclude<ViewType, 'inbox'>, { title: string; description: string; hint: string }> = {
  entries: {
    title: 'Entries',
    description: '归档后的知识单元会在这里展示详情',
    hint: 'Phase 2.3 将实现完整归档与 Entry 详情',
  },
  review: {
    title: 'Review',
    description: '选中条目的回顾与激活信息会在这里展示',
    hint: 'Phase 2.5 将实现完整 Review 功能',
  },
}

interface DetailPanelProps {
  activeView: ViewType
  entry: InboxEntry | null
  onSuggest: (id: number) => Promise<void>
  onArchive: (id: number) => Promise<void>
  onIgnore: (id: number) => Promise<void>
  onRestore: (id: number) => Promise<void>
  actionLoading: boolean
}

export default function DetailPanel({
  activeView,
  entry,
  onSuggest,
  onArchive,
  onIgnore,
  onRestore,
  actionLoading,
}: DetailPanelProps) {
  if (activeView !== 'inbox') {
    const hint = VIEW_EMPTY_HINTS[activeView]
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50/50">
        <EmptyState
          title={hint.title}
          description={hint.description}
          hint={hint.hint}
        />
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <p className="text-gray-300 text-sm">选择左侧条目查看详情</p>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[entry.status]
  const grouped = groupSuggestionsByType(entry.suggestions)

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(entry.createdAt).toLocaleString('zh-CN')}
          </span>
        </div>

        <div className="mb-8">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-[15px]">
            {entry.rawText}
          </p>
        </div>

        {entry.status === 'suggested' && entry.suggestions.length > 0 && (
          <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              系统建议
            </h4>

            {grouped.category && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-400 w-10 flex-shrink-0">分类</span>
                <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded text-sm font-medium">
                  {grouped.category.label}
                </span>
              </div>
            )}

            {grouped.tags.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-400 w-10 flex-shrink-0">标签</span>
                <div className="flex flex-wrap gap-1.5">
                  {grouped.tags.map((tag) => (
                    <span key={tag.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {grouped.actions.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-400 w-10 flex-shrink-0">动作</span>
                <div className="flex flex-wrap gap-1.5">
                  {grouped.actions.map((action) => (
                    <span key={action.id} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                      {action.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {grouped.projects.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-10 flex-shrink-0">项目</span>
                <div className="flex flex-wrap gap-1.5">
                  {grouped.projects.map((project) => (
                    <span key={project.id} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                      {project.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {entry.status === 'pending' && (
            <button
              onClick={() => onSuggest(entry.id)}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? '生成中…' : '生成建议'}
            </button>
          )}
          {entry.status === 'suggested' && (
            <>
              <button
                onClick={() => onArchive(entry.id)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? '处理中…' : '接受归档'}
              </button>
              <button
                onClick={() => onIgnore(entry.id)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? '处理中…' : '忽略'}
              </button>
            </>
          )}
          {entry.status === 'ignored' && (
            <button
              onClick={() => onRestore(entry.id)}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? '恢复中…' : '恢复到 Inbox'}
            </button>
          )}
          {entry.status === 'archived' && (
            <span className="text-sm text-green-600 flex items-center gap-1">✓ 已归档</span>
          )}
        </div>
      </div>
    </div>
  )
}
