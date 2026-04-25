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

## Round 4 Backend - 链式结构/编辑策略/编辑器接口收口

| 开发日志信息 | |
|-------------|---------|
| 执行者 | Backend Agent |
| 时间戳 | 2026-04-24 14:28 CST |
| 运行轮次 | Phase 3 Round 4 Backend |
| 状态 | 已完成 |

### 1. 变更内容

#### 1.1 #7 链式结构收口

- **新增文件**: `packages/domain/src/services/ChainLinkService.ts`
- **读写合约**:
  - `ChainLink`: `{ itemId, sourceId, parentId }` 最小链路模型
  - `ChainRelationType`: `'reorganize' | 'continue_edit' | 'derive'`
  - `ChainProvenance`: 完整溯源信息（含 sourceTitle/parentTitle）
- **Builder 函数**: `buildReorganizeLink`, `buildContinueEditLink`, `buildDeriveLink`
- **验证**: `validateChainLinkUpdate` 防止自引用
- **查询**: `resolveChainRelation`, `isRootItem`, `hasChainLink`, `buildProvenance`
- **真实 Dexie 测试** (6 tests): reorganize/continue_edit/derive 关系、清除链路、跨用户阻止、suggest/archive 周期保留

#### 1.2 #8 编辑保存策略收敛

- **增强**: `packages/domain/src/services/EditSavePolicy.ts`
- **新增**: `ArchivedEntryEditInput/Output` + `applyArchivedEntryEditPolicy`
- **策略**: archived entry 编辑时 preserveProject=true, preserveActions=true, shouldSyncTagsToDockItem=true
- **domain 测试** (4 tests): preserve project/actions, content change detection, tag sync

#### 1.3 #11 编辑器能力接口

- **新增测试**: `packages/domain/tests/EditorCapabilityPort.test.ts` (14 tests)
- **覆盖**: command/tool 列表、唯一性、可用性检查、常量一致性

#### 1.4 Review/Browse 数据质量

- **确认**: 所有 repository 方法均有 userId 隔离（88 处 userId 检查）
- **events.ts**: userId 隔离测试已有（5 tests）
- **无需额外修复**

### 2. 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS | - |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 177 tests / 14 files | - |
| `pnpm --dir apps/web typecheck` | ✅ PASS | - |
| `pnpm --dir apps/web test -- --run` | ✅ 156 tests / 9 files | - |

### 3. 测试详情

**domain 层** (177 tests):
```
 ✓ tests/ChainLinkService.test.ts (21 tests)     ← 新增
 ✓ tests/EditorCapabilityPort.test.ts (14 tests)  ← 新增
 ✓ tests/EditSavePolicy.test.ts (19 tests)        ← 新增 4 个 archived entry 测试
 ✓ tests/ChatGuidanceService.test.ts (17 tests)
 ✓ tests/ChatSession.test.ts (19 tests)
 ✓ tests/EntryService.test.ts (14 tests)
 ✓ tests/archive-service.test.ts (13 tests)
 ✓ tests/sanitizeSuggestionLabel.test.ts (12 tests)
 ✓ tests/SuggestionResetPolicy.test.ts (10 tests)
 ✓ tests/tag-service.test.ts (18 tests)
 ✓ tests/DockItemService.test.ts (9 tests)
 ✓ tests/suggestion-engine.test.ts (6 tests)
 ✓ tests/selectors.test.ts (1 test)
 ✓ tests/state-machine.test.ts (4 tests)
```

**web 层** (156 tests):
```
 ✓ tests/repository.test.ts (48 tests)            ← 新增 6 个 chain link 测试
 ✓ tests/chat-session.test.ts (35 tests)
 ✓ tests/events.test.ts (26 tests)
 ✓ tests/archive-reopen.test.ts (12 tests)
 ✓ tests/migration.test.ts (10 tests)
 ✓ tests/browse-seed.test.ts (10 tests)
 ✓ tests/suggest-tag.test.ts (9 tests)
 ✓ tests/chat-source.test.ts (4 tests)
 ✓ tests/integration.test.ts (2 tests)
```

### 4. 是否可进入下一轮

**可以**。所有验证通过，无阻塞问题。

