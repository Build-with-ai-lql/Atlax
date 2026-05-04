import { afterEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  createRecommendation,
  listRecommendations,
  updateRecommendationStatus,
  recordRecommendationEvent,
  listRecommendationEvents,
  recordUserBehaviorEvent,
  listUserBehaviorEvents,
} from '@/lib/repository'

const USER_A = 'user_test_a'
const USER_B = 'user_test_b'

async function cleanAll() {
  await db.table('recommendations').clear()
  await db.table('recommendationEvents').clear()
  await db.table('userBehaviorEvents').clear()
}

function unwrap<T>(value: T | null): T {
  expect(value).not.toBeNull()
  return value as T
}

describe('intelligence spine', () => {
  afterEach(cleanAll)

  describe('createRecommendation', () => {
    it('creates a recommendation with generated status', async () => {
      const rec = await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_frontend',
        confidenceScore: 0.85,
        reasonJson: '{"reason": "高频出现"}',
      })

      expect(rec.id).toBeTruthy()
      expect(rec.userId).toBe(USER_A)
      expect(rec.subjectType).toBe('dockItem')
      expect(rec.subjectId).toBe(1)
      expect(rec.recommendationType).toBe('tag_suggestion')
      expect(rec.candidateType).toBe('tag')
      expect(rec.candidateId).toBe('tag_frontend')
      expect(rec.confidenceScore).toBe(0.85)
      expect(rec.reasonJson).toBe('{"reason": "高频出现"}')
      expect(rec.status).toBe('generated')
      expect(rec.createdAt).toBeInstanceOf(Date)
      expect(rec.updatedAt).toBeInstanceOf(Date)
    })

    it('creates a recommendation with custom status', async () => {
      const rec = await createRecommendation({
        userId: USER_A,
        subjectType: 'entry',
        subjectId: 100,
        recommendationType: 'project_suggestion',
        candidateType: 'project',
        candidateId: 'proj_ai',
        confidenceScore: 0.6,
        status: 'shown',
      })

      expect(rec.status).toBe('shown')
    })
  })

  describe('listRecommendations', () => {
    it('lists recommendations for a user', async () => {
      await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })
      await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 2,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_b',
        confidenceScore: 0.7,
      })

      const recs = await listRecommendations(USER_A)
      expect(recs).toHaveLength(2)
      expect(recs[0].userId).toBe(USER_A)
      expect(recs[1].userId).toBe(USER_A)
    })

    it('filters recommendations by status', async () => {
      await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
        status: 'generated',
      })
      await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 2,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_b',
        confidenceScore: 0.7,
        status: 'accepted',
      })

      const generated = await listRecommendations(USER_A, { status: 'generated' })
      expect(generated).toHaveLength(1)
      expect(generated[0].candidateId).toBe('tag_a')

      const accepted = await listRecommendations(USER_A, { status: 'accepted' })
      expect(accepted).toHaveLength(1)
      expect(accepted[0].candidateId).toBe('tag_b')
    })

    it('filters recommendations by subjectType', async () => {
      await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })
      await createRecommendation({
        userId: USER_A,
        subjectType: 'entry',
        subjectId: 100,
        recommendationType: 'node_suggestion',
        candidateType: 'mindNode',
        candidateId: 'node_x',
        confidenceScore: 0.5,
      })

      const dockItemRecs = await listRecommendations(USER_A, { subjectType: 'dockItem' })
      expect(dockItemRecs).toHaveLength(1)
      expect(dockItemRecs[0].subjectType).toBe('dockItem')

      const entryRecs = await listRecommendations(USER_A, { subjectType: 'entry' })
      expect(entryRecs).toHaveLength(1)
      expect(entryRecs[0].subjectType).toBe('entry')
    })

    it('returns empty array for user with no recommendations', async () => {
      const recs = await listRecommendations(USER_A)
      expect(recs).toEqual([])
    })
  })

  describe('updateRecommendationStatus', () => {
    it('updates status from generated to accepted', async () => {
      const rec = await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })

      const updated = await updateRecommendationStatus(rec.id, 'accepted')
      expect(updated).not.toBeNull()
      expect(unwrap(updated).status).toBe('accepted')
      expect(unwrap(updated).id).toBe(rec.id)
    })

    it('updates status from shown to rejected', async () => {
      const rec = await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
        status: 'shown',
      })

      const updated = await updateRecommendationStatus(rec.id, 'rejected')
      expect(unwrap(updated).status).toBe('rejected')
    })

    it('updates status to modified', async () => {
      const rec = await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })

      const updated = await updateRecommendationStatus(rec.id, 'modified')
      expect(unwrap(updated).status).toBe('modified')
    })

    it('updates status to ignored', async () => {
      const rec = await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })

      const updated = await updateRecommendationStatus(rec.id, 'ignored')
      expect(unwrap(updated).status).toBe('ignored')
    })

    it('returns null for non-existent recommendation', async () => {
      const result = await updateRecommendationStatus('non_existent_id', 'accepted')
      expect(result).toBeNull()
    })
  })

  describe('recordRecommendationEvent', () => {
    it('records a recommendation event', async () => {
      const rec = await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })

      const evt = await recordRecommendationEvent({
        recommendationId: rec.id,
        userId: USER_A,
        eventType: 'recommendation_generated',
        metadata: { source: 'local' },
      })

      expect(evt.id).toBeTruthy()
      expect(evt.recommendationId).toBe(rec.id)
      expect(evt.userId).toBe(USER_A)
      expect(evt.eventType).toBe('recommendation_generated')
      expect(evt.metadata).toEqual({ source: 'local' })
      expect(evt.createdAt).toBeInstanceOf(Date)
    })

    it('records multiple recommendation events for same recommendation', async () => {
      const rec = await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })

      await recordRecommendationEvent({
        recommendationId: rec.id,
        userId: USER_A,
        eventType: 'recommendation_shown',
      })
      await recordRecommendationEvent({
        recommendationId: rec.id,
        userId: USER_A,
        eventType: 'recommendation_accepted',
      })

      const events = await listRecommendationEvents(USER_A)
      expect(events).toHaveLength(2)
      const eventTypes = events.map((e) => e.eventType).sort()
      expect(eventTypes).toEqual(['recommendation_accepted', 'recommendation_shown'])
    })
  })

  describe('listRecommendationEvents', () => {
    it('lists recommendation events for a user', async () => {
      const rec = await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })

      await recordRecommendationEvent({
        recommendationId: rec.id,
        userId: USER_A,
        eventType: 'recommendation_generated',
      })

      const events = await listRecommendationEvents(USER_A)
      expect(events).toHaveLength(1)
      expect(events[0].userId).toBe(USER_A)
    })

    it('filters by recommendationId', async () => {
      const rec1 = await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })
      const rec2 = await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 2,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_b',
        confidenceScore: 0.7,
      })

      await recordRecommendationEvent({
        recommendationId: rec1.id,
        userId: USER_A,
        eventType: 'recommendation_generated',
      })
      await recordRecommendationEvent({
        recommendationId: rec2.id,
        userId: USER_A,
        eventType: 'recommendation_generated',
      })

      const events1 = await listRecommendationEvents(USER_A, { recommendationId: rec1.id })
      expect(events1).toHaveLength(1)
      expect(events1[0].recommendationId).toBe(rec1.id)
    })

    it('filters by eventType', async () => {
      const rec = await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })

      await recordRecommendationEvent({
        recommendationId: rec.id,
        userId: USER_A,
        eventType: 'recommendation_generated',
      })
      await recordRecommendationEvent({
        recommendationId: rec.id,
        userId: USER_A,
        eventType: 'recommendation_shown',
      })

      const generated = await listRecommendationEvents(USER_A, { eventType: 'recommendation_generated' })
      expect(generated).toHaveLength(1)
      expect(generated[0].eventType).toBe('recommendation_generated')
    })

    it('returns empty array for user with no events', async () => {
      const events = await listRecommendationEvents(USER_A)
      expect(events).toEqual([])
    })
  })

  describe('recordUserBehaviorEvent', () => {
    it('records a user behavior event', async () => {
      const evt = await recordUserBehaviorEvent({
        userId: USER_A,
        eventType: 'page_view',
        targetType: 'dockItem',
        targetId: '1',
        fromContext: 'dock',
        toContext: 'editor',
        metadata: { duration: 5000 },
      })

      expect(evt.id).toBeTruthy()
      expect(evt.userId).toBe(USER_A)
      expect(evt.eventType).toBe('page_view')
      expect(evt.targetType).toBe('dockItem')
      expect(evt.targetId).toBe('1')
      expect(evt.fromContext).toBe('dock')
      expect(evt.toContext).toBe('editor')
      expect(evt.metadata).toEqual({ duration: 5000 })
      expect(evt.createdAt).toBeInstanceOf(Date)
    })

    it('records event with null contexts', async () => {
      const evt = await recordUserBehaviorEvent({
        userId: USER_A,
        eventType: 'click',
        targetType: 'tab',
      })

      expect(evt.fromContext).toBeNull()
      expect(evt.toContext).toBeNull()
      expect(evt.targetId).toBeNull()
    })

    it('records multiple behavior event types', async () => {
      await recordUserBehaviorEvent({
        userId: USER_A,
        eventType: 'page_view',
        targetType: 'dockItem',
      })
      await recordUserBehaviorEvent({
        userId: USER_A,
        eventType: 'click',
        targetType: 'tag',
        targetId: 'tag_frontend',
      })
      await recordUserBehaviorEvent({
        userId: USER_A,
        eventType: 'edit',
        targetType: 'entry',
        targetId: '100',
      })

      const events = await listUserBehaviorEvents(USER_A)
      expect(events).toHaveLength(3)
    })
  })

  describe('listUserBehaviorEvents', () => {
    it('lists user behavior events for a user', async () => {
      await recordUserBehaviorEvent({
        userId: USER_A,
        eventType: 'page_view',
        targetType: 'dockItem',
      })

      const events = await listUserBehaviorEvents(USER_A)
      expect(events).toHaveLength(1)
      expect(events[0].userId).toBe(USER_A)
    })

    it('filters by eventType', async () => {
      await recordUserBehaviorEvent({
        userId: USER_A,
        eventType: 'page_view',
        targetType: 'dockItem',
      })
      await recordUserBehaviorEvent({
        userId: USER_A,
        eventType: 'click',
        targetType: 'tag',
      })

      const views = await listUserBehaviorEvents(USER_A, { eventType: 'page_view' })
      expect(views).toHaveLength(1)
      expect(views[0].eventType).toBe('page_view')

      const clicks = await listUserBehaviorEvents(USER_A, { eventType: 'click' })
      expect(clicks).toHaveLength(1)
      expect(clicks[0].eventType).toBe('click')
    })

    it('filters by targetType', async () => {
      await recordUserBehaviorEvent({
        userId: USER_A,
        eventType: 'click',
        targetType: 'dockItem',
      })
      await recordUserBehaviorEvent({
        userId: USER_A,
        eventType: 'click',
        targetType: 'tag',
      })

      const dockClicks = await listUserBehaviorEvents(USER_A, { targetType: 'dockItem' })
      expect(dockClicks).toHaveLength(1)
      expect(dockClicks[0].targetType).toBe('dockItem')
    })

    it('returns empty array for user with no events', async () => {
      const events = await listUserBehaviorEvents(USER_A)
      expect(events).toEqual([])
    })
  })

  describe('userId isolation', () => {
    it('recommendations are isolated between users', async () => {
      await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })
      await createRecommendation({
        userId: USER_B,
        subjectType: 'dockItem',
        subjectId: 2,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_b',
        confidenceScore: 0.5,
      })

      const recsA = await listRecommendations(USER_A)
      const recsB = await listRecommendations(USER_B)

      expect(recsA).toHaveLength(1)
      expect(recsA[0].userId).toBe(USER_A)
      expect(recsA[0].candidateId).toBe('tag_a')

      expect(recsB).toHaveLength(1)
      expect(recsB[0].userId).toBe(USER_B)
      expect(recsB[0].candidateId).toBe('tag_b')
    })

    it('recommendation events are isolated between users', async () => {
      const recA = await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })
      const recB = await createRecommendation({
        userId: USER_B,
        subjectType: 'dockItem',
        subjectId: 2,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_b',
        confidenceScore: 0.5,
      })

      await recordRecommendationEvent({
        recommendationId: recA.id,
        userId: USER_A,
        eventType: 'recommendation_generated',
      })
      await recordRecommendationEvent({
        recommendationId: recB.id,
        userId: USER_B,
        eventType: 'recommendation_shown',
      })

      const eventsA = await listRecommendationEvents(USER_A)
      const eventsB = await listRecommendationEvents(USER_B)

      expect(eventsA).toHaveLength(1)
      expect(eventsA[0].userId).toBe(USER_A)
      expect(eventsB).toHaveLength(1)
      expect(eventsB[0].userId).toBe(USER_B)
    })

    it('user behavior events are isolated between users', async () => {
      await recordUserBehaviorEvent({
        userId: USER_A,
        eventType: 'page_view',
        targetType: 'dockItem',
      })
      await recordUserBehaviorEvent({
        userId: USER_B,
        eventType: 'click',
        targetType: 'tag',
      })

      const eventsA = await listUserBehaviorEvents(USER_A)
      const eventsB = await listUserBehaviorEvents(USER_B)

      expect(eventsA).toHaveLength(1)
      expect(eventsA[0].userId).toBe(USER_A)
      expect(eventsA[0].eventType).toBe('page_view')

      expect(eventsB).toHaveLength(1)
      expect(eventsB[0].userId).toBe(USER_B)
      expect(eventsB[0].eventType).toBe('click')
    })

    it('cross-user data does not pollute each other', async () => {
      await createRecommendation({
        userId: USER_A,
        subjectType: 'dockItem',
        subjectId: 1,
        recommendationType: 'tag_suggestion',
        candidateType: 'tag',
        candidateId: 'tag_a',
        confidenceScore: 0.9,
      })
      await recordUserBehaviorEvent({
        userId: USER_A,
        eventType: 'page_view',
        targetType: 'dockItem',
      })
      await recordUserBehaviorEvent({
        userId: USER_B,
        eventType: 'edit',
        targetType: 'entry',
        targetId: '100',
      })

      const recsA = await listRecommendations(USER_A)
      const recsB = await listRecommendations(USER_B)
      const eventsA = await listUserBehaviorEvents(USER_A)
      const eventsB = await listUserBehaviorEvents(USER_B)

      expect(recsA).toHaveLength(1)
      expect(recsB).toHaveLength(0)
      expect(eventsA).toHaveLength(1)
      expect(eventsB).toHaveLength(1)
    })
  })
})
