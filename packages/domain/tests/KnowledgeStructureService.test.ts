import { describe, expect, it } from 'vitest'

import {
  buildStructureProjection,
  validateEntryRelationInput,
  backfillEntryTagRelations,
  backfillProjectCollections,
} from '../src/services/KnowledgeStructureService'

import {
  computeTemporalKeys,
  makeCollectionId,
  makeEntryTagRelationId,
} from '../src/services/KnowledgeStructure'

import type {
  Collection,
  EntryTagRelation,
} from '../src/services/KnowledgeStructure'

const USER_A = 'user_ks_a'
const USER_B = 'user_ks_b'

describe('computeTemporalKeys', () => {
  it('computes dayKey, weekKey, monthKey from a date', () => {
    const date = new Date('2026-04-25T10:00:00Z')
    const keys = computeTemporalKeys(date)
    expect(keys.dayKey).toBe('2026-04-25')
    expect(keys.monthKey).toBe('2026-04')
    expect(keys.weekKey).toMatch(/^2026-W\d{2}$/)
  })

  it('produces stable keys for the same date', () => {
    const date = new Date('2026-06-15T14:30:00Z')
    const keys1 = computeTemporalKeys(date)
    const keys2 = computeTemporalKeys(date)
    expect(keys1.dayKey).toBe(keys2.dayKey)
    expect(keys1.weekKey).toBe(keys2.weekKey)
    expect(keys1.monthKey).toBe(keys2.monthKey)
  })

  it('produces different dayKeys for different dates', () => {
    const date1 = new Date('2026-04-25T10:00:00Z')
    const date2 = new Date('2026-04-26T10:00:00Z')
    const keys1 = computeTemporalKeys(date1)
    const keys2 = computeTemporalKeys(date2)
    expect(keys1.dayKey).not.toBe(keys2.dayKey)
    expect(keys1.monthKey).toBe(keys2.monthKey)
  })

  it('produces different monthKeys for different months', () => {
    const date1 = new Date('2026-04-25T10:00:00Z')
    const date2 = new Date('2026-05-25T10:00:00Z')
    const keys1 = computeTemporalKeys(date1)
    const keys2 = computeTemporalKeys(date2)
    expect(keys1.monthKey).not.toBe(keys2.monthKey)
  })

  it('dayKey format is YYYY-MM-DD', () => {
    const date = new Date('2026-01-09T00:00:00Z')
    const keys = computeTemporalKeys(date)
    expect(keys.dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('monthKey format is YYYY-MM', () => {
    const date = new Date('2026-11-09T00:00:00Z')
    const keys = computeTemporalKeys(date)
    expect(keys.monthKey).toMatch(/^\d{4}-\d{2}$/)
  })

  it('weekKey format is YYYY-WNN', () => {
    const date = new Date('2026-06-15T00:00:00Z')
    const keys = computeTemporalKeys(date)
    expect(keys.weekKey).toMatch(/^\d{4}-W\d{2}$/)
  })
})

describe('buildStructureProjection', () => {
  it('returns root with correct totals', () => {
    const result = buildStructureProjection({
      entries: [
        { id: 1, userId: USER_A, title: 'A', type: 'note', tags: ['t1'], project: null, archivedAt: new Date() },
        { id: 2, userId: USER_A, title: 'B', type: 'task', tags: [], project: 'P1', archivedAt: new Date() },
      ],
      tags: [
        { id: 'tag1', userId: USER_A, name: 't1' },
      ],
      collections: [],
      entryTagRelations: [
        { id: 'r1', userId: USER_A, entryId: 1, tagId: 'tag1', source: 'system', confidence: 1.0, createdAt: new Date() },
      ],
      entryRelations: [
        { id: 'er1', userId: USER_A, sourceEntryId: 1, targetEntryId: 2, relationType: 'related', direction: 'undirected', source: 'user', confidence: null, reason: null, createdAt: new Date(), updatedAt: new Date() },
      ],
      userId: USER_A,
    })

    expect(result.root.userId).toBe(USER_A)
    expect(result.root.totalEntries).toBe(2)
    expect(result.root.totalTags).toBe(1)
    expect(result.root.totalCollections).toBe(0)
    expect(result.root.totalRelations).toBe(1)
  })

  it('filters by userId', () => {
    const result = buildStructureProjection({
      entries: [
        { id: 1, userId: USER_A, title: 'A', type: 'note', tags: [], project: null, archivedAt: new Date() },
        { id: 2, userId: USER_B, title: 'B', type: 'note', tags: [], project: null, archivedAt: new Date() },
      ],
      tags: [],
      collections: [],
      entryTagRelations: [],
      entryRelations: [],
      userId: USER_A,
    })

    expect(result.root.totalEntries).toBe(1)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].entryId).toBe(1)
  })

  it('identifies orphans as entries with no relations, no tags, no project', () => {
    const result = buildStructureProjection({
      entries: [
        { id: 1, userId: USER_A, title: 'Orphan', type: 'note', tags: [], project: null, archivedAt: new Date() },
        { id: 2, userId: USER_A, title: 'Connected', type: 'note', tags: ['t1'], project: null, archivedAt: new Date() },
      ],
      tags: [{ id: 'tag1', userId: USER_A, name: 't1' }],
      collections: [],
      entryTagRelations: [
        { id: 'r1', userId: USER_A, entryId: 2, tagId: 'tag1', source: 'system', confidence: 1.0, createdAt: new Date() },
      ],
      entryRelations: [],
      userId: USER_A,
    })

    expect(result.orphans).toEqual([1])
  })

  it('counts entry relations correctly', () => {
    const result = buildStructureProjection({
      entries: [
        { id: 1, userId: USER_A, title: 'A', type: 'note', tags: [], project: null, archivedAt: new Date() },
        { id: 2, userId: USER_A, title: 'B', type: 'note', tags: [], project: null, archivedAt: new Date() },
      ],
      tags: [],
      collections: [],
      entryTagRelations: [],
      entryRelations: [
        { id: 'er1', userId: USER_A, sourceEntryId: 1, targetEntryId: 2, relationType: 'related', direction: 'undirected', source: 'user', confidence: null, reason: null, createdAt: new Date(), updatedAt: new Date() },
      ],
      userId: USER_A,
    })

    const entryA = result.entries.find((e) => e.entryId === 1)
    const entryB = result.entries.find((e) => e.entryId === 2)
    expect(entryA?.relationCount).toBe(1)
    expect(entryB?.relationCount).toBe(1)
  })

  it('maps relation edges correctly', () => {
    const result = buildStructureProjection({
      entries: [
        { id: 1, userId: USER_A, title: 'A', type: 'note', tags: [], project: null, archivedAt: new Date() },
        { id: 2, userId: USER_A, title: 'B', type: 'note', tags: [], project: null, archivedAt: new Date() },
      ],
      tags: [],
      collections: [],
      entryTagRelations: [],
      entryRelations: [
        { id: 'er1', userId: USER_A, sourceEntryId: 1, targetEntryId: 2, relationType: 'parent', direction: 'directed', source: 'user', confidence: 0.9, reason: 'test', createdAt: new Date(), updatedAt: new Date() },
      ],
      userId: USER_A,
    })

    expect(result.relations).toHaveLength(1)
    expect(result.relations[0].relationType).toBe('parent')
    expect(result.relations[0].source).toBe('user')
    expect(result.relations[0].confidence).toBe(0.9)
  })
})

describe('validateEntryRelationInput', () => {
  it('rejects self-reference', async () => {
    const result = await validateEntryRelationInput({
      userId: USER_A,
      sourceEntryId: 1,
      targetEntryId: 1,
      findEntryById: async () => ({ userId: USER_A }),
    })
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('self_reference_not_allowed')
  })

  it('rejects non-existent source entry', async () => {
    const result = await validateEntryRelationInput({
      userId: USER_A,
      sourceEntryId: 99,
      targetEntryId: 2,
      findEntryById: async (uid, id) => id === 99 ? null : { userId: uid },
    })
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('source_entry_not_found')
  })

  it('rejects non-existent target entry', async () => {
    const result = await validateEntryRelationInput({
      userId: USER_A,
      sourceEntryId: 1,
      targetEntryId: 99,
      findEntryById: async (uid, id) => id === 99 ? null : { userId: uid },
    })
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('target_entry_not_found')
  })

  it('rejects cross-user source entry', async () => {
    const result = await validateEntryRelationInput({
      userId: USER_A,
      sourceEntryId: 1,
      targetEntryId: 2,
      findEntryById: async (uid, id) => id === 1 ? { userId: USER_B } : { userId: uid },
    })
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('source_entry_cross_user')
  })

  it('rejects cross-user target entry', async () => {
    const result = await validateEntryRelationInput({
      userId: USER_A,
      sourceEntryId: 1,
      targetEntryId: 2,
      findEntryById: async (uid, id) => id === 2 ? { userId: USER_B } : { userId: uid },
    })
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('target_entry_cross_user')
  })

  it('accepts valid input', async () => {
    const result = await validateEntryRelationInput({
      userId: USER_A,
      sourceEntryId: 1,
      targetEntryId: 2,
      findEntryById: async (uid) => ({ userId: uid }),
    })
    expect(result.valid).toBe(true)
  })
})

describe('backfillEntryTagRelations', () => {
  it('creates relations from entry tags', () => {
    const now = new Date()
    const result = backfillEntryTagRelations({
      entries: [
        { id: 1, userId: USER_A, tags: ['技术', '产品'] },
        { id: 2, userId: USER_A, tags: ['技术'] },
      ],
      tags: [
        { id: 'tag_tech', userId: USER_A, name: '技术' },
        { id: 'tag_prod', userId: USER_A, name: '产品' },
      ],
      existingRelations: [],
      userId: USER_A,
      makeId: makeEntryTagRelationId,
      now,
    })

    expect(result).toHaveLength(3)
    expect(result.every((r) => r.source === 'system')).toBe(true)
    expect(result.every((r) => r.confidence === 1.0)).toBe(true)
  })

  it('skips already existing relations', () => {
    const now = new Date()
    const existing: EntryTagRelation[] = [
      { id: 'existing', userId: USER_A, entryId: 1, tagId: 'tag_tech', source: 'user', confidence: 0.8, createdAt: now },
    ]

    const result = backfillEntryTagRelations({
      entries: [{ id: 1, userId: USER_A, tags: ['技术'] }],
      tags: [{ id: 'tag_tech', userId: USER_A, name: '技术' }],
      existingRelations: existing,
      userId: USER_A,
      makeId: makeEntryTagRelationId,
      now,
    })

    expect(result).toHaveLength(0)
  })

  it('filters by userId', () => {
    const now = new Date()
    const result = backfillEntryTagRelations({
      entries: [
        { id: 1, userId: USER_A, tags: ['技术'] },
        { id: 2, userId: USER_B, tags: ['技术'] },
      ],
      tags: [{ id: 'tag_tech', userId: USER_A, name: '技术' }],
      existingRelations: [],
      userId: USER_A,
      makeId: makeEntryTagRelationId,
      now,
    })

    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe(USER_A)
  })

  it('skips tags without matching tag record', () => {
    const now = new Date()
    const result = backfillEntryTagRelations({
      entries: [{ id: 1, userId: USER_A, tags: ['不存在'] }],
      tags: [{ id: 'tag_tech', userId: USER_A, name: '技术' }],
      existingRelations: [],
      userId: USER_A,
      makeId: makeEntryTagRelationId,
      now,
    })

    expect(result).toHaveLength(0)
  })
})

describe('backfillProjectCollections', () => {
  it('creates collections from entry projects', () => {
    const now = new Date()
    const result = backfillProjectCollections({
      entries: [
        { id: 1, userId: USER_A, project: 'MindDock' },
        { id: 2, userId: USER_A, project: 'MindDock' },
        { id: 3, userId: USER_A, project: 'Editor' },
      ],
      existingCollections: [],
      userId: USER_A,
      makeCollectionId,
      now,
    })

    expect(result).toHaveLength(2)
    expect(result.every((c) => c.collectionType === 'project')).toBe(true)
    const names = result.map((c) => c.name)
    expect(names).toContain('MindDock')
    expect(names).toContain('Editor')
  })

  it('skips already existing collections', () => {
    const now = new Date()
    const existing: Collection[] = [
      {
        id: makeCollectionId(USER_A, 'MindDock'),
        userId: USER_A,
        name: 'MindDock',
        description: null,
        icon: null,
        color: null,
        parentId: null,
        sortOrder: 0,
        collectionType: 'project',
        createdAt: now,
        updatedAt: now,
      },
    ]

    const result = backfillProjectCollections({
      entries: [{ id: 1, userId: USER_A, project: 'MindDock' }],
      existingCollections: existing,
      userId: USER_A,
      makeCollectionId,
      now,
    })

    expect(result).toHaveLength(0)
  })

  it('skips null or empty projects', () => {
    const now = new Date()
    const result = backfillProjectCollections({
      entries: [
        { id: 1, userId: USER_A, project: null },
        { id: 2, userId: USER_A, project: '' },
        { id: 3, userId: USER_A, project: '   ' },
      ],
      existingCollections: [],
      userId: USER_A,
      makeCollectionId,
      now,
    })

    expect(result).toHaveLength(0)
  })

  it('filters by userId', () => {
    const now = new Date()
    const result = backfillProjectCollections({
      entries: [
        { id: 1, userId: USER_A, project: 'MindDock' },
        { id: 2, userId: USER_B, project: 'OtherProject' },
      ],
      existingCollections: [],
      userId: USER_A,
      makeCollectionId,
      now,
    })

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('MindDock')
  })
})
