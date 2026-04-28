import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'

import { db } from '../lib/db'
import {
  getWorkspaceSession,
  openWorkspaceTab,
  closeWorkspaceTab,
  activateWorkspaceTab,
  pinWorkspaceTab,
  restoreWorkspaceTabs,
  listRecentDocuments,
  recordRecentDocumentOpen,
} from '../lib/repository'

const USER = 'test-user'
const OTHER = 'other-user'

afterEach(async () => {
  await db.delete()
  await db.open()
})

describe('Workspace Session', () => {
  it('creates session on first getWorkspaceSession', async () => {
    const session = await getWorkspaceSession(USER)
    expect(session).toBeTruthy()
    expect(session.userId).toBe(USER)
    expect(session.activeTabId).toBeNull()
  })

  it('returns same session on repeated calls', async () => {
    const s1 = await getWorkspaceSession(USER)
    const s2 = await getWorkspaceSession(USER)
    expect(s1.id).toBe(s2.id)
  })

  it('isolates sessions by userId', async () => {
    const s1 = await getWorkspaceSession(USER)
    const s2 = await getWorkspaceSession(OTHER)
    expect(s1.id).not.toBe(s2.id)
  })
})

describe('Workspace Tabs - open / activate / close / pin', () => {
  it('opens a tab and sets it active', async () => {
    const tab = await openWorkspaceTab({
      userId: USER,
      tabType: 'mind',
      title: 'Mind',
      path: '/mind',
    })
    expect(tab.tabType).toBe('mind')
    expect(tab.isActive).toBe(true)
    expect(tab.isPinned).toBe(false)
  })

  it('deactivates previous tab when opening new one', async () => {
    const tab1 = await openWorkspaceTab({ userId: USER, tabType: 'mind', title: 'Mind', path: '/mind' })
    const tab2 = await openWorkspaceTab({ userId: USER, tabType: 'dock', title: 'Dock', path: '/dock' })

    const restored = await restoreWorkspaceTabs(USER)
    const mindTab = restored.find((t) => t.id === tab1.id)
    const dockTab = restored.find((t) => t.id === tab2.id)
    expect(mindTab!.isActive).toBe(false)
    expect(dockTab!.isActive).toBe(true)
  })

  it('activates a tab and deactivates others', async () => {
    const tab1 = await openWorkspaceTab({ userId: USER, tabType: 'mind', title: 'Mind', path: '/mind' })
    const tab2 = await openWorkspaceTab({ userId: USER, tabType: 'dock', title: 'Dock', path: '/dock' })

    await activateWorkspaceTab(USER, tab1.id)

    const restored = await restoreWorkspaceTabs(USER)
    expect(restored.find((t) => t.id === tab1.id)!.isActive).toBe(true)
    expect(restored.find((t) => t.id === tab2.id)!.isActive).toBe(false)
  })

  it('closes a tab and activates the last remaining', async () => {
    const tab1 = await openWorkspaceTab({ userId: USER, tabType: 'mind', title: 'Mind', path: '/mind' })
    const tab2 = await openWorkspaceTab({ userId: USER, tabType: 'dock', title: 'Dock', path: '/dock' })

    await closeWorkspaceTab(USER, tab2.id)

    const restored = await restoreWorkspaceTabs(USER)
    expect(restored).toHaveLength(1)
    expect(restored[0].id).toBe(tab1.id)
    expect(restored[0].isActive).toBe(true)
  })

  it('closes active tab and activates last remaining by sortOrder', async () => {
    const tab1 = await openWorkspaceTab({ userId: USER, tabType: 'mind', title: 'Mind', path: '/mind' })
    const tab2 = await openWorkspaceTab({ userId: USER, tabType: 'dock', title: 'Dock', path: '/dock' })
    const tab3 = await openWorkspaceTab({ userId: USER, tabType: 'home', title: 'Home', path: '/home' })

    await closeWorkspaceTab(USER, tab3.id)

    const restored = await restoreWorkspaceTabs(USER)
    expect(restored).toHaveLength(2)
    expect(restored.find((t) => t.isActive)!.id).toBe(tab2.id)
  })

  it('closes all tabs and session activeTabId becomes null', async () => {
    const tab1 = await openWorkspaceTab({ userId: USER, tabType: 'mind', title: 'Mind', path: '/mind' })
    await closeWorkspaceTab(USER, tab1.id)

    const session = await getWorkspaceSession(USER)
    expect(session.activeTabId).toBeNull()

    const restored = await restoreWorkspaceTabs(USER)
    expect(restored).toHaveLength(0)
  })

  it('pins and unpins a tab', async () => {
    const tab = await openWorkspaceTab({ userId: USER, tabType: 'mind', title: 'Mind', path: '/mind' })

    const pinned = await pinWorkspaceTab(USER, tab.id)
    expect(pinned!.isPinned).toBe(true)

    const unpinned = await pinWorkspaceTab(USER, tab.id)
    expect(unpinned!.isPinned).toBe(false)
  })

  it('pins a tab with explicit pinned=true', async () => {
    const tab = await openWorkspaceTab({ userId: USER, tabType: 'mind', title: 'Mind', path: '/mind' })

    const pinned = await pinWorkspaceTab(USER, tab.id, true)
    expect(pinned!.isPinned).toBe(true)

    const stillPinned = await pinWorkspaceTab(USER, tab.id, true)
    expect(stillPinned!.isPinned).toBe(true)
  })

  it('returns false when closing non-existent tab', async () => {
    const result = await closeWorkspaceTab(USER, 'nonexistent')
    expect(result).toBe(false)
  })

  it('returns null when pinning non-existent tab', async () => {
    const result = await pinWorkspaceTab(USER, 'nonexistent')
    expect(result).toBeNull()
  })
})