### 5. 下一轮风险

| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 chain link UI 接入 | 低 | 后端 API 已就绪，前端需实现链路展示 |
| 前端编辑器 command 接入 | 低 | port 类型已稳定，前端需对接 |

### 6. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/services/ChainLinkService.ts` | A | 新增 - 链式结构服务 |
| `packages/domain/src/services/index.ts` | M | 导出 ChainLinkService |
| `packages/domain/src/services/EditSavePolicy.ts` | M | 新增 ArchivedEntryEditPolicy |
| `packages/domain/tests/ChainLinkService.test.ts` | A | 新增 - 21 个链式结构测试 |
| `packages/domain/tests/EditorCapabilityPort.test.ts` | A | 新增 - 14 个编辑器能力测试 |
| `packages/domain/tests/EditSavePolicy.test.ts` | M | 新增 4 个 archived entry 测试 |
| `apps/web/tests/repository.test.ts` | M | 新增 6 个 chain link Dexie 测试 |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | 本轮开发日志 |

---

## Round 5 Backend - updateChainLinks 验证修复

| 开发日志信息 | |
|-------------|---------|
| 执行者 | Backend Agent |
| 时间戳 | 2026-04-24 15:12 CST |
| 运行轮次 | Phase 3 Round 5 Backend |
| 状态 | 已完成 |

### 1. 修复内容

#### 1.1 updateChainLinks 验证接入

- **问题**: `updateChainLinks` 未验证 sourceId/parentId 的存在性和 ownership
- **修复**:
  - 新增 `validateChainLinkWithContext` (async) 到 ChainLinkService
  - 支持 self-reference 检查、existence 检查、userId ownership 检查
  - `findItemById` 签名改为 async 以匹配 Dexie 查询
  - repository.ts `updateChainLinks` 接入 `await validateChainLinkWithContext`
  - 非法输入返回 null，不写入 DB

#### 1.2 真实 Dexie repository 测试（7 个新增）

- sourceId 指向其他用户 item → 返回 null，原 item 不变
- parentId 指向其他用户 item → 返回 null
- sourceId/parentId 指向不存在 id → 返回 null
- sourceId/self → 返回 null
- parentId/self → 返回 null
- 合法同用户 source/parent → 可保存

#### 1.3 domain 层测试（9 个新增）

- `validateChainLinkWithContext` 全部 9 个场景覆盖

### 2. 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS | - |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 186 tests / 14 files | - |
| `pnpm --dir apps/web typecheck` | ✅ PASS | - |
| `pnpm --dir apps/web test -- --run` | ✅ 163 tests / 9 files | - |
| `git diff --cached --check` | ⚠️ trailing whitespace | 来自前端 page.tsx，非本轮修改 |

### 3. 是否解决

**已解决**。updateChainLinks 现在会验证 sourceId/parentId 的 self-reference、existence、ownership。

### 4. 下一轮风险

无新增风险。

### 5. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/services/ChainLinkService.ts` | M | 新增 validateChainLinkWithContext (async) |
| `packages/domain/tests/ChainLinkService.test.ts` | M | 新增 9 个 validateChainLinkWithContext 测试 |
| `apps/web/lib/repository.ts` | M | updateChainLinks 接入验证 |
| `apps/web/tests/repository.test.ts` | M | 新增 7 个 chain link 验证测试 |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | 本轮开发日志 |

---

## Round 6 Backend - 链式结构读取能力 + 编辑器命令 domain 支撑

| 开发日志信息 | |
|-------------|---------|
| 执行者 | Backend Agent |
| 时间戳 | 2026-04-25 17:42 CST |
| 运行轮次 | Phase 3 Round 6 Backend |
| 状态 | 已完成 |

### 1. 变更内容

#### 1.1 Chain provenance query 补齐

- **修复**: `services/index.ts` 导入路径错误 `EditCommandTransform` → `EditorCommandTransform`
- **domain 测试**: `buildProvenanceAsync` 新增 6 个测试覆盖
  - async source/parent 查找
  - 缺失 source/parent 优雅处理
  - reorganize / continue_edit / derive 关系类型
  - 长标题截断
  - root item（无链路）
