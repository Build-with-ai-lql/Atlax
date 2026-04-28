'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Send, Minimize2, Sparkles, Loader2, X, ChevronRight, Dock as DockIcon } from 'lucide-react'

import { getCurrentUser, registerUser, type LocalUser } from '@/lib/auth'
import {
  archiveItem,
  createDockItem,
  listDockItems,
  listMindNodes,
  listMindEdges,
  reopenItem,
  suggestItem,
  updateDockItemText,
  upsertMindNode,
  type DockItem,
  type StoredMindNode,
  type StoredMindEdge,
} from '@/lib/repository'
import type { EntryStatus } from '@/lib/types'
import { recordEvent, type AppMode } from '@/lib/events'

import WorkspaceTabs, { type Tab } from './features/shared/WorkspaceTabs'
import HomeView from './features/home/HomeView'
import EditorTabView from './features/editor/EditorTabView'

type ActiveModule = 'home' | 'mind' | 'dock'

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
  const [activeModule, setActiveModule] = useState<ActiveModule>('home')

  const [items, setItems] = useState<DockItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'tab-home', type: 'home', title: 'Home', isPinned: true },
  ])
  const [activeTabId, setActiveTabId] = useState<string>('tab-home')

  const [recorderState, setRecorderState] = useState<'closed' | 'classic' | 'chat'>('closed')
  const [inputMode, setInputMode] = useState<AppMode>('chat')
  const [inputText, setInputText] = useState('')

  const [editorContent, setEditorContent] = useState('')
  const [editorTitle, setEditorTitle] = useState('')
  const [editingItemId, setEditingItemId] = useState<number | null>(null)

  const [registerName, setRegisterName] = useState('')

  const [mindNodes, setMindNodes] = useState<StoredMindNode[]>([])
  const [mindEdges, setMindEdges] = useState<StoredMindEdge[]>([])
  const [mindInputText, setMindInputText] = useState('')
  const [mindRefreshKey, setMindRefreshKey] = useState(0)

  const userId = user?.id || ''

  useEffect(() => {
    const current = getCurrentUser()
    setUser(current)
    setAuthChecked(true)
  }, [])

  const loadData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const dockItems = await listDockItems(userId)
      setItems(dockItems)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadMindData = useCallback(async () => {
    if (!userId) return
    try {
      const [nodes, edges] = await Promise.all([
        listMindNodes(userId),
        listMindEdges(userId),
      ])
      setMindNodes(nodes)
      setMindEdges(edges)
    } catch {
      // silently fail
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadData()
      loadMindData()
    }
  }, [userId, loadData, loadMindData, mindRefreshKey])

  const refreshAll = useCallback(() => {
    loadData()
    setMindRefreshKey((k) => k + 1)
  }, [loadData])

  const handleCapture = useCallback(async (text: string) => {
    if (!text.trim() || !userId) return
    try {
      const newId = await createDockItem(userId, text.trim())
      await upsertMindNode({
        userId,
        nodeType: 'source',
        label: text.trim().slice(0, 80),
        documentId: newId,
        state: 'active',
      })
      refreshAll()
      recordEvent(userId, { type: 'capture_created', sourceType: 'text', dockItemId: newId })
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
    }
  }, [userId, refreshAll])

  const handleSuggest = useCallback(async (itemId: number) => {
    if (!userId) return
    try {
      await suggestItem(userId, itemId)
      refreshAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : '建议生成失败')
    }
  }, [userId, refreshAll])

  const handleArchive = useCallback(async (itemId: number) => {
    if (!userId) return
    try {
      await archiveItem(userId, itemId)
      refreshAll()
      setSelectedItemId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '归档失败')
    }
  }, [userId, refreshAll])

  const handleReopen = useCallback(async (itemId: number) => {
    if (!userId) return
    try {
      await reopenItem(userId, itemId)
      refreshAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : '重新打开失败')
    }
  }, [userId, refreshAll])

  const openEditorTab = useCallback((itemId: number) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const tabId = `tab-editor-${itemId}`
    const existing = tabs.find(t => t.id === tabId)
    if (existing) {
      setActiveTabId(tabId)
    } else {
      const newTab: Tab = {
        id: tabId,
        type: 'editor',
        title: item.topic || item.rawText.slice(0, 30),
        documentId: itemId,
        isPinned: false,
      }
      setTabs(prev => [...prev, newTab])
      setActiveTabId(tabId)
    }
    setEditingItemId(itemId)
    setEditorTitle(item.topic || item.rawText.slice(0, 50))
    setEditorContent(item.rawText)
    setActiveModule('home')
  }, [items, tabs])

  const handleNewNote = useCallback(async () => {
    if (!userId) return
    try {
      const newId = await createDockItem(userId, 'New Note')
      await upsertMindNode({
        userId,
        nodeType: 'source',
        label: 'New Note',
        documentId: newId,
        state: 'active',
      })
      refreshAll()
      setTimeout(() => openEditorTab(newId), 100)
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
    }
  }, [userId, refreshAll, openEditorTab])

  const handleSaveEditor = useCallback(async () => {
    if (!editingItemId || !userId) return
    try {
      await updateDockItemText(userId, editingItemId, editorContent)
      refreshAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    }
  }, [editingItemId, userId, editorContent, refreshAll])

  const handleActivateTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      if (tab.type === 'home') setActiveModule('home')
      else if (tab.type === 'mind') setActiveModule('mind')
      else if (tab.type === 'dock') setActiveModule('dock')
      else if (tab.type === 'editor' && tab.documentId) {
        setActiveModule('home')
        const item = items.find(i => i.id === tab.documentId)
        if (item) {
          setEditingItemId(tab.documentId)
          setEditorTitle(item.topic || item.rawText.slice(0, 50))
          setEditorContent(item.rawText)
        }
      }
    }
  }, [tabs, items])

  const handleCloseTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === tabId)
      const next = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId) {
        const newActive = next[Math.min(idx, next.length - 1)]?.id || 'tab-home'
        setActiveTabId(newActive)
        const newTab = next.find(t => t.id === newActive)
        if (newTab?.type === 'home') setActiveModule('home')
        else if (newTab?.type === 'mind') setActiveModule('mind')
        else if (newTab?.type === 'dock') setActiveModule('dock')
        else setActiveModule('home')
      }
      return next
    })
    setEditingItemId(null)
  }, [activeTabId])

  const handleNewTab = useCallback(() => {
    handleNewNote()
  }, [handleNewNote])

  const handleModuleChange = useCallback((mod: ActiveModule) => {
    setActiveModule(mod)
    const tabId = `tab-${mod}`
    const existing = tabs.find(t => t.id === tabId)
    if (existing) {
      setActiveTabId(tabId)
    } else {
      const newTab: Tab = { id: tabId, type: mod, title: mod.charAt(0).toUpperCase() + mod.slice(1), isPinned: false }
      setTabs(prev => [...prev, newTab])
      setActiveTabId(tabId)
    }
    if (mod !== 'home') {
      setEditingItemId(null)
    }
  }, [tabs])

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
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleRegister() }}
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
  const isEditorActive = activeTabId.startsWith('tab-editor-') && editingItemId != null
  const nodeCount = mindNodes.length
  const edgeCount = mindEdges.length

  return (
    <div className="dark">
      <div className="flex flex-col h-screen w-full bg-[#030508] text-slate-200 font-sans overflow-hidden selection:bg-emerald-500/20">

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
            {(['home', 'mind', 'dock'] as ActiveModule[]).map((mod) => (
              <button
                key={mod}
                onClick={() => handleModuleChange(mod)}
                className={`text-[13px] tracking-wide transition-all duration-300 relative py-1 ${
                  activeModule === mod && !isEditorActive
                    ? 'text-white font-medium'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {mod.charAt(0).toUpperCase() + mod.slice(1)}
                {activeModule === mod && !isEditorActive && (
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

        <WorkspaceTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onActivateTab={handleActivateTab}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
        />

        <div className="flex-1 relative overflow-hidden">
          {activeModule === 'home' && !isEditorActive && (
            <HomeView
              userId={userId}
              userName={user.name}
              onOpenEditor={openEditorTab}
              onNewNote={handleNewNote}
              onSwitchToDock={() => handleModuleChange('dock')}
            />
          )}

          {isEditorActive && (
            <EditorTabView
              editingItemId={editingItemId}
              editorTitle={editorTitle}
              editorContent={editorContent}
              onTitleChange={setEditorTitle}
              onContentChange={setEditorContent}
              onSave={handleSaveEditor}
            />
          )}

          {activeModule === 'mind' && (
            <MindInlineView
              nodes={mindNodes}
              edges={mindEdges}
              mindInputText={mindInputText}
              setMindInputText={setMindInputText}
              onMindInput={handleMindInput}
              onOpenEditor={openEditorTab}
              nodeCount={nodeCount}
              edgeCount={edgeCount}
            />
          )}

          {activeModule === 'dock' && (
            <DockInlineView
              items={items}
              selectedItemId={selectedItemId}
              loading={loading}
              error={error}
              onSelectItem={setSelectedItemId}
              onArchive={handleArchive}
              onSuggest={handleSuggest}
              onOpenEditor={openEditorTab}
              onReopen={handleReopen}
              onOpenRecorder={() => setRecorderState(inputMode === 'classic' ? 'classic' : 'chat')}
              selectedItem={selectedItem}
            />
          )}
        </div>

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

function MindInlineView({ nodes, edges, mindInputText, setMindInputText, onMindInput, onOpenEditor, nodeCount, edgeCount }: {
  nodes: StoredMindNode[]
  edges: StoredMindEdge[]
  mindInputText: string
  setMindInputText: (t: string) => void
  onMindInput: () => void
  onOpenEditor: (id: number) => void
  nodeCount: number
  edgeCount: number
}) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[#030508]">
        <div className="absolute top-[20%] left-[15%] w-[300px] h-[300px] bg-indigo-500/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-emerald-500/[0.05] rounded-full blur-[80px]" />
      </div>

      {nodeCount > 0 && (
        <svg className="absolute inset-0 z-10 w-full h-full">
          {edges.map((edge: StoredMindEdge, i: number) => {
            const s = nodeMap.get(edge.sourceNodeId)
            const t = nodeMap.get(edge.targetNodeId)
            if (!s || !t) return null
            const sx = 10 + (hashStr(s.id) % 80)
            const sy = 10 + (hashStr(s.id + 'y') % 80)
            const tx = 10 + (hashStr(t.id) % 80)
            const ty = 10 + (hashStr(t.id + 'y') % 80)
            return <line key={`e-${i}`} x1={`${sx}%`} y1={`${sy}%`} x2={`${tx}%`} y2={`${ty}%`} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
          })}
          {nodes.slice(0, 50).map((node: StoredMindNode) => {
            const x = 10 + (hashStr(node.id) % 80)
            const y = 10 + (hashStr(node.id + 'y') % 80)
            const colors: Record<string, string> = { source: '#10B981', document: '#6366F1', project: '#F59E0B', tag: '#8B5CF6' }
            const r = node.nodeType === 'project' ? 8 : node.nodeType === 'document' ? 5 : 3
            return (
              <g key={node.id} onClick={() => { if (node.documentId) onOpenEditor(node.documentId) }} className="cursor-pointer">
                <circle cx={`${x}%`} cy={`${y}%`} r={r} fill={colors[node.nodeType] || '#10B981'} opacity={0.6} />
              </g>
            )
          })}
        </svg>
      )}

      {nodeCount === 0 && (
        <div className="relative z-10 flex flex-col items-center pointer-events-none">
          <h1 className="text-5xl font-light text-white/80 tracking-tight mb-2">Nebula Tree</h1>
          <p className="text-sm text-slate-500 mb-12">你的知识星空</p>
        </div>
      )}

      {nodeCount > 0 && (
        <div className="absolute top-20 right-8 z-20 pointer-events-auto">
          <div className="bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 w-56">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">Atlas Status</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">节点</span>
                <span className="text-[15px] font-mono text-white">{nodeCount}</span>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">连接</span>
                <span className="text-[15px] font-mono text-white">{edgeCount}</span>
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
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) onMindInput() }}
            placeholder="输入灵感并回车..."
            className="flex-1 bg-transparent outline-none px-4 py-2.5 text-[14px] font-light placeholder-slate-600 text-white"
          />
          <div className="flex items-center px-3 space-x-2 border-l border-white/[0.06]">
            <span className="text-[9px] uppercase tracking-widest text-emerald-500/80 font-mono">GROW</span>
            <kbd className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 border border-white/10 text-slate-500">↵</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}

function DockInlineView({ items, selectedItemId, loading, error, onSelectItem, onArchive, onSuggest, onOpenEditor, onReopen, onOpenRecorder, selectedItem }: {
  items: DockItem[]
  selectedItemId: number | null
  loading: boolean
  error: string | null
  onSelectItem: (id: number | null) => void
  onArchive: (id: number) => void
  onSuggest: (id: number) => void
  onOpenEditor: (id: number) => void
  onReopen: (id: number) => void
  onOpenRecorder: () => void
  selectedItem: DockItem | null
}) {
  return (
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
                <DockIcon size={32} className="opacity-20" />
              </div>
              <p className="text-base font-medium text-slate-400">Dock 虚位以待</p>
              <p className="text-sm mt-1.5 opacity-50 max-w-[200px] text-center leading-relaxed">每一个伟大的想法，都值得被认真记录</p>
              <button onClick={onOpenRecorder} className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium transition-colors">即刻开始记录</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">{items.length} 条待整理</span>
              </div>
              {items.map((item) => {
                const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.pending
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(selectedItemId === item.id ? null : item.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      selectedItemId === item.id
                        ? 'bg-white/[0.06] border-emerald-500/20'
                        : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/90 leading-relaxed line-clamp-2">{item.rawText}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className={`flex-shrink-0 mt-1 ${selectedItemId === item.id ? 'text-emerald-500' : 'text-slate-600'}`} />
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      {selectedItem && (
        <div className="w-[420px] border-l border-white/[0.06] bg-[#0A0D14] overflow-y-auto flex-shrink-0 p-6">
          <div className="flex items-center justify-between mb-6">
            <span className={`text-[10px] px-2.5 py-1 rounded-md border ${STATUS_LABELS[selectedItem.status]?.bg} ${STATUS_LABELS[selectedItem.status]?.color} font-medium`}>
              {STATUS_LABELS[selectedItem.status]?.label}
            </span>
            <button onClick={() => onSelectItem(null)} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap mb-6">{selectedItem.rawText}</p>
          <div className="pt-4 border-t border-white/[0.06] space-y-2">
            {selectedItem.status === 'pending' && (
              <button onClick={() => onSuggest(selectedItem.id)} className="w-full py-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-xs font-medium hover:bg-blue-500/20 transition-colors">生成建议</button>
            )}
            {(selectedItem.status === 'suggested' || selectedItem.status === 'reopened') && (
              <button onClick={() => onArchive(selectedItem.id)} className="w-full py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-500/20 transition-colors">确认归档</button>
            )}
            {selectedItem.status === 'archived' && (
              <button onClick={() => onReopen(selectedItem.id)} className="w-full py-2.5 bg-orange-500/10 text-orange-400 rounded-xl text-xs font-medium hover:bg-orange-500/20 transition-colors">重新整理</button>
            )}
            <button onClick={() => onOpenEditor(selectedItem.id)} className="w-full py-2.5 bg-white/5 text-slate-300 rounded-xl text-xs font-medium hover:bg-white/10 transition-colors">在 Editor 中编辑</button>
          </div>
        </div>
      )}
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
    <div className="fixed bottom-6 right-6 z-50 transition-all duration-500" style={{ width: 'min(92vw, 480px)', minWidth: '320px' }}>
      <div className="bg-[#0A0D14]/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/[0.06] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <button onClick={() => setInputMode('classic')} className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${inputMode === 'classic' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Classic</button>
            <button onClick={() => setInputMode('chat')} className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${inputMode === 'chat' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Chat</button>
          </div>
          <button onClick={() => setRecorderState('closed')} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><Minimize2 size={14} /></button>
        </div>
        <div className="p-4">
          {inputMode === 'classic' ? (
            <div className="space-y-3">
              <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }} placeholder="快速记录..." className="w-full min-h-[100px] bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white/90 outline-none focus:border-emerald-500/30 resize-none placeholder-slate-600" />
              <button onClick={handleSubmit} disabled={submitting || !inputText.trim()} className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-30">{submitting ? '保存中...' : '保存'}</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSubmit() }} placeholder="输入内容..." className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-emerald-500/30 placeholder-slate-600" />
                <button onClick={handleSubmit} disabled={submitting || !inputText.trim()} className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors disabled:opacity-30"><Send size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}
