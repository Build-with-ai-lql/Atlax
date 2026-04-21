# Phase 2.4 开发日志：Archive 闭环与结构化入库

日期: 2026-04-21

## 本阶段目标

1. 正式引入最小可用的 `Entry` 结构
2. archive 动作真正生成结构化 Entry，不再只是改 Inbox 状态
3. Entry 消费 userTags + suggestions，"用户选择优先于系统建议"在归档结果中真实成立
4. Entries 视图接入最小只读列表 + Entry 详情展示
5. 为 Phase 2.5 Database View 提供可读取的数据基础

## 约束与边界

| 约束 | 处理方式 |
|------|----------|
| 不接 LLM | 未引入任何 AI / LLM 依赖 |
| 不引入后端 | 所有数据流走前端 IndexedDB (Dexie) |
| 不实现完整 Review | 未涉及 |
| 不超前做 graph/tree | 未涉及 |
| 不破坏 domain platform-agnostic | archive-service.ts 纯逻辑，无 Dexie/浏览器依赖 |
| Dexie 留在 apps/web | db.ts / repository.ts 保持位置不变 |
| 不混杂 | domain 纯组装逻辑 / repository 数据层 / UI 组件三层分离 |

## 已完成变更

### 新增文件（3 个）

| 文件 | 说明 |
|------|------|
| `packages/domain/src/archive-service.ts` | Entry 组装逻辑：从 InboxEntry + suggestions + userTags 生成 Entry |
| `apps/web/app/workspace/_components/EntryListItem.tsx` | Entry 列表项组件 |
| `docs/engineering/dev_log/Phase2/phase-2.4-archive-entry.md` | 本开发日志 |

### 修改文件（8 个）

| 文件 | 变更 |
|------|------|
| `packages/domain/src/types.ts` | 新增 `EntryType`、`Entry`、`ArchiveInput` 类型 |
| `packages/domain/src/index.ts` | 导出 archive-service |
| `apps/web/lib/db.ts` | 新增 `entries` 表（v4 migration）+ `EntryRecord` / `PersistedEntry` 接口 |
| `apps/web/lib/repository.ts` | 改造 `archiveEntry` 为真正创建 Entry；新增 `listArchivedEntries`、`getEntryByInboxId` |
| `apps/web/lib/types.ts` | 导出 `Entry`、`EntryType`、`ArchiveInput` |
| `apps/web/app/workspace/page.tsx` | 新增 `archivedEntries` state；串联 Entries 数据流；wrapAction 后刷新 entries |
| `apps/web/app/workspace/_components/MainPanel.tsx` | Entries 视图展示 EntryListItem 列表；新增 `archivedEntries` / `selectedArchivedEntryId` props |
| `apps/web/app/workspace/_components/DetailPanel.tsx` | Entries 视图展示 Entry 详情（标题、内容、类型、标签、项目、动作） |

## Entry 数据建模

### Domain 层类型

```typescript
type EntryType = 'note' | 'meeting' | 'idea' | 'task' | 'reading'

interface Entry {
  id: number
  sourceInboxEntryId: number  // 关联原始 InboxEntry
  title: string               // 从 rawText 首行提取
  content: string             // 原始内容 rawText
  type: EntryType             // 从 suggestion category 映射
  tags: string[]              // resolveTags(suggested, userTags).final
  project: string | null      // 从 suggestion projects 提取
  actions: string[]           // 从 suggestion actions 提取
  createdAt: Date             // 原始 InboxEntry 创建时间
  archivedAt: Date            // 归档时间
}

interface ArchiveInput {
  inboxEntryId: number
  rawText: string
  suggestions: SuggestionItem[]
  userTags: string[]
  createdAt: Date
}
```

### 存储层结构

```typescript
// Dexie entries 表（v4 新增）
interface EntryRecord {
  id?: number                          // ++id 自增主键
  sourceInboxEntryId: number           // 关联 InboxEntry
  title: string
  content: string
  type: string
  tags: string[]
  project: string | null
  actions: string[]
  createdAt: Date
  archivedAt: Date
}
```

## Archive 组装逻辑

### buildEntryFromArchive（domain 层纯函数）

```typescript
function buildEntryFromArchive(input: ArchiveInput, assignedId: number): Entry
```

组装规则：

