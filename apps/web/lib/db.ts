import Dexie, { type EntityTable } from 'dexie'

import type { EntryStatus, SourceType, SuggestionItem } from '@atlax/domain'
import type { ChatMessage, ChatSessionStatus } from '@atlax/domain/ports'

export interface DockItemRecord {
  id?: number
  userId: string
  rawText: string
  sourceType: SourceType
  status: EntryStatus
  suggestions: SuggestionItem[]
  userTags: string[]
  selectedActions: string[]
  selectedProject: string | null
  sourceId: number | null
  parentId: number | null
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

export interface ChatSessionRecord {
  id?: number
  userId: string
  title: string | null
  topic: string | null
  selectedType: string | null
  content: string
  status: ChatSessionStatus
  pinned: boolean
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface PersistedChatSession extends ChatSessionRecord {
  id: number
}

const FALLBACK_USER_ID = '_legacy'

export function runV8Upgrade(tx: {
  table: (name: string) => {
    toCollection: () => {
      modify: (fn: (r: Record<string, unknown>) => void) => void
    }
  }
}): void {
  tx.table('dockItems').toCollection().modify((item: Record<string, unknown>) => {
    if (!item.userId) item.userId = FALLBACK_USER_ID
    if (!item.sourceType) item.sourceType = 'text'
    if (!item.status) item.status = 'pending'
    if (!Array.isArray(item.suggestions)) item.suggestions = []
    if (!Array.isArray(item.userTags)) item.userTags = []
    if (!Array.isArray(item.selectedActions)) item.selectedActions = []
    if (item.selectedProject === undefined) item.selectedProject = null
    if (item.sourceId === undefined) item.sourceId = null
    if (item.parentId === undefined) item.parentId = null
  })
  tx.table('entries').toCollection().modify((entry: Record<string, unknown>) => {
    if (!entry.userId) entry.userId = FALLBACK_USER_ID
    if (!entry.sourceDockItemId && entry.sourceDockItemId !== 0) {
      entry.sourceDockItemId = 0
    }
  })
  tx.table('tags').toCollection().modify((tag: Record<string, unknown>) => {
    if (!tag.userId) tag.userId = FALLBACK_USER_ID
  })
}

const db = new Dexie('AtlaxDB') as Dexie & {
  dockItems: EntityTable<DockItemRecord, 'id'>
  tags: EntityTable<TagRecord, 'id'>
  entries: EntityTable<EntryRecord, 'id'>
  chatSessions: EntityTable<ChatSessionRecord, 'id'>
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
  tx.table('dockItems').toCollection().modify((item: Record<string, unknown>) => {
    item.userId = item.userId ?? FALLBACK_USER_ID
  })
  tx.table('tags').toCollection().modify((tag: Record<string, unknown>) => {
    tag.userId = tag.userId ?? FALLBACK_USER_ID
  })
  tx.table('entries').toCollection().modify((entry: Record<string, unknown>) => {
    entry.userId = entry.userId ?? FALLBACK_USER_ID
  })
})

db.version(6).stores({
  dockItems: '++id, userId, rawText, sourceType, status, createdAt',
  tags: 'id, userId, name, [userId+name]',
  entries: '++id, userId, sourceDockItemId, type, archivedAt',
}).upgrade((tx) => {
  tx.table('tags').toCollection().modify((tag: Record<string, unknown>) => {
    const oldId = tag.id as string
    if (oldId && !oldId.startsWith(FALLBACK_USER_ID + '_')) {
      tag.id = `${tag.userId ?? FALLBACK_USER_ID}_${oldId}`
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
}).upgrade(runV8Upgrade)

db.version(9).stores({
  dockItems: '++id, userId, rawText, sourceType, status, createdAt',
  tags: 'id, userId, name, [userId+name]',
  entries: '++id, userId, sourceDockItemId, type, archivedAt',
  chatSessions: '++id, userId, status, pinned, createdAt, updatedAt',
}).upgrade((tx) => {
  tx.table('chatSessions').toCollection().modify((session: Record<string, unknown>) => {
    if (session.pinned === undefined) session.pinned = false
    if (session.title === undefined) session.title = null
  })
})

export { db }
export const dockItemsTable = db.table('dockItems')
export const tagsTable = db.table('tags')
export const entriesTable = db.table('entries')
export const chatSessionsTable = db.table('chatSessions')
