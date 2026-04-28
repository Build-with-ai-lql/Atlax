## Phase Refactory Round 1 Backend — 后端领域层收敛

**时间**: 2026-04-27 03:06 CST
**轮次**: Phase Refactory Round 1 Backend
**状态**: ✅ 已完成

### 1. 变更内容

#### 1.1 冻结 Entry 心智，建立 Document / Capture / MindNode / MindEdge 领域命名边界

**新增 domain 子目录**：
- `packages/domain/src/document/` — Document 类型 + 服务 + 导出
- `packages/domain/src/capture/` — Capture 类型 + 导出
- `packages/domain/src/mind/` — MindNode / MindEdge 类型 + ID 生成 + 导出

**命名映射**：
| 旧名 | 新名 | 说明 |
|------|------|------|
| Entry | Document | 归档后的结构化内容 |
| EntryType | DocumentType | note/meeting/idea/task/reading |
| EntryRecord | DocumentRecord | DB 持久化类型（alias） |
| entriesTable | documentsTable | DB 表引用（alias） |
| sourceDockItemId | sourceCaptureId | Document 关联的 Capture ID |
| DockItem | Capture | 输入捕获（归档前） |
| EntryStatus | CaptureStatus | pending/suggested/archived/ignored/reopened |
| SourceType | CaptureSource | text/voice/import/chat |
| — | MindNode | 图谱节点（11 种类型，8 种状态） |
| — | MindEdge | 图谱边（8 种类型） |

#### 1.2 兼容式收敛，避免前端断裂

**domain 层**：
- `types.ts` 保留所有旧类型（Entry, EntryType, EntryStatus, SourceType, SuggestionItem 等），新增 re-export 新类型
- `EntryService.ts` 保留不动，新增 `document/service.ts` 提供同名逻辑（buildDocumentPatch / buildCaptureSyncPatch / buildDocumentAndCapturePatches）
- 新增 `documentFromEntry()` / `entryFromDocument()` 双向转换函数

**ports 层**：
- `repository.ts` 新增 `DocumentRepository` / `MindNodeRepository` / `MindEdgeRepository` 接口
- 新增 `PersistedDocument = Document & { userId: string }` / `PersistedMindNode` / `PersistedMindEdge`
- 保留 `EntryRepository` / `PersistedEntry` 不变

**db.ts**：
- `DocumentRecord = EntryRecord` / `PersistedDocument = PersistedEntry` 类型别名
- `CaptureRecord = DockItemRecord` / `PersistedCapture = PersistedDockItem` 类型别名
- `documentsTable = entriesTable` / `capturesTable = dockItemsTable` 引用别名
- v14 migration 新增 `mindNodes` / `mindEdges` 两张表，不修改旧表

**repository.ts**：
- 新增 Document 别名函数：listDocuments / listDocumentsByType / listDocumentsByTag / listDocumentsByProject / getDocumentByCaptureId / updateDocument
- 新增 MindNode CRUD：upsertMindNode / getMindNode / listMindNodes / listMindNodesByType / deleteMindNode
- 新增 MindEdge CRUD：upsertMindEdge / getMindEdge / listMindEdges / listMindEdgesBySourceNode / listMindEdgesByTargetNode / deleteMindEdge
- 所有旧函数保留不动

#### 1.3 包导出边界

`package.json` exports 新增：
- `@atlax/domain/document` → `./src/document/index.ts`
- `@atlax/domain/capture` → `./src/capture/index.ts`
- `@atlax/domain/mind` → `./src/mind/index.ts`

### 2. 遇到的问题

| 问题 | 解决方式 | 是否解决 |
|------|---------|---------|
| 无 | — | — |

### 3. 收口验证命令和结果

| 命令 | 结果 |
|------|------|
| `node -v && pnpm -v` | v24.14.0 / 10.0.0 |
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 303 tests / 19 files |
| `pnpm --dir apps/web typecheck` | ✅ PASS |
| `pnpm --dir apps/web test -- --run` | ✅ 262 tests / 12 files |
| `git diff --cached --check` | ✅ 仅 2 个已有 trailing whitespace 警告（非本轮修改） |