| 字段 | 来源 | 规则 |
|------|------|------|
| `title` | `rawText` | 首行截取，最多 60 字符 |
| `content` | `rawText` | 原始内容 |
| `type` | `suggestions` (category) | 匹配到的 category label，默认 'note' |
| `tags` | `userTags` + `suggestions` (tags) | resolveTags: 用户优先，补充未覆盖建议 |
| `project` | `suggestions` (projects) | 第一个匹配的 project，无则为 null |
| `actions` | `suggestions` (actions) | 所有匹配的 action labels |
| `createdAt` | `input.createdAt` | 原始创建时间 |
| `archivedAt` | `new Date()` | 归档时间 |

## 字段来源与冲突处理

### tags 字段

```
resolveTags(suggestedTagNames, userTags):
  1. 用户选择的 tag → 直接进入 final
  2. 系统建议的 tag → 与用户选择 lowercase 对比，未被覆盖的补充进 final
  3. 最终 dedupe
  → 用户选择优先，建议不覆盖用户意图
```

### type 字段

- 来自 suggestion category（如 meeting/task/idea/reading/note）
- 不受用户直接控制（当前阶段无 category 编辑器）
- 无 category suggestion 时默认 'note'

### project / actions 字段

- 直接从 suggestions 提取，当前阶段不受用户编辑
- 后续 Phase 可增加用户修正入口

## 防重复归档策略

```typescript
// archiveEntry 中的防重复逻辑
const existing = await getEntryByInboxId(id)
if (existing) {
  // 已有 Entry，只更新 InboxEntry 状态为 archived，不重复创建 Entry
  await inboxEntries.update(id, { status: 'archived', processedAt: new Date() })
  return
}
// 首次归档：创建 Entry + 更新 InboxEntry 状态
```

## 为 Phase 2.5 预留的内容

| 预留项 | 说明 |
|--------|------|
| `entries` 表 | Phase 2.5 可直接基于此表做 Database View |
| `entries` 索引 | `sourceInboxEntryId`, `type`, `archivedAt` 已建立索引 |
| `listArchivedEntries` | 可扩展为支持筛选、分页 |
| `getEntryByInboxId` | 后续恢复/反归档功能可使用 |
| Entries 视图框架 | MainPanel + DetailPanel 的 entries 分支已就位 |
| Entry 详情展示 | 标题、内容、类型、标签、项目、动作已展示 |

## 还没有做的内容

| 未做项 | 原因 |
|--------|------|
| Entry 编辑 | Phase 2.5+ 范围 |
| Entry 搜索/筛选 | Phase 2.5 范围 |
| Entry 删除 | 超出当前范围 |
| Entry 导出 Markdown | Phase 2.5+ 范围 |
| Review 完整功能 | Phase 2.5 范围 |
| Tag 筛选 Entry | Phase 2.5 范围 |
| Category 编辑器 | 超出当前范围 |

## 验证结果

| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors, 3 warnings（react-hooks/exhaustive-deps） |
| `pnpm typecheck` | ✅ 通过 |
| archive 创建 Entry | ✅ entries 表写入 |
| 防重复归档 | ✅ 已有 Entry 时不重复创建 |
| Entry 消费 userTags | ✅ resolveTags 用户优先 |
| Entry 消费 suggestions | ✅ category/project/actions 正确映射 |
| Entries 视图列表 | ✅ 展示归档 Entry 列表 |
| Entry 详情 | ✅ 标题/内容/类型/标签/项目/动作 |
| InboxEntry archive 状态 | ✅ 状态变 archived |
| 刷新持久化 | ✅ Dexie entries 表持久化 |

> **环境注**：本机 Node v24.14.0，项目声明 20.x，产生 engine warning，不影响代码正确性。

## 验收标准对照

| 验收标准 | 状态 |
|----------|------|
| archive 不再只是改 Inbox 状态，而是真正创建 Entry | ✅ |
| Entry 可稳定持久化 | ✅ Dexie entries 表 |
| Entry 正确消费 userTags 与 suggestions | ✅ buildEntryFromArchive |
| "用户选择优先于系统建议"在 archive 结果中真实成立 | ✅ resolveTags |
| 后续 Phase 2.5 可以直接基于 entries 表继续做 | ✅ 表+索引+查询函数已就位 |
| 不破坏当前 workspace 与 tag editor 体验 | ✅ Inbox 流程不变 |

---

## 补丁收口（2026-04-21）

### 修复：DetailPanel 丢失 client component 边界

**问题**：Phase 2.4 重写 DetailPanel 时，文件顶部的 `'use client'` 指令被意外移除。DetailPanel 包含交互按钮（onSuggest/onArchive/onIgnore/onRestore/onAddTag/onRemoveTag）和函数 props，在 Next.js app router 下，缺少 `'use client'` 会导致 Server Component 无法承载这些事件处理，运行时出错。

