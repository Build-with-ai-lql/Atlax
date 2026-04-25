# Phase 3 Backend Development Log

| 开发日志信息 | |
|-------------|---------|
| 阶段 | Phase 3 - 产品化打磨与留存增强 |
| 轮次 | Round 1 Backend |
| 日期 | 2026-04-24 |
| 负责人 | Backend Agent |
| 状态 | 已完成 |

---

## Round 1 Backend

| 开发日志信息 | |
|-------------|---------|
| 执行者 | Backend Agent |
| 时间戳 | 2026-04-24 11:45 CST |
| 运行轮次 | Phase 3 Round 1 Backend |
| 状态 | 已完成 |

### 1. 变更内容

#### 1.1 #6 无 LLM Chat 引导状态机

- **新增文件**: `packages/domain/src/services/ChatGuidanceService.ts`
- **状态机步骤**: `idle` -> `awaiting_topic` -> `awaiting_type` -> `awaiting_content` -> `awaiting_confirmation` -> `confirmed` / `cancelled`
- **支持操作**: `start`, `submit_topic`, `submit_type`, `submit_content`, `confirm`, `cancel`, `refill`, `reset`
- **固定句式**: "这次记录是什么主题呢" / "这次记录是什么类型呢" / "你想记录些什么呢" / "你看这样为你生成可以么"
- **取消流程**: "你想取消本次记录，还是重新记录" + 情绪价值 dismissal message
- **重填选项**: 支持按"标题/类型/内容"单独重填

#### 1.2 #9 数据能力补齐

- **新增字段到 DockItem**: `selectedActions: string[]`, `selectedProject: string | null`
- **新增 Repository 方法**: `updateSelectedActions`, `updateSelectedProject`
- **修复标签乱码**: 在 `types.ts` 新增 `sanitizeSuggestionLabel` 函数，处理 `\n\r\t` 等空白字符
- **更新 db.ts**: 添加 v8 migration 处理新字段（向后兼容）
- **更新 repository.ts**: `createDockItem` 初始化新字段

#### 1.3 #7 链式结构最小落地

- **新增字段到 DockItem**: `sourceId: number | null`, `parentId: number | null`
- **新增 Repository 方法**: `updateChainLinks`
- **语义**: `sourceId` 表示源 DockItem（用于 reorganize），`parentId` 表示父级 DockItem（用于派生）
- **迁移策略**: v8 upgrade 中默认为 `null`，兼容现有数据

#### 1.4 #8 编辑保存路径收敛

- **新增文件**: `packages/domain/src/services/EditSavePolicy.ts`
- **明确策略**: 短内容（inline）和长内容（fullscreen）共用同一个 `updateDockItemText` path
- **保存后行为**: 编辑文本后 suggestions 重置，status 回退到 `pending`，需要重新触发 suggest
- **保留字段**: `selectedActions` 和 `selectedProject` 在文本编辑时保留

#### 1.5 #11 编辑器能力接口预留

- **扩展 `ports/editor.ts`**: 新增 `EditorCommandType` / `EditorCommand` / `EDITOR_COMMANDS`
- **新增工具类型**: `EditorToolType` / `EditorTool` / `EDITOR_TOOLS`
- **新增端口**: `EditorCapabilityPort` + `createEditorCapabilityPort()`
- **Obsidian-like 命令**: heading, bold, italic, code, link, list, quote, codeblock, table, checkbox, highlight 等
- **工具**: new-item, delete-item, archive-item, reopen-item, export, word-count, focus-mode, typewriter-mode

### 2. 遇到的问题

| 问题 | 解决方式 |
|------|---------|
| `canTransition` 名称冲突（services 和 state-machine 都导出） | 将 ChatGuidanceService 中的函数重命名为 `canTransitionGuidance` |
| 测试文件 DockItem 类型不完整 | 更新 DockItemService.test.ts 添加新字段 |
| state-machine.test.ts 导入路径问题 | 改为直接从 `../src/state-machine` 导入 |

### 3. 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS | - |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 115 tests passed | 11 test files |
| `pnpm --dir apps/web typecheck` | ⚠️ 受阻 | 存在前端代码错误（`TS1128: Declaration or statement expected`），来自 frontend agent 的 staged 修改，非本轮 backend 代码问题 |

### 4. 收口验证

- ✅ domain typecheck PASS
- ✅ domain tests PASS (115 tests)
- ⚠️ web typecheck 受阻（前端问题，非 backend 责任）

### 5. 是否可以进入下一轮

**可以**，但需注意：
1. 前端 `uniqueProjects` 作用域问题需要 frontend agent 修复
2. web typecheck 需要 frontend agent 确保代码可编译后再进入下一轮