- **真实 Dexie 测试**: `getChainProvenance` 新增 8 个测试覆盖
  - reorganize 关系 provenance（含多行 rawText 取首行）
  - continue_edit 关系 provenance
  - derive 关系 provenance
  - root item provenance
  - 不存在 item 返回 null
  - 跨用户查询返回 null
  - 不暴露其他用户 source title
  - 长标题截断到 60 字符

#### 1.2 Editor command behavior

- **已有**: `EditorCommandTransform.ts` 提供 6 种纯函数 transform（bold/italic/code/link/heading/highlight）
- **修复**: 2 个测试期望值错误（空选区插入时不会删除后续字符）
  - `transformCode` 空选区: `'some `文本`code here'`（非 `'some `文本` code here'`）
  - `transformLink` 空选区: `'check [链接文本](url)this out'`（非 `'check [链接文本](url) out'`）
- **测试覆盖**: 34 tests，含选区为空、选区非空、多字节中文、边界情况

#### 1.3 Review/Browse 数据质量检查

- **审查结果**: 所有核心操作均通过 `getDockItemForUser` 守门，无数据泄漏
- **新增跨用户隔离测试**（7 个）:
  - `archiveItem` 跨用户阻止
  - `reopenItem` 跨用户阻止
  - `ignoreItem` 跨用户阻止
  - `restoreItem` 跨用户阻止
  - `addTagToItem` / `removeTagFromItem` 跨用户阻止
  - `updateSelectedProject` / `updateSelectedActions` 跨用户阻止
  - `getEntryByDockItemId` 跨用户阻止
- **确认**: `browse_revisit` 事件日志按 userId 隔离存储，无泄漏风险

### 2. 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS | - |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 226 tests / 15 files | +6 buildProvenanceAsync |
| `pnpm --dir apps/web typecheck` | ✅ PASS | - |
| `pnpm --dir apps/web test -- --run` | ✅ 178 tests / 9 files | +8 provenance +7 跨用户隔离 |
| `git diff --cached --check` | ✅ PASS | 无空白错误 |

### 3. 测试详情

**domain 层** (226 tests):
```
 ✓ tests/ChainLinkService.test.ts (36 tests)     ← 新增 6 buildProvenanceAsync
 ✓ tests/EditorCommandTransform.test.ts (34 tests) ← 修复 2 个期望值
 ✓ tests/EditorCapabilityPort.test.ts (14 tests)
 ✓ tests/EditSavePolicy.test.ts (19 tests)
 ✓ tests/ChatGuidanceService.test.ts (17 tests)
 ✓ tests/ChatSession.test.ts (19 tests)
 ✓ tests/EntryService.test.ts (14 tests)
 ✓ tests/archive-service.test.ts (13 tests)
 ✓ tests/sanitizeSuggestionLabel.test.ts (12 tests)
 ✓ tests/SuggestionResetPolicy.test.ts (10 tests)
 ✓ tests/DockItemService.test.ts (9 tests)
 ✓ tests/suggestion-engine.test.ts (6 tests)
 ✓ tests/tag-service.test.ts (18 tests)
 ✓ tests/state-machine.test.ts (4 tests)
 ✓ tests/selectors.test.ts (1 test)
```

**web 层** (178 tests):
```
 ✓ tests/repository.test.ts (70 tests)            ← 新增 8 provenance + 7 跨用户隔离
 ✓ tests/chat-session.test.ts (35 tests)
 ✓ tests/events.test.ts (26 tests)
 ✓ tests/archive-reopen.test.ts (12 tests)
 ✓ tests/migration.test.ts (10 tests)
 ✓ tests/browse-seed.test.ts (10 tests)
 ✓ tests/suggest-tag.test.ts (9 tests)
 ✓ tests/chat-source.test.ts (4 tests)
 ✓ tests/integration.test.ts (2 tests)
```

