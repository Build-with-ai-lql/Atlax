'use client'

import { useState } from 'react'

interface QuickInputBarProps {
  onSubmit: (text: string) => Promise<void>
}

export default function QuickInputBar({ onSubmit }: QuickInputBarProps) {
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
    <div className="flex-shrink-0 border-t border-gray-200 bg-white px-5 py-3">
      <form onSubmit={handleSubmit} className="flex gap-3 items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="记录想法、片段、待办… 按 Enter 保存到 Inbox"
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {submitting ? '保存中' : '记录'}
        </button>
      </form>
    </div>
  )
}
