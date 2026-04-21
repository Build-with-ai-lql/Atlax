import Dexie, { type EntityTable } from 'dexie'

import type { EntryStatus, SourceType, SuggestionItem } from '@atlax/domain'

export interface InboxEntryRecord {
  id?: number
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
  name: string
  createdAt: Date
}

export interface PersistedTag extends TagRecord {
  id: string
}

const db = new Dexie('AtlaxDB') as Dexie & {
  inboxEntries: EntityTable<InboxEntryRecord, 'id'>
  tags: EntityTable<TagRecord, 'id'>
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

export { db }
export const inboxEntries = db.table('inboxEntries')
export const tagsTable = db.table('tags')