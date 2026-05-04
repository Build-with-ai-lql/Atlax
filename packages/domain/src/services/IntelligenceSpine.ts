export type RecommendationStatus =
  | 'generated'
  | 'shown'
  | 'accepted'
  | 'rejected'
  | 'modified'
  | 'ignored'

export type RecommendationSubjectType = 'dockItem' | 'entry' | 'document' | 'mindNode'

export type RecommendationCandidateType = 'tag' | 'project' | 'mindNode' | 'entry' | 'document'

export interface Recommendation {
  id: string
  userId: string
  subjectType: RecommendationSubjectType
  subjectId: number | string
  recommendationType: string
  candidateType: RecommendationCandidateType
  candidateId: string
  confidenceScore: number
  reasonJson: string | null
  status: RecommendationStatus
  createdAt: Date
  updatedAt: Date
}

export interface RecommendationCreateInput {
  userId: string
  subjectType: RecommendationSubjectType
  subjectId: number | string
  recommendationType: string
  candidateType: RecommendationCandidateType
  candidateId: string
  confidenceScore: number
  reasonJson?: string | null
  status?: RecommendationStatus
}

export type RecommendationEventType =
  | 'recommendation_generated'
  | 'recommendation_shown'
  | 'recommendation_accepted'
  | 'recommendation_rejected'
  | 'recommendation_modified'
  | 'recommendation_ignored'

export interface RecommendationEvent {
  id: string
  recommendationId: string
  userId: string
  eventType: RecommendationEventType
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export interface RecommendationEventInput {
  recommendationId: string
  userId: string
  eventType: RecommendationEventType
  metadata?: Record<string, unknown> | null
}

export type UserBehaviorEventType =
  | 'page_view'
  | 'search'
  | 'click'
  | 'scroll'
  | 'focus'
  | 'hover'
  | 'navigate'
  | 'edit'
  | 'create'
  | 'delete'
  | 'archive'
  | 'reopen'
  | RecommendationEventType

export type UserBehaviorSubjectType = 'dockItem' | 'entry' | 'document' | 'mindNode' | 'tag' | 'project' | 'recommendation' | 'widget' | 'tab'

export interface UserBehaviorEvent {
  id: string
  userId: string
  eventType: UserBehaviorEventType
  subjectType: UserBehaviorSubjectType
  subjectId: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export interface UserBehaviorEventInput {
  userId: string
  eventType: UserBehaviorEventType
  subjectType: UserBehaviorSubjectType
  subjectId?: string | null
  metadata?: Record<string, unknown> | null
}

export function makeRecommendationId(userId: string, timestamp: number): string {
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${userId}_rec_${timestamp}_${suffix}`
}

export function makeRecommendationEventId(userId: string, recommendationId: string, timestamp: number): string {
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${userId}_recevt_${recommendationId}_${timestamp}_${suffix}`
}

export type RecommendationFeedbackType = 'accepted' | 'rejected' | 'modified' | 'ignored'

export interface RecommendationFeedbackInput {
  recommendationId: string
  userId: string
  feedbackType: RecommendationFeedbackType
  feedbackPayload?: Record<string, unknown> | null
}

export interface RecommendationFeedbackResult {
  recommendation: {
    id: string
    status: RecommendationStatus
    updatedAt: Date
  }
  feedbackEvent: {
    id: string
    eventType: RecommendationEventType
    recommendationId: string
  }
}

export interface RecommendationShownInput {
  recommendationId: string
  userId: string
}

export interface RecommendationShownResult {
  recommendation: {
    id: string
    status: RecommendationStatus
    updatedAt: Date
  }
  shownEvent: {
    id: string
    eventType: RecommendationEventType
    recommendationId: string
  }
}

export function feedbackTypeToStatus(feedbackType: RecommendationFeedbackType): RecommendationStatus {
  return feedbackType
}

export function feedbackTypeToEventType(feedbackType: RecommendationFeedbackType): RecommendationEventType {
  switch (feedbackType) {
    case 'accepted':
      return 'recommendation_accepted'
    case 'rejected':
      return 'recommendation_rejected'
    case 'modified':
      return 'recommendation_modified'
    case 'ignored':
      return 'recommendation_ignored'
  }
}

export function makeUserBehaviorEventId(userId: string, eventType: UserBehaviorEventType, timestamp: number): string {
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${userId}_ube_${eventType}_${timestamp}_${suffix}`
}
