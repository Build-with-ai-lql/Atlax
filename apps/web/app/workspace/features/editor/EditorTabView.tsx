'use client'

import React, { useState, useEffect } from 'react'
import { PenTool, Bold, Italic, Strikethrough, Link, Code, Image as ImageIcon, List, ListOrdered, BookOpen, PanelRight, X, Link2, Plus, GripVertical } from 'lucide-react'

interface EditorTabViewProps {
  editingItemId: number | null
  editorTitle: string
  editorContent: string
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onSave: () => void
  mode: 'classic' | 'block'
  isDraft: boolean
}

export default function EditorTabView({
  editingItemId,
  editorTitle,
  editorContent,
  onTitleChange,
  onContentChange,
  onSave,
  mode,
  isDraft,
}: EditorTabViewProps) {
  const [dirty, setDirty] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showContext, setShowContext] = useState(false)

  useEffect(() => {
    setDirty(false)
  }, [editingItemId])

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

  const canSave = isDraft ? (editorTitle.trim() || editorContent.trim()) : dirty

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#1A1A1A]">
      <div className="h-10 bg-[#161616] border-b border-white/[0.06] flex items-center px-4 gap-1 shrink-0">
        {mode === 'classic' && (
          <>
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
          </>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setShowPreview(v => !v)}
          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${showPreview ? 'text-white' : 'text-slate-500 hover:text-white'}`}
          title="Toggle Preview"
        >
          <BookOpen size={14} />
        </button>
        <button
          onClick={() => setShowContext(v => !v)}
          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${showContext ? 'text-white' : 'text-slate-500 hover:text-white'}`}
          title="Toggle Context Panel"
        >
          <PanelRight size={14} />
        </button>
      </div>
      <div className="flex-1 flex flex-row overflow-hidden relative">
        <div className={`flex-1 flex flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${showPreview ? 'max-w-[50%]' : ''}`}>
          {mode === 'classic' ? (
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
              {canSave && (
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
          ) : (
            <div className="w-full max-w-3xl mx-auto py-16 px-10">
              <div className="flex items-center gap-2 mb-6 font-mono text-xs text-slate-500">
                <span>Drafts</span> <span className="text-slate-600">/</span>
                <span>{editorTitle ? editorTitle.slice(0, 20) : 'Untitled'}</span>
              </div>
              <div className="group relative flex items-start gap-2 py-1 rounded-lg border border-transparent hover:border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                <div className="absolute -left-10 top-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 text-slate-600 hover:text-white hover:bg-white/10 rounded transition-colors" title="Add block">
                    <Plus size={14} />
                  </button>
                  <button className="p-1 text-slate-600 hover:text-white hover:bg-white/10 rounded transition-colors cursor-grab active:cursor-grabbing" title="Drag">
                    <GripVertical size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-transparent text-3xl font-semibold outline-none text-white placeholder-slate-600 px-2 -mx-2"
                  placeholder="Page Title"
                />
              </div>
              <div className="mt-2 space-y-1">
                <div className="group relative flex items-start gap-2 py-1 rounded-lg border border-transparent hover:border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                  <div className="absolute -left-10 top-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 text-slate-600 hover:text-white hover:bg-white/10 rounded transition-colors" title="Add block">
                      <Plus size={14} />
                    </button>
                    <button className="p-1 text-slate-600 hover:text-white hover:bg-white/10 rounded transition-colors cursor-grab active:cursor-grabbing" title="Drag">
                      <GripVertical size={14} />
                    </button>
                  </div>
                  <textarea
                    value={editorContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full min-h-[1.5rem] bg-transparent resize-none outline-none text-base font-light leading-relaxed text-slate-300 placeholder-slate-600 px-2 -mx-2"
                    placeholder="Type '/' for commands"
                  />
                </div>
              </div>
              {canSave && (
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
          )}
        </div>
        {showPreview && (
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#111] border-l border-white/[0.06] p-10">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-semibold text-white mb-6">{editorTitle || 'Untitled'}</h1>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
                {editorContent}
              </div>
            </div>
          </div>
        )}
        {showContext && (
          <div className="absolute top-0 right-0 h-full w-72 bg-[#161616] border-l border-white/[0.06] shadow-2xl z-20 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Context Links</h4>
              <button
                onClick={() => setShowContext(false)}
                className="p-1.5 text-slate-500 hover:text-white rounded-md hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-4 space-y-3">
              <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 size={14} className="text-emerald-400" />
                  <span className="text-sm font-medium text-white">UX Guidelines</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">相关设计规范与交互原则参考文档。</p>
              </div>
              <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 size={14} className="text-emerald-400" />
                  <span className="text-sm font-medium text-white">Engine Spec</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">核心引擎物理模拟与空间结构说明。</p>
              </div>
              <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 size={14} className="text-emerald-400" />
                  <span className="text-sm font-medium text-white">API Reference</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">内部接口定义与调用示例。</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
