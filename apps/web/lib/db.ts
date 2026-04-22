import Dexie, { type EntityTable } from 'dexie'

import type { EntryStatus, SourceType, SuggestionItem } from '@atlax/domain'

export interface DockItemRecord {
  id?: number
  userId: string
  rawText: string
  sourceType: SourceType
  status: EntryStatus
  suggestions: SuggestionItem[]
  userTags: string[]
  processedAt: Date | null
  createdAt: Date
}

export interface PersistedDockItem extends DockItemRecord {
  id: number
}

export interface TagRecord {
  id?: string
  userId: string
  name: string
  createdAt: Date
}

export interface PersistedTag extends TagRecord {
  id: string
}

export interface EntryRecord {
  id?: number
  userId: string
  sourceDockItemId: number
  title: string
  content: string
  type: string
  tags: string[]
  project: string | null
  actions: string[]
  createdAt: Date
  archivedAt: Date
}

export interface PersistedEntry extends EntryRecord {
  id: number
}

const db = new Dexie('AtlaxDB') as Dexie & {
  dockItems: EntityTable<DockItemRecord, 'id'>
  tags: EntityTable<TagRecord, 'id'>
  entries: EntityTable<EntryRecord, 'id'>
}

db.version(1).stores({
  dockItems: '++id, rawText, sourceType, createdAt',
})

db.version(2).stores({
  dockItems: '++id, rawText, sourceType, status, createdAt',
}).upgrade((tx) => {
  tx.table('dockItems').toCollection().modify((item: Record<string, unknown>) => {
    item.status = item.status ?? 'pending'
    item.suggestions = item.suggestions ?? []
    item.processedAt = item.processedAt ?? null
  })
})

db.version(3).stores({
  dockItems: '++id, rawText, sourceType, status, createdAt',
  tags: 'id, name',
}).upgrade((tx) => {
  tx.table('dockItems').toCollection().modify((item: Record<string, unknown>) => {
    item.userTags = item.userTags ?? []
  })
})

db.version(4).stores({
  dockItems: '++id, rawText, sourceType, status, createdAt',
  tags: 'id, name',
  entries: '++id, sourceDockItemId, type, archivedAt',
})

db.version(5).stores({
  dockItems: '++id, userId, rawText, sourceType, status, createdAt',
  tags: 'id, userId, name',
  entries: '++id, userId, sourceDockItemId, type, archivedAt',
}).upgrade((tx) => {
  const fallbackUserId = '_legacy'
  tx.table('dockItems').toCollection().modify((item: Record<string, unknown>) => {
    item.userId = item.userId ?? fallbackUserId
  })
  tx.table('tags').toCollection().modify((tag: Record<string, unknown>) => {
    tag.userId = tag.userId ?? fallbackUserId
  })
  tx.table('entries').toCollection().modify((entry: Record<string, unknown>) => {
    entry.userId = entry.userId ?? fallbackUserId
  })
})

db.version(6).stores({
  dockItems: '++id, userId, rawText, sourceType, status, createdAt',
  tags: 'id, userId, name, [userId+name]',
  entries: '++id, userId, sourceDockItemId, type, archivedAt',
}).upgrade((tx) => {
  const fallbackUserId = '_legacy'
  tx.table('tags').toCollection().modify((tag: Record<string, unknown>) => {
    const oldId = tag.id as string
    if (oldId && !oldId.startsWith(fallbackUserId + '_')) {
      tag.id = `${tag.userId ?? fallbackUserId}_${oldId}`
    }
  })
})

db.version(7).stores({
  dockItems: '++id, userId, rawText, sourceType, status, createdAt',
  tags: 'id, userId, name, [userId+name]',
  entries: '++id, userId, sourceDockItemId, type, archivedAt',
})

db.version(8).stores({
  dockItems: '++id, userId, rawText, sourceType, status, createdAt',
  tags: 'id, userId, name, [userId+name]',
  entries: '++id, userId, sourceDockItemId, type, archivedAt',
}).upgrade((tx) => {
  tx.table('dockItems').toCollection().modify((item: Record<string, unknown>) => {
    if (!item.userId) item.userId = '_legacy'
    if (!item.sourceType) item.sourceType = 'text'
    if (!item.status) item.status = 'pending'
    if (!Array.isArray(item.suggestions)) item.suggestions = []
    if (!Array.isArray(item.userTags)) item.userTags = []
  })
  tx.table('entries').toCollection().modify((entry: Record<string, unknown>) => {
    if (!entry.userId) entry.userId = '_legacy'
    if (!entry.sourceDockItemId && entry.sourceDockItemId !== 0) {
      entry.sourceDockItemId = 0
    }
  })
  tx.table('tags').toCollection().modify((tag: Record<string, unknown>) => {
    if (!tag.userId) tag.userId = '_legacy'
  })
})

export { db }
export const dockItemsTable = db.table('dockItems')
export const tagsTable = db.table('tags')
export const entriesTable = db.table('entries')
