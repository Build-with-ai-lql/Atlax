export interface TextSelection {
  text: string
  start: number
  end: number
}

export interface TransformResult {
  text: string
  selectionStart: number
  selectionEnd: number
}

export function wrapSelection(
  content: string,
  selection: TextSelection,
  prefix: string,
  suffix: string,
): TransformResult {
  const selectedText = content.slice(selection.start, selection.end)
  const before = content.slice(0, selection.start)
  const after = content.slice(selection.end)

  const newText = before + prefix + selectedText + suffix + after

  if (selectedText.length > 0) {
    return {
      text: newText,
      selectionStart: selection.start + prefix.length,
      selectionEnd: selection.start + prefix.length + selectedText.length,
    }
  }

  const placeholder = '文本'
  const placeholderText = before + prefix + placeholder + suffix + after
  return {
    text: placeholderText,
    selectionStart: selection.start + prefix.length,
    selectionEnd: selection.start + prefix.length + placeholder.length,
  }
}

export function transformBold(content: string, selection: TextSelection): TransformResult {
  return wrapSelection(content, selection, '**', '**')
}

export function transformItalic(content: string, selection: TextSelection): TransformResult {
  return wrapSelection(content, selection, '*', '*')
}

export function transformCode(content: string, selection: TextSelection): TransformResult {
  return wrapSelection(content, selection, '`', '`')
}

export function transformLink(content: string, selection: TextSelection): TransformResult {
  const selectedText = content.slice(selection.start, selection.end)
  const before = content.slice(0, selection.start)
  const after = content.slice(selection.end)

  if (selectedText.length > 0) {
    const newText = before + '[' + selectedText + '](url)' + after
    return {
      text: newText,
      selectionStart: selection.start + selectedText.length + 3,
      selectionEnd: selection.start + selectedText.length + 6,
    }
  }

  const placeholder = '链接文本'
  const urlPlaceholder = 'url'
  const newText = before + '[' + placeholder + '](' + urlPlaceholder + ')' + after
  return {
    text: newText,
    selectionStart: selection.start + 1,
    selectionEnd: selection.start + 1 + placeholder.length,
  }
}

export function transformHeading(content: string, selection: TextSelection, level: number = 1): TransformResult {
  const prefix = '#'.repeat(Math.min(Math.max(level, 1), 6)) + ' '
  const lineStart = content.lastIndexOf('\n', selection.start - 1) + 1
  const lineEnd = content.indexOf('\n', selection.end)
  const actualLineEnd = lineEnd === -1 ? content.length : lineEnd

  const before = content.slice(0, lineStart)
  const lineText = content.slice(lineStart, actualLineEnd)
  const after = content.slice(actualLineEnd)

  const trimmedLine = lineText.replace(/^#+\s*/, '')
  const newText = before + prefix + trimmedLine + after

  return {
    text: newText,
    selectionStart: lineStart + prefix.length,
    selectionEnd: lineStart + prefix.length + trimmedLine.length,
  }
}

export function transformHighlight(content: string, selection: TextSelection): TransformResult {
  return wrapSelection(content, selection, '==', '==')
}

export function applyEditorCommand(
  command: 'bold' | 'italic' | 'code' | 'link' | 'heading' | 'highlight',
  content: string,
  selection: TextSelection,
): TransformResult {
  switch (command) {
    case 'bold':
      return transformBold(content, selection)
    case 'italic':
      return transformItalic(content, selection)
    case 'code':
      return transformCode(content, selection)
    case 'link':
      return transformLink(content, selection)
    case 'heading':
      return transformHeading(content, selection)
    case 'highlight':
      return transformHighlight(content, selection)
  }
}
