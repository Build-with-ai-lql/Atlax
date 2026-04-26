'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Dock, Plus, Send, Loader2, X, Sparkles,
  PenTool, Minimize2, ChevronRight
} from 'lucide-react'

import { getCurrentUser, registerUser, type LocalUser } from '@/lib/auth'
import {
  archiveItem,
  createDockItem,
  listDockItems,
  listArchivedEntries,
  listTags,
  reopenItem,
  suggestItem,
  updateDockItemText,
  type DockItem,
  type StoredEntry,
  type StoredTag,
} from '@/lib/repository'
import type { EntryStatus } from '@/lib/types'
import { recordEvent, type AppMode } from '@/lib/events'

type ActiveModule = 'editor' | 'mind' | 'dock'

const STATUS_LABELS: Record<EntryStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20' },
  suggested: { label: '已建议', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
  archived: { label: '已归档', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20' },
  ignored: { label: '已忽略', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10 border-gray-500/20' },
  reopened: { label: '重新整理', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20' },
}

export default function WorkspacePage() {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [activeModule, setActiveModule] = useState<ActiveModule>('mind')

  const [items, setItems] = useState<DockItem[]>([])
  const [archivedEntries, setArchivedEntries] = useState<StoredEntry[]>([])
  const [existingTags, setExistingTags] = useState<StoredTag[]>([])
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recorderState, setRecorderState] = useState<'closed' | 'classic' | 'chat'>('closed')
  const [inputMode, setInputMode] = useState<AppMode>('chat')
  const [inputText, setInputText] = useState('')

  const [editorContent, setEditorContent] = useState('')
  const [editorTitle, setEditorTitle] = useState('')
  const [editingItemId, setEditingItemId] = useState<number | null>(null)

  const [mindInputText, setMindInputText] = useState('')
  const [registerName, setRegisterName] = useState('')

  const userId = user?.id || ''

  useEffect(() => {
    const current = getCurrentUser()
    setUser(current)
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('atlax_active_module', activeModule)
  }, [activeModule])

  const loadData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [dockItems, entries, tags] = await Promise.all([
        listDockItems(userId),
        listArchivedEntries(userId),
        listTags(userId),
      ])
      setItems(dockItems)
      setArchivedEntries(entries)
      setExistingTags(tags)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) loadData()
  }, [userId, loadData])

  const handleCapture = useCallback(async (text: string) => {
    if (!text.trim() || !userId) return
    try {
      const newId = await createDockItem(userId, text.trim())
      await loadData()
      recordEvent(userId, { type: 'capture_created', sourceType: 'text', dockItemId: newId })
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
    }
  }, [userId, loadData])

  const handleSuggest = useCallback(async (itemId: number) => {
    if (!userId) return
    try {
      await suggestItem(userId, itemId)
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : '建议生成失败')
    }
  }, [userId, loadData])

  const handleArchive = useCallback(async (itemId: number) => {
    if (!userId) return
    try {
      await archiveItem(userId, itemId)
      await loadData()
      setSelectedItemId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '归档失败')
    }
  }, [userId, loadData])

  const handleReopen = useCallback(async (itemId: number) => {
    if (!userId) return
    try {
      await reopenItem(userId, itemId)
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : '重新打开失败')
    }
  }, [userId, loadData])

  const handleUpdateText = useCallback(async (itemId: number, text: string) => {
    if (!userId) return
    try {
      await updateDockItemText(userId, itemId, text)
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败')
    }
  }, [userId, loadData])

  const handleOpenEditor = useCallback((itemId: number) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      setEditingItemId(itemId)
      setEditorTitle(item.topic || item.rawText.slice(0, 50))
      setEditorContent(item.rawText)
      setActiveModule('editor')
    }
  }, [items])

  const handleSaveEditor = useCallback(async () => {
    if (!editingItemId || !userId) return
    try {
      await updateDockItemText(userId, editingItemId, editorContent)
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    }
  }, [editingItemId, userId, editorContent, loadData])

  const handleModuleChange = useCallback((mod: ActiveModule) => {
    setActiveModule(mod)
    if (mod !== 'editor') {
      setEditingItemId(null)
    }
  }, [])

  const handleMindInput = useCallback(async () => {
    if (!mindInputText.trim()) return
    await handleCapture(mindInputText.trim())
    setMindInputText('')
  }, [mindInputText, handleCapture])

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#030508]">
        <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    const handleRegister = () => {
      if (!registerName.trim()) return
      const newUser = registerUser(registerName.trim())
      setUser(newUser)
    }
    return (
      <div className="dark">
        <div className="flex h-screen w-full bg-[#030508] text-slate-200 font-sans items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute top-[20%] left-[15%] w-[300px] h-[300px] bg-indigo-500/[0.04] rounded-full blur-[100px]" />
            <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
          </div>
          <div className="relative z-10 w-full max-w-sm px-6">
            <div className="bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-8">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-400 rounded-[10px] opacity-90" />
                  <div className="w-2 h-2 bg-white rounded-full z-10" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold tracking-[0.3em] text-slate-400 uppercase">ATLAX</span>
                  <div className="h-3 w-px bg-white/10" />
                  <span className="text-[11px] tracking-wide text-slate-500 font-mono">MindDock</span>
                </div>
              </div>
              <h2 className="text-lg font-medium text-white mb-2">Welcome</h2>
              <p className="text-sm text-slate-500 mb-6">输入你的名字开始使用</p>
              <input
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleRegister()
                }}
                placeholder="你的名字"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white outline-none focus:border-emerald-500/30 placeholder-slate-600 mb-4"
                autoFocus
              />
              <button
                onClick={handleRegister}
                disabled={!registerName.trim()}
                className="w-full py-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-30"
              >
                进入工作区
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const selectedItem = items.find(i => i.id === selectedItemId) ?? null

  return (
    <div className="dark">
      <div className="flex flex-col h-screen w-full bg-[#030508] text-slate-200 font-sans overflow-hidden selection:bg-emerald-500/20">

        {/* ===== Top Navigation Bar ===== */}
        <nav className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#030508]/90 backdrop-blur-md z-50 flex-shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="relative w-8 h-8 flex items-center justify-center cursor-pointer group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-400 rounded-[10px] opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 rounded-[10px] bg-gradient-to-b from-white/30 via-transparent to-transparent" />
              <div className="w-2 h-2 bg-white rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.3)] z-10" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold tracking-[0.3em] text-slate-400 uppercase">ATLAX</span>
              <div className="h-3 w-px bg-white/10" />
              <span className="text-[11px] tracking-wide text-slate-500 font-mono">MindDock</span>
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-8">
            {(['editor', 'mind', 'dock'] as ActiveModule[]).map((mod) => (
              <button
                key={mod}
                onClick={() => handleModuleChange(mod)}
                className={`text-[13px] tracking-wide transition-all duration-300 relative py-1 ${
                  activeModule === mod
                    ? 'text-white font-medium'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {mod.charAt(0).toUpperCase() + mod.slice(1)}
                {activeModule === mod && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setRecorderState(inputMode === 'classic' ? 'classic' : 'chat')}
              className="p-2 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-white/5 transition-colors"
              title="记录"
            >
              <Plus size={18} />
            </button>
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 bg-slate-800 cursor-pointer flex items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400">{user.name.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </nav>

        {/* ===== Main Stage ===== */}
        <div className="flex-1 relative overflow-hidden">

          {/* ---- Mind View ---- */}
          {activeModule === 'mind' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-[#030508]">
                <div className="absolute top-[20%] left-[15%] w-[300px] h-[300px] bg-indigo-500/[0.04] rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-emerald-500/[0.05] rounded-full blur-[80px]" />
              </div>

              <div className="relative z-10 flex flex-col items-center pointer-events-none">
                <h1 className="text-5xl font-light text-white/80 tracking-tight mb-2">
                  Nebula Tree
                </h1>
                <p className="text-sm text-slate-500 mb-12">
                  你的知识星空
                </p>
              </div>

              {items.length > 0 && (
                <div className="absolute top-20 right-8 z-20 pointer-events-auto">
                  <div className="bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 w-56">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">Atlas Status</div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-500">知识节点</span>
                        <span className="text-[15px] font-mono text-white">{items.length}</span>
                      </div>
                      <div className="h-px bg-white/[0.06]" />
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-500">已归档</span>
                        <span className="text-[15px] font-mono text-white">{archivedEntries.length}</span>
                      </div>
                      <div className="h-px bg-white/[0.06]" />
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-500">标签</span>
                        <span className="text-[15px] font-mono text-white">{existingTags.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-12 w-full max-w-2xl px-6 z-20 pointer-events-auto">
                <div className="bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl flex items-center p-2 pl-4">
                  <Sparkles size={16} className="text-emerald-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={mindInputText}
                    onChange={(e) => setMindInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        handleMindInput()
                      }
                    }}
                    placeholder="输入灵感并回车，见证知识成为星云树的新枝桠..."
                    className="flex-1 bg-transparent outline-none px-4 py-2.5 text-[14px] font-light placeholder-slate-600 text-white"
                  />
                  <div className="flex items-center px-3 space-x-2 border-l border-white/[0.06]">
                    <span className="text-[9px] uppercase tracking-widest text-emerald-500/80 font-mono">GROW</span>
                    <kbd className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 border border-white/10 text-slate-500">↵</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---- Editor View ---- */}
          {activeModule === 'editor' && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-3xl mx-auto px-8 py-12">
                {editingItemId ? (
                  <div className="space-y-6">
                    <input
                      type="text"
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      className="w-full bg-transparent text-3xl font-medium outline-none text-white placeholder-slate-600"
                      placeholder="标题"
                    />
                    <textarea
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      className="w-full min-h-[60vh] bg-transparent resize-none outline-none text-base font-light leading-relaxed text-slate-300 placeholder-slate-600"
                      placeholder="开始写作..."
                    />
                    <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                      <button
                        onClick={handleSaveEditor}
                        className="px-5 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => handleModuleChange('dock')}
                        className="px-5 py-2 bg-white/5 text-slate-400 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
                      >
                        返回 Dock
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                    <PenTool size={48} className="opacity-20 mb-6" />
                    <p className="text-lg font-medium text-slate-400 mb-2">Editor</p>
                    <p className="text-sm opacity-60 mb-8">从 Dock 选择内容开始编辑</p>
                    <button
                      onClick={() => handleModuleChange('dock')}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                    >
                      前往 Dock
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---- Dock View ---- */}
          {activeModule === 'dock' && (
            <div className="h-full flex">
              <div className="flex-1 overflow-y-auto px-6 py-6 pb-40">
                <div className="max-w-4xl mx-auto space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-32 opacity-50">
                      <Loader2 className="animate-spin text-slate-400" size={24} />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-red-500 text-sm">{error}</p>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                      <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/[0.06]">
                        <Dock size={32} className="opacity-20" />
                      </div>
                      <p className="text-base font-medium text-slate-400">Dock 虚位以待</p>
                      <p className="text-sm mt-1.5 opacity-50 max-w-[200px] text-center leading-relaxed">
                        每一个伟大的想法，都值得被认真记录
                      </p>
                      <button
                        onClick={() => setRecorderState(inputMode === 'classic' ? 'classic' : 'chat')}
                        className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                      >
                        即刻开始记录
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">{items.length} 条待整理</span>
                      </div>
                      {items.map((item) => (
                        <DockCard
                          key={item.id}
                          item={item}
                          isSelected={selectedItemId === item.id}
                          onSelect={(id) => setSelectedItemId(selectedItemId === id ? null : id)}
                          onArchive={handleArchive}
                          onSuggest={handleSuggest}
                          onOpenEditor={handleOpenEditor}
                          onUpdateText={handleUpdateText}
                          onReopen={handleReopen}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>

              {selectedItem && (
                <div className="w-[420px] border-l border-white/[0.06] bg-[#0A0D14] overflow-y-auto flex-shrink-0">
                  <DockDetailPanel
                    item={selectedItem}
                    onClose={() => setSelectedItemId(null)}
                    onArchive={handleArchive}
                    onSuggest={handleSuggest}
                    onOpenEditor={handleOpenEditor}
                    onUpdateText={handleUpdateText}
                    onReopen={handleReopen}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== Floating Recorder ===== */}
        <FloatingRecorder
          recorderState={recorderState}
          setRecorderState={setRecorderState}
          inputMode={inputMode}
          setInputMode={setInputMode}
          inputText={inputText}
          setInputText={setInputText}
          onCapture={handleCapture}
        />
      </div>
    </div>
  )
}

function DockCard({ item, isSelected, onSelect }: {
  item: DockItem
  isSelected: boolean
  onSelect: (id: number) => void
  onArchive: (id: number) => void
  onSuggest: (id: number) => void
  onOpenEditor: (id: number) => void
  onUpdateText: (id: number, text: string) => void
  onReopen: (id: number) => void
}) {
  const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.pending

  return (
    <div
      onClick={() => onSelect(item.id)}
      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'bg-white/[0.06] border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
          : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/90 leading-relaxed line-clamp-2">
            {item.rawText}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-md border ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {item.selectedProject && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/[0.06] text-slate-400">
                {item.selectedProject}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={14} className={`flex-shrink-0 mt-1 transition-colors ${isSelected ? 'text-emerald-500' : 'text-slate-600'}`} />
      </div>
    </div>
  )
}

function DockDetailPanel({ item, onClose, onArchive, onSuggest, onOpenEditor, onUpdateText, onReopen }: {
  item: DockItem
  onClose: () => void
  onArchive: (id: number) => void
  onSuggest: (id: number) => void
  onOpenEditor: (id: number) => void
  onUpdateText: (id: number, text: string) => void
  onReopen: (id: number) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.rawText)
  const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.pending

  const handleSave = () => {
    onUpdateText(item.id, editText)
    setIsEditing(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <span className={`text-[10px] px-2.5 py-1 rounded-md border ${statusInfo.bg} ${statusInfo.color} font-medium`}>
          {statusInfo.label}
        </span>
        <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-5">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full min-h-[120px] bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 outline-none focus:border-emerald-500/30 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={handleSave} className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors">保存</button>
              <button onClick={() => { setIsEditing(false); setEditText(item.rawText) }} className="px-4 py-1.5 bg-white/5 text-slate-400 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors">取消</button>
            </div>
          </div>
        ) : (
          <div onClick={() => setIsEditing(true)} className="cursor-pointer group">
            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap group-hover:text-white/90 transition-colors">
              {item.rawText}
            </p>
            <span className="text-[10px] text-slate-600 mt-2 block opacity-0 group-hover:opacity-100 transition-opacity">点击编辑</span>
          </div>
        )}

        {item.selectedProject && (
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 block">项目</span>
            <span className="text-sm text-slate-300">{item.selectedProject}</span>
          </div>
        )}

        <div className="pt-4 border-t border-white/[0.06] space-y-2">
          {item.status === 'pending' && (
            <button onClick={() => onSuggest(item.id)} className="w-full py-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-xs font-medium hover:bg-blue-500/20 transition-colors">
              生成建议
            </button>
          )}
          {(item.status === 'suggested' || item.status === 'reopened') && (
            <button onClick={() => onArchive(item.id)} className="w-full py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-500/20 transition-colors">
              确认归档
            </button>
          )}
          {item.status === 'archived' && (
            <button onClick={() => onReopen(item.id)} className="w-full py-2.5 bg-orange-500/10 text-orange-400 rounded-xl text-xs font-medium hover:bg-orange-500/20 transition-colors">
              重新整理
            </button>
          )}
          <button onClick={() => onOpenEditor(item.id)} className="w-full py-2.5 bg-white/5 text-slate-300 rounded-xl text-xs font-medium hover:bg-white/10 transition-colors">
            在 Editor 中编辑
          </button>
        </div>
      </div>
    </div>
  )
}

function FloatingRecorder({ recorderState, setRecorderState, inputMode, setInputMode, inputText, setInputText, onCapture }: {
  recorderState: 'closed' | 'classic' | 'chat'
  setRecorderState: (s: 'closed' | 'classic' | 'chat') => void
  inputMode: AppMode
  setInputMode: (m: AppMode) => void
  inputText: string
  setInputText: (t: string) => void
  onCapture: (text: string) => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!inputText.trim() || submitting) return
    setSubmitting(true)
    try {
      await onCapture(inputText.trim())
      setInputText('')
    } finally {
      setSubmitting(false)
    }
  }

  if (recorderState === 'closed') return null

  return (
    <div
      className="fixed bottom-6 right-6 z-50 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
      style={{ width: 'min(92vw, 480px)', minWidth: '320px' }}
    >
      <div className="bg-[#0A0D14]/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/[0.06] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInputMode('classic')}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                inputMode === 'classic' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Classic
            </button>
            <button
              onClick={() => setInputMode('chat')}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                inputMode === 'chat' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Chat
            </button>
          </div>
          <button
            onClick={() => setRecorderState('closed')}
            className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <Minimize2 size={14} />
          </button>
        </div>

        <div className="p-4">
          {inputMode === 'classic' ? (
            <div className="space-y-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmit()
                  }
                }}
                placeholder="快速记录..."
                className="w-full min-h-[100px] bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white/90 outline-none focus:border-emerald-500/30 resize-none placeholder-slate-600"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !inputText.trim()}
                className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-30"
              >
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Chat 模式暂为简化版，请直接输入内容</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      handleSubmit()
                    }
                  }}
                  placeholder="输入内容..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-emerald-500/30 placeholder-slate-600"
                />
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !inputText.trim()}
                  className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
