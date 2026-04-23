import type { DockItem } from '../ports/repository'

export interface DockItemTextUpdate {
  dockItemId: number
  newText: string
}

export interface DockItemUpdateResult {
  success: boolean
  dockItem: DockItem | null
}

export function buildDockItemReset(update: DockItemTextUpdate): Partial<DockItem> {
  return {
    rawText: update.newText,
    status: 'pending',
    suggestions: [],
    processedAt: null,
  }
}

export function applyTextUpdateToDockItem(dockItem: DockItem, newText: string): DockItem {
  return {
    ...dockItem,
    rawText: newText,
    status: 'pending',
    suggestions: [],
    processedAt: null,
  }
}
