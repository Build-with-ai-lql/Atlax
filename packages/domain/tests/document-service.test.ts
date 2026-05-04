import { describe, expect, it } from 'vitest'

import {
  buildDocumentPatch,
  buildCaptureSyncPatch,
  buildDocumentAndCapturePatches,
  documentFromEntry,
  entryFromDocument,
} from '../src/document/service'
import type { Document } from '../src/document/types'

describe('DocumentService', () => {
  describe('buildDocumentPatch', () => {
    it('returns patch with tags when tags updated', () => {
      const result = buildDocumentPatch({ tags: ['work', 'urgent'] })
      expect(result).toEqual({ tags: ['work', 'urgent'] })
    })

    it('returns patch with project when project updated', () => {
      const result = buildDocumentPatch({ project: 'Alpha' })
      expect(result).toEqual({ project: 'Alpha' })
    })

    it('returns patch with content when content updated', () => {
      const result = buildDocumentPatch({ content: 'Updated content' })
      expect(result).toEqual({ content: 'Updated content' })
    })

    it('returns patch with title when title updated', () => {
      const result = buildDocumentPatch({ title: 'New Title' })
      expect(result).toEqual({ title: 'New Title' })
    })

    it('returns null when no updates provided', () => {
      const result = buildDocumentPatch({})
      expect(result).toBeNull()
    })

    it('returns patch with multiple fields', () => {
      const result = buildDocumentPatch({
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

  describe('buildCaptureSyncPatch', () => {
    it('returns capture sync patch when tags updated and sourceCaptureId exists', () => {
      const result = buildCaptureSyncPatch(123, ['tag1', 'tag2'])
      expect(result).toEqual({
        sourceCaptureId: 123,
        userTags: ['tag1', 'tag2'],
      })
    })

    it('returns null when tags not updated', () => {
      const result = buildCaptureSyncPatch(123, undefined)
      expect(result).toBeNull()
    })

    it('returns null when sourceCaptureId not provided', () => {
      const result = buildCaptureSyncPatch(undefined, ['tag1'])
      expect(result).toBeNull()
    })

    it('returns null when both missing', () => {
      const result = buildCaptureSyncPatch(undefined, undefined)
      expect(result).toBeNull()
    })
  })

  describe('buildDocumentAndCapturePatches', () => {
    it('builds both patches when tags updated with sourceCaptureId', () => {
      const result = buildDocumentAndCapturePatches({ tags: ['work'] }, 123)
      expect(result.documentPatch).toEqual({ tags: ['work'] })
      expect(result.captureSyncPatch).toEqual({
        sourceCaptureId: 123,
        userTags: ['work'],
      })
    })

    it('builds only document patch when tags updated but no sourceCaptureId', () => {
      const result = buildDocumentAndCapturePatches({ tags: ['work'] }, undefined)
      expect(result.documentPatch).toEqual({ tags: ['work'] })
      expect(result.captureSyncPatch).toBeNull()
    })

    it('builds only document patch when project updated', () => {
      const result = buildDocumentAndCapturePatches({ project: 'Alpha' }, 123)
      expect(result.documentPatch).toEqual({ project: 'Alpha' })
      expect(result.captureSyncPatch).toBeNull()
    })

    it('returns null document patch when no updates', () => {
      const result = buildDocumentAndCapturePatches({}, 123)
      expect(result.documentPatch).toBeNull()
      expect(result.captureSyncPatch).toBeNull()
    })
  })

  describe('documentFromEntry / entryFromDocument', () => {
    const now = new Date()
    const entry = {
      id: 1,
      sourceDockItemId: 42,
      title: 'Test Entry',
      content: 'Some content',
      type: 'note' as const,
      tags: ['work'],
      project: 'Alpha',
      actions: ['review'],
      createdAt: now,
      archivedAt: now,
    }

    it('documentFromEntry maps sourceDockItemId to sourceCaptureId', () => {
      const doc = documentFromEntry(entry)
      expect(doc.sourceCaptureId).toBe(42)
      expect(doc.title).toBe('Test Entry')
      expect(doc.type).toBe('note')
    })

    it('entryFromDocument maps sourceCaptureId back to sourceDockItemId', () => {
      const doc: Document = {
        id: 1,
        sourceCaptureId: 42,
        title: 'Test Doc',
        content: 'Doc content',
        type: 'meeting',
        tags: ['personal'],
        project: null,
        actions: [],
        createdAt: now,
        archivedAt: now,
      }
      const result = entryFromDocument(doc)
      expect(result.sourceDockItemId).toBe(42)
      expect(result.title).toBe('Test Doc')
      expect(result.type).toBe('meeting')
    })

    it('round-trip preserves data', () => {
      const doc = documentFromEntry(entry)
      const roundTrip = entryFromDocument(doc)
      expect(roundTrip.sourceDockItemId).toBe(entry.sourceDockItemId)
      expect(roundTrip.title).toBe(entry.title)
      expect(roundTrip.content).toBe(entry.content)
      expect(roundTrip.type).toBe(entry.type)
      expect(roundTrip.tags).toEqual(entry.tags)
      expect(roundTrip.project).toBe(entry.project)
      expect(roundTrip.actions).toEqual(entry.actions)
    })
  })
})
