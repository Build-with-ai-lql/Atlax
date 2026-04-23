'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PenTool, Loader2, Check, ArrowRight } from 'lucide-react'

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
    <div className="flex min-h-screen atlax-page-bg items-center justify-center p-8 selection:bg-blue-200 dark:selection:bg-blue-900">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-400 flex items-center justify-center shadow-sm">
            <PenTool size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Capture</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">记录一切，剩下交给 Atlax</p>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="atlax-card overflow-hidden">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入任意内容..."
              className="w-full h-32 p-5 bg-transparent border-none resize-none focus:outline-none text-slate-700 dark:text-slate-200 text-[15px] placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-relaxed"
              disabled={saving}
            />
            <div className="px-5 py-3 bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-400 dark:text-slate-500">{text.length} 字</span>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check size={14} /> 已保存到 Dock
                  </span>
                )}
                <button
                  type="submit"
                  disabled={!text.trim() || saving}
                  className="atlax-btn-primary flex items-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link href="/workspace" className="text-sm text-blue-500 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
            查看 Dock <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
