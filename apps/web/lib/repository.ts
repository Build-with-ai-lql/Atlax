import {
  buildEntryFromArchive,
  canTransition,
  createTag,
  dedupeTagNames,
  generateSuggestions,
  makeTagId,
  normalizeTagName,
  type EntryStatus,
  type SourceType,
} from '@atlax/domain'

import {
  entriesTable,
  inboxEntries,
  tagsTable,
  type EntryRecord,
  type InboxEntryRecord,
  type PersistedEntry,
  type PersistedInboxEntry,
  type PersistedTag,
  type TagRecord,
} from './db'

export type { PersistedInboxEntry as InboxEntry }
export type { PersistedEntry as StoredEntry }
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

function toPersistedEntry(entry: EntryRecord | undefined): PersistedEntry | null {
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

async function getInboxEntryForUser(userId: string, id: number): Promise<PersistedInboxEntry | null> {
  const entry = await getPersistedInboxEntry(id)
  if (!entry) return null
  if (entry.userId !== userId) return null
  return entry
}

export async function createInboxEntry(userId: string, rawText: string, sourceType: SourceType = 'text'): Promise<number> {
  const id = await inboxEntries.add({
    userId,
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

export async function listInboxEntries(userId: string): Promise<PersistedInboxEntry[]> {
  const entries = await inboxEntries.where('userId').equals(userId).reverse().sortBy('createdAt')

  return entries.flatMap((entry) => {
    const persistedEntry = toPersistedInboxEntry(entry)
    return persistedEntry ? [persistedEntry] : []
  })
}

export async function listEntriesByStatus(userId: string, status: EntryStatus): Promise<PersistedInboxEntry[]> {
  const all = await inboxEntries.where('userId').equals(userId).toArray()
  const filtered = all.filter((e) => e.status === status)

  return filtered.flatMap((entry) => {
    const persistedEntry = toPersistedInboxEntry(entry)
    return persistedEntry ? [persistedEntry] : []
  })
}

export async function countInboxEntries(userId: string): Promise<number> {
  return inboxEntries.where('userId').equals(userId).count()
}

export async function listArchivedEntries(userId: string): Promise<PersistedEntry[]> {
  const all = await entriesTable.where('userId').equals(userId).reverse().sortBy('archivedAt')

  return all.flatMap((entry) => {
    const persistedEntry = toPersistedEntry(entry)
    return persistedEntry ? [persistedEntry] : []
  })
}

export async function listArchivedEntriesByType(userId: string, type: string): Promise<PersistedEntry[]> {
  const all = await entriesTable.where('userId').equals(userId).and((e) => e.type === type).reverse().sortBy('archivedAt')
  return all.flatMap((entry) => {
    const persistedEntry = toPersistedEntry(entry)
    return persistedEntry ? [persistedEntry] : []
  })
}

export async function listArchivedEntriesByTag(userId: string, tag: string): Promise<PersistedEntry[]> {
  const normalized = normalizeTagName(tag).toLowerCase()
  const all = await entriesTable.where('userId').equals(userId).and((e) =>
    e.tags.some((t: string) => normalizeTagName(t).toLowerCase() === normalized)
  ).reverse().sortBy('archivedAt')
  return all.flatMap((entry) => {
    const persistedEntry = toPersistedEntry(entry)
    return persistedEntry ? [persistedEntry] : []
  })
}

export async function listArchivedEntriesByProject(userId: string, project: string): Promise<PersistedEntry[]> {
  const all = await entriesTable.where('userId').equals(userId).and((e) => e.project === project).reverse().sortBy('archivedAt')
  return all.flatMap((entry) => {
    const persistedEntry = toPersistedEntry(entry)
    return persistedEntry ? [persistedEntry] : []
  })
}

export async function getWorkspaceStats(userId: string): Promise<{
  totalEntries: number
  pendingCount: number
  suggestedCount: number
  archivedCount: number
  ignoredCount: number
  tagCount: number
}> {
  const [allInbox, allEntries, allTags] = await Promise.all([
    inboxEntries.where('userId').equals(userId).toArray(),
    entriesTable.where('userId').equals(userId).count(),
    tagsTable.where('userId').equals(userId).count(),
  ])

  return {
    totalEntries: allEntries,
    pendingCount: allInbox.filter((e) => e.status === 'pending').length,
    suggestedCount: allInbox.filter((e) => e.status === 'suggested').length,
    archivedCount: allInbox.filter((e) => e.status === 'archived').length,
    ignoredCount: allInbox.filter((e) => e.status === 'ignored').length,
    tagCount: allTags,
  }
}

export async function getEntryByInboxId(userId: string, inboxEntryId: number): Promise<PersistedEntry | null> {
  const entry = await entriesTable.where('userId').equals(userId).and((e) => e.sourceInboxEntryId === inboxEntryId).first()
  return toPersistedEntry(entry)
}

export async function suggestEntry(userId: string, id: number): Promise<PersistedInboxEntry | null> {
  const entry = await getInboxEntryForUser(userId, id)
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

export async function archiveEntry(userId: string, id: number): Promise<PersistedInboxEntry | null> {
  const entry = await getInboxEntryForUser(userId, id)
  if (!entry) return null
  if (!canTransition(entry.status, 'archived')) return null

  const built = buildEntryFromArchive(
    {
      inboxEntryId: id,
      rawText: entry.rawText,
      suggestions: entry.suggestions,
      userTags: entry.userTags,
      createdAt: entry.createdAt,
    },
    0,
  )

  const existing = await getEntryByInboxId(userId, id)
  if (existing) {
    await entriesTable.update(existing.id, {
      title: built.title,
      content: built.content,
      type: built.type,
      tags: built.tags,
      project: built.project,
      actions: built.actions,
      archivedAt: built.archivedAt,
    })
    await inboxEntries.update(id, {
      status: 'archived',
      processedAt: new Date(),
    })
    return getPersistedInboxEntry(id)
  }

  await entriesTable.add({
    userId,
    sourceInboxEntryId: id,
    title: built.title,
    content: built.content,
    type: built.type,
    tags: built.tags,
    project: built.project,
    actions: built.actions,
    createdAt: built.createdAt,
    archivedAt: built.archivedAt,
  })

  await inboxEntries.update(id, {
    status: 'archived',
    processedAt: new Date(),
  })

  return getPersistedInboxEntry(id)
}

export async function ignoreEntry(userId: string, id: number): Promise<PersistedInboxEntry | null> {
  const entry = await getInboxEntryForUser(userId, id)
  if (!entry) return null
  if (!canTransition(entry.status, 'ignored')) return null

  await inboxEntries.update(id, {
    status: 'ignored',
    processedAt: new Date(),
  })

  return getPersistedInboxEntry(id)
}

export async function restoreEntry(userId: string, id: number): Promise<PersistedInboxEntry | null> {
  const entry = await getInboxEntryForUser(userId, id)
  if (!entry) return null
  if (!canTransition(entry.status, 'pending')) return null

  await inboxEntries.update(id, {
    status: 'pending',
    suggestions: [],
    processedAt: null,
  })

  return getPersistedInboxEntry(id)
}

export async function reopenEntry(userId: string, id: number): Promise<PersistedInboxEntry | null> {
  const entry = await getInboxEntryForUser(userId, id)
  if (!entry) return null
  if (!canTransition(entry.status, 'pending')) return null

  await inboxEntries.update(id, {
    status: 'pending',
    processedAt: null,
  })

  return getPersistedInboxEntry(id)
}

export async function updateEntryTags(userId: string, id: number, userTags: string[]): Promise<PersistedInboxEntry | null> {
  const entry = await getInboxEntryForUser(userId, id)
  if (!entry) return null

  await inboxEntries.update(id, {
    userTags,
  })

  return getPersistedInboxEntry(id)
}

export async function addTagToEntry(userId: string, id: number, tagName: string): Promise<PersistedInboxEntry | null> {
  const entry = await getInboxEntryForUser(userId, id)
  if (!entry) return null

  const normalized = normalizeTagName(tagName)
  if (!normalized) return entry

  const newTags = dedupeTagNames([...entry.userTags, normalized])
  return updateEntryTags(userId, id, newTags)
}

export async function removeTagFromEntry(userId: string, id: number, tagName: string): Promise<PersistedInboxEntry | null> {
  const entry = await getInboxEntryForUser(userId, id)
  if (!entry) return null

  const normalized = normalizeTagName(tagName)
  const newTags = entry.userTags.filter((t) => normalizeTagName(t).toLowerCase() !== normalized.toLowerCase())
  return updateEntryTags(userId, id, newTags)
}

export async function listTags(userId: string): Promise<PersistedTag[]> {
  const tags = await tagsTable.where('userId').equals(userId).sortBy('name')

  return tags.flatMap((tag) => {
    const persistedTag = toPersistedTag(tag)
    return persistedTag ? [persistedTag] : []
  })
}

async function findTagByName(userId: string, name: string): Promise<PersistedTag | null> {
  const normalized = normalizeTagName(name).toLowerCase()
  const tag = await tagsTable.where('userId').equals(userId).and((t) => normalizeTagName(t.name).toLowerCase() === normalized).first()
  return toPersistedTag(tag)
}

function makeUserScopedTagId(userId: string, name: string): string {
  return `${userId}_${makeTagId(name)}`
}

export async function createStoredTag(userId: string, name: string): Promise<PersistedTag | null> {
  const tag = createTag(name)
  if (!tag) return null

  const existing = await findTagByName(userId, name)
  if (existing) return existing

  const scopedId = makeUserScopedTagId(userId, name)
  await tagsTable.add({
    id: scopedId,
    userId,
    name: tag.name,
    createdAt: tag.createdAt,
  })

  return toPersistedTag(await tagsTable.get(scopedId))
}

export async function getOrCreateTag(userId: string, name: string): Promise<PersistedTag | null> {
  const existing = await findTagByName(userId, name)
  if (existing) return existing

  return createStoredTag(userId, name)
}
