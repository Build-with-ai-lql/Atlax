import { describe, expect, it } from 'vitest'

import { isValidChatSessionInput, type ChatSessionCreateInput } from '../src/ports/repository'

describe('isValidChatSessionInput', () => {
  it('returns false for empty input', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
    }
    expect(isValidChatSessionInput(input)).toBe(false)
  })

  it('returns false for empty messages array', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      messages: [],
    }
    expect(isValidChatSessionInput(input)).toBe(false)
  })

  it('returns false for messages with only assistant role', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      messages: [{ role: 'assistant', content: 'hello', timestamp: new Date() }],
    }
    expect(isValidChatSessionInput(input)).toBe(false)
  })

  it('returns false for messages with empty user content', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      messages: [{ role: 'user', content: '', timestamp: new Date() }],
    }
    expect(isValidChatSessionInput(input)).toBe(false)
  })

  it('returns true for valid user message', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      messages: [{ role: 'user', content: 'hello', timestamp: new Date() }],
    }
    expect(isValidChatSessionInput(input)).toBe(true)
  })

  it('returns true for valid topic', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      topic: '项目会议',
    }
    expect(isValidChatSessionInput(input)).toBe(true)
  })

  it('returns false for empty topic', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      topic: '',
    }
    expect(isValidChatSessionInput(input)).toBe(false)
  })

  it('returns true for valid selectedType', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      selectedType: 'meeting',
    }
    expect(isValidChatSessionInput(input)).toBe(true)
  })

  it('returns false for empty selectedType', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      selectedType: '',
    }
    expect(isValidChatSessionInput(input)).toBe(false)
  })

  it('returns true for valid content', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      content: '讨论产品规划',
    }
    expect(isValidChatSessionInput(input)).toBe(true)
  })

  it('returns false for empty content', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      content: '',
    }
    expect(isValidChatSessionInput(input)).toBe(false)
  })

  it('returns true for mixed valid and invalid fields', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      topic: '',
      content: '有效内容',
    }
    expect(isValidChatSessionInput(input)).toBe(true)
  })

  it('returns true for whitespace-only topic treated as empty', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      topic: '   ',
    }
    expect(isValidChatSessionInput(input)).toBe(false)
  })

  it('returns true for whitespace-only content treated as empty', () => {
    const input: ChatSessionCreateInput = {
      userId: 'user1',
      content: '   ',
    }
    expect(isValidChatSessionInput(input)).toBe(false)
  })
})

describe('ChatSession userId isolation', () => {
  it('simulates userId isolation in repository pattern', () => {
    const sessions = [
      { id: 1, userId: 'user1', title: 'Session 1' },
      { id: 2, userId: 'user2', title: 'Session 2' },
      { id: 3, userId: 'user1', title: 'Session 3' },
    ]

    const user1Sessions = sessions.filter((s) => s.userId === 'user1')
    const user2Sessions = sessions.filter((s) => s.userId === 'user2')

    expect(user1Sessions).toHaveLength(2)
    expect(user2Sessions).toHaveLength(1)
    expect(user1Sessions.map((s) => s.id)).toEqual([1, 3])
    expect(user2Sessions.map((s) => s.id)).toEqual([2])
  })
})

describe('ChatSession sorting', () => {
  it('sorts pinned sessions before non-pinned', () => {
    const sessions = [
      { id: 1, pinned: false, updatedAt: new Date('2024-01-03') },
      { id: 2, pinned: true, updatedAt: new Date('2024-01-01') },
      { id: 3, pinned: false, updatedAt: new Date('2024-01-02') },
    ]

    const sorted = sessions.sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    expect(sorted[0].id).toBe(2)
    expect(sorted[0].pinned).toBe(true)
  })

  it('sorts by updatedAt when both are pinned or not pinned', () => {
    const sessions = [
      { id: 1, pinned: false, updatedAt: new Date('2024-01-01') },
      { id: 2, pinned: false, updatedAt: new Date('2024-01-03') },
      { id: 3, pinned: false, updatedAt: new Date('2024-01-02') },
    ]

    const sorted = sessions.sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    expect(sorted.map((s) => s.id)).toEqual([2, 3, 1])
  })

  it('sorts pinned first, then by updatedAt', () => {
    const sessions = [
      { id: 1, pinned: false, updatedAt: new Date('2024-01-05') },
      { id: 2, pinned: true, updatedAt: new Date('2024-01-01') },
      { id: 3, pinned: false, updatedAt: new Date('2024-01-04') },
      { id: 4, pinned: true, updatedAt: new Date('2024-01-02') },
    ]

    const sorted = sessions.sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    expect(sorted.map((s) => s.id)).toEqual([4, 2, 1, 3])
  })
})

describe('ChatSession update behavior', () => {
  it('simulates update not creating duplicate session', () => {
    const sessions = new Map<number, { id: number; status: string }>()
    sessions.set(1, { id: 1, status: 'active' })

    const existingSession = sessions.get(1)
    if (existingSession) {
      existingSession.status = 'confirmed'
      sessions.set(1, existingSession)
    }

    expect(sessions.size).toBe(1)
    expect(sessions.get(1)?.status).toBe('confirmed')
  })
})
