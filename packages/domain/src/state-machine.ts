import type { EntryStatus } from './types'

export const VALID_TRANSITIONS: Record<EntryStatus, EntryStatus[]> = {
  pending: ['suggested', 'ignored'],
  suggested: ['suggested', 'archived', 'ignored'],
  archived: ['reopened'],
  ignored: ['pending'],
  reopened: ['suggested', 'ignored', 'archived'],
}

export function canTransition(current: EntryStatus, target: EntryStatus): boolean {
  return VALID_TRANSITIONS[current].includes(target)
}
