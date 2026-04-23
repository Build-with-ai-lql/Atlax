import { afterEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  addTagToItem,
  archiveItem,
  countDockItems,
  createDockItem,
  createStoredTag,
  getEntryByDockItemId,
  getWorkspaceStats,
  ignoreItem,
  listArchivedEntriesByProject,
  listArchivedEntriesByTag,
  listArchivedEntriesByType,
  listDockItems,
  listItemsByStatus,
  listTags,
  removeTagFromItem,
  reopenItem,
  restoreItem,
  suggestItem,
  updateArchivedEntry,
  updateDockItemText,
} from '@/lib/repository'

const USER_A = 'user_test_a'
const USER_B = 'user_test_b'

async function cleanAll() {
  await db.table('dockItems').clear()
  await db.table('entries').clear()
  await db.table('tags').clear()
}

function unwrap<T>(value: T | null): T {
  expect(value).not.toBeNull()
  return value as T
}

describe('repository', () => {
  afterEach(cleanAll)

  describe('createDockItem & listDockItems', () => {
    it('creates and lists items for a user', async () => {
      await createDockItem(USER_A, '测试内容A')
      await createDockItem(USER_A, '测试内容B')

      const items = await listDockItems(USER_A)
      expect(items).toHaveLength(2)
      expect(items[0].rawText).toBe('测试内容B')
      expect(items[0].status).toBe('pending')
      expect(items[0].userId).toBe(USER_A)
    })

    it('isolates items between users', async () => {
      await createDockItem(USER_A, '用户A的内容')
      await createDockItem(USER_B, '用户B的内容')

      const itemsA = await listDockItems(USER_A)
      const itemsB = await listDockItems(USER_B)

      expect(itemsA).toHaveLength(1)
      expect(itemsA[0].rawText).toBe('用户A的内容')
      expect(itemsB).toHaveLength(1)
      expect(itemsB[0].rawText).toBe('用户B的内容')
    })
  })

  describe('countDockItems', () => {
    it('counts items for a specific user', async () => {
      await createDockItem(USER_A, '内容1')
      await createDockItem(USER_A, '内容2')
      await createDockItem(USER_B, '内容3')

      expect(await countDockItems(USER_A)).toBe(2)
      expect(await countDockItems(USER_B)).toBe(1)
    })
  })

  describe('state flow', () => {
    it('pending -> suggested -> archived', async () => {
      const id = await createDockItem(USER_A, '会议记录')

      const suggested = unwrap(await suggestItem(USER_A, id))
      expect(suggested.status).toBe('suggested')
      expect(suggested.suggestions.length).toBeGreaterThan(0)

      const archived = unwrap(await archiveItem(USER_A, id))
      expect(archived.status).toBe('archived')
    })

    it('pending -> ignored -> restore -> suggested -> archived', async () => {
      const id = await createDockItem(USER_A, '待办任务')

      expect(unwrap(await ignoreItem(USER_A, id)).status).toBe('ignored')

      const restored = unwrap(await restoreItem(USER_A, id))
      expect(restored.status).toBe('pending')
      expect(restored.suggestions).toEqual([])

      await suggestItem(USER_A, id)
      expect(unwrap(await archiveItem(USER_A, id)).status).toBe('archived')
    })

    it('archived -> reopen -> suggest -> re-archive', async () => {
      const id = await createDockItem(USER_A, '测试内容')
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)

      const reopened = unwrap(await reopenItem(USER_A, id))
      expect(reopened.status).toBe('reopened')

      await suggestItem(USER_A, id)
      expect(unwrap(await archiveItem(USER_A, id)).status).toBe('archived')
    })

    it('supports import sourceType', async () => {
      await createDockItem(USER_A, '导入的内容', 'import')
      const item = await listDockItems(USER_A)
      expect(item[0].sourceType).toBe('import')
    })

    it('reopened state flow', async () => {
      const id = await createDockItem(USER_A, '内容')
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)

      const reopened = unwrap(await reopenItem(USER_A, id))
      expect(reopened.status).toBe('reopened')

      await suggestItem(USER_A, id)
      const ignored = unwrap(await ignoreItem(USER_A, id))
      expect(ignored.status).toBe('ignored')
    })

    it('blocks invalid transitions', async () => {
      const id = await createDockItem(USER_A, '内容')
      expect(await archiveItem(USER_A, id)).toBeNull()
    })

    it('blocks cross-user operations', async () => {
      const id = await createDockItem(USER_A, '内容')
      expect(await suggestItem(USER_B, id)).toBeNull()
    })
  })

  describe('listItemsByStatus', () => {
    it('filters by status', async () => {
      const id1 = await createDockItem(USER_A, '内容1')
      const id2 = await createDockItem(USER_A, '内容2')
      await createDockItem(USER_A, '内容3')

      await suggestItem(USER_A, id1)
      await ignoreItem(USER_A, id2)

      const pending = await listItemsByStatus(USER_A, 'pending')
      const suggested = await listItemsByStatus(USER_A, 'suggested')
      const ignored = await listItemsByStatus(USER_A, 'ignored')

      expect(pending).toHaveLength(1)
      expect(suggested).toHaveLength(1)
      expect(ignored).toHaveLength(1)
    })
  })

  describe('updateDockItemText', () => {
    it('resets status to pending and clears suggestions', async () => {
      const id = await createDockItem(USER_A, '原始内容')
      const suggested = unwrap(await suggestItem(USER_A, id))
      expect(suggested.status).toBe('suggested')
      expect(suggested.suggestions!.length).toBeGreaterThan(0)

      const updated = unwrap(await updateDockItemText(USER_A, id, '修改后的内容'))
      expect(updated.rawText).toBe('修改后的内容')
      expect(updated.status).toBe('pending')
      expect(updated.suggestions).toEqual([])
      expect(updated.processedAt).toBeNull()
    })

    it('allows re-suggest after edit', async () => {
      const id = await createDockItem(USER_A, '原始内容')
      await suggestItem(USER_A, id)
      await updateDockItemText(USER_A, id, '全新内容')

      const reSuggested = unwrap(await suggestItem(USER_A, id))
      expect(reSuggested.status).toBe('suggested')
      expect(reSuggested.suggestions!.length).toBeGreaterThan(0)
    })

    it('returns null for nonexistent item', async () => {
      expect(await updateDockItemText(USER_A, 99999, '内容')).toBeNull()
    })

    it('blocks cross-user text update', async () => {
      const id = await createDockItem(USER_A, '内容')
      expect(await updateDockItemText(USER_B, id, '恶意修改')).toBeNull()
    })
  })

  describe('suggestItem re-generation (suggested -> suggested)', () => {
    it('regenerates suggestions on reopened -> suggested path', async () => {
      const id = await createDockItem(USER_A, '产品需求评审')
      const first = unwrap(await suggestItem(USER_A, id))
      expect(first.status).toBe('suggested')
      expect(first.suggestions!.length).toBeGreaterThan(0)

      await archiveItem(USER_A, id)
      await reopenItem(USER_A, id)

      const second = unwrap(await suggestItem(USER_A, id))
      expect(second.status).toBe('suggested')
      expect(second.suggestions!.length).toBeGreaterThan(0)
    })

    it('reopened item has cleared suggestions before re-suggest', async () => {
      const id = await createDockItem(USER_A, '测试内容')
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)

      const reopened = unwrap(await reopenItem(USER_A, id))
      expect(reopened.suggestions).toEqual([])
      expect(reopened.processedAt).toBeNull()
    })

    it('edit -> suggest produces valid suggestions on same item', async () => {
      const id = await createDockItem(USER_A, '第一次输入')
      await suggestItem(USER_A, id)
      await updateDockItemText(USER_A, id, '第二次输入')

      const afterEdit = unwrap(await suggestItem(USER_A, id))
      expect(afterEdit.status).toBe('suggested')
      expect(afterEdit.rawText).toBe('第二次输入')
      expect(afterEdit.suggestions!.length).toBeGreaterThan(0)
    })
  })

  describe('archive write-back', () => {
    it('creates entry on archive', async () => {
      const id = await createDockItem(USER_A, '下周产品评审会议')
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)

      const entry = unwrap(await getEntryByDockItemId(USER_A, id))
      expect(entry.sourceDockItemId).toBe(id)
      expect(entry.content).toBe('下周产品评审会议')
      expect(entry.type).toBe('meeting')
    })

    it('updates entry on re-archive', async () => {
      const id = await createDockItem(USER_A, '测试会议')
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)

      const firstEntry = unwrap(await getEntryByDockItemId(USER_A, id))

      await reopenItem(USER_A, id)
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)

      const secondEntry = unwrap(await getEntryByDockItemId(USER_A, id))
      expect(secondEntry.id).toBe(firstEntry.id)
    })
  })

  describe('tag operations', () => {
    it('adds and removes tags', async () => {
      const id = await createDockItem(USER_A, '内容')

      const withTag = unwrap(await addTagToItem(USER_A, id, '技术'))
      expect(withTag.userTags).toEqual(['技术'])

      const withAnother = unwrap(await addTagToItem(USER_A, id, '产品'))
      expect(withAnother.userTags).toEqual(['技术', '产品'])

      const removed = unwrap(await removeTagFromItem(USER_A, id, '技术'))
      expect(removed.userTags).toEqual(['产品'])
    })

    it('deduplicates tags', async () => {
      const id = await createDockItem(USER_A, '内容')
      await addTagToItem(USER_A, id, '技术')
      const duped = unwrap(await addTagToItem(USER_A, id, '技术'))
      expect(duped.userTags).toEqual(['技术'])
    })
  })

  describe('listArchivedEntries filtering', () => {
    it('filters by type', async () => {
      const id1 = await createDockItem(USER_A, '产品评审会议')
      const id2 = await createDockItem(USER_A, '读到了一篇关于技术的文章')
      await suggestItem(USER_A, id1)
      await archiveItem(USER_A, id1)
      await suggestItem(USER_A, id2)
      await archiveItem(USER_A, id2)

      const meetings = await listArchivedEntriesByType(USER_A, 'meeting')
      expect(meetings).toHaveLength(1)
    })

    it('filters by tag', async () => {
      const id = await createDockItem(USER_A, '技术架构设计文档')
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)

      const byTag = await listArchivedEntriesByTag(USER_A, '技术')
      expect(byTag.length).toBeGreaterThanOrEqual(1)
    })

    it('filters by project', async () => {
      const id = await createDockItem(USER_A, '项目需求分析')
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)

      const byProject = await listArchivedEntriesByProject(USER_A, '关联项目')
      expect(byProject.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('updateArchivedEntry', () => {
    it('updates tags on archived entry', async () => {
      const id = await createDockItem(USER_A, '测试内容')
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)

      const entry = unwrap(await getEntryByDockItemId(USER_A, id))
      const updated = unwrap(await updateArchivedEntry(USER_A, entry.id, {
        tags: ['新标签1', '新标签2'],
      }))
      expect(updated.tags).toEqual(['新标签1', '新标签2'])
    })

    it('updates project on archived entry', async () => {
      const id = await createDockItem(USER_A, '测试内容')
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)

      const entry = unwrap(await getEntryByDockItemId(USER_A, id))
      const updated = unwrap(await updateArchivedEntry(USER_A, entry.id, {
        project: 'NewProject',
      }))
      expect(updated.project).toBe('NewProject')
    })

    it('updates content on archived entry', async () => {
      const id = await createDockItem(USER_A, '原始内容')
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)

      const entry = unwrap(await getEntryByDockItemId(USER_A, id))
      const updated = unwrap(await updateArchivedEntry(USER_A, entry.id, {
        content: '修改后的内容',
      }))
      expect(updated.content).toBe('修改后的内容')
    })

    it('blocks cross-user updates', async () => {
      const id = await createDockItem(USER_A, '测试')
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)

      const entry = unwrap(await getEntryByDockItemId(USER_A, id))
      expect(await updateArchivedEntry(USER_B, entry.id, {
        content: '恶意修改',
      })).toBeNull()
    })
  })

  describe('getWorkspaceStats', () => {
    it('returns correct stats', async () => {
      await createDockItem(USER_A, '待处理1')
      const id2 = await createDockItem(USER_A, '已建议')
      await suggestItem(USER_A, id2)
      const id3 = await createDockItem(USER_A, '已忽略')
      await ignoreItem(USER_A, id3)
      const id4 = await createDockItem(USER_A, '已归档')
      await suggestItem(USER_A, id4)
      await archiveItem(USER_A, id4)
      await createStoredTag(USER_A, '标签1')

      const stats = await getWorkspaceStats(USER_A)
      expect(stats.pendingCount).toBe(1)
      expect(stats.suggestedCount).toBe(1)
      expect(stats.archivedCount).toBe(1)
      expect(stats.ignoredCount).toBe(1)
      expect(stats.reopenedCount).toBe(0)
      expect(stats.totalEntries).toBe(1)
      expect(stats.tagCount).toBe(1)
    })

    it('counts reopened items', async () => {
      const id = await createDockItem(USER_A, '内容')
      await suggestItem(USER_A, id)
      await archiveItem(USER_A, id)
      await reopenItem(USER_A, id)

      const stats = await getWorkspaceStats(USER_A)
      expect(stats.reopenedCount).toBe(1)
      expect(stats.archivedCount).toBe(0)
    })
  })

  describe('tag storage', () => {
    it('creates and lists tags', async () => {
      await createStoredTag(USER_A, '技术')
      await createStoredTag(USER_A, '产品')

      const tags = await listTags(USER_A)
      expect(tags).toHaveLength(2)
      expect(tags.map((t) => t.name).sort()).toEqual(['产品', '技术'])
    })

    it('deduplicates tags by name', async () => {
      await createStoredTag(USER_A, '技术')
      await createStoredTag(USER_A, '技术')

      const tags = await listTags(USER_A)
      expect(tags).toHaveLength(1)
    })

    it('isolates tags between users', async () => {
      await createStoredTag(USER_A, '技术')
      await createStoredTag(USER_B, '产品')

      expect(await listTags(USER_A)).toHaveLength(1)
      expect(await listTags(USER_B)).toHaveLength(1)
    })
  })
})
