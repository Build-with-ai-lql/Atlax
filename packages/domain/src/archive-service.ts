import { resolveTags } from './tag-service'
import { groupSuggestionsByType } from './selectors'
import type { ArchiveInput, Entry, EntryType } from './types'

function extractTitle(rawText: string): string {
  const firstLine = rawText.split('\n')[0] ?? ''
  return firstLine.length > 60 ? firstLine.slice(0, 60) + '…' : firstLine
}

function resolveCategory(suggestions: ArchiveInput['suggestions']): EntryType {
  const grouped = groupSuggestionsByType(suggestions)
  if (grouped.category) {
    const label = grouped.category.label
    if (['note', 'meeting', 'idea', 'task', 'reading'].includes(label)) {
      return label as EntryType
    }
  }
  return 'note'
}

function resolveProject(suggestions: ArchiveInput['suggestions']): string | null {
  const grouped = groupSuggestionsByType(suggestions)
  return grouped.projects.length > 0 ? grouped.projects[0].label : null
}

function resolveActions(suggestions: ArchiveInput['suggestions']): string[] {
  const grouped = groupSuggestionsByType(suggestions)
  return grouped.actions.map((a) => a.label)
}

export function buildEntryFromArchive(input: ArchiveInput, assignedId: number): Entry {
  const grouped = groupSuggestionsByType(input.suggestions)
  const suggestedTagNames = grouped.tags.map((t) => t.label)
  const resolved = resolveTags(suggestedTagNames, input.userTags)

  return {
    id: assignedId,
    sourceDockItemId: input.dockItemId,
    title: extractTitle(input.rawText),
    content: input.rawText,
    type: resolveCategory(input.suggestions),
    tags: resolved.final,
    project: resolveProject(input.suggestions),
    actions: resolveActions(input.suggestions),
    createdAt: input.createdAt,
    archivedAt: new Date(),
  }
}