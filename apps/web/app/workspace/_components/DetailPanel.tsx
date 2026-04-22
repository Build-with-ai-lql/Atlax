'use client'

import { useState } from 'react'

import { dedupeTagNames, extractSuggestedTagNames, groupSuggestionsByType, normalizeTagName } from '@atlax/domain'

import type { DockItem, StoredEntry, StoredTag } from '@/lib/repository'
import type { EntryStatus } from '@/lib/types'

import type { ViewType } from './Sidebar'
import EmptyState from './EmptyState'
import TagEditor from './TagEditor'

const STATUS_CONFIG: Record<EntryStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  suggested: { label: '已建议', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  archived: { label: '已归档', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  ignored: { label: '已忽略', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
  reopened: { label: '重新整理', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
}

const TYPE_LABELS: Record<string, string> = {
  note: '笔记',
  meeting: '会议',
  idea: '想法',
  task: '任务',
  reading: '阅读',
}

const VIEW_EMPTY_HINTS: Record<Exclude<ViewType, 'dock'>, { title: string; description: string; hint: string }> = {
  entries: {
    title: 'Entries',
    description: '选择左侧归档条目查看详情',
    hint: '可按类型、状态、标签、项目筛选，点击条目查看详情与关联关系',
  },
  review: {
    title: 'Review',
    description: '知识库概览与最近归档内容',
    hint: '查看统计、浏览最近归档，或回到 Dock 继续整理',
  },
}

interface DetailPanelProps {
  activeView: ViewType
  item: DockItem | null
  archivedEntry: StoredEntry | null
  existingTags: StoredTag[]
  dismissedSuggestions: string[]
  onSuggest: (id: number) => Promise<void>
  onArchive: (id: number) => Promise<void>
  onIgnore: (id: number) => Promise<void>
  onRestore: (id: number) => Promise<void>
  onReopen: (dockItemId: number) => Promise<void>
  onAddTag: (id: number, tagName: string) => Promise<void>
  onRemoveTag: (id: number, tagName: string) => Promise<void>
  onDismissSuggestion: (tagName: string) => void
  onUpdateEntry: (entryId: number, updates: { tags?: string[]; project?: string | null; content?: string; title?: string }) => Promise<void>
  actionLoading: boolean
}

function ReasonBadge({ reason }: { reason?: string }) {
  if (!reason) return null
  return (
    <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded" title={reason}>
      {reason}
    </span>
  )
}

function ArchivedEntryDetail({
  archivedEntry,
  onReopen,
  onUpdateEntry,
  actionLoading,
}: {
  archivedEntry: StoredEntry
  onReopen: (dockItemId: number) => Promise<void>
  onUpdateEntry: (entryId: number, updates: { tags?: string[]; project?: string | null; content?: string; title?: string }) => Promise<void>
  actionLoading: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(archivedEntry.content)
  const [editProject, setEditProject] = useState(archivedEntry.project ?? '')
  const [editTags, setEditTags] = useState(archivedEntry.tags)
  const [newTagInput, setNewTagInput] = useState('')
  const [relationsExpanded, setRelationsExpanded] = useState(false)

  const handleSave = async () => {
    const updates: { tags?: string[]; project?: string | null; content?: string } = {}
    if (editContent !== archivedEntry.content) updates.content = editContent
    if (editTags !== archivedEntry.tags) updates.tags = editTags
    const newProject = editProject.trim() || null
    if (newProject !== archivedEntry.project) updates.project = newProject

    if (Object.keys(updates).length > 0) {
      await onUpdateEntry(archivedEntry.id, updates)
    }
    setEditing(false)
  }

  const handleCancel = () => {
    setEditContent(archivedEntry.content)
    setEditProject(archivedEntry.project ?? '')
    setEditTags(archivedEntry.tags)
    setEditing(false)
  }

  const handleAddTag = () => {
    const normalized = normalizeTagName(newTagInput)
    if (!normalized) return
    setEditTags(dedupeTagNames([...editTags, normalized]))
    setNewTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag))
  }

  if (editing) {
    return (
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-50 border-green-200 text-green-700">
              {TYPE_LABELS[archivedEntry.type] ?? archivedEntry.type}
            </span>
            <span className="text-xs text-gray-400">
              编辑模式
            </span>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {archivedEntry.title}
          </h2>

          <div className="mb-6">
            <label className="text-xs text-gray-500 font-medium mb-1 block">内容</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[120px] px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 font-medium mb-2 block">标签</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {editTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-green-500 hover:text-green-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                placeholder="添加标签…"
                className="flex-1 px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <button
                onClick={handleAddTag}
                disabled={!normalizeTagName(newTagInput)}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 font-medium mb-2 block">项目</label>
            <input
              type="text"
              value={editProject}
              onChange={(e) => setEditProject(e.target.value)}
              placeholder="输入项目名称…"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? '保存中…' : '保存修改'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
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
            onClick={() => setEditing(true)}
            className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            编辑
          </button>
          <button
            onClick={() => onReopen(archivedEntry.sourceDockItemId)}
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

export default function DetailPanel({
  activeView,
  item,
  archivedEntry,
  existingTags,
  dismissedSuggestions,
  onSuggest,
  onArchive,
  onIgnore,
  onRestore,
  onReopen,
  onAddTag,
  onRemoveTag,
  onDismissSuggestion,
  onUpdateEntry,
  actionLoading,
}: DetailPanelProps) {
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
      <ArchivedEntryDetail
        archivedEntry={archivedEntry}
        onReopen={onReopen}
        onUpdateEntry={onUpdateEntry}
        actionLoading={actionLoading}
      />
    )
  }

  if (activeView !== 'dock') {
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

  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <p className="text-gray-300 text-sm">选择左侧条目查看详情与整理建议</p>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[item.status]
  const grouped = groupSuggestionsByType(item.suggestions)
  const suggestedTags = extractSuggestedTagNames(grouped)

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(item.createdAt).toLocaleString('zh-CN')}
          </span>
        </div>

        <div className="mb-8">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-[15px]">
            {item.rawText}
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
              <ReasonBadge reason={grouped.category.reason} />
            </div>
          )}

          <TagEditor
            suggestedTags={suggestedTags}
            suggestedTagDetails={grouped.tags}
            userTags={item.userTags ?? []}
            existingTags={existingTags}
            dismissedSuggestions={dismissedSuggestions}
            onAddTag={(name) => onAddTag(item.id, name)}
            onRemoveTag={(name) => onRemoveTag(item.id, name)}
            onDismissSuggestion={onDismissSuggestion}
            disabled={actionLoading}
          />

          {grouped.actions.length > 0 && (
            <div className="flex items-start gap-2 mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs text-gray-400 w-10 flex-shrink-0 pt-0.5">动作</span>
              <div className="flex flex-wrap gap-1.5">
                {grouped.actions.map((action) => (
                  <span key={action.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                    {action.label}
                    {action.reason && <ReasonBadge reason={action.reason} />}
                  </span>
                ))}
              </div>
            </div>
          )}

          {grouped.projects.length > 0 && (
            <div className="flex items-start gap-2 mt-3">
              <span className="text-xs text-gray-400 w-10 flex-shrink-0 pt-0.5">项目</span>
              <div className="flex flex-wrap gap-1.5">
                {grouped.projects.map((project) => (
                  <span key={project.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                    {project.label}
                    {project.reason && <ReasonBadge reason={project.reason} />}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {item.status === 'pending' && (
            <button
              onClick={() => onSuggest(item.id)}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? '生成中…' : '生成建议'}
            </button>
          )}
          {item.status === 'suggested' && (
            <>
              <button
                onClick={() => onArchive(item.id)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? '处理中…' : '接受归档'}
              </button>
              <button
                onClick={() => onIgnore(item.id)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? '处理中…' : '忽略'}
              </button>
            </>
          )}
          {item.status === 'ignored' && (
            <button
              onClick={() => onRestore(item.id)}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? '恢复中…' : '恢复到 Dock'}
            </button>
          )}
          {item.status === 'reopened' && (
            <button
              onClick={() => onSuggest(item.id)}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? '生成中…' : '重新生成建议'}
            </button>
          )}
          {item.status === 'archived' && (
            <span className="text-sm text-green-600 flex items-center gap-1">✓ 已归档</span>
          )}
        </div>
      </div>
    </div>
  )
}
