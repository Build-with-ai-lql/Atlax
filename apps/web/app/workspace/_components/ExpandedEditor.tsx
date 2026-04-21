'use client'

import { useState } from 'react'

interface ExpandedEditorProps {
  onSubmit: (text: string) => Promise<void>
  onClose: () => void
}

export default function ExpandedEditor({ onSubmit, onClose }: ExpandedEditorProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return

    setSubmitting(true)
    try {
      await onSubmit(text.trim())
      setText('')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">展开编辑器</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="在这里写长笔记、长文章、结构化记录…&#10;&#10;按 Esc 关闭，完成后点击下方按钮保存到 Inbox"
            className="w-full h-64 resize-y px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
          <span className="text-xs text-gray-400">
            {text.length > 0 ? `${text.length} 字` : '内容将保存到 Inbox'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="px-5 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '保存中…' : '保存到 Inbox'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