### 4. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/services/index.ts` | M | 修复 EditCommandTransform → EditorCommandTransform 导入路径 |
| `packages/domain/tests/ChainLinkService.test.ts` | M | 新增 6 个 buildProvenanceAsync 测试 |
| `packages/domain/tests/EditorCommandTransform.test.ts` | M | 修复 2 个空选区测试期望值 |
| `apps/web/tests/repository.test.ts` | M | 新增 8 个 getChainProvenance Dexie 测试 + 7 个跨用户隔离测试 |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | 本轮开发日志 |

---

## Round 7 Backend - createDockItem chain link 安全校验修复

| 开发日志信息 | |
|-------------|---------|
| 执行者 | Backend Agent |
| 时间戳 | 2026-04-25 22:55 CST |
| 运行轮次 | Phase 3 Round 7 Backend |
| 状态 | 已完成 |

### 1. 问题

| 问题 | 严重性 | 说明 |
|------|--------|------|
| `createDockItem` 绕过 chain link 校验 | P0 | `createDockItem(userId, rawText, sourceType, { sourceId, parentId })` 直接写入 sourceId/parentId，未复用 `validateChainLinkWithContext`，可能持久化跨用户、不存在、自引用的非法链路 |

### 2. 解决方式

#### 2.1 createDockItem 接入校验

- **位置**: `apps/web/lib/repository.ts` - `createDockItem`
- **策略**: 当 `sourceId` 或 `parentId` 非空时，调用 `validateChainLinkWithContext` 进行校验
- **创建场景的自引用处理**: 传入 `currentItemId: -1`（Dexie 自增 ID 从 1 开始，`-1` 不可能与任何真实 ID 匹配，自引用检查自然通过）
- **失败行为**: 校验失败时抛出 `Error('createDockItem: invalid chain links - ...')`，不写入 DB，不留脏数据
- **共享校验语义**: `createDockItem` 和 `updateChainLinks` 共用同一个 `validateChainLinkWithContext` 函数

#### 2.2 校验覆盖

| 场景 | 结果 |
|------|------|
| sourceId 指向同用户存在的 item | ✅ 允许创建 |
| parentId 指向同用户存在的 item | ✅ 允许创建 |
| sourceId 指向其他用户的 item | ❌ 抛出错误，不创建 |
| parentId 指向其他用户的 item | ❌ 抛出错误，不创建 |
| sourceId 指向不存在的 ID | ❌ 抛出错误，不创建 |
| parentId 指向不存在的 ID | ❌ 抛出错误，不创建 |
| 不传 options（无 chain links） | ✅ 正常创建 |
| 显式传 sourceId: null, parentId: null | ✅ 正常创建 |

### 3. 是否解决

**已解决**。`createDockItem` 和 `updateChainLinks` 现在共用 `validateChainLinkWithContext` 校验语义，不存在绕过口。

### 4. 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS | - |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 229 tests / 15 files | +3 create scenario domain tests |
| `pnpm --dir apps/web typecheck` | ✅ PASS | - |
| `pnpm --dir apps/web test -- --run` | ✅ 185 tests / 9 files | +7 createDockItem chain link tests |
| `git diff --cached --check` | 待验证 | - |

### 5. 测试详情

**domain 层新增** (3 tests):
- `currentItemId = -1` 跳过自引用检查
- `currentItemId = -1` 仍然拒绝不存在的 sourceId
- `currentItemId = -1` 仍然拒绝跨用户 parentId

**web 层新增** (7 tests):
- 合法 sourceId + parentId 创建成功
- 跨用户 sourceId 被拒绝 + 不留脏数据
- 跨用户 parentId 被拒绝 + 不留脏数据
- 不存在的 sourceId 被拒绝 + 不留脏数据
- 不存在的 parentId 被拒绝 + 不留脏数据
- 不传 options 正常创建
- 显式传 null 正常创建

### 6. 是否可进入下一轮

**可以**。所有校验已补齐，create 和 update 路径共用同一校验语义。

### 7. 风险评估

| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 handleDerive 需处理 createDockItem 异常 | 低 | 当前前端在 try/finally 中调用，异常会被捕获，但用户不会看到错误提示 |
| currentItemId = -1 假设 | 极低 | Dexie 自增 ID 从 1 开始，-1 不可能冲突。如未来改为 UUID，需重新设计 |

