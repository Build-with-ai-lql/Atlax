import type { DockItem } from '../ports/repository'

export interface SuggestionResetInput {
  dockItemId: number
  currentRawText: string
  newRawText: string
  currentStatus: string
  currentSuggestions: unknown[]
  currentProcessedAt: Date | null
}

export interface SuggestionResetOutput {
  rawText: string
  status: 'pending'
  suggestions: []
  processedAt: null
}

export interface SuggestionResetPolicy {
  shouldReset(input: SuggestionResetInput): boolean
  buildResetPatch(input: SuggestionResetInput): SuggestionResetOutput
}

export const defaultSuggestionResetPolicy: SuggestionResetPolicy = {
  shouldReset(input: SuggestionResetInput): boolean {
    return input.currentRawText !== input.newRawText
  },

  buildResetPatch(input: SuggestionResetInput): SuggestionResetOutput {
    return {
      rawText: input.newRawText,
      status: 'pending',
      suggestions: [],
      processedAt: null,
    }
  },
}

export function applySuggestionResetPolicy(
  input: SuggestionResetInput,
  policy: SuggestionResetPolicy = defaultSuggestionResetPolicy,
): SuggestionResetOutput | null {
  if (!policy.shouldReset(input)) {
    return null
  }
  return policy.buildResetPatch(input)
}

export function buildSuggestionResetPatch(
  dockItemId: number,
  newText: string,
): SuggestionResetOutput {
  return defaultSuggestionResetPolicy.buildResetPatch({
    dockItemId,
    currentRawText: '',
    newRawText: newText,
    currentStatus: '',
    currentSuggestions: [],
    currentProcessedAt: null,
  })
}