**修复**：恢复 `DetailPanel.tsx` 文件顶部的 `'use client'` 指令。

**为什么这是 blocker**：Next.js app router 中，默认组件为 Server Component。Server Component 不能使用 `onClick`、`useState` 等客户端特性，也不能接收函数类型的 props。DetailPanel 同时服务 Inbox 详情（含交互按钮）和 Entries 详情（含只读展示），缺少 `'use client'` 会让整个组件在运行时崩溃。

### 修改文件

| 文件 | 变更 |
|------|------|
| `apps/web/app/workspace/_components/DetailPanel.tsx` | 恢复 `'use client'` |

### 验证结果

| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors, 3 warnings（react-hooks/exhaustive-deps） |
| `pnpm typecheck` | ✅ 通过 |
| `pnpm build` | ✅ 7 pages generated，无 client/server 边界错误 |

---

## 新版 Phase 2 重新定位补丁（2026-04-21）

### 背景

新版 Phase 2 Demo Plan（`docs/engineering/dev_plan/phase2_demo_plan.md`）对 Phase 2 做了重新定位和拆分。本次补丁的目标是：基于新版文档完成一次 **Phase 2 重新定位 + Phase 2.4 补丁收口**，不直接进入 Phase 2.5。

### 新版 Phase 2 下的当前仓库定位

#### 已满足的能力（部分 2.3 / 2.4）

| 能力 | 对应新版子阶段 | 状态 |
|------|---------------|------|
| Dock 列表与状态流转（pending → suggested → archived） | 2.2 | ✅ 基础成立 |
| Suggestion Engine 规则驱动 | 2.3 | ✅ 基础成立 |
| Tag 手动添加/移除 | 2.3 | ✅ 基础成立 |
| Entry 结构化归档 | 2.4 | ✅ 基础成立 |
| Entries 只读列表 + 详情展示 | 2.4 | ✅ 基础成立 |
| archived → re-organize 最小闭环 | 2.4 | ✅ 本次补丁修复 |
| 再次归档时更新已有 Entry | 2.4 | ✅ 本次补丁修复 |

#### 仍未满足的能力

| 缺口 | 对应新版子阶段 | 说明 |
|------|---------------|------|
| 账号闭环（注册/登录/退出/会话保持） | 2.1 | 当前无任何账号系统，用户以匿名态使用 |
| 统一主工作区版式纠偏 | 2.1 | 当前输入区横跨模块的问题仍未修正 |
| 展开输入（长内容编辑器） | 2.2 | 当前只有 Quick Input Bar，无展开编辑器 |
| Browse / Review 完整筛选 | 2.5 | 当前 Entries 仅有基础列表，无筛选/分页 |
| Review 基础统计与健康信号 | 2.5 | Review 页面仍为占位空状态 |

#### 为什么当前不能直接进入 2.5

1. 新版 2.1 的账号闭环是 Phase 2 的基础要求，当前完全缺失
2. 新版 2.2 的展开输入（长内容编辑器）仍未并入 workspace 主线
3. 新版 2.4 的核心缺口（archived → re-organize + 再次归档更新 Entry）刚刚在本次补丁中修复，需要验证
4. 按新版文档要求，2.1 / 2.2 / 2.4 的核心能力应先闭环，再进入 2.5

### 本次补丁变更

#### 修改 1：状态机增加 archived → pending 迁移

**文件**：`packages/domain/src/state-machine.ts`

**问题**：当前状态机中 `archived` 状态没有任何合法迁移，已归档内容无法重新进入整理流程。

**修复**：将 `archived: []` 改为 `archived: ['pending']`，允许已归档内容回到 pending 状态（re-organize）。

**完整状态流**（对齐新版 Phase 2 文档要求）：

```
pending → suggested
pending → ignored
suggested → archived
suggested → ignored
ignored → pending
archived → pending    ← 新增
```

#### 修改 2：新增 reopenEntry 函数

**文件**：`apps/web/lib/repository.ts`

**问题**：已归档内容需要重新进入整理流程，但原有 `restoreEntry` 会清除 suggestions（适用于 ignored → pending），而 re-organize 场景应保留已有 suggestions 供用户参考。

**修复**：新增 `reopenEntry(id)` 函数，将 InboxEntry 状态从 `archived` 回到 `pending`，但不清除 suggestions。与 `restoreEntry`（ignored → pending，清除 suggestions）形成区分。

#### 修改 3：archiveEntry 再次归档时更新已有 Entry

**文件**：`apps/web/lib/repository.ts`

