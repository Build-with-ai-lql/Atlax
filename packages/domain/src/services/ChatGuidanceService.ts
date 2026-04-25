export type ChatGuidanceStep =
  | 'idle'
  | 'awaiting_topic'
  | 'awaiting_type'
  | 'awaiting_content'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'cancelled'

export interface ChatGuidanceState {
  step: ChatGuidanceStep
  topic: string
  selectedType: string | null
  content: string
  rawText: string
}

export interface ChatGuidanceTransition {
  from: ChatGuidanceStep
  to: ChatGuidanceStep
  action: string
}

export const CHAT_GUIDANCE_TRANSITIONS: ChatGuidanceTransition[] = [
  { from: 'idle', to: 'awaiting_topic', action: 'start' },
  { from: 'awaiting_topic', to: 'awaiting_type', action: 'submit_topic' },
  { from: 'awaiting_type', to: 'awaiting_content', action: 'submit_type' },
  { from: 'awaiting_content', to: 'awaiting_confirmation', action: 'submit_content' },
  { from: 'awaiting_confirmation', to: 'confirmed', action: 'confirm' },
  { from: 'awaiting_confirmation', to: 'cancelled', action: 'cancel' },
  { from: 'cancelled', to: 'idle', action: 'reset' },
  { from: 'confirmed', to: 'idle', action: 'reset' },
]

export function canTransitionGuidance(current: ChatGuidanceStep, action: string): boolean {
  return CHAT_GUIDANCE_TRANSITIONS.some(
    (t) => t.from === current && t.action === action
  )
}

export function getNextStep(current: ChatGuidanceStep, action: string): ChatGuidanceStep | null {
  const transition = CHAT_GUIDANCE_TRANSITIONS.find(
    (t) => t.from === current && t.action === action
  )
  return transition ? transition.to : null
}

export function buildInitialGuidanceState(): ChatGuidanceState {
  return {
    step: 'idle',
    topic: '',
    selectedType: null,
    content: '',
    rawText: '',
  }
}

export function buildGuidancePrompt(step: ChatGuidanceStep): string {
  switch (step) {
    case 'idle':
      return ''
    case 'awaiting_topic':
      return '这次记录是什么主题呢'
    case 'awaiting_type':
      return '这次记录是什么类型呢'
    case 'awaiting_content':
      return '你想记录些什么呢'
    case 'awaiting_confirmation':
      return '你看这样为你生成可以么'
    case 'confirmed':
      return ''
    case 'cancelled':
      return ''
  }
}

export function applyGuidanceTransition(
  state: ChatGuidanceState,
  action: string,
  payload?: { topic?: string; type?: string; content?: string }
): ChatGuidanceState {
  const nextStep = getNextStep(state.step, action)
  if (!nextStep) {
    return state
  }

  const newState: ChatGuidanceState = { ...state, step: nextStep }

  if (action === 'submit_topic' && payload?.topic) {
    newState.topic = payload.topic
  }
  if (action === 'submit_type' && payload?.type) {
    newState.selectedType = payload.type
  }
  if (action === 'submit_content' && payload?.content) {
    newState.content = payload.content
    newState.rawText = buildRawTextFromState(newState)
  }

  return newState
}

export function buildRawTextFromState(state: ChatGuidanceState): string {
  const parts: string[] = []
  if (state.topic) {
    parts.push(state.topic)
  }
  if (state.selectedType) {
    parts.push(`[${state.selectedType}]`)
  }
  if (state.content) {
    parts.push(state.content)
  }
  return parts.join('\n')
}

export function buildRefillOptions(): Array<{ value: string; label: string }> {
  return [
    { value: 'topic', label: '标题' },
    { value: 'type', label: '类型' },
    { value: 'content', label: '内容' },
  ]
}

export function refillStateFromOption(
  state: ChatGuidanceState,
  option: string
): ChatGuidanceState {
  const newState = { ...state }

  switch (option) {
    case 'topic':
      newState.step = 'awaiting_topic'
      newState.topic = ''
      break
    case 'type':
      newState.step = 'awaiting_type'
      newState.selectedType = null
      break
    case 'content':
      newState.step = 'awaiting_content'
      newState.content = ''
      newState.rawText = ''
      break
  }

  return newState
}

const POSITIVE_DISMISSAL_MESSAGES = [
  '好的，期待你的下一次记录，下次再见！',
  '没问题，随时准备好记录你的想法！',
  '明白，等你准备好再开始吧！',
  '好的，保持这个状态，下次见！',
]

export function getRandomDismissalMessage(): string {
  const index = Math.floor(Math.random() * POSITIVE_DISMISSAL_MESSAGES.length)
  return POSITIVE_DISMISSAL_MESSAGES[index]
}

export interface ChatGuidanceService {
  getState(): ChatGuidanceState
  start(): ChatGuidanceState
  submitTopic(topic: string): ChatGuidanceState
  submitType(type: string): ChatGuidanceState
  submitContent(content: string): ChatGuidanceState
  confirm(): ChatGuidanceState
  cancel(): ChatGuidanceState
  refill(option: string): ChatGuidanceState
  reset(): ChatGuidanceState
  getCurrentPrompt(): string
  canConfirm(): boolean
  getRawText(): string
}

export function createChatGuidanceService(): ChatGuidanceService {
  let state = buildInitialGuidanceState()

  return {
    getState(): ChatGuidanceState {
      return { ...state }
    },

    start(): ChatGuidanceState {
      if (state.step === 'idle') {
        state = applyGuidanceTransition(state, 'start')
      }
      return this.getState()
    },

    submitTopic(topic: string): ChatGuidanceState {
      if (state.step === 'awaiting_topic' && topic.trim()) {
        state = applyGuidanceTransition(state, 'submit_topic', { topic: topic.trim() })
      }
      return this.getState()
    },

    submitType(type: string): ChatGuidanceState {
      if (state.step === 'awaiting_type' && type.trim()) {
        state = applyGuidanceTransition(state, 'submit_type', { type: type.trim() })
      }
      return this.getState()
    },

    submitContent(content: string): ChatGuidanceState {
      if (state.step === 'awaiting_content' && content.trim()) {
        state = applyGuidanceTransition(state, 'submit_content', { content: content.trim() })
      }
      return this.getState()
    },

    confirm(): ChatGuidanceState {
      if (state.step === 'awaiting_confirmation') {
        state = applyGuidanceTransition(state, 'confirm')
      }
      return this.getState()
    },

    cancel(): ChatGuidanceState {
      if (state.step === 'awaiting_confirmation') {
        state = applyGuidanceTransition(state, 'cancel')
      }
      return this.getState()
    },

    refill(option: string): ChatGuidanceState {
      if (state.step === 'cancelled') {
        state = refillStateFromOption(state, option)
        state = applyGuidanceTransition(state, 'start')
      }
      return this.getState()
    },

    reset(): ChatGuidanceState {
      state = buildInitialGuidanceState()
      return this.getState()
    },

    getCurrentPrompt(): string {
      return buildGuidancePrompt(state.step)
    },

    canConfirm(): boolean {
      return state.step === 'awaiting_confirmation'
    },

    getRawText(): string {
      return buildRawTextFromState(state)
    },
  }
}