import type {
  SuggestionEntryInput,
  SuggestionItem,
  SuggestionResult,
  SuggestionType,
} from './types'
import { sanitizeSuggestionLabel } from './types'

const ENGINE_VERSION = '1.0.0'

export interface Rule {
  type: SuggestionType
  label: string
  keywords: string[]
  pattern?: RegExp
  confidence: number
  reason?: string
}

const CATEGORY_RULES: Rule[] = [
  { type: 'category', label: 'meeting', keywords: ['meeting', '会议', '议题', '结论'], confidence: 0.9, reason: '包含会议相关关键词' },
  { type: 'category', label: 'task', keywords: ['todo', '待办', '下周要做', 'action item', '任务'], confidence: 0.85, reason: '包含待办/任务关键词' },
  { type: 'category', label: 'reading', keywords: ['读到', '摘录', '书里提到', 'article', 'paper', '读书'], confidence: 0.8, reason: '包含阅读/摘录关键词' },
  { type: 'category', label: 'idea', keywords: ['灵感', '想法', 'idea', '脑暴', '创意', '假如'], confidence: 0.75, reason: '包含灵感/想法关键词' },
]

const DEFAULT_CATEGORY: Rule = {
  type: 'category',
  label: 'note',
  keywords: [],
  confidence: 0.3,
  reason: '未匹配到特定类型，默认为笔记',
}

const TAG_RULES: Rule[] = [
  { type: 'tag', label: '产品', keywords: ['产品', 'prd', '需求', 'roadmap'], confidence: 0.8, reason: '包含产品相关关键词' },
  { type: 'tag', label: '技术', keywords: ['技术', '架构', 'api', 'backend', 'frontend', '代码'], confidence: 0.8, reason: '包含技术相关关键词' },
  { type: 'tag', label: '性能', keywords: ['性能', '延迟', '优化', '慢', '响应'], confidence: 0.75, reason: '包含性能相关关键词' },
  { type: 'tag', label: '项目管理', keywords: ['项目', '里程碑', '进度', '复盘', '迭代'], confidence: 0.75, reason: '包含项目管理关键词' },
  { type: 'tag', label: '学习', keywords: ['学习', '课程', '读书', '总结', '笔记'], confidence: 0.7, reason: '包含学习相关关键词' },
  { type: 'tag', label: '支付', keywords: ['支付', 'pay', 'billing', '账单'], confidence: 0.7, reason: '包含支付相关关键词' },
  { type: 'tag', label: '工作', keywords: ['工作', '汇报', '上线', '发布'], confidence: 0.7, reason: '包含工作相关关键词' },
  { type: 'tag', label: '生活', keywords: ['买菜', '做饭', '健身', '运动', '约会', '旅行', '周末'], confidence: 0.65, reason: '包含生活相关关键词' },
]

const ACTION_RULES: Rule[] = [
  { type: 'action', label: '待解答', keywords: ['怎么', '如何'], pattern: /[?？]/, confidence: 0.8, reason: '包含疑问词或问号' },
  { type: 'action', label: '加入日程', keywords: ['明天', '后天', '下周', '这周'], pattern: /周[一二三四五六日末]/, confidence: 0.75, reason: '包含时间相关关键词' },
  { type: 'action', label: '需要拆分', keywords: [], confidence: 0.6, reason: '内容较长，建议拆分处理' },
  { type: 'action', label: '待办提取', keywords: ['todo', '待办', 'action item'], confidence: 0.85, reason: '包含待办关键词' },
]

const PROJECT_RULES: Rule[] = [
  { type: 'project', label: '关联项目', keywords: ['项目', 'project', '里程碑', '需求', '迭代'], confidence: 0.5, reason: '包含项目相关关键词' },
]

function makeSuggestionId(itemId: number, type: SuggestionType, label: string): string {
  return `${itemId}:${type}:${label}`
}

function matchRule(text: string, rule: Rule): boolean {
  const normalizedText = text.toLowerCase()

  if (rule.keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()))) {
    return true
  }

  if (rule.pattern) {
    return rule.pattern.test(text)
  }

  return false
}

function applyRules(itemId: number, text: string, rules: Rule[]): SuggestionItem[] {
  return rules
    .filter((rule) => matchRule(text, rule))
    .map((rule) => {
      const sanitizedLabel = sanitizeSuggestionLabel(rule.label)
      return {
        id: makeSuggestionId(itemId, rule.type, sanitizedLabel),
        type: rule.type,
        label: sanitizedLabel,
        confidence: rule.confidence,
        reason: rule.reason,
      }
    })
}

function matchCategory(itemId: number, text: string): SuggestionItem {
  const matchedRule = CATEGORY_RULES.find((rule) => matchRule(text, rule)) ?? DEFAULT_CATEGORY
  const sanitizedLabel = sanitizeSuggestionLabel(matchedRule.label)

  return {
    id: makeSuggestionId(itemId, matchedRule.type, sanitizedLabel),
    type: matchedRule.type,
    label: sanitizedLabel,
    confidence: matchedRule.confidence,
    reason: matchedRule.reason,
  }
}

function matchActions(itemId: number, text: string): SuggestionItem[] {
  const baseActions = applyRules(
    itemId,
    text,
    ACTION_RULES.filter((rule) => rule.label !== '需要拆分')
  )

  if (text.length <= 100) {
    return baseActions
  }

  const sanitizedLabel = sanitizeSuggestionLabel('需要拆分')
  return [
    ...baseActions,
    {
      id: makeSuggestionId(itemId, 'action', sanitizedLabel),
      type: 'action',
      label: sanitizedLabel,
      confidence: 0.6,
      reason: '内容较长，建议拆分处理',
    },
  ]
}

export function generateSuggestions(item: SuggestionEntryInput): SuggestionResult {
  const tagSuggestions = applyRules(item.id, item.rawText, TAG_RULES).slice(0, 5)
  if (tagSuggestions.length === 0) {
    const sanitizedLabel = sanitizeSuggestionLabel('待整理')
    tagSuggestions.push({
      id: makeSuggestionId(item.id, 'tag', sanitizedLabel),
      type: 'tag',
      label: sanitizedLabel,
      confidence: 0.3,
      reason: '未匹配到特定标签，建议稍后整理',
    })
  }

  const suggestions: SuggestionItem[] = [
    matchCategory(item.id, item.rawText),
    ...tagSuggestions,
    ...matchActions(item.id, item.rawText),
    ...applyRules(item.id, item.rawText, PROJECT_RULES),
  ]

  return {
    dockItemId: item.id,
    suggestions,
    generatedAt: new Date(item.createdAt),
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