**问题**：原有 `archiveEntry()` 检测到已有 Entry 时，只更新 Inbox 状态为 archived，不重建/更新 Entry。一旦实现 re-organize，再次归档会保留旧的 title/type/tags/project/actions，导致结构化层过期。

**修复**：
- 将 `buildEntryFromArchive` 调用提前到重复检测之前，始终基于当前 rawText / suggestions / userTags 重新组装
- 检测到已有 Entry 时，用新组装结果更新既有 Entry（保持同一个 Entry identity）
- 不再创建新的 Entry 记录，避免重复

**更新规则**：

| 字段 | 更新规则 |
|------|----------|
| `title` | 从 rawText 首行重新提取 |
| `content` | 从 rawText 同步 |
| `type` | 从 suggestions category 重新映射 |
| `tags` | resolveTags(userTags + suggestedTags) 重新计算 |
| `project` | 从 suggestions projects 重新提取 |
| `actions` | 从 suggestions actions 重新提取 |
| `archivedAt` | 更新为当前时间 |

#### 修改 4：Entries 详情面板增加"重新整理"按钮

**文件**：
- `apps/web/app/workspace/_components/DetailPanel.tsx`
- `apps/web/app/workspace/page.tsx`

**问题**：Entries 视图的 DetailPanel 只有只读展示，没有"重新整理"入口。

**修复**：
- DetailPanel 新增 `onReopen` prop 和"重新整理"按钮
- page.tsx 新增 `handleReopen` 处理函数
- 点击"重新整理"后：InboxEntry 状态回到 pending → 自动切换到 Inbox 视图 → 选中该条目 → 用户可继续建议/修正/归档

### 完整主线闭环验证路径

```
1. 用户输入内容 → InboxEntry (pending)
2. 生成建议 → InboxEntry (suggested)
3. 接受归档 → InboxEntry (archived) + Entry 创建
4. 在 Entries 视图找到该 Entry
5. 点击"重新整理" → InboxEntry (pending)，自动回到 Inbox 视图
6. 用户可修改 tags / 重新生成建议
7. 再次归档 → InboxEntry (archived) + Entry 更新（而非创建新 Entry）
8. Entry 内容与最新 suggestions / userTags 同步
```

### 本轮不做的内容（明确记录）

| 不做项 | 原因 |
|--------|------|
| 完整 Phase 2.5 Browse/Review | 不在本轮范围 |
| 完整筛选系统 | Phase 2.5 |
| 接入 LLM | 不在 Phase 2 范围 |
| 引入后端 | 不在 Phase 2 范围 |
| 完整账号系统 | Phase 2.1 范围，本轮仅记录缺口 |
| 完整展开编辑器 | Phase 2.2 范围，本轮仅记录缺口 |

### 修改文件清单

| 文件 | 变更 |
|------|------|
| `packages/domain/src/state-machine.ts` | `archived: []` → `archived: ['pending']` |
| `apps/web/lib/repository.ts` | 新增 `reopenEntry`；`archiveEntry` 再次归档时更新已有 Entry |
| `apps/web/app/workspace/page.tsx` | 新增 `handleReopen`；传递 `onReopen` 给 DetailPanel |
| `apps/web/app/workspace/_components/DetailPanel.tsx` | 新增 `onReopen` prop 和"重新整理"按钮 |
| `docs/engineering/dev_log/Phase2/phase-2.4-archive-entry.md` | 新增"新版 Phase 2 重新定位"章节 |

---

## Phase 2.1 + 2.2 补齐（2026-04-21）

### 背景

上一轮补丁完成了 Phase 2.4 的 archived → re-organize 闭环和再次归档更新 Entry。但按新版 Phase 2 文档，2.1（账号闭环 + 版式纠偏）和 2.2（展开输入 + Capture 主线统一）仍是前置缺口。

本轮聚焦切片：**补齐新版 Phase 2.1 + 2.2 的最小成立版本**。

### 补齐的缺口

#### 缺口 1：账号闭环（Phase 2.1）

**问题**：当前无任何账号系统，用户以匿名态使用，刷新后无法识别身份。

**实现**：

1. 新增 `apps/web/lib/auth.ts` — 最小本地身份方案
   - `LocalUser` 类型：`{ id, name, createdAt }`
   - `getCurrentUser()`：从 localStorage 读取
   - `registerUser(name)`：创建用户并存入 localStorage
   - `loginUser(name)`：登录（当前 Demo 阶段与注册等价）
   - `logoutUser()`：清除 localStorage 中的用户信息

