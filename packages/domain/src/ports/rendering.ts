export interface RenderInput {
  content: string
  format: 'markdown' | 'html' | 'plain'
}

export interface RenderOutput {
  success: boolean
  rendered: string | null
  error?: string
}

export interface RenderOptions {
  sanitize?: boolean
  enableSyntaxHighlight?: boolean
  enableMath?: boolean
}

export interface MarkdownRenderPort {
  render(input: RenderInput, options?: RenderOptions): Promise<RenderOutput>
  renderPreview(content: string): Promise<RenderOutput>
}
