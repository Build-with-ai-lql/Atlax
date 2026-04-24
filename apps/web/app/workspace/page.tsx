'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Dock, Archive, Hash, Search, Plus, Send, Paperclip,
  Image as ImageIcon, CheckSquare, List, Minimize2,
  Mic, MessageSquare, PenTool, ChevronRight, Clock,
  Sparkles, Loader2, Sun, Moon, LogOut, RotateCcw, X, Tag, BarChart3, Filter, SlidersHorizontal,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react'

import { DetailHeaderActions } from './_components/DetailHeaderActions'

import { getCurrentUser, logoutUser, type LocalUser } from '@/lib/auth'
import {
  addTagToItem,
  archiveItem,
  createDockItem,
  createStoredTag,
  getWorkspaceStats,
  ignoreItem,
  listArchivedEntries,
  listDockItems,
  listTags,
  removeTagFromItem,
  reopenItem,
  restoreItem,
  suggestItem,
  updateArchivedEntry,
  updateDockItemText,
  type DockItem,
  type StoredEntry,
  type StoredTag,
} from '@/lib/repository'
import type { EntryStatus } from '@/lib/types'
import { computeMetrics, getEventLog, recordEvent, type AppMode, type MetricsResult } from '@/lib/events'

import AuthGate from './_components/AuthGate'

type ViewType = 'dock' | 'entries' | 'review'
type ChatStep = 'input' | 'confirm' | 'context' | 'tags' | 'done'

interface ChatMessage {
  id: string
  role: 'user' | 'system'
  content: string
  timestamp: number
}

const STATUS_LABELS: Record<EntryStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20' },
  suggested: { label: '已建议', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
  archived: { label: '已归档', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20' },
  ignored: { label: '已忽略', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20' },
  reopened: { label: '重新整理', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20' },
}

const TYPE_LABELS: Record<string, string> = {
  note: '笔记', meeting: '会议', idea: '想法', task: '任务', reading: '阅读',
}

const ENTRY_TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'note', label: '笔记' },
  { value: 'meeting', label: '会议' },
  { value: 'idea', label: '想法' },
  { value: 'task', label: '任务' },
  { value: 'reading', label: '阅读' },
]

const ENTRY_STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'suggested', label: '已建议' },
  { value: 'archived', label: '已归档' },
  { value: 'ignored', label: '已忽略' },
  { value: 'reopened', label: '重新整理' },
]

const CHAT_PLACEHOLDERS = [
  "今天有什么奇思妙想想要保存下来？",
  "别担心思绪凌乱，Atlax 会帮你理清…",
  "每一个伟大的想法，都源于一次不经意的记录",
  "放轻松，在这里写下你现在的真实感受…",
  "我在这里，随时准备倾听你的灵光一闪…",
  "灵感稍纵即逝，抓住它…",
  "此刻的想法，可能就是明天的答案",
  "把思考交给 Atlax，让知识为你工作",
]

