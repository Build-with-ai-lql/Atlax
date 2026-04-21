import { inboxEntries, type InboxEntry } from './db'
import type { EntryStatus, SuggestionItem, SourceType, ArchiveIntent } from './types'
import { generateSuggestions } from './suggestion-engine'

export type { InboxEntry }
export type { EntryStatus, SuggestionItem, ArchiveIntent }

const VALID_TRANSITIONS: Record<EntryStatus, EntryStatus[]> = {
  pending: ['suggested', 'ignored'],
  suggested: ['archived', 'ignored'],
  archived: [],
  ignored: ['pending'],
}

function canTransition(current: EntryStatus, target: EntryStatus): boolean {
  return VALID_TRANSITIONS[current].includes(target)
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

export async function listInboxEntries(): Promise<InboxEntry[]> {
  return inboxEntries.orderBy('createdAt').reverse().toArray()
}

export async function listEntriesByStatus(status: EntryStatus): Promise<InboxEntry[]> {
  return inboxEntries.where('status').equals(status).reverse().sortBy('createdAt')
}

export async function countInboxEntries(): Promise<number> {
  return inboxEntries.count()
}

export async function suggestEntry(id: number): Promise<InboxEntry | null> {
  const entry = await inboxEntries.get(id)
  if (!entry) return null
  if (!canTransition(entry.status, 'suggested')) return null

  const result = generateSuggestions(entry)
  await inboxEntries.update(id, {
    status: 'suggested',
    suggestions: result.suggestions,
    processedAt: new Date(),
  })

  return inboxEntries.get(id) ?? null
}

export async function archiveEntry(id: number, selectedSuggestions?: SuggestionItem[]): Promise<ArchiveIntent | null> {
  const entry = await inboxEntries.get(id)
  if (!entry) return null
  if (!canTransition(entry.status, 'archived')) return null

  const intent: ArchiveIntent = {
    entryId: id,
    selectedSuggestions: selectedSuggestions ?? entry.suggestions,
    archivedAt: new Date(),
  }

  await inboxEntries.update(id, {
    status: 'archived',
    processedAt: new Date(),
  })

  return intent
}

export async function ignoreEntry(id: number): Promise<boolean> {
  const entry = await inboxEntries.get(id)
  if (!entry) return false
  if (!canTransition(entry.status, 'ignored')) return false

  await inboxEntries.update(id, {
    status: 'ignored',
    processedAt: new Date(),
  })
  return true
}

export async function restoreEntry(id: number): Promise<boolean> {
  const entry = await inboxEntries.get(id)
  if (!entry) return false
  if (!canTransition(entry.status, 'pending')) return false

  await inboxEntries.update(id, {
    status: 'pending',
    suggestions: [],
    processedAt: null,
  })
  return true
}

export { canTransition, VALID_TRANSITIONS }