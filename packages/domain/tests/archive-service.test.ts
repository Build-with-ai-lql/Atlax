import { describe, expect, it } from 'vitest'

import { buildEntryFromArchive } from '../src'

describe('buildEntryFromArchive', () => {
  const baseInput = {
    dockItemId: 42,
    rawText: '下周产品评审会议，需要准备 Q2 路线图',
    suggestions: [
      { id: '42:category:meeting', type: 'category' as const, label: 'meeting', confidence: 0.9, reason: '包含会议相关关键词' },
      { id: '42:tag:产品', type: 'tag' as const, label: '产品', confidence: 0.8, reason: '包含产品相关关键词' },
      { id: '42:tag:项目管理', type: 'tag' as const, label: '项目管理', confidence: 0.75, reason: '包含项目管理关键词' },
      { id: '42:action:待办提取', type: 'action' as const, label: '待办提取', confidence: 0.85, reason: '包含待办关键词' },
      { id: '42:project:关联项目', type: 'project' as const, label: '关联项目', confidence: 0.5, reason: '包含项目相关关键词' },
    ],
    userTags: ['产品'],
    topic: null as string | null,
    selectedProject: null,
    selectedActions: [] as string[],
    createdAt: new Date('2026-04-20T10:00:00.000Z'),
  }

  it('builds entry with title extracted from first line', () => {
    const entry = buildEntryFromArchive(baseInput, 1)
    expect(entry.title).toBe('下周产品评审会议，需要准备 Q2 路线图')
    expect(entry.id).toBe(1)
    expect(entry.sourceDockItemId).toBe(42)
  })

  it('uses topic as title when provided', () => {
    const input = {
      ...baseInput,
      topic: '这是自定义标题'
    }
    const entry = buildEntryFromArchive(input, 1)
    expect(entry.title).toBe('这是自定义标题')
  })

  it('resolves category from suggestions', () => {
    const entry = buildEntryFromArchive(baseInput, 1)
    expect(entry.type).toBe('meeting')
  })

  it('falls back to note category when no category suggestion', () => {
    const input = {
      ...baseInput,
      suggestions: [
        { id: '42:tag:技术', type: 'tag' as const, label: '技术', confidence: 0.8 },
      ],
    }
    const entry = buildEntryFromArchive(input, 1)
    expect(entry.type).toBe('note')
  })

  it('merges suggested tags with user tags (user takes priority)', () => {
    const entry = buildEntryFromArchive(baseInput, 1)
    expect(entry.tags).toContain('产品')
    expect(entry.tags).toContain('项目管理')
    expect(entry.tags.indexOf('产品')).toBeLessThan(entry.tags.indexOf('项目管理'))
  })

  it('resolves project from first project suggestion', () => {
    const entry = buildEntryFromArchive(baseInput, 1)
    expect(entry.project).toBe('关联项目')
  })

  it('sets project to null when no project suggestion', () => {
    const input = {
      ...baseInput,
      suggestions: [
        { id: '42:category:note', type: 'category' as const, label: 'note', confidence: 0.3 },
      ],
    }
    const entry = buildEntryFromArchive(input, 1)
    expect(entry.project).toBeNull()
  })

  it('resolves actions from action suggestions', () => {
    const entry = buildEntryFromArchive(baseInput, 1)
    expect(entry.actions).toEqual(['待办提取'])
  })

  it('truncates long first line for title', () => {
    const longText = 'a'.repeat(100)
    const input = { ...baseInput, rawText: longText }
    const entry = buildEntryFromArchive(input, 1)
    expect(entry.title.length).toBeLessThanOrEqual(63)
    expect(entry.title).toMatch(/…$/)
  })

  it('sets archivedAt to a valid date', () => {
    const entry = buildEntryFromArchive(baseInput, 1)
    expect(entry.archivedAt).toBeInstanceOf(Date)
    expect(entry.archivedAt.getTime()).toBeGreaterThan(0)
  })

  it('uses selectedProject over suggestion inferred project', () => {
    const input = {
      ...baseInput,
      selectedProject: 'MyCustomProject',
      selectedActions: [] as string[],
    }
    const entry = buildEntryFromArchive(input, 1)
    expect(entry.project).toBe('MyCustomProject')
  })

  it('uses selectedActions over suggestion inferred actions', () => {
    const input = {
      ...baseInput,
      selectedProject: null,
      selectedActions: ['自定义动作1', '自定义动作2'],
    }
    const entry = buildEntryFromArchive(input, 1)
    expect(entry.actions).toEqual(['自定义动作1', '自定义动作2'])
  })

  it('falls back to suggestion inferred project when selectedProject is null', () => {
    const input = {
      ...baseInput,
      selectedProject: null,
      selectedActions: [] as string[],
    }
    const entry = buildEntryFromArchive(input, 1)
    expect(entry.project).toBe('关联项目')
  })

  it('falls back to suggestion inferred actions when selectedActions is empty', () => {
    const input = {
      ...baseInput,
      selectedProject: null,
      selectedActions: [] as string[],
    }
    const entry = buildEntryFromArchive(input, 1)
    expect(entry.actions).toEqual(['待办提取'])
  })
})
