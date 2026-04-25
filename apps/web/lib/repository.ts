import {
  buildEntryFromArchive,
  buildDockItemReset,
  buildEntryAndDockPatches,
  buildProvenanceAsync,
  canTransition,
  createTag,
  dedupeTagNames,
  generateSuggestions,
  makeTagId,
  normalizeTagName,
  queryEntriesByDate,
  queryMonthOverview,
  validateChainLinkWithContext,
  type CalendarDayResult,
  type CalendarMonthOverview,
  type ChainProvenance,
  type EntryStatus,
  type SourceType,
  type WidgetType,
} from '@atlax/domain'

import type {
  DockItem as DomainDockItem,
  ChatMessage,
  ChatSessionCreateInput,
  ChatSessionUpdateInput,
} from '@atlax/domain/ports'
import { isValidChatSessionInput } from '@atlax/domain/ports'

import {
  chatSessionsTable,
  entriesTable,
  dockItemsTable,
  tagsTable,
  widgetsTable,
  type ChatSessionRecord,
  type EntryRecord,
  type DockItemRecord,
  type PersistedDockItem,
  type PersistedEntry,
  type PersistedChatSession,
  type PersistedTag,
  type PersistedWidget,
  type TagRecord,
  type WidgetRecord,
} from './db'

export type DockItem = DomainDockItem
export type { PersistedEntry as StoredEntry }
export type { PersistedTag as StoredTag }
export type { PersistedWidget as StoredWidget }
export type { ChainProvenance }
export type { CalendarDayResult }
export type { CalendarMonthOverview }

