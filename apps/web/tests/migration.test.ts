import 'fake-indexeddb/auto'

import { afterEach, describe, expect, it } from 'vitest'

import Dexie, { type EntityTable } from 'dexie'

import { runV8Upgrade } from '@/lib/db'

const DB_NAME = 'AtlaxDB_MigrationTest'

interface DockItemV7 {
  id?: number
  rawText: string
  sourceType?: string
  status?: string
  suggestions?: unknown[]
  userTags?: string[]
  processedAt?: Date | null
  createdAt: Date
}

interface EntryV7 {
  id?: number
  sourceDockItemId?: number
  title: string
  content: string
  type: string
  tags: string[]
  project: string | null
  actions: string[]
  createdAt: Date
  archivedAt: Date
}

interface TagV7 {
  id?: string
  name: string
  createdAt: Date
}

function unwrap<T>(value: T | null | undefined): T {
  expect(value).toBeDefined()
  expect(value).not.toBeNull()
  return value as T
}

describe('db v8 upgrade - real upgrade path', () => {
  let v7Db: Dexie & {
    dockItems: EntityTable<DockItemV7, 'id'>
    entries: EntityTable<EntryV7, 'id'>
    tags: EntityTable<TagV7, 'id'>
  }

  let v8Db: Dexie & {
    dockItems: EntityTable<DockItemV7 & { userId?: string }, 'id'>
    entries: EntityTable<EntryV7 & { userId?: string }, 'id'>
    tags: EntityTable<TagV7 & { userId?: string }, 'id'>
  }

  afterEach(async () => {
    await v7Db?.close()
    await v8Db?.close()
    await Dexie.delete(DB_NAME)
  })

  async function setupV7() {
    v7Db = new Dexie(DB_NAME) as Dexie & {
      dockItems: EntityTable<DockItemV7, 'id'>
      entries: EntityTable<EntryV7, 'id'>
      tags: EntityTable<TagV7, 'id'>
    }
    v7Db.version(1).stores({
      dockItems: '++id, rawText, sourceType, status, createdAt',
      tags: 'id, name',
      entries: '++id, sourceDockItemId, type, archivedAt',
    })
    await v7Db.open()
  }

  async function upgradeToV8() {
    v8Db = new Dexie(DB_NAME) as Dexie & {
      dockItems: EntityTable<DockItemV7 & { userId?: string }, 'id'>
      entries: EntityTable<EntryV7 & { userId?: string }, 'id'>
      tags: EntityTable<TagV7 & { userId?: string }, 'id'>
    }
    v8Db.version(1).stores({
      dockItems: '++id, rawText, sourceType, status, createdAt',
      tags: 'id, name',
      entries: '++id, sourceDockItemId, type, archivedAt',
    })
    v8Db.version(2).stores({
      dockItems: '++id, userId, rawText, sourceType, status, createdAt',
      tags: 'id, userId, name, [userId+name]',
      entries: '++id, userId, sourceDockItemId, type, archivedAt',
    }).upgrade(runV8Upgrade)
    await v8Db.open()
  }

  describe('dockItems fallback', () => {
    it('fills missing userId -> _legacy', async () => {
      await setupV7()
      const id = await v7Db.dockItems.add({
        rawText: 'legacy item no userId',
        sourceType: 'text',
        status: 'pending',
        suggestions: [],
        userTags: [],
        processedAt: null,
        createdAt: new Date(),
      })
      await v7Db.close()

      await upgradeToV8()
      const item = unwrap(await v8Db.dockItems.get(id))
      expect(item.userId).toBe('_legacy')
      expect(item.rawText).toBe('legacy item no userId')
    })

    it('fills missing sourceType -> text', async () => {
      await setupV7()
      const id = await v7Db.dockItems.add({
        rawText: 'legacy item no sourceType',
        sourceType: undefined as unknown as string,
        status: 'pending',
        suggestions: [],
        userTags: [],
        processedAt: null,
        createdAt: new Date(),
      })
      await v7Db.close()

      await upgradeToV8()
      const item = unwrap(await v8Db.dockItems.get(id))
      expect(item.sourceType).toBe('text')
    })

    it('fills missing status -> pending', async () => {
      await setupV7()
      const id = await v7Db.dockItems.add({
        rawText: 'legacy item no status',
        sourceType: 'text',
        status: undefined as unknown as string,
        suggestions: [],
        userTags: [],
        processedAt: null,
        createdAt: new Date(),
      })
      await v7Db.close()

      await upgradeToV8()
      const item = unwrap(await v8Db.dockItems.get(id))
      expect(item.status).toBe('pending')
    })

    it('fills missing suggestions -> []', async () => {
      await setupV7()
      const id = await v7Db.dockItems.add({
        rawText: 'legacy item no suggestions',
        sourceType: 'text',
        status: 'pending',
        suggestions: undefined as unknown as unknown[],
        userTags: [],
        processedAt: null,
        createdAt: new Date(),
      })
      await v7Db.close()

      await upgradeToV8()
      const item = unwrap(await v8Db.dockItems.get(id))
      expect(item.suggestions).toEqual([])
    })

    it('fills missing userTags -> []', async () => {
      await setupV7()
      const id = await v7Db.dockItems.add({
        rawText: 'legacy item no userTags',
        sourceType: 'text',
        status: 'pending',
        suggestions: [],
        userTags: undefined as unknown as string[],
        processedAt: null,
        createdAt: new Date(),
      })
      await v7Db.close()

      await upgradeToV8()
      const item = unwrap(await v8Db.dockItems.get(id))
      expect(item.userTags).toEqual([])
    })
  })

  describe('entries fallback', () => {
    it('fills missing userId -> _legacy', async () => {
      await setupV7()
      const dockItemId = await v7Db.dockItems.add({
        rawText: 'source item',
        sourceType: 'text',
        status: 'archived',
        suggestions: [],
        userTags: [],
        processedAt: null,
        createdAt: new Date(),
      })
      const id = await v7Db.entries.add({
        sourceDockItemId: dockItemId,
        title: 'legacy entry no userId',
        content: 'content',
        type: 'note',
        tags: [],
        project: null,
        actions: [],
        createdAt: new Date(),
        archivedAt: new Date(),
      })
      await v7Db.close()

      await upgradeToV8()
      const entry = unwrap(await v8Db.entries.get(id))
      expect(entry.userId).toBe('_legacy')
      expect(entry.sourceDockItemId).toBe(dockItemId)
    })

    it('fills missing sourceDockItemId -> 0', async () => {
      await setupV7()
      const id = await v7Db.entries.add({
        sourceDockItemId: undefined as unknown as number,
        title: 'legacy entry no sourceDockItemId',
        content: 'content',
        type: 'note',
        tags: [],
        project: null,
        actions: [],
        createdAt: new Date(),
        archivedAt: new Date(),
      })
      await v7Db.close()

      await upgradeToV8()
      const entry = unwrap(await v8Db.entries.get(id))
      expect(entry.sourceDockItemId).toBe(0)
    })
  })

  describe('tags fallback', () => {
    it('fills missing userId -> _legacy', async () => {
      await setupV7()
      const tagId = 'legacy-tag-id'
      await v7Db.tags.add({
        id: tagId,
        name: 'legacy tag',
        createdAt: new Date(),
      })
      await v7Db.close()

      await upgradeToV8()
      const tag = unwrap(await v8Db.tags.get(tagId))
      expect(tag.userId).toBe('_legacy')
      expect(tag.name).toBe('legacy tag')
    })
  })

  describe('new types preserved', () => {
    it('preserves import sourceType', async () => {
      await setupV7()
      const id = await v7Db.dockItems.add({
        rawText: 'imported data',
        sourceType: 'import',
        status: 'pending',
        suggestions: [],
        userTags: [],
        processedAt: null,
        createdAt: new Date(),
      })
      await v7Db.close()

      await upgradeToV8()
      const item = unwrap(await v8Db.dockItems.get(id))
      expect(item.sourceType).toBe('import')
      expect(item.userId).toBe('_legacy')
    })

    it('preserves reopened status', async () => {
      await setupV7()
      const id = await v7Db.dockItems.add({
        rawText: 'reopened data',
        sourceType: 'text',
        status: 'reopened',
        suggestions: [],
        userTags: [],
        processedAt: null,
        createdAt: new Date(),
      })
      await v7Db.close()

      await upgradeToV8()
      const item = unwrap(await v8Db.dockItems.get(id))
      expect(item.status).toBe('reopened')
      expect(item.userId).toBe('_legacy')
    })
  })
})
