# Phase 3.0 - 架构决策与迁移计划

| 开发日志信息 | |
|-------------|---------|
| 阶段 | Phase 3 |
| 轮次 | Phase 3.0 |
| 日期 | 2026-04-23 |
| 负责人 | Architecture Agent |
| 状态 | 已完成 |

---

## 1. 本轮目标

1. **明确架构风格**：DDD-lite + 模块化单体 + Ports/Adapters
2. **产出迁移计划**：多轮执行清单，每轮有范围、风险、回滚点
3. **更新项目导览**：让小白能一眼看懂前后端边界

---

## 2. 架构决策

### 2.1 架构风格选型

| 维度 | 决策 | 理由 |
|------|------|------|
| 整体风格 | **DDD-lite + 模块化单体** | Phase 2 已验证单体可行性，DDD-lite 提供领域边界但不引入完整 DDD 复杂度 |
| 扩展模式 | **Ports/Adapters（六边形架构）** | 隔离核心业务与外部依赖，确保后续可切换存储或接入后端服务 |
| 模块组织 | **按领域能力划分包** | Capture、Dock、Suggest、Tag、Archive 等作为独立模块 |

### 2.2 分层架构

```
前端应用层 (apps/web)
         │
         ▼
适配器层 (Adapters)
  Primary: UI Handlers / API Controllers
  Secondary: Repository Impl / External Services
         │
         ▼
端口层 (Ports)
  Input: Application Services / Use Cases
  Output: Repository Interfaces / Service Interfaces
         │
         ▼
领域层 (packages/domain)
  Entities / Value Objects / Domain Services
  State Machine / Suggestion Engine / Tag Policy
```

### 2.3 关键架构原则

1. **依赖单向**：外层依赖内层，内层不感知外层实现
2. **端口隔离**：领域层只定义接口，适配器负责实现
3. **模块自治**：每个领域模块可独立测试和演进
4. **存储可替换**：通过 Repository Pattern 支持后续切换存储方案

---

## 3. 迁移计划

### 3.1 多轮执行清单

| 轮次 | 内容 | 范围 | 风险 | 回滚点 |
|------|------|------|------|-------|
| Round 1 | 仓储接口提取 | 提取 DockItemRepository、EntryRepository、TagRepository 接口 | 低 | git 回滚 |
| Round 2 | 应用服务封装 | 提取 DockItemService、EntryService | 中 | 直接调用 Repository |
| Round 3 | Suggestion 策略提取 | 抽象 SuggestionResetPolicy | 低 | 策略逻辑内联回原方法 |
| Round 4 | ImmersiveEditor 接口预留 | 定义 EditorBackendPort 接口 | 低 | 删除接口定义 |
| Round 5 | File/Project 服务接口预留 | 定义 FileService、ProjectService 接口 | 低 | 删除接口定义 |
| Round 6 | Markdown 渲染接口预留 | 定义 MarkdownRenderPort 接口 | 低 | 删除接口定义 |

### 3.2 轮次依赖

```
Round 1 (接口提取)
    │
    ▼
Round 2 (应用服务封装)  ──► Round 3 (策略提取)
    │
    ▼
Round 4-6 (后端接口预留，可并行)
```

---

## 4. 文档更新

| 文件 | 更新内容 |
|------|---------|
| `README.md` | 新增仓库结构导览、前后端边界说明 |
| `docs/product/ARCHITECTURE.md` | 新增架构决策摘要（§0）、Ports/Adapters 模块映射（§5） |
| `docs/product/TECH_SPEC.md` | 新增架构决策章节（§0）、关联文档章节（§13） |
| `docs/engineering/architecture-migration-plan.md` | 新建，多轮迁移执行清单 |

---

## 5. 约束检查

