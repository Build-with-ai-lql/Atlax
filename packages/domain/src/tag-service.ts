import type { GroupedSuggestions, ResolvedTags, Tag } from './types'

export function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, 50)
}

export function isValidTagName(name: string): boolean {
  const normalized = normalizeTagName(name)
  return normalized.length > 0 && normalized.length <= 50
}

export function makeTagId(name: string): string {
  const normalized = normalizeTagName(name)
  const lower = normalized.toLowerCase()
  let hash = 0
  for (let i = 0; i < lower.length; i++) {
    const chr = lower.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return `tag:${Math.abs(hash).toString(36)}`
}

export function createTag(name: string): Tag | null {
  if (!isValidTagName(name)) return null
  return {
    id: makeTagId(name),
    name: normalizeTagName(name),
    createdAt: new Date(),
  }
}

export function dedupeTagNames(names: string[]): string[] {
  const seen = new Set<string>()
  return names.filter((name) => {
    const lower = name.toLowerCase()
    if (seen.has(lower)) return false
    seen.add(lower)
    return true
  })
}

export function extractSuggestedTagNames(grouped: GroupedSuggestions): string[] {
  return grouped.tags.map((t) => t.label)
}

export function resolveTags(
  suggestedTagNames: string[],
  userSelectedTags: string[],
): ResolvedTags {
  const userSet = new Set(userSelectedTags.map((t) => t.toLowerCase()))
  const filteredSuggestions = suggestedTagNames.filter(
    (t) => !userSet.has(t.toLowerCase())
  )
  const finalTags = dedupeTagNames([...userSelectedTags, ...filteredSuggestions])

  return {
    suggested: suggestedTagNames,
    userSelected: userSelectedTags,
    final: finalTags,
  }
}
