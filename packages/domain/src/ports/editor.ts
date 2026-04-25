export type EditorRenderMode = 'edit' | 'preview' | 'split'

export interface EditorDocumentSnapshot {
  dockItemId: number
  content: string
  mode: EditorRenderMode
  updatedAt: Date
}

export type EditorCommandType =
  | 'heading'
  | 'bold'
  | 'italic'
  | 'code'
  | 'link'
  | 'bullet-list'
  | 'numbered-list'
  | 'quote'
  | 'codeblock'
  | 'table'
  | 'image'
  | 'horizontal-rule'
  | 'checkbox'
  | 'highlight'

export interface EditorCommand {
  type: EditorCommandType
  label: string
  icon?: string
  shortcut?: string
  description?: string
}

export const EDITOR_COMMANDS: EditorCommand[] = [
  { type: 'heading', label: '标题', shortcut: 'Ctrl+H', description: '插入标题' },
  { type: 'bold', label: '粗体', shortcut: 'Ctrl+B', description: '粗体文本' },
  { type: 'italic', label: '斜体', shortcut: 'Ctrl+I', description: '斜体文本' },
  { type: 'code', label: '行内代码', shortcut: 'Ctrl+E', description: '行内代码' },
  { type: 'link', label: '链接', shortcut: 'Ctrl+K', description: '插入链接' },
  { type: 'bullet-list', label: '无序列表', description: '创建无序列表' },
  { type: 'numbered-list', label: '有序列表', description: '创建有序列表' },
  { type: 'quote', label: '引用', description: '插入引用块' },
  { type: 'codeblock', label: '代码块', description: '插入代码块' },
  { type: 'table', label: '表格', description: '插入表格' },
  { type: 'image', label: '图片', description: '插入图片' },
  { type: 'horizontal-rule', label: '分割线', description: '插入水平分割线' },
  { type: 'checkbox', label: '复选框', description: '插入复选框' },
  { type: 'highlight', label: '高亮', description: '高亮文本' },
]

export type EditorToolType =
  | 'new-item'
  | 'delete-item'
  | 'archive-item'
  | 'reopen-item'
  | 'export'
  | 'word-count'
  | 'focus-mode'
  | 'typewriter-mode'

export interface EditorTool {
  type: EditorToolType
  label: string
  icon?: string
  description?: string
}

export const EDITOR_TOOLS: EditorTool[] = [
  { type: 'new-item', label: '新建', icon: 'plus', description: '创建新记录' },
  { type: 'delete-item', label: '删除', icon: 'trash', description: '删除当前记录' },
  { type: 'archive-item', label: '归档', icon: 'archive', description: '归档当前记录' },
  { type: 'reopen-item', label: '重新打开', icon: 'folder-open', description: '重新打开已归档记录' },
  { type: 'export', label: '导出', icon: 'download', description: '导出为指定格式' },
  { type: 'word-count', label: '字数统计', icon: 'hash', description: '显示字数统计' },
  { type: 'focus-mode', label: '专注模式', icon: 'focus', description: '进入专注模式' },
  { type: 'typewriter-mode', label: '打字机模式', icon: 'type', description: '光标居中打字' },
]

export interface EditorCapabilityPort {
  getAvailableCommands(): EditorCommand[]
  getAvailableTools(): EditorTool[]
  isCommandAvailable(command: EditorCommandType): boolean
  isToolAvailable(tool: EditorToolType): boolean
}

export function createEditorCapabilityPort(): EditorCapabilityPort {
  return {
    getAvailableCommands(): EditorCommand[] {
      return EDITOR_COMMANDS
    },
    getAvailableTools(): EditorTool[] {
      return EDITOR_TOOLS
    },
    isCommandAvailable(command: EditorCommandType): boolean {
      return EDITOR_COMMANDS.some((c) => c.type === command)
    },
    isToolAvailable(tool: EditorToolType): boolean {
      return EDITOR_TOOLS.some((t) => t.type === tool)
    },
  }
}

export interface EditorBackendPort {
  loadDocument(userId: string, dockItemId: number): Promise<EditorDocumentSnapshot | null>
  saveDocument(userId: string, dockItemId: number, content: string): Promise<EditorDocumentSnapshot>
  switchMode(userId: string, dockItemId: number, mode: EditorRenderMode): Promise<EditorDocumentSnapshot>
  autosave(userId: string, dockItemId: number, content: string): Promise<void>
}
