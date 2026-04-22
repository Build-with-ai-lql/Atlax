'use client'

import { useState } from 'react'

import { dedupeTagNames, normalizeTagName } from '@atlax/domain'

import type { LocalUser } from '@/lib/auth'

type ChatStep = 'input' | 'confirm' | 'tag' | 'done'

interface ChatPanelProps {
  user: LocalUser
  onSubmitToDock: (text: string, tags: string[]) => Promise<void>
  onSwitchToClassic: () => void
}

export default function ChatPanel({ user, onSubmitToDock, onSwitchToClassic }: ChatPanelProps) {
  const [step, setStep] = useState<ChatStep>('input')
  const [inputText, setInputText] = useState('')
  const [supplementText, setSupplementText] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleInitialSubmit = () => {
    const trimmed = inputText.trim()
    if (!trimmed) return
    setStep('confirm')
  }

  const handleConfirm = () => {
    setStep('tag')
  }

  const handleAddTag = () => {
    const normalized = normalizeTagName(tagInput)
    if (!normalized) return
    setTags(dedupeTagNames([...tags, normalized]))
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmitToDock = async () => {
    const finalText = supplementText.trim()
      ? `${inputText.trim()}\n\n补充：${supplementText.trim()}`
      : inputText.trim()

    setSubmitting(true)
    try {
      await onSubmitToDock(finalText, tags)
      setStep('done')
    } catch {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep('input')
    setInputText('')
    setSupplementText('')
    setTagInput('')
    setTags([])
    setSubmitting(false)
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Chat
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {step === 'input' && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-6">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                你好，{user.name}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                说一句话，我来帮你整理
              </p>
            </div>
            <div className="space-y-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="记录一个想法、一段笔记、或任何需要整理的内容…"
                className="w-full h-28 px-4 py-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleInitialSubmit()
                  }
                }}
              />
              <button
                onClick={handleInitialSubmit}
                disabled={!inputText.trim()}
                className="w-full py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                继续
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600">确认你的内容</p>
              <p className="text-xs text-gray-400 mt-1">
                可以补充更多上下文，或直接继续
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{inputText.trim()}</p>
            </div>
            <div className="space-y-3">
              <textarea
                value={supplementText}
                onChange={(e) => setSupplementText(e.target.value)}
                placeholder="补充上下文（可选）…"
                className="w-full h-20 px-4 py-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  返回修改
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  添加标签
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'tag' && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600">添加标签</p>
              <p className="text-xs text-gray-400 mt-1">
                为这条内容打上标签，方便后续整理和检索
              </p>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-green-500 hover:text-green-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                placeholder="输入标签后回车添加…"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTag}
                disabled={!normalizeTagName(tagInput)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                添加
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                返回
              </button>
              <button
                onClick={handleSubmitToDock}
                disabled={submitting}
                className="flex-1 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 transition-colors"
              >
                {submitting ? '提交中…' : tags.length > 0 ? `确认入 Dock（${tags.length} 个标签）` : '确认入 Dock'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="w-full max-w-lg text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm text-gray-700 font-medium mb-1">
              已加入 Dock
            </p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mb-6">
              内容已写入待整理列表，可在 Classic 模式中查看和整理
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                继续记录
              </button>
              <button
                onClick={onSwitchToClassic}
                className="flex-1 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                去 Dock 查看
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
