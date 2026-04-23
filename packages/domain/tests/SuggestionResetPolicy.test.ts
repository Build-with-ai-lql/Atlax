import { describe, expect, it } from 'vitest'

import {
  defaultSuggestionResetPolicy,
  applySuggestionResetPolicy,
  buildSuggestionResetPatch,
  type SuggestionResetInput,
} from '../src/policies/SuggestionResetPolicy'

describe('SuggestionResetPolicy', () => {
  describe('defaultSuggestionResetPolicy', () => {
    describe('shouldReset', () => {
      it('returns true when text changes', () => {
        const input: SuggestionResetInput = {
          dockItemId: 1,
          currentRawText: 'old text',
          newRawText: 'new text',
          currentStatus: 'suggested',
          currentSuggestions: [{ id: 's1', type: 'tag', label: 'work', confidence: 0.9 }],
          currentProcessedAt: new Date(),
        }
        expect(defaultSuggestionResetPolicy.shouldReset(input)).toBe(true)
      })

      it('returns false when text unchanged', () => {
        const input: SuggestionResetInput = {
          dockItemId: 1,
          currentRawText: 'same text',
          newRawText: 'same text',
          currentStatus: 'suggested',
          currentSuggestions: [],
          currentProcessedAt: null,
        }
        expect(defaultSuggestionResetPolicy.shouldReset(input)).toBe(false)
      })
    })

    describe('buildResetPatch', () => {
      it('returns correct reset patch', () => {
        const input: SuggestionResetInput = {
          dockItemId: 1,
          currentRawText: 'old',
          newRawText: 'new',
          currentStatus: 'suggested',
          currentSuggestions: [{ id: 's1' }],
          currentProcessedAt: new Date(),
        }
        const result = defaultSuggestionResetPolicy.buildResetPatch(input)

        expect(result.rawText).toBe('new')
        expect(result.status).toBe('pending')
        expect(result.suggestions).toEqual([])
        expect(result.processedAt).toBeNull()
      })
    })
  })

  describe('applySuggestionResetPolicy', () => {
    it('returns patch when shouldReset is true', () => {
      const input: SuggestionResetInput = {
        dockItemId: 1,
        currentRawText: 'old',
        newRawText: 'new',
        currentStatus: 'suggested',
        currentSuggestions: [],
        currentProcessedAt: null,
      }
      const result = applySuggestionResetPolicy(input)

      expect(result).not.toBeNull()
      expect(result?.rawText).toBe('new')
      expect(result?.status).toBe('pending')
    })

    it('returns null when shouldReset is false', () => {
      const input: SuggestionResetInput = {
        dockItemId: 1,
        currentRawText: 'same',
        newRawText: 'same',
        currentStatus: 'suggested',
        currentSuggestions: [],
        currentProcessedAt: null,
      }
      const result = applySuggestionResetPolicy(input)

      expect(result).toBeNull()
    })

    it('accepts custom policy', () => {
      const customPolicy = {
        shouldReset: () => true,
        buildResetPatch: (input: SuggestionResetInput) => ({
          rawText: input.newRawText.toUpperCase(),
          status: 'pending' as const,
          suggestions: [] as [],
          processedAt: null as null,
        }),
      }
      const input: SuggestionResetInput = {
        dockItemId: 1,
        currentRawText: 'old',
        newRawText: 'new',
        currentStatus: 'pending',
        currentSuggestions: [],
        currentProcessedAt: null,
      }
      const result = applySuggestionResetPolicy(input, customPolicy)

      expect(result?.rawText).toBe('NEW')
    })
  })

  describe('buildSuggestionResetPatch', () => {
    it('returns reset patch for given dock item id and text', () => {
      const result = buildSuggestionResetPatch(123, 'updated text')

      expect(result.rawText).toBe('updated text')
      expect(result.status).toBe('pending')
      expect(result.suggestions).toEqual([])
      expect(result.processedAt).toBeNull()
    })

    it('always returns pending status', () => {
      const result = buildSuggestionResetPatch(1, 'any text')
      expect(result.status).toBe('pending')
    })

    it('always clears suggestions', () => {
      const result = buildSuggestionResetPatch(1, 'any text')
      expect(result.suggestions).toEqual([])
    })

    it('always sets processedAt to null', () => {
      const result = buildSuggestionResetPatch(1, 'any text')
      expect(result.processedAt).toBeNull()
    })
  })
})