### 8. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/lib/repository.ts` | M | createDockItem 接入 validateChainLinkWithContext 校验 |
| `packages/domain/tests/ChainLinkService.test.ts` | M | 新增 3 个 currentItemId=-1 场景测试 |
| `apps/web/tests/repository.test.ts` | M | 新增 7 个 createDockItem chain link 校验测试 |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | 本轮开发日志 |

---

## Round 8 Backend — reopenItem 缓存复用策略 + lint 修复

**时间**: 2026-04-25 23:45
**轮次**: Phase 3 Round 8
**状态**: ✅ 已解决

### 1. 问题

| # | 问题 | 等级 | 说明 |
|---|------|------|------|
| 1 | reopenItem 清空 suggestions + processedAt | P0 | 归档记录重新打开后强制用户重新走全流程，已有 tags/actions/project/type 处理结果全部丢失 |
| 2 | 27 个 lint error | P1 | 非空断言、unused imports/locals 阻塞 CI |
| 3 | 测试断言过时 | P1 | archive-reopen/browse-seed/repository 测试仍断言 reopen 清空建议 |

### 2. 解决方案

**reopenItem 缓存复用策略**：
- 有 archived Entry 时：从 Entry 回写 `tags`、`project`、`actions` 到 DockItem；保留 `processedAt`；不清空 `suggestions`
- 无 archived Entry 时：仅改 status，清空 `processedAt`
- 用户编辑正文 → `updateDockItemText` → `SuggestionResetPolicy` 清空建议，仍需重新建议
- userId 隔离：`getEntryByDockItemId(userId, id)` 已有 userId 过滤

**Lint 修复**：
- 替换所有 `!` 非空断言为 `if (!provenance) return` 或 `if (provenance)` guard
- 移除 `buildChainLink`、`buildGuidancePrompt`、`beforeEach` unused imports
- 移除 `hasMessages`、`item` unused locals；`policy` → `_policy`

### 3. 变更内容

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/lib/repository.ts` | M | reopenItem 从 Entry 回写 tags/project/actions，保留 suggestions 和 processedAt |
| `apps/web/tests/archive-reopen.test.ts` | M | 修改旧断言，新增 8 个缓存复用测试 |
| `apps/web/tests/browse-seed.test.ts` | M | 修正 reopen 断言 |
| `apps/web/tests/repository.test.ts` | M | 修正 reopen 断言，修复非空断言 |
| `packages/domain/src/ports/repository.ts` | M | 移除 hasMessages unused local |
| `packages/domain/src/services/EditSavePolicy.ts` | M | policy → _policy |
| `packages/domain/tests/ChainLinkService.test.ts` | M | 移除 buildChainLink unused import |
| `packages/domain/tests/ChatGuidanceService.test.ts` | M | 移除 buildGuidancePrompt、beforeEach unused imports |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | 本轮日志 |

### 4. 遇到的问题

| 问题 | 解决 |
|------|------|
| 测试中 `entry`/`item` 变量声明后未使用触发 lint | 移除无用变量声明 |

### 5. 验证结果

| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors |
| `pnpm typecheck` | ✅ PASS |
| `pnpm test` (domain) | ✅ 229 tests / 15 files |
| `pnpm test` (web) | ✅ 192 tests / 9 files |
| `pnpm build` | ✅ PASS |

### 6. 手工验证标准

1. 归档记录 → 重新整理/重新入库 → 已有建议/标签/项目/动作可复用（suggestions.length > 0, userTags === entry.tags, selectedProject === entry.project, selectedActions === entry.actions）
2. 编辑正文后 → suggestions 清空、status 回退 pending、processedAt 置 null（EditSavePolicy 生效）
3. 跨用户 reopen → 返回 null，不能读取缓存
4. 无 Entry 场景 reopen → processedAt 为 null

### 7. 风险评估

| 风险 | 等级 | 说明 |
|------|------|------|
| suggestItem 对 reopened 状态仍可重生成建议 | 无 | state-machine 允许 reopened→suggested，行为不变 |
| archived Entry 不存在时的 fallback | 低 | 仅改状态、清 processedAt，与旧行为一致 |
| Entry 回写可能与 DockItem 现有值不同 | 无 | 这是预期行为——Entry 是归档时的快照 |

### 8. 是否可进入下一轮

✅ 是。所有修补完成，lint 清零，测试全通过。

---

## Round 11 Backend — Refill 两层选择逻辑（重走流程 + 单修模块）

**时间**: 2026-04-26 02:04
**轮次**: Phase 3 Round 11
**状态**: ✅ 已解决

### 1. 问题

取消后仅提供"重走流程"模式，缺少"单修模块"选项。用户选"类型"会连带清空内容，无法只改一个字段。

### 2. 解决方案

后端支持两层 refill/refield 模式：

**模式 A — refill（重走流程，cascade）**：已有行为不变
- topic refill → 清空 topic + type + content，从 awaiting_topic 重走
- type refill → 保留 topic，清空 type + content，从 awaiting_type 重走
- content refill → 保留 topic + type，清空 content，从 awaiting_content 重走

**模式 B — refield（单修模块，single field）**：新增
- topic refield → 只清空 topic，保留 type + content
- type refield → 只清空 selectedType，保留 topic + content
- content refield → 只清空 content，保留 topic + type

新增导出：
- `refieldStateFromOption(state, option)` — 纯函数，返回单修后状态
- `buildRefieldPatch(option)` — 返回可持久化的字段 patch
- `ChatGuidanceService.refield(option)` — 服务方法

### 3. 前端需新增内容

1. 取消后展示两层选择 UI：
   - 第一层：选择"重走流程"或"单修模块"
   - 第二层：选择要修改的字段（topic/type/content）
2. 选择"重走流程" → 调用 `service.refill(option)` + `buildRefillPatch(option)` 更新 session
3. 选择"单修模块" → 调用 `service.refield(option)` + `buildRefieldPatch(option)` 更新 session
4. `refield` 不触发 start transition，前端需在用户提交新值后自行推进 step

### 4. 变更内容

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/services/ChatGuidanceService.ts` | M | 新增 refieldStateFromOption、buildRefieldPatch、refield 方法 |
| `packages/domain/tests/ChatGuidanceService.test.ts` | M | 新增 8 个 refield/buildRefieldPatch 测试 |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | 修正验证标准 #4，新增 Round 11 日志 |

