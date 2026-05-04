'use client'

import type { FC, PointerEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Brain,
  Check,
  CornerDownLeft,
  FileText,
  History,
  Home,
  Library,
  Network,
  PenTool,
  Search,
  Settings,
  User,
  MessageSquare,
} from 'lucide-react'

import {
  GOLDEN_NAV_ITEMS,
  GOLDEN_SEARCH_SUGGESTIONS,
  type GoldenNavItem,
  type GoldenSearchSuggestion,
  type GoldenViewId,
} from './goldenPrototypeTypes'

interface GoldenTopNavProps {
  activeView?: GoldenViewId
  onViewChange?: (view: GoldenViewId) => void
}

const navIconMap: Record<GoldenNavItem['icon'], FC<{ className?: string }>> = {
  home: Home,
  network: Network,
  library: Library,
  'pen-tool': PenTool,
}

const suggestionIconMap: Record<GoldenSearchSuggestion['icon'], FC<{ className?: string }>> = {
  'file-text': FileText,
  network: Network,
  history: History,
}

const suggestionToneClass: Record<GoldenSearchSuggestion['tone'], string> = {
  document: 'text-[#bbf7d0]',
  accent: 'text-[#a78bfa]',
  muted: 'text-[#8B8B8B]',
}

const GoldenTopNav: FC<GoldenTopNavProps> = ({ activeView = 'home', onViewChange }) => {
  const [currentView, setCurrentView] = useState<GoldenViewId>(activeView)
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
    setCurrentView(activeView)
  }, [activeView])

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

  const activateView = (view: GoldenViewId) => {
    setCurrentView(view)
    onViewChange?.(view)
  }

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
      activateView('home')
      setIsCollapsed((value) => !value)
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
          <Brain className="h-5 w-5 pointer-events-none" />
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
            {GOLDEN_NAV_ITEMS.map((item) => {
              const Icon = navIconMap[item.icon]
              const isActive = currentView === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    closeFloatingMenus()
                    activateView(item.id)
                  }}
                  className={`group relative rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isActive ? 'text-white' : 'text-[#8B8B8B] hover:text-white'
                  }`}
                  data-target={item.id}
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
            id="nav-search-container"
            className={`flex h-8 items-center overflow-hidden rounded-full transition-[max-width,opacity,background-color,padding] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
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
              placeholder="Search everything... (Mac Spotlight Style)"
              onKeyDown={(event) => {
                if (event.key === 'Escape') setIsSearchMode(false)
              }}
            />
            <button
              id="nav-search-send"
              type="button"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#a78bfa] text-[#111] transition-opacity duration-300 hover:bg-purple-400 ${
                isSearchMode ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <CornerDownLeft className="h-3 w-3 pointer-events-none" />
            </button>
          </div>

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
              className="h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-full border border-[rgba(255,255,255,0.08)] transition-colors hover:border-[#8B8B8B]"
            >
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Atlax"
                alt="Atlax account"
                className="h-full w-full object-cover pointer-events-none"
              />
            </button>
          </div>
        </div>
      </header>

      <div
        id="search-suggestions"
        className={`fixed z-40 w-[600px] rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(26,26,26,0.7)] p-2 shadow-2xl backdrop-blur-2xl transition-all ${
          isSearchMode ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
        style={{ top: `${navPosition.top + 60}px`, left: navPosition.isPercentLeft ? '50%' : `${navPosition.left}px`, transform: navPosition.isPercentLeft ? 'translateX(-50%)' : undefined }}
      >
        {GOLDEN_SEARCH_SUGGESTIONS.map((suggestion) => {
          const Icon = suggestionIconMap[suggestion.icon]
          return (
            <div key={suggestion.id}>
              {suggestion.section ? (
                <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-[#8B8B8B]">{suggestion.section}</div>
              ) : null}
              <button className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10">
                <Icon className={`h-4 w-4 pointer-events-none ${suggestionToneClass[suggestion.tone]}`} />
                {suggestion.label}
              </button>
            </div>
          )
        })}
      </div>

      <div
        id="account-dropdown"
        className={`fixed z-[100] flex w-48 flex-col rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(26,26,26,0.7)] p-2 shadow-2xl backdrop-blur-2xl transition-all ${
          isAccountOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
        style={{ top: `${navPosition.top + 60}px`, right: '24px' }}
      >
        <div className="mb-1 border-b border-[rgba(255,255,255,0.08)] px-3 py-2">
          <p className="text-sm font-medium text-white">Creator</p>
          <p className="text-xs text-[#8B8B8B]">Pro Plan</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10">
          <User className="h-4 w-4 pointer-events-none" />
          Account Mgmt
        </button>
        <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10">
          <Settings className="h-4 w-4 pointer-events-none" />
          Settings
        </button>
        <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#8B8B8B] transition-colors hover:bg-white/10 hover:text-white">
          <MessageSquare className="h-4 w-4 pointer-events-none" />
          Feedback
        </button>
        <div className="hidden">
          <Check className="h-3 w-3" />
        </div>
      </div>
    </>
  )
}

export default GoldenTopNav
