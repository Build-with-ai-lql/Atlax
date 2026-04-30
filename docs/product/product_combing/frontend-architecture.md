# Frontend Architecture

> 基于代码仓库真实内容分析，不包含推测性内容。

---

## Pages / Routes

系统使用 Next.js App Router，共 **6 个路由**，根布局在 [app/layout.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/layout.tsx)，强制暗色模式 `className="dark"`，全局背景 `bg-[#030508]`。

### `/` — 着陆页（[app/page.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/page.tsx)）
- 品牌展示（ATLAX / MindDock）
- 检测本地用户：`getCurrentUser()` 判断是否已有用户，显示"欢迎回来"或默认文案
- 点击"进入工作区"触发圆形扩散渐入动画后 `router.push('/workspace')`
- 两个模糊渐变球体作为背景装饰

### `/workspace` — 工作区主页面（[app/workspace/page.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/page.tsx)）
- 应用核心页面，约 1770 行，集成了全部功能模块
- 通过 `activeModule` 状态在 `home` / `mind` / `dock` / `editor` 四个模块间切换
- 内置 Tab 管理系统（`WorkspaceTabs`），支持打开、关闭、Pin 编辑器标签页
- 内置本地用户认证（`AuthGate` 组件，基于 [auth.ts](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/lib/auth.ts)）
- 内置浮动 AI 对话面板（`FloatingChatPanel`）、快速笔记（`QuickNote`）、浮动录制器（`FloatingRecorder`）
- 内联 `DockFinderView` 组件（约 520 行），提供 Finder 风格的文件浏览

### `/capture` — 快速捕获页（[app/capture/page.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/capture/page.tsx)）
- 极简文本输入页，输入内容 → 调用 `createDockItem(userId, text)` 保存到 Dock
- 实时字数统计，保存成功提示 2 秒后消失
- 底部有"查看 Dock"链接跳转到 `/workspace`

### `/dock` — Dock 独立列表页（旧版）（[app/dock/page.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/dock/page.tsx)）
- 独立的 Dock 条目列表页，展示所有 `DockItem`
- 5 种状态标签：`pending`（黄色）/ `suggested`（蓝色）/ `archived`（绿色）/ `ignored`（灰色）/ `reopened`（橙色）
- 每个状态对应不同操作按钮（生成建议 / 接受归档 / 忽略 / 恢复）
- 操作有 `actionLoading` 防止重复点击

### `/seed` — Demo 数据填充工具（[app/seed/page.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/seed/page.tsx)）
- 一键填充演示数据（Dock 条目、归档条目、标签、Chat 会话、知识结构、Mind 节点、Mind 边）
- 一键清除当前用户所有数据（14 张表）
- 仅开发/演示用途

### `/demo2-prototype` — 设计原型预览（[app/demo2-prototype/page.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/demo2-prototype/page.tsx)）
- 服务端组件，通过 `readFile` 读取 `docs/design_refs/` 下的 HTML 原型文件
- 通过 `PrototypeFrame` 组件将 HTML 嵌入 iframe 全屏展示
- 仅供设计评审使用

---

## Core Modules

所有核心模块均位于 [app/workspace/features/](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/features/) 下，由 [app/workspace/page.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/page.tsx) 通过 `activeModule` 状态切换渲染。

### Mind Module（思维导图/知识图谱）

**文件**：[features/mind/MindCanvasStage.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/features/mind/MindCanvasStage.tsx)（约 1100 行）

**负责**：
- 知识图谱可视化，基于原生 Canvas 2D 实现，零外部图表库依赖
- 支持三种布局模式：`radial`（放射状）、`force`（力导向）、`orbit`（轨道状）
- 内置物理引擎（`applyPhysics`）：Force 模式下节点间斥力 + 边弹簧吸引 + 速度阻尼 0.8
- 内置相机系统（`cameraRef { x, y, zoom }`）：平移、缩放（0.3~4x）、居中
- 筛选系统：按文档/标签/孤立节点可见性过滤，按类型（structural/network links）过滤，按关键词搜索

