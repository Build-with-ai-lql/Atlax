export interface FileInfo {
  id: string
  userId: string
  name: string
  path: string
  size: number
  mimeType: string
  createdAt: Date
  updatedAt: Date
}

export interface FileUploadInput {
  userId: string
  name: string
  content: Blob | string
  mimeType: string
}

export interface FileUploadResult {
  success: boolean
  file: FileInfo | null
  error?: string
}

export interface FileServicePort {
  uploadFile(input: FileUploadInput): Promise<FileUploadResult>
  getFile(userId: string, fileId: string): Promise<FileInfo | null>
  listFiles(userId: string): Promise<FileInfo[]>
  deleteFile(userId: string, fileId: string): Promise<boolean>
}
