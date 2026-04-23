import { afterEach, describe, expect, it } from 'vitest'

import {
  clearEventLog,
  computeMetrics,
  getEventLog,
  recordEvent,
  type PersistedEvent,
} from '@/lib/events'

describe('event tracking completeness', () => {
  afterEach(clearEventLog)

  it('records capture_created event', () => {
    recordEvent({ type: 'capture_created', sourceType: 'text', dockItemId: 1 })
    const log = getEventLog()
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({ type: 'capture_created', sourceType: 'text', dockItemId: 1 })
  })

  it('records chat_guided_capture_created event', () => {
    recordEvent({ type: 'chat_guided_capture_created', dockItemId: 2, rawText: 'test' })
    const log = getEventLog()
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({ type: 'chat_guided_capture_created', dockItemId: 2 })
  })

  it('records archive_completed event', () => {
    recordEvent({ type: 'archive_completed', dockItemId: 1, sourceType: 'text' })
    const log = getEventLog()
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({ type: 'archive_completed', sourceType: 'text' })
  })

  it('records archive_completed with chat sourceType', () => {
    recordEvent({ type: 'archive_completed', dockItemId: 2, sourceType: 'chat' })
    const log = getEventLog()
    expect(log[0]).toMatchObject({ type: 'archive_completed', sourceType: 'chat' })
  })

  it('records mode_switched event', () => {
    recordEvent({ type: 'mode_switched', from: 'classic', to: 'chat' })
    const log = getEventLog()
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({ type: 'mode_switched', from: 'classic', to: 'chat' })
  })

  it('records weekly_review_opened event', () => {
    recordEvent({ type: 'weekly_review_opened' })
    const log = getEventLog()
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({ type: 'weekly_review_opened' })
  })

  it('records browse_revisit event', () => {
    recordEvent({ type: 'browse_revisit', entryId: 42 })
    const log = getEventLog()
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({ type: 'browse_revisit', entryId: 42 })
  })

  it('all events include _ts timestamp', () => {
    recordEvent({ type: 'capture_created', sourceType: 'text', dockItemId: 1 })
    recordEvent({ type: 'archive_completed', dockItemId: 1, sourceType: 'text' })
    recordEvent({ type: 'weekly_review_opened' })

    const log = getEventLog()
    for (const event of log) {
      expect(event._ts).toBeTypeOf('number')
      expect(event._ts).toBeGreaterThan(0)
    }
  })
})

