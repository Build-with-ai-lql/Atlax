import { afterEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  createDockItem,
  listDockItems,
} from '@/lib/repository'

const USER_ID = 'user_chat_test'

async function cleanAll() {
  await db.table('dockItems').clear()
  await db.table('entries').clear()
  await db.table('tags').clear()
}

function unwrap<T>(value: T | null | undefined): T {
  expect(value).not.toBeNull()
  expect(value).not.toBeUndefined()
  return value as T
}

describe('chat sourceType', () => {
  afterEach(cleanAll)

  it('creates DockItem with chat sourceType', async () => {
    const id = await createDockItem(USER_ID, '今天讨论了产品路线图', 'chat')
    expect(id).toBeGreaterThan(0)

    const items = await listDockItems(USER_ID)
    expect(items).toHaveLength(1)
    expect(items[0].sourceType).toBe('chat')
    expect(items[0].rawText).toBe('今天讨论了产品路线图')
    expect(items[0].status).toBe('pending')
  })

  it('chat and text sourceType items share same list', async () => {
    await createDockItem(USER_ID, 'classic capture', 'text')
    await createDockItem(USER_ID, 'chat capture', 'chat')

    const items = await listDockItems(USER_ID)
    expect(items).toHaveLength(2)

    const chatItem = unwrap(items.find((i) => i.sourceType === 'chat'))
    const textItem = unwrap(items.find((i) => i.sourceType === 'text'))

    expect(chatItem.rawText).toBe('chat capture')
    expect(textItem.rawText).toBe('classic capture')
  })

  it('default sourceType is text', async () => {
    await createDockItem(USER_ID, 'default source')

    const items = await listDockItems(USER_ID)
    expect(items).toHaveLength(1)
    expect(items[0].sourceType).toBe('text')
  })

  it('chat sourceType item has same status flow as text', async () => {
    const id = await createDockItem(USER_ID, 'chat item', 'chat')

    const items = await listDockItems(USER_ID)
    const item = unwrap(items.find((i) => i.id === id))
    expect(item.status).toBe('pending')
    expect(item.suggestions).toEqual([])
    expect(item.userTags).toEqual([])
  })
})
