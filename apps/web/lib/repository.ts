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
  dockItemsTable,
  tagsTable,
  type EntryRecord,
  type DockItemRecord,
  type PersistedEntry,
  type PersistedDockItem,
  type PersistedTag,
  type TagRecord,
} from './db'

export type { PersistedDockItem as DockItem }
export type { PersistedEntry as StoredEntry }
export type { PersistedTag as StoredTag }

function toPersistedDockItem(item: DockItemRecord | undefined): PersistedDockItem | null {
  if (!item || typeof item.id !== 'number') {
    return null
  }

  return {
    ...item,
    id: item.id,
    userTags: item.userTags ?? [],
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

async function getPersistedDockItem(id: number): Promise<PersistedDockItem | null> {
  const item = await dockItemsTable.get(id)
  return toPersistedDockItem(item)
}

async function getDockItemForUser(userId: string, id: number): Promise<PersistedDockItem | null> {
  const item = await getPersistedDockItem(id)
  if (!item) return null
  if (item.userId !== userId) return null
  return item
}

export async function createDockItem(userId: string, rawText: string, sourceType: SourceType = 'text'): Promise<number> {
  const id = await dockItemsTable.add({
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

export async function listDockItems(userId: string): Promise<PersistedDockItem[]> {
  const items = await dockItemsTable.where('userId').equals(userId).reverse().sortBy('createdAt')

  return items.flatMap((item) => {
    const persistedItem = toPersistedDockItem(item)
    return persistedItem ? [persistedItem] : []
  })
}

export async function listItemsByStatus(userId: string, status: EntryStatus): Promise<PersistedDockItem[]> {
  const all = await dockItemsTable.where('userId').equals(userId).toArray()
  const filtered = all.filter((i) => i.status === status)

  return filtered.flatMap((item) => {
    const persistedItem = toPersistedDockItem(item)
    return persistedItem ? [persistedItem] : []
  })
}

export async function countDockItems(userId: string): Promise<number> {
  return dockItemsTable.where('userId').equals(userId).count()
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
  reopenedCount: number
  tagCount: number
}> {
  const [allDockItems, allEntries, allTags] = await Promise.all([
    dockItemsTable.where('userId').equals(userId).toArray(),
    entriesTable.where('userId').equals(userId).count(),
    tagsTable.where('userId').equals(userId).count(),
  ])

  return {
    totalEntries: allEntries,
    pendingCount: allDockItems.filter((i) => i.status === 'pending').length,
    suggestedCount: allDockItems.filter((i) => i.status === 'suggested').length,
    archivedCount: allDockItems.filter((i) => i.status === 'archived').length,
    ignoredCount: allDockItems.filter((i) => i.status === 'ignored').length,
    reopenedCount: allDockItems.filter((i) => i.status === 'reopened').length,
    tagCount: allTags,
  }
}

export async function getEntryByDockItemId(userId: string, dockItemId: number): Promise<PersistedEntry | null> {
  const entry = await entriesTable.where('userId').equals(userId).and((e) => e.sourceDockItemId === dockItemId).first()
  return toPersistedEntry(entry)
}

export async function suggestItem(userId: string, id: number): Promise<PersistedDockItem | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null
  if (!canTransition(item.status, 'suggested')) return null

  const result = generateSuggestions(item)
  await dockItemsTable.update(id, {
    status: 'suggested',
    suggestions: result.suggestions,
    processedAt: new Date(),
  })

  return getPersistedDockItem(id)
}

export async function archiveItem(userId: string, id: number): Promise<PersistedDockItem | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null
  if (!canTransition(item.status, 'archived')) return null

  const built = buildEntryFromArchive(
    {
      dockItemId: id,
      rawText: item.rawText,
      suggestions: item.suggestions,
      userTags: item.userTags,
      createdAt: item.createdAt,
    },
    0,
  )

  const existing = await getEntryByDockItemId(userId, id)
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
    await dockItemsTable.update(id, {
      status: 'archived',
      processedAt: new Date(),
    })
    return getPersistedDockItem(id)
  }

  await entriesTable.add({
    userId,
    sourceDockItemId: id,
    title: built.title,
    content: built.content,
    type: built.type,
    tags: built.tags,
    project: built.project,
    actions: built.actions,
    createdAt: built.createdAt,
    archivedAt: built.archivedAt,
  })

  await dockItemsTable.update(id, {
    status: 'archived',
    processedAt: new Date(),
  })

  return getPersistedDockItem(id)
}

export async function ignoreItem(userId: string, id: number): Promise<PersistedDockItem | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null
  if (!canTransition(item.status, 'ignored')) return null

  await dockItemsTable.update(id, {
    status: 'ignored',
    processedAt: new Date(),
  })

  return getPersistedDockItem(id)
}

export async function restoreItem(userId: string, id: number): Promise<PersistedDockItem | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null
  if (!canTransition(item.status, 'pending')) return null

  await dockItemsTable.update(id, {
    status: 'pending',
    suggestions: [],
    processedAt: null,
  })

  return getPersistedDockItem(id)
}

export async function reopenItem(userId: string, id: number): Promise<PersistedDockItem | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null
  if (!canTransition(item.status, 'reopened')) return null

  await dockItemsTable.update(id, {
    status: 'reopened',
    suggestions: [],
    processedAt: null,
  })

  return getPersistedDockItem(id)
}

export async function updateItemTags(userId: string, id: number, userTags: string[]): Promise<PersistedDockItem | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null

  await dockItemsTable.update(id, {
    userTags,
  })

  return getPersistedDockItem(id)
}

export async function addTagToItem(userId: string, id: number, tagName: string): Promise<PersistedDockItem | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null

  const normalized = normalizeTagName(tagName)
  if (!normalized) return item

  const newTags = dedupeTagNames([...item.userTags, normalized])
  return updateItemTags(userId, id, newTags)
}

export async function removeTagFromItem(userId: string, id: number, tagName: string): Promise<PersistedDockItem | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null

  const normalized = normalizeTagName(tagName)
  const newTags = item.userTags.filter((t) => normalizeTagName(t).toLowerCase() !== normalized.toLowerCase())
  return updateItemTags(userId, id, newTags)
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

export async function updateArchivedEntry(
  userId: string,
  entryId: number,
  updates: { tags?: string[]; project?: string | null; content?: string; title?: string },
): Promise<PersistedEntry | null> {
  const entry = await entriesTable.get(entryId)
  if (!entry || entry.userId !== userId) return null

  const patch: Partial<EntryRecord> = {}
  if (updates.tags !== undefined) patch.tags = updates.tags
  if (updates.project !== undefined) patch.project = updates.project
  if (updates.content !== undefined) patch.content = updates.content
  if (updates.title !== undefined) patch.title = updates.title

  if (Object.keys(patch).length > 0) {
    await entriesTable.update(entryId, patch)
  }

  if (updates.tags !== undefined && entry.sourceDockItemId) {
    const dockItem = await getPersistedDockItem(entry.sourceDockItemId)
    if (dockItem && dockItem.userId === userId) {
      await dockItemsTable.update(entry.sourceDockItemId, {
        userTags: updates.tags,
      })
    }
  }

  return toPersistedEntry(await entriesTable.get(entryId))
}