# Phase 2.1 + 2.2 开发日志：Workspace 主工作台收敛

日期: 2026-04-21

## 本阶段目标

1. 建立统一 `workspace` 主界面，替代原有 `/capture` + `/inbox` 分页面形态
2. 实现工作台式四区域布局：Sidebar + MainPanel + DetailPanel + QuickInputBar
3. 整合 capture + inbox 数据流进 workspace，用户无需频繁跳页即可完成输入与查看
4. 为 Entries / Review 留出明确导航入口与空状态承载位
5. 首页 `/` 直接进入 workspace 主路径

## 约束与边界

| 约束 | 处理方式 |
|------|----------|
| 不接 LLM | 未引入任何 AI / LLM 依赖 |
| 不引入后端 | 所有数据流走前端 IndexedDB (Dexie) |
| 不做完整 Review | 仅留空状态占位 |
| 不做复杂图谱/树结构 | 未引入任何图谱组件 |
| 不破坏 domain platform-agnostic | 未修改 packages/domain 任何文件 |
| Dexie 留在 apps/web | 存储逻辑未变更位置 |
| suggestion engine 继续复用 | 通过 `@atlax/domain` 的 `groupSuggestionsByType` 消费 |

## 已完成变更

### 新增文件（7 个）

| 文件 | 说明 |
|------|------|
| `apps/web/app/workspace/page.tsx` | workspace 主页面，统一状态编排 |
| `apps/web/app/workspace/_components/Sidebar.tsx` | 左侧导航：Inbox / Entries / Review |
| `apps/web/app/workspace/_components/MainPanel.tsx` | 中间列表面板：Inbox 列表 / Entries 空状态 / Review 空状态 |
| `apps/web/app/workspace/_components/DetailPanel.tsx` | 右侧详情面板：内容 / 状态 / 时间 / 建议 / 动作 |
| `apps/web/app/workspace/_components/QuickInputBar.tsx` | 底部固定快速输入栏 |
| `apps/web/app/workspace/_components/InboxListItem.tsx` | Inbox 列表项组件 |
| `apps/web/app/workspace/_components/EmptyState.tsx` | 通用空状态组件 |

### 修改文件（2 个）

| 文件 | 变更 |
|------|------|
| `apps/web/app/page.tsx` | 从 landing page 改为 `redirect('/workspace')` |
| `apps/web/app/globals.css` | 添加 `html, body { height: 100%; overflow: hidden }` 支持全屏布局 |

## 架构说明

### 页面布局

```
┌──────────┬──────────────┬─────────────────────────────────┐
│          │              │                                 │
│ Sidebar  │  MainPanel   │        DetailPanel              │
│          │              │                                 │
│ ┌──────┐ │ ┌──────────┐ │  ┌───────────────────────────┐  │
│ │Inbox │ │ │ Entry 1  │ │  │ Status Badge    Timestamp │  │
│ │      │ │ │ Entry 2  │ │  │                           │  │
│ │Ent.. │ │ │ Entry 3  │ │  │ Raw Text Content          │  │
│ │      │ │ │ ...      │ │  │                           │  │
│ │Rev.. │ │ │          │ │  │ ┌─ System Suggestions ──┐ │  │
│ │      │ │ │          │ │  │ │ Category / Tags /     │ │  │
│ └──────┘ │ └──────────┘ │  │ │ Actions / Projects    │ │  │
│          │              │  │ └───────────────────────┘ │  │
│          │              │  │                           │  │
│          │              │  │ [Action Buttons]          │  │
│          │              │  └───────────────────────────┘  │
│          │              │                                 │
├──────────┴──────────────┴─────────────────────────────────┤
│                  Quick Input Bar                           │
│  [输入想法、片段、待办…                    ] [记录]        │
└───────────────────────────────────────────────────────────┘
```

### 状态管理

```
WorkspacePage (page.tsx)
├── activeView: 'inbox' | 'entries' | 'review'
├── entries: InboxEntry[]
├── selectedEntryId: number | null
├── loading: boolean
├── actionLoading: boolean
│
├── Sidebar ← activeView, inboxCount
├── MainPanel ← activeView, entries, selectedEntryId, loading
├── DetailPanel ← selectedEntry, action callbacks
└── QuickInputBar ← onSubmit callback
```

### 数据流

