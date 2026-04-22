'use client'

import { useState } from 'react'

import { dedupeTagNames, normalizeTagName, resolveTags } from '@atlax/domain'

import type { SuggestionItem } from '@atlax/domain'
import type { StoredTag } from '@/lib/repository'

interface TagEditorProps {
  suggestedTags: string[]
  suggestedTagDetails?: SuggestionItem[]
  userTags: string[]
  existingTags: StoredTag[]
  dismissedSuggestions?: string[]
  onAddTag: (tagName: string) => Promise<void>
  onRemoveTag: (tagName: string) => Promise<void>
  onDismissSuggestion?: (tagName: string) => void
  disabled: boolean
}

export default function TagEditor({
  suggestedTags,
  suggestedTagDetails,
  userTags,
  existingTags,
  dismissedSuggestions = [],
  onAddTag,
  onRemoveTag,
  onDismissSuggestion,
  disabled,
}: TagEditorProps) {
  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const dismissedSet = new Set(dismissedSuggestions.map((t) => t.toLowerCase()))
  const resolved = resolveTags(suggestedTags, userTags)
  const userSet = new Set(userTags.map((t) => t.toLowerCase()))
  const suggestedOnly = dedupeTagNames(
    suggestedTags.filter((t) => !userSet.has(t.toLowerCase()) && !dismissedSet.has(t.toLowerCase()))
  )

  const reasonMap = new Map<string, string>()
  if (suggestedTagDetails) {
    for (const detail of suggestedTagDetails) {
      if (detail.type === 'tag' && detail.reason) {
        reasonMap.set(detail.label.toLowerCase(), detail.reason)
      }
    }
  }

  const availableExistingTags = existingTags.filter(
    (tag) => !userSet.has(tag.name.toLowerCase())
  )

  const filteredExistingTags = inputValue.trim()
    ? availableExistingTags.filter((tag) =>
        tag.name.toLowerCase().includes(inputValue.trim().toLowerCase())
      )
    : availableExistingTags

  const handleAdd = async () => {
    const name = normalizeTagName(inputValue)
    if (!name) return

    setAdding(true)
    try {
      await onAddTag(name)
      setInputValue('')
      setShowPicker(false)
    } finally {
      setAdding(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && !adding) {
      handleAdd()
    }
  }

  const handleAcceptSuggestion = async (tagName: string) => {
    if (disabled) return
    await onAddTag(tagName)
  }

  const handleSelectExistingTag = async (tagName: string) => {
    if (disabled) return
    await onAddTag(tagName)
    setShowPicker(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">标签</span>
        <span className="text-xs text-gray-400">（用户选择优先）</span>
      </div>

      {userTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {userTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs"
            >
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                disabled={disabled}
                className="ml-0.5 text-green-500 hover:text-green-700 disabled:opacity-50"
                aria-label={`移除标签 ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {suggestedOnly.length > 0 && (
        <div className="space-y-1.5">
          {suggestedOnly.map((tag) => {
            const reason = reasonMap.get(tag.toLowerCase())
            return (
              <div key={tag} className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAcceptSuggestion(tag)}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  <span className="text-blue-400">建议</span>
                  {tag}
                  <span className="text-blue-400">+</span>
                </button>
                {reason && (
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded" title={reason}>
                    {reason}
                  </span>
                )}
                {onDismissSuggestion && (
                  <button
                    onClick={() => onDismissSuggestion(tag)}
                    disabled={disabled}
                    className="text-gray-300 hover:text-gray-500 text-xs disabled:opacity-50"
                    title="忽略此建议"
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-2 items-start">
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowPicker(true)}
            onBlur={() => setTimeout(() => setShowPicker(false), 150)}
            placeholder="添加自定义标签…"
            disabled={disabled || adding}
            className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
          />
          {showPicker && filteredExistingTags.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-sm max-h-32 overflow-y-auto">
              {filteredExistingTags.slice(0, 8).map((tag) => (
                <button
                  key={tag.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectExistingTag(tag.name)}
                  className="w-full px-2 py-1 text-xs text-left hover:bg-gray-50 transition-colors"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={disabled || adding || !normalizeTagName(inputValue)}
          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {adding ? '添加中' : '添加'}
        </button>
      </div>

      {resolved.final.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">最终标签（归档时使用）</p>
          <div className="flex flex-wrap gap-1">
            {resolved.final.map((tag) => {
              const isDismissed = dismissedSet.has(tag.toLowerCase())
              if (isDismissed) return null
              return (
                <span
                  key={tag}
                  className={`px-2 py-0.5 rounded text-xs ${
                    userSet.has(tag.toLowerCase())
                      ? 'bg-green-50 text-green-600'
                      : 'bg-blue-50 text-blue-500'
                  }`}
                >
                  {tag}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
