'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Edit3, X, Minus, ChevronLeft } from 'lucide-react'

type NoteState = 'HIDDEN' | 'OPEN' | 'MINIMIZED'

interface QuickNoteProps {
  onToast: (msg: string) => void
  onSave: (text: string, title: string) => Promise<void>
}

export default function QuickNote({ onToast, onSave }: QuickNoteProps) {
  const [noteState, setNoteState] = useState<NoteState>('HIDDEN')
  const [noteText, setNoteText] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
  })
  const hasDraggedRef = useRef(false)
  const inlineStyleRef = useRef<React.CSSProperties>({})
  const [, forceRender] = useState(0)

  const isOpen = noteState === 'OPEN'
  const isMinimized = noteState === 'MINIMIZED'
  const isHidden = noteState === 'HIDDEN'

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  const handleHotCornerClick = useCallback(() => {
    setNoteState('OPEN')
  }, [])

  const handleMinimizeClick = useCallback(() => {
    setNoteState('MINIMIZED')
  }, [])

  const handleCloseClick = useCallback(async () => {
    const text = noteText.trim()
    if (!text) {
      setNoteText('')
      setNoteState('HIDDEN')
      inlineStyleRef.current = {}
      forceRender(c => c + 1)
      return
    }

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
    const title = `${timestamp}_idea_01`

    onToast(`已落库至 Quick idea: ${title}`)
    setNoteText('')
    setNoteState('HIDDEN')
    inlineStyleRef.current = {}
    forceRender(c => c + 1)

    try {
      await onSave(text, title)
    } catch {
      onToast('Quick Note 保存失败，请重试')
    }
  }, [noteText, onToast, onSave])

  const handleDrawerClick = useCallback(() => {
    setNoteState('OPEN')
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    e.stopPropagation()

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()

    inlineStyleRef.current = {
      ...inlineStyleRef.current,
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      right: 'auto',
      bottom: 'auto',
      transition: 'none',
    }
    forceRender(c => c + 1)

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
    }
    hasDraggedRef.current = false

    headerRef.current?.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return

    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      hasDraggedRef.current = true
    }

    const newLeft = dragRef.current.initialLeft + dx
    const newTop = dragRef.current.initialTop + dy

    inlineStyleRef.current = {
      ...inlineStyleRef.current,
      left: `${newLeft}px`,
      top: `${newTop}px`,
      transition: 'none',
    }
    forceRender(c => c + 1)
  }, [])

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current.isDragging) return
    dragRef.current.isDragging = false

    inlineStyleRef.current = {
      ...inlineStyleRef.current,
      transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
    }
    forceRender(c => c + 1)
  }, [])

  const windowClasses = [
    'fixed z-[195] flex flex-col shadow-2xl',
    'rounded-2xl',
    'bg-[#1e1e1e]/90 backdrop-blur-3xl border border-[var(--border-line)]',
    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-10 translate-x-10',
    'transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)',
  ].join(' ')

  const windowStyle: React.CSSProperties = {
    width: '288px',
    height: '320px',
    resize: 'both',
    overflow: 'hidden',
    minWidth: '250px',
    minHeight: '200px',
    ...(isOpen
      ? { right: '24px', bottom: '24px', ...inlineStyleRef.current }
      : {}),
  }

  return (
    <>
      {/* Hot Corner Trigger - HIDDEN state */}
      <div
        className={`fixed bottom-0 right-0 z-[190] cursor-pointer transition-opacity duration-300 ${isHidden ? 'opacity-40 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleHotCornerClick}
      >
        <div className="relative w-10 h-10">
          <div
            className="absolute bottom-0 right-0 w-0 h-0"
            style={{
              borderLeft: '40px solid transparent',
              borderBottom: '40px solid var(--accent, #a78bfa)',
            }}
          />
          <div className="absolute bottom-1.5 right-1.5 text-white/0 group-hover:text-white transition-colors">
            <Edit3 size={12} className="opacity-0 hover:opacity-100 transition-opacity" />
          </div>
          <Edit3
            size={12}
            className="absolute bottom-2 right-2 text-white/50"
          />
        </div>
      </div>

      {/* Main Note Window - OPEN state */}
      <div
        ref={containerRef}
        className={windowClasses}
        style={windowStyle}
      >
        {/* Mac-style Header */}
        <div
          ref={headerRef}
          className="h-10 flex items-center px-4 shrink-0 cursor-grab active:cursor-grabbing select-none border-b border-white/[0.06]"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="group/btn flex items-center gap-2">
            {/* Red - Close */}
            <button
              onClick={handleCloseClick}
              className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 flex items-center justify-center transition-all"
            >
              <X size={7} className="text-black/0 group-hover/btn:text-black/80 transition-colors" />
            </button>
            {/* Yellow - Minimize */}
            <button
              onClick={handleMinimizeClick}
              className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110 flex items-center justify-center transition-all"
            >
              <Minus size={7} className="text-black/0 group-hover/btn:text-black/80 transition-colors" />
            </button>
            {/* Green - placeholder */}
            <button
              className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 flex items-center justify-center transition-all"
              onClick={() => onToast('Quick Note: full-screen not implemented yet')}
            >
              <span className="text-black/0 group-hover/btn:text-black/80 text-[6px] leading-none transition-colors">⤢</span>
            </button>
          </div>

          <span className="ml-3 text-[11px] text-white/30 font-medium tracking-wide">Quick Note</span>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="写下你的想法..."
          className="flex-1 w-full bg-transparent text-white/85 text-sm leading-relaxed p-4 outline-none resize-none placeholder-white/20"
        />
      </div>

      {/* Drawer Handle - MINIMIZED state */}
      <div
        className={`fixed top-1/2 right-0 -translate-y-1/2 z-[190] cursor-pointer transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) group ${isMinimized ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-x-full'}`}
        onClick={handleDrawerClick}
      >
        <div className="w-1.5 h-16 rounded-l-full bg-white/20 group-hover:w-3 group-hover:bg-white/30 transition-all duration-200 flex items-center justify-center">
          <ChevronLeft
            size={10}
            className="text-white/0 group-hover:text-white/60 transition-colors -ml-0.5"
          />
        </div>
      </div>
    </>
  )
}
