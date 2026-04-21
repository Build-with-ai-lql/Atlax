import { describe, expect, it } from 'vitest'

import { groupSuggestionsByType, type SuggestionItem } from '../src'

describe('groupSuggestionsByType', () => {
  it('groups suggestions by semantic type', () => {
    const suggestions: SuggestionItem[] = [
      { id: '1:category:task', type: 'category', label: 'task', confidence: 0.85 },
      { id: '1:tag:技术', type: 'tag', label: '技术', confidence: 0.8 },
      { id: '1:tag:产品', type: 'tag', label: '产品', confidence: 0.8 },
      { id: '1:action:待办提取', type: 'action', label: '待办提取', confidence: 0.85 },
      { id: '1:project:关联项目', type: 'project', label: '关联项目', confidence: 0.5 },
    ]

    const grouped = groupSuggestionsByType(suggestions)

    expect(grouped.category?.label).toBe('task')
    expect(grouped.tags.map((tag) => tag.label)).toEqual(['技术', '产品'])
    expect(grouped.actions.map((action) => action.label)).toEqual(['待办提取'])
    expect(grouped.projects.map((project) => project.label)).toEqual(['关联项目'])
  })
})
