import { describe, expect, it } from 'vitest'

import { buildDockItemReset, applyTextUpdateToDockItem } from '../src/services/DockItemService'

describe('DockItemService', () => {
  describe('buildDockItemReset', () => {
    it('returns correct reset fields for text update', () => {
      const result = buildDockItemReset({ dockItemId: 123, newText: 'new content' })

      expect(result).toEqual({
        rawText: 'new content',
        status: 'pending',
        suggestions: [],
        processedAt: null,
      })
    })

    it('always resets to pending regardless of original status', () => {
      const result = buildDockItemReset({ dockItemId: 1, newText: 'text' })

      expect(result.status).toBe('pending')
    })

    it('always clears suggestions', () => {
      const result = buildDockItemReset({ dockItemId: 1, newText: 'text' })

      expect(result.suggestions).toEqual([])
    })

    it('always sets processedAt to null', () => {
      const result = buildDockItemReset({ dockItemId: 1, newText: 'text' })

      expect(result.processedAt).toBeNull()
    })
  })

  describe('applyTextUpdateToDockItem', () => {
    it('applies text update and reset fields to dock item', () => {
      const original = {
        id: 1,
        userId: 'user1',
        rawText: 'original',
        sourceType: 'text' as const,
        status: 'suggested' as const,
        suggestions: [{ id: 's1', type: 'tag' as const, label: 'work', confidence: 0.9 }],
        userTags: ['work'],
        processedAt: new Date(),
        createdAt: new Date(),
      }

      const result = applyTextUpdateToDockItem(original, 'updated text')

      expect(result.rawText).toBe('updated text')
      expect(result.status).toBe('pending')
      expect(result.suggestions).toEqual([])
      expect(result.processedAt).toBeNull()
      expect(result.id).toBe(1)
      expect(result.userId).toBe('user1')
      expect(result.userTags).toEqual(['work'])
    })

    it('preserves userTags during text update', () => {
      const original = {
        id: 1,
        userId: 'user1',
        rawText: 'original',
        sourceType: 'text' as const,
        status: 'suggested' as const,
        suggestions: [],
        userTags: ['important', 'review'],
        processedAt: new Date(),
        createdAt: new Date(),
      }

      const result = applyTextUpdateToDockItem(original, 'new text')

      expect(result.userTags).toEqual(['important', 'review'])
    })
  })
})
