import {
  listDockItems,
  listArchivedEntries,
  listTags,
  listEntryTagRelations,
  listCollections,
  type DockItem,
  type StoredEntry,
} from './repository'
import { RULES } from './suggestion-engine'

type AssistantIntent =
  | 'search'
  | 'tag_suggest'
  | 'related'
  | 'organize'
  | 'out_of_scope'

interface SearchResult {
  source: 'dock' | 'entry'
  id: number
  title: string
  snippet: string
  matchedField: 'topic' | 'rawText' | 'tag' | 'title' | 'content'
}

interface TagSuggestion {
  tagName: string
  reason: string
  source: 'existing' | 'rule' | 'suggestion_engine'
}

interface RelatedItem {
  id: number
  title: string
  type: 'dock' | 'entry'
  reason: string
}

interface OrganizeSuggestion {
  suggestionType: 'tag' | 'project' | 'archive'
  label: string
  reason: string
  relatedItems?: string[]
}

interface LocalAssistantResponse {
  intent: AssistantIntent
  content: string
  data?: {
    searchResults?: SearchResult[]
    tagSuggestions?: TagSuggestion[]
    relatedItems?: RelatedItem[]
    organizeSuggestions?: OrganizeSuggestion[]
  }
}

const SEARCH_KEYWORDS = ['搜索', '查找', '找', 'search', 'find', '查找一下', '搜一下', '找一下']
const TAG_KEYWORDS = ['推荐标签', '打标签', '标签建议', 'tag', '标签推荐', '建议标签', 'suggest tag', 'tag suggest']
const RELATED_KEYWORDS = ['相关内容', '相关笔记', 'related', '相关', '相似', '类似', '关联内容', '关联笔记']
const ORGANIZE_KEYWORDS = ['整理', 'organize', '归类', '归档', '分类', '组织', '整理建议']

export function detectIntent(input: string): AssistantIntent {
  const lower = input.toLowerCase()

  for (const kw of SEARCH_KEYWORDS) {
    if (lower.includes(kw)) return 'search'
  }
  for (const kw of TAG_KEYWORDS) {
    if (lower.includes(kw)) return 'tag_suggest'
  }
  for (const kw of RELATED_KEYWORDS) {
    if (lower.includes(kw)) return 'related'
  }
  for (const kw of ORGANIZE_KEYWORDS) {
    if (lower.includes(kw)) return 'organize'
  }

  return 'out_of_scope'
}

export function extractSearchQuery(input: string): string {
  const lower = input.toLowerCase()
  for (const kw of SEARCH_KEYWORDS) {
    const idx = lower.indexOf(kw)
    if (idx !== -1) {
      return input.slice(idx + kw.length).trim()
    }
  }
  return input.trim()
}

