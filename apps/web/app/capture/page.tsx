'use client'

import Link from 'next/link'
import { useState } from 'react'

import { getCurrentUser } from '@/lib/auth'
import { createDockItem } from '@/lib/repository'

export default function CapturePage() {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    const user = getCurrentUser()
    if (!user) return

    setSaving(true)
    try {
      await createDockItem(user.id, text.trim())
      setText('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-6">Capture</h1>
      <p className="text-gray-600 mb-8">记录一切，剩下交给 Atlax</p>

      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入任意内容..."
          className="w-full h-32 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={saving}
        />
        <div className="flex justify-between items-center mt-4">
          <button
            type="submit"
            disabled={!text.trim() || saving}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          {saved && <span className="text-green-600">已保存到 Dock</span>}
        </div>
      </form>

      <Link href="/workspace" className="mt-8 text-blue-500 hover:underline">
        查看 Dock →
      </Link>
    </main>
  )
}