2. 新增 `AuthGate` 组件 — 登录/注册界面
   - 未登录时显示登录/注册表单
   - 登录后进入 workspace

3. Sidebar 增加用户信息与退出按钮
   - 底部显示用户头像（首字母）和用户名
   - 退出按钮清除身份并回到 AuthGate

4. page.tsx 整合 AuthGate
   - `user` state 管理当前用户
   - `authChecked` 避免闪烁
   - 未登录 → AuthGate；已登录 → Workspace

**账号状态建模与持久化**：

| 层面 | 实现 |
|------|------|
| 身份模型 | `LocalUser { id, name, createdAt }` |
| 持久化 | `localStorage` key `atlax_current_user` |
| 会话保持 | 页面加载时 `getCurrentUser()` 检查 localStorage |
| 退出 | `logoutUser()` 清除 localStorage |
| 后续可替换 | auth.ts 是独立模块，后续可替换为服务端认证 |

**当前阶段的设计边界**：

- 登录与注册在 Demo 阶段等价（本地身份，无密码验证）
- 用户身份与内容归属的最小绑定：当前所有内容属于当前登录用户
- 后续接入服务端认证时，只需替换 auth.ts 的实现，不影响 UI 层

#### 缺口 2：workspace 版式纠偏（Phase 2.1）

**问题**：原 QuickInputBar 在整个右半区底部，横跨 MainPanel + DetailPanel 两个模块，破坏左中右工作台结构的阅读边界。

**修复**：

1. QuickInputBar 从 page.tsx 底部移入 MainPanel 内部
   - 仅在 Inbox 视图时显示
   - 宽度限制在 MainPanel（360px）内
   - 不再横跨两个模块

2. page.tsx 布局结构调整为：
   ```
   Sidebar(56) | MainPanel(360) + QuickInputBar | DetailPanel(flex-1)
   ```
   - 输入区只在 MainPanel 底部
   - 列表区、详情区、输入区边界清晰
   - 用户一眼能看懂"哪里输入、哪里看列表、哪里看详情"

3. 错误提示改为 absolute 定位，不破坏布局流

#### 缺口 3：展开输入（Phase 2.2）

**问题**：当前只有 QuickInputBar（单行输入），无法输入明显超过短输入框容量的长内容。

**实现**：

1. 新增 `ExpandedEditor` 组件 — Modal 形式的展开编辑器
   - 大 textarea（可 resize，默认 256px 高度）
   - 字数统计
   - Esc 关闭 / 按钮取消 / 保存到 Inbox
   - 提交后走同一条 `handleCapture` → `createInboxEntry` 路径

2. QuickInputBar 增加展开按钮
   - 新增 `onExpand` prop
   - 展开图标按钮（expand icon）
   - 点击后打开 ExpandedEditor

#### 缺口 4：Capture 主线统一（Phase 2.2）

**问题**：需要确保快速输入与展开输入属于同一条 Capture 主线。

**实现**：

- QuickInputBar 的 `onSubmit` 和 ExpandedEditor 的 `onSubmit` 都指向同一个 `handleCapture`
- `handleCapture` 调用 `createInboxEntry(text)`
- 两种输入的内容进入同一个 Inbox / Dock
- 后续 Suggest / Tag / Archive 流程完全一致
- 不存在两套割裂的 capture 系统

### 新增文件

| 文件 | 说明 |
|------|------|
| `apps/web/lib/auth.ts` | 最小本地身份方案（LocalUser + localStorage） |
| `apps/web/app/workspace/_components/AuthGate.tsx` | 登录/注册界面 |
| `apps/web/app/workspace/_components/ExpandedEditor.tsx` | 展开编辑器（Modal 形式） |

### 修改文件

| 文件 | 变更 |
|------|------|
| `apps/web/app/workspace/_components/QuickInputBar.tsx` | 新增 `onExpand` prop 和展开按钮 |
| `apps/web/app/workspace/_components/Sidebar.tsx` | 新增 `user` / `onLogout` props；底部用户信息 + 退出按钮 |
| `apps/web/app/workspace/_components/MainPanel.tsx` | 内嵌 QuickInputBar（Inbox 视图底部）；新增 `onCapture` / `onExpandEditor` props |
| `apps/web/app/workspace/page.tsx` | 整合 AuthGate + ExpandedEditor；版式纠偏（QuickInputBar 移入 MainPanel）；用户状态管理 |

### 当前仓库定位（更新后）

