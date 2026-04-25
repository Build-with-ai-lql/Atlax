export interface EditSavePolicyInput {
  dockItemId: number
  newText: string
  currentRawText: string
  currentStatus: string
  isLongContent: boolean
}

export interface EditSavePolicyOutput {
  shouldResetSuggestions: boolean
  shouldResetStatus: boolean
  newStatus: 'pending' | 'suggested' | 'archived' | 'ignored' | 'reopened'
  preserveSelectedActions: boolean
  preserveSelectedProject: boolean
}

export interface EditSavePolicy {
  evaluate(input: EditSavePolicyInput): EditSavePolicyOutput
}

export const defaultEditSavePolicy: EditSavePolicy = {
  evaluate(input: EditSavePolicyInput): EditSavePolicyOutput {
    const textChanged = input.currentRawText !== input.newText

    return {
      shouldResetSuggestions: textChanged,
      shouldResetStatus: textChanged,
      newStatus: textChanged ? 'pending' : (input.currentStatus as EditSavePolicyOutput['newStatus']),
      preserveSelectedActions: true,
      preserveSelectedProject: true,
    }
  },
}

export function applyEditSavePolicy(
  input: EditSavePolicyInput,
  policy: EditSavePolicy = defaultEditSavePolicy,
): EditSavePolicyOutput {
  return policy.evaluate(input)
}

export function buildEditSavePatch(
  input: EditSavePolicyInput,
  policy: EditSavePolicy = defaultEditSavePolicy,
): Record<string, unknown> {
  const result = applyEditSavePolicy(input)

  const patch: Record<string, unknown> = {
    rawText: input.newText,
  }

  if (result.shouldResetSuggestions) {
    patch.suggestions = []
  }

  if (result.shouldResetStatus) {
    patch.status = result.newStatus
  }

  if (result.shouldResetSuggestions) {
    patch.processedAt = null
  }

  return patch
}

export interface ArchivedEntryEditInput {
  entryId: number
  sourceDockItemId: number
  newContent: string
  currentContent: string
  currentTags: string[]
  currentProject: string | null
  currentActions: string[]
}

export interface ArchivedEntryEditOutput {
  shouldUpdateContent: boolean
  shouldSyncTagsToDockItem: boolean
  preserveProject: boolean
  preserveActions: boolean
  newContent: string
}

export const defaultArchivedEntryEditPolicy = {
  evaluate(input: ArchivedEntryEditInput): ArchivedEntryEditOutput {
    const contentChanged = input.currentContent !== input.newContent

    return {
      shouldUpdateContent: contentChanged,
      shouldSyncTagsToDockItem: true,
      preserveProject: true,
      preserveActions: true,
      newContent: input.newContent,
    }
  },
}

export function applyArchivedEntryEditPolicy(
  input: ArchivedEntryEditInput,
): ArchivedEntryEditOutput {
  return defaultArchivedEntryEditPolicy.evaluate(input)
}

export function isLongContent(content: string): boolean {
  return content.length > 500
}

export function getEditContentType(content: string): 'short' | 'long' {
  return isLongContent(content) ? 'long' : 'short'
}

export function getSavePathDescription(): string {
  return [
    '短内容（inline）和长内容（fullscreen）共用同一个 domain/repository update path',
    '编辑文本后，suggestions 会被重置，status 会回退到 pending',
    '用户需要重新触发 suggest 才能获得新的建议',
    'selectedActions 和 selectedProject 会被保留',
    '这是一个确定性行为，由 EditSavePolicy 控制',
  ].join('\n')
}