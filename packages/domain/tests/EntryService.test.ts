import { describe, expect, it } from 'vitest'

import {
  buildEntryPatch,
  buildDockSyncPatch,
  buildEntryAndDockPatches,
} from '../src/services/EntryService'

describe('EntryService', () => {
  describe('buildEntryPatch', () => {
    it('returns patch with tags when tags updated', () => {
      const result = buildEntryPatch({ tags: ['work', 'urgent'] })
      expect(result).toEqual({ tags: ['work', 'urgent'] })
    })

    it('returns patch with project when project updated', () => {
      const result = buildEntryPatch({ project: 'Alpha' })
      expect(result).toEqual({ project: 'Alpha' })
    })

    it('returns patch with content when content updated', () => {
      const result = buildEntryPatch({ content: 'Updated content' })
      expect(result).toEqual({ content: 'Updated content' })
    })

    it('returns patch with title when title updated', () => {
      const result = buildEntryPatch({ title: 'New Title' })
      expect(result).toEqual({ title: 'New Title' })
    })

    it('returns null when no updates provided', () => {
      const result = buildEntryPatch({})
      expect(result).toBeNull()
    })

    it('returns patch with multiple fields', () => {
      const result = buildEntryPatch({
        tags: ['work'],
        project: 'Beta',
        content: 'Content',
        title: 'Title',
      })
      expect(result).toEqual({
        tags: ['work'],
        project: 'Beta',
        content: 'Content',
        title: 'Title',
      })
    })
  })

  describe('buildDockSyncPatch', () => {
    it('returns dock sync patch when tags updated and sourceDockItemId exists', () => {
      const result = buildDockSyncPatch(123, ['tag1', 'tag2'])
      expect(result).toEqual({
        sourceDockItemId: 123,
        userTags: ['tag1', 'tag2'],
      })
    })

    it('returns null when tags not updated', () => {
      const result = buildDockSyncPatch(123, undefined)
      expect(result).toBeNull()
    })

    it('returns null when sourceDockItemId not provided', () => {
      const result = buildDockSyncPatch(undefined, ['tag1'])
      expect(result).toBeNull()
    })

    it('returns null when both missing', () => {
      const result = buildDockSyncPatch(undefined, undefined)
      expect(result).toBeNull()
    })
  })

  describe('buildEntryAndDockPatches', () => {
    it('builds both patches when tags updated with sourceDockItemId', () => {
      const result = buildEntryAndDockPatches(
        { tags: ['work'] },
        123,
      )
      expect(result.entryPatch).toEqual({ tags: ['work'] })
      expect(result.dockSyncPatch).toEqual({
        sourceDockItemId: 123,
        userTags: ['work'],
      })
    })

    it('builds only entry patch when tags updated but no sourceDockItemId', () => {
      const result = buildEntryAndDockPatches({ tags: ['work'] }, undefined)
      expect(result.entryPatch).toEqual({ tags: ['work'] })
      expect(result.dockSyncPatch).toBeNull()
    })

    it('builds only entry patch when project updated', () => {
      const result = buildEntryAndDockPatches({ project: 'Alpha' }, 123)
      expect(result.entryPatch).toEqual({ project: 'Alpha' })
      expect(result.dockSyncPatch).toBeNull()
    })

    it('returns null entry patch when no updates', () => {
      const result = buildEntryAndDockPatches({}, 123)
      expect(result.entryPatch).toBeNull()
      expect(result.dockSyncPatch).toBeNull()
    })
  })
})
