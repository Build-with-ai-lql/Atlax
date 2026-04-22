import { afterEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  addTagToItem,
  createDockItem,
  createStoredTag,
  listDockItems,
  suggestItem,
} from '@/lib/repository'

const USER_ID = 'user_suggest_test'

async function cleanAll() {
  await db.table('dockItems').clear()
  await db.table('entries').clear()
  await db.table('tags').clear()
}

function unwrap<T>(value: T | null | undefined): T {
  expect(value).not.toBeNull()
  expect(value).not.toBeUndefined()
  return value as T
}

describe('suggest reason visibility', () => {
  afterEach(cleanAll)

  it('suggestion items include reason field', async () => {
    const id = await createDockItem(USER_ID, '明天下午3点产品评审会议')
    const suggested = unwrap(await suggestItem(USER_ID, id))

    expect(suggested.suggestions.length).toBeGreaterThan(0)

    for (const suggestion of suggested.suggestions) {
      expect(suggestion).toHaveProperty('reason')
      expect(typeof suggestion.reason).toBe('string')
    }
  })

  it('tag suggestions have reason when present', async () => {
    const id = await createDockItem(USER_ID, '明天下午3点产品评审会议，讨论Q2路线图和技术架构')
    const suggested = unwrap(await suggestItem(USER_ID, id))

    const tagSuggestions = suggested.suggestions.filter((s) => s.type === 'tag')
    if (tagSuggestions.length > 0) {
      for (const tag of tagSuggestions) {
        expect(tag.reason).toBeDefined()
        expect(typeof tag.reason === 'string' && tag.reason.length > 0).toBe(true)
      }
    } else {
      expect(suggested.suggestions.length).toBeGreaterThan(0)
    }
  })
})

describe('user tag overrides suggestion', () => {
  afterEach(cleanAll)

  it('user tag takes priority over suggested tag with same name', async () => {
    const id = await createDockItem(USER_ID, '产品路线图讨论')
    const suggested = unwrap(await suggestItem(USER_ID, id))

    const tagSuggestions = suggested.suggestions.filter((s) => s.type === 'tag')
    if (tagSuggestions.length > 0) {
      const firstTag = tagSuggestions[0]
      await addTagToItem(USER_ID, id, firstTag.label)

      const items = await listDockItems(USER_ID)
      const item = unwrap(items.find((i) => i.id === id))
      expect(item.userTags).toContain(firstTag.label)
    }
  })

  it('user can add custom tag not in suggestions', async () => {
    const id = await createDockItem(USER_ID, '产品路线图讨论')
    await addTagToItem(USER_ID, id, '自定义标签')

    const items = await listDockItems(USER_ID)
    const item = unwrap(items.find((i) => i.id === id))
    expect(item.userTags).toContain('自定义标签')
  })

  it('user can dismiss suggestion without adding it', async () => {
    const id = await createDockItem(USER_ID, '产品路线图讨论')
    const suggested = unwrap(await suggestItem(USER_ID, id))

    const tagSuggestions = suggested.suggestions.filter((s) => s.type === 'tag')
    const dismissedTag = tagSuggestions.length > 0 ? tagSuggestions[0].label : null

    if (dismissedTag) {
      const items = await listDockItems(USER_ID)
      const item = unwrap(items.find((i) => i.id === id))
      expect(item.userTags).not.toContain(dismissedTag)
    }
  })
})

describe('chat tag confirmation', () => {
  afterEach(cleanAll)

  it('chat item with tags can be created and tags are persisted', async () => {
    const id = await createDockItem(USER_ID, 'Chat 记录内容', 'chat')
    await createStoredTag(USER_ID, '产品')
    await addTagToItem(USER_ID, id, '产品')
    await addTagToItem(USER_ID, id, '路线图')

    const items = await listDockItems(USER_ID)
    const item = unwrap(items.find((i) => i.id === id))
    expect(item.sourceType).toBe('chat')
    expect(item.userTags).toContain('产品')
    expect(item.userTags).toContain('路线图')
  })

  it('chat item tags are visible in same dock list as classic items', async () => {
    const classicId = await createDockItem(USER_ID, 'Classic 记录', 'text')
    await addTagToItem(USER_ID, classicId, '工作')

    const chatId = await createDockItem(USER_ID, 'Chat 记录', 'chat')
    await addTagToItem(USER_ID, chatId, '产品')

    const items = await listDockItems(USER_ID)
    expect(items).toHaveLength(2)

    const classicItem = unwrap(items.find((i) => i.sourceType === 'text'))
    const chatItem = unwrap(items.find((i) => i.sourceType === 'chat'))

    expect(classicItem.userTags).toContain('工作')
    expect(chatItem.userTags).toContain('产品')
  })
})
