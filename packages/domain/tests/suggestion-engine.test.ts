import { describe, expect, it } from 'vitest'

import { generateSuggestions } from '../src'

describe('generateSuggestions', () => {
  it('generates deterministic suggestions for the same input', () => {
    const entry = {
      id: 1,
      rawText: '明天下午3点有个会议，讨论产品需求',
      createdAt: new Date('2026-04-20T08:00:00.000Z'),
    }

    const first = generateSuggestions(entry)
    const second = generateSuggestions(entry)

    expect(second).toEqual(first)
  })

  it('falls back to note when no category rule matches', () => {
    const result = generateSuggestions({
      id: 2,
      rawText: '今天整理桌面',
      createdAt: new Date('2026-04-20T08:00:00.000Z'),
    })

    expect(result.suggestions[0]).toMatchObject({
      type: 'category',
      label: 'note',
    })
  })

  it('matches tags and actions from rules', () => {
    const result = generateSuggestions({
      id: 3,
      rawText: 'todo: 完成技术架构设计文档，明天评审',
      createdAt: new Date('2026-04-20T08:00:00.000Z'),
    })

    expect(result.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'category', label: 'task' }),
        expect.objectContaining({ type: 'tag', label: '技术' }),
        expect.objectContaining({ type: 'action', label: '待办提取' }),
        expect.objectContaining({ type: 'action', label: '加入日程' }),
      ])
    )
  })

  it('populates reason field on all suggestions', () => {
    const result = generateSuggestions({
      id: 4,
      rawText: '明天产品评审会议，需要准备技术架构文档',
      createdAt: new Date('2026-04-20T08:00:00.000Z'),
    })

    for (const suggestion of result.suggestions) {
      expect(suggestion.reason).toBeDefined()
      expect(typeof suggestion.reason).toBe('string')
      expect(suggestion.reason?.length).toBeGreaterThan(0)
    }
  })

  it('category suggestion includes reason', () => {
    const result = generateSuggestions({
      id: 5,
      rawText: '会议讨论产品路线图',
      createdAt: new Date('2026-04-20T08:00:00.000Z'),
    })

    const category = result.suggestions.find((s) => s.type === 'category')
    expect(category).toBeDefined()
    expect(category?.reason).toBe('包含会议相关关键词')
  })

  it('returns correct metadata', () => {
    const entry = {
      id: 6,
      rawText: '测试内容',
      createdAt: new Date('2026-04-20T08:00:00.000Z'),
    }
    const result = generateSuggestions(entry)

    expect(result.dockItemId).toBe(6)
    expect(result.engineVersion).toBe('1.0.0')
    expect(result.generatedAt).toBeInstanceOf(Date)
  })
})
