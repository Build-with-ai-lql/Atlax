'use client'

import React, { useState } from 'react'
import { PenTool, Bold, Italic, Strikethrough, Link, Code, Image as ImageIcon, List, ListOrdered } from 'lucide-react'

interface EditorTabViewProps {
  editingItemId: number | null
  editorTitle: string
  editorContent: string
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onSave: () => void
}

export default function EditorTabView({
  editingItemId,
  editorTitle,
  editorContent,
  onTitleChange,
  onContentChange,
  onSave,
}: EditorTabViewProps) {
  const [dirty, setDirty] = useState(false)

  const handleTitleChange = (v: string) => {
    onTitleChange(v)
    setDirty(true)
  }

  const handleContentChange = (v: string) => {
    onContentChange(v)
    setDirty(true)
  }

  const handleSave = () => {
    onSave()
    setDirty(false)
  }

  if (!editingItemId) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#1A1A1A]">
        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <PenTool size={32} className="opacity-15 mb-4" />
            <p className="text-sm text-slate-500">选择一个文档开始编辑</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#1A1A1A]">
      <div className="h-10 bg-[#161616] border-b border-white/[0.06] flex items-center px-4 gap-1 shrink-0">
        <button className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/10 transition-colors" title="Bold">
          <Bold size={14} />
        </button>
        <button className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/10 transition-colors" title="Italic">
          <Italic size={14} />
        </button>
        <button className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/10 transition-colors" title="Strikethrough">
          <Strikethrough size={14} />
        </button>
        <div className="w-px h-4 bg-white/[0.06] mx-2" />
        <button className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/10 transition-colors" title="Link">
          <Link size={14} />
        </button>
        <button className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/10 transition-colors" title="Code Block">
          <Code size={14} />
        </button>
        <button className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/10 transition-colors" title="Image">
          <ImageIcon size={14} />
        </button>
        <div className="w-px h-4 bg-white/[0.06] mx-2" />
        <button className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/10 transition-colors" title="Bullet List">
          <List size={14} />
        </button>
        <button className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/10 transition-colors" title="Numbered List">
          <ListOrdered size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="w-full max-w-3xl mx-auto py-16 px-10">
          <input
            type="text"
            value={editorTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-transparent text-3xl font-semibold outline-none text-white placeholder-slate-600 mb-1"
            placeholder="Untitled"
          />
          <div className="h-px bg-white/[0.06] mb-8" />
          <textarea
            value={editorContent}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full min-h-[60vh] bg-transparent resize-none outline-none text-base font-light leading-relaxed text-slate-300 placeholder-slate-600"
            placeholder="开始写作..."
          />
          {dirty && (
            <div className="flex items-center gap-3 pt-6 border-t border-white/[0.06] mt-8">
              <button
                onClick={handleSave}
                className="px-4 py-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/25 transition-colors"
              >
                保存
              </button>
              <span className="text-[11px] text-slate-600">未保存</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