### 6. 下一轮风险评估

| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 typecheck 阻塞 | 中 | 需要 frontend agent 修复 `uniqueProjects` 作用域问题 |
| 链式结构查询 API 未实现 | 低 | 当前仅添加字段和 repository 方法，前端查询 UI 未实现 |
| 项目关联 UI 预览 | 低 | 前端显示 "项目关联能力正在接入中"，后端能力已就绪 |

### 7. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/services/ChatGuidanceService.ts` | A | 新增 - Chat 引导状态机 |
| `packages/domain/src/services/EditSavePolicy.ts` | A | 新增 - 编辑保存策略 |
| `packages/domain/src/services/index.ts` | M | 添加新服务导出 |
| `packages/domain/src/ports/editor.ts` | M | 扩展编辑器能力接口 |
| `packages/domain/src/ports/repository.ts` | M | 添加新字段和方法 |
| `packages/domain/src/types.ts` | M | 添加 sanitizeSuggestionLabel |
| `packages/domain/tests/DockItemService.test.ts` | M | 添加新字段到测试对象 |
| `packages/domain/tests/state-machine.test.ts` | M | 修复导入路径 |
| `apps/web/lib/db.ts` | M | 添加新字段和 migration |
| `apps/web/lib/repository.ts` | M | 添加新字段和 repository 方法 |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | A | 本轮开发日志 |

---

## Round 1 Backend Review 补充

| 开发日志信息 | |
|-------------|---------|
| 执行者 | Backend Agent |
| 时间戳 | 2026-04-24 12:40 CST |
| 运行轮次 | Phase 3 Round 1 Backend Review |
| 状态 | 已完成 |

### 1. 补充内容

#### 1.1 #9 sanitizeSuggestionLabel 接入

- **修改文件**: `packages/domain/src/suggestion-engine.ts`
- **接入点**: `applyRules`, `matchCategory`, `matchActions`, `generateSuggestions`
- **效果**: 所有生成的建议 label 都会经过 sanitize 处理，去除换行、制表符、重复空白
- **新增测试**: `tests/sanitizeSuggestionLabel.test.ts` (12 tests)

#### 1.2 ChatGuidanceService 单元测试

- **新增文件**: `packages/domain/tests/ChatGuidanceService.test.ts`
- **测试覆盖**:
  - 完整流程: topic -> type -> content -> confirmation -> confirm
  - 取消流程: cancel
  - dismissal message 随机返回
  - refill 标题/类型/内容
  - 边界情况: 空输入、空白修剪
- **测试数量**: 17 tests

#### 1.3 EditSavePolicy 单元测试

- **新增文件**: `packages/domain/tests/EditSavePolicy.test.ts`
- **测试覆盖**:
  - 文本变化时 reset suggestions/status/processedAt
  - 文本不变时保留当前 status
  - preserve selectedActions/selectedProject
  - isLongContent / getEditContentType
- **测试数量**: 15 tests

#### 1.4 repository.ts 导出确认

- **已导出方法**: `updateSelectedActions`, `updateSelectedProject`, `updateChainLinks`
- **可被前端调用**: 是（export async function）

### 2. 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS | - |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 115 tests passed | 11 test files |
| `pnpm --dir apps/web typecheck` | ⚠️ 受阻 | 前端代码 `TS1128` 错误，非 backend 责任 |

### 3. 测试详情

```
 ✓ tests/EditSavePolicy.test.ts (15 tests)
 ✓ tests/EntryService.test.ts (14 tests)
 ✓ tests/SuggestionResetPolicy.test.ts (10 tests)
 ✓ tests/state-machine.test.ts (4 tests)
 ✓ tests/ChatGuidanceService.test.ts (17 tests)
 ✓ tests/archive-service.test.ts (9 tests)
 ✓ tests/selectors.test.ts (1 test)
 ✓ tests/tag-service.test.ts (18 tests)
 ✓ tests/suggestion-engine.test.ts (6 tests)
 ✓ tests/sanitizeSuggestionLabel.test.ts (12 tests)
 ✓ tests/DockItemService.test.ts (9 tests)

 Test Files  11 passed (11)
      Tests  115 passed (115)
```

### 4. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/suggestion-engine.ts` | M | 接入 sanitizeSuggestionLabel |
| `packages/domain/tests/sanitizeSuggestionLabel.test.ts` | A | 新增 - sanitize 测试 |
| `packages/domain/tests/ChatGuidanceService.test.ts` | A | 新增 - ChatGuidanceService 测试 |
| `packages/domain/tests/EditSavePolicy.test.ts` | A | 新增 - EditSavePolicy 测试 |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | 更新验证结果 |

