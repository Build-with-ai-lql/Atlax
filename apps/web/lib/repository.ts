import {
  buildEntryFromArchive,
  buildDockItemReset,
  buildEntryAndDockPatches,
  buildProvenanceAsync,
  buildStructureProjection,
  backfillEntryTagRelations,
  backfillProjectCollections,
  canTransition,
  computeTemporalKeys,
  createTag,
  dedupeTagNames,
  generateSuggestions,
  makeCollectionId,
  makeEntryRelationId,
  makeEntryTagRelationId,
  makeKnowledgeEventId,
  makeMindEdgeId,
  makeMindNodeId,
  makeRecentDocumentId,
  makeTemporalActivityId,
  makeTagId,
  makeWorkspaceSessionId,
  makeWorkspaceTabId,
  normalizeTagName,
  queryEntriesByDate,
  queryMonthOverview,
  validateChainLinkWithContext,
  validateEntryRelationInput,
  type CalendarDayResult,
  type CalendarMonthOverview,
  type ChainProvenance,
  type Collection,
  type CollectionType,
  type DocumentUpdateInput,
  type EntryRelationType,
  type EntryStatus,
  type KnowledgeEventType,
  type KnowledgeEventTargetType,
  type MindEdgeType,
  type MindNodeType,
  type MindNodeState,
  type RelationDirection,
  type RelationSource,
  type SourceType,
  type StructureProjection,
  type TabType,
  type TagRelationSource,
  type TemporalActivityType,
  type TemporalActivityEntityType,
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
  collectionsTable,
  entriesTable,
  entryRelationsTable,
  entryTagRelationsTable,
  dockItemsTable,
  knowledgeEventsTable,
  mindNodesTable,
  mindEdgesTable,
  recentDocumentsTable,
  tagsTable,
  temporalActivitiesTable,
  widgetsTable,
  workspaceOpenTabsTable,
  workspaceSessionsTable,
  editorDraftsTable,
  type ChatSessionRecord,
  type CollectionRecord,
  type EntryRecord,
  type EntryRelationRecord,
  type EntryTagRelationRecord,
  type DockItemRecord,
  type KnowledgeEventRecord,
  type MindNodeRecord,
  type MindEdgeRecord,
  type RecentDocumentRecord,
  type TemporalActivityRecord,
  type WorkspaceOpenTabRecord,
  type WorkspaceSessionRecord,
  type EditorDraftRecord,
  type PersistedDockItem,
  type PersistedEntry,
  type PersistedDocument,
  type PersistedChatSession,
  type PersistedCollection,
  type PersistedEntryRelation,
  type PersistedEntryTagRelation,
  type PersistedKnowledgeEvent,
  type PersistedMindNode,
  type PersistedMindEdge,
  type PersistedRecentDocument,
  type PersistedTag,
  type PersistedTemporalActivity,
  type PersistedWidget,
  type PersistedWorkspaceOpenTab,
  type PersistedWorkspaceSession,
  type PersistedEditorDraft,
  type TagRecord,
  type WidgetRecord,
} from './db'

export type DockItem = DomainDockItem
export type { PersistedEntry as StoredEntry }
export type { PersistedDocument as StoredDocument }
export type { PersistedTag as StoredTag }
export type { PersistedWidget as StoredWidget }
export type { PersistedCollection as StoredCollection }
export type { PersistedEntryTagRelation as StoredEntryTagRelation }
export type { PersistedEntryRelation as StoredEntryRelation }
export type { PersistedKnowledgeEvent as StoredKnowledgeEvent }
export type { PersistedTemporalActivity as StoredTemporalActivity }
export type { PersistedMindNode as StoredMindNode }
export type { PersistedMindEdge as StoredMindEdge }
export type { PersistedWorkspaceSession as StoredWorkspaceSession }
export type { PersistedWorkspaceOpenTab as StoredWorkspaceOpenTab }
export type { PersistedRecentDocument as StoredRecentDocument }
export type { ChainProvenance }
export type { CalendarDayResult }
export type { CalendarMonthOverview }
export type { StructureProjection }

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

