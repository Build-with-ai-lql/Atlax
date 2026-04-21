'use client'

import { useState } from 'react'

interface QuickInputBarProps {
  onSubmit: (text: string) => Promise<void>
  onExpand: () => void
}

export default function QuickInputBar({ onSubmit, onExpand }: QuickInputBarProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || submitting) return

    setSubmitting(true)
    try {
      await onSubmit(text.trim())
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-2.5">
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="快速记录… Enter 保存"
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400"
          disabled={submitting}
        />
        <button
          type="button"
          onClick={onExpand}
          className="px-2.5 py-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
          title="展开编辑器（长内容输入）"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {submitting ? '…' : '记录'}
        </button>
      </form>
    </div>
  )
}