describe('Workspace Tabs - editor tab dedup', () => {
  it('same document editor tab activates existing instead of creating new', async () => {
    const tab1 = await openWorkspaceTab({
      userId: USER,
      tabType: 'editor',
      title: 'Doc 1',
      path: '/editor/1',
      documentId: 1,
    })
    const tab2 = await openWorkspaceTab({
      userId: USER,
      tabType: 'editor',
      title: 'Doc 1',
      path: '/editor/1',
      documentId: 1,
    })

    expect(tab1.id).toBe(tab2.id)

    const restored = await restoreWorkspaceTabs(USER)
    const editorTabs = restored.filter((t) => t.tabType === 'editor')
    expect(editorTabs).toHaveLength(1)
    expect(editorTabs[0].isActive).toBe(true)
  })

  it('different document editor tabs are separate', async () => {
    const tab1 = await openWorkspaceTab({
      userId: USER,
      tabType: 'editor',
      title: 'Doc 1',
      path: '/editor/1',
      documentId: 1,
    })
    const tab2 = await openWorkspaceTab({
      userId: USER,
      tabType: 'editor',
      title: 'Doc 2',
      path: '/editor/2',
      documentId: 2,
    })

    expect(tab1.id).not.toBe(tab2.id)

    const restored = await restoreWorkspaceTabs(USER)
    expect(restored).toHaveLength(2)
  })

  it('non-editor tabs with same type do not dedup', async () => {
    const tab1 = await openWorkspaceTab({ userId: USER, tabType: 'mind', title: 'Mind', path: '/mind' })
    const tab2 = await openWorkspaceTab({ userId: USER, tabType: 'mind', title: 'Mind', path: '/mind' })

    expect(tab1.id).toBe(tab2.id)
  })
})

describe('Workspace Tabs - userId isolation', () => {
  it('restoreWorkspaceTabs only returns user own tabs', async () => {
    await openWorkspaceTab({ userId: USER, tabType: 'mind', title: 'Mind', path: '/mind' })
    await openWorkspaceTab({ userId: OTHER, tabType: 'dock', title: 'Dock', path: '/dock' })

    const userTabs = await restoreWorkspaceTabs(USER)
    const otherTabs = await restoreWorkspaceTabs(OTHER)

    expect(userTabs).toHaveLength(1)
    expect(userTabs[0].tabType).toBe('mind')
    expect(otherTabs).toHaveLength(1)
    expect(otherTabs[0].tabType).toBe('dock')
  })

  it('cannot close another users tab', async () => {
    const tab = await openWorkspaceTab({ userId: USER, tabType: 'mind', title: 'Mind', path: '/mind' })
    const result = await closeWorkspaceTab(OTHER, tab.id)
    expect(result).toBe(false)
  })
})

describe('Recent Documents', () => {
  it('records and lists recent documents', async () => {
    await recordRecentDocumentOpen({ userId: USER, documentId: 1, title: 'Doc 1' })
    await recordRecentDocumentOpen({ userId: USER, documentId: 2, title: 'Doc 2' })

    const recent = await listRecentDocuments(USER)
    expect(recent).toHaveLength(2)
  })

  it('deduplicates and increments openCount', async () => {
    await recordRecentDocumentOpen({ userId: USER, documentId: 1, title: 'Doc 1' })
    await recordRecentDocumentOpen({ userId: USER, documentId: 1, title: 'Doc 1 Updated' })
    await recordRecentDocumentOpen({ userId: USER, documentId: 1, title: 'Doc 1 Final' })

    const recent = await listRecentDocuments(USER)
    expect(recent).toHaveLength(1)
    expect(recent[0].openCount).toBe(3)
    expect(recent[0].title).toBe('Doc 1 Final')
  })

  it('updates lastOpenedAt on repeated opens', async () => {
    await recordRecentDocumentOpen({ userId: USER, documentId: 1, title: 'Doc 1' })

    await new Promise((r) => setTimeout(r, 10))

    await recordRecentDocumentOpen({ userId: USER, documentId: 1, title: 'Doc 1' })

    const recent = await listRecentDocuments(USER)
    expect(recent[0].lastOpenedAt.getTime()).toBeGreaterThan(recent[0].createdAt.getTime())
  })

  it('respects limit parameter', async () => {
    for (let i = 1; i <= 5; i++) {
      await recordRecentDocumentOpen({ userId: USER, documentId: i, title: `Doc ${i}` })
    }

    const recent = await listRecentDocuments(USER, 3)
    expect(recent).toHaveLength(3)
  })

  it('isolates by userId', async () => {
    await recordRecentDocumentOpen({ userId: USER, documentId: 1, title: 'User Doc' })
    await recordRecentDocumentOpen({ userId: OTHER, documentId: 2, title: 'Other Doc' })

    const userRecent = await listRecentDocuments(USER)
    const otherRecent = await listRecentDocuments(OTHER)

    expect(userRecent).toHaveLength(1)
    expect(userRecent[0].documentId).toBe(1)
    expect(otherRecent).toHaveLength(1)
    expect(otherRecent[0].documentId).toBe(2)
  })

  it('returns empty list when no documents', async () => {
    const recent = await listRecentDocuments(USER)
    expect(recent).toHaveLength(0)
  })
})