describe('metrics computation', () => {
  afterEach(clearEventLog)

  function makeEvent(type: string, extra: Record<string, unknown> = {}, tsOffset = 0): PersistedEvent {
    return { type, ...extra, _ts: Date.now() - tsOffset } as PersistedEvent
  }

  it('DAU is 1 when capture events exist today', () => {
    const events = [
      makeEvent('capture_created', { sourceType: 'text', dockItemId: 1 }),
    ]
    const metrics = computeMetrics(events)
    expect(metrics.dau).toBe(1)
  })

  it('DAU is 0 when no capture events today', () => {
    const events: PersistedEvent[] = []
    const metrics = computeMetrics(events)
    expect(metrics.dau).toBe(0)
  })

  it('dailyCapturesPerUser counts today captures', () => {
    const events = [
      makeEvent('capture_created', { sourceType: 'text', dockItemId: 1 }),
      makeEvent('capture_created', { sourceType: 'text', dockItemId: 2 }),
      makeEvent('chat_guided_capture_created', { dockItemId: 3, rawText: 'test' }),
    ]
    const metrics = computeMetrics(events)
    expect(metrics.dailyCapturesPerUser).toBe(3)
  })

  it('chatArchiveRate computes chat captures vs chat archives', () => {
    const events = [
      makeEvent('capture_created', { sourceType: 'chat', dockItemId: 1 }),
      makeEvent('capture_created', { sourceType: 'chat', dockItemId: 2 }),
      makeEvent('archive_completed', { dockItemId: 1, sourceType: 'chat' }),
    ]
    const metrics = computeMetrics(events)
    expect(metrics.chatArchiveRate).toBe(0.5)
  })

  it('chatArchiveRate is 0 when no chat captures', () => {
    const events = [
      makeEvent('capture_created', { sourceType: 'text', dockItemId: 1 }),
    ]
    const metrics = computeMetrics(events)
    expect(metrics.chatArchiveRate).toBe(0)
  })

  it('retention7d is 1 for new users', () => {
    const events = [
      makeEvent('capture_created', { sourceType: 'text', dockItemId: 1 }),
    ]
    const metrics = computeMetrics(events)
    expect(metrics.retention7d).toBe(1)
  })

  it('weeklyReviewOpenRate counts review events per day', () => {
    const events = [
      makeEvent('capture_created', { sourceType: 'text', dockItemId: 1 }),
      makeEvent('weekly_review_opened'),
      makeEvent('weekly_review_opened'),
    ]
    const metrics = computeMetrics(events)
    expect(metrics.weeklyReviewOpenRate).toBeGreaterThan(0)
  })

  it('metrics result includes generatedAt timestamp', () => {
    const metrics = computeMetrics([])
    expect(metrics.generatedAt).toBeTypeOf('number')
    expect(metrics.generatedAt).toBeGreaterThan(0)
  })

  it('chatArchiveRate deduplicates by dockItemId (reopen + re-archive)', () => {
    const events = [
      makeEvent('capture_created', { sourceType: 'chat', dockItemId: 1 }),
      makeEvent('archive_completed', { dockItemId: 1, sourceType: 'chat' }),
      makeEvent('archive_completed', { dockItemId: 1, sourceType: 'chat' }),
    ]
    const metrics = computeMetrics(events)
    expect(metrics.chatArchiveRate).toBe(1)
  })

  it('chatArchiveRate never exceeds 1', () => {
    const events = [
      makeEvent('capture_created', { sourceType: 'chat', dockItemId: 1 }),
      makeEvent('capture_created', { sourceType: 'chat', dockItemId: 2 }),
      makeEvent('archive_completed', { dockItemId: 1, sourceType: 'chat' }),
      makeEvent('archive_completed', { dockItemId: 1, sourceType: 'chat' }),
      makeEvent('archive_completed', { dockItemId: 1, sourceType: 'chat' }),
    ]
    const metrics = computeMetrics(events)
    expect(metrics.chatArchiveRate).toBeLessThanOrEqual(1)
  })

  it('retention7d works with out-of-order events', () => {
    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    const sevenDaysMs = 7 * oneDayMs
    const events = [
      { type: 'capture_created', sourceType: 'text', dockItemId: 1, _ts: now - sevenDaysMs - oneDayMs } as PersistedEvent,
      { type: 'capture_created', sourceType: 'text', dockItemId: 2, _ts: now - sevenDaysMs - 2 * oneDayMs } as PersistedEvent,
      { type: 'capture_created', sourceType: 'text', dockItemId: 3, _ts: now - sevenDaysMs - 3 * oneDayMs } as PersistedEvent,
    ]
    const metrics = computeMetrics(events)
    expect(metrics.retention7d).toBe(0)
  })

  it('retention7d is 1 when D7 activity exists for old user', () => {
    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    const sevenDaysMs = 7 * oneDayMs
    const cohortTs = now - sevenDaysMs - 5 * oneDayMs
    const events = [
      { type: 'capture_created', sourceType: 'text', dockItemId: 1, _ts: cohortTs } as PersistedEvent,
      { type: 'capture_created', sourceType: 'text', dockItemId: 2, _ts: cohortTs + sevenDaysMs } as PersistedEvent,
    ]
    const metrics = computeMetrics(events)
    expect(metrics.retention7d).toBe(1)
  })

  it('retention7d is 0 for old user active recently but not at D7', () => {
    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    const cohortTs = now - 30 * oneDayMs
    const events = [
      { type: 'capture_created', sourceType: 'text', dockItemId: 1, _ts: cohortTs } as PersistedEvent,
      { type: 'capture_created', sourceType: 'text', dockItemId: 2, _ts: now - oneDayMs } as PersistedEvent,
    ]
    const metrics = computeMetrics(events)
    expect(metrics.retention7d).toBe(0)
  })
})
