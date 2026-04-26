import { afterEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  addEntryTagRelation,
  archiveItem,
  backfillStructureData,
  createCollection,
  createDockItem,
  createEntryRelation,
  createStoredTag,
  deleteEntryRelation,
  getStructureProjection,
  listCollections,
  listEntryRelations,
  listEntryTagRelations,
  listKnowledgeEvents,
  listTemporalActivities,
  recordKnowledgeEvent,
  recordTemporalActivity,
  removeEntryTagRelation,
  suggestItem,
  updateCollection,
  updateItemTags,
  updateSelectedProject,
} from '@/lib/repository'

const USER_A = 'user_struct_a'
const USER_B = 'user_struct_b'

async function cleanAll() {
  await db.table('collections').clear()
  await db.table('entryTagRelations').clear()
  await db.table('entryRelations').clear()
  await db.table('knowledgeEvents').clear()
  await db.table('temporalActivities').clear()
  await db.table('entries').clear()
  await db.table('dockItems').clear()
  await db.table('tags').clear()
}

function unwrap<T>(value: T | null | undefined): T {
  expect(value).not.toBeNull()
  expect(value).not.toBeUndefined()
  return value as T
}

async function seedArchivedEntry(userId: string, rawText: string, tags: string[] = [], project: string | null = null) {
  const id = await createDockItem(userId, rawText)
  for (const tag of tags) {
    await createStoredTag(userId, tag)
  }
  if (tags.length > 0) {
    await updateItemTags(userId, id, tags)
  }
  if (project) {
    await updateSelectedProject(userId, id, project)
  }
  await suggestItem(userId, id)
  await archiveItem(userId, id)
  return id
}

function findEntryByDockId(entries: Array<{ sourceDockItemId: number; id: number }>, dockId: number) {
  return unwrap(entries.find((e) => e.sourceDockItemId === dockId))
}

describe('Collection repository', () => {
  afterEach(cleanAll)

  it('creates and lists collections', async () => {
    const col = await createCollection({ userId: USER_A, name: 'MindDock' })
    expect(col.name).toBe('MindDock')
    expect(col.userId).toBe(USER_A)
    expect(col.collectionType).toBe('folder')

    const list = await listCollections(USER_A)
    expect(list).toHaveLength(1)
  })

  it('creates collection with project type', async () => {
    const col = await createCollection({ userId: USER_A, name: 'Editor', collectionType: 'project' })
    expect(col.collectionType).toBe('project')
  })

  it('updates collection', async () => {
    const col = await createCollection({ userId: USER_A, name: 'Original' })
    const updated = unwrap(await updateCollection(USER_A, col.id, { name: 'Updated', description: 'desc' }))
    expect(updated.name).toBe('Updated')
    expect(updated.description).toBe('desc')
  })

  it('blocks cross-user update', async () => {
    const col = await createCollection({ userId: USER_A, name: 'Private' })
    const result = await updateCollection(USER_B, col.id, { name: 'Hacked' })
    expect(result).toBeNull()
  })

  it('isolates collections between users', async () => {
    await createCollection({ userId: USER_A, name: 'A-Col' })
    await createCollection({ userId: USER_B, name: 'B-Col' })

    const listA = await listCollections(USER_A)
    const listB = await listCollections(USER_B)
    expect(listA).toHaveLength(1)
    expect(listB).toHaveLength(1)
    expect(listA[0].name).toBe('A-Col')
    expect(listB[0].name).toBe('B-Col')
  })
})

