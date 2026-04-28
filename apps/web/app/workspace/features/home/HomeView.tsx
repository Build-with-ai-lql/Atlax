'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { ArrowRight, Clock, FilePlus2, FileText, Import, Network, Plus } from 'lucide-react'
import { listDockItems, type DockItem } from '@/lib/repository'

interface HomeViewProps {
  userId: string
  userName: string
  onOpenEditor: (itemId: number) => void
  onNewNote: () => void
  onSwitchToDock: () => void
  onSwitchToMind: () => void
  onCapture: (text: string) => Promise<void>
  nodeCount: number
}

export default function HomeView({ userId, userName, onOpenEditor, onNewNote, onSwitchToDock, onSwitchToMind, onCapture, nodeCount }: HomeViewProps) {
  const [recentItems, setRecentItems] = useState<DockItem[]>([])
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [captureText, setCaptureText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadRecent = useCallback(async () => {
    if (!userId) return
    try {
      const items = await listDockItems(userId)
      setRecentItems(items.slice(0, 8))
    } catch {
      // silently fail
    }
  }, [userId])

  useEffect(() => {
    loadRecent()
  }, [loadRecent])

  const submitCapture = async () => {
    if (!captureText.trim() || submitting) return
    setSubmitting(true)
    try {
      await onCapture(captureText.trim())
      setCaptureText('')
      await loadRecent()
    } finally {
      setSubmitting(false)
    }
  }

  const entryCards = [
    { id: 'new-document', icon: <FilePlus2 size={20} />, title: 'New Document', desc: 'Structured markdown workspace', iconColor: 'text-[#a78bfa]', onClick: onNewNote },
    { id: 'process-inbox', icon: <Import size={20} />, title: 'Process Inbox', desc: 'Organize unlinked fragments', iconColor: 'text-[#bbf7d0]', onClick: onSwitchToDock },
    { id: 'graph-explorer', icon: <Network size={20} />, title: 'Graph Explorer', desc: 'Navigate your knowledge base', iconColor: 'text-blue-400', onClick: onSwitchToMind },
  ]

  return (
    <div className="h-full overflow-y-auto px-6 pb-12 pt-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col items-center">
        <section className="flex w-full flex-1 flex-col items-center justify-center py-16">
          <div className="mb-11 text-center">
            <h1 className="mb-4 text-4xl font-semibold tracking-normal text-white md:text-5xl">Knowledge, Structured.</h1>
            <p className="font-mono text-sm text-[#8B8B8B]">
              {nodeCount.toLocaleString()} Nodes active in {userName}&apos;s workspace.
            </p>
          </div>

          <div className="mb-14 flex w-full max-w-2xl items-center rounded-2xl border border-white/[0.08] bg-[rgba(26,26,26,0.7)] p-2 pl-6 shadow-2xl backdrop-blur-2xl transition-all focus-within:border-[#a78bfa] focus-within:bg-[rgba(26,26,26,0.85)]">
            <input
              type="text"
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitCapture() }}
              placeholder="Capture an idea... (Press Enter to Dock)"
              className="w-full bg-transparent py-3 text-lg text-white outline-none placeholder:text-[#8B8B8B]"
            />
            <button
              onClick={submitCapture}
              disabled={!captureText.trim() || submitting}
              className="ml-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#a78bfa] text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              title="Capture"
            >
              {submitting ? <Plus size={20} className="animate-spin" /> : <ArrowRight size={20} />}
            </button>
          </div>

          <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            {entryCards.map((card) => (
              <button
                key={card.id}
                onClick={card.onClick}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group flex flex-col items-center rounded-2xl border bg-[rgba(26,26,26,0.7)] p-6 text-center shadow-xl backdrop-blur-2xl transition-all duration-300 ${
                  hoveredCard && hoveredCard !== card.id
                    ? 'scale-[0.98] border-white/[0.04] opacity-45'
                    : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05]'
                }`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] transition-transform group-hover:scale-110">
                  <span className={card.iconColor}>{card.icon}</span>
                </div>
                <p className="mb-2 text-sm font-medium text-white">{card.title}</p>
                <p className="text-sm text-[#8B8B8B]">{card.desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-14 w-full max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#8B8B8B]" />
                <span className="text-[12px] font-medium text-slate-400">Recent Documents</span>
              </div>
              <button onClick={onSwitchToDock} className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
                View all
              </button>
            </div>

            {recentItems.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[12px] text-slate-600">暂无最近文档</p>
              </div>
            ) : (
              <div className="space-y-1 rounded-2xl border border-white/[0.08] bg-[rgba(26,26,26,0.45)] p-2 backdrop-blur-2xl">
                {recentItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onOpenEditor(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-left group"
                  >
                    <FileText size={14} className="text-slate-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/80 truncate group-hover:text-white/90 transition-colors">
                        {item.topic || item.rawText.slice(0, 60)}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-600 flex-shrink-0">
                      {item.status === 'archived' ? '已归档' : item.status === 'suggested' ? '已建议' : '待处理'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
