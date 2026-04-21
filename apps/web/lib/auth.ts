export interface LocalUser {
  id: string
  name: string
  createdAt: string
}

const CURRENT_USER_KEY = 'atlax_current_user'
const USER_DIRECTORY_KEY = 'atlax_user_directory'

function loadUserDirectory(): LocalUser[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(USER_DIRECTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as LocalUser[]
  } catch {
    return []
  }
}

function saveUserDirectory(users: LocalUser[]): void {
  localStorage.setItem(USER_DIRECTORY_KEY, JSON.stringify(users))
}

export function listLocalUsers(): LocalUser[] {
  return loadUserDirectory()
}

export function getCurrentUser(): LocalUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LocalUser
  } catch {
    return null
  }
}

function setCurrentUser(user: LocalUser): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
}

export function registerUser(name: string): LocalUser {
  const trimmed = name.trim()
  const directory = loadUserDirectory()
  const existing = directory.find((u) => u.name.toLowerCase() === trimmed.toLowerCase())
  if (existing) {
    setCurrentUser(existing)
    return existing
  }

  const user: LocalUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    createdAt: new Date().toISOString(),
  }
  directory.push(user)
  saveUserDirectory(directory)
  setCurrentUser(user)
  return user
}

export function loginUser(name: string): LocalUser | null {
  const trimmed = name.trim()
  const directory = loadUserDirectory()
  const existing = directory.find((u) => u.name.toLowerCase() === trimmed.toLowerCase())
  if (!existing) return null

  setCurrentUser(existing)
  return existing
}

export function loginByUserId(userId: string): LocalUser | null {
  const directory = loadUserDirectory()
  const user = directory.find((u) => u.id === userId)
  if (!user) return null

  setCurrentUser(user)
  return user
}

export function logoutUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY)
}
