import type { Document, DocumentPatch, DocumentUpdateInput, CaptureSyncPatch, BuildDocumentPatchResult } from './types'

export function buildDocumentPatch(updates: DocumentUpdateInput): DocumentPatch | null {
  const patch: DocumentPatch = {}
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

export function buildCaptureSyncPatch(
  sourceCaptureId: number | undefined,
  tags: string[] | undefined,
): CaptureSyncPatch | null {
  if (tags === undefined || !sourceCaptureId) {
    return null
  }
  return {
    sourceCaptureId,
    userTags: tags,
  }
}

export function buildDocumentAndCapturePatches(
  updates: DocumentUpdateInput,
  sourceCaptureId: number | undefined,
): BuildDocumentPatchResult {
  return {
    documentPatch: buildDocumentPatch(updates),
    captureSyncPatch: buildCaptureSyncPatch(sourceCaptureId, updates.tags),
  }
}

export function documentFromEntry(entry: {
  id: number
  sourceDockItemId: number
  title: string
  content: string
  type: string
  tags: string[]
  project: string | null
  actions: string[]
  createdAt: Date
  archivedAt: Date
}): Document {
  return {
    id: entry.id,
    sourceCaptureId: entry.sourceDockItemId,
    title: entry.title,
    content: entry.content,
    type: entry.type as Document['type'],
    tags: entry.tags,
    project: entry.project,
    actions: entry.actions,
    createdAt: entry.createdAt,
    archivedAt: entry.archivedAt,
  }
}

export function entryFromDocument(doc: Document): {
  id: number
  sourceDockItemId: number
  title: string
  content: string
  type: string
  tags: string[]
  project: string | null
  actions: string[]
  createdAt: Date
  archivedAt: Date
} {
  return {
    id: doc.id,
    sourceDockItemId: doc.sourceCaptureId,
    title: doc.title,
    content: doc.content,
    type: doc.type,
    tags: doc.tags,
    project: doc.project,
    actions: doc.actions,
    createdAt: doc.createdAt,
    archivedAt: doc.archivedAt,
  }
}