describe('EntryTagRelation repository', () => {
  afterEach(cleanAll)

  it('adds and lists entry tag relations', async () => {
    const tag = unwrap(await createStoredTag(USER_A, '技术'))
    const dockId = await createDockItem(USER_A, 'test')
    await suggestItem(USER_A, dockId)
    await archiveItem(USER_A, dockId)

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entryId = entries[0].id

    const rel = await addEntryTagRelation({ userId: USER_A, entryId, tagId: tag.id })
    expect(rel.entryId).toBe(entryId)
    expect(rel.tagId).toBe(tag.id)
    expect(rel.source).toBe('user')

    const list = await listEntryTagRelations(USER_A)
    expect(list).toHaveLength(1)
  })

  it('removes entry tag relation', async () => {
    const tag = unwrap(await createStoredTag(USER_A, '技术'))
    const dockId = await createDockItem(USER_A, 'test')
    await suggestItem(USER_A, dockId)
    await archiveItem(USER_A, dockId)

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entryId = entries[0].id

    await addEntryTagRelation({ userId: USER_A, entryId, tagId: tag.id })
    const removed = await removeEntryTagRelation(USER_A, entryId, tag.id)
    expect(removed).toBe(true)

    const list = await listEntryTagRelations(USER_A)
    expect(list).toHaveLength(0)
  })

  it('blocks cross-user removal', async () => {
    const tag = unwrap(await createStoredTag(USER_A, '技术'))
    const dockId = await createDockItem(USER_A, 'test')
    await suggestItem(USER_A, dockId)
    await archiveItem(USER_A, dockId)

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entryId = entries[0].id

    await addEntryTagRelation({ userId: USER_A, entryId, tagId: tag.id })
    const removed = await removeEntryTagRelation(USER_B, entryId, tag.id)
    expect(removed).toBe(false)
  })

  it('isolates tag relations between users', async () => {
    const tagA = unwrap(await createStoredTag(USER_A, '技术'))
    const tagB = unwrap(await createStoredTag(USER_B, '技术'))
    const dockA = await createDockItem(USER_A, 'test')
    const dockB = await createDockItem(USER_B, 'test')
    await suggestItem(USER_A, dockA)
    await archiveItem(USER_A, dockA)
    await suggestItem(USER_B, dockB)
    await archiveItem(USER_B, dockB)

    const entriesA = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entriesB = await db.table('entries').where('userId').equals(USER_B).toArray()

    await addEntryTagRelation({ userId: USER_A, entryId: entriesA[0].id, tagId: tagA.id })
    await addEntryTagRelation({ userId: USER_B, entryId: entriesB[0].id, tagId: tagB.id })

    const listA = await listEntryTagRelations(USER_A)
    const listB = await listEntryTagRelations(USER_B)
    expect(listA).toHaveLength(1)
    expect(listB).toHaveLength(1)
    expect(listA[0].userId).toBe(USER_A)
    expect(listB[0].userId).toBe(USER_B)
  })
})

