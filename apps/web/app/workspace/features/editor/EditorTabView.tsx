'use client'

import React, { useState } from 'react'
import { PenTool } from 'lucide-react'

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
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          <div className="flex flex-col items-center justify-center py-32 text-slate-500">
            <PenTool size={48} className="opacity-20 mb-6" />
            <p className="text-lg font-medium text-slate-400 mb-2">Editor</p>
            <p className="text-sm opacity-60">选择一个文档开始编辑</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-12">
        <div className="space-y-6">
          <input
            type="text"
            value={editorTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-transparent text-3xl font-medium outline-none text-white placeholder-slate-600"
            placeholder="标题"
          />
          <textarea
            value={editorContent}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full min-h-[60vh] bg-transparent resize-none outline-none text-base font-light leading-relaxed text-slate-300 placeholder-slate-600"
            placeholder="开始写作..."
          />
          {dirty && (
            <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors"
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
