'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { updateDockItemText, saveEditorDraft } from '@/lib/repository'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed'

interface UseAutosaveParams {
  userId: string
  editingItemId: number | null
  editorTitle: string
  editorContent: string
  isDraft: boolean
  enabled: boolean
  debounceMs?: number
}

export function useAutosave({
  userId,
  editingItemId,
  editorTitle,
  editorContent,
  isDraft,
  enabled,
  debounceMs = 1000,
}: UseAutosaveParams): { saveStatus: SaveStatus; flushSave: () => Promise<void> } {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef({ title: '', content: '', itemId: null as number | null })

  const latestRef = useRef({
    userId,
    editingItemId,
    editorTitle,
    editorContent,
    isDraft,
    enabled,
  })
  latestRef.current = { userId, editingItemId, editorTitle, editorContent, isDraft, enabled }

  const performSaveWithValues = useCallback(async (
    uid: string,
    itemId: number,
    title: string,
    content: string,
    draft: boolean,
  ) => {
    setSaveStatus('saving')
    try {
      if (draft) {
        await saveEditorDraft(uid, itemId, title, content)
      } else {
        await updateDockItemText(uid, itemId, content, title)
      }
      lastSavedRef.current = { title, content, itemId }
      setSaveStatus('saved')
    } catch (err) {
      console.error('[Autosave] Failed:', err)
      setSaveStatus('failed')
    }
  }, [])

  const flushSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const { userId: uid, editingItemId: itemId, editorTitle: title, editorContent: content, isDraft: draft, enabled: en } = latestRef.current
    if (!en || !uid || itemId == null) return
    if (
      itemId === lastSavedRef.current.itemId &&
      title === lastSavedRef.current.title &&
      content === lastSavedRef.current.content
    ) return
    await performSaveWithValues(uid, itemId, title, content, draft)
  }, [performSaveWithValues])

  useEffect(() => {
    if (!enabled || editingItemId == null || !userId) {
      return
    }

    if (
      editingItemId === lastSavedRef.current.itemId &&
      editorTitle === lastSavedRef.current.title &&
      editorContent === lastSavedRef.current.content
    ) {
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null
      const { userId: uid, editingItemId: itemId, editorTitle: title, editorContent: content, isDraft: draft } = latestRef.current
      if (!uid || itemId == null) return
      performSaveWithValues(uid, itemId, title, content, draft)
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [enabled, userId, editingItemId, editorTitle, editorContent, debounceMs, performSaveWithValues])

  useEffect(() => {
    if (editingItemId !== lastSavedRef.current.itemId) {
      setSaveStatus('idle')
      lastSavedRef.current = { title: editorTitle, content: editorContent, itemId: editingItemId }
    }
  }, [editingItemId, editorTitle, editorContent])

  return { saveStatus, flushSave }
}