### 4. 本轮手工验证与验证标准

1. **旧代码零改动**：前端 import `@atlax/domain` 的 Entry / EntryType / EntryStatus / SourceType 仍可正常使用
2. **新命名可用**：`import { Document, DocumentType, Capture, CaptureStatus, MindNode, MindEdge } from '@atlax/domain'` 编译通过
3. **子包导出可用**：`import { Document } from '@atlax/domain/document'` / `import { MindNode } from '@atlax/domain/mind'` 编译通过
4. **DB 表别名**：`documentsTable.get(id)` 与 `entriesTable.get(id)` 返回相同数据
5. **MindNode/MindEdge CRUD**：upsert → get → list → delete 完整闭环
6. **v14 migration**：新增 mindNodes/mindEdges 表，不破坏旧表数据

### 5. 是否可以进入下一轮

✅ 可以。所有验证通过，旧代码零改动，新命名边界已建立。

### 6. 下一轮风险评估

| 风险 | 等级 | 说明 |
|------|------|------|
| 前端未迁移到新命名 | 低 | 旧命名仍可用，前端可渐进迁移 |
| MindNode/MindEdge 无自动从 Entry 生成逻辑 | 中 | 需后续 Round 实现 auto-landing 算法 |
| Document/Capture 别名函数未覆盖所有旧函数 | 低 | 当前覆盖 list/get/update 主路径，其余按需补充 |

### 7. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/document/types.ts` | A | Document / DocumentType / DocumentPatch 等类型 |
| `packages/domain/src/document/service.ts` | A | buildDocumentPatch / documentFromEntry / entryFromDocument |
| `packages/domain/src/document/index.ts` | A | 导出边界 |
| `packages/domain/src/capture/types.ts` | A | Capture / CaptureStatus / CaptureSource 类型 |
| `packages/domain/src/capture/index.ts` | A | 导出边界 |
| `packages/domain/src/mind/types.ts` | A | MindNode / MindEdge / makeMindNodeId / makeMindEdgeId |
| `packages/domain/src/mind/index.ts` | A | 导出边界 |
| `packages/domain/src/types.ts` | M | 新增 re-export 新类型 |
| `packages/domain/src/index.ts` | M | 新增 document/capture/mind 导出 |
| `packages/domain/src/ports/repository.ts` | M | 新增 DocumentRepository / MindNodeRepository / MindEdgeRepository 接口 |
| `packages/domain/src/services/index.ts` | M | 保持不变 |
| `packages/domain/package.json` | M | 新增 document/capture/mind exports |
| `packages/domain/tests/document-service.test.ts` | A | 17 个 Document 服务测试 |
| `packages/domain/tests/mind-types.test.ts` | A | 11 个 Mind 类型测试 |
| `apps/web/lib/db.ts` | M | DocumentRecord/CaptureRecord 别名 + v14 migration + mindNodes/mindEdges 表 |
| `apps/web/lib/repository.ts` | M | Document 别名函数 + MindNode/MindEdge CRUD |
| `apps/web/tests/mind-graph.test.ts` | A | 14 个 Mind Graph + Document alias 集成测试 |

---

## Phase Refactory Round 2 Backend — Workspace Session / Tabs / Recent Documents 数据骨架

**时间**: 2026-04-27 05:54 CST
**轮次**: Phase Refactory Round 2 Backend
**状态**: ✅ 已完成

### 1. 变更内容

#### 1.1 新增 Workspace Tabs 数据模型

**domain 层** `packages/domain/src/workspace/`：
- `types.ts` — `TabType`（9 种：home/mind/dock/editor/document/node/project/review/settings）、`WorkspaceSession`、`WorkspaceOpenTab`、`RecentDocument`
- `makeWorkspaceSessionId()` / `makeWorkspaceTabId()` / `makeRecentDocumentId()` — 确定性 ID 生成
- `index.ts` — 导出边界