**包含的子组件（内联于同一文件）**：
- `<canvas>` 全屏画布 — 渲染层
- Filter 面板 — 可折叠筛选器（搜索框、域名选择、可见性/关系复选框）
- HUD 面板 — 图统计仪表盘 + 布局切换按钮（Radial / Force / Orbit）
- 缩放控件组 — 右下角 +/-/居中 按钮
- Node Detail Panel — 点击节点后弹出，显示节点类型、名称、连接列表、"Open in Editor"按钮

**数据适配器**：[features/mind/graphAdapter.ts](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/features/mind/graphAdapter.ts)
- 定义 `MindGraphNode`、`MindGraphEdge`、`MindGraphViewModel` 中间类型
- `toMindGraphViewModel(storedNodes, storedEdges)` — 将 repository 层数据转为 view model
- 边类型映射：`parent_child` / `structural` → `tree`，其余 → `net`
- `FilterState` 类型定义

**内部数据结构**：
- `GNode { id, x, y, tx, ty, vx, vy, radius, color, type, title, documentId }` — 渲染节点
- `GEdge { id, source: GNode, target: GNode, type: 'tree'|'net', synthetic? }` — 渲染边
- `buildWorldTree(vm, layoutMode)` — 将 view model 转换为 `{ nodes: GNode[], edges: GEdge[] }`
- `mergeWorldTreeGraph(prev, next)` — 新旧图合并，保留旧节点物理坐标实现平滑过渡
- `calculateTargetPositions(nodes, edges, mode)` — 三种布局的目标坐标计算

**交互功能**：
- 节点拖拽 → 靠近另一节点释放 → 自动创建 `net` 类型边
- 滚轮缩放（以鼠标位置为锚点）
- 点击节点 → 聚焦 + Node Detail Panel
- 断开连接（Unlink）
- 拖拽/点击判断：距离 < 5px 且时间 < 300ms 为 click

**性能策略**：Ref-State 双写模式 —— 渲染循环（`requestAnimationFrame`）读取 `useRef`，UI 组件读取 `useState`

### Editor Module（编辑器）

**文件**：[features/editor/EditorTabView.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/features/editor/EditorTabView.tsx)（414 行）

**负责**：
- 双模式编辑器：`classic`（传统 Markdown 编辑 + 预览）和 `block`（Notion 风格逐行编辑 + Slash 命令）
- Classic 模式：富文本工具栏（Bold/Italic/Strikethrough/Link/Code/Image/BulletList/NumberedList）、可拖拽分割的预览面板（20%-80%）
- Block 模式：按换行符拆分 Block 行，每行根据 `#/##/###/>/-/ ``` ` 前缀自动推断 CSS class
- Slash 命令菜单：`/text`、`/h1`、`/h2`、`/h3`、`/quote`、`/code`、`/list`、`/todo`
- Markdown 快捷键：Enter 时自动转换 `# `、`## `、`### `、`> `、`- `、`` ``` ``

**包含的子组件（纯图标，无自定义组件依赖）**：22 个 lucide-react 图标

**草稿系统**：
- 草稿使用负数 ID（`draftCounterRef` 递减）
- `drafts` Record（`Record<number, { title, content }>`）在内存中管理草稿数据
- 切换 Tab 时自动恢复草稿内容，关闭 Tab 时清理
- 保存草稿：`createDockItem` + `createSourceNodeWithRoot` 创建 Mind Graph 关联节点

**数据交互**：EditorTabView 是纯展示组件，不直接接触数据层。所有 repository 调用（`createDockItem`、`updateDockItemText`、`listDockItems`、`upsertMindNode`、`upsertMindEdge`）均在 WorkspacePage 层通过回调完成。