function toPersistedDockItem(item: DockItemRecord | undefined): PersistedDockItem | null {
  if (!item || typeof item.id !== 'number') {
    return null
  }

  return {
    ...item,
    id: item.id,
    userTags: item.userTags ?? [],
    selectedActions: item.selectedActions ?? [],
    selectedProject: item.selectedProject ?? null,
    sourceId: item.sourceId ?? null,
    parentId: item.parentId ?? null,
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

export async function createDockItem(
  userId: string,
  rawText: string,
  sourceType: SourceType = 'text',
  options?: { sourceId?: number | null; parentId?: number | null; topic?: string | null },
): Promise<number> {
  const sourceId = options?.sourceId ?? null
  const parentId = options?.parentId ?? null

  if (sourceId !== null || parentId !== null) {
    const validation = await validateChainLinkWithContext({
      currentItemId: -1,
      userId,
      sourceId,
      parentId,
      findItemById: (uid, itemId) => getDockItemForUser(uid, itemId),
    })
    if (!validation.valid) {
      throw new Error(`createDockItem: invalid chain links - ${validation.reason}`)
    }
  }

  const id = await dockItemsTable.add({
    userId,
    rawText,
    topic: options?.topic ?? null,
    sourceType,
    status: 'pending',
    suggestions: [],
    userTags: [],
    selectedActions: [],
    selectedProject: null,
    sourceId: options?.sourceId ?? null,
    parentId: options?.parentId ?? null,
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
      topic: item.topic,
      suggestions: item.suggestions,
      userTags: item.userTags,
      selectedProject: item.selectedProject,
      selectedActions: item.selectedActions,
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

  const archivedEntry = await getEntryByDockItemId(userId, id)

  if (archivedEntry) {
    await dockItemsTable.update(id, {
      status: 'reopened',
      userTags: archivedEntry.tags,
      selectedProject: archivedEntry.project,
      selectedActions: archivedEntry.actions,
      processedAt: item.processedAt,
    })
  } else {
    await dockItemsTable.update(id, {
      status: 'reopened',
      processedAt: null,
    })
  }

  return getPersistedDockItem(id)
}

export async function updateDockItemText(
  userId: string,
  id: number,
  rawText: string,
  topic?: string | null,
): Promise<PersistedDockItem | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null

  const resetFields = buildDockItemReset({ dockItemId: id, newText: rawText })
  const updateData: Partial<DockItemRecord> = { ...resetFields }
  if (topic !== undefined) {
    updateData.topic = topic
  }

  await dockItemsTable.update(id, updateData)

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

export async function updateSelectedActions(userId: string, id: number, actions: string[]): Promise<PersistedDockItem | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null

  await dockItemsTable.update(id, {
    selectedActions: actions,
  })

  return getPersistedDockItem(id)
}

export async function updateSelectedProject(userId: string, id: number, project: string | null): Promise<PersistedDockItem | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null

  await dockItemsTable.update(id, {
    selectedProject: project,
  })

  return getPersistedDockItem(id)
}

export async function updateChainLinks(userId: string, id: number, sourceId: number | null, parentId: number | null): Promise<PersistedDockItem | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null

  const validation = await validateChainLinkWithContext({
    currentItemId: id,
    userId,
    sourceId,
    parentId,
    findItemById: (uid, itemId) => getDockItemForUser(uid, itemId),
  })

  if (!validation.valid) {
    return null
  }

  await dockItemsTable.update(id, {
    sourceId,
    parentId,
  })

  return getPersistedDockItem(id)
}

export async function getChainProvenance(userId: string, id: number): Promise<ChainProvenance | null> {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null

  return buildProvenanceAsync(item, async (lookupId) => {
    const found = await dockItemsTable.get(lookupId)
    if (!found || found.userId !== userId) return null
    return found
  })
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

  const { entryPatch, dockSyncPatch } = buildEntryAndDockPatches(updates, entry.sourceDockItemId)

  if (entryPatch && Object.keys(entryPatch).length > 0) {
    await entriesTable.update(entryId, entryPatch)
  }

  if (dockSyncPatch) {
    const dockItem = await getPersistedDockItem(dockSyncPatch.sourceDockItemId)
    if (dockItem && dockItem.userId === userId) {
      await dockItemsTable.update(dockSyncPatch.sourceDockItemId, {
        userTags: dockSyncPatch.userTags,
      })
    }
  }

  return toPersistedEntry(await entriesTable.get(entryId))
}

function toPersistedChatSession(session: ChatSessionRecord | undefined): PersistedChatSession | null {
  if (!session || typeof session.id !== 'number') {
    return null
  }

  return {
    ...session,
    id: session.id,
    title: session.title ?? null,
    pinned: session.pinned ?? false,
    messages: session.messages ?? [],
    dockItemId: session.dockItemId ?? null,
  }
}

async function getChatSessionForUser(userId: string, id: number): Promise<PersistedChatSession | null> {
  const session = await chatSessionsTable.get(id)
  if (!session || session.userId !== userId) {
    return null
  }
  return toPersistedChatSession(session)
}

export async function createChatSession(input: ChatSessionCreateInput): Promise<PersistedChatSession | null> {
  if (!isValidChatSessionInput(input)) {
    return null
  }

  const now = new Date()
  const id = await chatSessionsTable.add({
    userId: input.userId,
    title: input.title ?? null,
    topic: input.topic ?? null,
    selectedType: input.selectedType ?? null,
    content: input.content ?? '',
    status: 'active',
    pinned: input.pinned ?? false,
    messages: input.messages ?? [],
    dockItemId: input.dockItemId ?? null,
    createdAt: now,
    updatedAt: now,
  })

  return toPersistedChatSession(await chatSessionsTable.get(id as number))
}

export async function getChatSession(userId: string, id: number): Promise<PersistedChatSession | null> {
  return getChatSessionForUser(userId, id)
}

export async function listChatSessions(userId: string): Promise<PersistedChatSession[]> {
  const sessions = await chatSessionsTable.where('userId').equals(userId).toArray()

  const sorted = sessions.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  return sorted.flatMap((session) => {
    const persisted = toPersistedChatSession(session)
    return persisted ? [persisted] : []
  })
}

export async function listActiveChatSessions(userId: string): Promise<PersistedChatSession[]> {
  const sessions = await chatSessionsTable
    .where('userId')
    .equals(userId)
    .and((s) => s.status === 'active')
    .toArray()

  const sorted = sessions.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  return sorted.flatMap((session) => {
    const persisted = toPersistedChatSession(session)
    return persisted ? [persisted] : []
  })
}

export async function updateChatSession(
  userId: string,
  id: number,
  updates: ChatSessionUpdateInput,
): Promise<PersistedChatSession | null> {
  const session = await getChatSessionForUser(userId, id)
  if (!session) return null

  const patch: Partial<ChatSessionRecord> = {
    ...updates,
    updatedAt: new Date(),
  }

  await chatSessionsTable.update(id, patch)

  return toPersistedChatSession(await chatSessionsTable.get(id))
}

export async function pinChatSession(userId: string, id: number): Promise<PersistedChatSession | null> {
  const session = await getChatSessionForUser(userId, id)
  if (!session) return null

  await chatSessionsTable.update(id, {
    pinned: true,
    updatedAt: new Date(),
  })

  return toPersistedChatSession(await chatSessionsTable.get(id))
}

export async function unpinChatSession(userId: string, id: number): Promise<PersistedChatSession | null> {
  const session = await getChatSessionForUser(userId, id)
  if (!session) return null

  await chatSessionsTable.update(id, {
    pinned: false,
    updatedAt: new Date(),
  })

  return toPersistedChatSession(await chatSessionsTable.get(id))
}

export async function deleteChatSession(userId: string, id: number): Promise<boolean> {
  const session = await getChatSessionForUser(userId, id)
  if (!session) return false

  await chatSessionsTable.delete(id)
  return true
}

export async function addChatMessage(
  userId: string,
  id: number,
  message: ChatMessage,
): Promise<PersistedChatSession | null> {
  const session = await getChatSessionForUser(userId, id)
  if (!session) return null

  const updatedMessages = [...session.messages, message]

  await chatSessionsTable.update(id, {
    messages: updatedMessages,
    updatedAt: new Date(),
  })

  return toPersistedChatSession(await chatSessionsTable.get(id))
}

export async function confirmChatSession(
  userId: string,
  id: number,
  content: string,
  topic: string | null,
  type: string | null,
): Promise<{ session: PersistedChatSession | null; dockItemId: number | null }> {
  const session = await getChatSessionForUser(userId, id)
  if (!session) return { session: null, dockItemId: null }

  let boundDockItemId: number | null = session.dockItemId

  if (session.dockItemId !== null) {
    const existingItem = await getDockItemForUser(userId, session.dockItemId)
    if (existingItem) {
      // Update text/topic if changed
      if (existingItem.rawText !== content || existingItem.topic !== topic) {
        await updateDockItemText(userId, session.dockItemId, content, topic)
      }
      // Update tags if type provided
      if (type) {
        await createStoredTag(userId, type)
        await updateItemTags(userId, session.dockItemId, [type])
      }
    } else {
      boundDockItemId = await createDockItem(userId, content, 'chat', { topic })
      if (type) {
        await createStoredTag(userId, type)
        await addTagToItem(userId, boundDockItemId, type)
      }
    }
  } else {
    boundDockItemId = await createDockItem(userId, content, 'chat', { topic })
    if (type) {
      await createStoredTag(userId, type)
      await addTagToItem(userId, boundDockItemId, type)
    }
  }

  await chatSessionsTable.update(id, {
    status: 'confirmed',
    topic,
    selectedType: type,
    content,
    dockItemId: boundDockItemId,
    updatedAt: new Date(),
  })

  return {
    session: toPersistedChatSession(await chatSessionsTable.get(id)),
    dockItemId: boundDockItemId,
  }
}

function toPersistedWidget(widget: WidgetRecord | undefined): PersistedWidget | null {
  if (!widget || typeof widget.id !== 'number') {
    return null
  }

  return {
    ...widget,
    id: widget.id,
    active: widget.active ?? false,
    config: widget.config ?? {},
  }
}

export async function getActiveWidget(userId: string): Promise<PersistedWidget | null> {
  const widget = await widgetsTable
    .where('userId')
    .equals(userId)
    .and((w) => w.active === true)
    .first()
  return toPersistedWidget(widget)
}

export async function activateWidget(userId: string, widgetType: WidgetType): Promise<PersistedWidget> {
  const existing = await widgetsTable
    .where('userId')
    .equals(userId)
    .toArray()

  for (const w of existing) {
    await widgetsTable.update(w.id, { active: false, updatedAt: new Date() })
  }

  const match = existing.find((w) => w.widgetType === widgetType)
  if (match) {
    await widgetsTable.update(match.id, { active: true, updatedAt: new Date() })
    return toPersistedWidget(await widgetsTable.get(match.id)) as PersistedWidget
  }

  const now = new Date()
  const id = await widgetsTable.add({
    userId,
    widgetType,
    active: true,
    config: {},
    createdAt: now,
    updatedAt: now,
  })

  return toPersistedWidget(await widgetsTable.get(id as number)) as PersistedWidget
}

export async function deactivateWidget(userId: string): Promise<PersistedWidget | null> {
  const active = await getActiveWidget(userId)
  if (!active) return null

  await widgetsTable.update(active.id, { active: false, updatedAt: new Date() })
  return toPersistedWidget(await widgetsTable.get(active.id))
}

export async function queryCalendarDay(userId: string, date: string): Promise<CalendarDayResult> {
  const entries = await entriesTable.where('userId').equals(userId).toArray()
  return queryEntriesByDate(entries, userId, date)
}

export async function queryCalendarMonth(userId: string, year: number, month: number): Promise<CalendarMonthOverview> {
  const entries = await entriesTable.where('userId').equals(userId).toArray()
  return queryMonthOverview(entries, userId, year, month)
}