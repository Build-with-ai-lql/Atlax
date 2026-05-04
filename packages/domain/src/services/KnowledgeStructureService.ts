import type {
  Collection,
  EntryRelation,
  EntryTagRelation,
  StructureProjection,
  StructureRootNode,
  StructureCollectionNode,
  StructureEntryNode,
  StructureTagNode,
  StructureRelationEdge,
} from './KnowledgeStructure'

export interface StructureQueryInput {
  entries: Array<{
    id: number
    userId: string
    title: string
    type: string
    tags: string[]
    project: string | null
    archivedAt: Date
  }>
  tags: Array<{
    id: string
    userId: string
    name: string
  }>
  collections: Collection[]
  entryTagRelations: EntryTagRelation[]
  entryRelations: EntryRelation[]
  userId: string
}

export function buildStructureProjection(input: StructureQueryInput): StructureProjection {
  const { entries, tags, collections, entryTagRelations, entryRelations, userId } = input

  const userEntries = entries.filter((e) => e.userId === userId)
  const userTags = tags.filter((t) => t.userId === userId)
  const userCollections = collections.filter((c) => c.userId === userId)
  const userTagRelations = entryTagRelations.filter((r) => r.userId === userId)
  const userEntryRelations = entryRelations.filter((r) => r.userId === userId)

  const tagEntryCount = new Map<string, number>()
  for (const rel of userTagRelations) {
    tagEntryCount.set(rel.tagId, (tagEntryCount.get(rel.tagId) ?? 0) + 1)
  }

  const entryRelationCount = new Map<number, number>()
  for (const rel of userEntryRelations) {
    entryRelationCount.set(rel.sourceEntryId, (entryRelationCount.get(rel.sourceEntryId) ?? 0) + 1)
    entryRelationCount.set(rel.targetEntryId, (entryRelationCount.get(rel.targetEntryId) ?? 0) + 1)
  }

  const collectionEntryCount = new Map<string, number>()
  const collectionChildIds = new Map<string, string[]>()
  for (const col of userCollections) {
    collectionEntryCount.set(col.id, 0)
    collectionChildIds.set(col.id, [])
  }
  for (const col of userCollections) {
    if (col.parentId) {
      const siblings = collectionChildIds.get(col.parentId) ?? []
      siblings.push(col.id)
      collectionChildIds.set(col.parentId, siblings)
    }
  }

  const root: StructureRootNode = {
    userId,
    totalEntries: userEntries.length,
    totalTags: userTags.length,
    totalCollections: userCollections.length,
    totalRelations: userEntryRelations.length,
  }

  const collectionNodes: StructureCollectionNode[] = userCollections.map((col) => ({
    collectionId: col.id,
    name: col.name,
    collectionType: col.collectionType,
    parentId: col.parentId,
    entryCount: collectionEntryCount.get(col.id) ?? 0,
    childCollectionIds: collectionChildIds.get(col.id) ?? [],
  }))

  const entryNodes: StructureEntryNode[] = userEntries.map((e) => ({
    entryId: e.id,
    title: e.title,
    type: e.type,
    tags: e.tags,
    project: e.project,
    primaryCollectionId: null,
    archivedAt: e.archivedAt,
    relationCount: entryRelationCount.get(e.id) ?? 0,
  }))

  const tagNodes: StructureTagNode[] = userTags.map((t) => ({
    tagId: t.id,
    name: t.name,
    entryCount: tagEntryCount.get(t.id) ?? 0,
  }))

  const relationEdges: StructureRelationEdge[] = userEntryRelations.map((r) => ({
    relationId: r.id,
    sourceEntryId: r.sourceEntryId,
    targetEntryId: r.targetEntryId,
    relationType: r.relationType,
    source: r.source,
    confidence: r.confidence,
  }))

  const entriesWithRelations = new Set<number>()
  for (const rel of userEntryRelations) {
    entriesWithRelations.add(rel.sourceEntryId)
    entriesWithRelations.add(rel.targetEntryId)
  }
  const entriesWithTagRelations = new Set<number>()
  for (const rel of userTagRelations) {
    entriesWithTagRelations.add(rel.entryId)
  }
  const entriesWithProject = new Set<number>()
  for (const e of userEntries) {
    if (e.project) entriesWithProject.add(e.id)
  }

  const orphans = userEntries
    .filter((e) =>
      !entriesWithRelations.has(e.id) &&
      !entriesWithTagRelations.has(e.id) &&
      !entriesWithProject.has(e.id),
    )
    .map((e) => e.id)

  return {
    root,
    collections: collectionNodes,
    entries: entryNodes,
    tags: tagNodes,
    relations: relationEdges,
    orphans,
  }
}

