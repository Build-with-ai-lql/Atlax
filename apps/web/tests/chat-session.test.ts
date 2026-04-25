import { afterEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  addChatMessage,
  createChatSession,
  deleteChatSession,
  getChatSession,
  listActiveChatSessions,
  listChatSessions,
  pinChatSession,
  unpinChatSession,
  updateChatSession,
} from '@/lib/repository'

const USER_A = 'user_test_a'
const USER_B = 'user_test_b'

async function cleanAll() {
  await db.table('chatSessions').clear()
}

function unwrap<T>(value: T | null): T {
  expect(value).not.toBeNull()
  return value as T
}

describe('ChatSession repository (real Dexie)', () => {
  afterEach(cleanAll)

  describe('createChatSession', () => {
    it('creates a session with valid user message', async () => {
      const session = unwrap(await createChatSession({
        userId: USER_A,
        messages: [{ role: 'user', content: 'hello', timestamp: new Date() }],
      }))

      expect(session.id).toBeTypeOf('number')
      expect(session.userId).toBe(USER_A)
      expect(session.status).toBe('active')
      expect(session.pinned).toBe(false)
      expect(session.messages).toHaveLength(1)
    })

    it('creates a session with valid topic', async () => {
      const session = unwrap(await createChatSession({
        userId: USER_A,
        topic: '项目会议',
      }))

      expect(session.topic).toBe('项目会议')
    })

    it('rejects empty session creation', async () => {
      const result = await createChatSession({
        userId: USER_A,
      })

      expect(result).toBeNull()
    })

    it('rejects session with only assistant welcome', async () => {
      const result = await createChatSession({
        userId: USER_A,
        messages: [{ role: 'assistant', content: '你好，欢迎使用 Mind Dock', timestamp: new Date() }],
      })

      expect(result).toBeNull()
    })

    it('rejects session with empty user message', async () => {
      const result = await createChatSession({
        userId: USER_A,
        messages: [{ role: 'user', content: '', timestamp: new Date() }],
      })

      expect(result).toBeNull()
    })

    it('creates session with first user message', async () => {
      const session = unwrap(await createChatSession({
        userId: USER_A,
        messages: [
          { role: 'assistant', content: '你好', timestamp: new Date() },
          { role: 'user', content: '记录一下今天的会议', timestamp: new Date() },
        ],
      }))

      expect(session.messages).toHaveLength(2)
    })

    it('creates session with title', async () => {
      const session = unwrap(await createChatSession({
        userId: USER_A,
        title: '每日站会',
        topic: '站会',
      }))

      expect(session.title).toBe('每日站会')
    })

    it('creates session with pinned flag', async () => {
      const session = unwrap(await createChatSession({
        userId: USER_A,
        topic: '重要记录',
        pinned: true,
      }))

      expect(session.pinned).toBe(true)
    })
  })

  describe('getChatSession', () => {
    it('returns session for correct user', async () => {
      const created = unwrap(await createChatSession({
        userId: USER_A,
        topic: '测试',
      }))

      const fetched = unwrap(await getChatSession(USER_A, created.id))
      expect(fetched.id).toBe(created.id)
    })

    it('returns null for wrong user', async () => {
      const created = unwrap(await createChatSession({
        userId: USER_A,
        topic: '测试',
      }))

      expect(await getChatSession(USER_B, created.id)).toBeNull()
    })

    it('returns null for nonexistent id', async () => {
      expect(await getChatSession(USER_A, 99999)).toBeNull()
    })
  })

  describe('listChatSessions', () => {
    it('lists sessions for specific user only', async () => {
      await createChatSession({ userId: USER_A, topic: 'A1' })
      await createChatSession({ userId: USER_B, topic: 'B1' })
      await createChatSession({ userId: USER_A, topic: 'A2' })

      const listA = await listChatSessions(USER_A)
      const listB = await listChatSessions(USER_B)

      expect(listA).toHaveLength(2)
      expect(listB).toHaveLength(1)
    })

    it('sorts by updatedAt descending', async () => {
      const s1 = unwrap(await createChatSession({ userId: USER_A, topic: 'first' }))

      await new Promise((r) => setTimeout(r, 10))

      const s2 = unwrap(await createChatSession({ userId: USER_A, topic: 'second' }))

      const list = await listChatSessions(USER_A)
      expect(list[0].id).toBe(s2.id)
      expect(list[1].id).toBe(s1.id)
    })

    it('sorts pinned before non-pinned', async () => {
      const unpinned = unwrap(await createChatSession({ userId: USER_A, topic: 'unpinned' }))

      await new Promise((r) => setTimeout(r, 10))

      const pinned = unwrap(await createChatSession({ userId: USER_A, topic: 'pinned' }))
      await pinChatSession(USER_A, pinned.id)

      const list = await listChatSessions(USER_A)
      expect(list[0].id).toBe(pinned.id)
      expect(list[0].pinned).toBe(true)
      expect(list[1].id).toBe(unpinned.id)
    })

    it('pinned sessions sort by updatedAt among themselves', async () => {
      const pinned1 = unwrap(await createChatSession({ userId: USER_A, topic: 'pinned1', pinned: true }))

      await new Promise((r) => setTimeout(r, 10))

      const pinned2 = unwrap(await createChatSession({ userId: USER_A, topic: 'pinned2', pinned: true }))

      const list = await listChatSessions(USER_A)
      expect(list).toHaveLength(2)
      expect(list[0].id).toBe(pinned2.id)
      expect(list[1].id).toBe(pinned1.id)
    })
  })

  describe('listActiveChatSessions', () => {
    it('only lists active sessions', async () => {
      const s1 = unwrap(await createChatSession({ userId: USER_A, topic: 'active' }))
      const s2 = unwrap(await createChatSession({ userId: USER_A, topic: 'to-confirm' }))

      await updateChatSession(USER_A, s2.id, { status: 'confirmed' })

      const active = await listActiveChatSessions(USER_A)
      expect(active).toHaveLength(1)
      expect(active[0].id).toBe(s1.id)
    })

    it('isolates by userId', async () => {
      await createChatSession({ userId: USER_A, topic: 'A' })
      await createChatSession({ userId: USER_B, topic: 'B' })

      const activeA = await listActiveChatSessions(USER_A)
      expect(activeA).toHaveLength(1)
      expect(activeA[0].userId).toBe(USER_A)
    })
  })

  describe('updateChatSession', () => {
    it('updates topic and status', async () => {
      const session = unwrap(await createChatSession({ userId: USER_A, topic: 'original' }))

      const updated = unwrap(await updateChatSession(USER_A, session.id, {
        topic: 'updated topic',
        status: 'confirmed',
      }))

      expect(updated.topic).toBe('updated topic')
      expect(updated.status).toBe('confirmed')
    })

    it('does not create duplicate session on confirmed update', async () => {
      const session = unwrap(await createChatSession({ userId: USER_A, topic: 'test' }))

      await updateChatSession(USER_A, session.id, { status: 'confirmed' })

      const list = await listChatSessions(USER_A)
      expect(list).toHaveLength(1)
    })

    it('blocks cross-user update', async () => {
      const session = unwrap(await createChatSession({ userId: USER_A, topic: 'test' }))

      const result = await updateChatSession(USER_B, session.id, { topic: 'hacked' })
      expect(result).toBeNull()

      const original = unwrap(await getChatSession(USER_A, session.id))
      expect(original.topic).toBe('test')
    })

    it('updates title', async () => {
      const session = unwrap(await createChatSession({ userId: USER_A, topic: 'test' }))

      const updated = unwrap(await updateChatSession(USER_A, session.id, { title: 'New Title' }))
      expect(updated.title).toBe('New Title')
    })

    it('updates updatedAt timestamp', async () => {
      const session = unwrap(await createChatSession({ userId: USER_A, topic: 'test' }))
      const originalUpdatedAt = session.updatedAt

      await new Promise((r) => setTimeout(r, 10))

      const updated = unwrap(await updateChatSession(USER_A, session.id, { topic: 'updated' }))
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(originalUpdatedAt).getTime())
    })
  })

  describe('pinChatSession / unpinChatSession', () => {
    it('pins a session', async () => {
      const session = unwrap(await createChatSession({ userId: USER_A, topic: 'test' }))

      const pinned = unwrap(await pinChatSession(USER_A, session.id))
      expect(pinned.pinned).toBe(true)
    })

    it('unpins a session', async () => {
      const session = unwrap(await createChatSession({ userId: USER_A, topic: 'test', pinned: true }))

      const unpinned = unwrap(await unpinChatSession(USER_A, session.id))
      expect(unpinned.pinned).toBe(false)
    })

    it('pin updates updatedAt and changes sort order', async () => {
      const s1 = unwrap(await createChatSession({ userId: USER_A, topic: 'first' }))

      await new Promise((r) => setTimeout(r, 10))

      const s2 = unwrap(await createChatSession({ userId: USER_A, topic: 'second' }))

      let list = await listChatSessions(USER_A)
      expect(list[0].id).toBe(s2.id)

      await pinChatSession(USER_A, s1.id)

      list = await listChatSessions(USER_A)
      expect(list[0].id).toBe(s1.id)
      expect(list[0].pinned).toBe(true)
    })

    it('blocks cross-user pin', async () => {
      const session = unwrap(await createChatSession({ userId: USER_A, topic: 'test' }))

      expect(await pinChatSession(USER_B, session.id)).toBeNull()
    })

    it('blocks cross-user unpin', async () => {
      const session = unwrap(await createChatSession({ userId: USER_A, topic: 'test', pinned: true }))

      expect(await unpinChatSession(USER_B, session.id)).toBeNull()
    })
  })

  describe('deleteChatSession', () => {
    it('deletes a session', async () => {
      const session = unwrap(await createChatSession({ userId: USER_A, topic: 'test' }))

      expect(await deleteChatSession(USER_A, session.id)).toBe(true)
      expect(await getChatSession(USER_A, session.id)).toBeNull()
    })

    it('blocks cross-user delete', async () => {
      const session = unwrap(await createChatSession({ userId: USER_A, topic: 'test' }))

      expect(await deleteChatSession(USER_B, session.id)).toBe(false)
      expect(await getChatSession(USER_A, session.id)).not.toBeNull()
    })

    it('returns false for nonexistent session', async () => {
      expect(await deleteChatSession(USER_A, 99999)).toBe(false)
    })
  })

  describe('addChatMessage', () => {
    it('adds a message to session', async () => {
      const session = unwrap(await createChatSession({
        userId: USER_A,
        messages: [{ role: 'user', content: 'hello', timestamp: new Date() }],
      }))

      const updated = unwrap(await addChatMessage(USER_A, session.id, {
        role: 'assistant',
        content: '好的，我来帮你记录',
        timestamp: new Date(),
      }))

      expect(updated.messages).toHaveLength(2)
      expect(updated.messages[1].role).toBe('assistant')
    })

    it('blocks cross-user message add', async () => {
      const session = unwrap(await createChatSession({
        userId: USER_A,
        messages: [{ role: 'user', content: 'hello', timestamp: new Date() }],
      }))

      expect(await addChatMessage(USER_B, session.id, {
        role: 'assistant',
        content: 'hacked',
        timestamp: new Date(),
      })).toBeNull()
    })

    it('updates updatedAt when message added', async () => {
      const session = unwrap(await createChatSession({
        userId: USER_A,
        messages: [{ role: 'user', content: 'hello', timestamp: new Date() }],
      }))
      const originalUpdatedAt = session.updatedAt

      await new Promise((r) => setTimeout(r, 10))

      const updated = unwrap(await addChatMessage(USER_A, session.id, {
        role: 'assistant',
        content: 'reply',
        timestamp: new Date(),
      }))

      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(originalUpdatedAt).getTime())
    })
  })

  describe('full userId isolation', () => {
    it('two users have completely separate sessions', async () => {
      await createChatSession({ userId: USER_A, topic: 'A session 1' })
      await createChatSession({ userId: USER_A, topic: 'A session 2' })
      await createChatSession({ userId: USER_B, topic: 'B session 1' })

      const listA = await listChatSessions(USER_A)
      const listB = await listChatSessions(USER_B)

      expect(listA).toHaveLength(2)
      expect(listB).toHaveLength(1)

      expect(listA.every((s) => s.userId === USER_A)).toBe(true)
      expect(listB.every((s) => s.userId === USER_B)).toBe(true)
    })

    it('user B cannot read/update/delete user A sessions', async () => {
      const sessionA = unwrap(await createChatSession({ userId: USER_A, topic: 'private' }))

      expect(await getChatSession(USER_B, sessionA.id)).toBeNull()
      expect(await updateChatSession(USER_B, sessionA.id, { topic: 'hacked' })).toBeNull()
      expect(await deleteChatSession(USER_B, sessionA.id)).toBe(false)
      expect(await pinChatSession(USER_B, sessionA.id)).toBeNull()

      const original = unwrap(await getChatSession(USER_A, sessionA.id))
      expect(original.topic).toBe('private')
    })
  })
})
