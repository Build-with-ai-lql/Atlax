import type { DockItem } from '../ports/repository'

export type ChainRelationType = 'reorganize' | 'continue_edit' | 'derive'

export interface ChainLink {
  itemId: number
  sourceId: number | null
  parentId: number | null
}

export interface ChainProvenance {
  itemId: number
  sourceId: number | null
  parentId: number | null
  relationType: ChainRelationType
  sourceTitle: string | null
  parentTitle: string | null
}

export function resolveChainRelation(item: DockItem): ChainRelationType {
  if (item.sourceId !== null && item.parentId === null) {
    return 'reorganize'
  }
  if (item.sourceId !== null && item.parentId !== null && item.sourceId === item.parentId) {
    return 'continue_edit'
  }
  if (item.parentId !== null) {
    return 'derive'
  }
  return 'reorganize'
}

export function buildChainLink(
  itemId: number,
  sourceId: number | null,
  parentId: number | null,
): ChainLink {
  return { itemId, sourceId, parentId }
}

export function buildReorganizeLink(itemId: number, sourceId: number): ChainLink {
  return { itemId, sourceId, parentId: null }
}

export function buildContinueEditLink(itemId: number, sourceId: number): ChainLink {
  return { itemId, sourceId, parentId: sourceId }
}

export function buildDeriveLink(itemId: number, parentId: number, sourceId?: number | null): ChainLink {
  return { itemId, sourceId: sourceId ?? null, parentId }
}

export function getChainLinkFromDockItem(item: DockItem): ChainLink {
  return {
    itemId: item.id,
    sourceId: item.sourceId,
    parentId: item.parentId,
  }
}

export function isRootItem(item: DockItem): boolean {
  return item.sourceId === null && item.parentId === null
}

export function hasChainLink(item: DockItem): boolean {
  return item.sourceId !== null || item.parentId !== null
}

export function buildProvenance(
  item: DockItem,
  findItemById: (id: number) => DockItem | null,
): ChainProvenance {
  const sourceItem = item.sourceId !== null ? findItemById(item.sourceId) : null
  const parentItem = item.parentId !== null ? findItemById(item.parentId) : null

  return {
    itemId: item.id,
    sourceId: item.sourceId,
    parentId: item.parentId,
    relationType: resolveChainRelation(item),
    sourceTitle: sourceItem ? sourceItem.rawText.split('\n')[0]?.slice(0, 60) ?? null : null,
    parentTitle: parentItem ? parentItem.rawText.split('\n')[0]?.slice(0, 60) ?? null : null,
  }
}

export interface ChainLinkUpdateInput {
  sourceId: number | null
  parentId: number | null
}

export interface ChainLinkValidationContext {
  currentItemId: number
  userId: string
  sourceId: number | null
  parentId: number | null
  findItemById: (userId: string, id: number) => Promise<{ id: number; userId: string } | null>
}

export interface ChainLinkValidationResult {
  valid: boolean
  reason?: string
}

export function validateChainLinkUpdate(
  current: DockItem,
  update: ChainLinkUpdateInput,
): ChainLinkValidationResult {
  if (update.sourceId === current.id) {
    return { valid: false, reason: 'sourceId cannot reference self' }
  }
  if (update.parentId === current.id) {
    return { valid: false, reason: 'parentId cannot reference self' }
  }
  return { valid: true }
}

export async function validateChainLinkWithContext(
  ctx: ChainLinkValidationContext,
): Promise<ChainLinkValidationResult> {
  if (ctx.sourceId !== null && ctx.sourceId === ctx.currentItemId) {
    return { valid: false, reason: 'sourceId cannot reference self' }
  }
  if (ctx.parentId !== null && ctx.parentId === ctx.currentItemId) {
    return { valid: false, reason: 'parentId cannot reference self' }
  }

  if (ctx.sourceId !== null) {
    const sourceItem = await ctx.findItemById(ctx.userId, ctx.sourceId)
    if (sourceItem === null) {
      return { valid: false, reason: 'sourceId does not exist or does not belong to user' }
    }
  }

  if (ctx.parentId !== null) {
    const parentItem = await ctx.findItemById(ctx.userId, ctx.parentId)
    if (parentItem === null) {
      return { valid: false, reason: 'parentId does not exist or does not belong to user' }
    }
  }

  return { valid: true }
}