function toPersistedCollection(col: CollectionRecord | undefined): PersistedCollection | null {
  if (!col || !col.id) return null
  return {
    ...col,
    id: col.id,
    description: col.description ?? null,
    icon: col.icon ?? null,
    color: col.color ?? null,
    parentId: col.parentId ?? null,
    sortOrder: col.sortOrder ?? 0,
  }
}

function toPersistedEntryTagRelation(rel: EntryTagRelationRecord | undefined): PersistedEntryTagRelation | null {
  if (!rel || !rel.id) return null
  return { ...rel, id: rel.id }
}

function toPersistedEntryRelation(rel: EntryRelationRecord | undefined): PersistedEntryRelation | null {
  if (!rel || !rel.id) return null
  return { ...rel, id: rel.id, reason: rel.reason ?? null, confidence: rel.confidence ?? null }
}

function toPersistedKnowledgeEvent(evt: KnowledgeEventRecord | undefined): PersistedKnowledgeEvent | null {
  if (!evt || !evt.id) return null
  return { ...evt, id: evt.id, targetId: evt.targetId ?? null, metadata: evt.metadata ?? null }
}

function toPersistedTemporalActivity(act: TemporalActivityRecord | undefined): PersistedTemporalActivity | null {
  if (!act || !act.id) return null
  return {
    ...act,
    id: act.id,
    summary: act.summary ?? null,
    tagIds: act.tagIds ?? [],
    projectIds: act.projectIds ?? [],
    metadata: act.metadata ?? null,
  }
}

export async function listCollections(userId: string): Promise<PersistedCollection[]> {
  const cols = await collectionsTable.where('userId').equals(userId).sortBy('sortOrder')
  return cols.flatMap((c) => { const p = toPersistedCollection(c); return p ? [p] : [] })
}

export async function createCollection(input: {
  userId: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  parentId?: string | null
  sortOrder?: number
  collectionType?: CollectionType
}): Promise<PersistedCollection> {
  const now = new Date()
  const id = makeCollectionId(input.userId, input.name)
  const record: CollectionRecord = {
    id,
    userId: input.userId,
    name: input.name,
    description: input.description ?? null,
    icon: input.icon ?? null,
    color: input.color ?? null,
    parentId: input.parentId ?? null,
    sortOrder: input.sortOrder ?? 0,
    collectionType: input.collectionType ?? 'folder',
    createdAt: now,
    updatedAt: now,
  }
  await collectionsTable.add(record)
  return toPersistedCollection(await collectionsTable.get(id)) as PersistedCollection
}

export async function updateCollection(
  userId: string,
  collectionId: string,
  updates: Partial<Pick<Collection, 'name' | 'description' | 'icon' | 'color' | 'parentId' | 'sortOrder' | 'collectionType'>>,
): Promise<PersistedCollection | null> {
  const col = await collectionsTable.get(collectionId)
  if (!col || col.userId !== userId) return null

  await collectionsTable.update(collectionId, { ...updates, updatedAt: new Date() })
  return toPersistedCollection(await collectionsTable.get(collectionId))
}

export async function listEntryTagRelations(userId: string): Promise<PersistedEntryTagRelation[]> {
  const rels = await entryTagRelationsTable.where('userId').equals(userId).toArray()
  return rels.flatMap((r) => { const p = toPersistedEntryTagRelation(r); return p ? [p] : [] })
}

export async function addEntryTagRelation(input: {
  userId: string
  entryId: number
  tagId: string
  source?: TagRelationSource
  confidence?: number | null
}): Promise<PersistedEntryTagRelation> {
  const id = makeEntryTagRelationId(input.userId, input.entryId, input.tagId)
  const now = new Date()
  const record: EntryTagRelationRecord = {
    id,
    userId: input.userId,
    entryId: input.entryId,
    tagId: input.tagId,
    source: input.source ?? 'user',
    confidence: input.confidence ?? null,
    createdAt: now,
  }
  await entryTagRelationsTable.put(record)
  return toPersistedEntryTagRelation(await entryTagRelationsTable.get(id)) as PersistedEntryTagRelation
}