| 子阶段 | 状态 | 说明 |
|--------|------|------|
| **2.1 账号 + 版式** | ✅ 最小成立 | 本地身份 + 版式纠偏完成 |
| **2.2 双形态输入** | ✅ 最小成立 | QuickInput + ExpandedEditor + Capture 统一 |
| **2.3 Suggestion + Tag** | ✅ 基础成立 | 规则引擎 + Tag 手动编辑可用 |
| **2.4 Archive + Re-organize** | ✅ 基础成立 | archived → pending + 再次归档更新 Entry |
| **2.5 Browse / Review** | ❌ 未开始 | 仅有基础列表，无筛选 |

### 仍然没有做的内容

| 未做项 | 原因 |
|--------|------|
| 完整 Phase 2.5 Browse/Review | 不在本轮范围 |
| 完整筛选系统 | Phase 2.5 |
| 接入 LLM | 不在 Phase 2 范围 |
| 引入后端 | 不在 Phase 2 范围 |
| 服务端认证 | Demo 阶段使用本地身份，后续可替换 |
| 富文本编辑器 | Phase 3 范围，当前展开编辑器为基础 textarea |
| 用户内容与身份的数据库级绑定 | ✅ 本次补丁修复：userId 已加入 InboxEntry/Entry/Tag，repository 按 userId 隔离 |
| 多登录方式扩展 | Phase 5 范围 |
| 云同步 | Phase 5 范围 |

---

## Tag 用户隔离补丁（2026-04-21）

### 背景

上一轮完成了 userId 加入数据层和 repository 按 userId 隔离。但 Tag 这层仍有一个 P1：

- `createStoredTag()` / `getOrCreateTag()` 通过 `tagsTable.get(tag.id)` 全局查找
- `tag.id` 由 `makeTagId(name)` 生成，只基于 normalized name 的 hash，不含 userId
- 用户 A 和用户 B 创建同名 tag（如 "idea"），会得到相同的 `tag.id`
- `tagsTable.get(tag.id)` 会命中另一个用户的 tag 记录，导致跨用户串用

### 修复

#### 修复 1：tag id 改为用户维度唯一

**文件**：`apps/web/lib/repository.ts`

- 新增 `makeUserScopedTagId(userId, name)`：生成 `${userId}_${makeTagId(name)}` 格式的 id
- 不同用户创建同名 tag 时，得到不同的 id
- `domain/tag-service.ts` 的 `makeTagId(name)` 保持不变（platform-agnostic）

#### 修复 2：tag 查找改为按 userId + normalizedName

**文件**：`apps/web/lib/repository.ts`

- 新增 `findTagByName(userId, name)`：通过 `tagsTable.where('userId').equals(userId).and(...)` 按 normalizedName 查找
- `createStoredTag(userId, name)`：用 `findTagByName` 替代 `tagsTable.get(tag.id)`
- `getOrCreateTag(userId, name)`：用 `findTagByName` 替代 `tagsTable.get(tag.id)`
- 不再依赖全局 tag.id 查找

#### 修复 3：Dexie v6 migration

**文件**：`apps/web/lib/db.ts`

- tags 表新增 `[userId+name]` 复合索引
- v6 upgrade：旧 tag 的 id 加上 userId 前缀（`${userId}_${oldId}`），确保主键唯一

### 为什么同名 tag across users 不再冲突

| 层面 | 修复前 | 修复后 |
|------|--------|--------|
| tag id | `tag:abc123`（仅由 name 决定） | `user_xxx_tag:abc123`（由 userId + name 决定） |
| 查找方式 | `tagsTable.get(tag.id)` 全局查找 | `findTagByName(userId, name)` 按 userId 过滤 |
| A 创建 "idea" | id = `tag:xyz` | id = `user_A_tag:xyz` |
| B 创建 "idea" | 复用 A 的记录（BUG） | id = `user_B_tag:xyz`，独立记录 |

### 修改文件清单

| 文件 | 变更 |
|------|------|
| `apps/web/lib/db.ts` | v6 migration：tags 表新增 `[userId+name]` 复合索引；旧 tag id 加 userId 前缀 |
| `apps/web/lib/repository.ts` | 新增 `findTagByName` / `makeUserScopedTagId`；`createStoredTag` / `getOrCreateTag` 改为按 userId 隔离查找 |

### 历史验证结果校正

之前的日志中记录 `pnpm lint` 为 "0 errors, 0 warnings"，实际本地始终存在 `react-hooks/exhaustive-deps` warnings。以下为校正后的真实验证结果：