**编辑模式切换**：`EditorOptionsMenu` 组件（[page.tsx:L857-L908](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/page.tsx#L857-L908)）提供模式切换 + Rename / Move / Export / Delete（均为 mock）

### Dock Module（Dock 管理）

**文件**：内联在 [app/workspace/page.tsx:L910-L1437](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/page.tsx#L910-L1437) 的 `DockFinderView` 组件（约 520 行）

**负责**：
- Finder 风格的文件浏览器，支持三种视图：Grid（网格）、List（列表）、Columns（多列浏览）
- 侧边导航：Shortcuts（Inbox / Archive）、Projects（按项目分组）、Tags（按标签筛选）
- 状态筛选：`pending` / `suggested` / `archived` / `ignored` / `reopened`
- 实时搜索过滤
- Columns 模式：列式层级浏览项目 → 文件 → 详情，面包屑导航
- 详情面板：点击条目展示标签、创建/修改时间、图谱链路（Graph Chain）、编辑/查看图谱按钮
- Mock 文件夹：支持创建本地文件夹/项目（当前为 mock，通过 `mockIdCounter` 生成负数 ID）

**子组件**：`ColumnListView`（[page.tsx:L1439-L1572](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/page.tsx#L1439-L1572)）— 多列视图渲染

**数据适配器**：[features/dock/dockTreeAdapter.ts](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/features/dock/dockTreeAdapter.ts)
- `DockTreeNode { id, type: 'project'|'folder'|'file', name, children[], parentId, depth, documentId, contentType, tags[], preview }` 
- `toDockTreeViewModel(items: DockItem[])` — 按 `selectedProject` 字段将扁平条目转为层级树
- 树合并：适配器树 + 本地 mock 节点 → `mergedRoots`

### Home Module（首页仪表盘）

**文件**：[features/home/HomeView.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/features/home/HomeView.tsx)

**负责**：
- 知识图谱节点数量统计展示（"X Nodes active"）
- 快速 Capture 输入栏（回车保存到 Dock）
- 快速入口卡片：New Document / Process Inbox / Graph Explorer
- 最近 8 个 Dock 条目展示
- 导航到其他模块的快捷方式

---

## Key Components

以下列出跨模块共享的重要组件（非全部内联组件）：

| 组件 | 文件 | 功能 |
|------|------|------|
| `GoldenTopNav` | [_components/GoldenTopNav.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/_components/GoldenTopNav.tsx) | 顶部导航栏：模块切换（home/mind/dock/editor）、搜索、用户信息、编辑折叠控制 |
| `GlobalSidebar` | [_components/GlobalSidebar.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/_components/GlobalSidebar.tsx) | 全局侧边栏：模块导航、快速捕获、文档列表、项目导航、标签搜索 |
| `FloatingChatPanel` | [_components/FloatingChatPanel.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/_components/FloatingChatPanel.tsx) | 浮动 AI 对话面板 |
| `QuickNote` | [_components/QuickNote.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/_components/QuickNote.tsx) | 快捷笔记弹出窗口，支持标题+内容，保存到 Dock |
| `WorkspaceTabs` | [features/shared/WorkspaceTabs.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/features/shared/WorkspaceTabs.tsx) | 多标签页管理：创建（`onNewTab`）、切换（`onActivateTab`）、关闭（`onCloseTab`）、固定/取消固定（`onPinTab`） |
| `AuthGate` | [_components/AuthGate.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/_components/AuthGate.tsx) | 本地用户认证门控：支持登录/注册，列出已有用户 |
| `Sidebar` | [_components/Sidebar.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/_components/Sidebar.tsx) | 旧版侧边栏：Dock / Entries / Review 三视图切换 + 模式切换（classic/chat） |
| `DetailPanel` | [_components/DetailPanel.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/_components/DetailPanel.tsx) | 条目详情面板：标签建议、分类建议、项目建议、状态操作按钮、关联关系展开 |
| `ExpandedEditor` | [_components/ExpandedEditor.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/_components/ExpandedEditor.tsx) | 模态展开编辑器：长文本输入、Esc 关闭、字数统计 |
| `TagEditor` | [_components/TagEditor.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/_components/TagEditor.tsx) | 标签编辑器 |
| `EmptyState` | [_components/EmptyState.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/_components/EmptyState.tsx) | 空状态提示组件 |
| `PrototypeFrame` | [demo2-prototype/PrototypeFrame.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/demo2-prototype/PrototypeFrame.tsx) | iframe 沙箱渲染设计原型 HTML |

---

## State / Data Flow

### 状态管理方式

系统**未使用** Zustand、Redux、Context API 等外部状态管理库。全部使用 **React `useState` + `useRef`** 在 [app/workspace/page.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/workspace/page.tsx) 中集中管理，通过 props 向下传递。

### WorkspacePage 核心状态清单（27 个 useState）

| 状态 | 类型 | 用途 |
|------|------|------|
| `user` | `LocalUser \| null` | 当前登录用户 |
| `authChecked` | `boolean` | 认证检查完成标记 |
| `activeModule` | `'home'\|'mind'\|'dock'\|'editor'` | 当前激活的功能模块 |
| `items` | `DockItem[]` | 所有 Dock 条目列表 |
| `selectedItemId` | `number \| null` | 当前选中的条目 ID |
| `loading` | `boolean` | 数据加载中 |
| `error` | `string \| null` | 错误信息 |
| `tabs` | `Tab[]` | 编辑器标签页列表，初始含 `tab-home` |
| `activeTabId` | `string` | 当前激活标签页 ID |
| `recorderState` | `'closed'\|'classic'\|'chat'` | 录制器面板状态 |
| `inputMode` | `'chat'\|'classic'` | 录制器输入模式 |
| `inputText` | `string` | 录制器输入文本 |
| `editorContent` | `string` | 编辑器正文内容 |
| `editorTitle` | `string` | 编辑器标题 |
| `editingItemId` | `number \| null` | 当前编辑的条目 ID（负数 = 草稿） |
| `editorMode` | `'classic'\|'block'` | 编辑器模式 |
| `editorNavExpanded` | `boolean` | 编辑器导航展开状态 |
| `drafts` | `Record<number, {title,content}>` | 草稿数据表（key 为负数 ID） |
| `registerName` | `string` | 注册用户名输入 |
| `mindNodes` | `StoredMindNode[]` | 思维节点列表 |
| `mindEdges` | `StoredMindEdge[]` | 思维边列表 |
| `mindRefreshKey` | `number` | 思维数据刷新键 |
| `sharedProjectFilter` | `string \| null` | 跨组件共享项目筛选 |
| `sharedTagFilter` | `string \| null` | 跨组件共享标签筛选 |
| `sharedDockSearch` | `string` | 跨组件共享搜索文本 |
| `mockFolderNodes` | `DockTreeNode[]` | Mock 文件夹节点 |
| `toastMessage` | `string` | Toast 消息 |

### useRef 清单（4 个）

| Ref | 用途 |
|-----|------|
| `draftCounterRef` | 草稿 ID 生成器（从 -1 递减） |
| `mockFolderIdCounter` | Mock 文件夹 ID 生成器（从 -1000 递减） |
| `toastTimerRef` | Toast 自动消失定时器 |
| `moreRef` | 更多菜单 DOM 引用（DockFinderView 内部） |

### useMemo 计算属性

| 计算属性 | 依赖 | 产出 |
|----------|------|------|
| `workspaceMapping` | `[items, mindNodes, mindEdges]` | Dock ↔ Mind 双向映射表，含 5 个方法：`findDockItemByMindNode`、`findMindNodeByDockItem`、`getGraphChainForDockItem`（追溯 root→domain→...→node 完整路径）、`findDockItemByLabel`、`mindNodeToDockId` Map |

### Props 数据流

```
WorkspacePage (状态集中管理)
├── GoldenTopNav ← activeModule / user / isCollapsed
├── GlobalSidebar ← userName / documents / onSwitchTo* / onCapture / onProjectClick
├── FloatingChatPanel ← onToast / activeModule
├── QuickNote ← onSave / onToast
└── [activeModule 决定渲染哪个子视图]
    ├── HomeView ← userId / nodeCount / onOpenEditor / onSwitchTo*
    ├── MindCanvasStage ← nodes / edges / onOpenEditor / onCreateEdge / onDeleteEdge
    ├── DockFinderView ← items / selectedItemId / graphChainForItem / findMindNodeForItem
    └── WorkspaceTabs + EditorTabView ← editingItemId / editorTitle / editorContent / onSave / mode
```

### 数据加载流

```
用户登录 → userId 确定
  → useEffect 触发
    → loadData(): listDockItems(userId) → setItems
    → loadMindData(): listMindNodes(userId) + listMindEdges(userId) → setMindNodes / setMindEdges
  → workspaceMapping (useMemo) 重建双向映射
```

### 跨组件筛选同步

`sharedProjectFilter` / `sharedTagFilter` / `sharedDockSearch` 作为"提升状态"在 `GlobalSidebar` ↔ `DockFinderView` 之间共享，通过 `initial*` props 向下传递，通过 `on*Change` 回调向上通知。

---

## Data Layer

### 存储方案

基于 **Dexie.js** 封装的 IndexedDB，数据库名 `AtlaxDB`，共 **14 张表**，历经 15 个版本迁移。

### 数据库表结构（[lib/db.ts](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/lib/db.ts)）

| 表名 | 主键 | 核心字段 |
|------|------|----------|
| `dockItems` | `++id`（自增） | `userId`, `rawText`, `topic`, `sourceType`, `status`, `createdAt`, `sourceId`, `parentId`, `userTags`, `suggestions`, `selectedActions`, `selectedProject` |
| `entries` | `++id`（自增） | `userId`, `sourceDockItemId`, `type`, `title`, `content`, `tags`, `project`, `archivedAt` |
| `tags` | `id`（string） | `userId`, `name`, `createdAt` |
| `chatSessions` | `++id`（自增） | `userId`, `status`, `pinned`, `dockItemId`, `messages`, `createdAt`, `updatedAt` |
| `mindNodes` | `id`（string） | `userId`, `nodeType`, `label`, `state`, `documentId`, `positionX`, `positionY`, `metadata` |
| `mindEdges` | `id`（string） | `userId`, `sourceNodeId`, `targetNodeId`, `edgeType`, `metadata` |
| `collections` | `id`（string） | `userId`, `collectionType`, `parentId`, `name`, `sortOrder` |
| `entryTagRelations` | `id`（string） | `userId`, `entryId`, `tagId`, `source`, `confidence` |
| `entryRelations` | `id`（string） | `userId`, `sourceEntryId`, `targetEntryId`, `relationType`, `direction`, `source`, `confidence` |
| `knowledgeEvents` | `id`（string） | `userId`, `eventType`, `targetType`, `targetId`, `createdAt` |
| `temporalActivities` | `id`（string） | `userId`, `type`, `entityType`, `entityId`, `dayKey`, `weekKey`, `monthKey` |
| `widgets` | `++id`（自增） | `userId`, `widgetType`, `active`, `createdAt` |
| `workspaceSessions` | `id`（string） | `userId`, `createdAt`, `updatedAt` |
| `workspaceOpenTabs` | `id`（string） | `userId`, `sessionId`, `tabType`, `documentId`, `isPinned`, `isActive`, `sortOrder` |
| `recentDocuments` | `id`（string） | `userId`, `documentId`, `lastOpenedAt`, `openCount` |

### 数据访问层（[lib/repository.ts](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/lib/repository.ts)）

提供 **73 个导出函数**，覆盖全部 14 张表的 CRUD。核心函数按领域分组：

**DockItem（17 个函数）**：
- `createDockItem` / `listDockItems` / `listItemsByStatus` / `countDockItems`
- `suggestItem`（触发建议生成）/ `archiveItem`（归档并创建 Entry）/ `ignoreItem` / `restoreItem` / `reopenItem`
- `updateDockItemText` / `updateItemTags` / `updateSelectedActions` / `updateSelectedProject`
- `updateChainLinks` / `getChainProvenance` / `addTagToItem` / `removeTagFromItem`

**Entry / 归档（8 个函数）**：
- `listArchivedEntries` / `listArchivedEntriesByType` / `listArchivedEntriesByTag` / `listArchivedEntriesByProject`
- `getEntryByDockItemId` / `updateArchivedEntry`
- 别名：`listDocuments` / `listDocumentsByType` / `getDocumentByCaptureId` / `updateDocument`

**Mind 图（10 个函数）**：
- `listMindNodes` / `listMindNodesByType` / `getMindNode` / `upsertMindNode` / `deleteMindNode`
- `listMindEdges` / `listMindEdgesBySourceNode` / `listMindEdgesByTargetNode` / `getMindEdge` / `upsertMindEdge` / `deleteMindEdge`

**ChatSession（8 个函数）**：
- `createChatSession` / `getChatSession` / `listChatSessions` / `listActiveChatSessions`
- `updateChatSession` / `pinChatSession` / `unpinChatSession` / `deleteChatSession`
- `addChatMessage` / `confirmChatSession`（确认后创建 DockItem）

**KnowledgeStructure（8 个函数）**：
- `listCollections` / `createCollection` / `updateCollection`
- `listEntryTagRelations` / `addEntryTagRelation` / `removeEntryTagRelation`
- `listEntryRelations` / `createEntryRelation` / `deleteEntryRelation`
- `listKnowledgeEvents` / `recordKnowledgeEvent`
- `listTemporalActivities` / `recordTemporalActivity`
- `getStructureProjection`（聚合所有数据生成图投影）/ `backfillStructureData`

**Workspace（6 个函数）**：
- `getWorkspaceSession` / `openWorkspaceTab` / `closeWorkspaceTab` / `activateWorkspaceTab` / `pinWorkspaceTab` / `restoreWorkspaceTabs`

**其他**：
- `getWorkspaceStats`、`listTags` / `createStoredTag` / `getOrCreateTag`
- `getActiveWidget` / `activateWidget` / `deactivateWidget`
- `queryCalendarDay` / `queryCalendarMonth`
- `listRecentDocuments` / `recordRecentDocumentOpen`

### 领域服务层（[packages/domain/src/services/](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/packages/domain/src/services/)）

纯逻辑层，不直接操作数据库，被 repository 层调用：

| 服务 | 职责 |
|------|------|
| `KnowledgeStructure.ts` | 知识图谱实体类型定义（Collection、EntryRelation、EntryTagRelation、TemporalActivity、StructureProjection 等）+ ID 生成工具 |
| `KnowledgeStructureService.ts` | 从全量数据构建 `StructureProjection` 图投影；回填 tag 关联和项目合集；关系验证 |
| `ChatGuidanceService.ts` | 对话式记录创建状态机（7 个步骤：idle → awaiting_topic → awaiting_type → awaiting_content → awaiting_confirmation → confirmed / cancelled） |
| `ChainLinkService.ts` | DockItem 链式关系判定（reorganize / continue_edit / derive）+ 溯源构建 + 关系验证 |
| `EditSavePolicy.ts` | 编辑保存策略：文本变更时是否重置 suggestions、回退 status 到 pending；已归档条目编辑策略 |
| `EntryService.ts` | 构建 entry 更新 patch + DockItem 同步 patch（tags 回写） |
| `DockItemService.ts` | 文本更新 + suggestion 重置策略应用 |
| `EditorCommandTransform.ts` | 编辑器文本变换命令：bold / italic / code / link / heading / highlight 的选区包裹 + 光标定位 |
| `CalendarWidgetService.ts` | 按日期/月份聚合条目数据 |

### 其他 lib 模块

| 模块 | 文件 | 职责 |
|------|------|------|
| 认证 | [lib/auth.ts](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/lib/auth.ts) | 本地用户管理：`listLocalUsers`、`getCurrentUser`、`registerUser`、`loginUser`、`loginByUserId`、`logoutUser`。数据存储在 `localStorage` |
| 事件 | [lib/events.ts](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/lib/events.ts) | 事件系统：`subscribe`（订阅）、`emit`（广播）、`recordEvent`（记录+持久化）、`getEventLog`、`clearEventLog`、`computeMetrics`（计算 DAU/留存率等指标）。最多保留 500 条 |
| 类型 | [lib/types.ts](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/lib/types.ts) | 从 `@atlax/domain` 包重导出类型（ArchiveInput、Entry、SuggestionResult 等） |
| 建议引擎 | [lib/suggestion-engine.ts](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/lib/suggestion-engine.ts) | 从 `@atlax/domain` 包重导出 `generateSuggestions` 和规则集 |

### 数据流向总览

```
UI 层（page.tsx / 各模块组件）
  │ onSave / onCreate / onUpdate (回调 props)
  ▼
repository.ts（数据访问层，73 个函数）
  │ 调用 domain services 进行业务逻辑处理
  │ 直接操作 db.ts 的 Dexie 表
  ▼
domain services（纯逻辑层，9 个服务模块）
  │ ChatGuidanceService / ChainLinkService / EditSavePolicy
  │ KnowledgeStructureService / EntryService / DockItemService / etc.
  ▼
db.ts（Dexie.js / IndexedDB，14 张表）
  │ dockItems / entries / tags / mindNodes / mindEdges / collections / ...
  ▼
IndexedDB（浏览器本地存储）
```