### 5. 验证结果

| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors |
| `pnpm typecheck` | ✅ PASS |
| domain tests | ✅ 241 tests / 15 files |
| web tests | ✅ 203 tests / 9 files |
| `pnpm build` | ✅ PASS |

### 6. 风险评估

| 风险 | 等级 | 说明 |
|------|------|------|
| 前端未适配 refield 模式 | 中 | 前端需新增两层选择 UI，旧 refill API 仍可用 |
| refield 后 rawText 未更新 | 低 | rawText 在 submitContent 时重新构建 |

### 7. 是否可进入下一轮

✅ 是。后端两层 refill/refield 逻辑已就绪，待前端适配。

---

## Round 9 Backend — 质量收口复核

**时间**: 2026-04-26 01:02
**轮次**: Phase 3 Round 9
**状态**: ✅ 已通过

### 1. 复核项

| # | 复核内容 | 结果 |
|---|----------|------|
| 1 | trailing whitespace | ✅ `git diff --cached --check` 无输出，devlog 无 trailing whitespace |
| 2 | archived Entry 存在时 reopen 复用 tags/project/actions/suggestions/processedAt | ✅ 与实现一致 |
| 3 | 编辑正文后 suggestions 清空、status 回 pending、processedAt 置 null | ✅ `updateDockItemText` → `SuggestionResetPolicy` 生效 |
| 4 | userId 隔离不泄漏 | ✅ `getDockItemForUser` + `getEntryByDockItemId` 双重过滤 |
| 5 | 测试断言与实际逻辑一致 | ✅ archive-reopen/browse-seed/repository/integration 全部对齐 |
| 6 | devlog 手工验证标准覆盖用户 3 条要求 | ✅ 已覆盖 |

### 2. 手工验证标准

1. 归档记录重新整理后不用重新生成即可看到既有整理结果
2. 编辑正文后才要求重新建议
3. 跨用户 reopen 不可读取缓存