| 检查项 | 真实结果 |
|--------|----------|
| `pnpm lint`（Phase 2.4 初始） | ✅ 0 errors, 3 warnings（react-hooks/exhaustive-deps，下同） |
| `pnpm lint`（Phase 2.1+2.2 补齐） | ✅ 0 errors, 3 warnings |
| `pnpm lint`（账号身份绑定补丁） | ✅ 0 errors, 3 warnings |
| `pnpm lint`（Tag 隔离补丁） | 待验证，见下方 |

warnings 来源：
- `apps/web/app/inbox/page.tsx:26` — useEffect missing dep `loadEntries`
- `apps/web/app/inbox/page.tsx:82` — useCallback missing dep `refreshList`
- `apps/web/app/workspace/page.tsx:55` — useEffect missing dep `loadEntries`

这些 warnings 存在于旧页面（inbox）和 workspace 主页面，是 useEffect/useCallback 的依赖数组未包含函数引用。当前阶段不修复，因为这些函数每次渲染都会重新创建，加入依赖会导致无限循环，需要用 useCallback 包裹或提取到 ref 才能正确修复。记录在此，后续 Phase Quality 阶段统一处理。

---

## Phase 2.1 账号身份与内容归属绑定补丁（2026-04-21）

### 背景

上一轮完成了账号入口、版式纠偏、展开输入和 Capture 主线统一。但账号闭环仍未真正成立：

1. 数据层没有 userId，内容没有绑定到用户身份
2. repository 仍然全局读写
3. loginUser() 每次都会新建随机身份，不是登录已有 workspace

本轮修复：**让账号身份与内容归属真正绑定**。

### 修复的阻塞问题

#### 问题 1：数据层没有 userId

**修复**：db.ts v5 migration

- `InboxEntryRecord` 新增 `userId: string`
- `EntryRecord` 新增 `userId: string`
- `TagRecord` 新增 `userId: string`
- Dexie v5 migration：三张表新增 `userId` 索引，旧数据 backfill 为 `'_legacy'`
- 新创建的记录由 repository 层写入当前用户的 userId

#### 问题 2：repository 全局读写

**修复**：repository 所有读写函数增加 `userId` 参数

| 函数 | 变更 |
|------|------|
| `createInboxEntry(userId, rawText, sourceType)` | 写入 userId |
| `listInboxEntries(userId)` | `where('userId').equals(userId)` |
| `listEntriesByStatus(userId, status)` | 先按 userId 过滤，再按 status 过滤 |
| `countInboxEntries(userId)` | 按 userId 计数 |
| `listArchivedEntries(userId)` | `where('userId').equals(userId)` |
| `getEntryByInboxId(userId, inboxEntryId)` | 按 userId + sourceInboxEntryId 查询 |
| `archiveEntry(userId, id)` | 创建 Entry 时写入 userId；查询已有 Entry 时按 userId 隔离 |
| `listTags(userId)` | `where('userId').equals(userId)` |
| `createStoredTag(userId, name)` | 写入 userId |

**不修改的函数**（按 id 直接操作，无需 userId 过滤）：

- `suggestEntry(id)` — 通过 id 直接定位
- `ignoreEntry(id)` — 通过 id 直接定位
- `restoreEntry(id)` — 通过 id 直接定位
- `reopenEntry(id)` — 通过 id 直接定位
- `addTagToEntry(id, tagName)` — 通过 id 直接定位
- `removeTagFromEntry(id, tagName)` — 通过 id 直接定位

这些函数操作的是已在列表中选中的条目，其 userId 隔离已在列表加载时完成。

#### 问题 3：loginUser 每次创建新身份

**修复**：auth.ts 改为本地用户目录

- 新增 `USER_DIRECTORY_KEY = 'atlax_user_directory'` — localStorage 存储所有已注册用户
- `registerUser(name)` — 创建新用户，加入目录，设为当前用户（如用户名已存在则直接登录）
- `loginUser(name)` — 在目录中查找已有用户，找到则设为当前用户，找不到返回 null
- `loginByUserId(userId)` — 按 id 登录已有用户
- `listLocalUsers()` — 返回所有已注册用户列表
- `logoutUser()` — 只清除当前用户，不清除目录

#### 问题 4：AuthGate 登录体验

**修复**：AuthGate 改为显示已有用户列表

- 登录模式：显示已注册用户列表，点击即可进入对应 workspace
- 也可输入用户名登录
- 注册模式：创建新用户
- 无已有用户时自动切到注册模式
- 登录失败时显示"用户不存在，请先注册"

### userId 加入数据层的方式

