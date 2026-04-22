export type SourceType = 'text' | 'voice' | 'import' | 'chat'

export type EntryStatus = 'pending' | 'suggested' | 'archived' | 'ignored' | 'reopened'

export type SuggestionType = 'category' | 'tag' | 'action' | 'project'

export type EntryType = 'note' | 'meeting' | 'idea' | 'task' | 'reading'

export interface SuggestionItem {
  id: string
  type: SuggestionType
  label: string
  confidence: number
  reason?: string
}

export interface SuggestionResult {
  dockItemId: number
  suggestions: SuggestionItem[]
  generatedAt: Date
  engineVersion: string
}

export interface ArchiveIntent {
  dockItemId: number
  selectedSuggestions: SuggestionItem[]
  archivedAt: Date
}

export interface SuggestionEntryInput {
  id: number
  rawText: string
  createdAt: Date
}

export interface GroupedSuggestions {
  category: SuggestionItem | null
  tags: SuggestionItem[]
  actions: SuggestionItem[]
  projects: SuggestionItem[]
}

export interface Tag {
  id: string
  name: string
  createdAt: Date
}

export interface ResolvedTags {
  suggested: string[]
  userSelected: string[]
  final: string[]
}

export interface Entry {
  id: number
  sourceDockItemId: number
  title: string
  content: string
  type: EntryType
  tags: string[]
  project: string | null
  actions: string[]
  createdAt: Date
  archivedAt: Date
}

export interface ArchiveInput {
  dockItemId: number
  rawText: string
  suggestions: SuggestionItem[]
  userTags: string[]
  createdAt: Date
}