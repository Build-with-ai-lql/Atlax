import Dexie, { type EntityTable } from 'dexie'

export type SourceType = 'text' | 'voice'

export interface InboxEntry {
  id?: string
  rawText: string
  sourceType: SourceType
  createdAt: Date
}

const db = new Dexie('AtlaxDB') as Dexie & {
  inboxEntries: EntityTable<InboxEntry, 'id'>
}

db.version(1).stores({
  inboxEntries: '++id, rawText, sourceType, createdAt',
})

export { db }
export const inboxEntries = db.table('inboxEntries')