| 层面 | 实现 |
|------|------|
| 数据模型 | InboxEntryRecord / EntryRecord / TagRecord 均新增 `userId: string` |
| Dexie 索引 | v5 migration 新增 `userId` 索引到三张表 |
| 旧数据迁移 | backfill 为 `'_legacy'`，不属于任何真实用户 |
| 新数据写入 | repository 函数接收 userId 参数，写入记录时包含 |
| 查询过滤 | list/count 函数按 `where('userId').equals(userId)` 过滤 |

### repository 按 userId 隔离的方式

- 所有 list/count 函数：`where('userId').equals(userId)` 作为首要过滤条件
- `createInboxEntry` / `createStoredTag` / `archiveEntry`（创建 Entry）：写入时包含 userId
- `getEntryByInboxId`：同时按 userId + sourceInboxEntryId 查询，防止跨用户访问
- 按 id 直接操作的函数（suggest/ignore/restore/reopen/addTag/removeTag）：不额外过滤，因为条目已在 userId 隔离的列表中选中

### register/login/logout 最终语义

| 操作 | 语义 | 行为 |
|------|------|------|
| `registerUser(name)` | 注册新用户 | 在目录中查找同名用户（case-insensitive），如已存在则直接登录；否则创建新用户，加入目录，设为当前用户 |
| `loginUser(name)` | 登录已有用户 | 在目录中查找同名用户（case-insensitive），找到则设为当前用户并返回，找不到返回 null |
| `loginByUserId(userId)` | 按 id 登录 | 在目录中查找对应 id 的用户，找到则设为当前用户并返回 |
| `logoutUser()` | 退出 | 清除当前用户（localStorage `atlax_current_user`），保留用户目录 |
| `getCurrentUser()` | 获取当前用户 | 从 localStorage 读取当前用户 |
| `listLocalUsers()` | 列出所有本地用户 | 从 localStorage 读取用户目录 |

### A/B 用户 workspace 隔离验证路径

1. 注册用户 A（如 "Alice"），创建若干 Inbox 数据
2. 退出登录
3. 注册用户 B（如 "Bob"），看到空 workspace（或 Bob 自己的数据）
4. 退出登录
5. 在登录界面点击 Alice，回到 Alice 的 workspace，看到 Alice 之前的数据
6. 两个用户的数据在 IndexedDB 中通过 userId 字段隔离
7. 旧数据（v4 及之前创建）标记为 `userId = '_legacy'`，不属于任何真实用户

### 修改文件清单

| 文件 | 变更 |
|------|------|
| `apps/web/lib/db.ts` | v5 migration：InboxEntry/Entry/Tag 新增 userId 字段和索引；旧数据 backfill `'_legacy'` |
| `apps/web/lib/repository.ts` | 所有 list/count/create 函数增加 userId 参数；查询按 userId 过滤 |
| `apps/web/lib/auth.ts` | 新增本地用户目录；register/login 语义区分；loginByUserId |
| `apps/web/app/workspace/_components/AuthGate.tsx` | 显示已有用户列表；登录/注册模式区分 |
| `apps/web/app/workspace/page.tsx` | 所有 repository 调用传入 userId |
| `docs/engineering/dev_log/Phase2/phase-2.4-archive-entry.md` | 新增"账号身份与内容归属绑定"章节 |

### 当前仓库定位（更新后）

| 子阶段 | 状态 | 说明 |
|--------|------|------|
| **2.1 账号 + 版式** | ✅ 真正成立 | 本地身份 + 版式纠偏 + userId 隔离 + register/login 区分 |
| **2.2 双形态输入** | ✅ 最小成立 | QuickInput + ExpandedEditor + Capture 统一 |
| **2.3 Suggestion + Tag** | ✅ 基础成立 | 规则引擎 + Tag 手动编辑可用 |
| **2.4 Archive + Re-organize** | ✅ 基础成立 | archived → pending + 再次归档更新 Entry |
| **2.5 Browse / Review** | ❌ 未开始 | 仅有基础列表，无筛选 |

### 仍然没有做的内容

| 未做项 | 原因 |
|--------|------|
| 完整 Phase 2.5 Browse/Review | 不在本轮范围 |
| 完整筛选系统 | Phase 2.5 |
| 接入 LLM | 不在 Phase 2 范围 |
| 引入后端 | 不在 Phase 2 范围 |
| 服务端认证 | Demo 阶段使用本地身份，后续可替换 |
| 富文本编辑器 | Phase 3 范围 |
| 旧数据 `_legacy` 归属修复 | 可在后续手动清理或提供迁移入口 |
| 多登录方式扩展 | Phase 5 范围 |
| 云同步 | Phase 5 范围 |
