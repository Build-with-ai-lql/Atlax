import { inboxEntries, type InboxEntry, type SourceType } from './db'

export type { InboxEntry }

export async function createInboxEntry(rawText: string, sourceType: SourceType = 'text'): Promise<string> {
  const id = await inboxEntries.add({
    rawText,
    sourceType,
    createdAt: new Date(),
  })
  return id.toString()
}

export async function listInboxEntries(): Promise<InboxEntry[]> {
  return inboxEntries.orderBy('createdAt').reverse().toArray()
}

export async function countInboxEntries(): Promise<number> {
  return inboxEntries.count()
}