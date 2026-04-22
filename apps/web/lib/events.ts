export type AppEvent =
  | { type: 'mode_switched'; from: AppMode; to: AppMode }
  | { type: 'chat_guided_capture_created'; dockItemId: number; rawText: string }

export type AppMode = 'classic' | 'chat'

export type PersistedEvent = AppEvent & { _ts: number }

export type EventListener = (event: AppEvent) => void

const listeners: EventListener[] = []

let memoryLog: PersistedEvent[] | null = null

function getMemoryLog(): PersistedEvent[] {
  if (memoryLog === null) {
    memoryLog = []
  }
  return memoryLog
}

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

export function subscribe(listener: EventListener): () => void {
  listeners.push(listener)
  return () => {
    const idx = listeners.indexOf(listener)
    if (idx >= 0) listeners.splice(idx, 1)
  }
}

export function emit(event: AppEvent): void {
  for (const listener of listeners) {
    listener(event)
  }
}

const EVENT_LOG_KEY = 'atlax_event_log'

function loadEventLog(): PersistedEvent[] {
  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(EVENT_LOG_KEY)
      if (raw) return JSON.parse(raw) as PersistedEvent[]
    } catch {
      // fall through to memory
    }
  }
  return getMemoryLog()
}

function saveEventLog(events: PersistedEvent[]): void {
  const trimmed = events.slice(-200)
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(trimmed))
      return
    } catch {
      // fall through to memory
    }
  }
  memoryLog = trimmed
}

export function recordEvent(event: AppEvent): void {
  emit(event)
  const log = loadEventLog()
  const persisted: PersistedEvent = { ...event, _ts: Date.now() }
  log.push(persisted)
  saveEventLog(log)
}

export function getEventLog(): PersistedEvent[] {
  return loadEventLog()
}

export function clearEventLog(): void {
  memoryLog = []
  if (hasLocalStorage()) {
    try {
      localStorage.removeItem(EVENT_LOG_KEY)
    } catch {
      // ignore
    }
  }
}
