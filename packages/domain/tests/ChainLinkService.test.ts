import { beforeEach, describe, expect, it } from 'vitest'

import type { DockItem } from '../src/ports/repository'
import {
  buildContinueEditLink,
  buildDeriveLink,
  buildProvenance,
  buildProvenanceAsync,
  buildReorganizeLink,
  getChainLinkFromDockItem,
  hasChainLink,
  isRootItem,
  resolveChainRelation,
  validateChainLinkUpdate,
  validateChainLinkWithContext,
} from '../src/services/ChainLinkService'

function makeDockItem(overrides: Partial<DockItem> = {}): DockItem {
  return {
    id: 1,
    userId: 'user1',
    rawText: 'test content',
    sourceType: 'text',
    status: 'pending',
    suggestions: [],
    userTags: [],
    selectedActions: [],
    selectedProject: null,
    sourceId: null,
    parentId: null,
    processedAt: null,
    topic: null,
    createdAt: new Date(),
    ...overrides,
  }
}

describe('ChainLinkService', () => {
  describe('resolveChainRelation', () => {
    it('returns reorganize when only sourceId is set', () => {
      const item = makeDockItem({ sourceId: 10, parentId: null })
      expect(resolveChainRelation(item)).toBe('reorganize')
    })

    it('returns continue_edit when sourceId equals parentId', () => {
      const item = makeDockItem({ sourceId: 10, parentId: 10 })
      expect(resolveChainRelation(item)).toBe('continue_edit')
    })

    it('returns derive when parentId is set and different from sourceId', () => {
      const item = makeDockItem({ sourceId: 10, parentId: 20 })
      expect(resolveChainRelation(item)).toBe('derive')
    })

    it('returns reorganize when no chain links', () => {
      const item = makeDockItem({ sourceId: null, parentId: null })
      expect(resolveChainRelation(item)).toBe('reorganize')
    })

    it('returns derive when only parentId is set', () => {
      const item = makeDockItem({ sourceId: null, parentId: 20 })
      expect(resolveChainRelation(item)).toBe('derive')
    })
  })

  describe('buildChainLink helpers', () => {
    it('buildReorganizeLink sets sourceId only', () => {
      const link = buildReorganizeLink(5, 10)
      expect(link).toEqual({ itemId: 5, sourceId: 10, parentId: null })
    })

    it('buildContinueEditLink sets sourceId = parentId', () => {
      const link = buildContinueEditLink(5, 10)
      expect(link).toEqual({ itemId: 5, sourceId: 10, parentId: 10 })
    })

    it('buildDeriveLink sets parentId and optional sourceId', () => {
      const link1 = buildDeriveLink(5, 20)
      expect(link1).toEqual({ itemId: 5, sourceId: null, parentId: 20 })

      const link2 = buildDeriveLink(5, 20, 10)
      expect(link2).toEqual({ itemId: 5, sourceId: 10, parentId: 20 })
    })
  })

  describe('isRootItem / hasChainLink', () => {
    it('isRootItem returns true when no links', () => {
      expect(isRootItem(makeDockItem())).toBe(true)
    })

    it('isRootItem returns false when sourceId is set', () => {
      expect(isRootItem(makeDockItem({ sourceId: 10 }))).toBe(false)
    })

    it('hasChainLink returns false when no links', () => {
      expect(hasChainLink(makeDockItem())).toBe(false)
    })

    it('hasChainLink returns true when sourceId is set', () => {
      expect(hasChainLink(makeDockItem({ sourceId: 10 }))).toBe(true)
    })

    it('hasChainLink returns true when parentId is set', () => {
      expect(hasChainLink(makeDockItem({ parentId: 10 }))).toBe(true)
    })
  })

  describe('getChainLinkFromDockItem', () => {
    it('extracts chain link from dock item', () => {
      const item = makeDockItem({ sourceId: 10, parentId: 20 })
      const link = getChainLinkFromDockItem(item)
      expect(link).toEqual({ itemId: 1, sourceId: 10, parentId: 20 })
    })
  })

  describe('buildProvenance', () => {
    it('builds provenance with source and parent titles', () => {
      const source = makeDockItem({ id: 10, rawText: 'Source title\nMore content' })
      const parent = makeDockItem({ id: 20, rawText: 'Parent title\nMore content' })
      const item = makeDockItem({ id: 1, sourceId: 10, parentId: 20 })

      const provenance = buildProvenance(item, (id) => {
        if (id === 10) return source
        if (id === 20) return parent
        return null
      })

      expect(provenance.itemId).toBe(1)
      expect(provenance.sourceId).toBe(10)
      expect(provenance.parentId).toBe(20)
      expect(provenance.relationType).toBe('derive')
      expect(provenance.sourceTitle).toBe('Source title')
      expect(provenance.parentTitle).toBe('Parent title')
    })

    it('handles missing source/parent gracefully', () => {
      const item = makeDockItem({ sourceId: 99, parentId: 100 })
      const provenance = buildProvenance(item, () => null)

      expect(provenance.sourceTitle).toBeNull()
      expect(provenance.parentTitle).toBeNull()
    })

    it('truncates long titles', () => {
      const source = makeDockItem({ id: 10, rawText: 'a'.repeat(100) })
      const item = makeDockItem({ sourceId: 10, parentId: null })
      const provenance = buildProvenance(item, (id) => id === 10 ? source : null)

      expect(provenance.sourceTitle?.length).toBeLessThanOrEqual(60)
    })
  })

  describe('buildProvenanceAsync', () => {
    it('builds provenance with async source and parent lookups', async () => {
      const source = makeDockItem({ id: 10, rawText: 'Source title\nMore content' })
      const parent = makeDockItem({ id: 20, rawText: 'Parent title\nMore content' })
      const item = makeDockItem({ id: 1, sourceId: 10, parentId: 20 })

      const findItemById = async (id: number) => {
        if (id === 10) return source
        if (id === 20) return parent
        return null
      }

      const provenance = await buildProvenanceAsync(item, findItemById)

      expect(provenance.itemId).toBe(1)
      expect(provenance.sourceId).toBe(10)
      expect(provenance.parentId).toBe(20)
      expect(provenance.relationType).toBe('derive')
      expect(provenance.sourceTitle).toBe('Source title')
      expect(provenance.parentTitle).toBe('Parent title')
    })

    it('handles missing source/parent gracefully', async () => {
      const item = makeDockItem({ sourceId: 99, parentId: 100 })
      const provenance = await buildProvenanceAsync(item, async () => null)

      expect(provenance.sourceTitle).toBeNull()
      expect(provenance.parentTitle).toBeNull()
    })

    it('returns correct relationType for reorganize', async () => {
      const source = makeDockItem({ id: 10, rawText: 'Source' })
      const item = makeDockItem({ id: 1, sourceId: 10, parentId: null })

      const provenance = await buildProvenanceAsync(item, async (id) => id === 10 ? source : null)
      expect(provenance.relationType).toBe('reorganize')
    })

    it('returns correct relationType for continue_edit', async () => {
      const source = makeDockItem({ id: 10, rawText: 'Source' })
      const item = makeDockItem({ id: 1, sourceId: 10, parentId: 10 })

      const provenance = await buildProvenanceAsync(item, async (id) => id === 10 ? source : null)
      expect(provenance.relationType).toBe('continue_edit')
    })

    it('truncates long titles from async lookup', async () => {
      const source = makeDockItem({ id: 10, rawText: 'a'.repeat(100) })
      const item = makeDockItem({ sourceId: 10, parentId: null })
      const provenance = await buildProvenanceAsync(item, async (id) => id === 10 ? source : null)

      expect(provenance.sourceTitle?.length).toBeLessThanOrEqual(60)
    })

    it('handles root item with no chain links', async () => {
      const item = makeDockItem({ sourceId: null, parentId: null })
      const provenance = await buildProvenanceAsync(item, async () => null)

      expect(provenance.sourceId).toBeNull()
      expect(provenance.parentId).toBeNull()
      expect(provenance.sourceTitle).toBeNull()
      expect(provenance.parentTitle).toBeNull()
      expect(provenance.relationType).toBe('reorganize')
    })
  })

  describe('validateChainLinkUpdate', () => {
    it('rejects self-referencing sourceId', () => {
      const item = makeDockItem({ id: 1 })
      const result = validateChainLinkUpdate(item, { sourceId: 1, parentId: null })
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('sourceId')
    })

    it('rejects self-referencing parentId', () => {
      const item = makeDockItem({ id: 1 })
      const result = validateChainLinkUpdate(item, { sourceId: null, parentId: 1 })
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('parentId')
    })

    it('accepts valid chain link update', () => {
      const item = makeDockItem({ id: 1 })
      const result = validateChainLinkUpdate(item, { sourceId: 10, parentId: null })
      expect(result.valid).toBe(true)
    })

    it('accepts sourceId equals parentId (continue_edit)', () => {
      const item = makeDockItem({ id: 1 })
      const result = validateChainLinkUpdate(item, { sourceId: 10, parentId: 10 })
      expect(result.valid).toBe(true)
    })
  })

  describe('validateChainLinkWithContext', () => {
    const userItems = new Map<string, DockItem>()
    const findItemById = async (userId: string, id: number): Promise<DockItem | null> => {
      const item = userItems.get(`${userId}:${id}`)
      return item ?? null
    }

    beforeEach(() => {
      userItems.clear()
      userItems.set('user1:10', makeDockItem({ id: 10, userId: 'user1' }))
      userItems.set('user1:20', makeDockItem({ id: 20, userId: 'user1' }))
      userItems.set('user2:30', makeDockItem({ id: 30, userId: 'user2' }))
    })

    it('rejects self-referencing sourceId', async () => {
      const result = await validateChainLinkWithContext({
        currentItemId: 1,
        userId: 'user1',
        sourceId: 1,
        parentId: null,
        findItemById,
      })
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('self')
    })

    it('rejects self-referencing parentId', async () => {
      const result = await validateChainLinkWithContext({
        currentItemId: 1,
        userId: 'user1',
        sourceId: null,
        parentId: 1,
        findItemById,
      })
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('self')
    })

    it('rejects sourceId belonging to different user', async () => {
      const result = await validateChainLinkWithContext({
        currentItemId: 1,
        userId: 'user1',
        sourceId: 30,
        parentId: null,
        findItemById,
      })
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('sourceId')
    })

    it('rejects parentId belonging to different user', async () => {
      const result = await validateChainLinkWithContext({
        currentItemId: 1,
        userId: 'user1',
        sourceId: null,
        parentId: 30,
        findItemById,
      })
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('parentId')
    })

    it('rejects sourceId that does not exist', async () => {
      const result = await validateChainLinkWithContext({
        currentItemId: 1,
        userId: 'user1',
        sourceId: 999,
        parentId: null,
        findItemById,
      })
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('sourceId')
    })

    it('rejects parentId that does not exist', async () => {
      const result = await validateChainLinkWithContext({
        currentItemId: 1,
        userId: 'user1',
        sourceId: null,
        parentId: 999,
        findItemById,
      })
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('parentId')
    })

    it('accepts null sourceId and parentId', async () => {
      const result = await validateChainLinkWithContext({
        currentItemId: 1,
        userId: 'user1',
        sourceId: null,
        parentId: null,
        findItemById,
      })
      expect(result.valid).toBe(true)
    })

    it('accepts valid same-user sourceId', async () => {
      const result = await validateChainLinkWithContext({
        currentItemId: 1,
        userId: 'user1',
        sourceId: 10,
        parentId: null,
        findItemById,
      })
      expect(result.valid).toBe(true)
    })

    it('accepts valid same-user sourceId and parentId', async () => {
      const result = await validateChainLinkWithContext({
        currentItemId: 1,
        userId: 'user1',
        sourceId: 10,
        parentId: 20,
        findItemById,
      })
      expect(result.valid).toBe(true)
    })

    it('skips self-reference check when currentItemId is -1 (create scenario)', async () => {
      const result = await validateChainLinkWithContext({
        currentItemId: -1,
        userId: 'user1',
        sourceId: 10,
        parentId: 20,
        findItemById,
      })
      expect(result.valid).toBe(true)
    })

    it('create scenario still rejects nonexistent sourceId', async () => {
      const result = await validateChainLinkWithContext({
        currentItemId: -1,
        userId: 'user1',
        sourceId: 999,
        parentId: null,
        findItemById,
      })
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('sourceId')
    })

    it('create scenario still rejects cross-user parentId', async () => {
      const result = await validateChainLinkWithContext({
        currentItemId: -1,
        userId: 'user1',
        sourceId: null,
        parentId: 30,
        findItemById,
      })
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('parentId')
    })
  })
})
