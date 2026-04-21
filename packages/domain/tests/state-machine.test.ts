import { describe, expect, it } from 'vitest'

import { VALID_TRANSITIONS, canTransition } from '../src'

describe('state machine', () => {
  it('allows valid transitions', () => {
    expect(canTransition('pending', 'suggested')).toBe(true)
    expect(canTransition('suggested', 'archived')).toBe(true)
    expect(canTransition('ignored', 'pending')).toBe(true)
    expect(canTransition('archived', 'pending')).toBe(true)
  })

  it('blocks invalid transitions', () => {
    expect(canTransition('pending', 'archived')).toBe(false)
    expect(canTransition('archived', 'ignored')).toBe(false)
    expect(canTransition('archived', 'suggested')).toBe(false)
    expect(canTransition('ignored', 'archived')).toBe(false)
  })

  it('exposes the transition table', () => {
    expect(VALID_TRANSITIONS.archived).toEqual(['pending'])
    expect(VALID_TRANSITIONS.pending).toContain('suggested')
    expect(VALID_TRANSITIONS.ignored).toContain('pending')
  })

  it('supports re-organize flow: archived -> pending', () => {
    expect(canTransition('archived', 'pending')).toBe(true)
    expect(VALID_TRANSITIONS.archived).toContain('pending')
  })
})