**db.ts v15 migration**：
- `workspaceSessions` 表 — id, userId, activeTabId, lastActivityAt
- `workspaceOpenTabs` 表 — id, userId, sessionId, tabType, documentId, isPinned, isActive, sortOrder
- `recentDocuments` 表 — id, userId, documentId, openCount, lastOpenedAt

#### 1.2 补齐 Repository API

| 函数 | 说明 |
|------|------|
| `getWorkspaceSession(userId)` | 获取或创建 session |
| `openWorkspaceTab({ userId, tabType, title, path, documentId? })` | 打开标签，自动去重 editor+documentId |
| `closeWorkspaceTab(userId, tabId)` | 关闭标签，自动激活下一个 |
| `activateWorkspaceTab(userId, tabId)` | 激活标签，取消其他 active |
| `pinWorkspaceTab(userId, tabId, pinned?)` | 置顶/取消置顶 |
| `restoreWorkspaceTabs(userId)` | 恢复所有打开标签（按 sortOrder） |
| `listRecentDocuments(userId, limit)` | 列出最近打开文档 |
| `recordRecentDocumentOpen({ userId, documentId, title })` | 记录文档打开，去重+openCount+1 |

#### 1.3 Editor Tab 去重逻辑

`openWorkspaceTab` 在 `tabType === 'editor' && documentId != null` 时，先查找已有同 documentId 的 editor tab，若存在则直接 `activateWorkspaceTab` 而非创建新 tab。

### 2. 遇到的问题

| 问题 | 解决方式 | 是否解决 |
|------|---------|---------|
| 无 | — | — |

### 3. 收口验证命令和结果

| 命令 | 结果 |
|------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 312 tests / 20 files |
| `pnpm --dir apps/web typecheck` | ✅ PASS |
| `pnpm --dir apps/web test -- --run` | ✅ 286 tests / 13 files |
| `git diff --cached --check` | ✅ 仅 FRONTEND_TECH_SPEC 已有 trailing whitespace |

### 4. 本轮手工验证与验证标准

1. **Tab open / activate / close / pin 闭环**：open → activate → close → restore 完整流程
2. **同一 document editor tab 不重复打开**：openWorkspaceTab(editor, docId=1) 两次只创建一个 tab
3. **Recent document 去重并更新 openCount / lastOpenedAt**：recordRecentDocumentOpen 同 docId 三次 → openCount=3
4. **userId 隔离**：用户 A 的 session/tabs/recent 不包含用户 B 数据
5. **关闭 active tab 后自动激活最后一个**：close active → 最后一个 sortOrder 的 tab 变为 active
6. **所有 tab 关闭后 session.activeTabId 为 null**

### 5. 是否可以进入下一轮

✅ 可以。所有验证通过，Workspace Session / Tabs / Recent Documents 数据骨架完整。

### 6. 下一轮风险评估

| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 tabStore 未对接 | 中 | 需前端实现 tabStore 并调用 repository API |
| Tab 持久化恢复流程未实现 | 低 | restoreWorkspaceTabs 已可用，前端需在启动时调用 |
| 无 tab 数量上限 | 低 | 当前无最大 tab 数限制，后续可加 |

### 7. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/domain/src/workspace/types.ts` | A | TabType / WorkspaceSession / WorkspaceOpenTab / RecentDocument + ID 生成 |
| `packages/domain/src/workspace/index.ts` | A | 导出边界 |
| `packages/domain/src/index.ts` | M | 新增 workspace 导出 |
| `packages/domain/package.json` | M | 新增 workspace exports |
| `packages/domain/tests/workspace-types.test.ts` | A | 9 个 workspace 类型测试 |
| `apps/web/lib/db.ts` | M | Workspace Record 类型 + v15 migration + 3 张新表 |
| `apps/web/lib/repository.ts` | M | Session/Tab/Recent CRUD + 类型导出 |
| `apps/web/tests/workspace-tabs.test.ts` | A | 24 个 workspace 集成测试 |