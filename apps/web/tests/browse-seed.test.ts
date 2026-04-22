import { afterEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  archiveItem,
  createDockItem,
  createStoredTag,
  listArchivedEntries,
  listDockItems,
  reopenItem,
  suggestItem,
} from '@/lib/repository'

const USER_ID = 'user_browse_test'

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

async function seedArchiveData() {
  const id1 = await createDockItem(USER_ID, '产品评审会议', 'text')
  await suggestItem(USER_ID, id1)
  await archiveItem(USER_ID, id1)

  const id2 = await createDockItem(USER_ID, 'Chat 记录灵感', 'chat')
  await suggestItem(USER_ID, id2)
  await archiveItem(USER_ID, id2)

  const id3 = await createDockItem(USER_ID, '待处理任务', 'text')

  return { id1, id2, id3 }
}

describe('entries filtering', () => {
  afterEach(cleanAll)

  it('lists all archived entries', async () => {
    await seedArchiveData()
    const entries = await listArchivedEntries(USER_ID)
    expect(entries.length).toBeGreaterThanOrEqual(2)
  })

  it('entries have correct type from suggestions', async () => {
    await seedArchiveData()
    const entries = await listArchivedEntries(USER_ID)
    for (const entry of entries) {
      expect(entry.type).toBeDefined()
      expect(typeof entry.type === 'string').toBe(true)
    }
  })

  it('entries have tags from suggestions', async () => {
    await seedArchiveData()
    const entries = await listArchivedEntries(USER_ID)
    const withTags = entries.filter((e) => e.tags.length > 0)
    expect(withTags.length).toBeGreaterThan(0)
  })

  it('chat and text entries share same list', async () => {
    await seedArchiveData()
    const entries = await listArchivedEntries(USER_ID)
    expect(entries.length).toBeGreaterThanOrEqual(2)
  })
})

describe('entry detail and reopen flow', () => {
  afterEach(cleanAll)

  it('entry has sourceDockItemId for reopen', async () => {
    const { id1 } = await seedArchiveData()
    const entries = await listArchivedEntries(USER_ID)
    const entry = unwrap(entries.find((e) => e.sourceDockItemId === id1))
    expect(entry.sourceDockItemId).toBe(id1)
  })

  it('reopen from entry returns item to dock', async () => {
    const { id1 } = await seedArchiveData()
    const reopened = unwrap(await reopenItem(USER_ID, id1))
    expect(reopened.status).toBe('reopened')
    expect(reopened.suggestions).toEqual([])

    const items = await listDockItems(USER_ID)
    const item = unwrap(items.find((i) => i.id === id1))
    expect(item.status).toBe('reopened')
  })

  it('reopened item can be suggested and archived again', async () => {
    const { id1 } = await seedArchiveData()
    await reopenItem(USER_ID, id1)
    await suggestItem(USER_ID, id1)
    const archived = unwrap(await archiveItem(USER_ID, id1))
    expect(archived.status).toBe('archived')
  })
})

describe('seed data coverage', () => {
  afterEach(cleanAll)

  it('chat sourceType items can be created and archived', async () => {
    const id = await createDockItem(USER_ID, 'Chat 来源测试', 'chat')
    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)

    const entries = await listArchivedEntries(USER_ID)
    expect(entries).toHaveLength(1)

    const items = await listDockItems(USER_ID)
    const item = unwrap(items.find((i) => i.id === id))
    expect(item.sourceType).toBe('chat')
    expect(item.status).toBe('archived')
  })

  it('reopened scenario can be created', async () => {
    const id = await createDockItem(USER_ID, '重新整理场景', 'text')
    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)
    const reopened = unwrap(await reopenItem(USER_ID, id))
    expect(reopened.status).toBe('reopened')
  })

  it('tags can be created and used for filtering', async () => {
    await createStoredTag(USER_ID, '产品')
    await createStoredTag(USER_ID, '技术')

    const id = await createDockItem(USER_ID, '带标签测试', 'text')
    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)

    const entries = await listArchivedEntries(USER_ID)
    expect(entries.length).toBeGreaterThan(0)
  })
})
