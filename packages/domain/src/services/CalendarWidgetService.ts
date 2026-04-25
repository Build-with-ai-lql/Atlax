export type WidgetType = 'calendar'

export interface CalendarDayEntry {
  entryId: number
  sourceDockItemId: number
  title: string
  type: string
  tags: string[]
  project: string | null
  archivedAt: Date
}

export interface CalendarDayResult {
  date: string
  entries: CalendarDayEntry[]
}

export interface CalendarMonthOverview {
  year: number
  month: number
  daysWithEntries: string[]
}

export interface EntryLookup {
  id: number
  sourceDockItemId: number
  title: string
  type: string
  tags: string[]
  project: string | null
  archivedAt: Date
  userId: string
}

export function queryEntriesByDate(
  entries: EntryLookup[],
  userId: string,
  date: string,
): CalendarDayResult {
  const targetDate = normalizeDate(date)
  const filtered = entries
    .filter((e) => e.userId === userId)
    .filter((e) => normalizeDate(formatDate(e.archivedAt)) === targetDate)

  return {
    date: targetDate,
    entries: filtered.map((e) => ({
      entryId: e.id,
      sourceDockItemId: e.sourceDockItemId,
      title: e.title,
      type: e.type,
      tags: e.tags,
      project: e.project,
      archivedAt: e.archivedAt,
    })),
  }
}

export function queryMonthOverview(
  entries: EntryLookup[],
  userId: string,
  year: number,
  month: number,
): CalendarMonthOverview {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const userEntries = entries.filter((e) => e.userId === userId)

  const days = new Set<string>()
  for (const e of userEntries) {
    const d = formatDate(e.archivedAt)
    if (d.startsWith(monthStr)) {
      days.add(normalizeDate(d))
    }
  }

  return {
    year,
    month,
    daysWithEntries: Array.from(days).sort(),
  }
}

function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDate(date: string): string {
  const trimmed = date.trim().slice(0, 10)
  const parts = trimmed.split('-')
  if (parts.length !== 3) return trimmed
  return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
}
