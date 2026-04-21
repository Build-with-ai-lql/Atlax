export type SourceType = 'text' | 'voice'

export type EntryStatus = 'pending' | 'suggested' | 'archived' | 'ignored'

export type SuggestionType = 'category' | 'tag' | 'action' | 'project'

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