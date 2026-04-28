'use client'

import type { FC, PointerEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Brain,
  CornerDownLeft,
  FileText,
  History,
  Home,
  Library,
  Network,
  Plus,
  Search,
  Settings,
  User,
  MessageSquare,
  LogOut,
  PenTool,
} from 'lucide-react'

import { type LocalUser } from '@/lib/auth'

export type GoldenViewId = 'home' | 'mind' | 'dock' | 'editor'

interface NavItem {
  id: GoldenViewId
  label: string
  icon: typeof Home
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'mind', label: 'Mind', icon: Network },
  { id: 'dock', label: 'Dock', icon: Library },
  { id: 'editor', label: 'Editor', icon: PenTool },
]

interface SearchSuggestion {
  id: string
  label: string
  icon: typeof FileText
  tone: 'document' | 'accent' | 'muted'
  section?: string
}

const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  { id: 'recent-1', label: 'Recently edited document', icon: FileText, tone: 'document', section: 'SUGGESTED' },
  { id: 'mind-1', label: 'Mind map nodes', icon: Network, tone: 'accent' },
  { id: 'search-history', label: 'Search "MindDock"', icon: History, tone: 'muted', section: 'RECENT' },
]

interface GoldenTopNavProps {
  activeModule: GoldenViewId
  onModuleChange: (module: GoldenViewId) => void
  onOpenRecorder: () => void
  user: LocalUser
  onLogout?: () => void
}

