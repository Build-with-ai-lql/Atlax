import { afterEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  addTagToItem,
  archiveItem,
  createDockItem,
  getEntryByDockItemId,
  ignoreItem,
  listArchivedEntries,
  reopenItem,
  restoreItem,
  suggestItem,
  updateArchivedEntry,
  updateDockItemText,
  updateSelectedActions,
  updateSelectedProject,
} from '@/lib/repository'

const USER_ID = 'user_archive_test'
const USER_B = 'user_archive_other'

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

describe('full state flow', () => {
  afterEach(cleanAll)

  it('pending -> suggested -> archived', async () => {
    const id = await createDockItem(USER_ID, '明天下午3点产品评审会议')

    const suggested = unwrap(await suggestItem(USER_ID, id))
    expect(suggested.status).toBe('suggested')

    const archived = unwrap(await archiveItem(USER_ID, id))
    expect(archived.status).toBe('archived')

    const entries = await listArchivedEntries(USER_ID)
    expect(entries).toHaveLength(1)
    expect(entries[0].sourceDockItemId).toBe(id)
  })

  it('pending -> suggested -> ignored -> pending', async () => {
    const id = await createDockItem(USER_ID, '测试忽略恢复')

    const suggested = unwrap(await suggestItem(USER_ID, id))
    expect(suggested.status).toBe('suggested')

    const ignored = unwrap(await ignoreItem(USER_ID, id))
    expect(ignored.status).toBe('ignored')

    const restored = unwrap(await restoreItem(USER_ID, id))
    expect(restored.status).toBe('pending')
    expect(restored.suggestions).toEqual([])
  })

  it('pending -> suggested -> archived -> reopened preserves entry data', async () => {
    const id = await createDockItem(USER_ID, '测试重新整理')

    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)

    const reopened = unwrap(await reopenItem(USER_ID, id))
    expect(reopened.status).toBe('reopened')
    expect(reopened.suggestions.length).toBeGreaterThan(0)
  })
})

describe('reopen and re-archive', () => {
  afterEach(cleanAll)

  it('reopened item can be suggested and archived again', async () => {
    const id = await createDockItem(USER_ID, '重新整理后再次归档')

    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)
    await reopenItem(USER_ID, id)

    const suggested2 = unwrap(await suggestItem(USER_ID, id))
    expect(suggested2.status).toBe('suggested')
    expect(suggested2.suggestions.length).toBeGreaterThan(0)

    const archived2 = unwrap(await archiveItem(USER_ID, id))
    expect(archived2.status).toBe('archived')

    const entries = await listArchivedEntries(USER_ID)
    expect(entries).toHaveLength(1)
    expect(entries[0].sourceDockItemId).toBe(id)
  })

  it('reopened item can be ignored', async () => {
    const id = await createDockItem(USER_ID, '重新整理后忽略')

    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)
    await reopenItem(USER_ID, id)

    const ignored = unwrap(await ignoreItem(USER_ID, id))
    expect(ignored.status).toBe('ignored')
  })

  it('reopen preserves suggestions from previous archive cycle', async () => {
    const id = await createDockItem(USER_ID, '重新整理保留建议')

    const suggested = unwrap(await suggestItem(USER_ID, id))
    expect(suggested.suggestions.length).toBeGreaterThan(0)

    await archiveItem(USER_ID, id)
    const reopened = unwrap(await reopenItem(USER_ID, id))
    expect(reopened.suggestions.length).toBeGreaterThan(0)
  })
})

