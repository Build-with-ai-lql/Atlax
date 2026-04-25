import { describe, expect, it } from 'vitest'

import { canTransition, VALID_TRANSITIONS } from '../src/state-machine'

describe('state-machine', () => {
  it('allows valid transitions', () => {
    expect(canTransition('pending', 'suggested')).toBe(true)
    expect(canTransition('pending', 'ignored')).toBe(true)
    expect(canTransition('suggested', 'archived')).toBe(true)
    expect(canTransition('suggested', 'ignored')).toBe(true)
    expect(canTransition('archived', 'reopened')).toBe(true)
    expect(canTransition('ignored', 'pending')).toBe(true)
    expect(canTransition('reopened', 'suggested')).toBe(true)
    expect(canTransition('reopened', 'ignored')).toBe(true)
    expect(canTransition('reopened', 'archived')).toBe(true)
  })

  it('blocks invalid transitions', () => {
    expect(canTransition('pending', 'archived')).toBe(false)
    expect(canTransition('suggested', 'pending')).toBe(false)
    expect(canTransition('archived', 'pending')).toBe(false)
    expect(canTransition('archived', 'suggested')).toBe(false)
    expect(canTransition('ignored', 'suggested')).toBe(false)
    expect(canTransition('reopened', 'pending')).toBe(false)
  })

  it('exposes valid transition table', () => {
    const transitions = VALID_TRANSITIONS
    expect(Object.keys(transitions)).toContain('pending')
    expect(Object.keys(transitions)).toContain('suggested')
    expect(Object.keys(transitions)).toContain('archived')
    expect(Object.keys(transitions)).toContain('ignored')
    expect(Object.keys(transitions)).toContain('reopened')
  })

  it('supports re-organize flow (archived -> reopened -> suggested -> archived)', () => {
    expect(canTransition('archived', 'reopened')).toBe(true)
    expect(canTransition('reopened', 'suggested')).toBe(true)
    expect(canTransition('suggested', 'archived')).toBe(true)
  })
})
