'use client'

import type { EntryStatus } from '@/lib/types'

interface EntriesFilterBarProps {
  filterType: string | null
  filterTag: string | null
  filterProject: string | null
  filterStatus: EntryStatus | null
  availableTypes: string[]
  availableTags: string[]
  availableProjects: string[]
  availableStatuses: EntryStatus[]
  onFilterType: (type: string | null) => void
  onFilterTag: (tag: string | null) => void
  onFilterProject: (project: string | null) => void
  onFilterStatus: (status: EntryStatus | null) => void
}

const TYPE_LABELS: Record<string, string> = {
  note: '笔记',
  meeting: '会议',
  idea: '想法',
  task: '任务',
  reading: '阅读',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  suggested: '已建议',
  archived: '已归档',
  ignored: '已忽略',
  reopened: '重新整理',
}

export default function EntriesFilterBar({
  filterType,
  filterTag,
  filterProject,
  filterStatus,
  availableTypes,
  availableTags,
  availableProjects,
  availableStatuses,
  onFilterType,
  onFilterTag,
  onFilterProject,
  onFilterStatus,
}: EntriesFilterBarProps) {
  const hasActiveFilter = filterType || filterTag || filterProject || filterStatus

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {availableStatuses.length > 0 && (
          <select
            value={filterStatus ?? ''}
            onChange={(e) => onFilterStatus((e.target.value as EntryStatus) || null)}
            className="text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">全部状态</option>
            {availableStatuses.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
            ))}
          </select>
        )}

        {availableTypes.length > 0 && (
          <select
            value={filterType ?? ''}
            onChange={(e) => onFilterType(e.target.value || null)}
            className="text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">全部类型</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
            ))}
          </select>
        )}

        {availableTags.length > 0 && (
          <select
            value={filterTag ?? ''}
            onChange={(e) => onFilterTag(e.target.value || null)}
            className="text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">全部标签</option>
            {availableTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}

        {availableProjects.length > 0 && (
          <select
            value={filterProject ?? ''}
            onChange={(e) => onFilterProject(e.target.value || null)}
            className="text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">全部项目</option>
            {availableProjects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}

        {hasActiveFilter && (
          <button
            onClick={() => {
              onFilterType(null)
              onFilterTag(null)
              onFilterProject(null)
              onFilterStatus(null)
            }}
            className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1.5"
          >
            清除筛选
          </button>
        )}
      </div>
    </div>
  )
}
