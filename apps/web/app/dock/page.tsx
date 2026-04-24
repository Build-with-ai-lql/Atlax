'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { Dock, Loader2, ArrowRight, Sparkles, Archive, EyeOff, RotateCcw } from 'lucide-react'

import { getCurrentUser } from '@/lib/auth'
import {
  archiveItem,
  listDockItems,
  ignoreItem,
  restoreItem,
  suggestItem,
  type DockItem,
} from '@/lib/repository'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20' },
  suggested: { label: '已建议', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
  archived: { label: '已归档', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20' },
  ignored: { label: '已忽略', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20' },
  reopened: { label: '重新整理', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20' },
}

export default function DockPage() {
  const [items, setItems] = useState<DockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getUserId = () => {
    const user = getCurrentUser()
    return user?.id ?? ''
  }

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listDockItems(getUserId())
      setItems(data)
    } catch {
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const refreshList = useCallback(async () => {
    try {
      const updated = await listDockItems(getUserId())
      setItems(updated)
    } catch {
      setError('刷新失败，请重试')
    }
  }, [])

  const wrapAction = useCallback(
    async (id: number, action: () => Promise<DockItem | null>, actionName: string) => {
      if (actionLoading !== null) return
      setActionLoading(id)
      setError(null)
      try {
        const result = await action()
        if (!result) {
          setError(`${actionName}失败：当前状态不允许此操作`)
          await refreshList()
          return
        }
        setItems((currentItems) =>
          currentItems.map((item) => (item.id === result.id ? result : item))
        )
      } catch {
        setError(`${actionName}失败，请重试`)
        await refreshList()
      } finally {
        setActionLoading(null)
      }
    },
    [actionLoading, refreshList]
  )

  const handleSuggest = async (id: number) => {
    await wrapAction(id, () => suggestItem(getUserId(), id), '生成建议')
  }

  const handleArchive = async (id: number) => {
    await wrapAction(id, () => archiveItem(getUserId(), id), '归档')
  }

  const handleIgnore = async (id: number) => {
    await wrapAction(id, () => ignoreItem(getUserId(), id), '忽略')
  }

  const handleRestore = async (id: number) => {
    await wrapAction(id, () => restoreItem(getUserId(), id), '恢复')
  }

  return (
    <div className="flex min-h-screen atlax-page-bg selection:bg-blue-200 dark:selection:bg-blue-900">
      <div className="flex-1 max-w-2xl mx-auto p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-400 flex items-center justify-center shadow-sm">
            <Dock size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Dock</h1>
          <span className="px-2 py-0.5 bg-slate-200/50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-full text-xs font-medium">
            {items.length}
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">待整理的内容</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32 opacity-50">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 dark:text-slate-500">
            <Dock size={32} className="mb-3 opacity-50" />
            <p className="text-sm">暂无待整理内容</p>
            <Link href="/capture" className="text-sm text-blue-500 dark:text-blue-400 hover:underline mt-2 inline-flex items-center gap-1">
              开始记录 <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const statusConfig = STATUS_LABELS[item.status] ?? STATUS_LABELS.pending
              const allTags = [...(item.userTags ?? [])]
              return (
                <div
                  key={item.id}
                  className="atlax-card p-5 flex flex-col gap-3"
                >
                  <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed">
                    {item.rawText}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-white/5">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      {item.sourceType === 'chat' && (
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs rounded-md font-medium border border-indigo-100 dark:border-indigo-500/20">
                          Chat
                        </span>
                      )}
                      {allTags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs rounded-md font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.status === 'pending' && (
                      <button onClick={() => handleSuggest(item.id)} disabled={actionLoading !== null} className="atlax-btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                        <Sparkles size={12} /> {actionLoading === item.id ? '生成中…' : '生成建议'}
                      </button>
                    )}
                    {item.status === 'suggested' && (
                      <>
                        <button onClick={() => handleArchive(item.id)} disabled={actionLoading !== null} className="atlax-btn-primary text-xs py-1.5 px-3 bg-green-500 hover:bg-green-600 flex items-center gap-1">
                          <Archive size={12} /> {actionLoading === item.id ? '归档中…' : '接受归档'}
                        </button>
                        <button onClick={() => handleIgnore(item.id)} disabled={actionLoading !== null} className="atlax-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                          <EyeOff size={12} /> 忽略
                        </button>
                      </>
                    )}
                    {item.status === 'ignored' && (
                      <button onClick={() => handleRestore(item.id)} disabled={actionLoading !== null} className="atlax-btn-primary text-xs py-1.5 px-3 bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1">
                        <RotateCcw size={12} /> {actionLoading === item.id ? '恢复中…' : '恢复'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Link href="/capture" className="text-sm text-blue-500 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
            继续记录 <ArrowRight size={14} />
          </Link>
          <button
            onClick={loadItems}
            className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            刷新列表
          </button>
        </div>
      </div>
    </div>
  )
}
