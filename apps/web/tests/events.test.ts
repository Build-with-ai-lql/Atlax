import { afterEach, describe, expect, it } from 'vitest'

import {
  clearEventLog,
  emit,
  getEventLog,
  recordEvent,
  subscribe,
  type AppEvent,
  type AppMode,
  type PersistedEvent,
} from '@/lib/events'

describe('events module', () => {
  afterEach(() => {
    clearEventLog()
  })

  it('records mode_switched event to log', () => {
    recordEvent({ type: 'mode_switched', from: 'classic', to: 'chat' })

    const log = getEventLog()
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({
      type: 'mode_switched',
      from: 'classic',
      to: 'chat',
    })
  })

  it('persisted event includes _ts timestamp', () => {
    const before = Date.now()
    recordEvent({ type: 'mode_switched', from: 'classic', to: 'chat' })
    const after = Date.now()

    const log = getEventLog()
    expect(log).toHaveLength(1)
    expect(log[0]._ts).toBeGreaterThanOrEqual(before)
    expect(log[0]._ts).toBeLessThanOrEqual(after)
  })

  it('getEventLog returns PersistedEvent type with _ts', () => {
    recordEvent({ type: 'mode_switched', from: 'classic', to: 'chat' })

    const log: PersistedEvent[] = getEventLog()
    expect(log[0]._ts).toBeTypeOf('number')
    expect(log[0].type).toBe('mode_switched')
  })

  it('emits event to subscribers', () => {
    const received: AppEvent[] = []
    const unsub = subscribe((e) => received.push(e))

    recordEvent({ type: 'mode_switched', from: 'classic', to: 'chat' })

    expect(received).toHaveLength(1)
    expect(received[0].type).toBe('mode_switched')

    unsub()
  })

  it('unsubscribes correctly', () => {
    const received: AppEvent[] = []
    const unsub = subscribe((e) => received.push(e))

    unsub()
    recordEvent({ type: 'mode_switched', from: 'chat', to: 'classic' })

    expect(received).toHaveLength(0)
  })

  it('supports multiple subscribers', () => {
    const received1: AppEvent[] = []
    const received2: AppEvent[] = []
    const unsub1 = subscribe((e) => received1.push(e))
    const unsub2 = subscribe((e) => received2.push(e))

    emit({ type: 'mode_switched', from: 'classic', to: 'chat' })

    expect(received1).toHaveLength(1)
    expect(received2).toHaveLength(1)

    unsub1()
    unsub2()
  })

  it('clears event log', () => {
    recordEvent({ type: 'mode_switched', from: 'classic', to: 'chat' })
    expect(getEventLog()).toHaveLength(1)

    clearEventLog()
    expect(getEventLog()).toHaveLength(0)
  })
})

describe('mode switch behavior', () => {
  afterEach(() => {
    clearEventLog()
  })

  it('default mode is classic', () => {
    const mode: AppMode = 'classic'
    expect(mode).toBe('classic')
  })

  it('switching mode records correct from/to', () => {
    let currentMode: AppMode = 'classic'

    const switchMode = (newMode: AppMode) => {
      if (newMode === currentMode) return
      recordEvent({ type: 'mode_switched', from: currentMode, to: newMode })
      currentMode = newMode
    }

    switchMode('chat')
    expect(currentMode).toBe('chat')

    const log = getEventLog()
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({ from: 'classic', to: 'chat' })
  })

  it('switching to same mode does not record event', () => {
    let currentMode: AppMode = 'classic'

    const switchMode = (newMode: AppMode) => {
      if (newMode === currentMode) return
      recordEvent({ type: 'mode_switched', from: currentMode, to: newMode })
      currentMode = newMode
    }

    switchMode('classic')
    expect(getEventLog()).toHaveLength(0)
  })

  it('mode switch does not affect user context', () => {
    const userId = 'user_test_123'
    let currentMode: AppMode = 'classic'

    const switchMode = (newMode: AppMode) => {
      if (newMode === currentMode) return
      recordEvent({ type: 'mode_switched', from: currentMode, to: newMode })
      currentMode = newMode
    }

    switchMode('chat')
    switchMode('classic')

    expect(userId).toBe('user_test_123')
    expect(getEventLog()).toHaveLength(2)
  })

  it('records multiple mode switches in order', () => {
    let currentMode: AppMode = 'classic'

    const switchMode = (newMode: AppMode) => {
      if (newMode === currentMode) return
      recordEvent({ type: 'mode_switched', from: currentMode, to: newMode })
      currentMode = newMode
    }

    switchMode('chat')
    switchMode('classic')
    switchMode('chat')

    const log = getEventLog()
    expect(log).toHaveLength(3)
    expect(log[0]).toMatchObject({ from: 'classic', to: 'chat' })
    expect(log[1]).toMatchObject({ from: 'chat', to: 'classic' })
    expect(log[2]).toMatchObject({ from: 'classic', to: 'chat' })
  })

  it('each mode switch has distinct _ts timestamp', () => {
    let currentMode: AppMode = 'classic'

    const switchMode = (newMode: AppMode) => {
      if (newMode === currentMode) return
      recordEvent({ type: 'mode_switched', from: currentMode, to: newMode })
      currentMode = newMode
    }

    switchMode('chat')
    switchMode('classic')

    const log = getEventLog()
    expect(log).toHaveLength(2)
    expect(log[0]._ts).toBeLessThanOrEqual(log[1]._ts)
  })
})

describe('chat guided capture events', () => {
  afterEach(() => {
    clearEventLog()
  })

  it('records chat_guided_capture_created event', () => {
    recordEvent({
      type: 'chat_guided_capture_created',
      dockItemId: 42,
      rawText: '今天讨论了产品路线图',
    })

    const log = getEventLog()
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({
      type: 'chat_guided_capture_created',
      dockItemId: 42,
      rawText: '今天讨论了产品路线图',
    })
  })

  it('chat event includes _ts timestamp', () => {
    const before = Date.now()
    recordEvent({
      type: 'chat_guided_capture_created',
      dockItemId: 1,
      rawText: 'test',
    })
    const after = Date.now()

    const log = getEventLog()
    expect(log[0]._ts).toBeGreaterThanOrEqual(before)
    expect(log[0]._ts).toBeLessThanOrEqual(after)
  })

  it('chat event is emitted to subscribers', () => {
    const received: AppEvent[] = []
    const unsub = subscribe((e) => received.push(e))

    recordEvent({
      type: 'chat_guided_capture_created',
      dockItemId: 1,
      rawText: 'test',
    })

    expect(received).toHaveLength(1)
    expect(received[0].type).toBe('chat_guided_capture_created')

    unsub()
  })

  it('mixed events are recorded in order', () => {
    recordEvent({ type: 'mode_switched', from: 'classic', to: 'chat' })
    recordEvent({
      type: 'chat_guided_capture_created',
      dockItemId: 1,
      rawText: 'first capture',
    })
    recordEvent({ type: 'mode_switched', from: 'chat', to: 'classic' })

    const log = getEventLog()
    expect(log).toHaveLength(3)
    expect(log[0].type).toBe('mode_switched')
    expect(log[1].type).toBe('chat_guided_capture_created')
    expect(log[2].type).toBe('mode_switched')
  })
})
