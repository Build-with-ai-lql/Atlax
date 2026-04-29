'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  PanelRight,
  PictureInPicture2,
  ChevronsDown,
  ChevronsRight,
  Check,
  Bot,
  MessageCircle,
  Languages,
  CheckCircle,
  Plus,
  SlidersHorizontal,
  Mic,
  ArrowUp,
  FileText,
  User,
} from 'lucide-react'

type ChatMode = 'floating' | 'sidebar'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const MOCK_REPLIES: Record<string, string> = {
  'Personalize your Atlax AI': 'I\'d love to help you personalize your experience! You can customize my response style, preferred domains, and how I organize your knowledge. What aspect would you like to adjust first?',
  'Summarize knowledge graph': 'Based on your current knowledge graph, you have 3 active domains (Core Architecture, Personal Growth, Product Strategy) with 64 documents and 88 connections. The most connected domain is Core Architecture with 28 structural links. Would you like a deeper analysis?',
  'Translate selected content': 'I can translate content between languages. Please select the text you want to translate, and tell me the target language. I support English, Chinese, Japanese, Korean, and more.',
  'Create a task tracker': 'I\'ll create a task tracker for you. Here are some suggested tasks based on your recent activity:\n1. Review Graph Engine Physics document\n2. Update API Reference\n3. Complete MVP Scope Discussion\nWould you like to add these to your task list?',
}

const DEFAULT_REPLY = 'I understand your question. Let me think about this based on your knowledge graph... I can help you organize, connect, and explore your ideas. Could you tell me more about what you\'re looking for?'

interface FloatingChatPanelProps {
  onToast: (msg: string) => void
  activeModule?: string
}

