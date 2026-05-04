import { afterEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db'
import {
  createCaptureToDocumentFlow,
  getDocumentByCaptureId,
  getMindNode,
} from '@/lib/repository'

const USER_A = 'user_test_a'
const USER_B = 'user_test_b'

async function cleanAll() {
  await db.table('dockItems').clear()
  await db.table('entries').clear()
  await db.table('mindNodes').clear()
}

function unwrap<T>(value: T | null): T {
  expect(value).not.toBeNull()
  return value as T
}

describe('capture → document → mindNode flow', () => {
  afterEach(cleanAll)

  describe('createCaptureToDocumentFlow', () => {
    it('creates capture, document, and mindNode from raw text', async () => {
      const result = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '今天学习了 TypeScript 泛型\n很有收获',
      })

      expect(result.capture.id).toBeGreaterThan(0)
      expect(result.capture.rawText).toBe('今天学习了 TypeScript 泛型\n很有收获')
      expect(result.capture.status).toBe('pending')
      expect(result.capture.createdAt).toBeInstanceOf(Date)

      expect(result.document.id).toBeGreaterThan(0)
      expect(result.document.title).toBe('今天学习了 TypeScript 泛型')
      expect(result.document.content).toBe('今天学习了 TypeScript 泛型\n很有收获')
      expect(result.document.sourceCaptureId).toBe(result.capture.id)
      expect(result.document.type).toBe('note')
      expect(result.document.createdAt).toBeInstanceOf(Date)

      expect(result.mindNode.id).toBeTruthy()
      expect(result.mindNode.label).toBe('今天学习了 TypeScript 泛型')
      expect(result.mindNode.nodeType).toBe('document')
      expect(result.mindNode.documentId).toBe(result.document.id)
      expect(result.mindNode.state).toBe('drifting')
    })

    it('creates capture with custom topic', async () => {
      const result = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '一些杂乱的笔记内容\n今天天气不错',
        topic: '杂记',
      })

      expect(result.document.title).toBe('一些杂乱的笔记内容')
    })

    it('creates capture with custom sourceType', async () => {
      const result = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '语音转录的摘要内容',
        sourceType: 'voice',
      })

      expect(result.capture.rawText).toBe('语音转录的摘要内容')
      expect(result.document.title).toBe('语音转录的摘要内容')
    })

    it('extracts title from multiline text', async () => {
      const result = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '第一行是标题\n第二行是正文\n第三行也是正文',
      })

      expect(result.document.title).toBe('第一行是标题')
      expect(result.document.content).toBe('第一行是标题\n第二行是正文\n第三行也是正文')
    })

    it('truncates long title to 60 characters', async () => {
      const longLine = '这是一段非常长的文本用于测试标题截断功能是否正常工作需要超过六十个字符才行'.repeat(2)
      const result = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: longLine,
      })

      expect(result.document.title.length).toBeLessThanOrEqual(60)
      expect(result.document.title.endsWith('...')).toBe(true)
    })

    it('rejects empty rawText string', async () => {
      await expect(
        createCaptureToDocumentFlow({
          userId: USER_A,
          rawText: '',
        }),
      ).rejects.toThrow('rawText must not be empty')
    })

    it('rejects whitespace-only rawText', async () => {
      await expect(
        createCaptureToDocumentFlow({
          userId: USER_A,
          rawText: '   \t \n  ',
        }),
      ).rejects.toThrow('rawText must not be empty')
    })

    it('rejects empty userId', async () => {
      await expect(
        createCaptureToDocumentFlow({
          userId: '',
          rawText: 'some text',
        }),
      ).rejects.toThrow('userId must not be empty')
    })
  })

  describe('userId isolation', () => {
    it('isolates captures between users', async () => {
      await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '用户A的笔记',
      })
      await createCaptureToDocumentFlow({
        userId: USER_B,
        rawText: '用户B的笔记',
      })

      const docsA = await db.table('entries').where('userId').equals(USER_A).toArray()
      const docsB = await db.table('entries').where('userId').equals(USER_B).toArray()

      expect(docsA).toHaveLength(1)
      expect(docsB).toHaveLength(1)
      expect(docsA[0].title).toBe('用户A的笔记')
      expect(docsB[0].title).toBe('用户B的笔记')
    })

    it('prevents cross-user document access', async () => {
      const result = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '用户A的内容',
      })

      const doc = await getDocumentByCaptureId(USER_B, result.capture.id)
      expect(doc).toBeNull()
    })

    it('isolates mindNodes between users', async () => {
      const resultA = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '用户A的思维节点',
      })
      const resultB = await createCaptureToDocumentFlow({
        userId: USER_B,
        rawText: '用户B的思维节点',
      })

      const nodeA = await getMindNode(USER_A, resultA.mindNode.id)
      const nodeB = await getMindNode(USER_B, resultB.mindNode.id)
      const crossA = await getMindNode(USER_B, resultA.mindNode.id)
      const crossB = await getMindNode(USER_A, resultB.mindNode.id)

      expect(unwrap(nodeA).label).toBe('用户A的思维节点')
      expect(unwrap(nodeB).label).toBe('用户B的思维节点')
      expect(crossA).toBeNull()
      expect(crossB).toBeNull()
    })

    it('cross-user cannot access other user entries', async () => {
      const result = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '私有笔记内容',
      })

      const crossEntry = await db.table('entries').where('userId').equals(USER_B).and((e) => e.id === result.document.id).first()
      expect(crossEntry).toBeUndefined()
    })
  })

  describe('document ↔ mindNode stable association', () => {
    it('mindNode.documentId matches document.id', async () => {
      const result = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '验证关联关系',
      })

      expect(result.mindNode.documentId).toBe(result.document.id)
    })

    it('same capture creates unique mindNode with correct documentId', async () => {
      const result1 = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '第一篇文档',
      })
      const result2 = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '第二篇文档',
      })

      expect(result1.mindNode.documentId).toBe(result1.document.id)
      expect(result2.mindNode.documentId).toBe(result2.document.id)
      expect(result1.mindNode.id).not.toBe(result2.mindNode.id)
      expect(result1.document.id).not.toBe(result2.document.id)
    })

    it('document can be retrieved by capture id', async () => {
      const result = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '通过 captureId 查询文档',
      })

      const doc = await getDocumentByCaptureId(USER_A, result.capture.id)
      expect(unwrap(doc).id).toBe(result.document.id)
      expect(unwrap(doc).title).toBe(result.document.title)
    })

    it('mindNode can be fetched and matches document', async () => {
      const result = await createCaptureToDocumentFlow({
        userId: USER_A,
        rawText: '通过 mindNode 查询文档',
      })

      const node = await getMindNode(USER_A, result.mindNode.id)
      expect(unwrap(node).documentId).toBe(result.document.id)
      expect(unwrap(node).label).toBe(result.document.title)
    })
  })
})
