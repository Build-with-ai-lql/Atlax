import Dexie, { type EntityTable } from 'dexie'

import type { EntryStatus, SourceType, SuggestionItem } from './types'

export interface InboxEntryRecord {
  id?: number
  rawText: string
  sourceType: SourceType
  status: EntryStatus
  suggestions: SuggestionItem[]
  processedAt: Date | null
  createdAt: Date
}

export interface PersistedInboxEntry extends InboxEntryRecord {
  id: number
}

const db = new Dexie('AtlaxDB') as Dexie & {
  inboxEntries: EntityTable<InboxEntryRecord, 'id'>
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

export { db }
export const inboxEntries = db.table('inboxEntries')
