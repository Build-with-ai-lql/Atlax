import { describe, expect, it } from 'vitest'

import {
  queryEntriesByDate,
  queryMonthOverview,
  type EntryLookup,
} from '../src/services/CalendarWidgetService'

const USER_A = 'user_a'
const USER_B = 'user_b'

function makeEntry(overrides: Partial<EntryLookup> & { id: number; userId: string; sourceDockItemId: number }): EntryLookup {
  return {
    title: 'Test',
    type: 'note',
    tags: [],
    project: null,
    archivedAt: new Date('2026-04-25T10:00:00Z'),
    ...overrides,
  }
}

describe('CalendarWidgetService', () => {
  describe('queryEntriesByDate', () => {
    it('returns entries for the specified date', () => {
      const entries = [
        makeEntry({ id: 1, userId: USER_A, sourceDockItemId: 10, archivedAt: new Date('2026-04-25T10:00:00Z') }),
        makeEntry({ id: 2, userId: USER_A, sourceDockItemId: 11, archivedAt: new Date('2026-04-25T15:00:00Z') }),
        makeEntry({ id: 3, userId: USER_A, sourceDockItemId: 12, archivedAt: new Date('2026-04-26T09:00:00Z') }),
      ]

      const result = queryEntriesByDate(entries, USER_A, '2026-04-25')
      expect(result.date).toBe('2026-04-25')
      expect(result.entries).toHaveLength(2)
      expect(result.entries[0].entryId).toBe(1)
      expect(result.entries[1].entryId).toBe(2)
    })

    it('returns empty for date with no entries', () => {
      const entries = [
        makeEntry({ id: 1, userId: USER_A, sourceDockItemId: 10, archivedAt: new Date('2026-04-25T10:00:00Z') }),
      ]

      const result = queryEntriesByDate(entries, USER_A, '2026-04-26')
      expect(result.date).toBe('2026-04-26')
      expect(result.entries).toHaveLength(0)
    })

    it('does not return entries from other users', () => {
      const entries = [
        makeEntry({ id: 1, userId: USER_A, sourceDockItemId: 10, archivedAt: new Date('2026-04-25T10:00:00Z') }),
        makeEntry({ id: 2, userId: USER_B, sourceDockItemId: 20, archivedAt: new Date('2026-04-25T10:00:00Z') }),
      ]

      const result = queryEntriesByDate(entries, USER_A, '2026-04-25')
      expect(result.entries).toHaveLength(1)
      expect(result.entries[0].entryId).toBe(1)
    })

    it('normalizes date format with padding', () => {
      const entries = [
        makeEntry({ id: 1, userId: USER_A, sourceDockItemId: 10, archivedAt: new Date('2026-01-05T10:00:00Z') }),
      ]

      const result = queryEntriesByDate(entries, USER_A, '2026-1-5')
      expect(result.entries).toHaveLength(1)
    })
  })

  describe('queryMonthOverview', () => {
    it('returns days with entries for the specified month', () => {
      const entries = [
        makeEntry({ id: 1, userId: USER_A, sourceDockItemId: 10, archivedAt: new Date('2026-04-10T10:00:00Z') }),
        makeEntry({ id: 2, userId: USER_A, sourceDockItemId: 11, archivedAt: new Date('2026-04-10T15:00:00Z') }),
        makeEntry({ id: 3, userId: USER_A, sourceDockItemId: 12, archivedAt: new Date('2026-04-25T09:00:00Z') }),
      ]

      const result = queryMonthOverview(entries, USER_A, 2026, 4)
      expect(result.year).toBe(2026)
      expect(result.month).toBe(4)
      expect(result.daysWithEntries).toEqual(['2026-04-10', '2026-04-25'])
    })

    it('returns empty for month with no entries', () => {
      const entries = [
        makeEntry({ id: 1, userId: USER_A, sourceDockItemId: 10, archivedAt: new Date('2026-03-15T10:00:00Z') }),
      ]

      const result = queryMonthOverview(entries, USER_A, 2026, 4)
      expect(result.daysWithEntries).toEqual([])
    })

    it('does not include entries from other users', () => {
      const entries = [
        makeEntry({ id: 1, userId: USER_A, sourceDockItemId: 10, archivedAt: new Date('2026-04-15T10:00:00Z') }),
        makeEntry({ id: 2, userId: USER_B, sourceDockItemId: 20, archivedAt: new Date('2026-04-20T10:00:00Z') }),
      ]

      const result = queryMonthOverview(entries, USER_A, 2026, 4)
      expect(result.daysWithEntries).toEqual(['2026-04-15'])
    })
  })
})