export function matchText(query: string, text: string): boolean {
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()
  if (lowerText.includes(lowerQuery)) return true
  const terms = lowerQuery.split(/\s+/).filter(Boolean)
  if (terms.length > 1) {
    return terms.every(t => lowerText.includes(t))
  }
  return false
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

export async function handleSearch(userId: string, input: string): Promise<LocalAssistantResponse> {
  const query = extractSearchQuery(input)
  if (!query) {
    return {
      intent: 'search',
      content: '请提供搜索关键词。例如：搜索 产品设计',
    }
  }

  const [dockItems, entries] = await Promise.all([
    listDockItems(userId),
    listArchivedEntries(userId),
  ])

  const results: SearchResult[] = []

  for (const item of dockItems) {
    if (item.status === 'archived') continue

    const topicMatch = !!(item.topic && matchText(query, item.topic))
    const rawTextMatch = matchText(query, item.rawText)
    const tagMatch = item.userTags.length > 0 && item.userTags.some(t => matchText(query, t))

    if (!topicMatch && !rawTextMatch && !tagMatch) continue

    let bestField: SearchResult['matchedField']
    if (topicMatch) {
      bestField = 'topic'
    } else if (tagMatch) {
      bestField = 'tag'
    } else {
      bestField = 'rawText'
    }

    results.push({
      source: 'dock',
      id: item.id,
      title: item.topic || truncate(item.rawText, 40),
      snippet: truncate(item.rawText, 80),
      matchedField: bestField,
    })
  }

  for (const entry of entries) {
    const titleMatch = matchText(query, entry.title)
    const contentMatch = matchText(query, entry.content)
    const tagMatch = entry.tags.length > 0 && entry.tags.some(t => matchText(query, t))

    if (!titleMatch && !contentMatch && !tagMatch) continue

    let bestField: SearchResult['matchedField']
    if (titleMatch) {
      bestField = 'title'
    } else if (tagMatch) {
      bestField = 'tag'
    } else {
      bestField = 'content'
    }

    results.push({
      source: 'entry',
      id: entry.id,
      title: entry.title,
      snippet: truncate(entry.content, 80),
      matchedField: bestField,
    })
  }

  if (results.length === 0) {
    return {
      intent: 'search',
      content: `未找到与「${query}」相关的本地内容。`,
      data: { searchResults: [] },
    }
  }

  const lines = results.slice(0, 10).map((r, i) => {
    const sourceLabel = r.source === 'dock' ? '[Dock]' : '[文档]'
    const fieldLabel = r.matchedField === 'title' ? '(标题匹配)'
      : r.matchedField === 'topic' ? '(主题匹配)'
      : r.matchedField === 'tag' ? '(标签匹配)'
      : '(内容匹配)'
    return `${i + 1}. ${sourceLabel} ${r.title} ${fieldLabel}\n   ${r.snippet}`
  })

  return {
    intent: 'search',
    content: `找到 ${results.length} 条与「${query}」相关的结果：\n\n${lines.join('\n\n')}`,
    data: { searchResults: results },
  }
}

async function handleTagSuggest(userId: string, _input: string): Promise<LocalAssistantResponse> {
  const [dockItems, entries, tags, entryTagRelations] = await Promise.all([
    listDockItems(userId),
    listArchivedEntries(userId),
    listTags(userId),
    listEntryTagRelations(userId),
  ])

  const allItems = [
    ...dockItems.filter(i => i.status !== 'archived'),
    ...entries,
  ]

  if (allItems.length === 0) {
    return {
      intent: 'tag_suggest',
      content: '当前没有可分析的内容。请先添加一些笔记或文档，然后再请求标签建议。',
      data: { tagSuggestions: [] },
    }
  }

  const suggestions: TagSuggestion[] = []

  const existingTagNames = tags.map(t => t.name)
  if (existingTagNames.length > 0) {
    const tagUsageCount = new Map<string, number>()
    for (const rel of entryTagRelations) {
      const tag = tags.find(t => t.id === rel.tagId)
      if (tag) {
        tagUsageCount.set(tag.name, (tagUsageCount.get(tag.name) || 0) + 1)
      }
    }
    const sorted = Array.from(tagUsageCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    for (const [name, count] of sorted) {
      suggestions.push({
        tagName: name,
        reason: `已有标签，被 ${count} 条内容使用`,
        source: 'existing',
      })
    }
  }

  const recentItem = allItems[0]
  const isRecentDock = 'sourceType' in recentItem
  const textToAnalyze = isRecentDock
    ? (recentItem as DockItem).rawText
    : `${(recentItem as unknown as StoredEntry).title} ${(recentItem as unknown as StoredEntry).content}`

  for (const rule of RULES.tag) {
    const normalizedText = textToAnalyze.toLowerCase()
    if (rule.keywords.some(kw => normalizedText.includes(kw.toLowerCase()))) {
      if (!suggestions.some(s => s.tagName === rule.label) && !existingTagNames.includes(rule.label)) {
        suggestions.push({
          tagName: rule.label,
          reason: rule.reason || `基于关键词匹配`,
          source: 'rule',
        })
      }
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({
      tagName: '待整理',
      reason: '未匹配到特定标签，建议稍后整理',
      source: 'rule',
    })
  }

  const lines = suggestions.map(s => {
    const sourceLabel = s.source === 'existing' ? '[已有]' : s.source === 'rule' ? '[规则推荐]' : '[引擎推荐]'
    return `• ${s.tagName} ${sourceLabel} — ${s.reason}`
  })

  const contextHint = recentItem
    ? `\n\n基于最近内容「${truncate(textToAnalyze, 30)}」分析`
    : ''

  return {
    intent: 'tag_suggest',
    content: `标签建议：\n\n${lines.join('\n')}${contextHint}`,
    data: { tagSuggestions: suggestions },
  }
}

async function handleRelated(userId: string, _input: string): Promise<LocalAssistantResponse> {
  const [dockItems, entries] = await Promise.all([
    listDockItems(userId),
    listArchivedEntries(userId),
  ])

  const activeDockItems = dockItems.filter(i => i.status !== 'archived')
  if (activeDockItems.length === 0 && entries.length === 0) {
    return {
      intent: 'related',
      content: '当前没有可分析的内容。请先添加一些笔记或文档，然后再请求相关内容推荐。',
      data: { relatedItems: [] },
    }
  }

  const recentItem = activeDockItems[0] || entries[0]
  const isRecentDock = 'sourceType' in recentItem
  const recentText = isRecentDock
    ? (recentItem as DockItem).rawText
    : `${(recentItem as unknown as StoredEntry).title} ${(recentItem as unknown as StoredEntry).content}`
  const recentTags: string[] = isRecentDock
    ? (recentItem as DockItem).userTags || []
    : (recentItem as unknown as StoredEntry).tags
  const recentItemId: number = recentItem.id

  const related: RelatedItem[] = []

  const allEntries = entries
  for (const entry of allEntries) {
    if (entry.id === recentItemId) continue

    const reasons: string[] = []

    if (recentTags.length > 0 && entry.tags.length > 0) {
      const commonTags = entry.tags.filter(t =>
        recentTags.some((rt: string) => rt.toLowerCase() === t.toLowerCase())
      )
      if (commonTags.length > 0) {
        reasons.push(`标签命中: ${commonTags.join(', ')}`)
      }
    }

    if (entry.title && matchText(entry.title.split(/\s+/).slice(0, 3).join(' '), recentText)) {
      reasons.push('标题关键词命中')
    }

    if (reasons.length > 0) {
      related.push({
        id: entry.id,
        title: entry.title,
        type: 'entry',
        reason: reasons.join('; '),
      })
    }
  }

  for (const item of activeDockItems) {
    if (item.id === recentItemId) continue

    const reasons: string[] = []

    if (recentTags.length > 0 && item.userTags.length > 0) {
      const commonTags = item.userTags.filter(t =>
        recentTags.some((rt: string) => rt.toLowerCase() === t.toLowerCase())
      )
      if (commonTags.length > 0) {
        reasons.push(`标签命中: ${commonTags.join(', ')}`)
      }
    }

    if (item.topic && matchText(item.topic, recentText)) {
      reasons.push('主题关键词命中')
    }

    if (reasons.length > 0) {
      related.push({
        id: item.id,
        title: item.topic || truncate(item.rawText, 40),
        type: 'dock',
        reason: reasons.join('; '),
      })
    }
  }

  if (related.length === 0) {
    return {
      intent: 'related',
      content: `未找到与当前内容相关的条目。\n\n当前分析内容：「${truncate(recentText, 30)}」\n\n提示：为内容添加标签可以提高相关内容推荐的准确性。`,
      data: { relatedItems: [] },
    }
  }

  const lines = related.slice(0, 8).map((r, i) => {
    const typeLabel = r.type === 'dock' ? '[Dock]' : '[文档]'
    return `${i + 1}. ${typeLabel} ${r.title}\n   原因: ${r.reason}`
  })

  return {
    intent: 'related',
    content: `基于当前内容「${truncate(recentText, 30)}」找到 ${related.length} 条相关内容：\n\n${lines.join('\n\n')}`,
    data: { relatedItems: related },
  }
}

async function handleOrganize(userId: string): Promise<LocalAssistantResponse> {
  const [dockItems, entries, tags, collections, entryTagRelations] = await Promise.all([
    listDockItems(userId),
    listArchivedEntries(userId),
    listTags(userId),
    listCollections(userId),
    listEntryTagRelations(userId),
  ])

  const suggestions: OrganizeSuggestion[] = []

  const pendingItems = dockItems.filter(i => i.status === 'pending')
  if (pendingItems.length > 0) {
    suggestions.push({
      suggestionType: 'archive',
      label: `${pendingItems.length} 条待整理内容需要归档`,
      reason: `Dock 中有 ${pendingItems.length} 条 pending 状态的内容，建议逐一查看并归档`,
      relatedItems: pendingItems.slice(0, 5).map(i => i.topic || truncate(i.rawText, 30)),
    })
  }

  const tagUsageCount = new Map<string, number>()
  for (const rel of entryTagRelations) {
    const tag = tags.find(t => t.id === rel.tagId)
    if (tag) {
      tagUsageCount.set(tag.name, (tagUsageCount.get(tag.name) || 0) + 1)
    }
  }
  const highFreqTags = Array.from(tagUsageCount.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  if (highFreqTags.length > 0) {
    suggestions.push({
      suggestionType: 'tag',
      label: '高频标签可考虑建立项目',
      reason: `以下标签被 2 条以上内容使用，建议建立对应项目集合：${highFreqTags.map(([n, c]) => `${n}(${c})`).join(', ')}`,
      relatedItems: highFreqTags.map(([n]) => n),
    })
  }

  const entriesWithoutTags = entries.filter(e => e.tags.length === 0)
  if (entriesWithoutTags.length > 0) {
    suggestions.push({
      suggestionType: 'tag',
      label: `${entriesWithoutTags.length} 条文档缺少标签`,
      reason: '为文档添加标签有助于后续搜索和关联推荐',
      relatedItems: entriesWithoutTags.slice(0, 5).map(e => e.title),
    })
  }

  const projectCollections = collections.filter(c => c.collectionType === 'project')
  if (projectCollections.length > 0) {
    suggestions.push({
      suggestionType: 'project',
      label: `已有 ${projectCollections.length} 个项目集合`,
      reason: `项目: ${projectCollections.map(c => c.name).join(', ')}。建议将未归类的文档分配到对应项目。`,
      relatedItems: projectCollections.map(c => c.name),
    })
  }

  if (suggestions.length === 0) {
    return {
      intent: 'organize',
      content: '当前数据较少，暂无整理建议。添加更多内容后可以获得更好的整理建议。',
      data: { organizeSuggestions: [] },
    }
  }

  const lines = suggestions.map(s => {
    const typeLabel = s.suggestionType === 'tag' ? '[标签]' : s.suggestionType === 'project' ? '[项目]' : '[归档]'
    const itemsHint = s.relatedItems && s.relatedItems.length > 0
      ? `\n   相关: ${s.relatedItems.join(', ')}`
      : ''
    return `${typeLabel} ${s.label}\n   ${s.reason}${itemsHint}`
  })

  return {
    intent: 'organize',
    content: `整理建议：\n\n${lines.join('\n\n')}`,
    data: { organizeSuggestions: suggestions },
  }
}

const OUT_OF_SCOPE_REPLY = '当前基础助手支持以下能力：\n\n1. 本地搜索 — 输入「搜索 关键词」查找本地内容\n2. 标签建议 — 输入「推荐标签」获取标签建议\n3. 相关内容推荐 — 输入「推荐相关内容」查找相关条目\n4. 整理建议 — 输入「整理」获取整理建议\n\n高级 AI 问答能力将在后续版本开放。'

export async function processLocalAssistantQuery(
  userId: string,
  input: string,
): Promise<LocalAssistantResponse> {
  if (!userId) {
    return {
      intent: 'out_of_scope',
      content: '请先登录后使用助手功能。',
    }
  }

  const intent = detectIntent(input)

  switch (intent) {
    case 'search':
      return handleSearch(userId, input)
    case 'tag_suggest':
      return handleTagSuggest(userId, input)
    case 'related':
      return handleRelated(userId, input)
    case 'organize':
      return handleOrganize(userId)
    case 'out_of_scope':
    default:
      return {
        intent: 'out_of_scope',
        content: OUT_OF_SCOPE_REPLY,
      }
  }
}

export type {
  LocalAssistantResponse,
  SearchResult,
  TagSuggestion,
  RelatedItem,
  OrganizeSuggestion,
  AssistantIntent,
}
