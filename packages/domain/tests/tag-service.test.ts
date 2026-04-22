import { describe, expect, it } from 'vitest'

import {
  createTag,
  dedupeTagNames,
  extractSuggestedTagNames,
  isValidTagName,
  makeTagId,
  normalizeTagName,
  resolveTags,
} from '../src'

describe('normalizeTagName', () => {
  it('trims whitespace', () => {
    expect(normalizeTagName('  技术  ')).toBe('技术')
  })

  it('collapses internal whitespace', () => {
    expect(normalizeTagName('机器  学习')).toBe('机器 学习')
  })

  it('truncates to 50 characters', () => {
    const long = 'a'.repeat(60)
    expect(normalizeTagName(long).length).toBe(50)
  })
})

describe('isValidTagName', () => {
  it('accepts valid names', () => {
    expect(isValidTagName('技术')).toBe(true)
  })

  it('rejects empty names', () => {
    expect(isValidTagName('')).toBe(false)
    expect(isValidTagName('   ')).toBe(false)
  })

  it('accepts names at exactly 50 characters', () => {
    expect(isValidTagName('a'.repeat(50))).toBe(true)
  })
})

describe('makeTagId', () => {
  it('produces deterministic ids', () => {
    expect(makeTagId('技术')).toBe(makeTagId('技术'))
  })

  it('produces different ids for different names', () => {
    expect(makeTagId('技术')).not.toBe(makeTagId('产品'))
  })

  it('is case-insensitive', () => {
    expect(makeTagId('Tech')).toBe(makeTagId('tech'))
  })
})

describe('createTag', () => {
  it('creates a tag with valid name', () => {
    const tag = createTag('技术')
    expect(tag).not.toBeNull()
    const unwrapped = tag as NonNullable<typeof tag>
    expect(unwrapped.name).toBe('技术')
    expect(unwrapped.id).toMatch(/^tag:/)
    expect(unwrapped.createdAt).toBeInstanceOf(Date)
  })

  it('returns null for empty name', () => {
    expect(createTag('')).toBeNull()
  })
})

describe('dedupeTagNames', () => {
  it('removes duplicates preserving order', () => {
    expect(dedupeTagNames(['技术', '产品', '技术', '产品'])).toEqual(['技术', '产品'])
  })

  it('is case-insensitive', () => {
    expect(dedupeTagNames(['Tech', 'tech'])).toEqual(['Tech'])
  })

  it('returns empty for empty input', () => {
    expect(dedupeTagNames([])).toEqual([])
  })
})

describe('extractSuggestedTagNames', () => {
  it('extracts labels from tag suggestions', () => {
    const grouped = {
      category: null,
      tags: [
        { id: '1:tag:技术', type: 'tag' as const, label: '技术', confidence: 0.8 },
        { id: '1:tag:产品', type: 'tag' as const, label: '产品', confidence: 0.7 },
      ],
      actions: [],
      projects: [],
    }
    expect(extractSuggestedTagNames(grouped)).toEqual(['技术', '产品'])
  })
})

describe('resolveTags', () => {
  it('user tags take priority over suggested', () => {
    const result = resolveTags(['技术', '产品'], ['技术'])
    expect(result.userSelected).toEqual(['技术'])
    expect(result.suggested).toEqual(['技术', '产品'])
    expect(result.final).toEqual(['技术', '产品'])
  })

  it('deduplicates case-insensitively', () => {
    const result = resolveTags(['Tech'], ['tech'])
    expect(result.final).toEqual(['tech'])
  })

  it('merges user and suggested tags', () => {
    const result = resolveTags(['产品'], ['技术'])
    expect(result.final).toEqual(['技术', '产品'])
  })
})
