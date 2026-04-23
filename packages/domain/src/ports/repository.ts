import type { EntryStatus, SourceType, SuggestionItem } from '../types'
import type { Entry as DomainEntry, Tag as DomainTag } from '../types'

export type DockItemId = number
export type UserId = string

export interface DockItem {
  id: number
  userId: string
  rawText: string
  sourceType: SourceType
  status: EntryStatus
  suggestions: SuggestionItem[]
  userTags: string[]
  processedAt: Date | null
  createdAt: Date
}

export type PersistedEntry = DomainEntry & { userId: string }
export type PersistedTag = DomainTag & { userId: string }

export interface WorkspaceStats {
  totalEntries: number
  pendingCount: number
  suggestedCount: number
  archivedCount: number
  ignoredCount: number
  reopenedCount: number
  tagCount: number
}

export interface EntryUpdate {
  tags?: string[]
  project?: string | null
  content?: string
  title?: string
}

export interface DockItemRepository {
  create(userId: string, rawText: string, sourceType: SourceType): Promise<number>
  findById(userId: string, id: number): Promise<DockItem | null>
  listByUser(userId: string): Promise<DockItem[]>
  listByStatus(userId: string, status: EntryStatus): Promise<DockItem[]>
  count(userId: string): Promise<number>
  updateText(userId: string, id: number, rawText: string): Promise<DockItem | null>
  updateTags(userId: string, id: number, userTags: string[]): Promise<DockItem | null>
  addTag(userId: string, id: number, tagName: string): Promise<DockItem | null>
  removeTag(userId: string, id: number, tagName: string): Promise<DockItem | null>
  archive(userId: string, id: number): Promise<DockItem | null>
  ignore(userId: string, id: number): Promise<DockItem | null>
  restore(userId: string, id: number): Promise<DockItem | null>
  reopen(userId: string, id: number): Promise<DockItem | null>
  suggest(userId: string, id: number): Promise<DockItem | null>
}

export interface EntryRepository {
  findById(userId: string, id: number): Promise<DomainEntry | null>
  findByDockItemId(userId: string, dockItemId: number): Promise<DomainEntry | null>
  listByUser(userId: string): Promise<DomainEntry[]>
  listByType(userId: string, type: string): Promise<DomainEntry[]>
  listByTag(userId: string, tag: string): Promise<DomainEntry[]>
  listByProject(userId: string, project: string): Promise<DomainEntry[]>
  update(userId: string, entryId: number, updates: EntryUpdate): Promise<DomainEntry | null>
}

export interface TagRepository {
  findById(userId: string, id: string): Promise<DomainTag | null>
  findByName(userId: string, name: string): Promise<DomainTag | null>
  listByUser(userId: string): Promise<DomainTag[]>
  create(userId: string, name: string): Promise<DomainTag | null>
  getOrCreate(userId: string, name: string): Promise<DomainTag | null>
}

export interface StatsRepository {
  getWorkspaceStats(userId: string): Promise<WorkspaceStats>
}
