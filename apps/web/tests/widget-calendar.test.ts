import { afterEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  activateWidget,
  archiveItem,
  createDockItem,
  deactivateWidget,
  getActiveWidget,
  queryCalendarDay,
  queryCalendarMonth,
  suggestItem,
} from '@/lib/repository'

const USER_A = 'user_widget_a'
const USER_B = 'user_widget_b'

async function cleanAll() {
  await db.table('widgets').clear()
  await db.table('entries').clear()
  await db.table('dockItems').clear()
}

describe('Widget Registry', () => {
  afterEach(cleanAll)

  it('activates a calendar widget for a user', async () => {
    const widget = await activateWidget(USER_A, 'calendar')
    expect(widget.widgetType).toBe('calendar')
    expect(widget.active).toBe(true)
    expect(widget.userId).toBe(USER_A)
  })

  it('only allows one active widget per user', async () => {
    await activateWidget(USER_A, 'calendar')
    const second = await activateWidget(USER_A, 'calendar')

    expect(second.active).toBe(true)

    const active = await getActiveWidget(USER_A)
    expect(active).not.toBeNull()
    expect(active?.id).toBe(second.id)
  })

  it('deactivates the current active widget', async () => {
    await activateWidget(USER_A, 'calendar')
    const deactivated = await deactivateWidget(USER_A)

    expect(deactivated).not.toBeNull()
    expect(deactivated?.active).toBe(false)

    const active = await getActiveWidget(USER_A)
    expect(active).toBeNull()
  })

  it('returns null when no widget is active', async () => {
    const active = await getActiveWidget(USER_A)
    expect(active).toBeNull()
  })

  it('isolates widgets between users', async () => {
    await activateWidget(USER_A, 'calendar')
    await activateWidget(USER_B, 'calendar')

    const activeA = await getActiveWidget(USER_A)
    const activeB = await getActiveWidget(USER_B)

    expect(activeA).not.toBeNull()
    expect(activeB).not.toBeNull()
    expect(activeA?.userId).toBe(USER_A)
    expect(activeB?.userId).toBe(USER_B)
    expect(activeA?.id).not.toBe(activeB?.id)
  })

  it('deactivate returns null when nothing is active', async () => {
    const result = await deactivateWidget(USER_A)
    expect(result).toBeNull()
  })
})

describe('Calendar Widget date query', () => {
  afterEach(cleanAll)

  async function seedArchiveEntry(userId: string, rawText: string, archivedAt: Date) {
    const id = await createDockItem(userId, rawText)
    await suggestItem(userId, id)
    await archiveItem(userId, id)
    await db.table('entries')
      .where('sourceDockItemId')
      .equals(id)
      .modify((e: Record<string, unknown>) => {
        e.archivedAt = archivedAt
      })
  }

  it('returns entries for a specific date', async () => {
    await seedArchiveEntry(USER_A, '4月25日记录', new Date('2026-04-25T10:00:00Z'))
    await seedArchiveEntry(USER_A, '4月25日下午记录', new Date('2026-04-25T15:00:00Z'))
    await seedArchiveEntry(USER_A, '4月26日记录', new Date('2026-04-26T09:00:00Z'))

    const result = await queryCalendarDay(USER_A, '2026-04-25')
    expect(result.date).toBe('2026-04-25')
    expect(result.entries).toHaveLength(2)
  })

  it('returns empty for date with no entries', async () => {
    await seedArchiveEntry(USER_A, '4月25日记录', new Date('2026-04-25T10:00:00Z'))

    const result = await queryCalendarDay(USER_A, '2026-04-26')
    expect(result.entries).toHaveLength(0)
  })

  it('does not return entries from other users', async () => {
    await seedArchiveEntry(USER_A, '用户A记录', new Date('2026-04-25T10:00:00Z'))
    await seedArchiveEntry(USER_B, '用户B记录', new Date('2026-04-25T10:00:00Z'))

    const result = await queryCalendarDay(USER_A, '2026-04-25')
    expect(result.entries).toHaveLength(1)
  })

  it('returns month overview with days that have entries', async () => {
    await seedArchiveEntry(USER_A, '4月10日记录', new Date('2026-04-10T10:00:00Z'))
    await seedArchiveEntry(USER_A, '4月10日另一条', new Date('2026-04-10T15:00:00Z'))
    await seedArchiveEntry(USER_A, '4月25日记录', new Date('2026-04-25T09:00:00Z'))

    const result = await queryCalendarMonth(USER_A, 2026, 4)
    expect(result.daysWithEntries).toEqual(['2026-04-10', '2026-04-25'])
  })

  it('returns empty month overview for month with no entries', async () => {
    await seedArchiveEntry(USER_A, '3月记录', new Date('2026-03-15T10:00:00Z'))

    const result = await queryCalendarMonth(USER_A, 2026, 4)
    expect(result.daysWithEntries).toEqual([])
  })

  it('month overview does not include other users entries', async () => {
    await seedArchiveEntry(USER_A, '用户A 4月记录', new Date('2026-04-15T10:00:00Z'))
    await seedArchiveEntry(USER_B, '用户B 4月记录', new Date('2026-04-20T10:00:00Z'))

    const result = await queryCalendarMonth(USER_A, 2026, 4)
    expect(result.daysWithEntries).toEqual(['2026-04-15'])
  })
})