export default function FloatingChatPanel({ onToast, activeModule }: FloatingChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isButtonVisible, setIsButtonVisible] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>('floating')
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)

  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const modeMenuRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isModeMenuOpen && modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setIsModeMenuOpen(false)
      }
      if (isOpen && chatMode === 'floating' && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const trigger = triggerRef.current
        if (!trigger || !trigger.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, chatMode, isModeMenuOpen])

  const handleNewChat = () => {
    setMessages([])
    setChatInput('')
    onToast('New chat session started')
  }

  const handleSend = async () => {
    if (!chatInput.trim() || isSending) return
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', content: chatInput.trim() }
    setMessages(prev => [...prev, userMsg])
    setChatInput('')
    setIsSending(true)

    await new Promise(r => setTimeout(r, 600 + Math.random() * 800))

    const reply = MOCK_REPLIES[chatInput.trim()] || DEFAULT_REPLY
    const assistantMsg: ChatMessage = { id: `msg-${Date.now()}-a`, role: 'assistant', content: reply }
    setMessages(prev => [...prev, assistantMsg])
    setIsSending(false)
  }

  const handlePromptClick = (promptText: string) => {
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', content: promptText }
    setMessages(prev => [...prev, userMsg])

    setTimeout(async () => {
      const reply = MOCK_REPLIES[promptText] || DEFAULT_REPLY
      const assistantMsg: ChatMessage = { id: `msg-${Date.now()}-a`, role: 'assistant', content: reply }
      setMessages(prev => [...prev, assistantMsg])
    }, 500 + Math.random() * 500)
  }

  const panelClassName = isOpen
    ? chatMode === 'floating'
      ? 'chat-panel-base chat-panel-floating'
      : 'chat-panel-base chat-panel-sidebar'
    : chatMode === 'floating'
      ? 'chat-panel-base chat-panel-hidden-floating'
      : 'chat-panel-base chat-panel-hidden-sidebar'

  const showWelcome = messages.length === 0

  const isMindActive = activeModule === 'mind'
  const triggerStyle = isMindActive
    ? { bottom: '16px', right: '60px' }
    : { bottom: '16px', right: '16px' }

  const hoverZoneStyle = isMindActive
    ? { bottom: '0', right: '44px', width: '80px', height: '80px' }
    : { bottom: '0', right: '0', width: '80px', height: '80px' }

  return (
    <>
      <div
        ref={triggerRef}
        className="fixed z-[90]"
        style={hoverZoneStyle}
        onMouseEnter={() => { if (!isOpen) setIsButtonVisible(true) }}
        onMouseLeave={(e) => {
          if (!isOpen && !e.relatedTarget || (e.relatedTarget as HTMLElement)?.id !== 'btn-floating-chat') {
            setIsButtonVisible(false)
          }
        }}
      />

      <button
        id="btn-floating-chat"
        className={`fixed w-12 h-12 rounded-full bg-[var(--accent)] hover:bg-[#b097ff] text-[#111] shadow-[0_8px_30px_rgba(167,139,250,0.3)] transition-all duration-300 z-[95] flex items-center justify-center cursor-pointer ${
          isButtonVisible || isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={triggerStyle}
        title="Open AI Chat"
        onMouseEnter={() => setIsButtonVisible(true)}
        onMouseLeave={(e) => {
          if (!isOpen && triggerRef.current && !triggerRef.current.contains(e.relatedTarget as Node)) {
            setIsButtonVisible(false)
          }
        }}
        onClick={() => { setIsOpen(true); setIsButtonVisible(false) }}
      >
        <Sparkles size={20} />
      </button>

      <div ref={panelRef} className={panelClassName}>
        <div className="px-4 py-3 border-b border-[var(--border-line)] flex items-center justify-between shrink-0 bg-[#1A1A1A] rounded-t-2xl">
          <button
            className="flex items-center gap-1.5 text-sm font-medium text-white hover:bg-white/10 px-2 py-1 rounded-md transition-colors"
            title="Start a new chat"
            onClick={handleNewChat}
          >
            New AI chat
          </button>
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setIsModeMenuOpen(v => !v)}
              className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors"
              title="Chat Display Mode"
            >
              <PanelRight size={16} />
            </button>
            {isModeMenuOpen && (
              <div ref={modeMenuRef} className="absolute right-0 top-full mt-1 w-40 glass rounded-xl p-1 shadow-2xl z-[110] origin-top-right">
                <button
                  onClick={() => { setChatMode('sidebar'); setIsModeMenuOpen(false); onToast('Chat switched to sidebar mode') }}
                  className="w-full text-left px-2 py-1.5 text-xs text-[var(--text-muted)] hover:text-white hover:bg-white/5 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2"><PanelRight size={14} /> Sidebar</span>
                  {chatMode === 'sidebar' && <Check size={12} className="text-white" />}
                </button>
                <button
                  onClick={() => { setChatMode('floating'); setIsModeMenuOpen(false); onToast('Chat switched to floating mode') }}
                  className="w-full text-left px-2 py-1.5 text-xs text-[var(--text-muted)] hover:text-white hover:bg-white/5 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2"><PictureInPicture2 size={14} /> Floating</span>
                  {chatMode === 'floating' && <Check size={12} className="text-white" />}
                </button>
              </div>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors"
              title="Hide Chat"
            >
              {chatMode === 'floating' ? <ChevronsDown size={16} /> : <ChevronsRight size={16} />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-5 flex flex-col bg-[#111]">
          {showWelcome ? (
            <>
              <div className="w-12 h-12 rounded-full bg-white/10 border border-[var(--border-line)] flex items-center justify-center mb-4">
                <Bot size={24} className="text-[var(--node-doc)]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Atlax AI Assistant</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">Here are a few things I can do, or ask me anything!</p>

              <div className="space-y-1 mb-8">
                <button onClick={() => handlePromptClick('Personalize your Atlax AI')} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg flex items-center gap-3 transition-colors">
                  <span className="text-lg">🦆</span> Personalize your Atlax AI
                </button>
                <button onClick={() => handlePromptClick('Summarize knowledge graph')} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg flex items-center gap-3 transition-colors">
                  <MessageCircle size={16} className="text-[var(--text-muted)]" /> Summarize knowledge graph
                </button>
                <button onClick={() => handlePromptClick('Translate selected content')} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg flex items-center gap-3 transition-colors">
                  <Languages size={16} className="text-[var(--text-muted)]" /> Translate selected content
                </button>
                <button onClick={() => handlePromptClick('Create a task tracker')} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg flex items-center gap-3 transition-colors">
                  <CheckCircle size={16} className="text-[var(--text-muted)]" /> Create a task tracker
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={14} className="text-[var(--node-doc)]" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[var(--accent)]/20 text-white'
                      : 'bg-white/5 border border-[var(--border-line)] text-gray-300'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)]/30 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={14} className="text-[var(--accent)]" />
                    </div>
                  )}
                </div>
              ))}
              {isSending && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-[var(--node-doc)]" />
                  </div>
                  <div className="bg-white/5 border border-[var(--border-line)] rounded-xl px-3 py-2 text-sm text-[var(--text-muted)]">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-3 shrink-0 bg-[#111] rounded-b-2xl">
          <div className="bg-white/5 border border-[var(--border-line)] rounded-xl p-2 flex flex-col gap-2 transition-colors focus-within:border-[var(--accent)] focus-within:bg-black/40 shadow-inner">
            <div className="flex items-center gap-2 px-2 pt-1">
              <div className="bg-white/10 px-2 py-0.5 rounded flex items-center gap-1.5 text-[10px] text-gray-300 border border-[var(--border-line)]">
                <FileText size={12} /> Current Context
              </div>
            </div>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Do anything with AI..."
              className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 resize-none px-2 min-h-[30px] max-h-[120px]"
              rows={1}
            />
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                <button onClick={() => onToast('Attach file (mock)')} className="p-1 text-[var(--text-muted)] hover:text-white rounded transition-colors"><Plus size={16} /></button>
                <button onClick={() => onToast('Model settings (mock)')} className="p-1 text-[var(--text-muted)] hover:text-white rounded transition-colors"><SlidersHorizontal size={16} /></button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-muted)] pr-1">Auto</span>
                <button onClick={() => onToast('Voice input (mock)')} className="p-1 text-[var(--text-muted)] hover:text-white rounded transition-colors"><Mic size={16} /></button>
                <button
                  onClick={handleSend}
                  disabled={!chatInput.trim() || isSending}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    chatInput.trim() && !isSending
                      ? 'bg-[var(--accent)] text-[#111] hover:bg-[#b097ff]'
                      : 'bg-[var(--text-muted)] text-[#111] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <ArrowUp size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
