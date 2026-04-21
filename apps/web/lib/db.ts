import Dexie, { type EntityTable } from 'dexie'

import type { EntryStatus, SourceType, SuggestionItem } from '@atlax/domain'

export interface InboxEntryRecord {
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

export interface PersistedInboxEntry extends InboxEntryRecord {
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
  sourceInboxEntryId: number
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
  inboxEntries: EntityTable<InboxEntryRecord, 'id'>
  tags: EntityTable<TagRecord, 'id'>
  entries: EntityTable<EntryRecord, 'id'>
}

db.version(1).stores({
  inboxEntries: '++id, rawText, sourceType, createdAt',
})

db.version(2).stores({
  inboxEntries: '++id, rawText, sourceType, status, createdAt',
}).upgrade((tx) => {
  tx.table('inboxEntries').toCollection().modify((entry: Record<string, unknown>) => {
    entry.status = entry.status ?? 'pending'
    entry.suggestions = entry.suggestions ?? []
    entry.processedAt = entry.processedAt ?? null
  })
})

db.version(3).stores({
  inboxEntries: '++id, rawText, sourceType, status, createdAt',
  tags: 'id, name',
}).upgrade((tx) => {
  tx.table('inboxEntries').toCollection().modify((entry: Record<string, unknown>) => {
    entry.userTags = entry.userTags ?? []
  })
})

db.version(4).stores({
  inboxEntries: '++id, rawText, sourceType, status, createdAt',
  tags: 'id, name',
  entries: '++id, sourceInboxEntryId, type, archivedAt',
})

db.version(5).stores({
  inboxEntries: '++id, userId, rawText, sourceType, status, createdAt',
  tags: 'id, userId, name',
  entries: '++id, userId, sourceInboxEntryId, type, archivedAt',
}).upgrade((tx) => {
  const fallbackUserId = '_legacy'
  tx.table('inboxEntries').toCollection().modify((entry: Record<string, unknown>) => {
    entry.userId = entry.userId ?? fallbackUserId
  })
  tx.table('tags').toCollection().modify((tag: Record<string, unknown>) => {
    tag.userId = tag.userId ?? fallbackUserId
  })
  tx.table('entries').toCollection().modify((entry: Record<string, unknown>) => {
    entry.userId = entry.userId ?? fallbackUserId
  })
})

db.version(6).stores({
  inboxEntries: '++id, userId, rawText, sourceType, status, createdAt',
  tags: 'id, userId, name, [userId+name]',
  entries: '++id, userId, sourceInboxEntryId, type, archivedAt',
}).upgrade((tx) => {
  const fallbackUserId = '_legacy'
  tx.table('tags').toCollection().modify((tag: Record<string, unknown>) => {
    const oldId = tag.id as string
    if (oldId && !oldId.startsWith(fallbackUserId + '_')) {
      tag.id = `${tag.userId ?? fallbackUserId}_${oldId}`
    }
  })
})

export { db }
export const inboxEntries = db.table('inboxEntries')
export const tagsTable = db.table('tags')
export const entriesTable = db.table('entries')
