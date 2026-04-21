import type { InboxEntry } from './db'
import type { SuggestionResult, SuggestionItem, SuggestionType } from './types'

const ENGINE_VERSION = '1.0.0'

interface Rule {
  type: SuggestionType
  label: string
  keywords: string[]
  pattern?: RegExp
  confidence: number
}

const CATEGORY_RULES: Rule[] = [
  { type: 'category', label: 'meeting', keywords: ['meeting', '会议', '议题', '结论'], confidence: 0.90 },
  { type: 'category', label: 'task', keywords: ['todo', '待办', '下周要做', 'action item', '任务'], confidence: 0.85 },
  { type: 'category', label: 'reading', keywords: ['读到', '摘录', '书里提到', 'article', 'paper', '读书'], confidence: 0.80 },
  { type: 'category', label: 'idea', keywords: ['灵感', '想法', 'idea', '脑暴', '创意', '假如'], confidence: 0.75 },
]

const DEFAULT_CATEGORY: Rule = {
  type: 'category',
  label: 'note',
  keywords: [],
  confidence: 0.30,
}

const TAG_RULES: Rule[] = [
  { type: 'tag', label: '产品', keywords: ['产品', 'prd', '需求', 'roadmap'], confidence: 0.80 },
  { type: 'tag', label: '技术', keywords: ['技术', '架构', 'api', 'backend', 'frontend', '代码'], confidence: 0.80 },
  { type: 'tag', label: '性能', keywords: ['性能', '延迟', '优化', '慢', '响应'], confidence: 0.75 },
  { type: 'tag', label: '项目管理', keywords: ['项目', '里程碑', '进度', '复盘', '迭代'], confidence: 0.75 },
  { type: 'tag', label: '学习', keywords: ['学习', '课程', '读书', '总结', '笔记'], confidence: 0.70 },
  { type: 'tag', label: '支付', keywords: ['支付', 'pay', 'billing', '账单'], confidence: 0.70 },
  { type: 'tag', label: '工作', keywords: ['工作', '汇报', '上线', '发布'], confidence: 0.70 },
  { type: 'tag', label: '生活', keywords: ['买菜', '做饭', '健身', '运动', '约会', '旅行', '周末'], confidence: 0.65 },
]

const ACTION_RULES: Rule[] = [
  { type: 'action', label: '待解答', keywords: ['怎么', '如何'], pattern: /[\?？]/, confidence: 0.80 },
  { type: 'action', label: '加入日程', keywords: ['明天', '后天', '下周', '这周'], pattern: /周[一二三四五六日末]/, confidence: 0.75 },
  { type: 'action', label: '需要拆分', keywords: [], confidence: 0.60 },
  { type: 'action', label: '待办提取', keywords: ['todo', '待办', 'action item'], confidence: 0.85 },
]

const PROJECT_RULES: Rule[] = [
  { type: 'project', label: '关联项目', keywords: ['项目', 'project', '里程碑', '需求', '迭代'], confidence: 0.50 },
]

function makeSuggestionId(entryId: number, type: SuggestionType, label: string): string {
  return `${entryId}:${type}:${label}`
}

function matchRule(text: string, rule: Rule): boolean {
  const lower = text.toLowerCase()
  if (rule.keywords.length > 0 && rule.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
    return true
  }
  if (rule.pattern && rule.pattern.test(text)) {
    return true
  }
  return false
}

function applyRules(entryId: number, text: string, rules: Rule[]): SuggestionItem[] {
  const items: SuggestionItem[] = []
  for (const rule of rules) {
    if (matchRule(text, rule)) {
      items.push({
        id: makeSuggestionId(entryId, rule.type, rule.label),
        type: rule.type,
        label: rule.label,
        confidence: rule.confidence,
      })
    }
  }
  return items
}

function matchCategory(entryId: number, text: string): SuggestionItem {
  for (const rule of CATEGORY_RULES) {
    if (matchRule(text, rule)) {
      return {
        id: makeSuggestionId(entryId, rule.type, rule.label),
        type: rule.type,
        label: rule.label,
        confidence: rule.confidence,
      }
    }
  }
  return {
    id: makeSuggestionId(entryId, DEFAULT_CATEGORY.type, DEFAULT_CATEGORY.label),
    type: DEFAULT_CATEGORY.type,
    label: DEFAULT_CATEGORY.label,
    confidence: DEFAULT_CATEGORY.confidence,
  }
}

function matchTags(entryId: number, text: string): SuggestionItem[] {
  return applyRules(entryId, text, TAG_RULES).slice(0, 5)
}

function matchActions(entryId: number, text: string): SuggestionItem[] {
  const items: SuggestionItem[] = []

  for (const rule of ACTION_RULES) {
    if (rule.label === '需要拆分') {
      if (text.length > 100) {
        items.push({
          id: makeSuggestionId(entryId, rule.type, rule.label),
          type: rule.type,
          label: rule.label,
          confidence: rule.confidence,
        })
      }
    } else if (matchRule(text, rule)) {
      items.push({
        id: makeSuggestionId(entryId, rule.type, rule.label),
        type: rule.type,
        label: rule.label,
        confidence: rule.confidence,
      })
    }
  }

  return items
}

function matchProject(entryId: number, text: string): SuggestionItem[] {
  return applyRules(entryId, text, PROJECT_RULES)
}

export function generateSuggestions(entry: InboxEntry): SuggestionResult {
  const entryId = entry.id!
  const text = entry.rawText

  const suggestions: SuggestionItem[] = [
    matchCategory(entryId, text),
    ...matchTags(entryId, text),
    ...matchActions(entryId, text),
    ...matchProject(entryId, text),
  ]

  // `generatedAt` anchors to entry creation time so rule-engine output stays deterministic.
  return {
    entryId,
    suggestions,
    generatedAt: new Date(entry.createdAt),
    engineVersion: ENGINE_VERSION,
  }
}

export const RULES = {
  category: CATEGORY_RULES,
  tag: TAG_RULES,
  action: ACTION_RULES,
  project: PROJECT_RULES,
  defaultCategory: DEFAULT_CATEGORY,
}

export type { SuggestionResult, SuggestionItem, Rule }