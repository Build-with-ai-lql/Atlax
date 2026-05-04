import type { EntryStatus, SourceType, SuggestionItem } from '../types'
import type { Entry as DomainEntry, Tag as DomainTag } from '../types'
import type { Document, DocumentType, DocumentUpdateInput } from '../document/types'
import type { MindNode, MindEdge, MindNodeType } from '../mind/types'

export type DockItemId = number
export type UserId = string
export type ChatSessionId = number
export type DocumentId = number
export type MindNodeId = string
export type MindEdgeId = string

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export type ChatSessionStatus = 'active' | 'confirmed' | 'cancelled'

export interface ChatSession {
  id: number
  userId: string
  title: string | null
  topic: string | null
  selectedType: string | null
  content: string
  status: ChatSessionStatus
  pinned: boolean
  messages: ChatMessage[]
  dockItemId: number | null
  createdAt: Date
  updatedAt: Date
}

export interface ChatSessionCreateInput {
  userId: string
  title?: string | null
  topic?: string | null
  selectedType?: string | null
  content?: string
  messages?: ChatMessage[]
  pinned?: boolean
  dockItemId?: number | null
}

export interface ChatSessionUpdateInput {
  title?: string | null
  topic?: string | null
  selectedType?: string | null
  content?: string
  status?: ChatSessionStatus
  messages?: ChatMessage[]
  pinned?: boolean
  dockItemId?: number | null
}

export interface DockItem {
  id: number
  userId: string
  rawText: string
  topic: string | null
  sourceType: SourceType
  status: EntryStatus
  suggestions: SuggestionItem[]
  userTags: string[]
  selectedActions: string[]
  selectedProject: string | null
  sourceId: number | null
  parentId: number | null
  processedAt: Date | null
  createdAt: Date
}

export type PersistedEntry = DomainEntry & { userId: string }
export type PersistedDocument = Document & { userId: string }
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
  updateSelectedActions(userId: string, id: number, actions: string[]): Promise<DockItem | null>
  updateSelectedProject(userId: string, id: number, project: string | null): Promise<DockItem | null>
  updateChainLinks(userId: string, id: number, sourceId: number | null, parentId: number | null): Promise<DockItem | null>
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

export interface DocumentRepository {
  findById(userId: string, id: number): Promise<Document | null>
  findByCaptureId(userId: string, captureId: number): Promise<Document | null>
  listByUser(userId: string): Promise<Document[]>
  listByType(userId: string, type: DocumentType): Promise<Document[]>
  listByTag(userId: string, tag: string): Promise<Document[]>
  listByProject(userId: string, project: string): Promise<Document[]>
  update(userId: string, documentId: number, updates: DocumentUpdateInput): Promise<Document | null>
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

export interface ChatSessionRepository {
  create(input: ChatSessionCreateInput): Promise<ChatSession>
  findById(userId: string, id: ChatSessionId): Promise<ChatSession | null>
  listByUser(userId: string): Promise<ChatSession[]>
  listActiveByUser(userId: string): Promise<ChatSession[]>
  update(userId: string, id: ChatSessionId, updates: ChatSessionUpdateInput): Promise<ChatSession | null>
  delete(userId: string, id: ChatSessionId): Promise<boolean>
  addMessage(userId: string, id: ChatSessionId, message: ChatMessage): Promise<ChatSession | null>
}

export interface MindNodeRepository {
  findById(userId: string, id: MindNodeId): Promise<MindNode | null>
  listByUser(userId: string): Promise<MindNode[]>
  listByType(userId: string, nodeType: MindNodeType): Promise<MindNode[]>
  upsert(node: MindNode): Promise<MindNode>
  delete(userId: string, id: MindNodeId): Promise<boolean>
}

export interface MindEdgeRepository {
  findById(userId: string, id: MindEdgeId): Promise<MindEdge | null>
  listByUser(userId: string): Promise<MindEdge[]>
  listBySourceNode(userId: string, sourceNodeId: MindNodeId): Promise<MindEdge[]>
  listByTargetNode(userId: string, targetNodeId: MindNodeId): Promise<MindEdge[]>
  upsert(edge: MindEdge): Promise<MindEdge>
  delete(userId: string, id: MindEdgeId): Promise<boolean>
}

export function isValidChatSessionInput(input: ChatSessionCreateInput): boolean {
  const hasUserMessage = input.messages?.some((m) => m.role === 'user' && m.content.trim().length > 0) ?? false
  const hasTopic = input.topic !== undefined && input.topic !== null && input.topic.trim().length > 0
  const hasType = input.selectedType !== undefined && input.selectedType !== null && input.selectedType.trim().length > 0
  const hasContent = input.content !== undefined && input.content.trim().length > 0

  return hasUserMessage || hasTopic || hasType || hasContent
}
