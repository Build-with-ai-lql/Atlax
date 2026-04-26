import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Folder, Hash, Briefcase, Network, Clock, LayoutGrid, Table2, Loader2, Maximize2, ChevronRight, X } from 'lucide-react'
import { StructureProjection, StoredEntry, listEntryTagRelations } from '@/lib/repository'
import WorldTreeView from './WorldTreeView'

export type EntriesViewMode = 'list' | 'finder' | 'table' | 'world_tree' | 'time_machine'

interface StructureViewsProps {
  mode: EntriesViewMode
  structureData: StructureProjection | null
  loading: boolean
  entries: StoredEntry[]
  userId: string
  onRefresh: () => Promise<void>
  onSelectEntry: (id: number) => void
  selectedEntryId: number | null
  onOpenGlobalDetail?: (id: number) => void
}

const TYPE_LABELS: Record<string, string> = {
  note: '笔记', meeting: '会议', idea: '想法', task: '任务', reading: '阅读',
}


export function StructureViewSwitcher({ mode, setMode }: { mode: EntriesViewMode, setMode: (m: EntriesViewMode) => void }) {
  const modes = [
    { id: 'list', label: '列表', icon: LayoutGrid },
    { id: 'finder', label: 'Finder', icon: Folder },
    { id: 'table', label: '表格', icon: Table2 },
    { id: 'world_tree', label: 'World Tree', icon: Network },
    { id: 'time_machine', label: 'Time Machine', icon: Clock },
  ] as const

  return (
    <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-white/5 p-1 rounded-xl mb-4 self-start">
      {modes.map((m) => {
        const Icon = m.icon
        const isActive = mode === m.id
        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white dark:bg-[#1C1C1E] text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/10'
            }`}
          >
            <Icon size={14} />
            {m.label}
          </button>
        )
      })}
    </div>
  )
}

function FinderView({ structureData, entries, userId, onOpenGlobalDetail }: Omit<StructureViewsProps, 'mode' | 'loading' | 'onRefresh' | 'onSelectEntry' | 'selectedEntryId'>) {
  const [selectedNode, setSelectedNode] = useState<{type: 'collection' | 'tag', id: string} | null>(null)
  const [finderPreviewEntryId, setFinderPreviewEntryId] = useState<number | null>(null)
  const [tagEntryIds, setTagEntryIds] = useState<Map<string, Set<number>>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  const handleEntryClick = useCallback((id: number) => {
    setFinderPreviewEntryId(id)
  }, [])

  const handleOpenGlobalEdit = useCallback(() => {
    if (finderPreviewEntryId && onOpenGlobalDetail) {
      onOpenGlobalDetail(finderPreviewEntryId)
    }
  }, [finderPreviewEntryId, onOpenGlobalDetail])

  // Clear preview when category changes
  useEffect(() => {
    setFinderPreviewEntryId(null)
  }, [selectedNode])

  useEffect(() => {
    if (!structureData || !userId) return
    listEntryTagRelations(userId).then((rels) => {
      const map = new Map<string, Set<number>>()
      for (const r of rels) {
        const existing = map.get(r.tagId) ?? new Set<number>()
        existing.add(r.entryId)
        map.set(r.tagId, existing)
      }
      setTagEntryIds(map)
    })
  }, [structureData, userId])

  const displayEntries = useMemo(() => {
    if (!selectedNode) return entries
    if (selectedNode.type === 'tag') {
      const entryIdSet = tagEntryIds.get(selectedNode.id)
      if (!entryIdSet) return []
      return entries.filter((e) => entryIdSet.has(e.id))
    }
    if (selectedNode.type === 'collection') {
      const col = structureData?.collections.find((c) => c.collectionId === selectedNode.id)
      if (col && col.collectionType === 'project') {
        return entries.filter((e) => e.project === col.name)
      }
      return entries
    }
    return entries
  }, [entries, selectedNode, structureData, tagEntryIds])


  const tags = structureData?.tags || []
  const projects = structureData?.collections.filter((c) => c.collectionType === 'project') || []
  const folders = structureData?.collections.filter((c) => c.collectionType === 'folder') || []

  return (
    <div ref={containerRef} className="flex h-[640px] border border-slate-200 dark:border-white/10 rounded-2xl overflow-x-auto bg-white dark:bg-[#1C1C1E] relative custom-scrollbar">
      {/* Left: Navigation */}
      <div className="w-[240px] border-r border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 overflow-y-auto p-3 space-y-4 flex-shrink-0">
        {folders.length > 0 && (
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Folders</div>
            {folders.map((f) => (
              <button
                key={f.collectionId}
                onClick={() => setSelectedNode({type: 'collection', id: f.collectionId})}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${selectedNode?.id === f.collectionId ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'}`}
              >
                <Folder size={14} />
                <span className="truncate">{f.name}</span>
                <span className="ml-auto text-xs text-slate-400">{f.entryCount}</span>
              </button>
            ))}
          </div>
        )}
        {projects.length > 0 && (
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Projects</div>
            {projects.map((p) => (
              <button
                key={p.collectionId}
                onClick={() => setSelectedNode({type: 'collection', id: p.collectionId})}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${selectedNode?.id === p.collectionId ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'}`}
              >
                <Briefcase size={14} />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        )}
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Tags</div>
          {tags.map((t) => (
            <button
              key={t.tagId}
              onClick={() => setSelectedNode({type: 'tag', id: t.tagId})}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${selectedNode?.id === t.tagId ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'}`}
            >
              <Hash size={14} />
              <span className="truncate">{t.name}</span>
              <span className="ml-auto text-xs text-slate-400">{t.entryCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Middle: Entry List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-w-[320px]">
        {displayEntries.length === 0 && (
          <div className="text-sm text-slate-400 text-center mt-10">
            {selectedNode ? '该分类下暂无条目' : '暂无归档条目'}
          </div>
        )}
        {displayEntries.map((e) => {
          const structEntry = structureData?.entries.find((se) => se.entryId === e.id)
          const relCount = structEntry?.relationCount ?? 0
          const isSelected = finderPreviewEntryId === e.id
          return (
            <div
              key={e.id}
              onClick={() => handleEntryClick(e.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-50/30 dark:border-blue-500/50 dark:bg-blue-500/10 shadow-sm' : 'border-slate-100 hover:border-slate-200 dark:border-white/5 dark:hover:border-white/10'}`}
            >
              <div className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                {e.title}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>{TYPE_LABELS[e.type] || e.type}</span>
                <span>·</span>
                <span>{new Date(e.archivedAt).toLocaleDateString()}</span>
                {relCount > 0 && (
                  <>
                    <span>·</span>
                    <span>{relCount} 关系</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Right: Preview Only */}
      {finderPreviewEntryId && (
        <div
          className="w-[420px] border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] flex flex-col flex-shrink-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <Inspector
              entry={entries.find((e) => e.id === finderPreviewEntryId)}
              structureData={structureData}
              entries={entries}
              onOpenGlobalDetail={handleOpenGlobalEdit}
              onClose={() => setFinderPreviewEntryId(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Inspector({ entry, structureData, entries, onOpenGlobalDetail, onClose }: {
  entry: StoredEntry | undefined
  structureData: StructureProjection | null
  entries: StoredEntry[]
  onOpenGlobalDetail?: () => void
  onClose?: () => void
}) {

  if (!entry) return null

  const relations = structureData?.relations.filter(
    (r) => r.sourceEntryId === entry.id || r.targetEntryId === entry.id
  ) || []



  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight break-words">{entry.title}</h3>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded text-[10px] font-medium">{TYPE_LABELS[entry.type] || entry.type}</span>
              <span>·</span>
              <span>归档于 {new Date(entry.archivedAt).toLocaleDateString()}</span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"
              title="关闭"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {onOpenGlobalDetail && (
          <button
            onClick={onOpenGlobalDetail}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-[0.98]"
          >
            <Maximize2 size={16} />
            打开详情 / 进入编辑
          </button>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-4 border border-slate-100 dark:border-white/5 relative group">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">内容概要</div>
        <div className="relative max-h-[300px] overflow-hidden">
          <p className="text-[13px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-[12]">
            {entry.content || <span className="italic opacity-50">暂无内容</span>}
          </p>
          {entry.content && entry.content.length > 200 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 dark:from-[#1C1C1E] to-transparent pointer-events-none" />
          )}
        </div>
        {entry.content && entry.content.length > 200 && onOpenGlobalDetail && (
          <button
            onClick={onOpenGlobalDetail}
            className="mt-2 text-[11px] text-blue-500 font-medium hover:underline flex items-center gap-1"
          >
            查看全文 / 编辑 <ChevronRight size={10} />
          </button>
        )}
      </div>

      {entry.project && (
        <div className="px-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">所属项目</div>
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <Briefcase size={14} className="text-slate-400" />
            {entry.project}
          </div>
        </div>
      )}

      {entry.tags.length > 0 && (
        <div className="px-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">标签分类</div>
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map((t) => (
              <span key={t} className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                #{t}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="px-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">关联信息</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
            <Network size={14} className="text-blue-500" />
            <span>当前共有 {relations.length} 个知识关联</span>
          </div>
          {relations.length > 0 && (
            <div className="pl-3 space-y-1.5">
              {relations.slice(0, 5).map((r, idx) => {
                const otherId = r.sourceEntryId === entry.id ? r.targetEntryId : r.sourceEntryId
                const otherEntry = entries.find(e => e.id === otherId)
                return (
                  <div key={idx} className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    {otherEntry?.title || `关联条目 #${otherId}`}
                  </div>
                )
              })}
              {relations.length > 5 && <div className="text-[10px] text-slate-400 italic pl-2.5">... 及其他 {relations.length - 5} 个关联</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TableView({ entries, structureData }: { entries: StoredEntry[], structureData: StructureProjection | null }) {
  const relationCountMap = useMemo(() => {
    const map = new Map<number, number>()
    if (structureData) {
      for (const r of structureData.relations) {
        map.set(r.sourceEntryId, (map.get(r.sourceEntryId) ?? 0) + 1)
        map.set(r.targetEntryId, (map.get(r.targetEntryId) ?? 0) + 1)
      }
    }
    return map
  }, [structureData])

  return (
    <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#1C1C1E]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">类型</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Relations</th>
              <th className="px-4 py-3 font-medium">归档时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{e.title}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 dark:bg-white/10 rounded-md text-xs">{TYPE_LABELS[e.type] || e.type}</span></td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{e.project || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {e.tags.map((t) => <span key={t} className="text-xs text-slate-500">#{t}</span>)}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{relationCountMap.get(e.id) ?? 0}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(e.archivedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


export function StructureViews({ mode, structureData, loading, entries, userId, onSelectEntry, selectedEntryId, onOpenGlobalDetail }: StructureViewsProps) {
  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400" /></div>
  }

  return (
    <div className="flex flex-col">
      {mode === 'finder' && (
        <FinderView
          structureData={structureData}
          entries={entries}
          userId={userId}
          onOpenGlobalDetail={onOpenGlobalDetail}
        />
      )}
      {mode === 'table' && <TableView entries={entries} structureData={structureData} />}
      {mode === 'world_tree' && (
        <WorldTreeView
          structureData={structureData}
          entries={entries}
          onOpenGlobalDetail={onOpenGlobalDetail}
        />
      )}
      {mode === 'time_machine' && (
        <TimeMachineView
          entries={entries}
          onSelectEntry={onSelectEntry}
          selectedEntryId={selectedEntryId}
        />
      )}
    </div>
  )
}

function TimeMachineView({ entries, onSelectEntry, selectedEntryId }: {
  entries: StoredEntry[]
  onSelectEntry: (id: number) => void
  selectedEntryId: number | null
}) {
  const groups = useMemo(() => {
    const map = new Map<string, StoredEntry[]>()
    ;[...entries].sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()).forEach(e => {
      const date = new Date(e.archivedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
      const group = map.get(date) ?? []
      group.push(e)
      map.set(date, group)
    })
    return Array.from(map.entries())
  }, [entries])

  return (
    <div className="h-[640px] overflow-y-auto p-6 space-y-8 bg-slate-50/30 dark:bg-black/10 rounded-2xl border border-slate-200 dark:border-white/10">
      {groups.map(([date, dateEntries]) => (
        <div key={date} className="relative pl-8">
          <div className="absolute left-3 top-2 bottom-0 w-0.5 bg-slate-200 dark:bg-white/10" />
          <div className="absolute left-1.5 top-2 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-[#1C1C1E] z-10" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">{date}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dateEntries.map(e => (
              <div
                key={e.id}
                onClick={() => onSelectEntry(e.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedEntryId === e.id ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'bg-white dark:bg-white/5 border-slate-100 hover:border-slate-200 dark:border-white/5 dark:hover:border-white/10'}`}
              >
                <div className="text-xs text-slate-400 mb-1">{new Date(e.archivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{e.title}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {e.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-slate-500">#{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
