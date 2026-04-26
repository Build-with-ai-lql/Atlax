export type CollectionType = 'folder' | 'project' | 'topic' | 'archive' | 'smart'

export interface Collection {
  id: string
  userId: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  parentId: string | null
  sortOrder: number
  collectionType: CollectionType
  createdAt: Date
  updatedAt: Date
}

export type EntryRelationType =
  | 'related'
  | 'parent'
  | 'child'
  | 'reference'
  | 'follow_up'
  | 'same_topic'
  | 'same_project'
  | 'custom'

export type RelationDirection = 'directed' | 'undirected'
export type RelationSource = 'user' | 'system' | 'import'

export interface EntryRelation {
  id: string
  userId: string
  sourceEntryId: number
  targetEntryId: number
  relationType: EntryRelationType
  direction: RelationDirection
  source: RelationSource
  confidence: number | null
  reason: string | null
  createdAt: Date
  updatedAt: Date
}

export type TagRelationSource = 'user' | 'system' | 'import'

export interface EntryTagRelation {
  id: string
  userId: string
  entryId: number
  tagId: string
  source: TagRelationSource
  confidence: number | null
  createdAt: Date
}

export type KnowledgeEventType =
  | 'relation_created'
  | 'relation_deleted'
  | 'entry_moved'
  | 'tag_applied'
  | 'tag_removed'
  | 'world_tree_opened'
  | 'temporal_activity_created'
  | 'collection_created'
  | 'collection_updated'

export type KnowledgeEventTargetType =
  | 'entry'
  | 'tag'
  | 'collection'
  | 'relation'
  | 'view'

export interface KnowledgeEvent {
  id: string
  userId: string
  eventType: KnowledgeEventType
  targetType: KnowledgeEventTargetType
  targetId: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export type TemporalActivityType =
  | 'dock_created'
  | 'entry_archived'
  | 'entry_updated'
  | 'entry_viewed'
  | 'entry_reopened'
  | 'tag_created'
  | 'tag_applied'
  | 'relation_created'
  | 'relation_deleted'
  | 'review_generated'
  | 'import_completed'

export type TemporalActivityEntityType =
  | 'dockItem'
  | 'entry'
  | 'tag'
  | 'relation'
  | 'review'
  | 'importBatch'

export interface TemporalActivity {
  id: string
  userId: string
  type: TemporalActivityType
  entityType: TemporalActivityEntityType
  entityId: string
  occurredAt: Date
  dayKey: string
  weekKey: string
  monthKey: string
  title: string
  summary: string | null
  tagIds: string[]
  projectIds: string[]
  metadata: Record<string, unknown> | null
}

export interface StructureProjection {
  root: StructureRootNode
  collections: StructureCollectionNode[]
  entries: StructureEntryNode[]
  tags: StructureTagNode[]
  relations: StructureRelationEdge[]
  orphans: number[]
}

export interface StructureRootNode {
  userId: string
  totalEntries: number
  totalTags: number
  totalCollections: number
  totalRelations: number
}

export interface StructureCollectionNode {
  collectionId: string
  name: string
  collectionType: CollectionType
  parentId: string | null
  entryCount: number
  childCollectionIds: string[]
}

export interface StructureEntryNode {
  entryId: number
  title: string
  type: string
  tags: string[]
  project: string | null
  primaryCollectionId: string | null
  archivedAt: Date
  relationCount: number
}

export interface StructureTagNode {
  tagId: string
  name: string
  entryCount: number
}

export interface StructureRelationEdge {
  relationId: string
  sourceEntryId: number
  targetEntryId: number
  relationType: EntryRelationType
  source: RelationSource
  confidence: number | null
}

export interface ViewState {
  userId: string
  defaultView: 'finder' | 'table' | 'graph_tree' | 'calendar'
  lastView: 'finder' | 'table' | 'graph_tree' | 'calendar'
  sidebarCollapsed: boolean
  inspectorVisible: boolean
  updatedAt: Date
}

export function computeTemporalKeys(date: Date): {
  dayKey: string
  weekKey: string
  monthKey: string
} {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dayKey = `${year}-${month}-${day}`

  const janFirst = new Date(year, 0, 1)
  const dayOfYear = Math.floor(
    (date.getTime() - janFirst.getTime()) / (24 * 60 * 60 * 1000),
  )
  const weekNum = Math.ceil((dayOfYear + janFirst.getDay() + 1) / 7)
  const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`

  const monthKey = `${year}-${month}`

  return { dayKey, weekKey, monthKey }
}

export function makeCollectionId(userId: string, name: string): string {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, '_')
  return `${userId}_col_${normalized}`
}

export function makeEntryRelationId(
  userId: string,
  sourceEntryId: number,
  targetEntryId: number,
  relationType: EntryRelationType,
): string {
  return `${userId}_rel_${sourceEntryId}_${targetEntryId}_${relationType}`
}

export function makeEntryTagRelationId(
  userId: string,
  entryId: number,
  tagId: string,
): string {
  return `${userId}_etr_${entryId}_${tagId}`
}

export function makeKnowledgeEventId(
  userId: string,
  eventType: KnowledgeEventType,
  timestamp: number,
): string {
  return `${userId}_evt_${eventType}_${timestamp}`
}

export function makeTemporalActivityId(
  userId: string,
  type: TemporalActivityType,
  entityId: string,
  timestamp: number,
): string {
  return `${userId}_ta_${type}_${entityId}_${timestamp}`
}
