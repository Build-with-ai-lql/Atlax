export type CaptureStatus = 'pending' | 'suggested' | 'archived' | 'ignored' | 'reopened'
export type CaptureSource = 'text' | 'voice' | 'import' | 'chat'

export interface CaptureSuggestion {
  id: string
  type: 'category' | 'tag' | 'action' | 'project'
  label: string
  confidence: number
  reason?: string
}

export interface Capture {
  id: number
  userId: string
  rawText: string
  topic: string | null
  sourceType: CaptureSource
  status: CaptureStatus
  suggestions: CaptureSuggestion[]
  userTags: string[]
  selectedActions: string[]
  selectedProject: string | null
  sourceId: number | null
  parentId: number | null
  processedAt: Date | null
  createdAt: Date
}