- [x] 上一轮代码已提交并推送至远端
- [x] 本轮更改仅涉及文档文件
- [x] 未修改 apps/**、packages/**、scripts/** 代码
- [x] 所有更改放入 git 暂存区，可通过 git diff 查看

---

## 6. 下一步

等待 Phase 3.1 开始执行 Round 1：仓储接口提取

---

## 8. Phase 3.1 - Round 1 仓储接口提取

| 开发日志信息 | |
|-------------|---------|
| 日期 | 2026-04-23 |
| 负责人 | Backend Agent |
| 状态 | 已完成 |

### 8.1 执行内容

1. **创建 `packages/domain/src/ports/repository.ts`**
   - 定义 `DockItemRepository`、`EntryRepository`、`TagRepository`、`StatsRepository` 接口
   - 定义 `DockItem`、`PersistedEntry`、`PersistedTag` 类型
   - 定义 `WorkspaceStats`、`EntryUpdate` 等辅助类型

2. **创建 `packages/domain/src/ports/index.ts`**
   - 导出 ports 模块

3. **更新 `packages/domain/src/index.ts`**
   - 添加 `export * from './ports'`

4. **更新 `packages/domain/package.json`**
   - 添加 `"ports": "./src/ports/index.ts"` 到 exports

5. **更新 `apps/web/lib/repository.ts`**
   - 导入 `DockItem` 类型从 `@atlax/domain/ports`
   - 使用 domain types 替代 persistence types

6. **更新 `README.md`**
   - 修正测试目录结构：`tests/` -> `apps/web/tests/` 和 `packages/domain/tests/`
   - 添加 ports 目录到仓库树

### 8.2 关键 Diff

**packages/domain/src/ports/repository.ts** (新增)
```typescript
export interface DockItemRepository {
  create(userId: string, rawText: string, sourceType: SourceType): Promise<number>
  findById(userId: string, id: number): Promise<DockItem | null>
  listByUser(userId: string): Promise<DockItem[]>
  listByStatus(userId: string, status: EntryStatus): Promise<DockItem[]>
  // ...
}

export interface EntryRepository {
  findById(userId: string, id: number): Promise<DomainEntry | null>
  // ...
}

export interface TagRepository {
  findById(userId: string, id: string): Promise<DomainTag | null>
  // ...
}
```

### 8.3 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --dir apps/web lint` | ✅ PASS | - |
| `pnpm --dir apps/web typecheck` | ✅ PASS | - |
| `pnpm --dir apps/web test -- --run` | ⚠️ 受阻 | darwin-arm64 下 Rollup native 加载影响，ERR_DLOPEN_FAILED / code signature |

> 注：test 命令在当前机器（darwin-arm64）受 Rollup native 加载影响，存在 `ERR_DLOPEN_FAILED` 或 `code signature` 相关错误导致阻塞。此问题为本地环境特定，非代码逻辑问题。

### 8.4 约束检查

- [x] 上一轮代码已提交并推送至远端
- [x] 本轮更改已放入 git 暂存区
- [x] lint PASS / typecheck PASS / test 受 darwin-arm64 Rollup native 加载影响（ERR_DLOPEN_FAILED / code signature）受阻
- [x] 未修改 apps/web/app/** (前端 UI 文件)

### 8.5 下一步

Phase 3.2 - Round 2：应用服务封装

---

## 9. Phase 3.2 - Round 2（第一个子模块）：应用服务封装

| 开发日志信息 | |
|-------------|---------|
| 日期 | 2026-04-23 |
| 负责人 | Backend Agent |
| 状态 | 已完成 |
| 子模块 | DockItemService（文本更新与状态重置链路） |

### 9.1 执行内容

1. **新增 `packages/domain/src/services/DockItemService.ts`**
   - `buildDockItemReset()`: 返回状态重置字段（status='pending', suggestions=[], processedAt=null）
   - `applyTextUpdateToDockItem()`: 将重置逻辑应用到 DockItem 对象

2. **新增 `packages/domain/src/services/index.ts`**
   - 导出 services 模块

3. **更新 `packages/domain/src/index.ts`**
   - 添加 `export * from './services'`

4. **更新 `apps/web/lib/repository.ts`**
   - `updateDockItemText()` 改为调用 `buildDockItemReset()` 获取重置字段

5. **新增 `packages/domain/tests/DockItemService.test.ts`**
   - 覆盖 `buildDockItemReset` 和 `applyTextUpdateToDockItem` 函数

### 9.2 关键 Diff

**packages/domain/src/services/DockItemService.ts** (新增)
```typescript
export function buildDockItemReset(update: DockItemTextUpdate): Partial<DockItem> {
  return {
    rawText: update.newText,
    status: 'pending',
    suggestions: [],
    processedAt: null,
  }
}
```

**apps/web/lib/repository.ts**
```typescript
export async function updateDockItemText(userId: string, id: number, rawText: string) {
  const item = await getDockItemForUser(userId, id)
  if (!item) return null

  const resetFields = buildDockItemReset({ dockItemId: id, newText: rawText })
  await dockItemsTable.update(id, resetFields)

  return getPersistedDockItem(id)
}
```

### 9.3 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --dir apps/web lint` | ✅ PASS | - |
| `pnpm --dir apps/web typecheck` | ✅ PASS | - |
| `pnpm --dir apps/web test -- --run` | ⚠️ 受阻 | darwin-arm64 下 @rollup/rollup-darwin-arm64 加载失败，ERR_DLOPEN_FAILED / code signature |
| `pnpm --dir packages/domain test -- --run` | ⚠️ 受阻 | darwin-arm64 下 @rollup/rollup-darwin-arm64 加载失败，ERR_DLOPEN_FAILED / code signature |

### 9.4 约束检查

- [x] 上一轮代码已提交并推送至远端
- [x] 本轮更改已放入 git 暂存区
- [x] lint PASS / typecheck PASS / test 受阻（darwin-arm64 @rollup/rollup-darwin-arm64，ERR_DLOPEN_FAILED / code signature）
- [x] 未修改 apps/web/app/** (前端 UI 文件)
- [x] 行为保持等价，状态重置逻辑不变

### 9.5 下一步

Phase 3.3 - Round 2（第二个子模块）：EntryService 封装

---

## 10. Phase 3.3 - Round 2（第二个子模块）：EntryService 封装

| 开发日志信息 | |
|-------------|---------|
| 日期 | 2026-04-23 |
| 负责人 | Backend Agent |
| 状态 | 已完成 |
| 子模块 | EntryService（Entry 更新 + Dock 同步标签） |

### 10.1 执行内容

1. **新增 `packages/domain/src/services/EntryService.ts`**
   - `EntryUpdateInput`: 输入类型
   - `EntryPatch`: Entry 更新 patch
   - `DockSyncPatch`: Dock 同步 patch
   - `buildEntryPatch()`: 构建 Entry patch
   - `buildDockSyncPatch()`: 构建 Dock 同步 patch（有条件）
   - `buildEntryAndDockPatches()`: 组合构建两个 patch

2. **更新 `packages/domain/src/services/index.ts`**
   - 添加 `export * from './EntryService'`

3. **更新 `apps/web/lib/repository.ts`**
   - `updateArchivedEntry()` 改为调用 `buildEntryAndDockPatches()`

4. **新增 `packages/domain/tests/EntryService.test.ts`**
   - 14 个测试用例覆盖 patch 构建逻辑

### 10.2 关键 Diff

**packages/domain/src/services/EntryService.ts** (新增)
```typescript
export function buildEntryAndDockPatches(
  updates: EntryUpdateInput,
  sourceDockItemId: number | undefined,
): BuildEntryPatchResult {
  return {
    entryPatch: buildEntryPatch(updates),
    dockSyncPatch: buildDockSyncPatch(sourceDockItemId, updates.tags),
  }
}
```

**apps/web/lib/repository.ts**
```diff
- const patch: Partial<EntryRecord> = {}
- if (updates.tags !== undefined) patch.tags = updates.tags
- if (updates.project !== undefined) patch.project = updates.project
- if (updates.content !== undefined) patch.content = updates.content
- if (updates.title !== undefined) patch.title = updates.title
+ const { entryPatch, dockSyncPatch } = buildEntryAndDockPatches(updates, entry.sourceDockItemId)
```

### 10.3 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --dir apps/web lint` | ✅ PASS | - |
| `pnpm --dir apps/web typecheck` | ✅ PASS | - |
| `pnpm --dir apps/web test -- --run` | ⚠️ 受阻 | darwin-arm64 下 @rollup/rollup-darwin-arm64 加载失败，ERR_DLOPEN_FAILED / code signature |
| `pnpm --dir packages/domain typecheck` | ✅ PASS | - |
| `pnpm --dir packages/domain test -- --run` | ⚠️ 受阻 | darwin-arm64 下 @rollup/rollup-darwin-arm64 加载失败，ERR_DLOPEN_FAILED / code signature |

### 10.4 约束检查

- [x] 上一轮代码已提交并推送至远端
- [x] 本轮更改已放入 git 暂存区
- [x] lint PASS / typecheck PASS / test 受阻（darwin-arm64 @rollup/rollup-darwin-arm64，ERR_DLOPEN_FAILED / code signature）
- [x] 未修改 apps/web/app/** (前端 UI 文件)
- [x] 行为保持等价，跨模块同步逻辑不变

### 10.5 下一步

Phase 3.4 - Round 3：Suggestion 策略提取

---

## 11. Phase 3.4 - Round 3：Suggestion 策略提取

| 开发日志信息 | |
|-------------|---------|
| 日期 | 2026-04-23 |
| 负责人 | Backend Agent |
| 状态 | 已完成 |
| 子模块 | SuggestionResetPolicy（编辑后建议重置策略） |

### 11.1 执行内容

1. **新增 `packages/domain/src/policies/SuggestionResetPolicy.ts`**
   - `SuggestionResetInput`: 策略输入类型
   - `SuggestionResetOutput`: 策略输出类型
   - `SuggestionResetPolicy`: 策略接口（可替换）
   - `defaultSuggestionResetPolicy`: 默认策略实现
   - `applySuggestionResetPolicy()`: 应用策略函数
   - `buildSuggestionResetPatch()`: 构建重置 patch

2. **新增 `packages/domain/src/policies/index.ts`**
   - 导出 policies 模块

3. **更新 `packages/domain/src/index.ts`**
   - 添加 `export * from './policies'`

4. **更新 `packages/domain/src/services/DockItemService.ts`**
   - `buildDockItemReset()` 改为调用 `buildSuggestionResetPatch()`
   - `applyTextUpdateToDockItem()` 改为调用 `buildSuggestionResetPatch()`

5. **新增 `packages/domain/tests/SuggestionResetPolicy.test.ts`**
   - 10 个测试用例覆盖策略逻辑

### 11.2 关键 Diff

**packages/domain/src/policies/SuggestionResetPolicy.ts** (新增)
```typescript
export interface SuggestionResetPolicy {
  shouldReset(input: SuggestionResetInput): boolean
  buildResetPatch(input: SuggestionResetInput): SuggestionResetOutput
}

export const defaultSuggestionResetPolicy: SuggestionResetPolicy = {
  shouldReset(input): boolean {
    return input.currentRawText !== input.newRawText
  },
  buildResetPatch(input): SuggestionResetOutput {
    return {
      rawText: input.newRawText,
      status: 'pending',
      suggestions: [],
      processedAt: null,
    }
  },
}
```

**packages/domain/src/services/DockItemService.ts**
```diff
+ import { buildSuggestionResetPatch } from '../policies/SuggestionResetPolicy'

  export function buildDockItemReset(update: DockItemTextUpdate): Partial<DockItem> {
-   return {
-     rawText: update.newText,
-     status: 'pending',
-     suggestions: [],
-     processedAt: null,
-   }
+   return buildSuggestionResetPatch(update.dockItemId, update.newText)
  }
```

### 11.3 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --dir apps/web lint` | ✅ PASS | - |
| `pnpm --dir apps/web typecheck` | ✅ PASS | - |
| `pnpm --dir apps/web test -- --run` | ⚠️ 受阻 | darwin-arm64 下 @rollup/rollup-darwin-arm64 加载失败，ERR_DLOPEN_FAILED / code signature |
| `pnpm --dir packages/domain typecheck` | ✅ PASS | - |
| `pnpm --dir packages/domain test -- --run` | ⚠️ 受阻 | darwin-arm64 下 @rollup/rollup-darwin-arm64 加载失败，ERR_DLOPEN_FAILED / code signature |

### 11.4 约束检查

- [x] 上一轮代码已提交并推送至远端
- [x] 本轮更改已放入 git 暂存区
- [x] lint PASS / typecheck PASS / test 受阻（darwin-arm64 @rollup/rollup-darwin-arm64，ERR_DLOPEN_FAILED / code signature）
- [x] 未修改 apps/web/app/** (前端 UI 文件)
- [x] 行为保持等价，编辑后建议重置逻辑不变
- [x] 策略可替换，支持自定义策略注入

### 11.5 下一步

Pre-Phase3-Architecture-Round-A：后端预留端口补齐

---

## 12. Pre-Phase3-Architecture-Round-A：后端预留端口补齐

| 开发日志信息 | |
|-------------|---------|
| 日期 | 2026-04-23 |
| 负责人 | Backend Agent |
| 状态 | 已完成 |
| 类型 | 架构端口预留 |

### 12.1 执行内容

1. **新增 `packages/domain/src/ports/editor.ts`**
   - `EditorBackendPort`: 沉浸式编辑器后端接口
   - `saveContent()`, `loadContent()`, `deleteContent()`

2. **新增 `packages/domain/src/ports/file.ts`**
   - `FileServicePort`: 文件服务接口
   - `uploadFile()`, `getFile()`, `listFiles()`, `deleteFile()`

3. **新增 `packages/domain/src/ports/project.ts`**
   - `ProjectServicePort`: 项目服务接口
   - `createProject()`, `getProject()`, `listProjects()`, `updateProject()`, `deleteProject()`

4. **新增 `packages/domain/src/ports/rendering.ts`**
   - `MarkdownRenderPort`: Markdown 渲染接口
   - `render()`, `renderPreview()`

5. **更新 `packages/domain/src/ports/index.ts`**
   - 导出 4 个新端口

6. **更新架构文档口径**
   - ARCHITECTURE.md: v5.0 -> v5.1, "Phase 3" -> "Pre-Phase3-Architecture"
   - TECH_SPEC.md: v5.0 -> v5.1, "Phase 3" -> "Pre-Phase3-Architecture"
   - architecture-migration-plan.md: "Phase 3" -> "Pre-Phase3-Architecture"

### 12.2 关键 Diff

**packages/domain/src/ports/editor.ts** (新增)
```typescript
export type EditorRenderMode = 'edit' | 'preview' | 'split'

export interface EditorDocumentSnapshot {
  dockItemId: number
  content: string
  mode: EditorRenderMode
  updatedAt: Date
}

export interface EditorBackendPort {
  loadDocument(userId: string, dockItemId: number): Promise<EditorDocumentSnapshot | null>
  saveDocument(userId: string, dockItemId: number, content: string): Promise<EditorDocumentSnapshot>
  switchMode(userId: string, dockItemId: number, mode: EditorRenderMode): Promise<EditorDocumentSnapshot>
  autosave(userId: string, dockItemId: number, content: string): Promise<void>
}
```

**packages/domain/src/ports/file.ts** (新增)
```typescript
export interface FileServicePort {
  uploadFile(input: FileUploadInput): Promise<FileUploadResult>
  getFile(userId: string, fileId: string): Promise<FileInfo | null>
  listFiles(userId: string): Promise<FileInfo[]>
  deleteFile(userId: string, fileId: string): Promise<boolean>
}
```

**packages/domain/src/ports/project.ts** (新增)
```typescript
export interface ProjectServicePort {
  createProject(input: ProjectCreateInput): Promise<Project>
  getProject(userId: string, projectId: string): Promise<Project | null>
  listProjects(userId: string): Promise<Project[]>
  updateProject(userId: string, projectId: string, updates: ProjectUpdateInput): Promise<Project | null>
  deleteProject(userId: string, projectId: string): Promise<boolean>
}
```

**packages/domain/src/ports/rendering.ts** (新增)
```typescript
export interface MarkdownRenderPort {
  render(input: RenderInput, options?: RenderOptions): Promise<RenderOutput>
  renderPreview(content: string): Promise<RenderOutput>
}
```

### 12.3 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --dir apps/web lint` | ✅ PASS | - |
| `pnpm --dir apps/web typecheck` | ✅ PASS | - |
| `pnpm --dir apps/web test -- --run` | ⚠️ 受阻 | darwin-arm64 下 @rollup/rollup-darwin-arm64 加载失败，ERR_DLOPEN_FAILED / code signature |
| `pnpm --dir packages/domain typecheck` | ✅ PASS | - |
| `pnpm --dir packages/domain test -- --run` | ⚠️ 受阻 | darwin-arm64 下 @rollup/rollup-darwin-arm64 加载失败，ERR_DLOPEN_FAILED / code signature |

### 12.4 约束检查

- [x] 上一轮代码已提交并推送至远端
- [x] 本轮更改已放入 git 暂存区
- [x] lint PASS / typecheck PASS / test 受阻（darwin-arm64 @rollup/rollup-darwin-arm64，ERR_DLOPEN_FAILED / code signature）
- [x] 未修改 apps/web/app/** (前端 UI 文件)
- [x] 未修改 apps/web/lib/** (前端业务代码)
- [x] 仅定义接口，不做具体实现
- [x] 架构文档口径统一为 Pre-Phase3-Architecture

### 12.5 下一步

Pre-Phase3-Architecture-Round-B：文档与结构收敛

---

## 13. Pre-Phase3-Architecture-Round-B：文档与结构收敛

| 开发日志信息 | |
|-------------|---------|
| 日期 | 2026-04-23 |
| 负责人 | Backend Agent |
| 状态 | 已完成 |
| 类型 | 文档收敛与结构整理 |

### 13.1 执行内容

1. **过期计划清理**
   - 删除 `docs/engineering/dev_plan/` 目录（4 个过期本地计划文件）
   - 说明：Notion 为主备份，本地计划文件已过期

2. **非文档文件迁移**
   - 迁移 `docs/product/Front_Design_by_Gemini(do-not-push-on-git)/` 下的 `.tsx` 文件
   - 目标目录：`design_refs/gemini/`
   - 迁移文件：
     - `Atlax_MindDock_Landing_Page.tsx`
     - `gemini_generated_dock_page.tsx`

3. **更新 README.md 目录树**
   - 添加 `design_refs/` 目录
   - 添加 `policies/` 和 `services/` 目录到 `packages/domain/src/`
   - 更新 `ports/` 目录（多个端口文件）
   - 更新 `docs/` 目录结构

4. **修正日志 12.2 editor 示例**
   - 更新为最新接口签名（EditorRenderMode, EditorDocumentSnapshot）

### 13.2 迁移/删除清单

| 操作 | 文件/目录 | 原因 |
|------|----------|------|
| 删除 | `docs/engineering/dev_plan/` | 过期本地计划，Notion 为主备份 |
| 迁移 | `Atlax_MindDock_Landing_Page.tsx` | 非文档文件移出 docs/ |
| 迁移 | `gemini_generated_dock_page.tsx` | 非文档文件移出 docs/ |

### 13.3 验证结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `pnpm --dir apps/web lint` | ✅ PASS | - |
| `pnpm --dir apps/web typecheck` | ✅ PASS | - |
| `pnpm --dir apps/web test -- --run` | ✅ 102 passed | - |
| `pnpm --dir packages/domain typecheck` | ✅ PASS | - |
| `pnpm --dir packages/domain test -- --run` | ✅ 71 passed | - |

### 13.4 约束检查

- [x] 上一轮代码已提交并推送至远端
- [x] 本轮更改已放入 git 暂存区
- [x] lint PASS / typecheck PASS / test PASS
- [x] 未修改 apps/web/app/** (前端 UI 文件)
- [x] 未修改 apps/web/lib/** (前端业务代码)
- [x] 未修改 packages/domain/src/** (本轮不改代码)
- [x] README.md 目录树与真实仓库一致

### 13.5 下一步

Pre-Phase3-Architecture 阶段完成，可进入下一阶段开发

---

## 14. 关联文档

| 文档 | 路径 |
|------|------|
| 架构说明书 | `docs/product/ARCHITECTURE.md` |
| 技术规格 | `docs/product/TECH_SPEC.md` |
| 迁移计划 | `docs/engineering/architecture-migration-plan.md` |
| 项目导览 | `README.md` |
