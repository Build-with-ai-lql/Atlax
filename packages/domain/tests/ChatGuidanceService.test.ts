import { describe, expect, it } from 'vitest'

import {
  buildInitialGuidanceState,
  buildRefillOptions,
  buildRefillPatch,
  buildRefieldPatch,
  canTransitionGuidance,
  createChatGuidanceService,
  getNextStep,
  getRandomDismissalMessage,
  buildRawTextFromState,
  type ChatGuidanceState,
} from '../src/services/ChatGuidanceService'

describe('ChatGuidanceService', () => {
  describe('full flow: topic -> type -> content -> confirmation -> confirm', () => {
    it('completes the full guidance flow', () => {
      const service = createChatGuidanceService()

      expect(service.getState().step).toBe('idle')

      service.start()
      expect(service.getState().step).toBe('awaiting_topic')
      expect(service.getCurrentPrompt()).toBe('这次记录是什么主题呢')

      service.submitTopic('项目会议')
      expect(service.getState().step).toBe('awaiting_type')
      expect(service.getState().topic).toBe('项目会议')
      expect(service.getCurrentPrompt()).toBe('这次记录是什么类型呢')

      service.submitType('meeting')
      expect(service.getState().step).toBe('awaiting_content')
      expect(service.getState().selectedType).toBe('meeting')
      expect(service.getCurrentPrompt()).toBe('你想记录些什么呢')

      service.submitContent('讨论了下一季度的产品规划')
      expect(service.getState().step).toBe('awaiting_confirmation')
      expect(service.getState().content).toBe('讨论了下一季度的产品规划')
      expect(service.getCurrentPrompt()).toBe('你看这样为你生成可以么')

      expect(service.canConfirm()).toBe(true)

      service.confirm()
      expect(service.getState().step).toBe('confirmed')
    })

    it('builds correct raw text from state', () => {
      const state: ChatGuidanceState = {
        step: 'awaiting_confirmation',
        topic: '项目会议',
        selectedType: 'meeting',
        content: '讨论了下一季度的产品规划',
        rawText: '',
      }

      const rawText = buildRawTextFromState(state)
      expect(rawText).toBe('项目会议\n[meeting]\n讨论了下一季度的产品规划')
    })
  })

  describe('cancel flow', () => {
    it('cancels from confirmation step', () => {
      const service = createChatGuidanceService()

      service.start()
      service.submitTopic('测试主题')
      service.submitType('task')
      service.submitContent('测试内容')

      expect(service.getState().step).toBe('awaiting_confirmation')

      service.cancel()
      expect(service.getState().step).toBe('cancelled')
    })
  })

  describe('dismissal message', () => {
    it('returns a positive dismissal message', () => {
      const message = getRandomDismissalMessage()
      expect(typeof message).toBe('string')
      expect(message.length).toBeGreaterThan(0)
      expect([
        '好的，期待你的下一次记录，下次再见！',
        '没问题，随时准备好记录你的想法！',
        '明白，等你准备好再开始吧！',
        '好的，保持这个状态，下次见！',
      ]).toContain(message)
    })

    it('returns different messages on multiple calls', () => {
      const messages = new Set<string>()
      for (let i = 0; i < 20; i++) {
        messages.add(getRandomDismissalMessage())
      }
      expect(messages.size).toBeGreaterThan(1)
    })
  })

  describe('refill options', () => {
    it('provides refill options for topic, type, and content', () => {
      const options = buildRefillOptions()
      expect(options).toHaveLength(3)
      expect(options.map((o) => o.value)).toEqual(['topic', 'type', 'content'])
      expect(options.map((o) => o.label)).toEqual(['标题', '类型', '内容'])
    })

    it('refills topic: clears topic, type, content; goes to awaiting_topic', () => {
      const service = createChatGuidanceService()

      service.start()
      service.submitTopic('原始主题')
      service.submitType('task')
      service.submitContent('原始内容')
      service.cancel()

      expect(service.getState().step).toBe('cancelled')

      service.refill('topic')
      expect(service.getState().step).toBe('awaiting_topic')
      expect(service.getState().topic).toBe('')
      expect(service.getState().selectedType).toBeNull()
      expect(service.getState().content).toBe('')
    })

    it('refills type: preserves topic, clears type and content; goes to awaiting_type', () => {
      const service = createChatGuidanceService()

      service.start()
      service.submitTopic('原始主题')
      service.submitType('task')
      service.submitContent('原始内容')
      service.cancel()

      service.refill('type')
      expect(service.getState().step).toBe('awaiting_type')
      expect(service.getState().topic).toBe('原始主题')
      expect(service.getState().selectedType).toBeNull()
      expect(service.getState().content).toBe('')
    })

    it('refills content: preserves topic and type, clears content; goes to awaiting_content', () => {
      const service = createChatGuidanceService()

      service.start()
      service.submitTopic('原始主题')
      service.submitType('task')
      service.submitContent('原始内容')
      service.cancel()

      service.refill('content')
      expect(service.getState().step).toBe('awaiting_content')
      expect(service.getState().topic).toBe('原始主题')
      expect(service.getState().selectedType).toBe('task')
      expect(service.getState().content).toBe('')
    })
  })

  describe('buildRefillPatch', () => {
    it('topic patch clears topic, selectedType, content', () => {
      const patch = buildRefillPatch('topic')
      expect(patch).toEqual({ topic: null, selectedType: null, content: '' })
    })

    it('type patch clears selectedType, content; preserves topic', () => {
      const patch = buildRefillPatch('type')
      expect(patch).toEqual({ selectedType: null, content: '' })
      expect(patch.topic).toBeUndefined()
    })

    it('content patch clears content only; preserves topic and selectedType', () => {
      const patch = buildRefillPatch('content')
      expect(patch).toEqual({ content: '' })
      expect(patch.topic).toBeUndefined()
      expect(patch.selectedType).toBeUndefined()
    })

    it('unknown option returns empty patch', () => {
      const patch = buildRefillPatch('unknown')
      expect(patch).toEqual({})
    })
  })

  describe('refield (single field edit)', () => {
    it('refields topic: only clears topic, preserves type and content', () => {
      const service = createChatGuidanceService()

      service.start()
      service.submitTopic('原始主题')
      service.submitType('task')
      service.submitContent('原始内容')
      service.cancel()

      service.refield('topic')
      expect(service.getState().step).toBe('awaiting_topic')
      expect(service.getState().topic).toBe('')
      expect(service.getState().selectedType).toBe('task')
      expect(service.getState().content).toBe('原始内容')
    })

    it('refields type: only clears selectedType, preserves topic and content', () => {
      const service = createChatGuidanceService()

      service.start()
      service.submitTopic('原始主题')
      service.submitType('task')
      service.submitContent('原始内容')
      service.cancel()

      service.refield('type')
      expect(service.getState().step).toBe('awaiting_type')
      expect(service.getState().topic).toBe('原始主题')
      expect(service.getState().selectedType).toBeNull()
      expect(service.getState().content).toBe('原始内容')
    })

    it('refields content: only clears content, preserves topic and type', () => {
      const service = createChatGuidanceService()

      service.start()
      service.submitTopic('原始主题')
      service.submitType('task')
      service.submitContent('原始内容')
      service.cancel()

      service.refield('content')
      expect(service.getState().step).toBe('awaiting_content')
      expect(service.getState().topic).toBe('原始主题')
      expect(service.getState().selectedType).toBe('task')
      expect(service.getState().content).toBe('')
    })

    it('refield does not trigger start transition', () => {
      const service = createChatGuidanceService()

      service.start()
      service.submitTopic('主题')
      service.submitType('note')
      service.submitContent('内容')
      service.cancel()

      service.refield('type')
      expect(service.getState().step).toBe('awaiting_type')
    })
  })

  describe('buildRefieldPatch', () => {
    it('topic patch clears topic only', () => {
      const patch = buildRefieldPatch('topic')
      expect(patch).toEqual({ topic: null })
      expect(patch.selectedType).toBeUndefined()
      expect(patch.content).toBeUndefined()
    })

    it('type patch clears selectedType only', () => {
      const patch = buildRefieldPatch('type')
      expect(patch).toEqual({ selectedType: null })
      expect(patch.topic).toBeUndefined()
      expect(patch.content).toBeUndefined()
    })

    it('content patch clears content only', () => {
      const patch = buildRefieldPatch('content')
      expect(patch).toEqual({ content: '' })
      expect(patch.topic).toBeUndefined()
      expect(patch.selectedType).toBeUndefined()
    })

    it('unknown option returns empty patch', () => {
      const patch = buildRefieldPatch('unknown')
      expect(patch).toEqual({})
    })
  })

  describe('reset', () => {
    it('resets to initial state', () => {
      const service = createChatGuidanceService()

      service.start()
      service.submitTopic('测试')
      service.submitType('note')
      service.submitContent('内容')

      service.reset()
      expect(service.getState()).toEqual(buildInitialGuidanceState())
    })
  })

  describe('state transitions', () => {
    it('validates transitions correctly', () => {
      expect(canTransitionGuidance('idle', 'start')).toBe(true)
      expect(canTransitionGuidance('awaiting_topic', 'submit_topic')).toBe(true)
      expect(canTransitionGuidance('awaiting_type', 'submit_type')).toBe(true)
      expect(canTransitionGuidance('awaiting_content', 'submit_content')).toBe(true)
      expect(canTransitionGuidance('awaiting_confirmation', 'confirm')).toBe(true)
      expect(canTransitionGuidance('awaiting_confirmation', 'cancel')).toBe(true)

      expect(canTransitionGuidance('idle', 'submit_topic')).toBe(false)
      expect(canTransitionGuidance('awaiting_topic', 'confirm')).toBe(false)
    })

    it('returns correct next step', () => {
      expect(getNextStep('idle', 'start')).toBe('awaiting_topic')
      expect(getNextStep('awaiting_topic', 'submit_topic')).toBe('awaiting_type')
      expect(getNextStep('awaiting_type', 'submit_type')).toBe('awaiting_content')
      expect(getNextStep('awaiting_content', 'submit_content')).toBe('awaiting_confirmation')
      expect(getNextStep('awaiting_confirmation', 'confirm')).toBe('confirmed')
      expect(getNextStep('awaiting_confirmation', 'cancel')).toBe('cancelled')
      expect(getNextStep('idle', 'invalid')).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('ignores empty topic submission', () => {
      const service = createChatGuidanceService()
      service.start()

      service.submitTopic('')
      expect(service.getState().step).toBe('awaiting_topic')
      expect(service.getState().topic).toBe('')
    })

    it('ignores empty type submission', () => {
      const service = createChatGuidanceService()
      service.start()
      service.submitTopic('topic')

      service.submitType('')
      expect(service.getState().step).toBe('awaiting_type')
      expect(service.getState().selectedType).toBeNull()
    })

    it('ignores empty content submission', () => {
      const service = createChatGuidanceService()
      service.start()
      service.submitTopic('topic')
      service.submitType('note')

      service.submitContent('')
      expect(service.getState().step).toBe('awaiting_content')
      expect(service.getState().content).toBe('')
    })

    it('trims whitespace from inputs', () => {
      const service = createChatGuidanceService()
      service.start()

      service.submitTopic('  带空格的主题  ')
      expect(service.getState().topic).toBe('带空格的主题')

      service.submitType('  note  ')
      expect(service.getState().selectedType).toBe('note')

      service.submitContent('  带空格的内容  ')
      expect(service.getState().content).toBe('带空格的内容')
    })
  })

  describe('getRawText', () => {
    it('returns raw text after content submission', () => {
      const service = createChatGuidanceService()
      service.start()
      service.submitTopic('主题')
      service.submitType('note')
      service.submitContent('内容')

      const rawText = service.getRawText()
      expect(rawText).toBe('主题\n[note]\n内容')
    })
  })
})