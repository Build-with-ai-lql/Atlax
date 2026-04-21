'use client'

import { useState } from 'react'

import { extractSuggestedTagNames, groupSuggestionsByType } from '@atlax/domain'

import type { InboxEntry, StoredEntry, StoredTag } from '@/lib/repository'
import type { EntryStatus } from '@/lib/types'

import type { ViewType } from './Sidebar'
import EmptyState from './EmptyState'
import TagEditor from './TagEditor'

const STATUS_CONFIG: Record<EntryStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  suggested: { label: '已建议', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  archived: { label: '已归档', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  ignored: { label: '已忽略', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
}

const TYPE_LABELS: Record<string, string> = {
  note: '笔记',
  meeting: '会议',
  idea: '想法',
  task: '任务',
  reading: '阅读',
}

const VIEW_EMPTY_HINTS: Record<Exclude<ViewType, 'inbox'>, { title: string; description: string; hint: string }> = {
  entries: {
    title: 'Entries',
    description: '选择左侧条目查看归档详情',
    hint: 'Phase 2.5 将实现完整 Entries 浏览与筛选',
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
  archivedEntry: StoredEntry | null
  existingTags: StoredTag[]
  onSuggest: (id: number) => Promise<void>
  onArchive: (id: number) => Promise<void>
  onIgnore: (id: number) => Promise<void>
  onRestore: (id: number) => Promise<void>
  onReopen: (inboxEntryId: number) => Promise<void>
  onAddTag: (id: number, tagName: string) => Promise<void>
  onRemoveTag: (id: number, tagName: string) => Promise<void>
  actionLoading: boolean
}

export default function DetailPanel({
  activeView,
  entry,
  archivedEntry,
  existingTags,
  onSuggest,
  onArchive,
  onIgnore,
  onRestore,
  onReopen,
  onAddTag,
  onRemoveTag,
  actionLoading,
}: DetailPanelProps) {
  const [relationsExpanded, setRelationsExpanded] = useState(false)
  if (activeView === 'entries') {
    if (!archivedEntry) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50/50">
          <EmptyState
            title={VIEW_EMPTY_HINTS.entries.title}
            description={VIEW_EMPTY_HINTS.entries.description}
            hint={VIEW_EMPTY_HINTS.entries.hint}
          />
        </div>
      )
    }

    return (
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-50 border-green-200 text-green-700">
              {TYPE_LABELS[archivedEntry.type] ?? archivedEntry.type}
            </span>
            <span className="text-xs text-gray-400">
              归档于 {new Date(archivedEntry.archivedAt).toLocaleString('zh-CN')}
            </span>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {archivedEntry.title}
          </h2>

          <div className="mb-6">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-[15px]">
              {archivedEntry.content}
            </p>
          </div>

          {archivedEntry.tags.length > 0 && (
            <div className="mb-4">
              <span className="text-xs text-gray-400 mb-2 block">标签</span>
              <div className="flex flex-wrap gap-1.5">
                {archivedEntry.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {archivedEntry.project && (
            <div className="mb-4">
              <span className="text-xs text-gray-400 mb-2 block">项目</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                {archivedEntry.project}
              </span>
            </div>
          )}

          {archivedEntry.actions.length > 0 && (
            <div>
              <span className="text-xs text-gray-400 mb-2 block">动作</span>
              <div className="flex flex-wrap gap-1.5">
                {archivedEntry.actions.map((action) => (
                  <span key={action} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                    {action}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setRelationsExpanded((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              关联关系
              <svg className={`w-3 h-3 transition-transform ${relationsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {relationsExpanded && (
              <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                <p className="text-xs text-indigo-500 mb-2">此条目的关联内容</p>
                <div className="space-y-1.5">
                  {archivedEntry.tags.map((tag) => (
                    <div key={tag} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
                      <span>标签：{tag}</span>
                    </div>
                  ))}
                  {archivedEntry.project && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-300 flex-shrink-0" />
                      <span>项目：{archivedEntry.project}</span>
                    </div>
                  )}
                  {archivedEntry.tags.length === 0 && !archivedEntry.project && (
                    <p className="text-xs text-gray-400">暂无关联关系</p>
                  )}
                </div>
                <p className="text-[10px] text-gray-300 mt-3">关系图谱与智能关联将在后续版本中实现</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-6 mt-6 border-t border-gray-100">
            <button
              onClick={() => onReopen(archivedEntry.sourceInboxEntryId)}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? '处理中…' : '重新整理'}
            </button>
          </div>
        </div>
      </div>
    )
  }

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
  const suggestedTags = extractSuggestedTagNames(grouped)

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

        <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            整理区
          </h4>

          {grouped.category && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-400 w-10 flex-shrink-0">分类</span>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded text-sm font-medium">
                {grouped.category.label}
              </span>
            </div>
          )}

          <TagEditor
            suggestedTags={suggestedTags}
            userTags={entry.userTags ?? []}
            existingTags={existingTags}
            onAddTag={(name) => onAddTag(entry.id, name)}
            onRemoveTag={(name) => onRemoveTag(entry.id, name)}
            disabled={actionLoading}
          />

          {grouped.actions.length > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
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
            <div className="flex items-center gap-2 mt-3">
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