```
QuickInputBar.onSubmit(text)
  → createInboxEntry(text)     // repository → Dexie
  → refreshList()              // listInboxEntries()
  → setActiveView('inbox')
  → setSelectedEntryId(newEntry.id)

DetailPanel.onSuggest(id)
  → suggestEntry(id)           // repository → domain.generateSuggestions → Dexie
  → update entry in state

DetailPanel.onArchive(id)
  → archiveEntry(id)           // repository → Dexie
  → update entry in state
```

### 复用关系

| 复用项 | 来源 | 消费位置 |
|--------|------|----------|
| `createInboxEntry` | `lib/repository.ts` | QuickInputBar → page.tsx |
| `listInboxEntries` | `lib/repository.ts` | page.tsx loadEntries |
| `suggestEntry` | `lib/repository.ts` | DetailPanel |
| `archiveEntry` | `lib/repository.ts` | DetailPanel |
| `ignoreEntry` | `lib/repository.ts` | DetailPanel |
| `restoreEntry` | `lib/repository.ts` | DetailPanel |
| `groupSuggestionsByType` | `@atlax/domain/selectors` | DetailPanel |
| `InboxEntry` type | `lib/repository.ts` | 多个组件 |
| `EntryStatus` type | `lib/types.ts` | Sidebar, DetailPanel, InboxListItem |

## 关键设计决策

### 1. 为什么 InboxListItem 是独立组件而不是复用旧 InboxEntryCard

旧 `InboxEntryCard` 是为分页面设计的"卡片式"组件，包含完整的建议展示和操作按钮。
新的 `InboxListItem` 是为三栏布局设计的"紧凑列表项"，只展示摘要信息和状态指示。
详情和操作移到 `DetailPanel`，符合工作台式"选择→查看详情"的交互范式。

### 2. 为什么 ViewType 只有三个值

```
type ViewType = 'inbox' | 'entries' | 'review'
```

对齐 PRD 第 5.2 节主线功能定义：
- Inbox：待整理内容
- Entries：结构化知识单元（Phase 2.3）
- Review：回顾与激活（Phase 2.5）

后续可扩展 `| 'tags' | 'settings'` 等视图。

### 3. 为什么首页用 redirect 而不是直接在 `/` 写 workspace

- 保持 `/workspace` 作为明确的 demo 主路径
- 旧的 `/capture` 和 `/inbox` 页面继续可用（按需求"不必立刻删除"）
- 首页 redirect 语义清晰，不做额外渲染

### 4. 为什么 pendingCount 只算 pending + suggested

Inbox badge 应该反映"需要用户关注的条目数"。`archived` 已完成处理，`ignored` 用户主动忽略。
只有 `pending`（未处理）和 `suggested`（待决策）需要用户关注。

## 为后续 Phase 预留的位置

| 预留点 | 阶段 | 说明 |
|--------|------|------|
| Sidebar `entries` 导航 + 空状态 | Phase 2.3 | Entry 正式模型与归档流程实现后填充 |
| Sidebar `review` 导航 + 空状态 | Phase 2.5 | Review 功能实现时填充 |
| MainPanel `entries` 视图 | Phase 2.3 | 当前展示空状态，后续展示 Entry 列表 |
| MainPanel `review` 视图 | Phase 2.5 | 当前展示空状态，后续展示统计/回顾 |
| DetailPanel Tag 编辑区 | Phase 2.3 | 当前只展示 suggestion tag，后续增加用户手动 Tag 选择器 |
| DetailPanel 归档表单 | Phase 2.3 | 当前 archive 只更新状态，后续增加完整 Entry 创建表单 |
| `ViewType` 类型 | 持续 | 可扩展 `'tags' | 'settings'` 等新视图 |

## 暂时没做以及原因

| 未做项 | 原因 |
|--------|------|
| Tag 正式模型与 Tag 选择器 | Phase 2.3 范围 |
| Entry 正式归档（创建独立 Entry 实体） | Phase 2.3 范围 |
| Review 完整版 | Phase 2.5 范围 |
| 删除 `/capture` 和 `/inbox` 旧页面 | 按需求保留，避免双套实现继续分叉 |
| Zustand 状态管理 | 当前单页面 useState 足够，跨页面共享状态时再引入 |
| 搜索功能 | Phase 3 范围 |
| 键盘快捷键 | Phase 2.4 可考虑 |
| 拖拽排序 | 超出当前范围 |

