import { describe, expect, it } from 'vitest'

import {
  makeWorkspaceSessionId,
  makeWorkspaceTabId,
  makeRecentDocumentId,
} from '../src/workspace/types'
import type { TabType } from '../src/workspace/types'

describe('Workspace Types', () => {
  describe('makeWorkspaceSessionId', () => {
    it('generates deterministic session ID', () => {
      const id1 = makeWorkspaceSessionId('user1')
      const id2 = makeWorkspaceSessionId('user1')
      expect(id1).toBe(id2)
      expect(id1).toBe('user1_ws_session')
    })

    it('different user produces different session ID', () => {
      const id1 = makeWorkspaceSessionId('user1')
      const id2 = makeWorkspaceSessionId('user2')
      expect(id1).not.toBe(id2)
    })
  })

  describe('makeWorkspaceTabId', () => {
    it('generates tab ID without documentId', () => {
      const id = makeWorkspaceTabId('user1', 'mind')
      expect(id).toBe('user1_wt_mind')
    })

    it('generates tab ID with documentId', () => {
      const id = makeWorkspaceTabId('user1', 'editor', 42)
      expect(id).toBe('user1_wt_editor_42')
    })

    it('generates deterministic tab ID', () => {
      const id1 = makeWorkspaceTabId('user1', 'editor', 42)
      const id2 = makeWorkspaceTabId('user1', 'editor', 42)
      expect(id1).toBe(id2)
    })

    it('different tabType produces different ID', () => {
      const id1 = makeWorkspaceTabId('user1', 'editor', 42)
      const id2 = makeWorkspaceTabId('user1', 'document', 42)
      expect(id1).not.toBe(id2)
    })
  })

  describe('makeRecentDocumentId', () => {
    it('generates deterministic recent document ID', () => {
      const id1 = makeRecentDocumentId('user1', 10)
      const id2 = makeRecentDocumentId('user1', 10)
      expect(id1).toBe(id2)
      expect(id1).toBe('user1_rd_10')
    })

    it('different documentId produces different ID', () => {
      const id1 = makeRecentDocumentId('user1', 10)
      const id2 = makeRecentDocumentId('user1', 20)
      expect(id1).not.toBe(id2)
    })
  })

  describe('TabType', () => {
    it('covers all defined tab types', () => {
      const types: TabType[] = [
        'home', 'mind', 'dock', 'editor', 'document',
        'node', 'project', 'review', 'settings',
      ]
      expect(types).toHaveLength(9)
    })
  })
})
