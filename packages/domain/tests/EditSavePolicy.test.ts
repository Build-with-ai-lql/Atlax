import { describe, expect, it } from 'vitest'

import {
  applyEditSavePolicy,
  buildEditSavePatch,
  defaultEditSavePolicy,
  isLongContent,
  getEditContentType,
  getSavePathDescription,
  type EditSavePolicyInput,
  type EditSavePolicy,
} from '../src/services/EditSavePolicy'

describe('EditSavePolicy', () => {
  describe('defaultEditSavePolicy', () => {
    it('resets suggestions when text changes', () => {
      const input: EditSavePolicyInput = {
        dockItemId: 1,
        newText: 'new text',
        currentRawText: 'old text',
        currentStatus: 'suggested',
        isLongContent: false,
      }

      const result = defaultEditSavePolicy.evaluate(input)

      expect(result.shouldResetSuggestions).toBe(true)
      expect(result.shouldResetStatus).toBe(true)
      expect(result.newStatus).toBe('pending')
    })

    it('preserves status when text does not change', () => {
      const input: EditSavePolicyInput = {
        dockItemId: 1,
        newText: 'same text',
        currentRawText: 'same text',
        currentStatus: 'suggested',
        isLongContent: false,
      }

      const result = defaultEditSavePolicy.evaluate(input)

      expect(result.shouldResetSuggestions).toBe(false)
      expect(result.shouldResetStatus).toBe(false)
      expect(result.newStatus).toBe('suggested')
    })

    it('preserves selectedActions and selectedProject', () => {
      const input: EditSavePolicyInput = {
        dockItemId: 1,
        newText: 'new text',
        currentRawText: 'old text',
        currentStatus: 'suggested',
        isLongContent: false,
      }

      const result = defaultEditSavePolicy.evaluate(input)

      expect(result.preserveSelectedActions).toBe(true)
      expect(result.preserveSelectedProject).toBe(true)
    })
  })

  describe('applyEditSavePolicy', () => {
    it('applies default policy correctly', () => {
      const input: EditSavePolicyInput = {
        dockItemId: 1,
        newText: 'new text',
        currentRawText: 'old text',
        currentStatus: 'suggested',
        isLongContent: false,
      }

      const result = applyEditSavePolicy(input)

      expect(result.shouldResetSuggestions).toBe(true)
      expect(result.shouldResetStatus).toBe(true)
      expect(result.newStatus).toBe('pending')
    })

    it('applies custom policy', () => {
      const customPolicy: EditSavePolicy = {
        evaluate(input) {
          return {
            shouldResetSuggestions: false,
            shouldResetStatus: false,
            newStatus: input.currentStatus as 'pending',
            preserveSelectedActions: false,
            preserveSelectedProject: false,
          }
        },
      }

      const input: EditSavePolicyInput = {
        dockItemId: 1,
        newText: 'new text',
        currentRawText: 'old text',
        currentStatus: 'suggested',
        isLongContent: false,
      }

      const result = applyEditSavePolicy(input, customPolicy)

      expect(result.shouldResetSuggestions).toBe(false)
      expect(result.shouldResetStatus).toBe(false)
    })
  })

  describe('buildEditSavePatch', () => {
    it('builds patch with reset fields when text changes', () => {
      const input: EditSavePolicyInput = {
        dockItemId: 1,
        newText: 'new text',
        currentRawText: 'old text',
        currentStatus: 'suggested',
        isLongContent: false,
      }

      const patch = buildEditSavePatch(input)

      expect(patch.rawText).toBe('new text')
      expect(patch.status).toBe('pending')
      expect(patch.suggestions).toEqual([])
      expect(patch.processedAt).toBeNull()
    })

    it('builds patch without reset fields when text does not change', () => {
      const input: EditSavePolicyInput = {
        dockItemId: 1,
        newText: 'same text',
        currentRawText: 'same text',
        currentStatus: 'suggested',
        isLongContent: false,
      }

      const patch = buildEditSavePatch(input)

      expect(patch.rawText).toBe('same text')
      expect(patch.status).toBeUndefined()
      expect(patch.suggestions).toBeUndefined()
      expect(patch.processedAt).toBeUndefined()
    })
  })

  describe('isLongContent', () => {
    it('returns false for short content', () => {
      expect(isLongContent('short')).toBe(false)
      expect(isLongContent('a'.repeat(100))).toBe(false)
      expect(isLongContent('a'.repeat(500))).toBe(false)
    })

    it('returns true for long content', () => {
      expect(isLongContent('a'.repeat(501))).toBe(true)
      expect(isLongContent('a'.repeat(1000))).toBe(true)
    })
  })

  describe('getEditContentType', () => {
    it('returns short for content under 500 chars', () => {
      expect(getEditContentType('short')).toBe('short')
      expect(getEditContentType('a'.repeat(500))).toBe('short')
    })

    it('returns long for content over 500 chars', () => {
      expect(getEditContentType('a'.repeat(501))).toBe('long')
      expect(getEditContentType('a'.repeat(1000))).toBe('long')
    })
  })

  describe('getSavePathDescription', () => {
    it('returns description string', () => {
      const description = getSavePathDescription()
      expect(typeof description).toBe('string')
      expect(description).toContain('短内容')
      expect(description).toContain('长内容')
      expect(description).toContain('共用同一个')
    })
  })

  describe('status transitions', () => {
    it('resets to pending from suggested', () => {
      const input: EditSavePolicyInput = {
        dockItemId: 1,
        newText: 'new',
        currentRawText: 'old',
        currentStatus: 'suggested',
        isLongContent: false,
      }

      const result = applyEditSavePolicy(input)
      expect(result.newStatus).toBe('pending')
    })

    it('resets to pending from archived', () => {
      const input: EditSavePolicyInput = {
        dockItemId: 1,
        newText: 'new',
        currentRawText: 'old',
        currentStatus: 'archived',
        isLongContent: false,
      }

      const result = applyEditSavePolicy(input)
      expect(result.newStatus).toBe('pending')
    })

    it('preserves pending status when text unchanged', () => {
      const input: EditSavePolicyInput = {
        dockItemId: 1,
        newText: 'same',
        currentRawText: 'same',
        currentStatus: 'pending',
        isLongContent: false,
      }

      const result = applyEditSavePolicy(input)
      expect(result.newStatus).toBe('pending')
      expect(result.shouldResetStatus).toBe(false)
    })
  })
})