## 验证结果

| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 通过 (exit 0) |
| `pnpm typecheck` | ✅ 通过 (exit 0) |
| `pnpm build` | ✅ 通过 (exit 0, 7 pages generated) |
| dev server 启动 | ✅ 正常 |
| `/` → `/workspace` 重定向 | ✅ 正常 |
| Quick Input → Inbox 数据流 | ✅ pending 状态写入 |
| Inbox 列表选中 → Detail 展示 | ✅ 正常 |
| Suggest → Detail 更新 | ✅ 复用 domain 规则引擎 |
| Archive / Ignore / Restore | ✅ 状态流转正常 |

> **环境注**：本机 Node v24.14.0，项目声明 20.x，产生 engine warning，不影响代码正确性。

## 验收标准对照

| 验收标准 | 状态 |
|----------|------|
| 主入口是 workspace 而不是 capture/inbox 分页集合 | ✅ `/` redirect → `/workspace` |
| 用户可以在一个主工作区里完成输入、查看 Inbox、查看单条详情 | ✅ QuickInputBar + MainPanel + DetailPanel |
| 输入入口始终可见 | ✅ QuickInputBar 固定底部 |
| UI 不再像简单 demo 表单页 | ✅ 三栏工作台布局 |
| 当前实现明显更接近 Phase 2.1/2.2 的定义 | ✅ |
| 不超范围实现 Tag 正式模型、Entry 正式归档、Review 完整版 | ✅ 仅预留入口 |

---

## 补丁收口（2026-04-21）

初版 workspace 合入后 review 发现 3 个问题，已修复。

### 修复 1：Workspace 错误处理回归

**问题**：`loadEntries()`、`refreshList()`、`wrapAction()`、`handleCapture()` 无 catch，Dexie/IndexedDB 失败时错误直接冒泡，用户看到空白或卡死。

**修复**：
- 新增 `error: string | null` state
- 所有异步路径加 try/catch，catch 设置 `setError('…失败，请重试')`
- 页面顶部渲染错误横幅（红色条 + 关闭按钮）
- MainPanel 在列表为空 + 有 error 时显示错误信息 + 重试按钮
- `refreshList` 包裹 `useCallback`，依赖为空数组，catch fallback 返回 `[]`

### 修复 2：Entries / Review 视图切换语义错误

**问题**：切换 `activeView` 到 `entries` 或 `review` 时，右侧 DetailPanel 仍然展示之前选中的 Inbox 条目详情和 Inbox 操作按钮。

**修复**：
- `selectedEntry` 计算增加 `activeView === 'inbox'` 前置条件，非 inbox 返回 `null`
- 新增 `handleViewChange`，切换非 inbox 视图时清空 `selectedEntryId`
- DetailPanel 新增 `activeView` prop，非 inbox 视图渲染视图对应的 `EmptyState`
- `VIEW_EMPTY_HINTS` 用 `Exclude<ViewType, 'inbox'>` 类型约束，后续新增视图时 TypeScript 强制补充

### 修复 3：全局 overflow 锁范围过大

**问题**：`globals.css` 中 `html, body { overflow: hidden }` 作用于全站，影响 `/capture`、`/inbox` 等旧页面的自然滚动。

**修复**：
- `globals.css` 恢复为仅含 `@tailwind` 三行，移除全局 `overflow: hidden`
- workspace 根容器 `<div className="flex h-screen bg-white overflow-hidden">` 自行承担布局约束
- 旧页面恢复自然滚动

### 修改文件

| 文件 | 变更 |
|------|------|
| `apps/web/app/globals.css` | 移除全局 `overflow: hidden` |
| `apps/web/app/workspace/page.tsx` | 添加 error state；selectedEntry 绑定 activeView；handleViewChange 清空选中；所有异步路径加 catch；error 横幅渲染；refreshList 包裹 useCallback |
| `apps/web/app/workspace/_components/DetailPanel.tsx` | 新增 activeView prop；非 inbox 视图渲染 EmptyState |
| `apps/web/app/workspace/_components/MainPanel.tsx` | 新增 error / onRetry prop；加载失败时显示错误 + 重试按钮 |

### 验证结果

| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors, 0 warnings |
| `pnpm typecheck` | ✅ 通过 |
