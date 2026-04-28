'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Send, Minimize2, Sparkles, Loader2, X, MoreHorizontal, LayoutList, FileCode2, Pencil, FolderOutput, Download, Trash2, Check, Inbox, Archive, FileText, Circle, RotateCcw, Lightbulb, CircleSlash, ChevronRight } from 'lucide-react'

import { getCurrentUser, registerUser, logoutUser, type LocalUser } from '@/lib/auth'
import GoldenTopNav from './_components/GoldenTopNav'
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
import MindCanvasStage from './features/mind/MindCanvasStage'

type ActiveModule = 'home' | 'mind' | 'dock' | 'editor'

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

  const [editorMode, setEditorMode] = useState<'classic' | 'block'>('block')

  const draftCounterRef = React.useRef(0)
  const [drafts, setDrafts] = useState<Record<number, { title: string; content: string }>>({})

  const [registerName, setRegisterName] = useState('')

  const [mindNodes, setMindNodes] = useState<StoredMindNode[]>([])
  const [mindEdges, setMindEdges] = useState<StoredMindEdge[]>([])
  const [mindInputText, setMindInputText] = useState('')
  const [mindRefreshKey, setMindRefreshKey] = useState(0)

  const [toastMessage, setToastMessage] = useState('')
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 2500)
  }, [])

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

  const handleLogout = useCallback(() => {
    logoutUser()
    setUser(null)
  }, [])

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
    setActiveModule('editor')
  }, [items, tabs])

  const createDraftTab = useCallback(() => {
    draftCounterRef.current -= 1
    const draftId = draftCounterRef.current
    const tabId = `tab-editor-draft-${draftId}`
    const newTab: Tab = {
      id: tabId,
      type: 'editor',
      title: 'Untitled',
      documentId: draftId,
      isPinned: false,
    }
    setDrafts(prev => ({ ...prev, [draftId]: { title: '', content: '' } }))
    setTabs(prev => [...prev, newTab])
    setActiveTabId(tabId)
    setEditingItemId(draftId)
    setEditorTitle('')
    setEditorContent('')
    setActiveModule('editor')
  }, [])

  const handleNewNote = useCallback(() => {
    createDraftTab()
  }, [createDraftTab])

  const handleSaveEditor = useCallback(async () => {
    if (!userId) return
    const isDraft = editingItemId !== null && editingItemId < 0
    if (isDraft) {
      const draft = drafts[editingItemId]
      const title = (draft?.title ?? '').trim() || (draft?.content ?? '').trim().slice(0, 50) || 'Untitled'
      const content = (draft?.content ?? '').trim()
      if (!title && !content) {
        setError('标题和正文都为空，无法保存')
        return
      }
      try {
        const newId = await createDockItem(userId, content || title)
        await upsertMindNode({
          userId,
          nodeType: 'source',
          label: title.slice(0, 80),
          documentId: newId,
          state: 'active',
        })
        refreshAll()
        const oldTabId = `tab-editor-draft-${editingItemId}`
        const newTabId = `tab-editor-${newId}`
        setTabs(prev => prev.map(t => t.id === oldTabId ? { ...t, id: newTabId, documentId: newId, title: title.slice(0, 30) } : t))
        setActiveTabId(newTabId)
        setEditingItemId(newId)
        setEditorTitle(title)
        setEditorContent(content)
        setDrafts(prev => {
          const next = { ...prev }
          delete next[editingItemId]
          return next
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : '保存失败')
      }
    } else if (editingItemId && editingItemId > 0) {
      try {
        await updateDockItemText(userId, editingItemId, editorContent)
        refreshAll()
      } catch (e) {
        setError(e instanceof Error ? e.message : '保存失败')
      }
    }
  }, [editingItemId, userId, drafts, editorContent, refreshAll])

  const handleActivateTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      if (tab.type === 'home') setActiveModule('home')
      else if (tab.type === 'mind') setActiveModule('mind')
      else if (tab.type === 'dock') setActiveModule('dock')
      else if (tab.type === 'editor' && tab.documentId) {
        setActiveModule('editor')
        const isDraft = tab.documentId < 0
        if (isDraft) {
          setEditingItemId(tab.documentId)
          const draft = drafts[tab.documentId]
          setEditorTitle(draft?.title ?? '')
          setEditorContent(draft?.content ?? '')
        } else {
          const item = items.find(i => i.id === tab.documentId)
          if (item) {
            setEditingItemId(tab.documentId)
            setEditorTitle(item.topic || item.rawText.slice(0, 50))
            setEditorContent(item.rawText)
          }
        }
      }
    }
  }, [tabs, items, drafts])

  const handleCloseTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === tabId)
      const closingTab = prev.find(t => t.id === tabId)
      const next = prev.filter(t => t.id !== tabId)
      const closingDocId = closingTab?.documentId
      if (closingDocId && closingDocId < 0) {
        setDrafts(draftsPrev => {
          const d = { ...draftsPrev }
          delete d[closingDocId]
          return d
        })
      }
      if (activeTabId === tabId) {
        const newActive = next[Math.min(idx, next.length - 1)]?.id || 'tab-home'
        setActiveTabId(newActive)
        const newTab = next.find(t => t.id === newActive)
        if (newTab?.type === 'home') {
          setActiveModule('home')
          setEditingItemId(null)
        } else if (newTab?.type === 'mind') {
          setActiveModule('mind')
          setEditingItemId(null)
        } else if (newTab?.type === 'dock') {
          setActiveModule('dock')
          setEditingItemId(null)
        } else if (newTab?.type === 'editor') {
          setActiveModule('editor')
          const docId = newTab.documentId ?? null
          setEditingItemId(docId)
          if (docId && docId > 0) {
            const item = items.find(i => i.id === docId)
            if (item) {
              setEditorTitle(item.topic || item.rawText.slice(0, 50))
              setEditorContent(item.rawText)
            }
          } else if (docId && docId < 0) {
            const draft = drafts[docId]
            setEditorTitle(draft?.title ?? '')
            setEditorContent(draft?.content ?? '')
          }
        } else {
          setActiveModule('home')
          setEditingItemId(null)
        }
      } else {
        // 关闭非 active tab，editingItemId 保持不变
      }
      return next
    })
  }, [activeTabId, items, drafts])

  const handleNewTab = useCallback(() => {
    handleNewNote()
  }, [handleNewNote])

  const handleModuleChange = useCallback((mod: ActiveModule) => {
    setActiveModule(mod)
    if (mod === 'editor') {
      const editorTabs = tabs.filter(t => t.type === 'editor')
      if (editorTabs.length > 0) {
        const currentActive = tabs.find(t => t.id === activeTabId)
        let targetId = editorTabs[0].id
        if (currentActive && currentActive.type === 'editor') {
          targetId = currentActive.id
        } else {
          targetId = editorTabs[editorTabs.length - 1].id
        }
        handleActivateTab(targetId)
      } else {
        handleNewNote()
      }
      return
    }

    const tabId = `tab-${mod}`
    const existing = tabs.find(t => t.id === tabId)
    if (existing) {
      setActiveTabId(tabId)
    } else {
      const newTab: Tab = { id: tabId, type: mod, title: mod.charAt(0).toUpperCase() + mod.slice(1), isPinned: false }
      setTabs(prev => [...prev, newTab])
      setActiveTabId(tabId)
    }
    setEditingItemId(null)
  }, [tabs, activeTabId, handleActivateTab, handleNewNote])

  const handleSetEditorMode = useCallback((mode: 'classic' | 'block') => {
    setEditorMode(mode)
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
      <div className="flex h-screen w-full bg-[#111111] text-slate-200 font-sans items-center justify-center">
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

  const activeEditorTab = tabs.find(t => t.id === activeTabId)
  const isActiveDraft = activeEditorTab?.documentId != null && activeEditorTab.documentId < 0

  return (
    <div className="dark">
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[var(--bg-base)] font-sans text-[var(--text-main)] selection:bg-[var(--accent)] selection:text-white">
        <div className="ambient-glow" />

        <div id="canvas-container" className="canvas-container canvas-dimmed">
        </div>

        <GoldenTopNav
          activeModule={activeModule}
          onModuleChange={handleModuleChange}
          onOpenRecorder={() => setRecorderState(inputMode === 'classic' ? 'classic' : 'chat')}
          user={user}
          onLogout={handleLogout}
          isCollapsed={isEditorActive && activeModule === 'editor'}
        />

        <main id="main-container" className="relative z-10 flex-1 overflow-hidden main-transition">
          {isEditorActive && activeModule === 'editor' ? (
            <div id="view-editor" className="view-section active w-full h-full flex-col pointer-events-auto">
              <div className="w-full h-full flex flex-col overflow-hidden">
                <div className="h-14 bg-[var(--bg-sidebar)] border-b border-[var(--border-line)] flex items-end pl-16 pr-3 pb-0 shrink-0 relative">
                  <WorkspaceTabs
                    tabs={tabs.filter(t => t.type === 'editor')}
                    activeTabId={activeTabId}
                    onActivateTab={handleActivateTab}
                    onCloseTab={handleCloseTab}
                    onNewTab={handleNewTab}
                  />
                  <EditorOptionsMenu
                    mode={editorMode}
                    onSetMode={handleSetEditorMode}
                  />
                </div>
                <EditorTabView
                  editingItemId={editingItemId}
                  editorTitle={editorTitle}
                  editorContent={editorContent}
                  onTitleChange={(title) => {
                    setEditorTitle(title)
                    if (editingItemId != null && editingItemId < 0) {
                      setDrafts(prev => ({ ...prev, [editingItemId]: { ...prev[editingItemId], title } }))
                    }
                  }}
                  onContentChange={(content) => {
                    setEditorContent(content)
                    if (editingItemId != null && editingItemId < 0) {
                      setDrafts(prev => ({ ...prev, [editingItemId]: { ...prev[editingItemId], content } }))
                    }
                  }}
                  onSave={handleSaveEditor}
                  mode={editorMode}
                  isDraft={isActiveDraft}
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-full pt-20 pb-4 px-6 flex justify-center overflow-hidden">
              {activeModule === 'home' && (
                <div id="view-home" className="view-section active w-full max-w-5xl h-full flex-col pointer-events-auto overflow-y-auto no-scrollbar">
                  <HomeView
                    userId={userId}
                    userName={user.name}
                    onOpenEditor={openEditorTab}
                    onNewNote={handleNewNote}
                    onSwitchToDock={() => handleModuleChange('dock')}
                    onSwitchToMind={() => handleModuleChange('mind')}
                    onCapture={handleCapture}
                    nodeCount={nodeCount}
                  />
                </div>
              )}

              {activeModule === 'mind' && (
                <div id="view-mind" className="view-section active absolute inset-0 w-full h-full flex-col pointer-events-none">
                  <MindCanvasStage
                    nodes={mindNodes}
                    edges={mindEdges}
                    onOpenEditor={openEditorTab}
                    onToast={showToast}
                  />
                  {nodeCount === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <h1 className="text-5xl font-light text-white/80 tracking-tight mb-2">Nebula Tree</h1>
                      <p className="text-sm text-[var(--text-muted)] mb-12">你的知识星空</p>
                    </div>
                  )}
                  <div className="absolute bottom-8 w-full max-w-2xl px-6 z-20 pointer-events-auto">
                    <div className="glass rounded-2xl flex items-center p-2 pl-4">
                      <Sparkles size={16} className="text-emerald-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={mindInputText}
                        onChange={(e) => setMindInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleMindInput() }}
                        placeholder="输入灵感并回车..."
                        className="flex-1 bg-transparent outline-none px-4 py-2.5 text-[14px] font-light placeholder-slate-600 text-white"
                      />
                      <div className="flex items-center px-3 space-x-2 border-l border-[var(--border-line)]">
                        <span className="text-[9px] uppercase tracking-widest text-emerald-500/80 font-mono">GROW</span>
                        <kbd className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 border border-white/10 text-slate-500">↵</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'dock' && (
                <div id="view-dock" className="view-section active w-full h-full flex-col pointer-events-auto">
                  <div className="glass w-full h-full rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-[var(--border-line)]">
                    <DockFinderView
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
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
            <div className="glass rounded-xl px-5 py-2.5 text-sm text-white shadow-2xl dropdown-transition">
              {toastMessage}
            </div>
          </div>
        )}

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

function EditorOptionsMenu({ mode, onSetMode }: { mode: 'classic' | 'block'; onSetMode: (mode: 'classic' | 'block') => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex items-end pb-2 ml-auto">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-md hover:bg-white/10"
        title="More Options"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-[#161616]/95 backdrop-blur-xl border border-white/[0.06] rounded-xl p-1 z-[120] shadow-2xl">
            <div className="px-2 py-1 text-[9px] font-bold text-slate-500 tracking-wider">VIEW OPTIONS</div>
            <button
              onClick={() => { onSetMode('block'); setOpen(false) }}
              className="w-full text-left px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2"><LayoutList size={14} /> Block Edit</span>
              {mode === 'block' && <Check size={14} className="text-white" />}
            </button>
            <button
              onClick={() => { onSetMode('classic'); setOpen(false) }}
              className="w-full text-left px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2"><FileCode2 size={14} /> Classic Edit</span>
              {mode === 'classic' && <Check size={14} className="text-white" />}
            </button>
            <div className="my-1 border-t border-white/[0.06]" />
            <div className="px-2 py-1 text-[9px] font-bold text-slate-500 tracking-wider">ACTIONS</div>
            <button className="w-full text-left px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors">
              <Pencil size={14} /> Rename
            </button>
            <button className="w-full text-left px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors">
              <FolderOutput size={14} /> Move to...
            </button>
            <button className="w-full text-left px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors">
              <Download size={14} /> Export as PDF
            </button>
            <div className="my-1 border-t border-white/[0.06]" />
            <button className="w-full text-left px-2 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function DockFinderView({ items, selectedItemId, loading, error, onSelectItem, onArchive, onSuggest, onOpenEditor, onReopen, onOpenRecorder, selectedItem }: {
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
  const [filterStatus, setFilterStatus] = useState<EntryStatus | null>(null)

  const statusIcon = (status: EntryStatus) => {
    switch (status) {
      case 'pending': return <Circle size={14} className="text-yellow-500/70" />
      case 'suggested': return <Lightbulb size={14} className="text-blue-400/70" />
      case 'archived': return <Archive size={14} className="text-emerald-400/70" />
      case 'reopened': return <RotateCcw size={14} className="text-orange-400/70" />
      case 'ignored': return <CircleSlash size={14} className="text-slate-500/70" />
      default: return <Circle size={14} className="text-slate-500/70" />
    }
  }

  const counts: Record<EntryStatus, number> = { pending: 0, suggested: 0, archived: 0, ignored: 0, reopened: 0 }
  items.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1 })

  const filteredItems = filterStatus ? items.filter(i => i.status === filterStatus) : items

  // 如果当前选中项被筛选隐藏，自动清空选中
  const visibleSelected = selectedItemId != null && filteredItems.some(i => i.id === selectedItemId)
  const effectiveSelectedItem = visibleSelected ? selectedItem : null

  const handleSelectFilter = (st: EntryStatus | null) => {
    setFilterStatus(st)
    if (st != null && selectedItemId != null) {
      const item = items.find(i => i.id === selectedItemId)
      if (item && item.status !== st) {
        onSelectItem(null)
      }
    }
  }

  const sidebarActiveClass = 'bg-emerald-500/90 text-[#111] font-medium'
  const sidebarInactiveClass = 'text-slate-300 hover:bg-white/[0.06]'

  const formatDate = (d: Date | string | null) => {
    if (!d) return '-'
    const date = typeof d === 'string' ? new Date(d) : d
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  return (
    <div className="h-full flex overflow-hidden bg-[#111]">
      {/* Left sidebar */}
      <div className="w-48 bg-[#161616] border-r border-white/[0.06] flex flex-col py-3 overflow-y-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="px-4 text-[10px] font-bold text-slate-500 tracking-wider mb-2">SHORTCUTS</div>
        <div className="space-y-0.5 px-2">
          <div
            onClick={() => handleSelectFilter(null)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors text-sm ${
              filterStatus === null ? sidebarActiveClass : sidebarInactiveClass
            }`}
          >
            <Inbox size={14} />
            <span className="truncate">所有条目</span>
            <span className="ml-auto text-[10px] opacity-60">{items.length}</span>
          </div>
        </div>

        <div className="px-4 text-[10px] font-bold text-slate-500 tracking-wider mt-6 mb-2">STATUS</div>
        <div className="space-y-0.5 px-2">
          {(['pending', 'suggested', 'archived', 'reopened'] as EntryStatus[]).map(st => (
            counts[st] > 0 && (
              <div
                key={st}
                onClick={() => handleSelectFilter(st)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors text-sm ${
                  filterStatus === st ? sidebarActiveClass : 'text-slate-400 hover:bg-white/[0.06]'
                }`}
              >
                {statusIcon(st)}
                <span>{STATUS_LABELS[st].label}</span>
                <span className="ml-auto text-[10px] opacity-60">{counts[st]}</span>
              </div>
            )
          ))}
        </div>

        <div className="px-4 text-[10px] font-bold text-slate-500 tracking-wider mt-6 mb-2">ACTIONS</div>
        <div className="space-y-0.5 px-2">
          <button onClick={onOpenRecorder} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors text-sm">
            <Sparkles size={14} className="text-emerald-400" />
            <span>录入</span>
          </button>
        </div>
      </div>

      {/* Miller Columns: Group column + Item column */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Group/Status column */}
        <div className="w-52 border-r border-white/[0.06] flex flex-col overflow-hidden shrink-0 bg-[#111]">
          <div className="h-9 flex items-center px-4 border-b border-white/[0.06] bg-[#111] shrink-0">
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">集合</span>
          </div>
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="animate-spin text-slate-500" size={20} />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : (
              <div>
                <div
                  onClick={() => handleSelectFilter(null)}
                  className={`flex items-center justify-between px-3 py-1.5 mx-2 rounded-md cursor-pointer transition-colors text-sm ${
                    filterStatus === null
                      ? 'bg-emerald-500/90 text-[#111] font-medium'
                      : 'text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <Inbox size={14} className={`shrink-0 ${filterStatus === null ? 'text-[#111]/60' : 'text-slate-500'}`} />
                    <span className="truncate">所有条目</span>
                  </div>
                  <span className="ml-2 text-[10px] opacity-60 shrink-0">{items.length}</span>
                </div>
                {(['pending', 'suggested', 'archived', 'reopened'] as EntryStatus[]).map(st => (
                  counts[st] > 0 && (
                    <div
                      key={st}
                      onClick={() => handleSelectFilter(st)}
                      className={`flex items-center justify-between px-3 py-1.5 mx-2 rounded-md cursor-pointer transition-colors text-sm ${
                        filterStatus === st
                          ? 'bg-emerald-500/90 text-[#111] font-medium'
                          : 'text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        {statusIcon(st)}
                        <span className="truncate">{STATUS_LABELS[st].label}</span>
                      </div>
                      <span className="ml-2 text-[10px] opacity-60 shrink-0">{counts[st]}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Item column */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#111]">
          <div className="h-9 flex items-center px-4 border-b border-white/[0.06] bg-[#111] shrink-0">
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
              {filterStatus ? STATUS_LABELS[filterStatus].label : '所有条目'}
            </span>
            <span className="mx-2 text-slate-600">/</span>
            <span className="text-[10px] text-slate-500">{filteredItems.length} 项</span>
          </div>
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="animate-spin text-slate-500" size={20} />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Inbox size={24} className="opacity-30 mb-3" />
                <p className="text-sm">{filterStatus ? `暂无${STATUS_LABELS[filterStatus].label}条目` : '暂无条目'}</p>
                <button onClick={onOpenRecorder} className="mt-4 text-xs text-emerald-400 hover:underline">录入</button>
              </div>
            ) : (
              <div>
                {filteredItems.map((item) => {
                  const isActive = selectedItemId === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(isActive ? null : item.id)}
                      className={`flex items-center justify-between px-3 py-1.5 mx-2 rounded-md cursor-pointer transition-colors text-sm ${
                        isActive
                          ? 'bg-emerald-500/90 text-[#111] font-medium'
                          : 'text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <FileText size={14} className={`shrink-0 ${isActive ? 'text-[#111]/60' : 'text-slate-500'}`} />
                        <span className="truncate">{item.topic || item.rawText.slice(0, 50)}</span>
                      </div>
                      {item.status !== 'pending' && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ml-2 ${isActive ? 'bg-[#111]/10 text-[#111]/70' : 'bg-white/5 text-slate-500'}`}>
                          {STATUS_LABELS[item.status]?.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right preview panel */}
      {effectiveSelectedItem && (
        <div className="w-80 bg-[#161616] border-l border-white/[0.06] flex flex-col shrink-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_LABELS[effectiveSelectedItem.status]?.bg} ${STATUS_LABELS[effectiveSelectedItem.status]?.color}`}>
              {STATUS_LABELS[effectiveSelectedItem.status]?.label}
            </span>
            <button onClick={() => onSelectItem(null)} className="p-1.5 text-slate-500 hover:text-white rounded-md hover:bg-white/10 transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/[0.06] flex items-center justify-center mb-6 mt-4 shadow-inner">
              <FileText size={40} className="text-indigo-400/60" />
            </div>
            <h3 className="text-lg font-bold text-white text-center w-full break-words mb-1">
              {effectiveSelectedItem.topic || effectiveSelectedItem.rawText.slice(0, 40)}
            </h3>
            <p className="text-xs text-slate-500 mb-8">Document · Markdown</p>
            <div className="w-full space-y-4 text-xs">
              <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-4">
                <span className="text-slate-500 font-semibold tracking-wider text-[10px]">内容摘要</span>
                <p className="text-slate-400 leading-relaxed line-clamp-4 whitespace-pre-wrap">{effectiveSelectedItem.rawText}</p>
              </div>
              <div className="flex flex-col gap-2 border-b border-white/[0.06] pb-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold tracking-wider text-[10px]">创建时间</span>
                  <span className="text-slate-400">{formatDate(effectiveSelectedItem.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold tracking-wider text-[10px]">处理时间</span>
                  <span className="text-slate-400">{formatDate(effectiveSelectedItem.processedAt)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-4">
                <span className="text-slate-500 font-semibold tracking-wider text-[10px]">操作</span>
                <div className="flex flex-col gap-2 mt-1">
                  {effectiveSelectedItem.status === 'pending' && (
                    <button onClick={() => onSuggest(effectiveSelectedItem.id)} className="text-left text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-[11px]">
                      <ChevronRight size={12} /> 建议
                    </button>
                  )}
                  {(effectiveSelectedItem.status === 'suggested' || effectiveSelectedItem.status === 'reopened') && (
                    <button onClick={() => onArchive(effectiveSelectedItem.id)} className="text-left text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-[11px]">
                      <ChevronRight size={12} /> 归档
                    </button>
                  )}
                  {effectiveSelectedItem.status === 'archived' && (
                    <button onClick={() => onReopen(effectiveSelectedItem.id)} className="text-left text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-[11px]">
                      <ChevronRight size={12} /> 重新打开
                    </button>
                  )}
                  <button onClick={() => onOpenEditor(effectiveSelectedItem.id)} className="text-left bg-emerald-500/90 hover:bg-emerald-500 text-[#111] transition-colors flex items-center gap-2 text-[11px] font-medium px-3 py-1.5 rounded-md mt-1">
                    <ChevronRight size={12} /> 在编辑器中打开
                  </button>
                </div>
              </div>
            </div>
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