export async function removeEntryTagRelation(userId: string, entryId: number, tagId: string): Promise<boolean> {
  const id = makeEntryTagRelationId(userId, entryId, tagId)
  const existing = await entryTagRelationsTable.get(id)
  if (!existing || existing.userId !== userId) return false
  await entryTagRelationsTable.delete(id)
  return true
}

export async function listEntryRelations(userId: string): Promise<PersistedEntryRelation[]> {
  const rels = await entryRelationsTable.where('userId').equals(userId).toArray()
  return rels.flatMap((r) => { const p = toPersistedEntryRelation(r); return p ? [p] : [] })
}

export async function createEntryRelation(input: {
  userId: string
  sourceEntryId: number
  targetEntryId: number
  relationType: EntryRelationType
  direction?: RelationDirection
  source?: RelationSource
  confidence?: number | null
  reason?: string | null
}): Promise<PersistedEntryRelation | null> {
  const validation = await validateEntryRelationInput({
    userId: input.userId,
    sourceEntryId: input.sourceEntryId,
    targetEntryId: input.targetEntryId,
    findEntryById: async (uid, entryId) => {
      const entry = await entriesTable.get(entryId)
      if (!entry || entry.userId !== uid) return null
      return entry
    },
  })
  if (!validation.valid) return null

  const id = makeEntryRelationId(input.userId, input.sourceEntryId, input.targetEntryId, input.relationType)
  const now = new Date()
  const record: EntryRelationRecord = {
    id,
    userId: input.userId,
    sourceEntryId: input.sourceEntryId,
    targetEntryId: input.targetEntryId,
    relationType: input.relationType,
    direction: input.direction ?? 'undirected',
    source: input.source ?? 'user',
    confidence: input.confidence ?? null,
    reason: input.reason ?? null,
    createdAt: now,
    updatedAt: now,
  }
  await entryRelationsTable.put(record)

  await recordKnowledgeEvent({
    userId: input.userId,
    eventType: 'relation_created',
    targetType: 'relation',
    targetId: id,
    metadata: { sourceEntryId: input.sourceEntryId, targetEntryId: input.targetEntryId, relationType: input.relationType },
  })

  await recordTemporalActivity({
    userId: input.userId,
    type: 'relation_created',
    entityType: 'relation',
    entityId: id,
    title: `${input.relationType}: ${input.sourceEntryId} → ${input.targetEntryId}`,
    metadata: { sourceEntryId: input.sourceEntryId, targetEntryId: input.targetEntryId, relationType: input.relationType },
  })

  return toPersistedEntryRelation(await entryRelationsTable.get(id))
}

export async function deleteEntryRelation(userId: string, relationId: string): Promise<boolean> {
  const existing = await entryRelationsTable.get(relationId)
  if (!existing || existing.userId !== userId) return false

  await recordKnowledgeEvent({
    userId,
    eventType: 'relation_deleted',
    targetType: 'relation',
    targetId: relationId,
    metadata: { sourceEntryId: existing.sourceEntryId, targetEntryId: existing.targetEntryId, relationType: existing.relationType },
  })

  await recordTemporalActivity({
    userId,
    type: 'relation_deleted',
    entityType: 'relation',
    entityId: relationId,
    title: `删除关系: ${existing.relationType}: ${existing.sourceEntryId} → ${existing.targetEntryId}`,
    metadata: { sourceEntryId: existing.sourceEntryId, targetEntryId: existing.targetEntryId, relationType: existing.relationType },
  })

  await entryRelationsTable.delete(relationId)
  return true
}

export async function listKnowledgeEvents(userId: string): Promise<PersistedKnowledgeEvent[]> {
  const evts = await knowledgeEventsTable.where('userId').equals(userId).reverse().sortBy('createdAt')
  return evts.flatMap((e) => { const p = toPersistedKnowledgeEvent(e); return p ? [p] : [] })
}

export async function recordKnowledgeEvent(input: {
  userId: string
  eventType: KnowledgeEventType
  targetType: KnowledgeEventTargetType
  targetId?: string | null
  metadata?: Record<string, unknown> | null
}): Promise<PersistedKnowledgeEvent> {
  const now = new Date()
  const id = makeKnowledgeEventId(input.userId, input.eventType, now.getTime())
  const record: KnowledgeEventRecord = {
    id,
    userId: input.userId,
    eventType: input.eventType,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? null,
    createdAt: now,
  }
  await knowledgeEventsTable.add(record)
  return toPersistedKnowledgeEvent(await knowledgeEventsTable.get(id)) as PersistedKnowledgeEvent
}

