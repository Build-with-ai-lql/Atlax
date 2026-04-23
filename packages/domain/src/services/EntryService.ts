export interface EntryUpdateInput {
  tags?: string[]
  project?: string | null
  content?: string
  title?: string
}

export interface EntryPatch {
  tags?: string[]
  project?: string | null
  content?: string
  title?: string
}

export interface DockSyncPatch {
  sourceDockItemId: number
  userTags: string[]
}

export interface BuildEntryPatchResult {
  entryPatch: EntryPatch | null
  dockSyncPatch: DockSyncPatch | null
}

export function buildEntryPatch(
  updates: EntryUpdateInput,
): EntryPatch | null {
  const patch: EntryPatch = {}
  let hasUpdates = false

  if (updates.tags !== undefined) {
    patch.tags = updates.tags
    hasUpdates = true
  }
  if (updates.project !== undefined) {
    patch.project = updates.project
    hasUpdates = true
  }
  if (updates.content !== undefined) {
    patch.content = updates.content
    hasUpdates = true
  }
  if (updates.title !== undefined) {
    patch.title = updates.title
    hasUpdates = true
  }

  return hasUpdates ? patch : null
}

export function buildDockSyncPatch(
  sourceDockItemId: number | undefined,
  tags: string[] | undefined,
): DockSyncPatch | null {
  if (tags === undefined || !sourceDockItemId) {
    return null
  }
  return {
    sourceDockItemId,
    userTags: tags,
  }
}

export function buildEntryAndDockPatches(
  updates: EntryUpdateInput,
  sourceDockItemId: number | undefined,
): BuildEntryPatchResult {
  return {
    entryPatch: buildEntryPatch(updates),
    dockSyncPatch: buildDockSyncPatch(sourceDockItemId, updates.tags),
  }
}