describe('reopen cache reuse', () => {
  afterEach(cleanAll)

  it('reuses tags from archived entry on reopen', async () => {
    const id = await createDockItem(USER_ID, '标签复用测试')
    await addTagToItem(USER_ID, id, '自定义标签')
    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)

    const entry = unwrap(await getEntryByDockItemId(USER_ID, id))
    expect(entry.tags.length).toBeGreaterThan(0)

    const reopened = unwrap(await reopenItem(USER_ID, id))
    expect(reopened.userTags).toEqual(entry.tags)
  })

  it('reuses selectedProject from archived entry on reopen', async () => {
    const id = await createDockItem(USER_ID, '项目复用测试')
    await suggestItem(USER_ID, id)
    await updateSelectedProject(USER_ID, id, 'MindDock')
    await archiveItem(USER_ID, id)

    const entry = unwrap(await getEntryByDockItemId(USER_ID, id))
    expect(entry.project).toBe('MindDock')

    const reopened = unwrap(await reopenItem(USER_ID, id))
    expect(reopened.selectedProject).toBe('MindDock')
  })

  it('reuses selectedActions from archived entry on reopen', async () => {
    const id = await createDockItem(USER_ID, '动作复用测试')
    await suggestItem(USER_ID, id)
    await updateSelectedActions(USER_ID, id, ['拆分任务', '安排评审'])
    await archiveItem(USER_ID, id)

    const entry = unwrap(await getEntryByDockItemId(USER_ID, id))
    expect(entry.actions).toEqual(['拆分任务', '安排评审'])

    const reopened = unwrap(await reopenItem(USER_ID, id))
    expect(reopened.selectedActions).toEqual(['拆分任务', '安排评审'])
  })

  it('preserves processedAt when archived entry exists', async () => {
    const id = await createDockItem(USER_ID, '处理时间保留测试')
    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)

    const reopened = unwrap(await reopenItem(USER_ID, id))
    expect(reopened.processedAt).not.toBeNull()
  })

  it('clears processedAt when no archived entry exists', async () => {
    const id = await createDockItem(USER_ID, '无Entry重开测试')
    await suggestItem(USER_ID, id)

    await db.table('entries').where('sourceDockItemId').equals(id).delete()

    await db.table('dockItems').update(id, { status: 'archived' })
    const reopened = unwrap(await reopenItem(USER_ID, id))
    expect(reopened.processedAt).toBeNull()
  })

  it('editing text after reopen clears suggestions (EditSavePolicy)', async () => {
    const id = await createDockItem(USER_ID, '编辑后失效测试')
    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)

    const reopened = unwrap(await reopenItem(USER_ID, id))
    expect(reopened.suggestions.length).toBeGreaterThan(0)

    const edited = unwrap(await updateDockItemText(USER_ID, id, '修改后的内容'))
    expect(edited.suggestions).toEqual([])
    expect(edited.status).toBe('pending')
    expect(edited.processedAt).toBeNull()
  })

  it('blocks cross-user from reading cached entry on reopen', async () => {
    const id = await createDockItem(USER_ID, '跨用户复用测试')
    await suggestItem(USER_ID, id)
    await updateSelectedProject(USER_ID, id, 'SecretProject')
    await archiveItem(USER_ID, id)

    const crossUserReopen = await reopenItem(USER_B, id)
    expect(crossUserReopen).toBeNull()

    const entry = unwrap(await getEntryByDockItemId(USER_ID, id))
    expect(entry.project).toBe('SecretProject')
  })
})

describe('edit archived entry consistency', () => {
  afterEach(cleanAll)

  it('editing entry tags syncs to dockItem', async () => {
    const id = await createDockItem(USER_ID, '编辑后同步标签')
    await addTagToItem(USER_ID, id, '初始标签')
    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)

    const entries = await listArchivedEntries(USER_ID)
    const entry = unwrap(entries[0])

    await updateArchivedEntry(USER_ID, entry.id, {
      tags: ['新标签1', '新标签2'],
    })

    const updatedEntries = await listArchivedEntries(USER_ID)
    expect(updatedEntries[0].tags).toEqual(['新标签1', '新标签2'])
  })

  it('editing entry content persists', async () => {
    const id = await createDockItem(USER_ID, '编辑内容测试')
    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)

    const entries = await listArchivedEntries(USER_ID)
    const entry = unwrap(entries[0])

    await updateArchivedEntry(USER_ID, entry.id, {
      content: '更新后的内容',
      title: '更新后的标题',
    })

    const updatedEntries = await listArchivedEntries(USER_ID)
    expect(updatedEntries[0].content).toBe('更新后的内容')
    expect(updatedEntries[0].title).toBe('更新后的标题')
  })

  it('editing entry project persists', async () => {
    const id = await createDockItem(USER_ID, '编辑项目测试')
    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)

    const entries = await listArchivedEntries(USER_ID)
    const entry = unwrap(entries[0])

    await updateArchivedEntry(USER_ID, entry.id, {
      project: '新项目',
    })

    const updatedEntries = await listArchivedEntries(USER_ID)
    expect(updatedEntries[0].project).toBe('新项目')
  })
})

describe('chat and text source consistency in archive flow', () => {
  afterEach(cleanAll)

  it('chat item follows same archive flow as text', async () => {
    const id = await createDockItem(USER_ID, 'Chat 来源归档测试', 'chat')

    const suggested = unwrap(await suggestItem(USER_ID, id))
    expect(suggested.status).toBe('suggested')

    const archived = unwrap(await archiveItem(USER_ID, id))
    expect(archived.status).toBe('archived')

    const entries = await listArchivedEntries(USER_ID)
    expect(entries).toHaveLength(1)
  })

  it('chat item can be reopened and re-archived', async () => {
    const id = await createDockItem(USER_ID, 'Chat 重新整理测试', 'chat')

    await suggestItem(USER_ID, id)
    await archiveItem(USER_ID, id)
    await reopenItem(USER_ID, id)

    const suggested2 = unwrap(await suggestItem(USER_ID, id))
    expect(suggested2.status).toBe('suggested')

    const archived2 = unwrap(await archiveItem(USER_ID, id))
    expect(archived2.status).toBe('archived')
  })

  it('chat item can be ignored and restored', async () => {
    const id = await createDockItem(USER_ID, 'Chat 忽略恢复测试', 'chat')

    await suggestItem(USER_ID, id)
    const ignored = unwrap(await ignoreItem(USER_ID, id))
    expect(ignored.status).toBe('ignored')

    const restored = unwrap(await restoreItem(USER_ID, id))
    expect(restored.status).toBe('pending')
  })
})