export function validateEntryRelationInput(input: {
  userId: string
  sourceEntryId: number
  targetEntryId: number
  findEntryById: (userId: string, entryId: number) => Promise<{ userId: string } | null>
}): Promise<{ valid: boolean; reason?: string }> {
  if (input.sourceEntryId === input.targetEntryId) {
    return Promise.resolve({ valid: false, reason: 'self_reference_not_allowed' })
  }

  return input.findEntryById(input.userId, input.sourceEntryId).then((source) => {
    if (!source) {
      return { valid: false, reason: 'source_entry_not_found' }
    }
    if (source.userId !== input.userId) {
      return { valid: false, reason: 'source_entry_cross_user' }
    }

    return input.findEntryById(input.userId, input.targetEntryId).then((target) => {
      if (!target) {
        return { valid: false, reason: 'target_entry_not_found' }
      }
      if (target.userId !== input.userId) {
        return { valid: false, reason: 'target_entry_cross_user' }
      }

      return { valid: true }
    })
  })
}

export function backfillEntryTagRelations(input: {
  entries: Array<{
    id: number
    userId: string
    tags: string[]
  }>
  tags: Array<{
    id: string
    userId: string
    name: string
  }>
  existingRelations: EntryTagRelation[]
  userId: string;
  makeId: (userId: string, entryId: number, tagId: string) => string;
  now: Date;
}): EntryTagRelation[] {
  const { entries, tags, existingRelations, userId, makeId, now } = input

  const existingKeys = new Set(
    existingRelations
      .filter((r) => r.userId === userId)
      .map((r) => `${r.entryId}:${r.tagId}`),
  )

  const tagNameToId = new Map<string, string>()
  for (const tag of tags.filter((t) => t.userId === userId)) {
    tagNameToId.set(tag.name.toLowerCase(), tag.id)
  }

  const newRelations: EntryTagRelation[] = []

  for (const entry of entries.filter((e) => e.userId === userId)) {
    for (const tagName of entry.tags) {
      const tagId = tagNameToId.get(tagName.toLowerCase())
      if (!tagId) continue

      const key = `${entry.id}:${tagId}`
      if (existingKeys.has(key)) continue

      newRelations.push({
        id: makeId(userId, entry.id, tagId),
        userId,
        entryId: entry.id,
        tagId,
        source: 'system',
        confidence: 1.0,
        createdAt: now,
      })
    }
  }

  return newRelations
}

export function backfillProjectCollections(input: {
  entries: Array<{
    id: number
    userId: string
    project: string | null
  }>
  existingCollections: Collection[]
  userId: string
  makeCollectionId: (userId: string, name: string) => string
  now: Date
}): Collection[] {
  const { entries, existingCollections, userId, makeCollectionId, now } = input

  const existingNames = new Set(
    existingCollections
      .filter((c) => c.userId === userId)
      .map((c) => c.name.toLowerCase()),
  )

  const projectNames = new Set<string>()
  for (const entry of entries.filter((e) => e.userId === userId)) {
    if (entry.project && entry.project.trim()) {
      projectNames.add(entry.project.trim())
    }
  }

  const newCollections: Collection[] = []
  const projectNamesArr = Array.from(projectNames)
  for (const projectName of projectNamesArr) {
    if (existingNames.has(projectName.toLowerCase())) continue

    newCollections.push({
      id: makeCollectionId(userId, projectName),
      userId,
      name: projectName,
      description: null,
      icon: null,
      color: null,
      parentId: null,
      sortOrder: 0,
      collectionType: 'project',
      createdAt: now,
      updatedAt: now,
    })
  }

  return newCollections
}
