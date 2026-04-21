import type { GroupedSuggestions, SuggestionItem } from './types'

export function groupSuggestionsByType(suggestions: SuggestionItem[]): GroupedSuggestions {
  return suggestions.reduce<GroupedSuggestions>(
    (grouped, suggestion) => {
      switch (suggestion.type) {
        case 'category':
          if (!grouped.category) {
            grouped.category = suggestion
          }
          break
        case 'tag':
          grouped.tags.push(suggestion)
          break
        case 'action':
          grouped.actions.push(suggestion)
          break
        case 'project':
          grouped.projects.push(suggestion)
          break
      }

      return grouped
    },
    {
      category: null,
      tags: [],
      actions: [],
      projects: [],
    }
  )
}
