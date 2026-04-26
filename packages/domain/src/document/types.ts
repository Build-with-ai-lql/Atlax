export type DocumentType = 'note' | 'meeting' | 'idea' | 'task' | 'reading'

export interface Document {
  id: number
  sourceCaptureId: number
  title: string
  content: string
  type: DocumentType
  tags: string[]
  project: string | null
  actions: string[]
  createdAt: Date
  archivedAt: Date
}

export interface DocumentUpdateInput {
  tags?: string[]
  project?: string | null
  content?: string
  title?: string
}

export interface DocumentPatch {
  tags?: string[]
  project?: string | null
  content?: string
  title?: string
}

export interface CaptureSyncPatch {
  sourceCaptureId: number
  userTags: string[]
}

export interface BuildDocumentPatchResult {
  documentPatch: DocumentPatch | null
  captureSyncPatch: CaptureSyncPatch | null
}

export interface ArchiveToDocumentInput {
  captureId: number
  rawText: string
  topic: string | null
  suggestions: Array<{
    id: string
    type: 'category' | 'tag' | 'action' | 'project'
    label: string
    confidence: number
    reason?: string
  }>
  userTags: string[]
  selectedProject: string | null
  selectedActions: string[]
  createdAt: Date
}