---

## Round 2 Backend - Chat Session 持久化

| 开发日志信息 | |
|-------------|---------|
| 执行者 | Backend Agent |
| 时间戳 | 2026-04-24 15:18 CST |
| 运行轮次 | Phase 3 Round 2 Backend |
| 状态 | 已完成 |

### 1. 变更内容

#### 1.1 ChatSession 数据结构设计

- **位置**: `packages/domain/src/ports/repository.ts`
- **类型定义**:
  - `ChatMessage`: `{ role: 'user' | 'assistant', content: string, timestamp: Date }`
  - `ChatSessionStatus`: `'active' | 'confirmed' | 'cancelled'`
  - `ChatSession`: 完整会话结构（id, userId, topic, selectedType, content, status, messages, createdAt, updatedAt）
- **userId 隔离**: 所有查询和操作都基于 userId

#### 1.2 IndexedDB 表和 Migration

- **位置**: `apps/web/lib/db.ts`
- **新增表**: `chatSessions` (id, userId, status, createdAt, updatedAt 索引)
- **Migration**: version 9，向后兼容，不影响现有数据

#### 1.3 Repository 方法实现

- **位置**: `apps/web/lib/repository.ts`
- **新增方法**:
  - `createChatSession(input)`: 创建会话，空会话返回 null
  - `getChatSession(userId, id)`: 按 userId 隔离查询单个会话
  - `listChatSessions(userId)`: 列出用户所有会话（按 updatedAt 倒序）
  - `listActiveChatSessions(userId)`: 列出用户活跃会话
  - `updateChatSession(userId, id, updates)`: 更新会话
  - `deleteChatSession(userId, id)`: 删除会话
  - `addChatMessage(userId, id, message)`: 添加消息到会话

#### 1.4 空会话过滤

- **函数**: `isValidChatSessionInput(input)`
- **规则**: 至少满足以下条件之一才允许持久化:
  - 有 user message（role='user' 且 content 非空）
  - 有有效 topic
  - 有有效 selectedType
  - 有有效 content

### 2. 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS | - |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 115 tests passed | 11 test files |

### 3. 前端接入指南

```typescript
import {
  createChatSession,
  getChatSession,
  listChatSessions,
  listActiveChatSessions,
  updateChatSession,
  deleteChatSession,
  addChatMessage,
} from '@/lib/repository'

// 创建会话
const session = await createChatSession({
  userId: 'user-123',
  topic: '项目会议',
  selectedType: 'meeting',
  messages: [{ role: 'user', content: '讨论产品规划', timestamp: new Date() }],
})

// 列出会话
const sessions = await listChatSessions('user-123')

// 添加消息
await addChatMessage('user-123', session.id, {
  role: 'assistant',
  content: '好的，我来帮你记录',
  timestamp: new Date(),
})
```

### 4. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/ports/repository.ts` | M | 添加 ChatSession 类型定义和接口 |
| `apps/web/lib/db.ts` | M | 添加 chatSessions 表和 v9 migration |
| `apps/web/lib/repository.ts` | M | 添加 ChatSession repository 方法 |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | 本轮开发日志 |

---

## Round 2 Backend Review - Chat Session 模型补齐

| 开发日志信息 | |
|-------------|---------|
| 执行者 | Backend Agent |
| 时间戳 | 2026-04-24 15:54 CST |
| 运行轮次 | Phase 3 Round 2 Backend Review |
| 状态 | 已完成 |

### 1. 修复内容

#### 1.1 Lint 修复

- **问题**: `apps/web/lib/repository.ts` 中未使用的 `DomainChatSession` import
- **解决**: 删除未使用的 import

#### 1.2 ChatSession 模型补齐

- **新增字段**: `title: string | null`, `pinned: boolean`
- **位置**:
  - `packages/domain/src/ports/repository.ts` - 类型定义
  - `apps/web/lib/db.ts` - IndexedDB Record 和 migration

#### 1.3 Repository 方法更新

- **排序逻辑**: `listChatSessions` 和 `listActiveChatSessions` 现在按 pinned 优先，其次 updatedAt 倒序
- **新增方法**: `pinChatSession(userId, id)`, `unpinChatSession(userId, id)`
- **update 支持**: `ChatSessionUpdateInput` 新增 `title` 和 `pinned` 字段

#### 1.4 测试覆盖

- **新增文件**: `packages/domain/tests/ChatSession.test.ts` (19 tests)
- **测试内容**:
  - 空 session 不创建
  - 不同 userId 互相不可见
  - updatedAt 更新后排序变化
  - pinned session 排在非 pinned 前面
  - update confirmed 不新建重复 session

