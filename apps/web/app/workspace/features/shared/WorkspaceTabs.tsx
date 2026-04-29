'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Plus, FileText, Pin } from 'lucide-react'

export type TabType = 'home' | 'mind' | 'dock' | 'editor'

export interface Tab {
  id: string
  type: TabType
  title: string
  documentId?: number
  isPinned: boolean
}

interface WorkspaceTabsProps {
  tabs: Tab[]
  activeTabId: string | null
  onActivateTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onNewTab: () => void
  onPinTab?: (tabId: string) => void
  onToast?: (msg: string) => void
}

export default function WorkspaceTabs({ tabs, activeTabId, onActivateTab, onCloseTab, onNewTab, onPinTab, onToast }: WorkspaceTabsProps) {
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false)
  const newMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isNewMenuOpen && newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setIsNewMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isNewMenuOpen])

  if (tabs.length === 0) return null

  const pinnedTabs = tabs.filter(t => t.isPinned)
  const normalTabs = tabs.filter(t => !t.isPinned)

  const renderTab = (tab: Tab) => {
    const isActive = activeTabId === tab.id
    return (
      <div
        key={tab.id}
        onClick={() => onActivateTab(tab.id)}
        onDoubleClick={(e) => {
          e.preventDefault()
          if (tab.type === 'editor') onPinTab?.(tab.id)
        }}
        className={`editor-tab flex items-center gap-2 border-t border-x border-[var(--border-line)] rounded-t-xl cursor-default relative group shrink-0 ${
          tab.isPinned
            ? 'pinned-tab px-0 justify-center'
            : 'px-3 py-2 min-w-[120px] max-w-[180px] flex-1 text-sm'
        } ${
          isActive
            ? 'bg-[#1A1A1A] text-white'
            : 'bg-[#111] text-[var(--text-muted)] hover:text-slate-300'
        }`}
      >
        {isActive && !tab.isPinned && (
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[var(--accent)] to-purple-400 rounded-t-xl" />
        )}
        <FileText size={14} className={`shrink-0 ${isActive ? 'text-[var(--node-doc)]' : 'text-slate-600'}`} />
        {!tab.isPinned && (
          <span className="font-medium truncate text-[12px]">{tab.title}</span>
        )}
        {tab.type === 'editor' && !tab.isPinned && (
          <div className="ml-auto flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onPinTab?.(tab.id) }}
              className="btn-pin-tab opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-white transition-colors p-0.5"
              title="Pin Tab (or double-click)"
            >
              <Pin size={10} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id) }}
              className="btn-close-tab opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-white transition-colors p-0.5"
              title="Close Tab"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-end h-full overflow-x-auto gap-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {pinnedTabs.map(renderTab)}
      {normalTabs.map(renderTab)}
      <button
        onClick={onNewTab}
        className="flex items-center justify-center w-8 h-8 mb-1 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors shrink-0"
        title="New Note"
      >
        <Plus size={16} />
      </button>
      <div className="relative shrink-0" ref={newMenuRef}>
        <button
          onClick={() => setIsNewMenuOpen(v => !v)}
          className="flex items-center justify-center w-6 h-8 mb-1 rounded text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors text-xs"
          title="More options"
        >
          •••
        </button>
        {isNewMenuOpen && (
          <div className="absolute top-full left-0 mt-1 w-40 glass rounded-xl p-1 shadow-2xl z-[110] origin-top-left">
            <button
              onClick={() => { onNewTab(); setIsNewMenuOpen(false) }}
              className="w-full text-left px-2 py-1.5 text-xs text-[var(--text-muted)] hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={14} /> New Note
            </button>
            <button
              onClick={() => { onToast?.('Template gallery coming soon (mock)'); setIsNewMenuOpen(false) }}
              className="w-full text-left px-2 py-1.5 text-xs text-[var(--text-muted)] hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileText size={14} /> From Template
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
