import type { InboxEntry } from './db'
import type { SuggestionResult, SuggestionItem, SuggestionType } from './types'

const ENGINE_VERSION = '0.1.0-mock'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '工作': ['工作', '会议', '报告', '项目', '任务', '汇报', '需求', '上线'],
  '学习': ['学习', '读书', '课程', '笔记', '研究', '论文'],
  '生活': ['买菜', '做饭', '健身', '运动', '约会', '旅行', '周末'],
  '灵感': ['想法', '灵感', '创意', '假如', '如果', 'maybe', 'idea'],
}

const CATEGORY_CONFIDENCE: Record<string, number> = {
  '工作': 0.85,
  '学习': 0.85,
  '生活': 0.80,
  '灵感': 0.75,
  '未分类': 0.30,
}

function makeSuggestionId(entryId: number, type: SuggestionType, label: string): string {
  return `${entryId}:${type}:${label}`
}

function matchCategories(entryId: number, text: string): SuggestionItem[] {
  const lower = text.toLowerCase()
  const items: SuggestionItem[] = []

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matched = keywords.some((kw) => lower.includes(kw))
    if (matched) {
      items.push({
        id: makeSuggestionId(entryId, 'category', category),
        type: 'category',
        label: category,
        confidence: CATEGORY_CONFIDENCE[category] ?? 0.70,
      })
    }
  }

  if (items.length === 0) {
    items.push({
      id: makeSuggestionId(entryId, 'category', '未分类'),
      type: 'category',
      label: '未分类',
      confidence: CATEGORY_CONFIDENCE['未分类'],
    })
  }

  return items
}

function generateActionSuggestions(entryId: number, text: string): SuggestionItem[] {
  const items: SuggestionItem[] = []
  const lower = text.toLowerCase()

  if (/[\?？]/.test(text) || lower.includes('怎么') || lower.includes('如何')) {
    items.push({
      id: makeSuggestionId(entryId, 'action', '待解答'),
      type: 'action',
      label: '待解答',
      confidence: 0.80,
    })
  }

  if (/周[一二三四五六日末]/.test(text) || /明天|后天|下周|这周/.test(text)) {
    items.push({
      id: makeSuggestionId(entryId, 'action', '加入日程'),
      type: 'action',
      label: '加入日程',
      confidence: 0.75,
    })
  }

  if (text.length > 100) {
    items.push({
      id: makeSuggestionId(entryId, 'action', '需要拆分'),
      type: 'action',
      label: '需要拆分',
      confidence: 0.60,
    })
  }

  return items
}

export function generateSuggestions(entry: InboxEntry): SuggestionResult {
  const entryId = entry.id!
  const text = entry.rawText
  const suggestions: SuggestionItem[] = [
    ...matchCategories(entryId, text),
    ...generateActionSuggestions(entryId, text),
  ]

  return {
    entryId,
    suggestions,
    generatedAt: new Date(),
    engineVersion: ENGINE_VERSION,
  }
}

export type { SuggestionResult, SuggestionItem }