### 2. 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --dir apps/web lint` | ✅ PASS | - |
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS | - |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 134 tests passed | 12 test files |

### 3. 测试详情

```
 ✓ tests/ChatSession.test.ts (19 tests)
 ✓ tests/EditSavePolicy.test.ts (15 tests)
 ✓ tests/EntryService.test.ts (14 tests)
 ✓ tests/SuggestionResetPolicy.test.ts (10 tests)
 ✓ tests/state-machine.test.ts (4 tests)
 ✓ tests/ChatGuidanceService.test.ts (17 tests)
 ✓ tests/archive-service.test.ts (9 tests)
 ✓ tests/selectors.test.ts (1 test)
 ✓ tests/tag-service.test.ts (18 tests)
 ✓ tests/suggestion-engine.test.ts (6 tests)
 ✓ tests/sanitizeSuggestionLabel.test.ts (12 tests)
 ✓ tests/DockItemService.test.ts (9 tests)

 Test Files  12 passed (12)
      Tests  134 passed (134)
```

### 4. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/ports/repository.ts` | M | 添加 title/pinned 字段 |
| `apps/web/lib/db.ts` | M | 添加 title/pinned 字段和 migration |
| `apps/web/lib/repository.ts` | M | 删除未使用 import，添加 pin/unpin 方法，更新排序逻辑 |
| `packages/domain/tests/ChatSession.test.ts` | A | 新增 - ChatSession 测试 |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | 本轮开发日志 |

---

## Round 3 Backend - 数据正确性修复

| 开发日志信息 | |
|-------------|---------|
| 执行者 | Backend Agent |
| 时间戳 | 2026-04-24 18:16 CST |
| 运行轮次 | Phase 3 Round 3 Backend |
| 状态 | 已完成 |

### 1. 修复内容

#### 1.1 archiveItem 写入 selectedProject/selectedActions

- **问题**: `buildEntryFromArchive` 只从 suggestions 推断 project/actions，忽略用户手动选择的 `selectedProject`/`selectedActions`
- **修复**:
  - `ArchiveInput` 类型新增 `selectedProject: string | null`, `selectedActions: string[]`
  - `buildEntryFromArchive` 优先使用 `selectedProject`，fallback 到 suggestion 推断
  - `buildEntryFromArchive` 优先使用 `selectedActions`（非空时），fallback 到 suggestion 推断
  - `archiveItem` 在调用 `buildEntryFromArchive` 时传入 `item.selectedProject` 和 `item.selectedActions`
- **真实测试覆盖**（Dexie 层）:
  - 设置 selectedProject 后 archive，entry.project 正确
  - 设置 selectedActions 后 archive，entry.actions 正确
  - selectedProject 优先级高于 suggestion 推断
  - selectedActions 优先级高于 suggestion 推断
  - 无选择时 fallback 到 suggestion
  - listArchivedEntriesByProject 能查到 selectedProject 设置的 entry
  - re-archive 保留 selectedProject/selectedActions

#### 1.2 Events userId 隔离

- **问题**: `PersistedEvent.userId` 是 optional，events 测试不传 userId
- **修复**:
  - `PersistedEvent.userId` 改为必填 `string`（不再是 `string?`）
  - events.test.ts 已更新为传 userId 调用
- **真实测试覆盖**:
  - user A 无法看到 user B 的 events
  - 清除 user A log 不影响 user B
  - metrics 按 user 隔离计算
  - 多种 event 类型隔离

#### 1.3 ChatSession 真实 Dexie 层测试

- **新增文件**: `apps/web/tests/chat-session.test.ts` (35 tests)
- **测试覆盖**（全部基于真实 fake-indexeddb/Dexie）:
  - create: 有效 user message 创建，assistant welcome 不创建，空 session 不创建
  - get: 正确用户可读，错误用户返回 null
  - list: userId 隔离，updatedAt 倒序，pinned 优先
  - listActive: 只列 active 状态，userId 隔离
  - update: 更新 topic/status，confirmed 不创建重复，跨 userId 阻止，updatedAt 更新
  - pin/unpin: pin/unpin 操作，跨 userId 阻止，pin 改变排序
  - delete: 删除，跨 userId 阻止
  - addMessage: 添加消息，跨 userId 阻止，updatedAt 更新
  - 完整隔离: 两个用户完全独立，互不可见/改/删

#### 1.4 domain 层 archive-service 测试更新

- 新增 4 个测试覆盖 selectedProject/selectedActions 优先级逻辑

