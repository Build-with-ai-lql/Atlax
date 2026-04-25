import { describe, expect, it } from 'vitest'

import { sanitizeSuggestionLabel } from '../src/types'

describe('sanitizeSuggestionLabel', () => {
  it('removes newline characters', () => {
    expect(sanitizeSuggestionLabel('hello\nworld')).toBe('hello world')
    expect(sanitizeSuggestionLabel('tag\n\nname')).toBe('tag name')
  })

  it('removes carriage return characters', () => {
    expect(sanitizeSuggestionLabel('hello\rworld')).toBe('hello world')
    expect(sanitizeSuggestionLabel('tag\r\rname')).toBe('tag name')
  })

  it('removes tab characters', () => {
    expect(sanitizeSuggestionLabel('hello\tworld')).toBe('hello world')
    expect(sanitizeSuggestionLabel('tag\t\tname')).toBe('tag name')
  })

  it('collapses multiple whitespace into single space', () => {
    expect(sanitizeSuggestionLabel('hello   world')).toBe('hello world')
    expect(sanitizeSuggestionLabel('tag    name')).toBe('tag name')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeSuggestionLabel('  hello world  ')).toBe('hello world')
    expect(sanitizeSuggestionLabel('\t\n  tag name  \n\t')).toBe('tag name')
  })

  it('preserves normal Chinese labels', () => {
    expect(sanitizeSuggestionLabel('产品')).toBe('产品')
    expect(sanitizeSuggestionLabel('技术')).toBe('技术')
    expect(sanitizeSuggestionLabel('项目管理')).toBe('项目管理')
    expect(sanitizeSuggestionLabel('待整理')).toBe('待整理')
  })

  it('preserves normal English labels', () => {
    expect(sanitizeSuggestionLabel('meeting')).toBe('meeting')
    expect(sanitizeSuggestionLabel('task')).toBe('task')
    expect(sanitizeSuggestionLabel('work')).toBe('work')
  })

  it('handles mixed content with special characters', () => {
    expect(sanitizeSuggestionLabel('产品\n需求')).toBe('产品 需求')
    expect(sanitizeSuggestionLabel('技术\t架构')).toBe('技术 架构')
    expect(sanitizeSuggestionLabel('项目\r管理')).toBe('项目 管理')
  })

  it('truncates to 100 characters', () => {
    const longLabel = 'a'.repeat(150)
    const result = sanitizeSuggestionLabel(longLabel)
    expect(result.length).toBe(100)
    expect(result).toBe('a'.repeat(100))
  })

  it('handles empty string', () => {
    expect(sanitizeSuggestionLabel('')).toBe('')
  })

  it('handles string with only whitespace', () => {
    expect(sanitizeSuggestionLabel('   ')).toBe('')
    expect(sanitizeSuggestionLabel('\n\t\r')).toBe('')
  })

  it('handles complex real-world cases', () => {
    expect(sanitizeSuggestionLabel('产品\n\t需求分析')).toBe('产品 需求分析')
    expect(sanitizeSuggestionLabel('技术\r\n架构设计')).toBe('技术 架构设计')
  })
})