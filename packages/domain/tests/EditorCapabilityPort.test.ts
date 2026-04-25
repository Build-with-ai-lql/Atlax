import { describe, expect, it } from 'vitest'

import {
  EDITOR_COMMANDS,
  EDITOR_TOOLS,
  createEditorCapabilityPort,
  type EditorCommandType,
  type EditorToolType,
} from '../src/ports/editor'

describe('EditorCapabilityPort', () => {
  const port = createEditorCapabilityPort()

  describe('getAvailableCommands', () => {
    it('returns non-empty command list', () => {
      const commands = port.getAvailableCommands()
      expect(commands.length).toBeGreaterThan(0)
    })

    it('each command has required fields', () => {
      const commands = port.getAvailableCommands()
      for (const cmd of commands) {
        expect(cmd.type).toBeDefined()
        expect(cmd.label).toBeDefined()
        expect(typeof cmd.type).toBe('string')
        expect(typeof cmd.label).toBe('string')
      }
    })

    it('command types are unique', () => {
      const commands = port.getAvailableCommands()
      const types = commands.map((c) => c.type)
      expect(new Set(types).size).toBe(types.length)
    })

    it('includes essential commands', () => {
      const commands = port.getAvailableCommands()
      const types = commands.map((c) => c.type)
      expect(types).toContain('heading')
      expect(types).toContain('bold')
      expect(types).toContain('italic')
      expect(types).toContain('code')
      expect(types).toContain('link')
    })
  })

  describe('getAvailableTools', () => {
    it('returns non-empty tool list', () => {
      const tools = port.getAvailableTools()
      expect(tools.length).toBeGreaterThan(0)
    })

    it('each tool has required fields', () => {
      const tools = port.getAvailableTools()
      for (const tool of tools) {
        expect(tool.type).toBeDefined()
        expect(tool.label).toBeDefined()
        expect(typeof tool.type).toBe('string')
        expect(typeof tool.label).toBe('string')
      }
    })

    it('tool types are unique', () => {
      const tools = port.getAvailableTools()
      const types = tools.map((t) => t.type)
      expect(new Set(types).size).toBe(types.length)
    })

    it('includes essential tools', () => {
      const tools = port.getAvailableTools()
      const types = tools.map((t) => t.type)
      expect(types).toContain('new-item')
      expect(types).toContain('archive-item')
      expect(types).toContain('export')
    })
  })

  describe('isCommandAvailable', () => {
    it('returns true for existing commands', () => {
      expect(port.isCommandAvailable('heading')).toBe(true)
      expect(port.isCommandAvailable('bold')).toBe(true)
    })

    it('returns false for unknown commands', () => {
      expect(port.isCommandAvailable('nonexistent' as EditorCommandType)).toBe(false)
    })
  })

  describe('isToolAvailable', () => {
    it('returns true for existing tools', () => {
      expect(port.isToolAvailable('new-item')).toBe(true)
      expect(port.isToolAvailable('export')).toBe(true)
    })

    it('returns false for unknown tools', () => {
      expect(port.isToolAvailable('nonexistent' as EditorToolType)).toBe(false)
    })
  })

  describe('EDITOR_COMMANDS constant', () => {
    it('matches port.getAvailableCommands', () => {
      expect(EDITOR_COMMANDS).toEqual(port.getAvailableCommands())
    })
  })

  describe('EDITOR_TOOLS constant', () => {
    it('matches port.getAvailableTools', () => {
      expect(EDITOR_TOOLS).toEqual(port.getAvailableTools())
    })
  })
})