export default function WorkspacePage() {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [activeNav, setActiveNav] = useState<ViewType>('dock')
  const [inputMode, setInputMode] = useState<AppMode>('chat')
  const [isInputExpanded, setIsInputExpanded] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isSidebarManuallyCollapsed, setIsSidebarManuallyCollapsed] = useState(false)
  const [isChatMinimized, setIsChatMinimized] = useState(false)

  const [items, setItems] = useState<DockItem[]>([])
  const [archivedEntries, setArchivedEntries] = useState<StoredEntry[]>([])
  const [existingTags, setExistingTags] = useState<StoredTag[]>([])
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [selectedArchivedEntryId, setSelectedArchivedEntryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Record<number, string[]>>({})
  const [reviewStats, setReviewStats] = useState({
    totalEntries: 0, pendingCount: 0, suggestedCount: 0,
    archivedCount: 0, ignoredCount: 0, reopenedCount: 0, tagCount: 0,
  })

  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system')
  const [isDark, setIsDark] = useState(false)

  const [entryFilterType, setEntryFilterType] = useState('')
  const [entryFilterTag, setEntryFilterTag] = useState('')
  const [entryFilterProject, setEntryFilterProject] = useState('')
  const [entryFilterStatus, setEntryFilterStatus] = useState('')

  const [chatStep, setChatStep] = useState<ChatStep>('input')
  const [chatDraft, setChatDraft] = useState('')
  const [chatContext, setChatContext] = useState('')
  const [chatTags, setChatTags] = useState<string[]>([])
  const [chatNewTag, setChatNewTag] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatImmersive, setChatImmersive] = useState(false)
  const [chatSunk, setChatSunk] = useState(false)
  const [dockViewMode, setDockViewMode] = useState<'list' | 'card'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('atlax-dock-view-mode') as 'list' | 'card') || 'card'
    }
    return 'card'
  })

  useEffect(() => {
    const current = getCurrentUser()
    setUser(current)
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setIsDark(mediaQuery.matches)
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      setIsDark(themeMode === 'dark')
    }
  }, [themeMode])

  const userId = user?.id ?? ''

  const loadItems = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [data, archived, tags, stats] = await Promise.all([
        listDockItems(userId),
        listArchivedEntries(userId),
        listTags(userId),
        getWorkspaceStats(userId),
      ])
      setItems(data)
      setArchivedEntries(archived)
      setExistingTags(tags)
      setReviewStats(stats)
    } catch {
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (user) loadItems()
  }, [user, loadItems])

  const handleAuthenticated = () => setUser(getCurrentUser())

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    setItems([])
    setArchivedEntries([])
    setExistingTags([])
    setSelectedItemId(null)
    setSelectedArchivedEntryId(null)
  }

  const handleModeChange = (newMode: AppMode) => {
    if (newMode === inputMode) return
    recordEvent({ type: 'mode_switched', from: inputMode, to: newMode })
    setInputMode(newMode)
    if (newMode === 'classic') {
      setChatStep('input')
      setChatDraft('')
      setChatContext('')
      setChatTags([])
      setChatImmersive(false)
    }
  }

  const resetChatState = () => {
    setChatStep('input')
    setChatDraft('')
    setChatContext('')
    setChatTags([])
    setChatImmersive(false)
    setChatSunk(false)
    setIsChatMinimized(false)
  }

  const handleDockViewModeChange = (mode: 'list' | 'card') => {
    setDockViewMode(mode)
    localStorage.setItem('atlax-dock-view-mode', mode)
  }

  const handleViewChange = (view: ViewType) => {
    setActiveNav(view)
    if (view !== 'dock') setSelectedItemId(null)
    if (view !== 'entries') setSelectedArchivedEntryId(null)
    if (view === 'review') recordEvent({ type: 'weekly_review_opened' })
  }

  const refreshList = async () => {
    try {
      const [data, archived, tags, stats] = await Promise.all([
        listDockItems(userId),
        listArchivedEntries(userId),
        listTags(userId),
        getWorkspaceStats(userId),
      ])
      setItems(data)
      setArchivedEntries(archived)
      setExistingTags(tags)
      setReviewStats(stats)
      setError(null)
      return data
    } catch {
      setError('刷新失败，请重试')
      return []
    }
  }

  const handleSaveEntry = async (content: string, tags?: string[], navigateToDock?: boolean) => {
    if (!content.trim()) return
    const shouldNavigate = navigateToDock ?? (inputMode !== 'chat')
    try {
      const sourceType = inputMode === 'chat' ? 'chat' : 'text'
      const id = await createDockItem(userId, content, sourceType)
      recordEvent({ type: 'capture_created', sourceType, dockItemId: id })
      if (inputMode === 'chat') {
        recordEvent({ type: 'chat_guided_capture_created', dockItemId: id, rawText: content })
      }
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          await createStoredTag(userId, tagName)
          await addTagToItem(userId, id, tagName)
        }
      }
      await refreshList()
      if (shouldNavigate) {
        setActiveNav('dock')
      }
    } catch {
      setError('保存失败，请重试')
    }
    setInputText('')
    setIsInputExpanded(false)
  }

  const handleChatFinalSubmit = async () => {
    const finalContent = chatContext.trim()
      ? `${chatDraft}\n\n补充：${chatContext}`
      : chatDraft
    const userMsgId = `msg-${Date.now()}`
    setChatMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: chatDraft, timestamp: Date.now() }])
    if (chatContext.trim()) {
      setChatMessages((prev) => [...prev, { id: `ctx-${Date.now()}`, role: 'user', content: `补充：${chatContext}`, timestamp: Date.now() }])
    }
    setChatImmersive(true)
    setChatSunk(true)
    await handleSaveEntry(finalContent, chatTags, false)
    setChatMessages((prev) => [...prev, { id: `sys-${Date.now()}`, role: 'system', content: '已成功入 Dock', timestamp: Date.now() }])
    setChatStep('done')
    setChatDraft('')
    setChatContext('')
    setChatTags([])
  }

  const wrapAction = async (action: () => Promise<DockItem | null>) => {
    if (actionLoading) return
    setActionLoading(true)
    setError(null)
    try {
      const result = await action()
      if (result) {
        const archived = await listArchivedEntries(userId)
        setArchivedEntries(archived)
        setItems((current) => current.map((i) => (i.id === result.id ? result : i)))
        const stats = await getWorkspaceStats(userId)
        setReviewStats(stats)
      } else {
        await refreshList()
      }
    } catch {
      setError('操作失败，请重试')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuggest = async (id: number) => {
    setDismissedSuggestions((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    await wrapAction(() => suggestItem(userId, id))
  }

  const handleArchive = async (id: number) => {
    const item = items.find((i) => i.id === id)
    const sourceType = item?.sourceType ?? 'text'
    await wrapAction(async () => {
      const result = await archiveItem(userId, id)
      if (result) {
        recordEvent({ type: 'archive_completed', dockItemId: id, sourceType: sourceType as 'text' | 'voice' | 'import' | 'chat' })
      }
      return result
    })
  }

  const handleIgnore = async (id: number) => {
    await wrapAction(() => ignoreItem(userId, id))
  }

  const handleRestore = async (id: number) => {
    await wrapAction(() => restoreItem(userId, id))
  }

  const handleReopen = async (dockItemId: number) => {
    if (actionLoading) return
    setActionLoading(true)
    setError(null)
    try {
      const result = await reopenItem(userId, dockItemId)
      if (result) {
        const archived = await listArchivedEntries(userId)
        setArchivedEntries(archived)
        setItems((current) => current.map((i) => (i.id === result.id ? result : i)))
        setActiveNav('dock')
        setSelectedItemId(result.id)
        setSelectedArchivedEntryId(null)
        const stats = await getWorkspaceStats(userId)
        setReviewStats(stats)
      }
    } catch {
      setError('操作失败，请重试')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddTag = async (id: number, tagName: string) => {
    await wrapAction(async () => {
      await createStoredTag(userId, tagName)
      return addTagToItem(userId, id, tagName)
    })
  }

  const handleRemoveTag = async (id: number, tagName: string) => {
    await wrapAction(() => removeTagFromItem(userId, id, tagName))
  }

  const handleDismissSuggestion = (itemId: number, tagName: string) => {
    setDismissedSuggestions((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] ?? []), tagName],
    }))
  }

  const handleUpdateEntry = async (entryId: number, updates: { tags?: string[]; project?: string | null; content?: string; title?: string }) => {
    const result = await updateArchivedEntry(userId, entryId, updates)
    if (result) {
      setArchivedEntries((current) => current.map((e) => (e.id === result.id ? result : e)))
    }
  }

  const handleUpdateDockItem = async (itemId: number, rawText: string) => {
    const result = await updateDockItemText(userId, itemId, rawText)
    if (result) {
      setItems((current) => current.map((i) => (i.id === result.id ? result : i)))
    }
  }

  const handleSelectItem = (id: number) => {
    setSelectedItemId((prev) => (prev === id ? null : id))
  }

  const handleSelectArchivedEntry = (id: number) => {
    setSelectedArchivedEntryId((prev) => (prev === id ? null : id))
    if (activeNav !== 'entries') setActiveNav('entries')
    recordEvent({ type: 'browse_revisit', entryId: id })
  }

  const dockItemStatusMap = new Map(items.map((i) => [i.id, i.status]))

  const filteredEntries = archivedEntries.filter((entry) => {
    if (entryFilterType && entry.type !== entryFilterType) return false
    if (entryFilterTag && !entry.tags.includes(entryFilterTag)) return false
    if (entryFilterProject && entry.project !== entryFilterProject) return false
    if (entryFilterStatus) {
      const dockStatus = dockItemStatusMap.get(entry.sourceDockItemId)
      if (dockStatus !== entryFilterStatus) return false
    }
    return true
  })

  const uniqueProjects = Array.from(new Set(archivedEntries.map((e) => e.project).filter(Boolean))) as string[]
  const uniqueTags = Array.from(new Set(archivedEntries.flatMap((e) => e.tags)))
  const hasActiveFilters = entryFilterType || entryFilterTag || entryFilterProject || entryFilterStatus

  const clearEntryFilters = () => {
    setEntryFilterType('')
    setEntryFilterTag('')
    setEntryFilterProject('')
    setEntryFilterStatus('')
  }

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F5F7] dark:bg-[#0E0E11]">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  if (!user) {
    return <AuthGate onAuthenticated={handleAuthenticated} />
  }

  const selectedItem = activeNav === 'dock'
    ? items.find((i) => i.id === selectedItemId) ?? null
    : null

  const selectedArchivedEntry = activeNav === 'entries'
    ? archivedEntries.find((e) => e.id === selectedArchivedEntryId) ?? null
    : null

  const hasSelectedItem = !!(selectedItem || selectedArchivedEntry)
  const effectiveSidebarCollapsed = isSidebarManuallyCollapsed || hasSelectedItem

  const pendingCount = items.filter((i) => i.status === 'pending' || i.status === 'suggested').length

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="flex h-screen w-full bg-[#F5F5F7] dark:bg-[#0E0E11] text-slate-800 dark:text-slate-200 font-sans overflow-hidden selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)]">

        <Sidebar
          activeNav={activeNav}
          setActiveNav={handleViewChange}
          user={user}
          onLogout={handleLogout}
          dockCount={pendingCount}
          mode={inputMode}
          onModeChange={handleModeChange}
          isCollapsed={effectiveSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarManuallyCollapsed(!isSidebarManuallyCollapsed)}
        />

        <div className="flex-1 flex relative overflow-hidden">
          <div className={`flex flex-col relative overflow-hidden transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
            hasSelectedItem ? 'w-[320px] flex-shrink-0 border-r border-slate-200/50 dark:border-white/5 bg-[#F5F5F7]/50 dark:bg-[#0E0E11]/50' : 'flex-1'
          }`}>

            <header className="h-16 flex items-center justify-between px-6 bg-white/40 dark:bg-[#1C1C1E]/40 backdrop-blur-md border-b border-white/20 dark:border-white/5 z-10 sticky top-0 transition-colors duration-[800ms]">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                  {activeNav === 'dock' ? 'Dock' : activeNav === 'entries' ? 'Entries' : 'Review'}
                </h1>
                {!hasSelectedItem && (
                  <span className="px-2 py-0.5 bg-slate-200/50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-full text-xs font-medium">
                    {activeNav === 'dock' ? items.length : activeNav === 'entries' ? filteredEntries.length : reviewStats.totalEntries}
                  </span>
                )}
                {activeNav === 'entries' && hasActiveFilters && !hasSelectedItem && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    (已筛选，共 {archivedEntries.length} 条)
                  </span>
                )}
              </div>
              {!hasSelectedItem && (
                <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <button className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-colors">
                    <Search size={20} />
                  </button>
                  <ThemeToggle mode={themeMode} setMode={setThemeMode} />
                </div>
              )}
            </header>

            <main className="flex-1 overflow-y-auto px-6 py-4 pb-40">
              <div className="max-w-4xl mx-auto space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-32 opacity-50">
                    <Loader2 className="animate-spin text-slate-400" size={24} />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                ) : activeNav === 'dock' ? (
                  items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-slate-400 dark:text-slate-500">
                      <Dock size={32} className="mb-3 opacity-50" />
                      <p className="text-sm">Dock 为空</p>
                      <p className="text-xs mt-1 opacity-60">在下方输入框快速记录</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-end gap-1 mb-2">
                        <button
                          onClick={() => handleDockViewModeChange('card')}
                          className={`p-1.5 rounded-lg transition-colors ${dockViewMode === 'card' ? 'bg-white dark:bg-white/10 text-blue-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                          title="卡片视图"
                        >
                          <BarChart3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDockViewModeChange('list')}
                          className={`p-1.5 rounded-lg transition-colors ${dockViewMode === 'list' ? 'bg-white dark:bg-white/10 text-blue-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                          title="列表视图"
                        >
                          <List size={14} />
                        </button>
                      </div>
                      {items.map((item) => (
                        <DockCard
                          key={item.id}
                          item={item}
                          isSelected={selectedItemId === item.id}
                          onSelect={handleSelectItem}
                          viewMode={dockViewMode}
                        />
                      ))}
                    </>
                  )
                ) : activeNav === 'entries' ? (
                  <>
                    <EntriesFilterBar
                      filterType={entryFilterType}
                      setFilterType={setEntryFilterType}
                      filterTag={entryFilterTag}
                      setFilterTag={setEntryFilterTag}
                      filterProject={entryFilterProject}
                      setFilterProject={setEntryFilterProject}
                      filterStatus={entryFilterStatus}
                      setFilterStatus={setEntryFilterStatus}
                      uniqueTags={uniqueTags}
                      uniqueProjects={uniqueProjects}
                      hasActiveFilters={!!hasActiveFilters}
                      onClear={clearEntryFilters}
                    />
                    {filteredEntries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-slate-400 dark:text-slate-500">
                        <Archive size={32} className="mb-3 opacity-50" />
                        <p className="text-sm">{hasActiveFilters ? '没有匹配的归档内容' : '暂无归档内容'}</p>
                        {hasActiveFilters && (
                          <button onClick={clearEntryFilters} className="text-xs text-blue-500 dark:text-blue-400 mt-1 hover:underline">清除筛选</button>
                        )}
                      </div>
                    ) : (
                      filteredEntries.map((entry) => (
                        <EntryCard
                          key={entry.id}
                          entry={entry}
                          isSelected={selectedArchivedEntryId === entry.id}
                          onSelect={handleSelectArchivedEntry}
                        />
                      ))
                    )}
                  </>
                ) : (
                  <ReviewView stats={reviewStats} archivedEntries={archivedEntries} onSelectArchivedEntry={handleSelectArchivedEntry} />
                )}
              </div>
            </main>

            {chatImmersive && inputMode === 'chat' && (
              <div className="fixed inset-0 z-30 flex flex-col bg-[#F5F5F7]/80 dark:bg-[#0E0E11]/80 backdrop-blur-[12px] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
                <div className="h-16 flex items-center justify-between px-8 bg-white/40 dark:bg-[#1C1C1E]/40 backdrop-blur-md border-b border-white/20 dark:border-white/5 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-500" />
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Chat</h2>
                  </div>
                  <button
                    onClick={() => { setChatImmersive(false); setChatSunk(false) }}
                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Minimize2 size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  <div className="max-w-3xl mx-auto space-y-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white dark:bg-[#1C1C1E] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-bl-md shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatStep === 'done' && (
                      <div className="flex justify-center gap-3 py-4">
                        <button
                          onClick={() => { setChatStep('input'); setChatDraft('') }}
                          className="px-5 py-2.5 text-sm font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                          <Plus size={16} /> 留在 Chat
                        </button>
                        <button
                          onClick={() => { setInputMode('classic'); resetChatState(); setChatMessages([]); setActiveNav('dock') }}
                          className="px-5 py-2.5 text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/20 transition-colors flex items-center gap-2"
                        >
                          <Dock size={16} /> 去 Dock 查看
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`w-full mt-auto transition-all duration-[700ms] ease-[cubic-bezier(0.23,1,0.32,1)] z-10 ${
                    chatSunk
                      ? 'px-8 pt-4 bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 translate-y-0 opacity-100'
                      : 'px-8 pt-0 bg-transparent border-t border-transparent translate-y-[-10vh] opacity-80'
                  }`}
                  style={{
                    paddingBottom: chatSunk ? '1.5rem' : 'calc(50vh - 40px)'
                  }}
                >
                  <div className="max-w-3xl mx-auto">
                    <ChatInputBar
                      draft={chatDraft}
                      setDraft={setChatDraft}
                      step={chatStep}
                      setStep={setChatStep}
                      context={chatContext}
                      setContext={setChatContext}
                      tags={chatTags}
                      setTags={setChatTags}
                      newTag={chatNewTag}
                      setNewTag={setChatNewTag}
                      existingTags={existingTags}
                      onSubmit={handleChatFinalSubmit}
                      onGoToDock={() => { setInputMode('classic'); resetChatState(); setChatMessages([]); setActiveNav('dock') }}
                      onEnterChat={() => { 
                        setChatImmersive(true)
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            setChatSunk(true)
                          })
                        })
                      }}
                      immersive={chatImmersive}
                      sunk={chatSunk}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* blur overlay for non-immersive chat mode */}
            <div
              onClick={() => {
                if (inputMode === 'chat' && !chatImmersive) {
                  setIsChatMinimized(true)
                }
              }}
              className={`absolute inset-0 z-40 bg-[#F5F5F7]/40 dark:bg-[#0E0E11]/40 backdrop-blur-[8px] transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
                inputMode === 'chat' && !chatImmersive && !isChatMinimized && !hasSelectedItem ? 'opacity-100 pointer-events-none' : 'opacity-0 pointer-events-none'
              }`}
            />

            <div
              className={`absolute left-0 w-full flex flex-col items-center z-50 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
                chatImmersive || isChatMinimized || hasSelectedItem ? 'opacity-0 pointer-events-none scale-95 translate-y-8' : 'opacity-100 scale-100 translate-y-0 pointer-events-none'
              }`}
              style={{ bottom: 0, paddingBottom: inputMode === 'chat' ? 'calc(50vh - 40px)' : '24px' }}
            >
              <div className="w-full max-w-4xl flex flex-col items-center pointer-events-auto relative">
                <div className={`mb-3 transition-all duration-500 ease-out ${isInputExpanded || (inputMode === 'chat' && chatStep !== 'input') ? 'opacity-0 -translate-y-4 pointer-events-none absolute' : 'opacity-100 translate-y-0 relative'}`}>
                  <ModeSwitch mode={inputMode} setMode={handleModeChange} />
                </div>
                {inputMode === 'chat' ? (
                  <div className="w-full max-w-3xl">
                    <ChatInputBar
                      draft={chatDraft}
                      setDraft={setChatDraft}
                      step={chatStep}
                      setStep={setChatStep}
                      context={chatContext}
                      setContext={setChatContext}
                      tags={chatTags}
                      setTags={setChatTags}
                      newTag={chatNewTag}
                      setNewTag={setChatNewTag}
                      existingTags={existingTags}
                      onSubmit={handleChatFinalSubmit}
                      onGoToDock={() => { setInputMode('classic'); resetChatState(); setChatMessages([]); setActiveNav('dock') }}
                      onEnterChat={() => { 
                        setChatImmersive(true)
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            setChatSunk(true)
                          })
                        })
                      }}
                      immersive={chatImmersive}
                      sunk={false}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-4xl">
                    <InputContainer
                      expanded={isInputExpanded}
                      setExpanded={setIsInputExpanded}
                      text={inputText}
                      setText={setInputText}
                      onSave={handleSaveEntry}
                      onClose={() => setIsInputExpanded(false)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Floating Chat Button when minimized or item selected */}
            <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 ${((isChatMinimized || hasSelectedItem) && inputMode === 'chat') ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}>
              <button
                onClick={() => {
                  setIsChatMinimized(false)
                  if (hasSelectedItem) {
                    setSelectedItemId(null)
                    setSelectedArchivedEntryId(null)
                  }
                }}
                className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-[0_8px_30px_rgb(59,130,246,0.3)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group"
                title="恢复 Chat 界面"
              >
                <MessageSquare size={24} />
                <div 
                  className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 dark:bg-slate-700 rounded-full border-2 border-white dark:border-[#0E0E11] scale-0 group-hover:scale-100 transition-transform flex items-center justify-center" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setInputMode('classic')
                    setIsChatMinimized(false)
                  }}
                  title="关闭 Chat 模式"
                >
                  <X size={10} className="text-white" />
                </div>
              </button>
            </div>
          </div>

          {(selectedItem || selectedArchivedEntry) && (
            <DetailSlidePanel
              item={selectedItem}
              archivedEntry={selectedArchivedEntry}
              existingTags={existingTags}
              dismissedSuggestions={selectedItem ? (dismissedSuggestions[selectedItem.id] ?? []) : []}
              onSuggest={handleSuggest}
              onArchive={handleArchive}
              onIgnore={handleIgnore}
              onRestore={handleRestore}
              onReopen={handleReopen}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onDismissSuggestion={(tagName) => {
                if (selectedItem) handleDismissSuggestion(selectedItem.id, tagName)
              }}
              onUpdateEntry={handleUpdateEntry}
              onUpdateDockItem={handleUpdateDockItem}
              onClose={() => { setSelectedItemId(null); setSelectedArchivedEntryId(null) }}
              actionLoading={actionLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ThemeToggle({ mode, setMode }: { mode: string; setMode: (m: 'system' | 'light' | 'dark') => void }) {
  const cycleMode = () => {
    if (mode === 'system') setMode('light')
    else if (mode === 'light') setMode('dark')
    else setMode('system')
  }

  const getClipPath = (type: 'sun' | 'moon') => {
    if (mode === 'system') {
      return type === 'sun'
        ? 'polygon(0 0, 50% 0, 50% 100%, 0% 100%)'
        : 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)'
    }
    if (mode === 'light') {
      return type === 'sun'
        ? 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)'
        : 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'
    }
    return type === 'sun'
      ? 'polygon(0 0, 0 0, 0 100%, 0% 100%)'
      : 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)'
  }

  return (
    <button
      onClick={cycleMode}
      className="relative p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors w-9 h-9 flex items-center justify-center group"
      title={mode === 'system' ? '跟随系统' : mode === 'light' ? '日间模式' : '夜间模式'}
    >
      <div className="absolute inset-0 flex items-center justify-center transition-all duration-[600ms] ease-linear" style={{ clipPath: getClipPath('sun') }}>
        <Sun size={18} className="text-amber-500" strokeWidth={2} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center transition-all duration-[600ms] ease-linear" style={{ clipPath: getClipPath('moon') }}>
        <Moon size={18} className="text-indigo-400" strokeWidth={2} />
      </div>
    </button>
  )
}

