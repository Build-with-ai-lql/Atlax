import { afterEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  addTagToItem,
  archiveItem,
  createDockItem,
  createStoredTag,
  getEntryByDockItemId,
  getWorkspaceStats,
  listArchivedEntries,
  listDockItems,
  reopenItem,
  suggestItem,
  updateArchivedEntry,
} from '@/lib/repository'

const USER_ID = 'user_e2e'

async function cleanAll() {
  await db.table('dockItems').clear()
  await db.table('entries').clear()
  await db.table('tags').clear()
}

function unwrap<T>(value: T | null): T {
  expect(value).not.toBeNull()
  return value as T
}

describe('e2e main flow', () => {
  afterEach(cleanAll)

  it('Capture -> Suggest/Tag -> Archive -> Browse/Review -> Re-organize', async () => {
    const itemId = await createDockItem(USER_ID, '明天下午3点产品评审会议，讨论Q2路线图和技术架构')
    expect(itemId).toBeGreaterThan(0)

    const items = await listDockItems(USER_ID)
    expect(items).toHaveLength(1)
    expect(items[0].status).toBe('pending')

    const suggested = unwrap(await suggestItem(USER_ID, itemId))
    expect(suggested.status).toBe('suggested')
    expect(suggested.suggestions.length).toBeGreaterThan(0)

    const categorySuggestion = suggested.suggestions.find((s) => s.type === 'category')
    expect(categorySuggestion).toBeDefined()
    expect(categorySuggestion?.reason).toBeDefined()

    await addTagToItem(USER_ID, itemId, '自定义标签')
    await createStoredTag(USER_ID, '自定义标签')

    const tagged = await listDockItems(USER_ID)
    expect(tagged[0].userTags).toContain('自定义标签')

    const archived = unwrap(await archiveItem(USER_ID, itemId))
    expect(archived.status).toBe('archived')

    const entries = await listArchivedEntries(USER_ID)
    expect(entries).toHaveLength(1)

    const entry = entries[0]
    expect(entry.sourceDockItemId).toBe(itemId)
    expect(entry.type).toBe('meeting')
    expect(entry.tags.length).toBeGreaterThan(0)

    const stats = await getWorkspaceStats(USER_ID)
    expect(stats.totalEntries).toBe(1)
    expect(stats.archivedCount).toBe(1)
    expect(stats.tagCount).toBe(1)

    const updatedEntry = unwrap(await updateArchivedEntry(USER_ID, entry.id, {
      tags: ['自定义标签', '会议'],
      project: 'MindDock',
      content: '更新后的会议内容',
    }))
    expect(updatedEntry.tags).toEqual(['自定义标签', '会议'])
    expect(updatedEntry.project).toBe('MindDock')
    expect(updatedEntry.content).toBe('更新后的会议内容')

    const reopened = unwrap(await reopenItem(USER_ID, itemId))
    expect(reopened.status).toBe('pending')

    const existingEntry = await getEntryByDockItemId(USER_ID, itemId)
    expect(existingEntry).not.toBeNull()

    await suggestItem(USER_ID, itemId)
    const rearchived = unwrap(await archiveItem(USER_ID, itemId))
    expect(rearchived.status).toBe('archived')

    const finalEntries = await listArchivedEntries(USER_ID)
    expect(finalEntries).toHaveLength(1)
    expect(finalEntries[0].id).toBe(entry.id)
  })

  it('supports multiple items through full lifecycle', async () => {
    const ids = await Promise.all([
      createDockItem(USER_ID, '第一个：产品路线图讨论'),
      createDockItem(USER_ID, '第二个：技术架构设计'),
      createDockItem(USER_ID, '第三个：读书笔记'),
    ])

    for (const id of ids) {
      await suggestItem(USER_ID, id)
      await archiveItem(USER_ID, id)
    }

    const entries = await listArchivedEntries(USER_ID)
    expect(entries).toHaveLength(3)

    const stats = await getWorkspaceStats(USER_ID)
    expect(stats.totalEntries).toBe(3)
    expect(stats.archivedCount).toBe(3)

    await reopenItem(USER_ID, ids[0])
    const afterReopen = await listDockItems(USER_ID)
    const pendingItem = afterReopen.find((i) => i.id === ids[0])
    expect(pendingItem?.status).toBe('pending')
  })
})