const GoldenTopNav: FC<GoldenTopNavProps> = ({
  activeModule,
  onModuleChange,
  onOpenRecorder,
  user,
  onLogout,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [navPosition, setNavPosition] = useState({ left: 50, top: 24, isPercentLeft: true })
  const [dragState, setDragState] = useState<{
    pointerId: number
    startX: number
    startY: number
    initialLeft: number
    initialTop: number
    moved: boolean
  } | null>(null)

  const navRef = useRef<HTMLElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isSearchMode) {
      searchInputRef.current?.focus()
    }
  }, [isSearchMode])

  const navStyle = useMemo(() => {
    const left = navPosition.isPercentLeft ? `${navPosition.left}%` : `${navPosition.left}px`
    const transform = navPosition.isPercentLeft ? 'translateX(-50%)' : 'translateX(0)'
    return {
      top: `${navPosition.top}px`,
      left,
      transform,
      height: '48px',
      whiteSpace: 'nowrap' as const,
    }
  }, [navPosition])

  const handleLogoPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = navRef.current?.getBoundingClientRect()
    if (!rect) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
      moved: false,
    })
  }

  const handleLogoPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return
    const dx = event.clientX - dragState.startX
    const dy = event.clientY - dragState.startY
    const moved = dragState.moved || Math.abs(dx) + Math.abs(dy) > 4
    if (!moved) return
    setDragState({ ...dragState, moved })
    setNavPosition({
      left: Math.max(16, dragState.initialLeft + dx),
      top: Math.max(16, dragState.initialTop + dy),
      isPercentLeft: false,
    })
  }

  const handleLogoPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    if (!dragState.moved) {
      if (isSearchMode) {
        setIsSearchMode(false)
      } else {
        setIsCollapsed(false)
        onModuleChange('home')
      }
    }
    setDragState(null)
  }

  const closeFloatingMenus = () => {
    setIsSearchMode(false)
    setIsAccountOpen(false)
  }

  return (
    <>
      <header
        ref={navRef}
        id="top-nav"
        className={`fixed z-50 flex items-center overflow-hidden rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(26,26,26,0.7)] px-1 shadow-xl backdrop-blur-2xl transition-[width,left,top,transform,border-radius,background-color] duration-[600ms] ease-[cubic-bezier(0.34,1.25,0.4,1)] ${
          dragState?.moved ? '!transition-none' : ''
        } ${isSearchMode ? 'w-[min(760px,calc(100vw-48px))]' : isCollapsed ? 'w-12' : 'w-[max-content]'}`}
        style={navStyle}
      >
        <button
          id="nav-logo-btn"
          type="button"
          onPointerDown={handleLogoPointerDown}
          onPointerMove={handleLogoPointerMove}
          onPointerUp={handleLogoPointerUp}
          className="pointer-events-auto relative z-10 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-slate-800 text-slate-200 transition-transform hover:bg-slate-700"
          style={{ touchAction: 'none' }}
          title="Drag to move / Click to return Home"
        >
          <Brain className="h-5 w-5 pointer-events-none text-emerald-400" />
        </button>

        <div
          id="nav-content"
          className={`relative ml-2 flex h-full flex-1 items-center pr-1 transition-opacity ${
            isCollapsed ? 'pointer-events-none opacity-0 duration-150' : 'pointer-events-auto opacity-100 delay-150 duration-300'
          }`}
        >
          <div
            id="nav-links"
            className={`flex shrink-0 origin-left items-center gap-1 overflow-hidden transition-[max-width,opacity] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
              isSearchMode ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[500px] opacity-100'
            }`}
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeModule === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    closeFloatingMenus()
                    onModuleChange(item.id)
                  }}
                  className={`group relative rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isActive ? 'text-white' : 'text-[#8B8B8B] hover:text-white'
                  }`}
                >
                  <span className="pointer-events-none relative z-10 flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <div
                    className={`pointer-events-none absolute inset-0 rounded-full bg-white/10 transition-all duration-300 ${
                      isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}
                  />
                </button>
              )
            })}
            <div className="mx-2 h-5 w-px shrink-0 bg-[rgba(255,255,255,0.08)]" />
          </div>

          <div
            id="nav-actions"
            className={`flex items-center gap-1 transition-[max-width,opacity] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
              isSearchMode ? 'flex-1' : ''
            }`}
          >
            <div
              id="nav-search-container"
              className={`flex h-8 items-center overflow-hidden rounded-full transition-[max-width,opacity,background-color,padding,flex-grow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
                isSearchMode ? 'max-w-[1000px] flex-1 bg-white/5 pr-1' : 'max-w-8'
              }`}
            >
              <button
                id="nav-search-btn"
                type="button"
                onClick={() => {
                  setIsSearchMode(true)
                  setIsAccountOpen(false)
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8B8B8B] transition-colors hover:bg-white/10 hover:text-white"
              >
                <Search className="h-4 w-4 pointer-events-none" />
              </button>
              <input
                ref={searchInputRef}
                id="nav-search-input"
                type="text"
                className={`w-full border-none bg-transparent px-2 text-sm text-white outline-none transition-opacity duration-300 ${
                  isSearchMode ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
                placeholder="Search everything..."
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setIsSearchMode(false)
                }}
              />
              <button
                id="nav-search-send"
                type="button"
                onClick={() => setIsSearchMode(false)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-500 text-[#111] transition-opacity duration-300 hover:bg-emerald-400 ${
                  isSearchMode ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <CornerDownLeft className="h-3 w-3 pointer-events-none" />
              </button>
            </div>

            {!isSearchMode && (
              <button
                onClick={onOpenRecorder}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8B8B8B] transition-colors hover:bg-white/10 hover:text-white"
                title="Capture"
              >
                <Plus className="h-4 w-4 pointer-events-none" />
              </button>
            )}

            <div
              id="nav-account-container"
              className={`ml-1 flex shrink-0 overflow-hidden transition-[max-width,opacity,margin] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
                isSearchMode ? 'ml-0 max-w-0 opacity-0 pointer-events-none' : 'max-w-10 opacity-100'
              }`}
            >
              <button
                id="nav-account-btn"
                type="button"
                onClick={() => {
                  setIsAccountOpen((value) => !value)
                  setIsSearchMode(false)
                }}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[rgba(255,255,255,0.08)] bg-slate-800 transition-colors hover:border-[#8B8B8B]"
              >
                <span className="text-[10px] font-bold text-emerald-400">{user.name.charAt(0).toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Suggestions */}
      <div
        id="search-suggestions"
        className={`fixed z-40 w-[min(600px,calc(100vw-48px))] rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(26,26,26,0.8)] p-2 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
          isSearchMode ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
        style={{
          top: `${navPosition.top + 60}px`,
          left: navPosition.isPercentLeft ? '50%' : `${navPosition.left}px`,
          transform: navPosition.isPercentLeft ? 'translateX(-50%)' : undefined
        }}
      >
        {SEARCH_SUGGESTIONS.map((suggestion) => {
          const Icon = suggestion.icon
          const toneClasses = {
            document: 'text-emerald-200',
            accent: 'text-indigo-300',
            muted: 'text-[#8B8B8B]',
          }
          return (
            <div key={suggestion.id}>
              {suggestion.section ? (
                <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-[#8B8B8B] uppercase">{suggestion.section}</div>
              ) : null}
              <button className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10">
                <Icon className={`h-4 w-4 pointer-events-none ${toneClasses[suggestion.tone]}`} />
                {suggestion.label}
              </button>
            </div>
          )
        })}
      </div>

      {/* Account Dropdown */}
      <div
        id="account-dropdown"
        className={`fixed z-[100] flex w-56 flex-col rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(26,26,26,0.8)] p-2 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
          isAccountOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
        style={{
          top: `${navPosition.top + 60}px`,
          left: navPosition.isPercentLeft ? '50%' : `${navPosition.left}px`,
          transform: navPosition.isPercentLeft ? 'translateX(calc(-50% + 140px))' : 'none', // Offset relative to nav
        }}
      >
        <div className="mb-1 border-b border-[rgba(255,255,255,0.08)] px-3 py-3">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-[10px] text-[#8B8B8B] tracking-wide uppercase mt-0.5">MindDock Explorer</p>
        </div>
        <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10">
          <User className="h-4 w-4 text-slate-400" />
          Profile
        </button>
        <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10">
          <Settings className="h-4 w-4 text-slate-400" />
          Settings
        </button>
        <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          Feedback
        </button>
        <div className="h-px bg-white/[0.08] my-1" />
        <button
          onClick={onLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </>
  )
}

export default GoldenTopNav
