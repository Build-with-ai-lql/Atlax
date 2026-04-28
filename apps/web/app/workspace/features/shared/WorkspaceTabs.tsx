'use client'

import React from 'react'
import { X, Plus, FileText } from 'lucide-react'

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
}

export default function WorkspaceTabs({ tabs, activeTabId, onActivateTab, onCloseTab, onNewTab }: WorkspaceTabsProps) {
  if (tabs.length === 0) return null

  return (
    <div className="flex flex-1 items-end h-full overflow-x-auto gap-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id
        return (
          <div
            key={tab.id}
            onClick={() => onActivateTab(tab.id)}
            className={`px-3 py-2 border-t border-x border-white/[0.06] rounded-t-xl flex items-center gap-2 min-w-[120px] max-w-[180px] flex-1 text-sm cursor-default relative group shrink ${
              isActive
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-[#111] text-slate-500 hover:text-slate-300'
            }`}
          >
            {isActive && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-400 rounded-t-xl" />
            )}
            <FileText size={14} className={`shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-600'}`} />
            <span className="font-medium truncate text-[12px]">{tab.title}</span>
            {tab.type === 'editor' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseTab(tab.id)
                }}
                className="ml-auto opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-colors shrink-0 p-0.5"
                title="Close Tab"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )
      })}
      <button
        onClick={onNewTab}
        className="flex items-center justify-center w-8 h-8 mb-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
        title="New Note"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
