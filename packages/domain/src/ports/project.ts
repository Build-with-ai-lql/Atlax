export interface Project {
  id: string
  userId: string
  name: string
  description: string | null
  color: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ProjectCreateInput {
  userId: string
  name: string
  description?: string
  color?: string
}

export interface ProjectUpdateInput {
  name?: string
  description?: string | null
  color?: string | null
}

export interface ProjectServicePort {
  createProject(input: ProjectCreateInput): Promise<Project>
  getProject(userId: string, projectId: string): Promise<Project | null>
  listProjects(userId: string): Promise<Project[]>
  updateProject(userId: string, projectId: string, updates: ProjectUpdateInput): Promise<Project | null>
  deleteProject(userId: string, projectId: string): Promise<boolean>
}
