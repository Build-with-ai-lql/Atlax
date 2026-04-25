import { describe, expect, it } from 'vitest'

import {
  applyEditorCommand,
  transformBold,
  transformCode,
  transformHeading,
  transformHighlight,
  transformItalic,
  transformLink,
  type TextSelection,
} from '../src/services/EditorCommandTransform'

function sel(start: number, end: number): TextSelection {
  return { text: '', start, end }
}

describe('EditorCommandTransform', () => {
  describe('transformBold', () => {
    it('wraps selected text with **', () => {
      const result = transformBold('hello world', sel(0, 5))
      expect(result.text).toBe('**hello** world')
      expect(result.selectionStart).toBe(2)
      expect(result.selectionEnd).toBe(7)
    })

    it('inserts placeholder when selection is empty', () => {
      const result = transformBold('hello world', sel(5, 5))
      expect(result.text).toBe('hello**文本** world')
      expect(result.selectionStart).toBe(7)
      expect(result.selectionEnd).toBe(9)
    })

    it('wraps Chinese content', () => {
      const result = transformBold('项目会议记录', sel(0, 4))
      expect(result.text).toBe('**项目会议**记录')
    })
  })

  describe('transformItalic', () => {
    it('wraps selected text with *', () => {
      const result = transformItalic('hello world', sel(0, 5))
      expect(result.text).toBe('*hello* world')
    })

    it('inserts placeholder when selection is empty', () => {
      const result = transformItalic('hello', sel(5, 5))
      expect(result.text).toBe('hello*文本*')
    })

    it('wraps Chinese content', () => {
      const result = transformItalic('产品需求分析', sel(2, 4))
      expect(result.text).toBe('产品*需求*分析')
    })
  })

  describe('transformCode', () => {
    it('wraps selected text with backticks', () => {
      const result = transformCode('use the foo function', sel(8, 11))
      expect(result.text).toBe('use the `foo` function')
    })

    it('inserts placeholder when selection is empty', () => {
      const result = transformCode('some code here', sel(5, 5))
      expect(result.text).toBe('some `文本`code here')
    })
  })

  describe('transformLink', () => {
    it('wraps selected text as link text', () => {
      const result = transformLink('click here for docs', sel(0, 10))
      expect(result.text).toBe('[click here](url) for docs')
      expect(result.selectionStart).toBe(13)
      expect(result.selectionEnd).toBe(16)
    })

    it('inserts placeholder when selection is empty', () => {
      const result = transformLink('check this out', sel(6, 6))
      expect(result.text).toBe('check [链接文本](url)this out')
      expect(result.selectionStart).toBe(7)
      expect(result.selectionEnd).toBe(11)
    })

    it('wraps Chinese link text', () => {
      const result = transformLink('查看文档了解更多', sel(2, 4))
      expect(result.text).toBe('查看[文档](url)了解更多')
    })
  })

  describe('transformHeading', () => {
    it('adds heading prefix at line start', () => {
      const result = transformHeading('hello world', sel(0, 5))
      expect(result.text).toBe('# hello world')
    })

    it('adds heading to current line when cursor is mid-line', () => {
      const result = transformHeading('first\nsecond line\nthird', sel(6, 12))
      expect(result.text).toBe('first\n# second line\nthird')
    })

    it('supports heading level 2', () => {
      const result = transformHeading('title', sel(0, 5), 2)
      expect(result.text).toBe('## title')
    })

    it('supports heading level 3', () => {
      const result = transformHeading('title', sel(0, 5), 3)
      expect(result.text).toBe('### title')
    })

    it('replaces existing heading prefix', () => {
      const result = transformHeading('## old heading', sel(0, 5), 1)
      expect(result.text).toBe('# old heading')
    })

    it('handles Chinese heading', () => {
      const result = transformHeading('项目会议记录', sel(0, 6), 1)
      expect(result.text).toBe('# 项目会议记录')
    })
  })

  describe('transformHighlight', () => {
    it('wraps selected text with ==', () => {
      const result = transformHighlight('important note', sel(0, 9))
      expect(result.text).toBe('==important== note')
    })

    it('inserts placeholder when selection is empty', () => {
      const result = transformHighlight('note', sel(4, 4))
      expect(result.text).toBe('note==文本==')
    })
  })

  describe('applyEditorCommand', () => {
    it('dispatches bold command', () => {
      const result = applyEditorCommand('bold', 'hello', sel(0, 5))
      expect(result.text).toBe('**hello**')
    })

    it('dispatches italic command', () => {
      const result = applyEditorCommand('italic', 'hello', sel(0, 5))
      expect(result.text).toBe('*hello*')
    })

    it('dispatches code command', () => {
      const result = applyEditorCommand('code', 'foo', sel(0, 3))
      expect(result.text).toBe('`foo`')
    })

    it('dispatches link command', () => {
      const result = applyEditorCommand('link', 'click', sel(0, 5))
      expect(result.text).toBe('[click](url)')
    })

    it('dispatches heading command', () => {
      const result = applyEditorCommand('heading', 'title', sel(0, 5))
      expect(result.text).toBe('# title')
    })

    it('dispatches highlight command', () => {
      const result = applyEditorCommand('highlight', 'note', sel(0, 4))
      expect(result.text).toBe('==note==')
    })
  })

  describe('multi-byte Chinese content', () => {
    it('bold wraps Chinese correctly', () => {
      const result = transformBold('今天天气很好', sel(2, 4))
      expect(result.text).toBe('今天**天气**很好')
    })

    it('italic wraps Chinese correctly', () => {
      const result = transformItalic('产品需求文档', sel(0, 2))
      expect(result.text).toBe('*产品*需求文档')
    })

    it('code wraps Chinese correctly', () => {
      const result = transformCode('使用变量名存储', sel(2, 4))
      expect(result.text).toBe('使用`变量`名存储')
    })

    it('link wraps Chinese correctly', () => {
      const result = transformLink('查看官方文档', sel(2, 4))
      expect(result.text).toBe('查看[官方](url)文档')
    })

    it('heading adds prefix to Chinese line', () => {
      const result = transformHeading('周会议记录', sel(0, 4))
      expect(result.text).toBe('# 周会议记录')
    })
  })

  describe('edge cases', () => {
    it('handles empty content for bold', () => {
      const result = transformBold('', sel(0, 0))
      expect(result.text).toBe('**文本**')
    })

    it('handles selection at end of content', () => {
      const result = transformBold('hello', sel(5, 5))
      expect(result.text).toBe('hello**文本**')
    })

    it('handles full content selection', () => {
      const result = transformBold('hello', sel(0, 5))
      expect(result.text).toBe('**hello**')
    })

    it('heading level is clamped to 1-6', () => {
      const result1 = transformHeading('title', sel(0, 5), 0)
      expect(result1.text).toBe('# title')

      const result7 = transformHeading('title', sel(0, 5), 7)
      expect(result7.text).toBe('###### title')
    })
  })
})
