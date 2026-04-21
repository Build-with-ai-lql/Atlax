export type SourceType = 'text' | 'voice'

export type EntryStatus = 'pending' | 'suggested' | 'archived' | 'ignored'

export type SuggestionType = 'category' | 'tag' | 'action' | 'project'

export type EntryType = 'note' | 'meeting' | 'idea' | 'task' | 'reading'

export interface SuggestionItem {
  id: string
  type: SuggestionType
  label: string
  confidence: number
}

export interface SuggestionResult {
  entryId: number
  suggestions: SuggestionItem[]
  generatedAt: Date
  engineVersion: string
}

export interface ArchiveIntent {
  entryId: number
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
  sourceInboxEntryId: number
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
  inboxEntryId: number
  rawText: string
  suggestions: SuggestionItem[]
  userTags: string[]
  createdAt: Date
}
