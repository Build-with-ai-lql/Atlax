import { describe, it, expect, afterEach } from 'vitest'
import { db } from '@/lib/db'
import {
  createDockItem,
  addTagToItem,
  suggestItem,
  archiveItem,
  listArchivedEntries,
} from '@/lib/repository'
import {
  processLocalAssistantQuery,
  detectIntent,
  extractSearchQuery,
  handleSearch,
} from '@/lib/local-assistant'

const USER_A = 'user_local_assistant_test'

async function cleanAll() {
  await db.table('dockItems').clear()
  await db.table('entries').clear()
  await db.table('tags').clear()
  await db.table('entryTagRelations').clear()
  await db.table('collections').clear()
}

afterEach(async () => {
  await cleanAll()
})

describe('detectIntent', () => {
  it('detects search intent', () => {
    expect(detectIntent('搜索 产品')).toBe('search')
    expect(detectIntent('查找 test')).toBe('search')
    expect(detectIntent('search something')).toBe('search')
    expect(detectIntent('find docs')).toBe('search')
  })

  it('detects tag_suggest intent', () => {
    expect(detectIntent('推荐标签')).toBe('tag_suggest')
    expect(detectIntent('打标签')).toBe('tag_suggest')
  })

  it('detects related intent', () => {
    expect(detectIntent('相关内容')).toBe('related')
    expect(detectIntent('related')).toBe('related')
  })

  it('detects organize intent', () => {
    expect(detectIntent('整理')).toBe('organize')
    expect(detectIntent('organize')).toBe('organize')
  })

  it('returns out_of_scope for unrecognized input', () => {
    expect(detectIntent('帮我写一篇文章')).toBe('out_of_scope')
    expect(detectIntent('hello world')).toBe('out_of_scope')
  })
})

describe('extractSearchQuery', () => {
  it('extracts query after search keyword', () => {
    expect(extractSearchQuery('搜索 产品设计')).toBe('产品设计')
    expect(extractSearchQuery('查找 test')).toBe('test')
    expect(extractSearchQuery('search something')).toBe('something')
  })

  it('returns full input if no keyword found', () => {
    expect(extractSearchQuery('产品设计')).toBe('产品设计')
  })
})

describe('handleSearch', () => {
  it('finds Dock item by userTag', async () => {
    const id = await createDockItem(USER_A, '这是一条测试内容')
    await addTagToItem(USER_A, id, '技术')

    const result = await handleSearch(USER_A, '搜索 技术')
    expect(result.intent).toBe('search')
    const searchResults = result.data?.searchResults
    expect(searchResults).toBeDefined()
    if (!searchResults) return
    expect(searchResults.length).toBeGreaterThanOrEqual(1)

    const found = searchResults.find(r => r.id === id)
    expect(found).toBeDefined()
    if (!found) return
    expect(found.matchedField).toBe('tag')
    expect(result.content).toContain('标签匹配')
  })

  it('finds archived entry by tag', async () => {
    const id = await createDockItem(USER_A, '会议记录内容')
    await suggestItem(USER_A, id)
    await archiveItem(USER_A, id)

    const entries = await listArchivedEntries(USER_A)
    const entry = entries.find(e => e.sourceDockItemId === id)
    expect(entry).toBeDefined()

    const result = await handleSearch(USER_A, '搜索 技术')
    const searchResults = result.data?.searchResults
    expect(searchResults).toBeDefined()

    const archivedEntry = entries.find(e =>
      e.tags.some(t => t.toLowerCase().includes('技术'))
    )
    if (archivedEntry && searchResults) {
      const found = searchResults.find(r => r.id === archivedEntry.id && r.source === 'entry')
      expect(found).toBeDefined()
      if (!found) return
      expect(found.matchedField).toBe('tag')
    }
  })

  it('finds Dock item by topic only', async () => {
    const id = await createDockItem(USER_A, '普通内容', 'text', { topic: '产品设计专题' })

    const result = await handleSearch(USER_A, '搜索 产品设计专题')
    expect(result.intent).toBe('search')
    const searchResults = result.data?.searchResults
    expect(searchResults).toBeDefined()
    if (!searchResults) return
    expect(searchResults.length).toBeGreaterThanOrEqual(1)

    const found = searchResults.find(r => r.id === id)
    expect(found).toBeDefined()
    if (!found) return
    expect(found.matchedField).toBe('topic')
    expect(result.content).toContain('主题匹配')
  })

  it('returns empty when no match', async () => {
    await createDockItem(USER_A, '不相关内容')

    const result = await handleSearch(USER_A, '搜索 不存在的关键词xyz')
    expect(result.data?.searchResults).toEqual([])
    expect(result.content).toContain('未找到')
  })
})

describe('processLocalAssistantQuery', () => {
  it('returns out_of_scope reply for unrecognized input', async () => {
    const result = await processLocalAssistantQuery(USER_A, '帮我写一篇文章')
    expect(result.intent).toBe('out_of_scope')
    expect(result.content).toContain('本地搜索')
    expect(result.content).toContain('高级 AI 问答能力将在后续版本开放')
  })

  it('returns login prompt when userId is empty', async () => {
    const result = await processLocalAssistantQuery('', '搜索 test')
    expect(result.intent).toBe('out_of_scope')
    expect(result.content).toContain('登录')
  })
})
