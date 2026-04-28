'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { FileText, Upload, BookOpen, FolderOpen, Archive, Plus, Clock } from 'lucide-react'
import { listDockItems, type DockItem } from '@/lib/repository'

interface HomeViewProps {
  userId: string
  userName: string
  onOpenEditor: (itemId: number) => void
  onNewNote: () => void
  onSwitchToDock: () => void
}

export default function HomeView({ userId, userName, onOpenEditor, onNewNote, onSwitchToDock }: HomeViewProps) {
  const [recentItems, setRecentItems] = useState<DockItem[]>([])
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

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

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 6) return '夜深了'
    if (h < 12) return '早上好'
    if (h < 14) return '中午好'
    if (h < 18) return '下午好'
    return '晚上好'
  }

  const entryCards = [
    { id: 'documents', icon: <FileText size={20} />, title: 'Latest Documents', desc: '最近打开的文档', color: 'from-indigo-500/20 to-indigo-500/5', iconColor: 'text-indigo-400', onClick: onSwitchToDock },
    { id: 'upload', icon: <Upload size={20} />, title: 'Upload', desc: '导入文件或链接', color: 'from-cyan-500/20 to-cyan-500/5', iconColor: 'text-cyan-400', onClick: onSwitchToDock },
    { id: 'notebook', icon: <BookOpen size={20} />, title: 'Notebook', desc: '新建笔记', color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400', onClick: onNewNote },
  ]

  const sidebarItems = [
    { icon: <FolderOpen size={14} />, label: 'Projects', onClick: onSwitchToDock },
    { icon: <Archive size={14} />, label: 'Archive', onClick: onSwitchToDock },
    { icon: <Plus size={14} />, label: 'New Folder', onClick: onNewNote },
  ]

  return (
    <div className="h-full flex">
      <div className="w-48 flex-shrink-0 border-r border-white/[0.04] p-4 space-y-1">
        <div className="text-[9px] uppercase tracking-widest text-slate-600 mb-3 px-2">Navigator</div>
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-16">
          <div className="mb-12">
            <h1 className="text-3xl font-light text-white/90 mb-1">
              {getGreeting()}，{userName}
            </h1>
            <p className="text-sm text-slate-500">开始你的知识旅程</p>
          </div>

          <div className={`grid grid-cols-3 gap-4 mb-12 transition-all duration-300`}>
            {entryCards.map((card) => (
              <button
                key={card.id}
                onClick={card.onClick}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`text-left p-5 rounded-2xl border transition-all duration-300 bg-gradient-to-br ${card.color} ${
                  hoveredCard && hoveredCard !== card.id
                    ? 'border-white/[0.02] opacity-40 scale-[0.98]'
                    : 'border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className={`${card.iconColor} mb-3`}>{card.icon}</div>
                <p className="text-[13px] font-medium text-white/90 mb-1">{card.title}</p>
                <p className="text-[11px] text-slate-500">{card.desc}</p>
              </button>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-500" />
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
              <div className="space-y-1">
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
        </div>
      </div>
    </div>
  )
}
