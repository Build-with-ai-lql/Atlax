export type EditorRenderMode = 'edit' | 'preview' | 'split'

export interface EditorDocumentSnapshot {
  dockItemId: number
  content: string
  mode: EditorRenderMode
  updatedAt: Date
}

export interface EditorBackendPort {
  loadDocument(userId: string, dockItemId: number): Promise<EditorDocumentSnapshot | null>
  saveDocument(userId: string, dockItemId: number, content: string): Promise<EditorDocumentSnapshot>
  switchMode(userId: string, dockItemId: number, mode: EditorRenderMode): Promise<EditorDocumentSnapshot>
  autosave(userId: string, dockItemId: number, content: string): Promise<void>
}