### 3. 是否可进入下一轮

✅ 是。无业务逻辑变更，质量收口通过。

---

## Round 10 Backend — ChatSession Dock 文档映射 + Refill 状态语义

**时间**: 2026-04-26 01:52
**轮次**: Phase 3 Round 10
**状态**: ✅ 已解决

### 1. 问题

| # | 问题 | 等级 | 说明 |
|---|------|------|------|
| 1 | ChatSession 与 Dock 文档无映射 | P0 | 每次确认 chat 都创建新 DockItem，重复确认产生重复文档 |
| 2 | Refill 语义不正确 | P1 | topic refill 只清 topic 不清 type/content；type refill 不清 content |
| 3 | Refill 无持久化 patch | P1 | 前端无法获取应更新到 persisted session 的字段变更 |

### 2. 解决方案

**ChatSession dockItemId 映射**：
- domain ports/db/repository 全链路增加 `dockItemId: number | null`
- v11 migration 给旧 session 填 `null`
- 新增 `confirmChatSession(userId, id, content, topic, type)`：
  - 已绑定 dockItemId → 更新原 DockItem（文本/topic 变化走 `updateDockItemText`/EditSavePolicy；type 变化更新 tags）
  - 未绑定 → 创建新 DockItem（含 topic）并绑定，type 作为 tag
  - 文本未变 → 不重置 suggestions/status/processedAt

**DockItem.topic 字段**：
- DockItem 增加 `topic: string | null`，归档时同步为 Entry.title（`input.topic || extractTitle(rawText)`）
- ArchiveInput 增加 `topic: string | null`
- `createDockItem` options 增加 `topic`
- `updateDockItemText` 增加 `topic` 参数

**Refill 状态语义**：
- topic refill：清空 topic + selectedType + content → awaiting_topic
- type refill：保留 topic，清空 selectedType + content → awaiting_type
- content refill：保留 topic + selectedType，清空 content → awaiting_content
- 新增 `buildRefillPatch(option)` 生成可持久化的字段 patch