function Sidebar({ activeNav, setActiveNav, user, onLogout, dockCount, mode, onModeChange, isCollapsed, onToggleCollapse }: {
  activeNav: ViewType
  setActiveNav: (nav: ViewType) => void
  user: LocalUser
  onLogout: () => void
  dockCount: number
  mode: AppMode
  onModeChange: (m: AppMode) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}) {
  const navItems: { id: ViewType; icon: typeof Dock; label: string }[] = [
    { id: 'dock', icon: Dock, label: 'Dock' },
    { id: 'entries', icon: Archive, label: 'Entries' },
    { id: 'review', icon: BarChart3, label: 'Review' },
  ]

  return (
    <div className={`${isCollapsed ? 'w-[72px]' : 'w-64'} h-full bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl border-r border-slate-200/50 dark:border-white/5 flex flex-col transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] relative z-20`}>
      <button 
        onClick={onToggleCollapse} 
        className="absolute -right-3 top-6 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/10 rounded-full p-1 shadow-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-50 transition-colors"
        title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
      >
        {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>

      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <div className="relative w-10 h-10 flex flex-shrink-0 items-center justify-center group cursor-pointer">
          <div className="absolute inset-0 bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/10 transition-shadow duration-500 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] dark:group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]"></div>
          <div className="absolute inset-[3px] rounded-[11px] bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-400 opacity-80 blur-[1px] group-hover:opacity-100 group-hover:blur-[2px] group-hover:scale-105 transition-all duration-700 ease-out"></div>
          <div className="absolute inset-[3px] rounded-[11px] bg-gradient-to-b from-white/80 dark:from-white/30 via-white/20 dark:via-transparent to-transparent border border-white/50 dark:border-white/20 z-10 pointer-events-none"></div>
          <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.4)] z-20 group-hover:scale-110 transition-transform duration-300"></div>
        </div>
        {!isCollapsed && (
          <div className="flex flex-col justify-center ml-3.5 mt-0.5 cursor-pointer overflow-hidden whitespace-nowrap">
            <span className="text-[9px] font-bold tracking-[0.35em] text-slate-400 uppercase leading-none mb-1">Atlax</span>
            <span className="text-[22px] tracking-[-0.04em] text-slate-800 dark:text-slate-100 leading-none flex items-center transition-colors">
              <span className="font-bold text-slate-900 dark:text-white">Mind</span>
              <span className="font-light text-slate-500 dark:text-slate-400">Dock</span>
            </span>
          </div>
        )}
      </div>

      <div className={`px-4 pb-2 ${isCollapsed ? 'hidden' : ''}`}>
        <ModeSwitch mode={mode} setMode={onModeChange} />
      </div>

      <nav className={`flex-1 space-y-1 mt-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {navItems.map((item) => {
          const isActive = activeNav === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3 py-2.5'} rounded-xl transition-all duration-300 ease-out group relative ${
                isActive
                  ? 'bg-white dark:bg-[#2C2C2E] shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={isCollapsed ? 20 : 18} className={isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors flex-shrink-0'} />
              {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              {!isCollapsed && item.id === 'dock' && dockCount > 0 && (
                <span className="ml-auto bg-blue-500 dark:bg-blue-400 text-white dark:text-blue-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {dockCount}
                </span>
              )}
              {isCollapsed && item.id === 'dock' && dockCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-[#1C1C1E]"></span>
              )}
            </button>
          )
        })}
      </nav>

      <div className={`p-4 ${isCollapsed ? 'px-2 flex justify-center' : ''}`}>
        <div className={`bg-slate-100/50 dark:bg-black/20 rounded-2xl border border-white dark:border-white/5 flex items-center transition-colors ${isCollapsed ? 'p-2 flex-col gap-2' : 'p-4 space-x-3'}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 dark:from-blue-900 to-indigo-100 dark:to-indigo-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold shadow-inner flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">本地模式</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className={`p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors`}
            title="退出登录"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function EntriesFilterBar({ filterType, setFilterType, filterTag, setFilterTag, filterProject, setFilterProject, filterStatus, setFilterStatus, uniqueTags, uniqueProjects, hasActiveFilters, onClear }: {
  filterType: string
  setFilterType: (v: string) => void
  filterTag: string
  setFilterTag: (v: string) => void
  filterProject: string
  setFilterProject: (v: string) => void
  filterStatus: string
  setFilterStatus: (v: string) => void
  uniqueTags: string[]
  uniqueProjects: string[]
  hasActiveFilters: boolean
  onClear: () => void
}) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_15px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-white/5 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={14} className="text-slate-400 dark:text-slate-500" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">筛选</span>
        {hasActiveFilters && (
          <button onClick={onClear} className="ml-auto text-[10px] text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1">
            <X size={10} /> 清除全部
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-2 py-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 dark:text-slate-200"
          >
            {ENTRY_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <List size={12} className="text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs px-2 py-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 dark:text-slate-200"
          >
            {ENTRY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {uniqueTags.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Tag size={12} className="text-slate-400" />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="text-xs px-2 py-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 dark:text-slate-200"
            >
              <option value="">全部标签</option>
              {uniqueTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        )}
        {uniqueProjects.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Hash size={12} className="text-slate-400" />
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="text-xs px-2 py-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 dark:text-slate-200"
            >
              <option value="">全部项目</option>
              {uniqueProjects.map((proj) => (
                <option key={proj} value={proj}>{proj}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

function DockCard({ item, isSelected, onSelect, viewMode = 'card' }: { item: DockItem; isSelected: boolean; onSelect: (id: number) => void; viewMode?: 'list' | 'card' }) {
  const statusConfig = STATUS_LABELS[item.status]
  const allTags = [...(item.userTags ?? [])]

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onSelect(item.id)}
        className={`bg-white dark:bg-[#1C1C1E] rounded-xl p-3 border transition-all duration-200 cursor-pointer flex items-center gap-3 ${
          isSelected
            ? 'border-blue-300 dark:border-blue-500/40 shadow-[0_2px_10px_rgba(59,130,246,0.1)]'
            : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'
        }`}
      >
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusConfig.bg} ${statusConfig.color} flex-shrink-0`}>
          {statusConfig.label}
        </span>
        <p className="text-slate-700 dark:text-slate-300 text-sm flex-1 line-clamp-2">
          {item.rawText}
        </p>
        {item.sourceType === 'chat' && (
          <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] rounded font-medium flex-shrink-0">
            Chat
          </span>
        )}
        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    )
  }

  return (
    <div
      onClick={() => onSelect(item.id)}
      className={`bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_15px_rgba(0,0,0,0.2)] border transition-all duration-300 ease-out group flex flex-col gap-3 cursor-pointer ${
        isSelected
          ? 'border-blue-300 dark:border-blue-500/40 shadow-[0_4px_20px_rgba(59,130,246,0.15)] dark:shadow-[0_4px_20px_rgba(59,130,246,0.2)]'
          : 'border-slate-100 dark:border-white/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed flex-1 line-clamp-2 transition-colors">
          {item.rawText}
        </p>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0 group/btn">
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-500 group-hover/btn:text-slate-600 dark:group-hover/btn:text-slate-300" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-50 dark:border-white/5">
        <div className="flex items-center space-x-2 flex-wrap gap-1">
          <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${statusConfig.bg} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          {item.sourceType === 'chat' && (
            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs rounded-md font-medium border border-indigo-100 dark:border-indigo-500/20">
              Chat
            </span>
          )}
          {allTags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs rounded-md font-medium transition-colors">
              #{tag}
            </span>
          ))}
          {allTags.length > 3 && (
            <span className="text-[10px] text-slate-400">+{allTags.length - 3}</span>
          )}
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 flex-shrink-0 ml-2">
          <Clock size={12} />
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

function EntryCard({ entry, isSelected, onSelect }: { entry: StoredEntry; isSelected: boolean; onSelect: (id: number) => void }) {
  return (
    <div
      onClick={() => onSelect(entry.id)}
      className={`bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_15px_rgba(0,0,0,0.2)] border transition-all duration-300 ease-out group cursor-pointer ${
        isSelected
          ? 'border-green-300 dark:border-green-500/40 shadow-[0_4px_20px_rgba(34,197,94,0.15)]'
          : 'border-slate-100 dark:border-white/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-sm leading-snug flex-1">
          {entry.title}
        </h3>
        <span className="px-2 py-0.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs rounded-md font-medium border border-green-100 dark:border-green-500/20 ml-2 flex-shrink-0">
          {TYPE_LABELS[entry.type] ?? entry.type}
        </span>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 mb-3">
        {entry.content}
      </p>
      <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-white/5">
        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs rounded-md font-medium">
              #{tag}
            </span>
          ))}
          {entry.project && (
            <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:purple-400 text-xs rounded-md font-medium">
              {entry.project}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex-shrink-0 ml-2">
          {new Date(entry.archivedAt).toLocaleDateString('zh-CN')}
        </span>
      </div>
    </div>
  )
}

function ReviewView({ stats, archivedEntries, onSelectArchivedEntry }: { stats: { totalEntries: number; pendingCount: number; suggestedCount: number; archivedCount: number; ignoredCount: number; reopenedCount: number; tagCount: number }; archivedEntries: StoredEntry[]; onSelectArchivedEntry: (id: number) => void }) {
  const statCards = [
    { label: '待处理', value: stats.pendingCount, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
    { label: '已建议', value: stats.suggestedCount, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: '已归档', value: stats.archivedCount, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
    { label: '已忽略', value: stats.ignoredCount, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10' },
    { label: '重新整理', value: stats.reopenedCount, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { label: '标签数', value: stats.tagCount, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  ]

  const [metrics, setMetrics] = useState<MetricsResult | null>(null)

  useEffect(() => {
    const events = getEventLog()
    setMetrics(computeMetrics(events))
  }, [])

  const metricCards: { label: string; value: string; color: string; bg: string }[] = metrics ? [
    { label: 'DAU', value: String(metrics.dau), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: '日均记录', value: String(metrics.dailyCapturesPerUser), color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'Chat 归档率', value: `${Math.round(metrics.chatArchiveRate * 100)}%`, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
    { label: '7日留存', value: String(metrics.retention7d), color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { label: 'Review 打开率', value: String(metrics.weeklyReviewOpenRate), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  ] : []

  const recentEntries = archivedEntries.slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_15px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-white/5">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">知识库概览</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">共 {stats.totalEntries} 条归档内容</p>
        <div className="grid grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className={`${card.bg} rounded-xl p-4 text-center transition-colors`}>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_15px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">行为指标</h2>
          {metrics && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              生成于 {new Date(metrics.generatedAt).toLocaleTimeString('zh-CN')}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">基于事件日志实时计算，chatArchiveRate 按唯一 dockItemId 去重，retention7d 为 D0→D7 cohort 口径</p>
        {metrics ? (
          <div className="grid grid-cols-5 gap-3">
            {metricCards.map((card) => (
              <div key={card.label} className={`${card.bg} rounded-xl p-4 text-center transition-colors`}>
                <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{card.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-16 opacity-50">
            <Loader2 className="animate-spin text-slate-400" size={20} />
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_15px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-white/5">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">最近归档</h2>
        {recentEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
            <Archive size={24} className="mb-2 opacity-50" />
            <p className="text-sm">暂无归档内容</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onSelectArchivedEntry(entry.id)}
                className="w-full text-left bg-slate-50/50 dark:bg-black/20 rounded-xl p-3.5 hover:bg-slate-100/80 dark:hover:bg-white/5 border border-slate-100/50 dark:border-white/5 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {entry.title}
                  </h3>
                  <span className="px-1.5 py-0.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] rounded font-medium ml-2 flex-shrink-0">
                    {TYPE_LABELS[entry.type] ?? entry.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entry.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] rounded">#{tag}</span>
                    ))}
                    {entry.project && (
                      <span className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] rounded">{entry.project}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2">
                    {new Date(entry.archivedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ModeSwitch({ mode, setMode }: { mode: AppMode; setMode: (m: AppMode) => void }) {
  return (
    <div className="relative flex items-center p-1 bg-white/60 dark:bg-[#2C2C2E]/60 backdrop-blur-md rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.05)] dark:shadow-none border border-slate-200/50 dark:border-white/10 transition-colors">
      <div
        className="absolute h-[calc(100%-8px)] top-1 w-[100px] bg-white dark:bg-[#4C4C50] rounded-full shadow-sm transition-transform duration-300"
        style={{ transform: mode === 'chat' ? 'translateX(0)' : 'translateX(100px)' }}
      />
      <button
        onClick={() => setMode('chat')}
        className={`relative z-10 w-[100px] py-1.5 text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-1.5 ${mode === 'chat' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
      >
        <MessageSquare size={14} />
        Chat
      </button>
      <button
        onClick={() => setMode('classic')}
        className={`relative z-10 w-[100px] py-1.5 text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-1.5 ${mode === 'classic' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
      >
        <PenTool size={14} />
        Classic
      </button>
    </div>
  )
}

function ChatInputBar({ 
  draft, 
  setDraft, 
  step, 
  setStep, 
  context, 
  setContext, 
  tags, 
  setTags, 
  newTag, 
  setNewTag, 
  existingTags, 
  onSubmit, 
  onGoToDock, 
  onEnterChat, 
  immersive: _immersive = false, 
  sunk: _sunk = false 
}: {
  draft: string
  setDraft: (v: string) => void
  step: ChatStep
  setStep: (s: ChatStep) => void
  context: string
  setContext: (v: string) => void
  tags: string[]
  setTags: (v: string[]) => void
  newTag: string
  setNewTag: (v: string) => void
  existingTags: StoredTag[]
  onSubmit: () => Promise<void>
  onGoToDock: () => void
  onEnterChat: () => void
  immersive?: boolean
  sunk?: boolean
}) {
  const [saving, setSaving] = useState(false)
  const [placeholder] = useState(() => CHAT_PLACEHOLDERS[Math.floor(Math.random() * CHAT_PLACEHOLDERS.length)])

  const handleFinalSubmit = async () => {
    if (saving) return
    setSaving(true)
    try {
      await onSubmit()
    } finally {
      setSaving(false)
    }
  }

  if (step === 'confirm') {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-[0_20px_60px_rgb(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 p-4 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
        <div className="px-3 py-1 mb-3 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-md flex items-center gap-1"><MessageSquare size={10} /> 确认记录</span>
          <button onClick={() => { setStep('input') }} className="p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors"><Minimize2 size={14} /></button>
        </div>
        <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap mb-3">{draft}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">确认记录这条内容，或继续补充：</p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="继续输入…"
            className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 dark:text-slate-200"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setStep('context') }
            }}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStep('context')} className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-1.5">
            确认，继续 <ChevronRight size={14} />
          </button>
          <button onClick={() => { setStep('input') }} className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
            重新输入
          </button>
        </div>
      </div>
    )
  }

  if (step === 'context') {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-[0_20px_60px_rgb(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 p-4 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
        <div className="px-3 py-1 mb-3 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-md flex items-center gap-1"><Sparkles size={10} /> 补充上下文</span>
          <button onClick={() => { setStep('input') }} className="p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors"><Minimize2 size={14} /></button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">原内容：{draft.slice(0, 60)}{draft.length > 60 ? '…' : ''}</p>
        <textarea
          autoFocus
          placeholder="补充更多上下文（可选）..."
          className="w-full h-20 bg-transparent border-none focus:outline-none resize-none text-slate-700 dark:text-slate-200 text-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-relaxed"
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
        <div className="flex gap-2 pt-2">
          <button onClick={() => setStep('tags')} className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-1.5">
            继续 <ChevronRight size={14} />
          </button>
          <button onClick={() => setStep('tags')} className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
            跳过
          </button>
        </div>
      </div>
    )
  }

  if (step === 'tags') {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-[0_20px_60px_rgb(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 p-4 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
        <div className="px-3 py-1 mb-3 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded-md flex items-center gap-1"><Tag size={10} /> 确认标签</span>
          <button onClick={() => { setStep('input') }} className="p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors"><Minimize2 size={14} /></button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">为这条记录添加标签</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium border border-blue-100 dark:border-blue-500/20">
              {tag}
              <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"><X size={10} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mb-2">
          <input
            autoFocus
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const trimmed = newTag.trim()
                if (trimmed && !tags.includes(trimmed)) {
                  setTags([...tags, trimmed])
                  setNewTag('')
                }
              }
            }}
            placeholder="输入标签…"
            className="flex-1 px-2 py-1 text-xs bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 dark:text-slate-200"
          />
          <button
            onClick={() => {
              const trimmed = newTag.trim()
              if (trimmed && !tags.includes(trimmed)) {
                setTags([...tags, trimmed])
                setNewTag('')
              }
            }}
            disabled={!newTag.trim()}
            className="px-2 py-1 text-xs bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-white/20 disabled:opacity-50 transition-colors"
          >
            添加
          </button>
        </div>
        {existingTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {existingTags.slice(0, 8).map((tag) => (
              <button
                key={tag.id}
                onClick={() => { if (!tags.includes(tag.name)) setTags([...tags, tag.name]) }}
                disabled={tags.includes(tag.name)}
                className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                  tags.includes(tag.name)
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-400 dark:text-blue-500 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button onClick={handleFinalSubmit} disabled={saving} className="px-4 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors flex items-center gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {saving ? '保存中…' : '确认入 Dock'}
          </button>
          <button onClick={() => setStep('context')} className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
            返回
          </button>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col gap-2 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-green-500/10 dark:bg-green-500/20 backdrop-blur-md border border-green-200 dark:border-green-500/30 rounded-xl p-2 px-4 flex items-center gap-3">
          <CheckSquare size={16} className="text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300 flex-1">已成功入 Dock</span>
          <div className="flex gap-2 mr-2">
            <button 
              onClick={() => { setStep('input'); setDraft('') }}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              继续输入
            </button>
            <span className="text-slate-300 dark:text-white/10">|</span>
            <button 
              onClick={onGoToDock}
              className="text-xs text-slate-500 dark:text-slate-400 font-medium hover:underline"
            >
              去 Dock 查看
            </button>
          </div>
        </div>
        <div className="bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-3xl rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] border border-white dark:border-white/10 p-2.5 flex items-center transition-all duration-300 group relative">
          <div className="flex items-center space-x-1 pl-1 relative z-10 opacity-40 grayscale pointer-events-none">
            <ToolButton icon={Mic} tooltip="语音闪记" />
            <ToolButton icon={Paperclip} tooltip="附件" />
          </div>
          <input
            autoFocus
            type="text"
            placeholder="继续记录你的想法…"
            className="flex-1 bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-200 px-3 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[15px] relative z-10"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) {
                setStep('input'); // Reset to input step before submitting
                setTimeout(() => setStep('confirm'), 0);
              }
            }}
          />
          <button
            onClick={() => { if (draft.trim()) { setStep('input'); setTimeout(() => setStep('confirm'), 0); } }}
            disabled={!draft.trim()}
            className={`ml-1.5 p-2 rounded-xl transition-all duration-300 ${
              draft.trim() ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-3xl rounded-2xl shadow-[0_20px_60px_rgb(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white dark:border-white/10 p-2.5 flex items-center transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-100/50 dark:focus-within:ring-blue-500/30 focus-within:border-blue-200 dark:focus-within:border-blue-400 group relative">
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-transparent to-purple-400/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-700" />
      </div>
      <div className="flex items-center space-x-1 pl-1 relative z-10">
        <ToolButton icon={Mic} tooltip="语音闪记" />
        <ToolButton icon={Paperclip} tooltip="附件" />
        <ToolButton icon={ImageIcon} tooltip="图片" />
        <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-1" />
        <ToolButton icon={CheckSquare} tooltip="待办" />
        <ToolButton icon={List} tooltip="列表" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-200 px-3 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[15px] relative z-10"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && draft.trim()) {
            if (!_sunk) {
              onEnterChat()
            } else {
              setStep('confirm')
            }
          }
        }}
      />
      <div className={`flex items-center space-x-1 pl-2 border-l border-slate-100 dark:border-white/10 transition-opacity relative z-10 ${
        draft.trim() ? 'opacity-100' : 'opacity-60 group-focus-within:opacity-100 group-hover:opacity-100'
      }`}>
        <button
          onClick={() => {
            if (draft.trim()) {
              if (!_sunk) {
                onEnterChat()
              } else {
                setStep('confirm')
              }
            }
          }}
          disabled={!draft.trim()}
          className={`ml-1.5 p-2 rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center ${
            draft.trim() ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md hover:-translate-y-0.5' : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <Send size={18} className={draft.trim() ? 'translate-x-[1px] -translate-y-[1px]' : ''} />
        </button>
      </div>
    </div>
  )
}

function InputContainer({ expanded, setExpanded, text, setText, onSave, onClose }: {
  expanded: boolean
  setExpanded: (v: boolean) => void
  text: string
  setText: (v: string) => void
  onSave: (content: string) => Promise<void>
  onClose: () => void
}) {
  if (!expanded) {
    return (
      <div className="w-full flex justify-center">
        <button onClick={() => setExpanded(true)} className="bg-white/90 dark:bg-[#2C2C2E]/90 backdrop-blur-2xl rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/80 dark:border-white/10 p-3 flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_8px_30px_rgba(59,130,246,0.3)] group relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <Plus size={20} className="relative z-10" />
          <span className="relative z-10 tracking-wide">新建记录</span>
        </button>
      </div>
    )
  }

  return <ExpandedEditor text={text} setText={setText} onSave={onSave} onClose={onClose} />
}

function ExpandedEditor({ text, setText, onSave, onClose }: {
  text: string
  setText: (v: string) => void
  onSave: (content: string) => Promise<void>
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    try {
      await onSave(text)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 overflow-hidden flex flex-col transition-all duration-500 relative">
      <div className="px-5 py-3 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5"><PenTool size={12} /> Classic 模式</span>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">
          <Minimize2 size={16} />
        </button>
      </div>
      <div className="p-5 relative">
        <textarea
          autoFocus
          placeholder="输入记录内容..."
          className="w-full h-32 bg-transparent border-none focus:outline-none resize-none text-slate-700 dark:text-slate-200 text-[15px] placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-relaxed"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
          }}
        />
      </div>
      <div className="px-4 py-3 bg-white dark:bg-[#1C1C1E] border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <ToolButton icon={ImageIcon} tooltip="图片" />
          <ToolButton icon={Paperclip} tooltip="附件" />
          <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-2"></div>
          <ToolButton icon={CheckSquare} tooltip="待办" />
          <ToolButton icon={List} tooltip="列表" />
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">{text.length} 字</span>
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-xl font-medium shadow-sm shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2"
          >
            {saving ? '保存中…' : '保存'} <Send size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ToolButton({ icon: Icon, tooltip }: { icon: typeof ImageIcon; tooltip: string }) {
  return (
    <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors relative group/btn focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
      <Icon size={18} strokeWidth={2.5} />
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-[10px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
        {tooltip}
      </span>
    </button>
  )
}

function DetailSlidePanel({ item, archivedEntry, existingTags, dismissedSuggestions, onSuggest, onArchive, onIgnore, onRestore, onReopen, onAddTag, onRemoveTag, onDismissSuggestion, onUpdateEntry, onUpdateDockItem, onClose, actionLoading }: {
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
  onUpdateDockItem: (itemId: number, rawText: string) => Promise<void>
  onClose: () => void
  actionLoading: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editRawText, setEditRawText] = useState('')

  useEffect(() => {
    if (item) {
      setEditRawText(item.rawText)
      setEditing(false)
    }
  }, [item])

  if (archivedEntry) {
    return <ArchivedEntryDetail archivedEntry={archivedEntry} onReopen={onReopen} onUpdateEntry={onUpdateEntry} onClose={onClose} actionLoading={actionLoading} />
  }

  if (!item) return null

  const statusConfig = STATUS_LABELS[item.status]
  const suggestedTagNames = item.suggestions
    .filter((s) => s.type === 'tag')
    .map((s) => s.label)
  const visibleSuggestedTags = suggestedTagNames.filter((t) => !dismissedSuggestions.includes(t))
  const allTags = [...(item.userTags ?? [])]

  return (
    <div className="flex-1 bg-white dark:bg-[#1C1C1E] flex flex-col transition-colors duration-[800ms]">
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-white/5 z-10 flex-shrink-0">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
        <DetailHeaderActions onClose={onClose} />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">

        <div className="mb-6">
          {editing ? (
            <div className="flex flex-col space-y-4">
              <div className="flex-1">
                <textarea
                  value={editRawText}
                  onChange={(e) => setEditRawText(e.target.value)}
                  className="w-full min-h-[300px] px-4 py-3 text-[15px] bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    if (editRawText !== item.rawText) {
                      await onUpdateDockItem(item.id, editRawText)
                    }
                    setEditing(false)
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? '保存中…' : '保存修改'}
                </button>
                <button 
                  onClick={() => {
                    setEditRawText(item.rawText)
                    setEditing(false)
                  }}
                  className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed text-[15px]">
                {item.rawText}
              </p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(item.createdAt).toLocaleString('zh-CN')}
                </p>
                <button 
                  onClick={() => setEditing(true)}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  <PenTool size={12} /> 编辑内容
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mb-6 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Tag size={12} /> 标签
          </h4>

          {visibleSuggestedTags.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium mb-1.5">建议标签</p>
              <div className="flex flex-wrap gap-1.5">
                {item.suggestions
                  .filter((s) => s.type === 'tag' && !dismissedSuggestions.includes(s.label))
                  .map((s) => (
                    <div key={s.id} className="inline-flex items-center gap-1">
                      <button
                        onClick={() => onAddTag(item.id, s.label)}
                        disabled={actionLoading}
                        className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-xs border border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                      >
                        + {s.label}
                      </button>
                      <button
                        onClick={() => onDismissSuggestion(s.label)}
                        className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 text-xs"
                        title="忽略此建议"
                      >
                        <X size={12} />
                      </button>
                      {s.reason && (
                        <span className="text-[10px] text-slate-400" title={s.reason}>?</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded text-xs">
                  {tag}
                  <button
                    onClick={() => onRemoveTag(item.id, tag)}
                    disabled={actionLoading}
                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {allTags.length === 0 && visibleSuggestedTags.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {item.status === 'suggested' ? '本次建议未匹配到合适标签，可手动添加或重试' : '暂无标签，点击「生成建议」获取智能标签'}
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
            <TagInput onAddTag={(name) => onAddTag(item.id, name)} existingTags={existingTags} />
          </div>
        </div>

        {item.suggestions.filter((s) => s.type === 'action').length > 0 && (
          <div className="mb-6 p-4 bg-amber-50/50 dark:bg-amber-500/5 rounded-xl border border-amber-100/50 dark:border-amber-500/10">
            <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">动作建议</h4>
            <div className="flex flex-wrap gap-1.5">
              {item.suggestions.filter((s) => s.type === 'action').map((s) => (
                <span key={s.id} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded text-xs">
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {item.status === 'pending' && (
            <button onClick={() => onSuggest(item.id)} disabled={actionLoading} className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-1.5">
              <Sparkles size={14} /> {actionLoading ? '生成中…' : '生成建议'}
            </button>
          )}
          {item.status === 'suggested' && (
            <>
              <button onClick={() => onArchive(item.id)} disabled={actionLoading} className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors">
                {actionLoading ? '处理中…' : '接受归档'}
              </button>
              <button onClick={() => onIgnore(item.id)} disabled={actionLoading} className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/20 disabled:opacity-50 transition-colors">
                忽略
              </button>
              <button onClick={() => onSuggest(item.id)} disabled={actionLoading} className="px-4 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                <RotateCcw size={14} /> 重新生成
              </button>
            </>
          )}
          {item.status === 'ignored' && (
            <button onClick={() => onRestore(item.id)} disabled={actionLoading} className="px-4 py-2 text-sm font-medium bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 disabled:opacity-50 transition-colors flex items-center gap-1.5">
              <RotateCcw size={14} /> {actionLoading ? '恢复中…' : '恢复到 Dock'}
            </button>
          )}
          {item.status === 'reopened' && (
            <button onClick={() => onSuggest(item.id)} disabled={actionLoading} className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-1.5">
              <Sparkles size={14} /> {actionLoading ? '生成中…' : '重新生成建议'}
            </button>
          )}
          {item.status === 'archived' && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">✓ 已归档</span>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

function ArchivedEntryDetail({ archivedEntry, onReopen, onUpdateEntry, onClose, actionLoading }: {
  archivedEntry: StoredEntry
  onReopen: (dockItemId: number) => Promise<void>
  onUpdateEntry: (entryId: number, updates: { tags?: string[]; project?: string | null; content?: string; title?: string }) => Promise<void>
  onClose: () => void
  actionLoading: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(archivedEntry.content)
  const [editTags, setEditTags] = useState(archivedEntry.tags)
  const [editProject, setEditProject] = useState(archivedEntry.project ?? '')
  const [newTagInput, setNewTagInput] = useState('')

  const handleSave = async () => {
    const updates: { tags?: string[]; content?: string; project?: string | null } = {}
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
    setEditTags(archivedEntry.tags)
    setEditProject(archivedEntry.project ?? '')
    setEditing(false)
  }

  return (
    <div className="flex-1 bg-white dark:bg-[#1C1C1E] flex flex-col transition-colors duration-[800ms]">
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-white/5 z-10 flex-shrink-0">
        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400">
          {TYPE_LABELS[archivedEntry.type] ?? archivedEntry.type}
        </span>
        <DetailHeaderActions onClose={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">

        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
          {archivedEntry.title}
        </h2>

        {editing ? (
          <div className="flex flex-col h-full space-y-4">
            <div className="flex-1 flex flex-col min-h-[400px]">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full flex-1 px-4 py-3 text-[15px] bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-slate-700 dark:text-slate-200"
              />
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-white/5">
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2 block">标签</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded text-xs">
                    {tag}
                    <button onClick={() => setEditTags(editTags.filter((t) => t !== tag))} className="text-green-500 hover:text-green-700 dark:hover:text-green-300">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const trimmed = newTagInput.trim()
                      if (trimmed && !editTags.includes(trimmed)) {
                        setEditTags([...editTags, trimmed])
                        setNewTagInput('')
                      }
                    }
                  }}
                  placeholder="添加标签…"
                  className="flex-1 px-2 py-1 text-xs bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 block">项目</label>
              <input
                type="text"
                value={editProject}
                onChange={(e) => setEditProject(e.target.value)}
                placeholder="输入项目名称…"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 dark:text-slate-200"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={actionLoading} className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors">
                {actionLoading ? '保存中…' : '保存修改'}
              </button>
              <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-[15px]">
                {archivedEntry.content}
              </p>
            </div>

            {archivedEntry.tags.length > 0 && (
              <div className="mb-4">
                <span className="text-xs text-slate-400 dark:text-slate-500 mb-2 block">标签</span>
                <div className="flex flex-wrap gap-1.5">
                  {archivedEntry.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded text-xs">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {archivedEntry.project && (
              <div className="mb-4">
                <span className="text-xs text-slate-400 dark:text-slate-500 mb-2 block">项目</span>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded text-xs">{archivedEntry.project}</span>
              </div>
            )}

            <div className="mb-4">
              <span className="text-xs text-slate-400 dark:text-slate-500 mb-2 block">动作</span>
              {archivedEntry.actions && archivedEntry.actions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {archivedEntry.actions.map((action, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded text-xs flex items-center gap-1">
                      <Sparkles size={10} /> {action}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-300 dark:text-slate-600 italic">暂无动作建议</p>
              )}
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              归档于 {new Date(archivedEntry.archivedAt).toLocaleString('zh-CN')}
            </p>

            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
              <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                编辑
              </button>
              <button onClick={() => onReopen(archivedEntry.sourceDockItemId)} disabled={actionLoading} className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                <RotateCcw size={14} /> {actionLoading ? '处理中…' : '重新整理'}
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  )
}

function TagInput({ onAddTag, existingTags }: { onAddTag: (name: string) => Promise<void>; existingTags: StoredTag[] }) {
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    const trimmed = input.trim()
    if (!trimmed || adding) return
    setAdding(true)
    try {
      await onAddTag(trimmed)
      setInput('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder="手动添加标签…"
          className="flex-1 px-2 py-1 text-xs bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim() || adding}
          className="px-2 py-1 text-xs bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-white/20 disabled:opacity-50 transition-colors"
        >
          添加
        </button>
      </div>
      {existingTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {existingTags.slice(0, 8).map((tag) => (
            <button
              key={tag.id}
              onClick={() => { setInput(tag.name) }}
              className="px-1.5 py-0.5 text-[10px] bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 rounded hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