export async function listTemporalActivities(userId: string): Promise<PersistedTemporalActivity[]> {
  const acts = await temporalActivitiesTable.where('userId').equals(userId).reverse().sortBy('occurredAt')
  return acts.flatMap((a) => { const p = toPersistedTemporalActivity(a); return p ? [p] : [] })
}

export async function recordTemporalActivity(input: {
  userId: string
  type: TemporalActivityType
  entityType: TemporalActivityEntityType
  entityId: string
  occurredAt?: Date
  title: string
  summary?: string | null
  tagIds?: string[]
  projectIds?: string[]
  metadata?: Record<string, unknown> | null
}): Promise<PersistedTemporalActivity> {
  const occurredAt = input.occurredAt ?? new Date()
  const keys = computeTemporalKeys(occurredAt)
  const id = makeTemporalActivityId(input.userId, input.type, input.entityId, occurredAt.getTime())
  const record: TemporalActivityRecord = {
    id,
    userId: input.userId,
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    occurredAt,
    dayKey: keys.dayKey,
    weekKey: keys.weekKey,
    monthKey: keys.monthKey,
    title: input.title,
    summary: input.summary ?? null,
    tagIds: input.tagIds ?? [],
    projectIds: input.projectIds ?? [],
    metadata: input.metadata ?? null,
  }
  await temporalActivitiesTable.add(record)

  await recordKnowledgeEvent({
    userId: input.userId,
    eventType: 'temporal_activity_created',
    targetType: 'entry',
    targetId: input.entityId,
    metadata: { activityType: input.type, dayKey: keys.dayKey },
  })

  return toPersistedTemporalActivity(await temporalActivitiesTable.get(id)) as PersistedTemporalActivity
}

