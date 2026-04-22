import type { EntryStatus } from './types'

export const VALID_TRANSITIONS: Record<EntryStatus, EntryStatus[]> = {
  pending: ['suggested', 'ignored'],
  suggested: ['archived', 'ignored'],
  archived: ['reopened'],
  ignored: ['pending'],
  reopened: ['suggested', 'ignored'],
}

export function canTransition(current: EntryStatus, target: EntryStatus): boolean {
  return VALID_TRANSITIONS[current].includes(target)
}
