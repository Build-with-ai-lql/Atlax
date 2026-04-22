'use client'

import { useState } from 'react'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

interface SeedResult {
  dockItemsCreated: number
  entriesCreated: number
  tagsCreated: number
}

const SEED_ITEMS = [
  {
    rawText: '下周产品评审会议，需要准备 Q2 路线图和用户反馈数据',
    dockStatus: 'archived' as const,
    entry: {
      title: '产品评审会议准备',
      content: '下周产品评审会议，需要准备 Q2 路线图和用户反馈数据\n\n需要整理的内容：\n- Q1 用户调研结果\n- 竞品分析更新\n- 技术债务清单',
      type: 'meeting', tags: ['产品', '项目管理'], project: 'MindDock', actions: ['加入日程', '待办提取'],
    },
  },
  {
    rawText: '读到了一篇关于 RAG 架构优化的文章，核心观点是 chunk 策略比 embedding 模型更重要',
    dockStatus: 'archived' as const,
    entry: {
      title: 'RAG 架构优化阅读笔记',
      content: '读到了一篇关于 RAG 架构优化的文章，核心观点是 chunk 策略比 embedding 模型更重要\n\n关键要点：\n1. 语义分块优于固定长度分块\n2. 重叠窗口可以减少信息丢失\n3. 元数据增强检索精度',
      type: 'reading', tags: ['技术', '学习'], project: null, actions: ['待解答'],
    },
  },
  {
    rawText: '灵感：假如把知识图谱和本地优先结合，用户可以拥有自己的语义网络',
    dockStatus: 'archived' as const,
    entry: {
      title: '知识图谱 + 本地优先的灵感',
      content: '灵感：假如把知识图谱和本地优先结合，用户可以拥有自己的语义网络\n\n每个用户的笔记、想法、阅读记录都可以自动建立关联，形成个人知识图谱。不需要云端，所有数据在本地。',
      type: 'idea', tags: ['产品', '技术'], project: 'MindDock', actions: [],
    },
  },
  {
    rawText: '待办：修复 Dock 页面刷新后的状态丢失问题',
    dockStatus: 'archived' as const,
    entry: {
      title: '修复 Dock 状态丢失问题',
      content: '待办：修复 Dock 页面刷新后的状态丢失问题\n\n问题：用户在 Dock 中操作后刷新页面，条目状态会回退\n原因：可能是 useEffect 依赖不完整导致\n解决方案：确保 useCallback 包裹所有异步函数',
      type: 'task', tags: ['技术'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '今天和团队讨论了技术选型，决定用 Dexie + Next.js 做本地优先方案',
    dockStatus: 'ignored' as const,
    entry: null,
  },
  {
    rawText: '读书笔记：《系统之美》第 3 章，关于反馈回路和延迟的概念',
    dockStatus: 'suggested' as const,
    entry: null,
  },
  {
    rawText: '产品需求：用户希望能在 Entries 中按状态筛选',
    dockStatus: 'pending' as const,
    entry: null,
  },
  {
    rawText: '周末去爬山，回来整理一下照片和路线记录',
    dockStatus: 'pending' as const,
    entry: null,
  },
]

const SEED_TAGS = ['产品', '技术', '学习', '项目管理', '生活', '性能', '工作']

export default function SeedPage() {
  const [result, setResult] = useState<SeedResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  const handleSeed = async () => {
    const user = getCurrentUser()
    if (!user) {
      setError('请先登录（在 /workspace 页面注册或登录）')
      return
    }

    setSeeding(true)
    setError(null)

    try {
      const userId = user.id
      const now = new Date()
      const total = SEED_ITEMS.length

      let dockItemsCreated = 0
      const dockItemIds: number[] = []

      for (let i = 0; i < total; i++) {
        const item = SEED_ITEMS[i]
        const id = await db.table('dockItems').add({
          userId,
          rawText: item.rawText,
          sourceType: 'text',
          status: item.dockStatus,
          suggestions: item.dockStatus === 'suggested'
            ? [{ id: `seed_${i}:category:reading`, type: 'category', label: 'reading', confidence: 0.8, reason: '包含阅读/摘录关键词' },
               { id: `seed_${i}:tag:learn`, type: 'tag', label: '学习', confidence: 0.7, reason: '包含学习相关关键词' }]
            : item.dockStatus === 'archived' && item.entry
            ? [{ id: `seed_${i}:category:${item.entry.type}`, type: 'category', label: item.entry.type, confidence: 0.85, reason: '包含相关关键词' }]
            : [],
          userTags: [],
          processedAt: item.dockStatus !== 'pending' ? new Date(now.getTime() - i * 60000) : null,
          createdAt: new Date(now.getTime() - (total - i) * 3600000),
        }) as number
        dockItemIds.push(id)
        dockItemsCreated++
      }

      let entriesCreated = 0
      for (let i = 0; i < total; i++) {
        const item = SEED_ITEMS[i]
        if (!item.entry) continue

        await db.table('entries').add({
          userId,
          sourceDockItemId: dockItemIds[i],
          title: item.entry.title,
          content: item.entry.content,
          type: item.entry.type,
          tags: item.entry.tags,
          project: item.entry.project,
          actions: item.entry.actions,
          createdAt: new Date(now.getTime() - (total - i) * 86400000),
          archivedAt: new Date(now.getTime() - (total - i) * 86400000 + 3600000),
        })
        entriesCreated++
      }

      let tagsCreated = 0
      for (const tagName of SEED_TAGS) {
        const existing = await db.table('tags').where('userId').equals(userId)
          .and((t: Record<string, unknown>) => String(t.name) === tagName).first()
        if (!existing) {
          await db.table('tags').add({
            id: `${userId}_${tagName.toLowerCase()}`,
            userId,
            name: tagName,
            createdAt: now,
          })
          tagsCreated++
        }
      }

      setResult({ dockItemsCreated, entriesCreated, tagsCreated })
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误')
    } finally {
      setSeeding(false)
    }
  }

  const handleClear = async () => {
    const user = getCurrentUser()
    if (!user) {
      setError('请先登录')
      return
    }

    if (!confirm('确定要清除当前用户的所有数据吗？此操作不可恢复。')) return
    setSeeding(true)
    setError(null)
    try {
      const userId = user.id

      const dockItemIds = await db.table('dockItems').where('userId').equals(userId).primaryKeys()
      if (dockItemIds.length > 0) {
        await db.table('dockItems').bulkDelete(dockItemIds)
      }

      const entryIds = await db.table('entries').where('userId').equals(userId).primaryKeys()
      if (entryIds.length > 0) {
        await db.table('entries').bulkDelete(entryIds)
      }

      const tagIds = await db.table('tags').where('userId').equals(userId).primaryKeys()
      if (tagIds.length > 0) {
        await db.table('tags').bulkDelete(tagIds)
      }

      setResult(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo 数据填充</h1>
        <p className="text-sm text-gray-500 mb-6">为当前用户生成演示数据，覆盖多种类型、标签、项目和状态</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">将创建的数据</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Dock 条目（覆盖 pending/suggested/archived/ignored）</span>
              <span className="font-medium">{SEED_ITEMS.length} 条</span>
            </div>
            <div className="flex justify-between">
              <span>归档条目（覆盖 meeting/reading/idea/task）</span>
              <span className="font-medium">{SEED_ITEMS.filter((s) => s.entry).length} 条</span>
            </div>
            <div className="flex justify-between">
              <span>标签（产品/技术/学习/项目管理/生活/性能/工作）</span>
              <span className="font-medium">{SEED_TAGS.length} 个</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">{'归档条目与 Dock 一一对应，点击"重新整理"可回到 Dock'}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 transition-colors"
          >
            {seeding ? '填充中…' : '填充 Demo 数据'}
          </button>
          <button
            onClick={handleClear}
            disabled={seeding}
            className="px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 disabled:opacity-40 transition-colors"
          >
            清除我的数据
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">数据填充成功</p>
            <p className="text-xs text-green-600 mt-1">
              创建了 {result.dockItemsCreated} 条 Dock 条目、{result.entriesCreated} 条归档条目、{result.tagsCreated} 个标签
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/workspace" className="text-sm text-blue-500 hover:underline">返回工作区 →</a>
        </div>
      </div>
    </main>
  )
}