export async function getStructureProjection(userId: string): Promise<StructureProjection> {
  const [entries, tags, collections, tagRels, entryRels] = await Promise.all([
    entriesTable.where('userId').equals(userId).toArray(),
    tagsTable.where('userId').equals(userId).toArray(),
    collectionsTable.where('userId').equals(userId).toArray(),
    entryTagRelationsTable.where('userId').equals(userId).toArray(),
    entryRelationsTable.where('userId').equals(userId).toArray(),
  ])

  return buildStructureProjection({
    entries,
    tags,
    collections: collections.map((c) => ({
      id: c.id as string,
      userId: c.userId,
      name: c.name,
      description: c.description ?? null,
      icon: c.icon ?? null,
      color: c.color ?? null,
      parentId: c.parentId ?? null,
      sortOrder: c.sortOrder ?? 0,
      collectionType: c.collectionType,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    entryTagRelations: tagRels.map((r) => ({
      id: r.id as string,
      userId: r.userId,
      entryId: r.entryId,
      tagId: r.tagId,
      source: r.source,
      confidence: r.confidence ?? null,
      createdAt: r.createdAt,
    })),
    entryRelations: entryRels.map((r) => ({
      id: r.id as string,
      userId: r.userId,
      sourceEntryId: r.sourceEntryId,
      targetEntryId: r.targetEntryId,
      relationType: r.relationType,
      direction: r.direction,
      source: r.source,
      confidence: r.confidence ?? null,
      reason: r.reason ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    userId,
  })
}

export async function backfillStructureData(userId: string): Promise<{
  tagRelationsCreated: number
  collectionsCreated: number
}> {
  const [entries, tags, existingTagRels, existingCollections] = await Promise.all([
    entriesTable.where('userId').equals(userId).toArray(),
    tagsTable.where('userId').equals(userId).toArray(),
    entryTagRelationsTable.where('userId').equals(userId).toArray(),
    collectionsTable.where('userId').equals(userId).toArray(),
  ])

  const now = new Date()

  const newTagRels = backfillEntryTagRelations({
    entries,
    tags,
    existingRelations: existingTagRels.map((r) => ({
      id: r.id as string,
      userId: r.userId,
      entryId: r.entryId,
      tagId: r.tagId,
      source: r.source,
      confidence: r.confidence ?? null,
      createdAt: r.createdAt,
    })),
    userId,
    makeId: makeEntryTagRelationId,
    now,
  })

  for (const rel of newTagRels) {
    await entryTagRelationsTable.put(rel)
  }

  const newCollections = backfillProjectCollections({
    entries,
    existingCollections: existingCollections.map((c) => ({
      id: c.id as string,
      userId: c.userId,
      name: c.name,
      description: c.description ?? null,
      icon: c.icon ?? null,
      color: c.color ?? null,
      parentId: c.parentId ?? null,
      sortOrder: c.sortOrder ?? 0,
      collectionType: c.collectionType,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    userId,
    makeCollectionId,
    now,
  })

  for (const col of newCollections) {
    await collectionsTable.put(col)
  }

  return {
    tagRelationsCreated: newTagRels.length,
    collectionsCreated: newCollections.length,
  }
}

export async function listDocuments(userId: string): Promise<PersistedDocument[]> {
  return listArchivedEntries(userId)
}

export async function listDocumentsByType(userId: string, type: string): Promise<PersistedDocument[]> {
  return listArchivedEntriesByType(userId, type)
}

export async function listDocumentsByTag(userId: string, tag: string): Promise<PersistedDocument[]> {
  return listArchivedEntriesByTag(userId, tag)
}

export async function listDocumentsByProject(userId: string, project: string): Promise<PersistedDocument[]> {
  return listArchivedEntriesByProject(userId, project)
}

export async function getDocumentByCaptureId(userId: string, captureId: number): Promise<PersistedDocument | null> {
  return getEntryByDockItemId(userId, captureId)
}

export async function updateDocument(
  userId: string,
  documentId: number,
  updates: DocumentUpdateInput,
): Promise<PersistedDocument | null> {
  return updateArchivedEntry(userId, documentId, updates)
}

function toPersistedMindNode(node: MindNodeRecord | undefined): PersistedMindNode | null {
  if (!node || !node.id) return null
  return {
    ...node,
    id: node.id,
    documentId: node.documentId ?? null,
    degreeScore: node.degreeScore ?? 0,
    recentActivityScore: node.recentActivityScore ?? 0,
    documentWeightScore: node.documentWeightScore ?? 0,
    userPinScore: node.userPinScore ?? 0,
    clusterCenterScore: node.clusterCenterScore ?? 0,
    positionX: node.positionX ?? null,
    positionY: node.positionY ?? null,
    metadata: node.metadata ?? null,
  }
}

function toPersistedMindEdge(edge: MindEdgeRecord | undefined): PersistedMindEdge | null {
  if (!edge || !edge.id) return null
  return {
    ...edge,
    id: edge.id,
    confidence: edge.confidence ?? null,
    reason: edge.reason ?? null,
  }
}

export async function listMindNodes(userId: string): Promise<PersistedMindNode[]> {
  const nodes = await mindNodesTable.where('userId').equals(userId).toArray()
  return nodes.flatMap((n) => { const p = toPersistedMindNode(n); return p ? [p] : [] })
}

export async function listMindNodesByType(userId: string, nodeType: MindNodeType): Promise<PersistedMindNode[]> {
  const nodes = await mindNodesTable.where('userId').equals(userId).and((n) => n.nodeType === nodeType).toArray()
  return nodes.flatMap((n) => { const p = toPersistedMindNode(n); return p ? [p] : [] })
}

export async function getMindNode(userId: string, id: string): Promise<PersistedMindNode | null> {
  const node = await mindNodesTable.get(id)
  if (!node || node.userId !== userId) return null
  return toPersistedMindNode(node)
}

export async function upsertMindNode(input: {
  userId: string
  nodeType: MindNodeType
  label: string
  state?: MindNodeState
  documentId?: number | null
  degreeScore?: number
  recentActivityScore?: number
  documentWeightScore?: number
  userPinScore?: number
  clusterCenterScore?: number
  positionX?: number | null
  positionY?: number | null
  metadata?: Record<string, unknown> | null
}): Promise<PersistedMindNode> {
  const now = new Date()
  const id = makeMindNodeId(input.userId, input.nodeType, input.label)
  const existing = await mindNodesTable.get(id)

  const record: MindNodeRecord = {
    id,
    userId: input.userId,
    nodeType: input.nodeType,
    label: input.label,
    state: input.state ?? existing?.state ?? 'drifting',
    documentId: input.documentId ?? existing?.documentId ?? null,
    degreeScore: input.degreeScore ?? existing?.degreeScore ?? 0,
    recentActivityScore: input.recentActivityScore ?? existing?.recentActivityScore ?? 0,
    documentWeightScore: input.documentWeightScore ?? existing?.documentWeightScore ?? 0,
    userPinScore: input.userPinScore ?? existing?.userPinScore ?? 0,
    clusterCenterScore: input.clusterCenterScore ?? existing?.clusterCenterScore ?? 0,
    positionX: input.positionX ?? existing?.positionX ?? null,
    positionY: input.positionY ?? existing?.positionY ?? null,
    metadata: input.metadata ?? existing?.metadata ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  await mindNodesTable.put(record)
  return toPersistedMindNode(await mindNodesTable.get(id)) as PersistedMindNode
}

export async function deleteMindNode(userId: string, id: string): Promise<boolean> {
  const existing = await mindNodesTable.get(id)
  if (!existing || existing.userId !== userId) return false
  await mindNodesTable.delete(id)
  return true
}

export async function listMindEdges(userId: string): Promise<PersistedMindEdge[]> {
  const edges = await mindEdgesTable.where('userId').equals(userId).toArray()
  return edges.flatMap((e) => { const p = toPersistedMindEdge(e); return p ? [p] : [] })
}

export async function listMindEdgesBySourceNode(userId: string, sourceNodeId: string): Promise<PersistedMindEdge[]> {
  const edges = await mindEdgesTable.where('userId').equals(userId).and((e) => e.sourceNodeId === sourceNodeId).toArray()
  return edges.flatMap((e) => { const p = toPersistedMindEdge(e); return p ? [p] : [] })
}

export async function listMindEdgesByTargetNode(userId: string, targetNodeId: string): Promise<PersistedMindEdge[]> {
  const edges = await mindEdgesTable.where('userId').equals(userId).and((e) => e.targetNodeId === targetNodeId).toArray()
  return edges.flatMap((e) => { const p = toPersistedMindEdge(e); return p ? [p] : [] })
}

export async function getMindEdge(userId: string, id: string): Promise<PersistedMindEdge | null> {
  const edge = await mindEdgesTable.get(id)
  if (!edge || edge.userId !== userId) return null
  return toPersistedMindEdge(edge)
}

export async function upsertMindEdge(input: {
  userId: string
  sourceNodeId: string
  targetNodeId: string
  edgeType: MindEdgeType
  strength?: number
  source?: 'user' | 'system' | 'import'
  confidence?: number | null
  reason?: string | null
}): Promise<PersistedMindEdge> {
  const now = new Date()
  const id = makeMindEdgeId(input.userId, input.sourceNodeId, input.targetNodeId, input.edgeType)
  const existing = await mindEdgesTable.get(id)

  const record: MindEdgeRecord = {
    id,
    userId: input.userId,
    sourceNodeId: input.sourceNodeId,
    targetNodeId: input.targetNodeId,
    edgeType: input.edgeType,
    strength: input.strength ?? existing?.strength ?? 0.5,
    source: input.source ?? existing?.source ?? 'system',
    confidence: input.confidence ?? existing?.confidence ?? null,
    reason: input.reason ?? existing?.reason ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  await mindEdgesTable.put(record)
  return toPersistedMindEdge(await mindEdgesTable.get(id)) as PersistedMindEdge
}

export async function deleteMindEdge(userId: string, id: string): Promise<boolean> {
  const existing = await mindEdgesTable.get(id)
  if (!existing || existing.userId !== userId) return false
  await mindEdgesTable.delete(id)
  return true
}

function toPersistedWorkspaceSession(record: WorkspaceSessionRecord | undefined): PersistedWorkspaceSession | null {
  if (!record || !record.id) return null
  return { ...record, id: record.id }
}

function toPersistedWorkspaceOpenTab(record: WorkspaceOpenTabRecord | undefined): PersistedWorkspaceOpenTab | null {
  if (!record || !record.id) return null
  return { ...record, id: record.id }
}

function toPersistedRecentDocument(record: RecentDocumentRecord | undefined): PersistedRecentDocument | null {
  if (!record || !record.id) return null
  return { ...record, id: record.id }
}

export async function getWorkspaceSession(userId: string): Promise<PersistedWorkspaceSession> {
  const id = makeWorkspaceSessionId(userId)
  let session = await workspaceSessionsTable.get(id)
  if (!session || session.userId !== userId) {
    const now = new Date()
    const record: WorkspaceSessionRecord = {
      id,
      userId,
      activeTabId: null,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    }
    await workspaceSessionsTable.put(record)
    session = record
  }
  return toPersistedWorkspaceSession(session) as PersistedWorkspaceSession
}

export async function openWorkspaceTab(input: {
  userId: string
  tabType: TabType
  title: string
  path: string
  documentId?: number | null
}): Promise<PersistedWorkspaceOpenTab> {
  const session = await getWorkspaceSession(input.userId)
  const now = new Date()

  if (input.tabType === 'editor' && input.documentId != null) {
    const existing = await workspaceOpenTabsTable
      .where('userId')
      .equals(input.userId)
      .and((t) => t.tabType === 'editor' && t.documentId === input.documentId)
      .first()
    if (existing) {
      return activateWorkspaceTab(input.userId, existing.id)
    }
  }

  const userTabs = await workspaceOpenTabsTable
    .where('userId')
    .equals(input.userId)
    .toArray()
  const maxSort = userTabs.reduce((max, t) => Math.max(max, t.sortOrder ?? 0), 0)

  await workspaceOpenTabsTable
    .where('userId')
    .equals(input.userId)
    .and((t) => t.isActive)
    .modify({ isActive: false, updatedAt: now })

  const tabId = makeWorkspaceTabId(input.userId, input.tabType, input.documentId)
  const record: WorkspaceOpenTabRecord = {
    id: tabId,
    userId: input.userId,
    sessionId: session.id,
    tabType: input.tabType,
    title: input.title,
    path: input.path,
    documentId: input.documentId ?? null,
    isPinned: false,
    isActive: true,
    sortOrder: maxSort + 1,
    openedAt: now,
    updatedAt: now,
  }
  await workspaceOpenTabsTable.put(record)

  await workspaceSessionsTable.update(session.id, {
    activeTabId: tabId,
    lastActivityAt: now,
    updatedAt: now,
  })

  return toPersistedWorkspaceOpenTab(await workspaceOpenTabsTable.get(tabId)) as PersistedWorkspaceOpenTab
}

export async function closeWorkspaceTab(userId: string, tabId: string): Promise<boolean> {
  const tab = await workspaceOpenTabsTable.get(tabId)
  if (!tab || tab.userId !== userId) return false

  await workspaceOpenTabsTable.delete(tabId)

  if (tab.isActive) {
    const remaining = await workspaceOpenTabsTable
      .where('userId')
      .equals(userId)
      .sortBy('sortOrder')
    const newActive = remaining[remaining.length - 1]
    if (newActive) {
      await workspaceOpenTabsTable.update(newActive.id, { isActive: true, updatedAt: new Date() })
      await workspaceSessionsTable.update(makeWorkspaceSessionId(userId), {
        activeTabId: newActive.id,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
    } else {
      await workspaceSessionsTable.update(makeWorkspaceSessionId(userId), {
        activeTabId: null,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  return true
}

export async function activateWorkspaceTab(userId: string, tabId: string): Promise<PersistedWorkspaceOpenTab> {
  const now = new Date()
  await workspaceOpenTabsTable
    .where('userId')
    .equals(userId)
    .and((t) => t.isActive)
    .modify({ isActive: false, updatedAt: now })

  await workspaceOpenTabsTable.update(tabId, { isActive: true, updatedAt: now })

  await workspaceSessionsTable.update(makeWorkspaceSessionId(userId), {
    activeTabId: tabId,
    lastActivityAt: now,
    updatedAt: now,
  })

  const tab = await workspaceOpenTabsTable.get(tabId)
  return toPersistedWorkspaceOpenTab(tab) as PersistedWorkspaceOpenTab
}

export async function pinWorkspaceTab(userId: string, tabId: string, pinned?: boolean): Promise<PersistedWorkspaceOpenTab | null> {
  const tab = await workspaceOpenTabsTable.get(tabId)
  if (!tab || tab.userId !== userId) return null

  const newPinned = pinned ?? !tab.isPinned
  await workspaceOpenTabsTable.update(tabId, { isPinned: newPinned, updatedAt: new Date() })

  return toPersistedWorkspaceOpenTab(await workspaceOpenTabsTable.get(tabId))
}

export async function restoreWorkspaceTabs(userId: string): Promise<PersistedWorkspaceOpenTab[]> {
  const tabs = await workspaceOpenTabsTable
    .where('userId')
    .equals(userId)
    .sortBy('sortOrder')
  return tabs.flatMap((t) => { const p = toPersistedWorkspaceOpenTab(t); return p ? [p] : [] })
}

export async function listRecentDocuments(userId: string, limit: number = 20): Promise<PersistedRecentDocument[]> {
  const docs = await recentDocumentsTable
    .where('userId')
    .equals(userId)
    .reverse()
    .sortBy('lastOpenedAt')
  return docs.slice(0, limit).flatMap((d) => { const p = toPersistedRecentDocument(d); return p ? [p] : [] })
}

export async function recordRecentDocumentOpen(input: {
  userId: string
  documentId: number
  title: string
}): Promise<PersistedRecentDocument> {
  const now = new Date()
  const id = makeRecentDocumentId(input.userId, input.documentId)
  const existing = await recentDocumentsTable.get(id)

  const record: RecentDocumentRecord = {
    id,
    userId: input.userId,
    documentId: input.documentId,
    title: input.title,
    openCount: (existing?.openCount ?? 0) + 1,
    lastOpenedAt: now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  await recentDocumentsTable.put(record)
  return toPersistedRecentDocument(await recentDocumentsTable.get(id)) as PersistedRecentDocument
}

function toPersistedEditorDraft(draft: EditorDraftRecord | undefined): PersistedEditorDraft | null {
  if (!draft || typeof draft.id !== 'number') return null
  return { ...draft, id: draft.id }
}

export async function saveEditorDraft(
  userId: string,
  draftKey: number,
  title: string,
  content: string,
): Promise<PersistedEditorDraft | null> {
  const now = new Date()
  const existing = await editorDraftsTable
    .where('[userId+draftKey]')
    .equals([userId, draftKey])
    .first()

  if (existing) {
    await editorDraftsTable.update(existing.id, {
      title,
      content,
      updatedAt: now,
    })
    return toPersistedEditorDraft(await editorDraftsTable.get(existing.id))
  }

  const id = await editorDraftsTable.add({
    userId,
    draftKey,
    title,
    content,
    createdAt: now,
    updatedAt: now,
  })
  return toPersistedEditorDraft(await editorDraftsTable.get(id as number))
}

export async function loadEditorDraft(
  userId: string,
  draftKey: number,
): Promise<PersistedEditorDraft | null> {
  const draft = await editorDraftsTable
    .where('[userId+draftKey]')
    .equals([userId, draftKey])
    .first()
  return toPersistedEditorDraft(draft)
}

export async function loadAllEditorDrafts(userId: string): Promise<PersistedEditorDraft[]> {
  const drafts = await editorDraftsTable
    .where('userId')
    .equals(userId)
    .sortBy('updatedAt')
  return drafts.flatMap((d) => {
    const p = toPersistedEditorDraft(d)
    return p ? [p] : []
  })
}

export async function deleteEditorDraft(userId: string, draftKey: number): Promise<boolean> {
  const draft = await editorDraftsTable
    .where('[userId+draftKey]')
    .equals([userId, draftKey])
    .first()
  if (!draft || draft.userId !== userId) return false
  await editorDraftsTable.delete(draft.id)
  return true
}