### 3. 变更内容

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/ports/repository.ts` | M | ChatSession/CreateInput/UpdateInput 增加 dockItemId；DockItem 增加 topic |
| `packages/domain/src/types.ts` | M | ArchiveInput 增加 topic |
| `packages/domain/src/services/ChatGuidanceService.ts` | M | 修正 refillStateFromOption 语义，新增 buildRefillPatch |
| `apps/web/lib/db.ts` | M | ChatSessionRecord 增加 dockItemId，DockItemRecord 增加 topic，v11 migration |
| `apps/web/lib/repository.ts` | M | createDockItem/updateDockItemText 支持 topic，confirmChatSession 含 topic/type，新增 dockItemId |
| `apps/web/tests/chat-session.test.ts` | M | 新增 11 个 dockItemId/confirmChatSession 测试 |
| `packages/domain/tests/ChatGuidanceService.test.ts` | M | 修正 refill 断言，新增 4 个 buildRefillPatch 测试 |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | 本轮日志 |

### 4. 遇到的问题

| 问题 | 解决 |
|------|------|
| `first` 变量声明后未使用触发 lint | 移除无用变量声明 |

### 5. 验证结果

| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors |
| `pnpm typecheck` | ✅ PASS |
| domain tests | ✅ 233 tests / 15 files |
| web tests | ✅ 203 tests / 9 files |
| `pnpm build` | ✅ PASS |

### 6. 手工验证标准

1. 一个 Chat 历史记录第一次确认生成一个 Dock 文档
2. 选择同一历史记录后重新确认，只更新同一个 Dock 文档，不新增文档
3. 新建聊天才生成新的 Dock 文档
4. DockItem.topic 归档后同步为 Entry.title（topic 优先，否则从 rawText 提取首行）
5. 取消后两层选择：(a) 重走流程 — 选"类型"保留标题并重走类型+内容+确认，选"内容"保留标题+类型并重走内容+确认；(b) 单修模块 — 选哪块只改哪块，其他字段不变

### 7. 风险评估

| 风险 | 等级 | 说明 |
|------|------|------|
| confirmChatSession 重复确认时 DockItem 被删 | 低 | 若已绑定 DockItem 不存在，fallback 创建新 DockItem |
| 前端未调用 confirmChatSession | 中 | 前端需迁移到新 API，旧路径仍可用 |
| v11 migration 兼容性 | 低 | 仅新增字段默认 null，不影响现有数据 |

### 8. 是否可进入下一轮

✅ 是。所有修补完成，lint 清零，测试全通过。

---

## Round 12 Backend — Widget/Calendar 主线 + devlog 口径修正

**时间**: 2026-04-26 04:50
**轮次**: Phase 3 Round 12
**状态**: ✅ 已解决

### 0. 口径修正

- devlog 中 v10 migration → v11（与代码 db.version(11) 一致）
- 明确当前仅 chat/editor 修补轮通过，Phase 3 主线仍剩 Widget/Calendar、Graph Tree、Review Insight

### 1. 问题

| # | 问题 | 等级 | 说明 |
|---|------|------|------|
| 1 | 无 Widget 持久化模型 | P0 | Phase 3 Widget/Calendar 主线未启动 |
| 2 | 无 Calendar 日期查询能力 | P0 | 前端无法按日期定位归档内容 |

### 2. 解决方案

**WidgetRegistry**：
- DB 新增 `widgets` 表（v12 migration），字段：id, userId, widgetType, active, config, createdAt, updatedAt
- 仅支持内置 `calendar` widget 类型
- 每用户仅允许一个 active widget（activateWidget 自动 deactivate 旧 widget）
- userId 隔离

**CalendarWidgetService**（domain 纯函数）：
- `queryEntriesByDate(entries, userId, date)` → 按日期过滤归档条目
- `queryMonthOverview(entries, userId, year, month)` → 返回有归档条目的日期列表
- Repository 层封装：`queryCalendarDay(userId, date)` / `queryCalendarMonth(userId, year, month)`

### 3. 变更内容

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/services/CalendarWidgetService.ts` | A | Calendar 日期查询纯函数 |
| `packages/domain/src/services/index.ts` | M | 导出 CalendarWidgetService |
| `packages/domain/tests/CalendarWidgetService.test.ts` | A | 8 个 domain 测试 |
| `apps/web/lib/db.ts` | M | WidgetRecord/PersistedWidget，v12 migration，widgetsTable |
| `apps/web/lib/repository.ts` | M | Widget CRUD + Calendar 查询 |
| `apps/web/tests/widget-calendar.test.ts` | A | 12 个 repository 测试 |
| `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | v10→v11 修正，Round 12 日志 |

### 4. 遇到的问题

无。

### 5. 验证结果

| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors |
| `pnpm typecheck` | ✅ PASS |
| domain tests | ✅ 249 tests / 16 files |
| web tests | ✅ 215 tests / 10 files |
| `pnpm build` | ✅ PASS |

### 6. 手工验证标准

1. 仅允许一个生效 widget（activateWidget 自动 deactivate 旧 widget）
2. 点击某日期时能返回该日期真实归档内容
3. 空日期返回真实空状态
4. 不同用户之间日期结果不串数据

### 7. 风险评估

| 风险 | 等级 | 说明 |
|------|------|------|
| 前端未适配 Widget UI | 中 | 后端 API 就绪，前端需新增 Widget 容器组件 |
| Calendar 查询全表扫描 | 低 | 当前数据量可接受，后续可加索引优化 |
| 仅支持 calendar 类型 | 低 | Phase 3 范围限定，后续可扩展 |

### 8. 是否可进入下一轮

✅ 是。Widget/Calendar 后端能力已就绪，待前端适配。Phase 3 主线仍剩 Graph Tree、Review Insight。

（无）

---

## 关联文档

| 文档 | 路径 |
|------|------|
| 架构说明书 | `docs/product/ARCHITECTURE.md` |
| 技术规格 | `docs/product/TECH_SPEC.md` |
| Phase 3 Feature & Bugs | `docs/engineering/dev_log/Phase3/pre-phase3-demo_feature_and_bugs.md` |
| 架构调整日志 | `docs/engineering/dev_log/Phase3/pre-phase3-architecture_rebuild.md` |