import {
  canTransition,
  generateSuggestions,
  type EntryStatus,
  type SourceType,
  type SuggestionItem,
} from '@atlax/domain'

import { inboxEntries, type InboxEntryRecord, type PersistedInboxEntry } from './db'

export type { PersistedInboxEntry as InboxEntry }

function toPersistedInboxEntry(entry: InboxEntryRecord | undefined): PersistedInboxEntry | null {
  if (!entry || typeof entry.id !== 'number') {
    return null
  }

  return {
    ...entry,
    id: entry.id,
  }
}

async function getPersistedInboxEntry(id: number): Promise<PersistedInboxEntry | null> {
  const entry = await inboxEntries.get(id)
  return toPersistedInboxEntry(entry)
}

export async function createInboxEntry(rawText: string, sourceType: SourceType = 'text'): Promise<number> {
  const id = await inboxEntries.add({
    rawText,
    sourceType,
    status: 'pending',
    suggestions: [],
    processedAt: null,
    createdAt: new Date(),
  })
  return id as number
}

export async function listInboxEntries(): Promise<PersistedInboxEntry[]> {
  const entries = await inboxEntries.orderBy('createdAt').reverse().toArray()

  return entries.flatMap((entry) => {
    const persistedEntry = toPersistedInboxEntry(entry)
    return persistedEntry ? [persistedEntry] : []
  })
}

export async function listEntriesByStatus(status: EntryStatus): Promise<PersistedInboxEntry[]> {
  const entries = await inboxEntries.where('status').equals(status).reverse().sortBy('createdAt')

  return entries.flatMap((entry) => {
    const persistedEntry = toPersistedInboxEntry(entry)
    return persistedEntry ? [persistedEntry] : []
  })
}

export async function countInboxEntries(): Promise<number> {
  return inboxEntries.count()
}

export async function suggestEntry(id: number): Promise<PersistedInboxEntry | null> {
  const entry = await getPersistedInboxEntry(id)
  if (!entry) return null
  if (!canTransition(entry.status, 'suggested')) return null

  const result = generateSuggestions(entry)
  await inboxEntries.update(id, {
    status: 'suggested',
    suggestions: result.suggestions,
    processedAt: new Date(),
  })

  return getPersistedInboxEntry(id)
}

export async function archiveEntry(id: number, selectedSuggestions?: SuggestionItem[]): Promise<PersistedInboxEntry | null> {
  const entry = await getPersistedInboxEntry(id)
  if (!entry) return null
  if (!canTransition(entry.status, 'archived')) return null

  await inboxEntries.update(id, {
    status: 'archived',
    suggestions: selectedSuggestions ?? entry.suggestions,
    processedAt: new Date(),
  })

  return getPersistedInboxEntry(id)
}

export async function ignoreEntry(id: number): Promise<PersistedInboxEntry | null> {
  const entry = await getPersistedInboxEntry(id)
  if (!entry) return null
  if (!canTransition(entry.status, 'ignored')) return null

  await inboxEntries.update(id, {
    status: 'ignored',
    processedAt: new Date(),
  })

  return getPersistedInboxEntry(id)
}

export async function restoreEntry(id: number): Promise<PersistedInboxEntry | null> {
  const entry = await getPersistedInboxEntry(id)
  if (!entry) return null
  if (!canTransition(entry.status, 'pending')) return null

  await inboxEntries.update(id, {
    status: 'pending',
    suggestions: [],
    processedAt: null,
  })

  return getPersistedInboxEntry(id)
}