### 2. 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS | - |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 138 tests / 12 files | - |
| `pnpm --dir apps/web lint` | ✅ PASS | - |
| `pnpm --dir apps/web typecheck` | ✅ PASS | - |
| `pnpm --dir apps/web test -- --run` | ✅ 150 tests / 9 files | - |

### 3. 测试详情

**domain 层** (138 tests):
```
 ✓ tests/archive-service.test.ts (13 tests)      ← 新增 4 个 selectedProject/selectedActions 测试
 ✓ tests/ChatSession.test.ts (19 tests)
 ✓ tests/ChatGuidanceService.test.ts (17 tests)
 ✓ tests/EditSavePolicy.test.ts (15 tests)
 ✓ tests/EntryService.test.ts (14 tests)
 ✓ tests/sanitizeSuggestionLabel.test.ts (12 tests)
 ✓ tests/SuggestionResetPolicy.test.ts (10 tests)
 ✓ tests/tag-service.test.ts (18 tests)
 ✓ tests/suggestion-engine.test.ts (6 tests)
 ✓ tests/DockItemService.test.ts (9 tests)
 ✓ tests/selectors.test.ts (1 test)
 ✓ tests/state-machine.test.ts (4 tests)
```

**web 层** (150 tests, 全部真实 Dexie):
```
 ✓ tests/repository.test.ts (42 tests)           ← 新增 8 个 selectedProject/selectedActions archive 测试
 ✓ tests/chat-session.test.ts (35 tests)          ← 新增 - 全部真实 Dexie ChatSession 测试
 ✓ tests/events.test.ts (26 tests)                ← 新增 5 个 userId 隔离测试
 ✓ tests/archive-reopen.test.ts (12 tests)
 ✓ tests/migration.test.ts (10 tests)
 ✓ tests/browse-seed.test.ts (10 tests)
 ✓ tests/suggest-tag.test.ts (9 tests)
 ✓ tests/chat-source.test.ts (4 tests)
 ✓ tests/integration.test.ts (2 tests)
```

### 4. 真实测试 vs 模拟测试说明

| 模块 | 真实 Dexie 测试 | 模拟/纯 domain 测试 | 说明 |
|------|----------------|-------------------|------|
| ChatSession CRUD | ✅ chat-session.test.ts (35) | ✅ ChatSession.test.ts (19) | domain 层测试 isValidChatSessionInput + 排序逻辑 |
| Archive selectedProject/Actions | ✅ repository.test.ts (8) | ✅ archive-service.test.ts (4) | domain 层测试优先级逻辑 |
| Events userId 隔离 | ✅ events.test.ts (5) | ❌ 无 | 全部基于 memory log |

### 5. 仍需注意的项

| 项目 | 状态 | 说明 |
|------|------|------|
| 前端 page.tsx recordEvent 调用 | ⚠️ 需前端确认 | events.ts API 签名已固定为需要 userId，前端调用需传 userId |
| 前端 ChatSession 接入 | ⏳ 待前端 | 后端 API 已就绪，前端需替换内存实现 |
| events.ts localStorage 隔离 | ✅ 已有 | key 格式 `atlax_event_log_{userId}` 已按 userId 隔离 |

### 6. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/types.ts` | M | ArchiveInput 新增 selectedProject/selectedActions |
| `packages/domain/src/archive-service.ts` | M | selectedProject/selectedActions 优先级逻辑 |
| `packages/domain/tests/archive-service.test.ts` | M | 新增 4 个优先级测试 + 适配新字段 |
| `apps/web/lib/repository.ts` | M | archiveItem 传入 selectedProject/selectedActions |
| `apps/web/lib/events.ts` | M | PersistedEvent.userId 改为必填 |
| `apps/web/tests/chat-session.test.ts` | A | 新增 - 35 个真实 Dexie ChatSession 测试 |
| `apps/web/tests/events.test.ts` | M | 新增 5 个 userId 隔离测试 |
| `apps/web/tests/repository.test.ts` | M | 新增 8 个 selectedProject/selectedActions archive 测试 |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | 本轮开发日志 |

---

## 历史记录

（无）

---

## 关联文档

| 文档 | 路径 |
|------|------|
| 架构说明书 | `docs/product/ARCHITECTURE.md` |
| 技术规格 | `docs/product/TECH_SPEC.md` |
| Phase 3 Feature & Bugs | `docs/engineering/dev_log/Phase3/pre-phase3-demo_feature_and_bugs.md` |
| 架构调整日志 | `docs/engineering/dev_log/Phase3/pre-phase3-architecture_rebuild.md` |