'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'

import { getCurrentUser } from '@/lib/auth'
import {
  archiveItem,
  listDockItems,
  ignoreItem,
  restoreItem,
  suggestItem,
  type DockItem,
} from '@/lib/repository'

import DockItemCard from './_components/DockItemCard'

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

  const replaceItem = useCallback((updatedItem: DockItem) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    )
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

        replaceItem(result)
      } catch (error) {
        setError(`${actionName}失败：${error instanceof Error ? error.message : '未知错误'}`)
        await refreshList()
      } finally {
        setActionLoading(null)
      }
    },
    [actionLoading, replaceItem, refreshList]
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
    <main className="flex min-h-screen flex-col p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dock</h1>
        <p className="text-gray-600 mb-8">待整理的内容</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">暂无待整理内容</p>
            <Link href="/capture" className="text-blue-500 hover:underline">
              开始记录 →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <DockItemCard
                key={item.id}
                item={item}
                onSuggest={handleSuggest}
                onArchive={handleArchive}
                onIgnore={handleIgnore}
                onRestore={handleRestore}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Link href="/capture" className="text-blue-500 hover:underline">
            继续记录 →
          </Link>
          <button
            onClick={loadItems}
            className="text-gray-500 hover:underline"
          >
            刷新列表
          </button>
        </div>
      </div>
    </main>
  )
}