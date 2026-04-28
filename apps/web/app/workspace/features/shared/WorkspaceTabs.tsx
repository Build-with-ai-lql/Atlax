'use client'

import React from 'react'
import { X, Plus, FileText, Home, Brain, Database } from 'lucide-react'

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

const TAB_ICONS: Record<TabType, React.ReactNode> = {
  home: <Home size={12} />,
  mind: <Brain size={12} />,
  dock: <Database size={12} />,
  editor: <FileText size={12} />,
}

export default function WorkspaceTabs({ tabs, activeTabId, onActivateTab, onCloseTab, onNewTab }: WorkspaceTabsProps) {
  if (tabs.length === 0) return null

  return (
    <div className="h-9 flex items-center bg-[#060810] border-b border-white/[0.04] px-2 overflow-x-auto flex-shrink-0">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onActivateTab(tab.id)}
          className={`flex items-center gap-1.5 px-3 h-7 rounded-md cursor-pointer text-[12px] transition-colors mr-0.5 group ${
            activeTabId === tab.id
              ? 'bg-white/[0.08] text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
          }`}
        >
          <span className="opacity-50">{TAB_ICONS[tab.type]}</span>
          <span className="max-w-[120px] truncate">{tab.title}</span>
          {tab.type === 'editor' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCloseTab(tab.id)
              }}
              className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-white/10 transition-all"
            >
              <X size={10} />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onNewTab}
        className="flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors ml-0.5"
        title="新建"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