describe('EntryRelation repository', () => {
  afterEach(cleanAll)

  it('creates and lists entry relations', async () => {
    const dock1 = await seedArchivedEntry(USER_A, 'Entry 1')
    const dock2 = await seedArchivedEntry(USER_A, 'Entry 2')

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entry1 = findEntryByDockId(entries, dock1)
    const entry2 = findEntryByDockId(entries, dock2)

    const rel = await createEntryRelation({
      userId: USER_A,
      sourceEntryId: entry1.id,
      targetEntryId: entry2.id,
      relationType: 'related',
    })
    expect(rel).not.toBeNull()
    expect(unwrap(rel).relationType).toBe('related')

    const list = await listEntryRelations(USER_A)
    expect(list).toHaveLength(1)
  })

  it('rejects self-reference', async () => {
    await seedArchivedEntry(USER_A, 'Entry 1')
    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()

    const rel = await createEntryRelation({
      userId: USER_A,
      sourceEntryId: entries[0].id,
      targetEntryId: entries[0].id,
      relationType: 'related',
    })
    expect(rel).toBeNull()
  })

  it('rejects non-existent entry', async () => {
    await seedArchivedEntry(USER_A, 'Entry 1')
    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()

    const rel = await createEntryRelation({
      userId: USER_A,
      sourceEntryId: entries[0].id,
      targetEntryId: 99999,
      relationType: 'related',
    })
    expect(rel).toBeNull()
  })

  it('rejects cross-user entry', async () => {
    await seedArchivedEntry(USER_A, 'Entry A')
    await seedArchivedEntry(USER_B, 'Entry B')

    const entriesA = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entriesB = await db.table('entries').where('userId').equals(USER_B).toArray()

    const rel = await createEntryRelation({
      userId: USER_A,
      sourceEntryId: entriesA[0].id,
      targetEntryId: entriesB[0].id,
      relationType: 'related',
    })
    expect(rel).toBeNull()
  })

  it('deletes entry relation', async () => {
    const dock1 = await seedArchivedEntry(USER_A, 'Entry 1')
    const dock2 = await seedArchivedEntry(USER_A, 'Entry 2')

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entry1 = findEntryByDockId(entries, dock1)
    const entry2 = findEntryByDockId(entries, dock2)

    const rel = unwrap(await createEntryRelation({
      userId: USER_A,
      sourceEntryId: entry1.id,
      targetEntryId: entry2.id,
      relationType: 'reference',
    }))

    const deleted = await deleteEntryRelation(USER_A, rel.id)
    expect(deleted).toBe(true)

    const list = await listEntryRelations(USER_A)
    expect(list).toHaveLength(0)
  })

  it('blocks cross-user delete', async () => {
    const dock1 = await seedArchivedEntry(USER_A, 'Entry 1')
    const dock2 = await seedArchivedEntry(USER_A, 'Entry 2')

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entry1 = findEntryByDockId(entries, dock1)
    const entry2 = findEntryByDockId(entries, dock2)

    const rel = unwrap(await createEntryRelation({
      userId: USER_A,
      sourceEntryId: entry1.id,
      targetEntryId: entry2.id,
      relationType: 'related',
    }))

    const deleted = await deleteEntryRelation(USER_B, rel.id)
    expect(deleted).toBe(false)
  })

  it('creates knowledge event on relation creation', async () => {
    const dock1 = await seedArchivedEntry(USER_A, 'Entry 1')
    const dock2 = await seedArchivedEntry(USER_A, 'Entry 2')

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entry1 = findEntryByDockId(entries, dock1)
    const entry2 = findEntryByDockId(entries, dock2)

    await createEntryRelation({
      userId: USER_A,
      sourceEntryId: entry1.id,
      targetEntryId: entry2.id,
      relationType: 'follow_up',
    })

    const events = await listKnowledgeEvents(USER_A)
    const relationEvent = unwrap(events.find((e) => e.eventType === 'relation_created'))
    expect(relationEvent.targetType).toBe('relation')
  })

  it('creates temporal activity on relation creation', async () => {
    const dock1 = await seedArchivedEntry(USER_A, 'Entry 1')
    const dock2 = await seedArchivedEntry(USER_A, 'Entry 2')

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entry1 = findEntryByDockId(entries, dock1)
    const entry2 = findEntryByDockId(entries, dock2)

    await createEntryRelation({
      userId: USER_A,
      sourceEntryId: entry1.id,
      targetEntryId: entry2.id,
      relationType: 'related',
    })

    const activities = await listTemporalActivities(USER_A)
    const relActivity = unwrap(activities.find((a) => a.type === 'relation_created'))
    expect(relActivity.entityType).toBe('relation')
    expect(relActivity.dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(relActivity.weekKey).toMatch(/^\d{4}-W\d{2}$/)
    expect(relActivity.monthKey).toMatch(/^\d{4}-\d{2}$/)
    expect(relActivity.title).toContain('related')
  })

  it('creates both KnowledgeEvent and TemporalActivity on relation creation', async () => {
    const dock1 = await seedArchivedEntry(USER_A, 'Entry 1')
    const dock2 = await seedArchivedEntry(USER_A, 'Entry 2')

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entry1 = findEntryByDockId(entries, dock1)
    const entry2 = findEntryByDockId(entries, dock2)

    await createEntryRelation({
      userId: USER_A,
      sourceEntryId: entry1.id,
      targetEntryId: entry2.id,
      relationType: 'reference',
    })

    const events = await listKnowledgeEvents(USER_A)
    const activities = await listTemporalActivities(USER_A)

    const relationEvent = events.find((e) => e.eventType === 'relation_created')
    const relActivity = activities.find((a) => a.type === 'relation_created')

    expect(relationEvent).toBeDefined()
    expect(relActivity).toBeDefined()
    expect(unwrap(relationEvent).targetId).toBe(unwrap(relActivity).entityId)
  })

  it('creates KnowledgeEvent and TemporalActivity on relation deletion', async () => {
    const dock1 = await seedArchivedEntry(USER_A, 'Entry 1')
    const dock2 = await seedArchivedEntry(USER_A, 'Entry 2')

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entry1 = findEntryByDockId(entries, dock1)
    const entry2 = findEntryByDockId(entries, dock2)

    const rel = unwrap(await createEntryRelation({
      userId: USER_A,
      sourceEntryId: entry1.id,
      targetEntryId: entry2.id,
      relationType: 'related',
    }))

    await deleteEntryRelation(USER_A, rel.id)

    const events = await listKnowledgeEvents(USER_A)
    const activities = await listTemporalActivities(USER_A)

    const deleteEvent = unwrap(events.find((e) => e.eventType === 'relation_deleted'))
    expect(deleteEvent.targetType).toBe('relation')
    expect(deleteEvent.targetId).toBe(rel.id)

    const deleteActivity = unwrap(activities.find((a) => a.type === 'relation_deleted'))
    expect(deleteActivity.entityType).toBe('relation')
    expect(deleteActivity.entityId).toBe(rel.id)
    expect(deleteActivity.title).toContain('related')
  })

  it('no events created on failed delete (cross-user)', async () => {
    const dock1 = await seedArchivedEntry(USER_A, 'Entry 1')
    const dock2 = await seedArchivedEntry(USER_A, 'Entry 2')

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entry1 = findEntryByDockId(entries, dock1)
    const entry2 = findEntryByDockId(entries, dock2)

    const rel = unwrap(await createEntryRelation({
      userId: USER_A,
      sourceEntryId: entry1.id,
      targetEntryId: entry2.id,
      relationType: 'related',
    }))

    const eventsBefore = await listKnowledgeEvents(USER_B)
    const activitiesBefore = await listTemporalActivities(USER_B)

    await deleteEntryRelation(USER_B, rel.id)

    const eventsAfter = await listKnowledgeEvents(USER_B)
    const activitiesAfter = await listTemporalActivities(USER_B)

    expect(eventsAfter).toHaveLength(eventsBefore.length)
    expect(activitiesAfter).toHaveLength(activitiesBefore.length)
  })
})

describe('KnowledgeEvent repository', () => {
  afterEach(cleanAll)

  it('records and lists knowledge events', async () => {
    const evt = await recordKnowledgeEvent({
      userId: USER_A,
      eventType: 'world_tree_opened',
      targetType: 'view',
    })
    expect(evt.eventType).toBe('world_tree_opened')
    expect(evt.userId).toBe(USER_A)

    const list = await listKnowledgeEvents(USER_A)
    expect(list).toHaveLength(1)
  })

  it('isolates events between users', async () => {
    await recordKnowledgeEvent({ userId: USER_A, eventType: 'world_tree_opened', targetType: 'view' })
    await recordKnowledgeEvent({ userId: USER_B, eventType: 'world_tree_opened', targetType: 'view' })

    const listA = await listKnowledgeEvents(USER_A)
    const listB = await listKnowledgeEvents(USER_B)
    expect(listA).toHaveLength(1)
    expect(listB).toHaveLength(1)
  })

  it('records event with metadata', async () => {
    const evt = await recordKnowledgeEvent({
      userId: USER_A,
      eventType: 'tag_applied',
      targetType: 'tag',
      targetId: 'tag_1',
      metadata: { tagName: '技术' },
    })
    expect(evt.targetId).toBe('tag_1')
    expect(evt.metadata).toEqual({ tagName: '技术' })
  })
})

describe('TemporalActivity repository', () => {
  afterEach(cleanAll)

  it('records and lists temporal activities', async () => {
    const act = await recordTemporalActivity({
      userId: USER_A,
      type: 'entry_archived',
      entityType: 'entry',
      entityId: '1',
      title: 'Archived entry',
      tagIds: ['tag1'],
      projectIds: [],
    })
    expect(act.type).toBe('entry_archived')
    expect(act.userId).toBe(USER_A)
    expect(act.dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    const list = await listTemporalActivities(USER_A)
    expect(list).toHaveLength(1)
  })

  it('creates knowledge event on temporal activity creation', async () => {
    await recordTemporalActivity({
      userId: USER_A,
      type: 'entry_archived',
      entityType: 'entry',
      entityId: '42',
      title: 'Test',
    })

    const events = await listKnowledgeEvents(USER_A)
    const taEvent = unwrap(events.find((e) => e.eventType === 'temporal_activity_created'))
    expect(taEvent.metadata).toBeDefined()
  })

  it('isolates activities between users', async () => {
    await recordTemporalActivity({ userId: USER_A, type: 'entry_archived', entityType: 'entry', entityId: '1', title: 'A' })
    await recordTemporalActivity({ userId: USER_B, type: 'entry_archived', entityType: 'entry', entityId: '2', title: 'B' })

    const listA = await listTemporalActivities(USER_A)
    const listB = await listTemporalActivities(USER_B)
    expect(listA).toHaveLength(1)
    expect(listB).toHaveLength(1)
  })
})

describe('Structure projection', () => {
  afterEach(cleanAll)

  it('returns structure projection with entries and relations', async () => {
    const dock1 = await seedArchivedEntry(USER_A, 'Entry 1', ['技术'], 'MindDock')
    const dock2 = await seedArchivedEntry(USER_A, 'Entry 2', ['产品'])

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    const entry1 = findEntryByDockId(entries, dock1)
    const entry2 = findEntryByDockId(entries, dock2)

    await createEntryRelation({
      userId: USER_A,
      sourceEntryId: entry1.id,
      targetEntryId: entry2.id,
      relationType: 'related',
    })

    const projection = await getStructureProjection(USER_A)
    expect(projection.root.totalEntries).toBe(2)
    expect(projection.root.totalRelations).toBe(1)
    expect(projection.entries).toHaveLength(2)
    expect(projection.relations).toHaveLength(1)
  })

  it('isolates projection between users', async () => {
    await seedArchivedEntry(USER_A, 'User A Entry')
    await seedArchivedEntry(USER_B, 'User B Entry')

    const projectionA = await getStructureProjection(USER_A)
    const projectionB = await getStructureProjection(USER_B)
    expect(projectionA.root.totalEntries).toBe(1)
    expect(projectionB.root.totalEntries).toBe(1)
  })
})

describe('Backfill structure data', () => {
  afterEach(cleanAll)

  it('backfills entry tag relations from existing entries', async () => {
    await seedArchivedEntry(USER_A, '技术笔记', ['技术', '产品'])

    const result = await backfillStructureData(USER_A)
    expect(result.tagRelationsCreated).toBeGreaterThan(0)

    const tagRels = await listEntryTagRelations(USER_A)
    expect(tagRels.length).toBeGreaterThan(0)
    expect(tagRels.every((r) => r.source === 'system')).toBe(true)
  })

  it('backfills project collections from existing entries', async () => {
    await seedArchivedEntry(USER_A, '项目笔记', [], 'MindDock')

    const result = await backfillStructureData(USER_A)
    expect(result.collectionsCreated).toBeGreaterThan(0)

    const collections = await listCollections(USER_A)
    const projectCol = unwrap(collections.find((c) => c.name === 'MindDock'))
    expect(projectCol.collectionType).toBe('project')
  })

  it('does not duplicate on repeated backfill', async () => {
    await seedArchivedEntry(USER_A, '技术笔记', ['技术'], 'MindDock')

    await backfillStructureData(USER_A)
    const result = await backfillStructureData(USER_A)

    expect(result.tagRelationsCreated).toBe(0)
    expect(result.collectionsCreated).toBe(0)
  })

  it('does not modify original entry data', async () => {
    await seedArchivedEntry(USER_A, '技术笔记', ['技术'], 'MindDock')

    await backfillStructureData(USER_A)

    const entries = await db.table('entries').where('userId').equals(USER_A).toArray()
    expect(entries[0].tags).toContain('技术')
    expect(entries[0].project).toBe('MindDock')
  })

  it('isolates backfill between users', async () => {
    await seedArchivedEntry(USER_A, 'A 技术', ['技术'], 'MindDock')
    await seedArchivedEntry(USER_B, 'B 设计', ['设计'], 'Editor')

    await backfillStructureData(USER_A)
    await backfillStructureData(USER_B)

    const tagRelsA = await listEntryTagRelations(USER_A)
    const tagRelsB = await listEntryTagRelations(USER_B)
    expect(tagRelsA.every((r) => r.userId === USER_A)).toBe(true)
    expect(tagRelsB.every((r) => r.userId === USER_B)).toBe(true)

    const colsA = await listCollections(USER_A)
    const colsB = await listCollections(USER_B)
    expect(colsA.every((c) => c.userId === USER_A)).toBe(true)
    expect(colsB.every((c) => c.userId === USER_B)).toBe(true)
  })
})
