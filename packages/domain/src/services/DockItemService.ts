import type { DockItem } from '../ports/repository'
import {
  defaultSuggestionResetPolicy,
  applySuggestionResetPolicy,
  type SuggestionResetPolicy,
  type SuggestionResetInput,
} from '../policies/SuggestionResetPolicy'

export interface DockItemTextUpdate {
  dockItemId: number
  newText: string
}

export interface DockItemUpdateResult {
  success: boolean
  dockItem: DockItem | null
}

export function buildDockItemReset(
  update: DockItemTextUpdate,
  policy: SuggestionResetPolicy = defaultSuggestionResetPolicy,
): Partial<DockItem> {
  const input: SuggestionResetInput = {
    dockItemId: update.dockItemId,
    currentRawText: '',
    newRawText: update.newText,
    currentStatus: '',
    currentSuggestions: [],
    currentProcessedAt: null,
  }
  return policy.buildResetPatch(input)
}

export function applyTextUpdateToDockItem(
  dockItem: DockItem,
  newText: string,
  policy: SuggestionResetPolicy = defaultSuggestionResetPolicy,
): DockItem {
  const input: SuggestionResetInput = {
    dockItemId: dockItem.id,
    currentRawText: dockItem.rawText,
    newRawText: newText,
    currentStatus: dockItem.status,
    currentSuggestions: dockItem.suggestions,
    currentProcessedAt: dockItem.processedAt,
  }
  const patch = applySuggestionResetPolicy(input, policy)
  if (!patch) {
    return dockItem
  }
  return {
    ...dockItem,
    ...patch,
  }
}
