'use client'

import { useState } from 'react'

import type { LocalUser } from '@/lib/auth'

type ChatStep = 'input' | 'confirm' | 'done'

interface ChatPanelProps {
  user: LocalUser
  onSubmitToDock: (text: string) => Promise<void>
  onSwitchToClassic: () => void
}

export default function ChatPanel({ user, onSubmitToDock, onSwitchToClassic }: ChatPanelProps) {
  const [step, setStep] = useState<ChatStep>('input')
  const [inputText, setInputText] = useState('')
  const [supplementText, setSupplementText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleInitialSubmit = () => {
    const trimmed = inputText.trim()
    if (!trimmed) return
    setStep('confirm')
  }

  const handleConfirm = async () => {
    const finalText = supplementText.trim()
      ? `${inputText.trim()}\n\n补充：${supplementText.trim()}`
      : inputText.trim()

    setSubmitting(true)
    try {
      await onSubmitToDock(finalText)
      setStep('done')
    } catch {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep('input')
    setInputText('')
    setSupplementText('')
    setSubmitting(false)
  }

  const handleGoToDock = () => {
    onSwitchToClassic()
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
                可以补充更多上下文，或直接确认入 Dock
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
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 transition-colors"
                >
                  {submitting ? '提交中…' : '确认入 Dock'}
                </button>
              </div>
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
                onClick={handleGoToDock}
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
