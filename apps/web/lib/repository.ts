import {
  canTransition,
  createTag,
  dedupeTagNames,
  generateSuggestions,
  normalizeTagName,
  type EntryStatus,
  type SourceType,
  type SuggestionItem,
} from '@atlax/domain'

import {
  inboxEntries,
  tagsTable,
  type InboxEntryRecord,
  type PersistedInboxEntry,
  type PersistedTag,
  type TagRecord,
} from './db'

export type { PersistedInboxEntry as InboxEntry }
export type { PersistedTag as StoredTag }

function toPersistedInboxEntry(entry: InboxEntryRecord | undefined): PersistedInboxEntry | null {
  if (!entry || typeof entry.id !== 'number') {
    return null
  }

  return {
    ...entry,
    id: entry.id,
    userTags: entry.userTags ?? [],
  }
}

function toPersistedTag(tag: TagRecord | undefined): PersistedTag | null {
  if (!tag || !tag.id) {
    return null
  }

  return {
    ...tag,
    id: tag.id,
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
    userTags: [],
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

export async function updateEntryTags(id: number, userTags: string[]): Promise<PersistedInboxEntry | null> {
  const entry = await getPersistedInboxEntry(id)
  if (!entry) return null

  await inboxEntries.update(id, {
    userTags,
  })

  return getPersistedInboxEntry(id)
}

export async function addTagToEntry(id: number, tagName: string): Promise<PersistedInboxEntry | null> {
  const entry = await getPersistedInboxEntry(id)
  if (!entry) return null

  const normalized = normalizeTagName(tagName)
  if (!normalized) return entry

  const newTags = dedupeTagNames([...entry.userTags, normalized])
  return updateEntryTags(id, newTags)
}

export async function removeTagFromEntry(id: number, tagName: string): Promise<PersistedInboxEntry | null> {
  const entry = await getPersistedInboxEntry(id)
  if (!entry) return null

  const normalized = normalizeTagName(tagName)
  const newTags = entry.userTags.filter((t) => normalizeTagName(t).toLowerCase() !== normalized.toLowerCase())
  return updateEntryTags(id, newTags)
}

export async function listTags(): Promise<PersistedTag[]> {
  const tags = await tagsTable.orderBy('name').toArray()

  return tags.flatMap((tag) => {
    const persistedTag = toPersistedTag(tag)
    return persistedTag ? [persistedTag] : []
  })
}

export async function createStoredTag(name: string): Promise<PersistedTag | null> {
  const tag = createTag(name)
  if (!tag) return null

  const existing = await tagsTable.get(tag.id)
  if (existing) return toPersistedTag(existing)

  await tagsTable.add({
    id: tag.id,
    name: tag.name,
    createdAt: tag.createdAt,
  })

  return toPersistedTag(await tagsTable.get(tag.id))
}

export async function getOrCreateTag(name: string): Promise<PersistedTag | null> {
  const tag = createTag(name)
  if (!tag) return null

  const existing = await tagsTable.get(tag.id)
  if (existing) return toPersistedTag(existing)

  return createStoredTag(name)
}