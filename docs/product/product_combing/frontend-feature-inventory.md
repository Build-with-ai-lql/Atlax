# Atlax Frontend Feature Inventory

## 1. 文档说明

- **本文档作用**：
  - 当前前端功能事实清单（基于 `codex/demo2-ui-golden-migration` 分支真实代码）
  - 手工测试依据
  - 后续 Help 文档素材
  - 后续开发计划/看板的基础数据源
- **范围限定**：仅基于当前仓库代码，不代表最终产品愿景
- **更新日期**：2026-04-30
- **分支**：`https://github.com/atlax-tech/mind-dock` → `codex/demo2-ui-golden-migration`

---

## 2. 路由总览

| Route | 页面名称 | 定位 | 是否正式入口 | 数据来源 | 备注 |
|---|---|---|---|---|---|
| `/` | 着陆页 | 品牌展示 + 导航入口 | `正式` | `localStorage`（`getCurrentUser`） | 无数据写入，纯展示 |
| `/workspace` | 工作区主页 | 核心工作台 | `正式` | `IndexedDB`（Dexie.js 14 张表） | 用户注册/登录后才可进入 |
| `/capture` | 快速捕获页 | 独立快捷录入 | `过渡入口` | `IndexedDB`（`createDockItem`） | 功能已接入但界面独立于 workspace |
| `/dock` | Dock 独立列表页 | 旧版 Dock 管理 | `旧版` | `IndexedDB`（`listDockItems` 等） | workspace 内置了新版 DockFinderView，此路由已过时 |
| `/seed` | Demo 数据填充工具 | 开发/演示用 | `开发工具` | `IndexedDB`（批量写入全部表） | 非产品功能，仅开发和演示用途 |
| `/demo2-prototype` | 设计原型预览 | 设计评审 | `设计预览` | `readFile` 读取本地 HTML | 服务端组件，iframe 展示设计稿 |

---

## 3. 功能模块总览

| 模块 | 所在文件 | 用户价值 | 当前完成度 | 数据接入状态 | 测试优先级 |
|---|---|---|---|---|---|
| Home Dashboard | `features/home/HomeView.tsx` | 查看知识图谱统计、快速入口 | `可用` | `真实 IndexedDB` | P0 |
| Mind Canvas | `features/mind/MindCanvasStage.tsx` | 可视化知识图谱，节点拖拽连线 | `可用` | `真实 IndexedDB` | P0 |
| Dock Finder | `workspace/page.tsx`（内联 `DockFinderView`） | Finder 风格浏览/搜索/管理 Dock 条目 | `部分可用` | `真实 IndexedDB` + `Mock` | P0 |
| Block/Classic Editor | `features/editor/EditorTabView.tsx` | 编辑文档内容 | `可用` | `真实 IndexedDB` | P0 |
| Workspace Tabs | `features/shared/WorkspaceTabs.tsx` | 多标签页管理编辑器 | `可用` | `React local state` | P0 |
| Global Sidebar | `_components/GlobalSidebar.tsx` | 全局导航 + 文档列表 + Widget | `部分可用` | `React local state` + `Hardcoded` | P1 |
| Golden Top Nav | `_components/GoldenTopNav.tsx` | 顶部导航 + 搜索 + 用户菜单 | `部分可用` | `React local state` + `Hardcoded` | P1 |
| Floating Chat Panel | `_components/FloatingChatPanel.tsx` | AI 对话交互 | `仅 UI` | `Mock` | P2 |
| Quick Note | `_components/QuickNote.tsx` | 快捷笔记弹窗 | `可用` | `真实 IndexedDB` | P1 |
| Floating Recorder | `workspace/page.tsx`（内联 `FloatingRecorder`） | 快速记录入口 | `可用` | `真实 IndexedDB` | P1 |
| Auth Gate | _components/AuthGate.tsx（已不直接使用） | 用户注册/登录 | `可用` | `localStorage` | P0 |
| Toast | `workspace/page.tsx`（内联） | 操作反馈 | `可用` | `React local state` | P2 |
| Nebula Background | `workspace/page.tsx`（内联 `NebulaBackground`） | 背景装饰动画 | `可用` | `真实 IndexedDB`（读取 mindNodes/mindEdges） | P3 |
| Old Dock Page | `dock/page.tsx` | 旧版 Dock 列表 | `可用`（旧版） | `真实 IndexedDB` | P3 |
| Capture Page | `capture/page.tsx` | 独立快速记录 | `可用` | `真实 IndexedDB` | P2 |

---

## 4. 用户功能清单

### 4.1 用户认证（AUTH）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| AUTH-001 | 用户注册 | `/workspace` 未登录时自动显示 | 输入用户名 → 点击"进入工作区"或按 Enter | 创建本地用户，跳转 workspace | `是`（`localStorage`） | `可用` | 注册函数 `registerUser`，同名返回已有用户 |
| AUTH-002 | 用户登录 | `/workspace` 已有用户时自动恢复 | 页面加载自动检测 `getCurrentUser()` | 自动恢复登录状态 | `是`（`localStorage`） | `可用` | 页面刷新后自动恢复 |
| AUTH-003 | 用户退出 | TopNav → 用户头像 → Log Out | 点击 Log Out | 清除登录状态，回到注册页面 | `是`（`localStorage`） | `可用` | `logoutUser()` |
| AUTH-004 | 未登录拦截 | 直接访问 `/workspace` | 无用户时自动显示注册页 | 阻挡未授权访问 | `N/A` | `可用` | `authChecked` 状态控制 |

### 4.2 着陆页（HOME-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| HOME-001 | 品牌展示 | `/` | 页面加载 | 显示 ATLAX / MindDock 品牌标识、渐变背景动画 | - | `可用` | 纯视觉 |
| HOME-002 | 用户状态检测 | `/` | 页面加载 | 已有用户显示"欢迎回来，继续整理"；新用户显示"你的智能思考与知识整理伙伴" | - | `可用` | 仅 `localStorage` 读取 |
| HOME-003 | 进入工作区 | `/` → 点击"进入工作区"按钮 | 点击按钮 | 渐入动画（800ms）后 `router.push('/workspace')` | - | `可用` | 纯路由跳转 |
| HOME-004 | 底部链接 | `/` 底部文字 | hover | 文字高亮（hover 效果），无实际链接 | - | `仅 UI` | "Phase 2 Preview"、"架构与设计系统演示"均为死链接 |

### 4.3 工作区 - Home 模块（HOME-010 ~ HOME-019）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| HOME-010 | 节点统计展示 | `/workspace` → Home | 查看 | 显示 "X Nodes active"（mindNodes 数量） | `否`（React state 快照） | `可用` | 数字来自 `mindNodes.length` |
| HOME-011 | 快速捕获（Home） | Home 页面 Star Input 栏 | 输入文字 → 按 Enter 或点击发送按钮 | 创建 DockItem + Mind Graph 关联节点，Toast 提示 | `是`（IndexedDB：dockItems + mindNodes + mindEdges） | `可用` | 调用 `handleCapture` → `createDockItem` + `createSourceNodeWithRoot` |
| HOME-012 | New Document 入口 | Home → 点击 "New Document" 卡片 | 点击 | 创建草稿 Tab，切换到 Editor 模块 | `否`（草稿仅在内存） | `可用` | 通过 `onNewNote` → `createDraftTab` |
| HOME-013 | Process Inbox 入口 | Home → 点击 "Process Inbox" 卡片 | 点击 | 切换到 Dock 模块 | `否`（仅模块切换） | `可用` | `onSwitchToDock` |
| HOME-014 | Graph Explorer 入口 | Home → 点击 "Graph Explorer" 卡片 | 点击 | 切换到 Mind 模块 | `否`（仅模块切换） | `可用` | `onSwitchToMind` |
| HOME-015 | 最近条目列表 | Home 页面 "Recent Intelligence" 区域 | 自动加载 | 显示最近 8 个 DockItem（按 createdAt 倒序） | `否`（React state 快照） | `可用` | `listDockItems(userId).slice(0, 8)` |
| HOME-016 | 打开最近条目 | Home → 点击最近条目卡片 | 点击 | 打开 Editor Tab，切换到编辑器 | `否`（仅 Tab 切换） | `可用` | `onOpenEditor(item.id)` |
| HOME-017 | 空状态展示 | Home → 无任何条目时 | 自动显示 | 显示 "No recently processed fragments detected" | - | `可用` | `recentItems.length === 0` |
| HOME-018 | 卡片 hover 效果 | Home → 三大入口卡片 | hover | 未 hover 的卡片缩小 + 变暗 + 灰度，hover 的卡片高亮 | `否`（纯 CSS） | `可用` | `hoveredCard` state |
| HOME-019 | Submit 按钮状态 | Home → Capture 输入栏 | 无输入时按钮 disabled；提交中按钮旋转 | 按钮状态正确反馈 | `否`（纯 UI 状态） | `可用` | `submitting` / 空文本判断 |

### 4.4 Mind 模块（MIND-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| MIND-001 | 知识图谱展示 | `/workspace` → Mind | 切换到 Mind 模块 | Canvas 渲染知识图谱节点和边 | `否`（React state 快照） | `可用` | 数据来自 `mindNodes` / `mindEdges` |
| MIND-002 | 画布平移 | Mind 画布 | 在空白区域拖拽 | 画布跟随鼠标平移 | `否`（Canvas 相机状态） | `可用` | `cameraRef { x, y }` 变化 |
| MIND-003 | 画布缩放 | Mind 画布 | 鼠标滚轮 | 以鼠标位置为锚点缩放（0.3~4x） | `否`（Canvas 相机状态） | `可用` | 指数缩放 |
| MIND-004 | 画布居中 | Mind 右下角 | 点击 Crosshair 按钮 | 相机重置到屏幕中心 zoom=1 | `否`（Canvas 相机状态） | `可用` | `centerCamera()` |
| MIND-005 | 节点拖拽 | Mind 画布 | 拖拽节点 | 节点跟随移动 | `否`（Canvas 物理状态） | `可用` | 局部坐标更新 |
| MIND-006 | 拖拽连线 | Mind 画布 | 拖拽节点靠近另一节点释放 | 自动创建 `semantic`（net）类型 edge，写入 IndexedDB | `是`（IndexedDB：mindEdges） | `可用` | `upsertMindEdge`，靠近阈值 60px |
| MIND-007 | 节点聚焦 | Mind 画布 | 点击节点 | 节点高亮，其他节点 dim，弹出 Node Detail Panel | `否`（Canvas/React state） | `可用` | `focusedNode` state |
| MIND-008 | 断开连接 | Mind → Node Detail Panel | 点击某个连接的 Unlink 按钮 | 删除对应 mindEdge（IndexedDB），刷新图 | `是`（IndexedDB：mindEdges） | `可用` | `db.table('mindEdges').delete(edge.id)` |
| MIND-009 | 打开编辑器 | Mind → Node Detail Panel | 点击 "Open in Editor" 按钮 | 查找关联 DockItem → 打开 Editor Tab | `否`（仅 Tab 切换） | `可用` | 通过 `workspaceMapping` 查找 |
| MIND-010 | 布局切换 | Mind → HUD 面板 | 点击 Radial / Force / Orbit 按钮 | 目标坐标重新计算，节点动画过渡到新位置 | `否`（Canvas 物理状态） | `可用` | `layoutMode` → `calculateTargetPositions` |
| MIND-011 | 筛选面板 | Mind → Filters 按钮 | 点击展开筛选面板 | 显示搜索框、域名选择、可见性/关系复选框 | `否`（Canvas 渲染状态） | `可用` | 按关键词搜索、按节点类型过滤 |
| MIND-012 | 筛选搜索 | Mind → Filter → 搜索框 | 输入关键词 | 不匹配的节点 dim（半透明） | `否`（Canvas 渲染状态） | `可用` | `filterSearch` 状态 |
| MIND-013 | 可见性过滤 | Mind → Filter 面板 | 切换 Documents/Tags/Orphans 复选框 | 对应类型节点/边隐藏或显示 | `否`（Canvas 渲染状态） | `可用` | `showDocuments/Tags/Orphans` |
| MIND-014 | 关系类型过滤 | Mind → Filter 面板 | 切换 Structural/Network Links 复选框 | 对应类型边隐藏或显示 | `否`（Canvas 渲染状态） | `可用` | `showStructuralLinks/NetworkLinks` |
| MIND-015 | HUD 统计面板 | Mind → HUD | 展开 HUD | 显示图统计信息（domain 数、文档数等） | `否`（React state） | `可用` | `graphStats` |
| MIND-016 | +/- 缩放按钮 | Mind 右下角 | 点击 +/- 按钮 | 缩放增加/减少 | `否`（Canvas 相机状态） | `可用` | Step zoom |
| MIND-017 | 缩放控件显示 | Mind 右下角 | 始终可见 | 显示 +/-/居中 三个按钮 | - | `可用` | 始终渲染 |
| MIND-018 | 自动创建 World Tree Root | 首次加载 Mind 数据 | 自动 | 若无 root 节点，自动 upsert "World Tree" root | `是`（IndexedDB：mindNodes） | `可用` | `ensureWorldTreeRoot()` |
| MIND-019 | Toast 反馈 | Mind | 创建/删除 edge | 显示 "Edge synced to knowledge graph" 等提示 | `否`（React state） | `可用` | `showToast` |

### 4.5 Dock 模块（DOCK-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| DOCK-001 | Dock 条目列表展示 | `/workspace` → Dock | 切换到 Dock 模块 | 以当前视图模式展示所有 DockItem | `否`（React state 快照） | `可用` | 数据来自 `items` state |
| DOCK-002 | Grid 视图 | Dock → 视图切换 | 点击 Grid 按钮 | 以网格卡片形式展示条目 | `否`（React state） | `可用` | `viewMode === 'grid'` |
| DOCK-003 | List 视图 | Dock → 视图切换 | 点击 List 按钮 | 以表格式列表展示条目（Title/Status/Type/Tags/Date） | `否`（React state） | `可用` | `viewMode === 'list'` |
| DOCK-004 | Columns 视图 | Dock → 视图切换 | 点击 Columns 按钮 | 以 Finder 多列浏览展示层级结构 | `否`（React state） | `可用` | `viewMode === 'columns'` |
| DOCK-005 | 状态筛选 | Dock → 左侧 Shortcuts | 点击 Inbox / Archive | 按状态过滤条目 | `否`（React state） | `可用` | `filterStatus` state |
| DOCK-006 | 项目筛选 | Dock → 左侧 Projects | 点击 "Core Architecture" / "Personal Growth" | 按项目过滤条目，同时通知 GlobalSidebar | `否`（React state） | `可用` | `selectedProject` state |
| DOCK-007 | 标签筛选 | Dock → 左侧 Tags | 点击标签（physics/algo/book/技术/产品/学习） | 按标签过滤条目 | `否`（React state） | `可用` | `selectedTag` state |
| DOCK-008 | 搜索过滤 | Dock → 搜索框 | 输入关键词 | 实时过滤条目（按 topic / rawText 大小写不敏感匹配） | `否`（React state） | `可用` | `dockSearch` state |
| DOCK-009 | 选中条目 | Dock | 点击条目 | 高亮条目，右侧展示 Detail Panel | `否`（React state） | `可用` | `selectedItemId` state |
| DOCK-010 | 条目详情 - 基本信息 | Dock → Detail Panel | 选中条目后自动展示 | 显示标题、类型（Document·Markdown）、图标 | `否`（React state） | `可用` | `effectiveSelectedItem` |
| DOCK-011 | 条目详情 - Tags | Dock → Detail Panel → Tags 区域 | 查看标签 | 显示 `userTags` 列表；可点击 + 添加标签 | `Mock` | `Mock` | `handleAddTag` 显示 Toast "Tag added (mock)"，不写库 |
| DOCK-012 | 条目详情 - 时间信息 | Dock → Detail Panel | 查看 | 显示 CREATED / MODIFIED 时间 | `否`（React state） | `可用` | `formatDate()` |
| DOCK-013 | 条目详情 - Graph Chain | Dock → Detail Panel | 查看 | 显示从 World Tree → domain → node 的层级路径 | `否`（React state 计算） | `可用` | `workspaceMapping.getGraphChainForDockItem(id)` |
| DOCK-014 | 条目详情 - 生成建议 | Dock → Detail Panel | 点击 "生成建议" 按钮 | 调用 `suggestItem` → 更新 DB → `refreshAll` | `是`（IndexedDB：dockItems） | `可用` | `handleSuggest` |
| DOCK-015 | 条目详情 - Edit Content | Dock → Detail Panel | 点击 "Edit Content" 按钮 | 打开 Editor Tab | `否`（仅 Tab 切换） | `可用` | `onOpenEditor` |
| DOCK-016 | 条目详情 - View in Graph | Dock → Detail Panel | 点击 "View in Graph" 按钮 | 切换到 Mind 模块（若有关联 MindNode）或 Toast 提示"无关联" | `否`（仅模块切换） | `可用` | `findMindNodeForItem` |
| DOCK-017 | More 菜单 | Dock → 顶部 ... 按钮 | 点击 | 弹出菜单：New Capture / Sort by Date(mock) / Export(mock) | - | `部分可用` | New Capture 打开 Recorder；其他两项为 mock |
| DOCK-018 | + Folder 按钮 | Dock → 顶部 + Folder 按钮 | 点击 | 创建本地 mock 项目/文件夹（不持久化），Toast 提示 | `Mock` | `Mock` | `handleCreateMockFolder`，ID 为负数 |
| DOCK-019 | Columns 导航 | Dock → Columns 视图 | 点击 project/folder | 展开子列，面包屑导航 | `否`（React state） | `部分可用` | 真实 Dock 节点 + Mock 节点混合 |
| DOCK-020 | Columns 面包屑 | Dock → Columns 视图顶部 | 点击面包屑节点 | 回到对应层级 | `否`（React state） | `可用` | `setColumnStack` |
| DOCK-021 | 加载状态 | Dock | 数据加载中 | 显示旋转 Loader | `否`（React state） | `可用` | `loading === true` |
| DOCK-022 | 错误状态 | Dock | 加载失败时 | 显示红色错误文本 | `否`（React state） | `可用` | `error` state |
| DOCK-023 | 空状态 | Dock | 筛选后无结果 | 显示 "暂无条目" | `否`（React state） | `可用` | `searchFiltered.length === 0` |

### 4.6 Editor 模块（EDITOR-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| EDITOR-001 | 新建草稿 | 多种入口（+ 按钮 / New Document） | 点击 | 创建负数 ID 草稿 Tab，切换到 Editor Block 模式 | `否`（草稿仅在内存 drafts Record） | `可用` | `createDraftTab()` |
| EDITOR-002 | 打开已有文档 | Dock → Edit Content / Home → 最近条目 | 点击 | 打开已有 DockItem 的 Editor Tab，加载标题和内容 | `否`（React state） | `可用` | `openEditorTab(itemId)` |
| EDITOR-003 | 编辑标题（Classic） | Editor Classic 模式 | 在标题输入框输入 | 实时更新 `editorTitle`，草稿同步到 `drafts` record | `否`（React state） | `可用` | `onTitleChange` |
| EDITOR-004 | 编辑正文（Classic） | Editor Classic 模式 | 在正文 textarea 输入 | 实时更新 `editorContent`，草稿同步到 `drafts` record | `否`（React state） | `可用` | `onContentChange` |
| EDITOR-005 | 保存草稿 | Editor → 保存按钮 | 点击保存 | 创建 DockItem + Mind Graph 关联节点 → 刷新列表 → 将负 ID Tab 替换为正 ID Tab | `是`（IndexedDB：dockItems + mindNodes + mindEdges） | `可用` | `handleSaveEditor` isDraft 分支 |
| EDITOR-006 | 保存已有文档 | Editor → 保存按钮 | 点击保存 | 调用 `updateDockItemText` 更新 DB → `refreshAll` | `是`（IndexedDB：dockItems） | `可用` | `handleSaveEditor` 正 ID 分支 |
| EDITOR-007 | 保存按钮状态 | Editor | 草稿：标题或内容非空即可保存；已有文档：有修改才可保存 | `canSave = isDraft ? (title.trim() \|\| content.trim()) : dirty` | `否`（React state） | `可用` | `dirty` state |
| EDITOR-008 | Classic 模式工具栏 | Editor Classic 模式 | 点击格式按钮（Bold/Italic/Strikethrough/Link/Code/Image/Bullet/Numbered） | 在光标位置或选中文本周围插入对应 Markdown 语法 | `否`（React state，仅修改编辑器内容） | `可用` | `insertMarkdown()` 方法 |
| EDITOR-009 | Classic 预览面板 | Editor Classic 模式 | 点击 BookOpen 图标 | 右侧显示 Markdown 预览面板（仅 `whitespace-pre-wrap` 展示，非 Markdown 渲染） | `否`（React state） | `部分可用` | 预览是纯文本展示，无 Markdown 渲染引擎 |
| EDITOR-010 | 预览面板分割拖拽 | Editor Classic 模式 | 拖拽分割线 | 调整编辑/预览比例（20%~80%） | `否`（React state） | `可用` | `splitRatio` state |
| EDITOR-011 | Block 模式 | Editor Block 模式 | 切换到 Block 模式 | 逐行显示 Block 行，每行根据 `#/##/###/>/-/ \`\`\` ` 前缀自动推断 CSS class | `否`（React state） | `可用` | `blockRows` 计算 |
| EDITOR-012 | Block 行操作 | Editor Block 模式 | 每行左侧 hover 显示 + 按钮和拖拽手柄 | + 按钮可新增行（插入 Slash 命令）；拖拽手柄（GripVertical）可拖拽排序 | `否`（React state） | `部分可用` | 拖拽仅 mock（Toast "Block moved from X to Y (mock reorder)"） |
| EDITOR-013 | Block 行 Block Handle | Editor Block 模式 | 点击行左侧 + | 弹出 Slash 命令菜单 | `否`（React state） | `可用` | `handleBlockChange` |
| EDITOR-014 | Slash 命令菜单 | Editor Block 模式 | 输入 `/` | 弹出 Slash 命令菜单（text/h1/h2/h3/quote/code/list/todo） | `否`（React state） | `可用` | `SLASH_COMMANDS` 常量 |
| EDITOR-015 | Slash 命令插入 | Editor Block 模式 | 点击菜单项 | 将当前行替换为对应 prefix，光标定位到 prefix 后 | `否`（React state，仅修改编辑器内容） | `可用` | `insertSlashCommand()` |
| EDITOR-016 | Slash 命令过滤 | Editor Block 模式 | 输入 `/text` 等 | 按 label 和 desc 大小写不敏感过滤命令 | `否`（React state） | `可用` | `slashFilter` |
| EDITOR-017 | Markdown 快捷键 | Editor Block 模式 | 在当前行输入 `# ` / `## ` / `### ` / `> ` / `- ` / ` ``` ` → Enter | 行自动转换为对应 prefix + 换行 | `否`（React state，仅修改编辑器内容） | `可用` | `MARKDOWN_SHORTCUTS` + `handleKeyDown` |
| EDITOR-018 | 模式切换 | Editor → EditorOptionsMenu（... 按钮） | 打开菜单 → 选择 Block Edit / Classic Edit | 切换编辑器模式 | `否`（React state） | `可用` | `handleSetEditorMode` |
| EDITOR-019 | EditorOptionsMenu - Rename | EditorOptionsMenu | 点击 Rename | Toast "Rename coming soon" | `否` | `Mock` | 无实际业务动作 |
| EDITOR-020 | EditorOptionsMenu - Move to... | EditorOptionsMenu | 点击 Move to... | Toast "Move to... coming soon" | `否` | `Mock` | 无实际业务动作 |
| EDITOR-021 | EditorOptionsMenu - Export as PDF | EditorOptionsMenu | 点击 Export as PDF | Toast "Export as PDF coming soon" | `否` | `Mock` | 无实际业务动作 |
| EDITOR-022 | EditorOptionsMenu - Delete | EditorOptionsMenu | 点击 Delete | Toast "Delete coming soon" | `否` | `Mock` | 无实际业务动作 |
| EDITOR-023 | Context Links 面板 | Editor（两种模式） | 点击 PanelRight 图标 | 右侧浮出 288px 面板，显示 3 个 mock 文档卡片 | `否` | `Mock` | 点击触发 Toast（非真实链接跳转） |
| EDITOR-024 | 编辑器 Dirty 标记 | Editor | 修改标题/内容 | `dirty` 置为 `true`，保存后重置为 `false` | `否`（React state） | `可用` | 空内容时空保存按钮 disabled |
| EDITOR-025 | Block 模式底部输入区 | Editor Block 模式 | 在 Block 列表底部 textarea 输入 | 新增内容，Slash 命令和 Markdown 快捷键均可触发 | `否`（React state） | `可用` | Block 模式的双输入策略 |

### 4.7 Workspace Tabs（TAB-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| TAB-001 | 激活 Tab | Editor 区域 Tab 栏 | 点击 Tab | 切换到对应 Tab，加载标题/内容 | `否`（React state） | `可用` | `handleActivateTab` |
| TAB-002 | 关闭 Tab | Tab 上 hover → 点击 X | 点击 X | 关闭 Tab，自动切换到相邻 Tab；草稿 Tab 同时清理 drafts 数据 | `否`（React state） | `可用` | `handleCloseTab` |
| TAB-003 | 新建 Tab | Tab 栏 + 按钮 / ••• 菜单 → New Note | 点击 | 创建负数 ID 草稿 Tab，切换到 Editor | `否`（React state） | `可用` | `handleNewTab` → `handleNewNote` |
| TAB-004 | 固定 Tab（Pin） | Tab 上 hover → 点击 Pin 图标 / 双击 Tab | 点击 Pin / 双击 | Tab 变为 pinned，显示在左侧固定区域（仅图标） | `否`（React state） | `可用` | `handlePinTab`，`isPinned` flip |
| TAB-005 | From Template 菜单 | Tab 栏 ••• → From Template | 点击 | Toast "Template gallery coming soon (mock)" | `否` | `Mock` | 无实际功能 |
| TAB-006 | 模块 Tab 自动创建 | TopNav 点击 Home/Mind/Dock | 点击模块 | 自动创建或激活对应 `tab-home` / `tab-mind` / `tab-dock` | `否`（React state） | `可用` | `handleModuleChange` |

### 4.8 Global Sidebar（SIDEBAR-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| SIDEBAR-001 | 侧边栏展开 | 屏幕左边缘 hover | 鼠标移到左边缘 | 侧边栏滑出（未 pin 时通过 hover 触发） | `否`（React state） | `可用` | `isVisible` state |
| SIDEBAR-002 | 侧边栏固定 | 侧边栏顶部 Pin 按钮 | 点击 | 侧边栏保持展开，CSS 变量 `--sidebar-width: 256px` | `否`（React state + CSS 变量） | `可用` | `togglePin` |
| SIDEBAR-003 | 用户信息展示 | 侧边栏顶部 | 查看 | 显示用户名首字母头像 + "{name}'s Space" | `否`（React state） | `可用` | `userName` prop |
| SIDEBAR-004 | 展开搜索 | 侧边栏搜索图标 | 点击 | 搜索输入框展开（动画） | `否`（React state） | `可用` | `isSearchExpanded` |
| SIDEBAR-005 | 搜索执行 | 侧边栏搜索框 | 输入文本 → Enter | 切换到 Dock 模块并带入搜索关键词 | `否`（React state） | `可用` | `onSwitchToDockWithSearch` |
| SIDEBAR-006 | AI Chat 模式 | 侧边栏 Sparkles 按钮 | 点击 | 切换侧边栏为 AI Chat 模式 | `否`（React state） | `仅 UI` | 发送消息仅调用 `onCapture`（创建 DockItem），无 AI 对话 |
| SIDEBAR-007 | + 菜单 - Document | 侧边栏 + 按钮 | 点击 + → Document | 创建草稿 Tab | `否`（React state） | `可用` | `onNewNote` |
| SIDEBAR-008 | + 菜单 - New Chat | 侧边栏 + 按钮 | 点击 + → New Chat | 切换到 AI Chat 模式 | `否`（React state） | `可用` | 功能同 SIDEBAR-006 |
| SIDEBAR-009 | + 菜单 - Project Folder | 侧边栏 + 按钮 | 点击 + → Project Folder | 创建 mock 项目文件夹，Toast 提示（不持久化） | `Mock` | `Mock` | `onCreateProjectFolder` |
| SIDEBAR-010 | 文件夹展开/折叠 | 侧边栏 "Core Architecture" / "Personal Growth" | 点击文件夹名 | 展开/折叠子文档列表，同时触发项目筛选 | `否`（React state） | `可用` | `collapsedFolders` + `onProjectClick` |
| SIDEBAR-011 | 打开文档 | 侧边栏文件夹内文档名 | 点击文档 | 通过 `workspaceMapping` 查找并打开 Editor Tab | `否`（React state） | `可用` | `resolveDocument` |
| SIDEBAR-012 | Untitled Note | 侧边栏 Private 区域 | 点击 "Untitled Note" | 创建草稿 Tab | `否`（React state） | `可用` | `onNewNote` |
| SIDEBAR-013 | Add Widget - Calendar | 侧边栏 + → Calendar Widget | 点击 | 添加日历 Widget 到侧边栏底部（hardcoded "April 2026"） | `否`（React state） | `Hardcoded` | 数据硬编码，无真实日历 |
| SIDEBAR-014 | Add Widget - Tasks | 侧边栏 + → Tasks Widget | 点击 | 添加任务 Widget（hardcoded "Refactor Sidebar"/"Fix TopNav Bug"） | `否`（React state） | `Hardcoded` | 数据硬编码，checkbox 无真实动作 |
| SIDEBAR-015 | Add Widget - Weather | 侧边栏 + → Weather Widget | 点击 | 添加天气 Widget（hardcoded "Tokyo,JP / Mostly Sunny / 21°"） | `否`（React state） | `Hardcoded` | 数据硬编码 |
| SIDEBAR-016 | 移除 Widget | Widget 右上角 X 按钮 | 点击 | 从侧边栏移除该 Widget | `否`（React state） | `可用` | `removeWidget` |
| SIDEBAR-017 | Widget 折叠 | Widgets 区域标题 | 点击 WIDGETS | 折叠/展开所有 Widget | `否`（React state） | `可用` | `isWidgetsCollapsed` |

### 4.9 Top Navigation（TOPNAV-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| TOPNAV-001 | 模块切换 | TopNav 四个导航按钮 | 点击 Home/Mind/Dock/Editor | 切换到对应模块，创建/激活对应 Tab | `否`（React state） | `可用` | `onModuleChange` |
| TOPNAV-002 | 高亮当前模块 | TopNav | 查看 | 当前激活模块按钮高亮（白色文字 + 背景） | `否`（React state） | `可用` | `isActive === item.id` |
| TOPNAV-003 | 搜索模式展开 | TopNav 搜索图标 | 点击 | 搜索框展开（动画），显示搜索建议面板 | `否`（React state） | `可用` | `isSearchMode` |
| TOPNAV-004 | 搜索建议点击 | TopNav 搜索建议面板 | 点击建议项 | 执行对应搜索动作（Graph Engine Physics → 打开文档 / World Tree → 切换到 Mind / 其他文本 → Dock 搜索） | `否`（React state） | `可用` | `onSearchAction` |
| TOPNAV-005 | 搜索建议展示 | TopNav 搜索建议面板 | 查看 | 显示硬编码的搜索建议（SUGGESTED FROM GRAPH + RECENT ACTIONS） | - | `Hardcoded` | `SEARCH_SUGGESTIONS` 常量硬编码 |
| TOPNAV-006 | 搜索输入 | TopNav 搜索框 | 输入文本 | 可在文本框中输入（当前无实时搜索功能，仅为展示） | `否` | `仅 UI` | 输入框可输入，但按 Enter 仅关闭搜索 |
| TOPNAV-007 | Quick Capture 按钮 | TopNav + 按钮 | 点击 | 打开 Floating Recorder | `否`（React state） | `可用` | `onOpenRecorder` |
| TOPNAV-008 | 用户菜单 | TopNav 用户头像 | 点击 | 弹出 Account Dropdown | `否`（React state） | `可用` | `isAccountOpen` |
| TOPNAV-009 | Account Mgmt | 用户菜单 | 点击 | Toast "Account management coming soon" | `否` | `Mock` | 无实际功能 |
| TOPNAV-010 | Subscription | 用户菜单 | 点击 | Toast "Subscription management coming soon" | `否` | `Mock` | 无实际功能 |
| TOPNAV-011 | Settings | 用户菜单 | 点击 | Toast "Settings page coming soon" | `否` | `Mock` | 无实际功能 |
| TOPNAV-012 | Feedback | 用户菜单 | 点击 | Toast "Feedback form coming soon" | `否` | `Mock` | 无实际功能 |
| TOPNAV-013 | Log Out | 用户菜单 | 点击 Log Out | 清除登录状态，重新显示注册页面 | `是`（localStorage） | `可用` | `onLogout` → `logoutUser()` |
| TOPNAV-014 | 收起模式拖拽 | Editor 活跃时 TopNav 收起 | 拖拽 Logo 按钮 | 可拖拽移动收起后的迷你导航 | `否`（React state） | `可用` | `dragState` |
| TOPNAV-015 | 收起模式点击展开 | Editor 活跃时 TopNav 收起 | 点击 Logo | 展开完整导航 | `否`（React state） | `可用` | `setInternalCollapsed(false)` |
| TOPNAV-016 | 用户信息展示 | 用户菜单顶部 | 查看 | 显示用户名 + "Pro Plan" 标签 | `否`（React state） | `Hardcoded` | "Pro Plan" 硬编码 |

### 4.10 Floating Chat Panel（CHAT-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| CHAT-001 | 显示触发按钮 | 右下角 hover 区域 | 鼠标移入右下角 | 紫色 Sparkles 按钮淡入显示 | `否`（React state） | `可用` | `isButtonVisible` state |
| CHAT-002 | 打开聊天面板 | 右下角 Sparkles 按钮 | 点击 | 聊天面板弹出（Floating 或 Sidebar 模式） | `否`（React state） | `可用` | `isOpen` state |
| CHAT-003 | 关闭聊天面板 | 聊天面板标题栏 hide 按钮 | 点击 | 聊天面板关闭 | `否`（React state） | `可用` | `setIsOpen(false)` |
| CHAT-004 | New Chat | 聊天面板 "New AI chat" 按钮 | 点击 | 清空消息历史 | `否`（React state） | `可用` | `handleNewChat` |
| CHAT-005 | 模式切换 Floating | 聊天面板模式菜单 → Floating | 点击 | 切换为浮动模式 | `否`（React state） | `可用` | `setChatMode('floating')` |
| CHAT-006 | 模式切换 Sidebar | 聊天面板模式菜单 → Sidebar | 点击 | 切换为侧边栏模式 | `否`（React state） | `可用` | `setChatMode('sidebar')` |
| CHAT-007 | 提示词快捷入口 | 聊天面板欢迎页 | 点击预设提示词按钮 | 自动发送用户消息，返回 mock 回复 | `否` | `Mock` | `MOCK_REPLIES` 硬编码英文回复 |
| CHAT-008 | 发送消息 | 聊天面板输入框 | 输入文字 → Enter / 点击发送 | 消息显示在对话列表，600~1400ms 后返回 mock 英文回复 | `否` | `Mock` | `handleSend`，无真实 AI 调用 |
| CHAT-009 | 输入框 "Current Context" | 聊天面板输入区 | 查看 | 显示 "Current Context" 标签（纯展示） | `否` | `仅 UI` | 装饰元素 |
| CHAT-010 | 附加按钮 | 聊天面板底部 | 点击 + / Sliders / Mic | Toast 提示 mock（Attach file / Model settings / Voice input mock） | `否` | `Mock` | 均无实际功能 |
| CHAT-011 | 欢迎页展示 | 聊天面板（无消息时） | 查看 | 显示 "Atlax AI Assistant" + 4 个预设 Prompt 按钮 | `否` | `Mock` | 欢迎页 |
| CHAT-012 | 发送中状态 | 聊天面板 | 发送消息后 | 显示 "Thinking..." 占位 | `否`（React state） | `可用` | `isSending` state |

### 4.11 Quick Note（QNOTE-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| QNOTE-001 | 打开 Quick Note | 右下角 Hot Corner 三角形触发区 | 点击 | Quick Note 窗口弹出 | `否`（React state） | `可用` | `handleHotCornerClick` |
| QNOTE-002 | 关闭并保存 | Quick Note 窗口红色 X 按钮 | 点击 X | 有内容 → 自动保存到 Dock（以时间戳命名 title）；无内容 → 直接关闭 | `是`（IndexedDB：dockItems + mindNodes + mindEdges） | `可用` | `handleCloseClick` → `onSave(text, title)` |
| QNOTE-003 | 最小化 | Quick Note 窗口黄色按钮 | 点击 | 窗口最小化，右侧出现 Tab 拖拽把手 | `否`（React state） | `可用` | `setNoteState('MINIMIZED')` |
| QNOTE-004 | 恢复最小化 | 右侧 Tab 把手 | 点击 | 恢复 Quick Note 窗口 | `否`（React state） | `可用` | `handleDrawerClick` |
| QNOTE-005 | 拖拽窗口 | Quick Note 标题栏 | 拖拽 | 窗口可自由拖拽到任意位置 | `否`（React state） | `可用` | Pointer Events 拖拽 |
| QNOTE-006 | 窗口缩放 | Quick Note 窗口右下角 | 拖拽 | 可 resize 窗口大小（min 250x200, max 600x500） | `否`（React state） | `可用` | Pointer Events resize |
| QNOTE-007 | 标题输入 | Quick Note 标题输入框 | 输入 | 实时更新标题文本 | `否`（React state） | `可用` | `title` state |
| QNOTE-008 | 内容输入 | Quick Note 正文 textarea | 输入 | 实时更新内容文本，显示字数统计 | `否`（React state） | `可用` | `text` state |
| QNOTE-009 | 保存中状态 | Quick Note | 点击关闭（有内容时） | X 按钮显示旋转 Loader | `否`（React state） | `可用` | `saving` state |
| QNOTE-010 | Hot Corner 触发区 | 右下角三角形区域 | hover | 三角形高亮，点击打开 Quick Note | `否`（React state） | `可用` | `isHovered` state |

### 4.12 Floating Recorder（REC-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| REC-001 | 打开 Classic 录制器 | TopNav + 按钮 / Dock More → New Capture | 点击 | 底部弹出 Classic 模式输入框 | `否`（React state） | `可用` | `setRecorderState('classic')` |
| REC-002 | 打开 Chat 录制器 | 侧边栏 New Chat / Floating Chat | 点击 | 底部弹出 Chat 模式引导流程 | `否`（React state） | `可用` | `setRecorderState('chat')` |
| REC-003 | Classic 输入 | Recorder Classic 模式 | 在输入框输入文字 → Enter / 点击发送 | 调用 `handleCapture` → `createDockItem` + `createSourceNodeWithRoot` → Toast 提示 | `是`（IndexedDB：dockItems + mindNodes + mindEdges） | `可用` | `inputText` state |
| REC-004 | Chat 引导流程 | Recorder Chat 模式 | 按步骤输入 topic → type → content → 确认 | ChatGuidanceService 状态机驱动，最终调用 `handleCapture` | `是`（IndexedDB：dockItems + mindNodes + mindEdges） | `可用` | `guidanceState` + `guidanceService` |
| REC-005 | Chat 步骤提示 | Recorder Chat 模式 | 查看 | 每步显示中文提示语（"这次记录是什么主题呢"等） | `否`（React state） | `可用` | `buildGuidancePrompt(step)` |
| REC-006 | Chat 类型选择 | Recorder Chat → awaiting_type 步骤 | 点击类型按钮（note/idea/task/meeting/reading） | 选择类型，进入下一步 | `否`（React state） | `可用` | `submitType` |
| REC-007 | Chat 确认 | Recorder Chat → awaiting_confirmation 步骤 | 点击 Confirm | 确认并保存 | `是`（IndexedDB） | `可用` | `confirm()` |
| REC-008 | Chat 取消 | Recorder Chat 任意步骤 | 点击 Cancel | 取消，显示随机告别语 | `否`（React state） | `可用` | `cancel()` + `getRandomDismissalMessage()` |
| REC-009 | Chat 补填 | Recorder Chat → confirmed 步骤 | 点击 Refill | 可选择重新填写标题/类型/内容 | `否`（React state） | `可用` | `refillStateFromOption` |
| REC-010 | 关闭录制器 | Recorder 右上角 X | 点击 | 关闭录制器 | `否`（React state） | `可用` | `setRecorderState('closed')` |
| REC-011 | 模式切换 | Recorder | 点击 Classic/Chat 切换按钮 | 切换录制器模式 | `否`（React state） | `可用` | `setInputMode` |

### 4.13 Toast（TOAST-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| TOAST-001 | Toast 显示 | 各操作触发 | 自动 | 底部中央显示 Toast 消息 | `否`（React state） | `可用` | `toastMessage` state |
| TOAST-002 | Toast 自动消失 | Toast 显示后 | 3 秒后自动 | Toast 消失 | `否`（React state） | `可用` | `toastTimerRef` setTimeout 3000 |

### 4.14 Nebula Background（NEBULA-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| NEBULA-001 | 星云背景动画 | `/workspace` | 自动渲染 | 基于 mindNodes/mindEdges 数据渲染星云粒子动画 | `否`（Canvas 渲染） | `可用` | 数据来自 IndexedDB，但动画纯装饰 |
| NEBULA-002 | 跟随模块变化 | `/workspace` | 切换模块 | 不同模块显示不同透明度/颜色 | `否`（Canvas 渲染） | `可用` | `activeModule` 影响 |

### 4.15 独立路由功能

#### 4.15.1 Capture 页面（CAPTURE-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| CAPTURE-001 | 文本输入 | `/capture` | 在 textarea 输入 | 实时更新文本，显示字数统计 | `否`（React state） | `可用` | `text` state |
| CAPTURE-002 | 保存到 Dock | `/capture` → 保存按钮 | 点击保存 | 调用 `createDockItem(userId, text)` → Toast "已保存到 Dock" | `是`（IndexedDB：dockItems） | `可用` | 2 秒后 Toast 消失 |
| CAPTURE-003 | 保存中状态 | `/capture` | 点击保存 | 按钮显示 loading | `否`（React state） | `可用` | `saving` state |
| CAPTURE-004 | 保存后清空 | `/capture` | 保存成功 | 输入框清空 | `否`（React state） | `可用` | `setText('')` |
| CAPTURE-005 | 导航到 Dock | `/capture` 底部链接 | 点击"查看 Dock" | 跳转到 `/workspace` | `否`（路由跳转） | `可用` | `router.push('/workspace')` |

#### 4.15.2 旧版 Dock 页面（OLDDOCK-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| OLDDOCK-001 | 条目列表 | `/dock` | 页面加载 | 显示所有 DockItem 列表 | `否`（React state 快照） | `可用`（旧版） | `listDockItems` |
| OLDDOCK-002 | 状态标签 | `/dock` | 查看 | 每个条目显示状态标签（5 种颜色） | `否`（展示） | `可用`（旧版） | pending/suggested/archived/ignored/reopened |
| OLDDOCK-003 | 生成建议 | `/dock` → pending 条目 | 点击"生成建议" | 调用 `suggestItem` → 更新状态 | `是`（IndexedDB：dockItems） | `可用`（旧版） | |
| OLDDOCK-004 | 接受归档 | `/dock` → suggested 条目 | 点击"接受归档" | 调用 `archiveItem` → 创建 Entry | `是`（IndexedDB：dockItems + entries） | `可用`（旧版） | |
| OLDDOCK-005 | 忽略 | `/dock` → suggested 条目 | 点击"忽略" | 调用 `ignoreItem` | `是`（IndexedDB：dockItems） | `可用`（旧版） | |
| OLDDOCK-006 | 恢复 | `/dock` → ignored 条目 | 点击"恢复" | 调用 `restoreItem` | `是`（IndexedDB：dockItems） | `可用`（旧版） | |
| OLDDOCK-007 | 空状态 | `/dock` → 无条目 | 自动显示 | 显示"暂无条目"+ 链接到 `/capture` | `否`（React state） | `可用`（旧版） | |

#### 4.15.3 Seed 页面（SEED-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| SEED-001 | 数据清单展示 | `/seed` | 页面加载 | 显示即将创建的数据统计清单 | `否`（展示） | `可用` | 开发工具 |
| SEED-002 | 填充 Demo 数据 | `/seed` → 填充按钮 | 点击"填充 Demo 数据" | 批量写入种子数据到 14 张表 | `是`（IndexedDB 全部表） | `可用` | 开发工具 |
| SEED-003 | 清除数据 | `/seed` → 清除按钮 | 点击"清除所有数据" | 清除当前用户的所有数据 | `是`（IndexedDB 全部表） | `可用` | 开发工具 |
| SEED-004 | 结果反馈 | `/seed` | 填充/清除后 | 显示各类型数据创建/删除数量 | `否`（React state） | `可用` | 开发工具 |

#### 4.15.4 Demo2 Prototype 页面（PROTO-*）

| 功能 ID | 功能名称 | 用户入口 | 用户操作 | 预期结果 | 数据是否持久化 | 当前状态 | 备注 |
|---|---|---|---|---|---|---|---|
| PROTO-001 | 原型展示 | `/demo2-prototype` | 页面加载 | iframe 全屏展示设计原型 HTML | `否` | `可用` | 设计预览 |
| PROTO-002 | 沙箱安全 | `/demo2-prototype` | 自动 | iframe sandbox 限制脚本/弹窗权限 | `否` | `可用` | 设计预览 |

---

## 5. 交互测试矩阵

| 测试 ID | 模块 | 前置条件 | 操作步骤 | 预期结果 | 当前风险 |
|---|---|---|---|---|---|
| TC-AUTH-001 | 认证 | 首次访问 `/workspace` | 1. 在输入框输入用户名 2. 点击"进入工作区" | 创建本地用户，进入 workspace | 低 |
| TC-AUTH-002 | 认证 | 已注册用户 | 1. 刷新页面 | 自动恢复登录状态 | 低 |
| TC-AUTH-003 | 认证 | 已登录 | 1. 点击 TopNav 用户头像 2. 点击 Log Out | 退出登录，回到注册页 | 低 |
| TC-HOME-001 | Home | 已登录 workspace | 1. 切换到 Home 模块 | 显示节点统计、Capture 输入栏、三大入口卡片、最近条目 | 低 |
| TC-HOME-002 | Home | Home 模块 | 1. 在 Capture 输入栏输入文字 2. 按 Enter | 创建 DockItem + Mind 节点，Toast 提示 | 低 |
| TC-HOME-003 | Home | Home 模块 | 1. 点击 "New Document" 卡片 | 创建草稿 Tab，切换到 Editor | 低 |
| TC-HOME-004 | Home | Home 模块 | 1. 点击 "Process Inbox" | 切换到 Dock 模块 | 低 |
| TC-HOME-005 | Home | Home 模块 | 1. 点击 "Graph Explorer" | 切换到 Mind 模块 | 低 |
| TC-HOME-006 | Home | Home 模块有最近条目 | 1. 点击最近条目卡片 | 打开 Editor Tab 编辑该条目 | 低 |
| TC-MIND-001 | Mind | Mind 模块有节点数据 | 1. 在空白区域拖拽 | 画布平移 | 低 |
| TC-MIND-002 | Mind | Mind 模块 | 1. 滚轮上下滚动 | 画布缩放（0.3~4x） | 低 |
| TC-MIND-003 | Mind | Mind 模块 | 1. 点击右下角居中按钮 | 相机重置到中心 zoom=1 | 低 |
| TC-MIND-004 | Mind | Mind 模块有节点 | 1. 拖拽节点 A 靠近节点 B 2. 释放鼠标 | 创建 semantic edge，Toast 提示，刷新后 edge 保留 | 中（需验证 IndexedDB 写入） |
| TC-MIND-005 | Mind | Mind 模块 | 1. 点击某个节点 | 节点高亮，其他 dim，弹出 Node Detail Panel | 低 |
| TC-MIND-006 | Mind | Node Detail Panel 已打开 | 1. 点击某个连接的 Unlink 按钮 | 删除 edge，刷新后删除保留 | 中（需验证 IndexedDB 删除） |
| TC-MIND-007 | Mind | Node Detail Panel 已打开 | 1. 点击 "Open in Editor" | 打开关联 DockItem 的 Editor Tab | 中（若节点无关联 DockItem 则无响应） |
| TC-MIND-008 | Mind | Mind 模块 | 1. 点击 HUD 面板 2. 切换 Radial/Force/Orbit | 节点动画过渡到新布局 | 低 |
| TC-MIND-009 | Mind | Mind 模块 | 1. 点击 Filters 2. 在搜索框输入关键词 | 不匹配的节点变暗 | 低 |
| TC-MIND-010 | Mind | Mind 模块 | 1. 点击 Filters 2. 取消勾选 Documents | document 类型节点和关联边隐藏 | 低 |
| TC-DOCK-001 | Dock | Dock 模块有条目 | 1. 切换 Grid/List/Columns 视图 | 条目以对应视图模式展示 | 低 |
| TC-DOCK-002 | Dock | Dock 模块 | 1. 在搜索框输入关键词 | 实时过滤条目 | 低 |
| TC-DOCK-003 | Dock | Dock 模块 | 1. 点击左侧 Inbox | 显示 pending 状态条目 | 低 |
| TC-DOCK-004 | Dock | Dock 模块 | 1. 点击左侧 Archive | 显示 archived 状态条目 | 低 |
| TC-DOCK-005 | Dock | Dock 模块 | 1. 点击某个条目 | 高亮条目，右侧展示 Detail Panel | 低 |
| TC-DOCK-006 | Dock | Detail Panel 已打开 | 1. 点击 "生成建议" | 调用 suggestItem，刷新后状态变更 | 中（需验证 DB 写入） |
| TC-DOCK-007 | Dock | Detail Panel 已打开 | 1. 点击 "Edit Content" | 打开 Editor Tab | 低 |
| TC-DOCK-008 | Dock | Detail Panel 已打开 | 1. 点击 "View in Graph" | 切换到 Mind 模块（有关联节点时）或 Toast 提示 | 中（无关联时行为） |
| TC-DOCK-009 | Dock | Dock 模块 | 1. 点击 + Folder 按钮 | 创建 mock 文件夹，刷新后消失 | 高（Mock，不持久化） |
| TC-DOCK-010 | Dock | Dock 模块 | 1. 点击 More → Sort by Date | Toast mock 提示 | 高（Mock） |
| TC-EDITOR-001 | Editor | Editor 模块 | 1. 点击 + 新建 Tab | 创建草稿 Tab，进入 Block 编辑器 | 低 |
| TC-EDITOR-002 | Editor | 草稿 Tab | 1. 输入标题 2. 输入正文 3. 点击保存 | 创建 DockItem + Mind 节点，Tab ID 从负数变为正数 | 中（需验证完整保存流程） |
| TC-EDITOR-003 | Editor | 已有文档 Tab | 1. 修改内容 2. 点击保存 | 调用 updateDockItemText，刷新后内容保留 | 中（需验证 DB 写入） |
| TC-EDITOR-004 | Editor | Classic 模式 | 1. 选中文本 2. 点击 Bold 按钮 | 文本被 `**...**` 包裹 | 低 |
| TC-EDITOR-005 | Editor | Classic 模式 | 1. 点击 BookOpen 图标 | 右侧显示预览面板（纯文本展示） | 中（预览非 Markdown 渲染） |
| TC-EDITOR-006 | Editor | Classic 模式 | 1. 拖拽分割线 | 编辑/预览比例在 20%~80% 间调整 | 低 |
| TC-EDITOR-007 | Editor | Block 模式 | 1. 输入 `/` | 弹出 Slash 命令菜单 | 低 |
| TC-EDITOR-008 | Editor | Block 模式 | 1. 输入 `/h1` 2. 点击 Heading 1 | 当前行替换为 `# ` 前缀 | 低 |
| TC-EDITOR-009 | Editor | Block 模式 | 1. 在当前行输入 `# ` 2. 按 Enter | 行自动转换为 h1 格式 | 低 |
| TC-EDITOR-010 | Editor | Block 模式 | 1. 拖拽 Block 行到另一位置 | Toast "Block moved from X to Y (mock reorder)" | 高（Mock，不真实排序） |
| TC-EDITOR-011 | Editor | EditorOptionsMenu | 1. 点击 Rename | Toast "Rename coming soon" | 高（Mock） |
| TC-EDITOR-012 | Editor | EditorOptionsMenu | 1. 点击 Delete | Toast "Delete coming soon" | 高（Mock） |
| TC-EDITOR-013 | Editor | 两种模式 | 1. 点击 PanelRight 图标 | 右侧显示 Context Links 面板（3 个 mock 卡片） | 高（Mock） |
| TC-TAB-001 | Tabs | 多个 Tab 打开 | 1. 点击不同 Tab | 切换到对应 Tab，加载标题/内容 | 低 |
| TC-TAB-002 | Tabs | 多个 Tab 打开 | 1. hover Tab 2. 点击 X | 关闭 Tab，草稿 Tab 清理 drafts 数据 | 低 |
| TC-TAB-003 | Tabs | Editor Tab | 1. 双击 Tab / hover 点击 Pin | Tab 变为 pinned（仅图标） | 低 |
| TC-SIDEBAR-001 | Sidebar | Workspace | 1. 鼠标移到左边缘 | 侧边栏滑出 | 低 |
| TC-SIDEBAR-002 | Sidebar | 侧边栏已展开 | 1. 点击 Pin 按钮 | 侧边栏固定展开 | 低 |
| TC-SIDEBAR-003 | Sidebar | 侧边栏 | 1. 点击搜索图标 2. 输入文字 3. Enter | 切换到 Dock 模块并带入搜索词 | 低 |
| TC-SIDEBAR-004 | Sidebar | 侧边栏 | 1. 点击 + → Project Folder | 创建 mock 文件夹，刷新后消失 | 高（Mock） |
| TC-SIDEBAR-005 | Sidebar | 侧边栏 | 1. 点击 + → Calendar Widget | 显示硬编码日历 | 高（Hardcoded） |
| TC-SIDEBAR-006 | Sidebar | 侧边栏 | 1. 点击 + → Tasks Widget | 显示硬编码任务列表 | 高（Hardcoded） |
| TC-SIDEBAR-007 | Sidebar | 侧边栏 | 1. 点击 + → Weather Widget | 显示硬编码天气 | 高（Hardcoded） |
| TC-TOPNAV-001 | TopNav | Workspace | 1. 点击 Home/Mind/Dock/Editor | 切换到对应模块 | 低 |
| TC-TOPNAV-002 | TopNav | Workspace | 1. 点击搜索图标 | 搜索框展开，显示硬编码建议 | 中（搜索建议硬编码） |
| TC-TOPNAV-003 | TopNav | 用户菜单 | 1. 点击头像 2. 点击 Account Mgmt | Toast mock 提示 | 高（Mock） |
| TC-TOPNAV-004 | TopNav | 用户菜单 | 1. 点击 Log Out | 退出登录 | 低 |
| TC-CHAT-001 | Chat | Workspace | 1. 鼠标移到右下角 2. 点击 Sparkles 按钮 | 聊天面板弹出 | 低 |
| TC-CHAT-002 | Chat | 聊天面板 | 1. 输入文字 2. Enter | 显示用户消息，600~1400ms 后返回 mock 英文回复 | 高（Mock，无真实 AI） |
| TC-CHAT-003 | Chat | 聊天面板 | 1. 点击 + / Sliders / Mic | Toast mock 提示 | 高（Mock） |
| TC-QNOTE-001 | Quick Note | Workspace | 1. 点击右下角 Hot Corner | Quick Note 窗口弹出 | 低 |
| TC-QNOTE-002 | Quick Note | Quick Note 已打开 | 1. 输入标题和内容 2. 点击红色 X | 自动保存到 Dock，Toast 提示 | 中（需验证 DB 写入） |
| TC-QNOTE-003 | Quick Note | Quick Note 已打开 | 1. 点击黄色按钮 | 窗口最小化，右侧出现 Tab 把手 | 低 |
| TC-QNOTE-004 | Quick Note | Quick Note 最小化 | 1. 拖拽标题栏 | 窗口可自由移动 | 低 |
| TC-REC-001 | Recorder | Workspace | 1. 点击 TopNav + 按钮 | 底部弹出 Classic 录制器 | 低 |
| TC-REC-002 | Recorder | Classic 录制器 | 1. 输入文字 2. Enter | 创建 DockItem + Mind 节点 | 中（需验证 DB 写入） |
| TC-REC-003 | Recorder | Chat 录制器 | 1. 输入 topic 2. 选择 type 3. 输入 content 4. 确认 | 创建 DockItem + Mind 节点 | 中（需验证完整流程） |
| TC-CAPTURE-001 | Capture | `/capture` | 1. 输入文字 2. 点击保存 | 创建 DockItem，Toast 提示 | 低 |
| TC-SEED-001 | Seed | `/seed` | 1. 点击"填充 Demo 数据" | 批量写入种子数据 | 低（开发工具） |
| TC-SEED-002 | Seed | `/seed` | 1. 点击"清除所有数据" | 清除当前用户全部数据 | 低（开发工具） |

---

## 6. Mock / 占位 / 未接入功能清单

| 功能 | 所在文件 | 表现形式 | 当前真实行为 | 应补齐的数据/后端能力 | 建议优先级 |
|---|---|---|---|---|---|
| Editor Rename | `page.tsx` EditorOptionsMenu | 菜单项 + Toast | Toast "Rename coming soon"，无实际动作 | 需 `updateDockItemText` 修改 topic 字段 | P1 |
| Editor Move to... | `page.tsx` EditorOptionsMenu | 菜单项 + Toast | Toast "Move to... coming soon"，无实际动作 | 需 `updateSelectedProject` 修改项目归属 | P1 |
| Editor Export as PDF | `page.tsx` EditorOptionsMenu | 菜单项 + Toast | Toast "Export as PDF coming soon"，无实际动作 | 需 PDF 生成库（如 html2pdf / jsPDF） | P2 |
| Editor Delete | `page.tsx` EditorOptionsMenu | 菜单项 + Toast | Toast "Delete coming soon"，无实际动作 | 需 DockItem 删除 API + 关联 MindNode/MindEdge 清理 | P1 |
| Block 拖拽排序 | `EditorTabView.tsx` | 拖拽手柄 + Toast | Toast "Block moved from X to Y (mock reorder)"，不改变数据 | 需实现真实行重排逻辑 | P2 |
| Context Links 面板 | `EditorTabView.tsx` | 右侧面板 + 3 个文档卡片 | 点击卡片 Toast 提示，非真实链接 | 需基于标签/内容相似度的关联文档推荐 | P2 |
| Classic 预览面板 | `EditorTabView.tsx` | 分割面板 | 仅 `whitespace-pre-wrap` 纯文本展示，无 Markdown 渲染 | 需集成 Markdown 渲染引擎（如 react-markdown） | P1 |
| Dock + Folder | `page.tsx` DockFinderView | 按钮 + Toast | 创建 mock 文件夹（负数 ID），不持久化 | 需 Collection 表持久化 + dockTreeAdapter 真实映射 | P1 |
| Dock More → Sort by Date | `page.tsx` DockFinderView | 菜单项 + Toast | Toast "Sort by date coming soon" | 需实现排序逻辑 | P2 |
| Dock More → Export | `page.tsx` DockFinderView | 菜单项 + Toast | Toast "Export coming soon" | 需导出功能 | P2 |
| Dock Detail → Add Tag | `page.tsx` DockFinderView | + 按钮 + Toast | Toast "Tag added (mock)"，不写库 | 需 `addTagToItem` + `createStoredTag` | P1 |
| Sidebar + → Project Folder | `GlobalSidebar.tsx` | 菜单项 + Toast | Toast "Project folder created"，创建 mock 节点 | 需 Collection 表持久化 | P1 |
| Sidebar Calendar Widget | `GlobalSidebar.tsx` | Widget 卡片 | 硬编码 "April 2026" 日历 | 需 `queryCalendarMonth` 真实数据接入 | P2 |
| Sidebar Tasks Widget | `GlobalSidebar.tsx` | Widget 卡片 | 硬编码 "Refactor Sidebar"/"Fix TopNav Bug" | 需任务系统（当前无 tasks 表） | P3 |
| Sidebar Weather Widget | `GlobalSidebar.tsx` | Widget 卡片 | 硬编码 "Tokyo,JP / Mostly Sunny / 21°" | 需天气 API 或移除 | P3 |
| TopNav 搜索建议 | `GoldenTopNav.tsx` | 搜索面板 | `SEARCH_SUGGESTIONS` 常量硬编码 | 需基于用户数据的真实搜索建议 | P2 |
| TopNav 搜索输入 | `GoldenTopNav.tsx` | 搜索框 | 可输入但 Enter 仅关闭搜索，无真实搜索 | 需全局搜索逻辑 | P2 |
| TopNav Account Mgmt | `GoldenTopNav.tsx` | 菜单项 + Toast | Toast "Account management coming soon" | 需账户管理页面 | P3 |
| TopNav Subscription | `GoldenTopNav.tsx` | 菜单项 + Toast | Toast "Subscription management coming soon" | 需订阅系统 | P3 |
| TopNav Settings | `GoldenTopNav.tsx` | 菜单项 + Toast | Toast "Settings page coming soon" | 需设置页面 | P2 |
| TopNav Feedback | `GoldenTopNav.tsx` | 菜单项 + Toast | Toast "Feedback form coming soon" | 需反馈表单 | P3 |
| TopNav "Pro Plan" 标签 | `GoldenTopNav.tsx` | 用户菜单文字 | 硬编码 "Pro Plan" | 需真实订阅状态 | P3 |
| Chat AI 回复 | `FloatingChatPanel.tsx` | 对话消息 | `MOCK_REPLIES` 硬编码英文回复，600~1400ms 延迟 | 需接入 LLM API | P1 |
| Chat 附加功能 | `FloatingChatPanel.tsx` | + / Sliders / Mic 按钮 | Toast mock 提示 | 需文件上传 / 模型选择 / 语音输入 | P2 |
| Tab From Template | `WorkspaceTabs.tsx` | 菜单项 + Toast | Toast "Template gallery coming soon (mock)" | 需模板系统 | P3 |
| 着陆页底部链接 | `app/page.tsx` | 文字链接 | "Phase 2 Preview"/"架构与设计系统演示"无实际链接 | 需目标页面 | P3 |

---

## 7. 数据持久化矩阵

| 功能 | 数据表 | repository 函数 | 是否真实写入 | 是否刷新后保留 | 备注 |
|---|---|---|---|---|---|
| 用户注册 | localStorage | `registerUser` | `是` | `是` | localStorage 非 IndexedDB |
| 用户登录/退出 | localStorage | `loginUser` / `logoutUser` | `是` | `是` | localStorage |
| Home Capture | dockItems + mindNodes + mindEdges | `createDockItem` + `upsertMindNode` + `upsertMindEdge` | `是` | `是` | 完整写入链路 |
| Editor 保存草稿 | dockItems + mindNodes + mindEdges | `createDockItem` + `upsertMindNode` + `upsertMindEdge` | `是` | `是` | 完整写入链路 |
| Editor 保存已有文档 | dockItems | `updateDockItemText` | `是` | `是` | |
| Mind 拖拽连线 | mindEdges | `upsertMindEdge` | `是` | `是` | |
| Mind 断开连接 | mindEdges | `db.mindEdges.delete` | `是` | `是` | 直接操作 Dexie 表 |
| Mind 自动创建 World Tree Root | mindNodes | `upsertMindNode` | `是` | `是` | `ensureWorldTreeRoot()` |
| Dock 生成建议 | dockItems | `suggestItem` | `是` | `是` | |
| Quick Note 保存 | dockItems + mindNodes + mindEdges | `createDockItem` + `upsertMindNode` + `upsertMindEdge` | `是` | `是` | 通过 `onSave` 回调 |
| Floating Recorder Classic | dockItems + mindNodes + mindEdges | `createDockItem` + `upsertMindNode` + `upsertMindEdge` | `是` | `是` | `handleCapture` |
| Floating Recorder Chat | dockItems + mindNodes + mindEdges | `createDockItem` + `upsertMindNode` + `upsertMindEdge` | `是` | `是` | `handleCapture` |
| Capture 页面保存 | dockItems | `createDockItem` | `是` | `是` | 不创建 Mind 节点 |
| 旧版 Dock 生成建议 | dockItems | `suggestItem` | `是` | `是` | |
| 旧版 Dock 接受归档 | dockItems + entries | `archiveItem` | `是` | `是` | |
| 旧版 Dock 忽略 | dockItems | `ignoreItem` | `是` | `是` | |
| 旧版 Dock 恢复 | dockItems | `restoreItem` | `是` | `是` | |
| Seed 填充数据 | 全部 14 张表 | 批量写入 | `是` | `是` | 开发工具 |
| Seed 清除数据 | 全部 14 张表 | 批量删除 | `是` | `是` | 开发工具 |
| Editor 草稿内容 | 无（内存） | 无 | `否` | `否` | `drafts` Record 在 React state |
| Workspace Tabs | 无（内存） | 无 | `否` | `否` | `tabs` / `activeTabId` 在 React state |
| Dock 视图模式 | 无（内存） | 无 | `否` | `否` | `viewMode` state |
| Dock 筛选状态 | 无（内存） | 无 | `否` | `否` | `filterStatus` / `selectedProject` / `selectedTag` |
| Dock Mock Folder | 无（内存） | 无 | `否` | `否` | `mockFolderNodes` state，刷新消失 |
| Sidebar Widget | 无（内存） | 无 | `否` | `否` | `widgets` state，刷新消失 |
| Sidebar Mock Project Folder | 无（内存） | 无 | `否` | `否` | `mockFolderNodes` state，刷新消失 |
| Chat 消息 | 无（内存） | 无 | `否` | `否` | `messages` state，刷新消失 |
| TopNav 搜索 | 无 | 无 | `否` | `否` | 无真实搜索逻辑 |
| Editor Rename/Move/Export/Delete | 无 | 无 | `否` | `否` | 仅 Toast mock |
| Block 拖拽排序 | 无 | 无 | `否` | `否` | 仅 Toast mock |
| Context Links | 无 | 无 | `否` | `否` | 硬编码 3 个文档卡片 |
| Dock Add Tag | 无 | 无 | `否` | `否` | Toast mock，不调用 `addTagToItem` |
| Mind 画布平移/缩放 | 无 | 无 | `否` | `否` | Canvas 相机状态，刷新重置 |
| Mind 布局模式 | 无 | 无 | `否` | `否` | `layoutMode` state，刷新重置 |
| Mind 筛选状态 | 无 | 无 | `否` | `否` | `showDocuments` 等 state，刷新重置 |

---

## 8. 前端完成度判断

| 模块 | UI 完成度 | 交互完成度 | 数据接入完成度 | 测试风险 | 后续建议 |
|---|---|---|---|---|---|
| 用户认证 | 90% | 90% | 90%（localStorage） | 低 | 补充用户管理页面 |
| Home Dashboard | 85% | 85% | 80% | 低 | 节点统计可增加更多维度 |
| Mind Canvas | 90% | 85% | 75% | 中 | 节点位置持久化（positionX/Y 未回写）、布局偏好持久化 |
| Dock Finder | 80% | 70% | 60% | 高 | Folder/Project 持久化、Add Tag 接入真实 API、Sort/Export 补齐 |
| Editor (Classic) | 75% | 70% | 80% | 中 | Markdown 预览渲染、Rename/Move/Delete 补齐 |
| Editor (Block) | 70% | 60% | 80% | 中 | Block 拖拽排序真实实现、Slash 命令扩展 |
| Workspace Tabs | 85% | 85% | 30%（仅内存） | 中 | Tab 状态持久化到 workspaceOpenTabs 表 |
| Global Sidebar | 75% | 65% | 40% | 高 | Widget 数据真实化、Project Folder 持久化、AI Chat 接入 |
| Golden Top Nav | 70% | 60% | 40% | 高 | 搜索真实化、Account/Settings 补齐 |
| Floating Chat | 80% | 50% | 0%（全 Mock） | 高 | 接入 LLM API 或移除 |
| Quick Note | 90% | 90% | 85% | 低 | 窗口位置/大小持久化 |
| Floating Recorder | 85% | 85% | 80% | 低 | Chat 引导流程可增加更多步骤 |
| Toast | 95% | 95% | N/A | 低 | 可增加 Toast 类型（成功/警告/错误） |
| Nebula Background | 90% | N/A | 70% | 低 | 纯装饰，低优先级 |
| Capture 页面 | 85% | 85% | 80% | 低 | 独立路由，可考虑合并到 workspace |
| 旧版 Dock 页面 | 80% | 80% | 80% | 低 | 已过时，建议下线或重定向 |
| Seed 页面 | 90% | 90% | 90% | 低 | 开发工具，维持现状 |

**整体评估**：UI 完成度约 80%，交互完成度约 70%，数据接入完成度约 60%。核心数据写入链路（Capture → DockItem → MindNode → MindEdge）已完整，但大量辅助功能仍为 Mock 或仅前端状态。

---

## 9. 下一阶段建议

### 9.1 已经可以进入手工测试的功能

- 用户注册/登录/退出
- Home 快速 Capture → DockItem 创建
- Editor 草稿创建 → 保存 → 刷新验证
- Editor 已有文档编辑 → 保存 → 刷新验证
- Mind 画布平移/缩放/布局切换
- Mind 拖拽连线 → 刷新验证 edge 保留
- Mind 断开连接 → 刷新验证 edge 删除
- Dock Grid/List/Columns 视图切换
- Dock 搜索/筛选
- Dock 生成建议
- Quick Note 保存
- Floating Recorder Classic/Chat 保存
- Seed 数据填充/清除

### 9.2 必须先补数据接入的功能

1. **Dock Add Tag** — 当前 Toast mock，应接入 `addTagToItem` + `createStoredTag`
2. **Dock + Folder / Sidebar Project Folder** — 当前 mock，应接入 `collections` 表持久化
3. **Workspace Tabs 持久化** — 当前仅内存，应接入 `workspaceOpenTabs` 表
4. **Mind 节点位置持久化** — 拖拽后 positionX/Y 未回写 DB
5. **Sidebar Widget 数据** — Calendar/Tasks/Weather 均硬编码

### 9.3 只是视觉展示，不能进入"已完成"的功能

1. **Floating Chat Panel** — 全 Mock 回复，无 AI 能力
2. **Classic 预览面板** — 纯文本展示，无 Markdown 渲染
3. **Context Links 面板** — 硬编码 3 个文档卡片
4. **TopNav 搜索** — 输入框可输入但无真实搜索
5. **Sidebar AI Chat 模式** — 仅调用 `onCapture`，非 AI 对话
6. **TopNav "Pro Plan" 标签** — 硬编码
7. **着陆页底部链接** — 死链接

### 9.4 应进入后端接入计划的功能

1. **AI Chat** — 需 LLM API 接入（OpenAI / Claude / 本地模型）
2. **全局搜索** — 需全文检索引擎（当前 IndexedDB 无 FTS）
3. **数据导出** — PDF / Markdown 导出
4. **账户管理** — 多设备同步需后端
5. **订阅系统** — 需支付后端

### 9.5 应拆成 GitHub Issues / Notion 看板任务的功能

1. Editor Rename / Move / Delete 真实实现（3 个 Issue）
2. Dock Add Tag 接入真实 API
3. Dock Folder/Project 持久化（接入 collections 表）
4. Classic 预览面板集成 Markdown 渲染
5. Block 拖拽排序真实实现
6. Workspace Tabs 持久化
7. Mind 节点位置回写
8. TopNav 搜索真实化
9. Sidebar Widget 数据真实化
10. Floating Chat 接入 LLM API

### 9.6 应写入最终产品 Help 文档的功能

1. 快速 Capture（Home 输入栏 / Recorder / Quick Note / Capture 页面）
2. Dock 条目管理（状态流转：pending → suggested → archived / ignored）
3. Editor 双模式使用（Classic 工具栏 / Block Slash 命令 / Markdown 快捷键）
4. Mind 图谱操作（平移/缩放/拖拽连线/布局切换/筛选）
5. Workspace Tabs 管理（新建/切换/关闭/Pin）
6. 用户注册与本地存储说明

### 9.7 应暂时隐藏，避免 Demo 时暴露未完成功能的功能

1. **Floating Chat Panel** — 全 Mock，Demo 时易误导
2. **Sidebar Weather Widget** — 硬编码东京天气，无意义
3. **Sidebar Tasks Widget** — 硬编码假任务
4. **TopNav 搜索建议** — 硬编码内容
5. **Editor Context Links** — 硬编码假文档
6. **Editor Rename/Move/Export/Delete** — 点击后仅 Toast
7. **Dock + Folder** — 刷新即消失
8. **着陆页底部链接** — 死链接
9. **TopNav "Pro Plan" 标签** — 无订阅系统支撑
10. **Tab From Template** — 无模板系统

---

## 10. 用户旅程测试清单

> 基于 `codex/demo2-ui-golden-migration` 分支真实代码重新确认。Step2 中关于 Floating Recorder Chat 多步引导流程的描述与当前代码不符——当前 Chat 模式仅为单行输入，未接入 `ChatGuidanceService`。

### JOURNEY-001：新用户首次进入产品流程

| 字段 | 内容 |
|---|---|
| **Journey ID** | JOURNEY-001 |
| **前置条件** | 浏览器无 `atlax_current_user` / `atlax_user_directory` localStorage 数据 |
| **操作步骤** | 1. 访问 `/` 着陆页 2. 查看品牌展示 3. 点击"进入工作区"按钮 4. 等待 800ms 渐入动画 5. 跳转到 `/workspace` 6. 显示注册界面 7. 输入用户名 8. 点击"进入工作区"或按 Enter |
| **预期结果** | 1. `/` 显示 ATLAX/MindDock 品牌 + "你的智能思考与知识整理伙伴" 2. 点击后 800ms 动画 → `router.push('/workspace')` 3. `/workspace` 检测无用户 → 显示注册页 4. 输入用户名后 `registerUser()` 创建 `LocalUser`（ID: `user_${Date.now()}_${random}`） 5. 写入 `atlax_user_directory` + `atlax_current_user` 到 localStorage 6. 自动进入 Home 模块 |
| **涉及模块** | 着陆页 → Auth → Home |
| **涉及数据表** | localStorage: `atlax_user_directory`, `atlax_current_user` |
| **是否需要刷新验证** | 是 — 刷新后 `getCurrentUser()` 应自动恢复登录 |
| **风险等级** | 低 |
| **当前是否 Demo Ready** | 是 |
| **备注** | 注册函数 `registerUser` 同名用户会直接返回已有用户（非报错），可能导致用户困惑 |

### JOURNEY-002：Home 快速 Capture 流程

| 字段 | 内容 |
|---|---|
| **Journey ID** | JOURNEY-002 |
| **前置条件** | 已登录用户，Home 模块 |
| **操作步骤** | 1. 在 Home Star Input 栏输入文字 2. 按 Enter 或点击发送按钮 3. 等待 Toast 提示 4. 检查 Home 最近条目区域 5. 切换到 Dock 模块 6. 切换到 Mind 模块 7. 刷新页面 8. 重复检查 Home/Dock/Mind |
| **预期结果** | 1. 调用 `handleCapture` → `createDockItem(userId, text)` 写入 dockItems 表 2. 调用 `createSourceNodeWithRoot(text, newId)` 写入 mindNodes + mindEdges 表 3. Toast 提示成功 4. Home 最近条目出现新条目（`listDockItems(userId).slice(0, 8)`） 5. Dock 列表出现新条目 6. Mind 图谱出现新节点 7. 刷新后三处数据仍存在 |
| **涉及模块** | Home → Dock → Mind |
| **涉及数据表** | IndexedDB: `dockItems`, `mindNodes`, `mindEdges` |
| **是否需要刷新验证** | 是 — 核心数据写入链路验证 |
| **风险等级** | 低 |
| **当前是否 Demo Ready** | 是 |
| **备注** | `recordEvent` 也会被调用，写入 `knowledgeEvents` 表 |

### JOURNEY-003：Editor 新建草稿流程

| 字段 | 内容 |
|---|---|
| **Journey ID** | JOURNEY-003 |
| **前置条件** | 已登录用户，Home 模块 |
| **操作步骤** | 1. 点击 "New Document" 卡片 2. 观察创建的草稿 Tab（负数 ID） 3. 输入标题 4. 输入正文 5. 点击保存按钮 6. 观察 Tab ID 变化 7. 刷新页面 8. 从 Dock 或 Home 重新打开该文档 |
| **预期结果** | 1. `createDraftTab()` 创建 `tab-editor-draft-${draftId}`（draftId 为 -1, -2, ...） 2. 切换到 Editor Block 模式 3. 标题/内容同步到 `drafts[editingItemId]` 4. 保存时 `handleSaveEditor` 检测 `editingItemId < 0` → 走草稿分支 5. 调用 `createDockItem` + `createSourceNodeWithRoot` → 获得正数 ID 6. Tab ID 从 `tab-editor-draft-${负数}` 替换为 `tab-editor-${正数}` 7. `editingItemId` 更新为正数 8. 刷新后 Tab 丢失（未持久化），但文档数据在 IndexedDB 中保留 |
| **涉及模块** | Home → Editor → Dock |
| **涉及数据表** | IndexedDB: `dockItems`, `mindNodes`, `mindEdges`；React state: `drafts`, `tabs` |
| **是否需要刷新验证** | 是 — **草稿内容刷新后丢失**（未持久化），已保存文档刷新后可从 Dock 重新打开 |
| **风险等级** | 中 — 草稿未持久化是已知缺陷 |
| **当前是否 Demo Ready** | 部分可用 — 草稿刷新丢失可能误导用户 |
| **备注** | `drafts` Record 完全在内存中，刷新即丢失。repository 中有 `workspaceOpenTabs` 表但未被使用 |

### JOURNEY-004：Editor 编辑已有文档流程

| 字段 | 内容 |
|---|---|
| **Journey ID** | JOURNEY-004 |
| **前置条件** | 已有 DockItem（通过 Capture 或 Seed 创建） |
| **操作步骤** | 1. 从 Home 最近条目点击打开 2. 或从 Dock Detail Panel 点击 "Edit Content" 3. 修改标题 4. 修改正文 5. 观察 dirty 标记（"未保存" 文案） 6. 点击保存 7. 切换到 Dock 查看更新 8. 刷新页面 9. 重新打开文档验证 |
| **预期结果** | 1. `openEditorTab(itemId)` 创建 `tab-editor-${itemId}` Tab 2. 加载 `item.topic` 和 `item.rawText` 到编辑器 3. 修改后 `dirty = true`，保存按钮显示 "未保存" 4. 保存时 `handleSaveEditor` 检测 `editingItemId > 0` → 调用 `updateDockItemText(userId, editingItemId, editorContent)` 5. `refreshAll()` 刷新数据 6. Dock 中条目内容已更新 7. 刷新后重新打开，内容保留 |
| **涉及模块** | Home/Dock → Editor → Dock |
| **涉及数据表** | IndexedDB: `dockItems`（`updateDockItemText`） |
| **是否需要刷新验证** | 是 — 验证 `updateDockItemText` 写入持久化 |
| **风险等级** | 低 |
| **当前是否 Demo Ready** | 是 |
| **备注** | `updateDockItemText` 仅更新 `rawText` 和 `topic`，不更新 `updatedAt` 时间戳（需验证） |

### JOURNEY-005：Dock 整理流程

| 字段 | 内容 |
|---|---|
| **Journey ID** | JOURNEY-005 |
| **前置条件** | 已登录用户，Dock 模块有条目 |
| **操作步骤** | 1. 切换到 Dock 模块 2. 点击 Grid/List/Columns 切换视图 3. 在搜索框输入关键词 4. 点击左侧 Inbox/Archive 状态筛选 5. 点击标签筛选 6. 点击项目筛选 7. 点击某个条目 8. 在 Detail Panel 点击 "生成建议" 9. 点击 "Edit Content" 10. 点击 "View in Graph" 11. 点击 + Folder 按钮 12. 点击 More 菜单 |
| **预期结果** | 1. 三种视图正确切换 2. 搜索实时过滤（按 topic/rawText 大小写不敏感匹配） 3. 状态筛选正确 4. 标签筛选正确（硬编码标签列表：physics/algo/book/技术/产品/学习） 5. 项目筛选正确（硬编码项目：Core Architecture/Personal Growth） 6. 选中条目高亮，Detail Panel 展示 7. "生成建议" → `suggestItem` → 状态变为 suggested 8. "Edit Content" → 打开 Editor Tab 9. "View in Graph" → 切换到 Mind（有关联节点时）或 Toast 提示 10. "+ Folder" → 创建 mock 文件夹（**刷新后消失**） 11. More → "Sort by Date" / "Export" 为 mock Toast |
| **涉及模块** | Dock → Editor / Mind |
| **涉及数据表** | IndexedDB: `dockItems`（`suggestItem`）；React state: `viewMode`, `filterStatus`, `selectedProject`, `selectedTag`, `mockFolderNodes` |
| **是否需要刷新验证** | 是 — 视图模式/筛选状态/搜索词刷新后重置；mock 文件夹刷新后消失 |
| **风险等级** | 中 — Mock 功能可能误导用户 |
| **当前是否 Demo Ready** | 部分可用 — 核心浏览/搜索可用，Folder 和 Sort/Export 为 mock |
| **备注** | Dock 的 Add Tag 功能为 mock（Toast "Tag added (mock)"，不写库） |

### JOURNEY-006：Mind 图谱流程

| 字段 | 内容 |
|---|---|
| **Journey ID** | JOURNEY-006 |
| **前置条件** | 已登录用户，Mind 模块有节点数据 |
| **操作步骤** | 1. 切换到 Mind 模块 2. 在空白区域拖拽平移 3. 滚轮缩放 4. 点击右下角居中按钮 5. 点击 HUD 面板切换 Radial/Force/Orbit 布局 6. 点击 Filters 展开筛选 7. 搜索关键词 8. 点击某个节点 9. 在 Node Detail Panel 点击 "Open in Editor" 10. 拖拽节点 A 靠近节点 B（< 60px）释放 11. 刷新页面验证 edge 保留 12. 在 Node Detail Panel 点击 Unlink 13. 刷新页面验证 edge 删除 |
| **预期结果** | 1. 画布平移正常 2. 缩放 0.3~4x 范围内正常 3. 居中重置 zoom=1 4. 三种布局动画过渡 5. 筛选/搜索正常 6. 点击节点 → 高亮 + Detail Panel 7. "Open in Editor" → 查找关联 DockItem → 打开 Editor Tab（无关联则无响应） 8. 拖拽连线 → `upsertMindEdge` 写入 IndexedDB → Toast "Edge synced to knowledge graph" 9. 刷新后 edge 保留 10. Unlink → `db.table('mindEdges').delete(edge.id)` → Toast "Edge removed from knowledge graph" 11. 刷新后 edge 删除保持 |
| **涉及模块** | Mind → Editor |
| **涉及数据表** | IndexedDB: `mindEdges`（`upsertMindEdge` / 直接 Dexie delete）；React state: `layoutMode`, `focusedNode`, 筛选状态 |
| **是否需要刷新验证** | 是 — edge 创建/删除必须验证持久化 |
| **风险等级** | 中 — 边删除绕过 repository 层直接操作 Dexie（L795），不一致 |
| **当前是否 Demo Ready** | 是（核心功能可用） |
| **备注** | 无真实 domain 节点时，使用硬编码虚拟域名列表填充画布（L192）；节点位置（positionX/Y）拖拽后未回写 DB |

### JOURNEY-007：Quick Note 流程

| 字段 | 内容 |
|---|---|
| **Journey ID** | JOURNEY-007 |
| **前置条件** | 已登录用户，Workspace 任意模块 |
| **操作步骤** | 1. 点击右下角 Hot Corner 三角形区域 2. Quick Note 窗口弹出 3. 输入标题 4. 输入正文 5. 拖拽窗口移动位置 6. 拖拽右下角调整窗口大小 7. 点击黄色按钮最小化 8. 点击右侧 Tab 把手恢复 9. 点击红色 X 关闭（有内容时自动保存） 10. 切换到 Dock/Home/Mind 验证新条目 11. 刷新页面验证数据保留 |
| **预期结果** | 1. Hot Corner hover 高亮，点击打开 2. 窗口弹出（288x320px，min 250x200，max 600x500） 3. 标题/内容实时更新 4. 拖拽移动正常（Pointer Events） 5. resize 正常 6. 最小化后右侧出现 Tab 把手 7. 恢复后窗口回到之前位置 8. 关闭时若有内容 → `handleQuickNoteSave(text, title)` → `createDockItem` + `createSourceNodeWithRoot` → Toast 提示 9. 标题自动生成为 `${timestamp}_idea_01` 10. Dock/Home/Mind 出现新条目 11. 刷新后数据保留 |
| **涉及模块** | QuickNote → Dock/Home/Mind |
| **涉及数据表** | IndexedDB: `dockItems`, `mindNodes`, `mindEdges` |
| **是否需要刷新验证** | 是 — 验证保存后数据持久化 |
| **风险等级** | 低 |
| **当前是否 Demo Ready** | 是 |
| **备注** | 标题后缀 `_idea_01` 硬编码不递增（QuickNote.tsx L65），多次保存产生同名标题；绿色全屏按钮未实现 |

### JOURNEY-008：Floating Recorder Classic 流程

| 字段 | 内容 |
|---|---|
| **Journey ID** | JOURNEY-008 |
| **前置条件** | 已登录用户 |
| **操作步骤** | 1. 点击 TopNav + 按钮 2. 底部弹出 Classic 模式录制器 3. 在 textarea 输入文字 4. 点击保存按钮或 Ctrl/Cmd+Enter 5. 等待 Toast 提示 6. 切换到 Dock/Mind 验证 7. 刷新页面验证 |
| **预期结果** | 1. `setRecorderState('classic')` 打开录制器 2. 显示 textarea + 保存按钮 3. 输入正常 4. `handleSubmit` → `onCapture(inputText.trim())` → `handleCapture` → `createDockItem` + `createSourceNodeWithRoot` 5. Toast 提示成功 6. Dock/Mind 出现新条目 7. 刷新后数据保留 |
| **涉及模块** | TopNav → FloatingRecorder → Dock/Mind |
| **涉及数据表** | IndexedDB: `dockItems`, `mindNodes`, `mindEdges` |
| **是否需要刷新验证** | 是 — 验证数据持久化 |
| **风险等级** | 低 |
| **当前是否 Demo Ready** | 是 |
| **备注** | Classic 模式为多行 textarea，保存按钮需点击或快捷键 |

### JOURNEY-009：Floating Recorder Chat 流程

| 字段 | 内容 |
|---|---|
| **Journey ID** | JOURNEY-009 |
| **前置条件** | 已登录用户 |
| **操作步骤** | 1. 点击 TopNav + 按钮 2. 切换到 Chat 模式 3. 在单行 input 输入文字 4. 按 Enter 或点击发送按钮 5. 等待 Toast 提示 6. 切换到 Dock/Mind 验证 7. 刷新页面验证 |
| **预期结果** | 1. `setRecorderState('chat')` 打开录制器 2. Chat 模式为单行 input + 发送按钮 3. 输入正常 4. `handleSubmit` → `onCapture(inputText.trim())` → `handleCapture` → `createDockItem` + `createSourceNodeWithRoot` 5. Toast 提示成功 6. Dock/Mind 出现新条目 7. 刷新后数据保留 |
| **涉及模块** | TopNav → FloatingRecorder → Dock/Mind |
| **涉及数据表** | IndexedDB: `dockItems`, `mindNodes`, `mindEdges` |
| **是否需要刷新验证** | 是 — 验证数据持久化 |
| **风险等级** | 中 — **Step2 文档描述的多步引导流程（topic→type→content→confirm）在当前代码中不存在**，Chat 模式仅为简单单行输入 |
| **当前是否 Demo Ready** | 部分可用 — Chat 模式功能与 Classic 相同，无差异化价值 |
| **备注** | `ChatGuidanceService` 存在于 `packages/domain/src/services/ChatGuidanceService.ts` 但**未被前端调用**。当前 FloatingRecorder 的 Chat 模式（page.tsx L1614-1621）仅为单行 input，无多步引导 |

### JOURNEY-010：Mock 暴露风险流程

| 字段 | 内容 |
|---|---|
| **Journey ID** | JOURNEY-010 |
| **前置条件** | 已登录用户 |
| **操作步骤** | 1. 点击 Editor → EditorOptionsMenu → Rename → 观察 Toast 2. 点击 Move to... → 观察 Toast 3. 点击 Export as PDF → 观察 Toast 4. 点击 Delete → 观察 Toast 5. 点击 Context Links 面板图标 → 点击 mock 文档卡片 6. 点击 Dock + Folder → 刷新验证消失 7. 点击 Dock Add Tag → 验证不写库 8. 点击 Dock More → Sort by Date / Export 9. 点击 Sidebar + → Project Folder → 刷新验证消失 10. 点击 Sidebar + → Calendar/Tasks/Weather Widget 11. 点击 TopNav 搜索 → 查看硬编码建议 12. 点击 TopNav 用户菜单 → Account/Subscription/Settings/Feedback 13. 点击 Floating Chat Panel → 输入消息 → 查看 mock 回复 14. 点击 Chat + / Sliders / Mic 按钮 15. 点击 Tab ••• → From Template 16. 访问 `/` 着陆页 → 检查底部链接 17. 查看 TopNav 用户菜单 "Pro Plan" 标签 |
| **预期结果** | 所有上述操作均应显示 "coming soon" / mock Toast 或硬编码内容，无真实业务动作。逐项记录是否会误导用户认为功能已实现 |
| **涉及模块** | 全模块 |
| **涉及数据表** | 无（均为 mock/硬编码） |
| **是否需要刷新验证** | 部分 — Mock Folder/Widget 刷新后消失 |
| **风险等级** | 高 — 多处 mock 可能误导 Demo 观众 |
| **当前是否 Demo Ready** | 否 — 需要隐藏或标注 |
| **备注** | 详见第 13 章「Demo 风险与隐藏策略」 |

---

## 11. 核心状态流验证

### 11.1 Auth 状态流

| 状态名 | 触发动作 | 状态变化 | 数据是否写入 | 刷新后是否保留 | 当前风险 |
|---|---|---|---|---|---|
| 未登录 | 首次访问 `/workspace` | `user = null`, `authChecked = true` | 否 | N/A | 低 |
| 注册 | 输入用户名 → 点击"进入工作区" | `user = LocalUser`, localStorage 写入 `atlax_user_directory` + `atlax_current_user` | 是（localStorage） | 是 | 低 — 同名用户自动登录而非报错 |
| 已登录 | 页面加载 | `getCurrentUser()` → `user = LocalUser` | 否（读取） | 是 | 低 |
| 刷新恢复 | F5 / Cmd+R | `useEffect` → `getCurrentUser()` → 恢复 `user` | 否（读取） | 是 | 低 |
| 退出登录 | TopNav → Log Out | `logoutUser()` → `localStorage.removeItem('atlax_current_user')` → `setUser(null)` | 是（删除 localStorage） | 退出后不保留 | 低 |

### 11.2 DockItem 状态流

| 状态名 | 触发动作 | 状态变化 | 数据是否写入 | 刷新后是否保留 | 当前风险 |
|---|---|---|---|---|---|
| pending | `createDockItem` 创建 | `status: 'pending'` | 是（IndexedDB: dockItems） | 是 | 低 |
| suggested | `suggestItem` | `status: 'suggested'` + 生成 suggestions | 是（IndexedDB: dockItems） | 是 | 低 |
| archived | `archiveItem` | `status: 'archived'` + 创建 Entry | 是（IndexedDB: dockItems + entries） | 是 | 低 |
| ignored | `ignoreItem` | `status: 'ignored'` | 是（IndexedDB: dockItems） | 是 | 低 |
| reopened | `reopenItem` | `status: 'reopened'` + 从 Entry 恢复标签 | 是（IndexedDB: dockItems） | 是 | 低 |

**状态流转图**：`pending` → `suggested` → `archived` / `ignored` → `reopened`

### 11.3 Editor 草稿状态流

| 状态名 | 触发动作 | 状态变化 | 数据是否写入 | 刷新后是否保留 | 当前风险 |
|---|---|---|---|---|---|
| 未创建 | 初始状态 | 无草稿 Tab | 否 | N/A | 低 |
| 草稿 Tab | `createDraftTab()` | 创建负数 ID Tab，`drafts[负数ID] = { title: '', content: '' }` | 否（React state only） | **否 — 刷新丢失** | **高 — 用户可能丢失未保存草稿** |
| dirty | 修改标题/内容 | `dirty = true`，`drafts[负数ID]` 同步更新 | 否（React state only） | **否 — 刷新丢失** | **高** |
| saved（草稿→真实） | 点击保存 | `createDockItem` → 正数 ID → Tab ID 替换 → `drafts` 清除 | 是（IndexedDB: dockItems + mindNodes + mindEdges） | 是 | 低 |
| existing document | `openEditorTab(itemId)` | 加载已有 DockItem 数据到编辑器 | 否（从 IndexedDB 读取） | 是（数据在 IndexedDB） | 低 |
| dirty（已有文档） | 修改标题/内容 | `dirty = true` | 否（React state only） | **否 — 刷新丢失修改** | **中 — 未保存修改刷新后丢失** |
| saved（已有文档） | 点击保存 | `updateDockItemText` → `dirty = false` | 是（IndexedDB: dockItems） | 是 | 低 |
| close tab | 点击 Tab X | 从 `tabs` 移除；草稿 Tab 同时清除 `drafts` | 否 | N/A | 低 |

### 11.4 Workspace Tab 状态流

| 状态名 | 触发动作 | 状态变化 | 数据是否写入 | 刷新后是否保留 | 当前风险 |
|---|---|---|---|---|---|
| module tab | `handleModuleChange('home'/'mind'/'dock')` | 创建 `tab-${mod}` Tab，`isPinned: false` | 否（React state only） | **否 — 刷新丢失** | 中 — repository 有 `workspaceOpenTabs` 表但未使用 |
| document tab | `openEditorTab(itemId)` | 创建 `tab-editor-${itemId}` | 否（React state only） | **否 — 刷新丢失** | 中 |
| draft tab | `createDraftTab()` | 创建 `tab-editor-draft-${负数ID}` | 否（React state only） | **否 — 刷新丢失** | 高 |
| pinned tab | 双击 Tab / 点击 Pin | `isPinned` flip | 否（React state only） | **否 — 刷新丢失** | 低 |
| active tab | 点击 Tab | `activeTabId` 更新 | 否（React state only） | **否 — 刷新丢失** | 低 |
| close tab | 点击 Tab X | 从 `tabs` 移除，自动激活相邻 Tab | 否 | N/A | 低 |
| active tab fallback | 关闭当前 active tab | 激活排序最后的 Tab；无 Tab 则 `activeTabId = null` | 否 | N/A | 低 |

**关键发现**：repository.ts 中存在完整的 `openWorkspaceTab` / `closeWorkspaceTab` / `activateWorkspaceTab` / `pinWorkspaceTab` / `restoreWorkspaceTabs` 函数（L1504-L1630），均写入 `workspaceOpenTabs` 和 `workspaceSessions` 表，但 **workspace/page.tsx 完全未调用这些函数**，Tab 管理完全依赖 React state。

### 11.5 Mind Edge 状态流

| 状态名 | 触发动作 | 状态变化 | 数据是否写入 | 刷新后是否保留 | 当前风险 |
|---|---|---|---|---|---|
| 不存在 | 初始状态 | 无 edge | N/A | N/A | 低 |
| 创建 semantic edge | Mind 画布拖拽节点靠近另一节点（< 60px）释放 | 本地图添加 edge → `upsertMindEdge({ edgeType: 'net', strength: 0.5, source: 'user' })` | 是（IndexedDB: mindEdges） | 是 | 低 |
| 显示在 Canvas | 数据加载 | `mindEdges` 列表渲染到 Canvas | 否（读取） | 是 | 低 |
| 刷新恢复 | F5 / Cmd+R | `refreshAll()` → `listMindEdges(userId)` → 重新渲染 | 否（读取） | 是 | 低 |
| unlink 删除 | Node Detail Panel → Unlink | 本地图删除 edge → `db.table('mindEdges').delete(edge.id)` | 是（IndexedDB 删除） | 是 | 中 — **绕过 repository 层直接操作 Dexie** |
| 刷新后删除保持 | F5 / Cmd+R | edge 不再出现 | 否（读取） | 是 | 低 |

**关键发现**：边删除操作（page.tsx L795）使用 `db.table('mindEdges').delete(edge.id)` 直接操作 Dexie，绕过了 repository 层的 `deleteMindEdge` 函数（repository.ts L1463-L1468），导致数据访问层不一致。

### 11.6 Recorder Chat 状态流

> **重要修正**：当前 FloatingRecorder 的 Chat 模式（page.tsx L1614-1621）**未接入** `ChatGuidanceService`。以下描述基于当前真实代码行为。

| 状态名 | 触发动作 | 状态变化 | 数据是否写入 | 刷新后是否保留 | 当前风险 |
|---|---|---|---|---|---|
| closed | 初始状态 / 点击最小化 | `recorderState = 'closed'` | 否 | N/A | 低 |
| classic | TopNav + 按钮 / Dock More → New Capture | `recorderState = 'classic'` | 否 | N/A | 低 |
| chat | 切换到 Chat 模式 | `recorderState = 'chat'` | 否 | N/A | 低 |
| input | 在 Classic textarea 或 Chat input 输入 | `inputText` 更新 | 否（React state only） | 否 | 低 |
| submitting | 点击保存/发送 | `submitting = true` → `onCapture(inputText)` → `createDockItem` + `createSourceNodeWithRoot` | 是（IndexedDB） | 是 | 低 |
| done | 提交完成 | `inputText = ''`, `submitting = false` | 否 | N/A | 低 |

**ChatGuidanceService 状态流（已实现但未接入前端）**：

| 状态名 | 触发动作 | 状态变化 | 当前是否接入前端 |
|---|---|---|---|
| idle | 初始状态 | `step: 'idle'` | 否 |
| awaiting_topic | `start()` | `step: 'awaiting_topic'` | 否 |
| awaiting_type | `submitTopic(topic)` | `step: 'awaiting_type'` | 否 |
| awaiting_content | `submitType(type)` | `step: 'awaiting_content'` | 否 |
| awaiting_confirmation | `submitContent(content)` | `step: 'awaiting_confirmation'` | 否 |
| confirmed | `confirm()` | `step: 'confirmed'` → 可调用 `handleCapture` | 否 |
| cancelled | `cancel()` | `step: 'cancelled'` → 可 `refill` 回到某步 | 否 |

---

## 12. 刷新后持久化验证清单

| ID | 功能 | 操作 | 写入位置 | 刷新后预期 | 当前风险 |
|---|---|---|---|---|---|
| PERSIST-001 | 用户注册 | 输入用户名注册 | localStorage (`atlax_user_directory` + `atlax_current_user`) | 保留 | 低 |
| PERSIST-002 | 用户登录恢复 | 刷新页面 | localStorage (`atlax_current_user`) | 自动恢复 | 低 |
| PERSIST-003 | Home Capture | 输入文字 → Enter | IndexedDB (`dockItems` + `mindNodes` + `mindEdges`) | 保留 | 低 |
| PERSIST-004 | Editor 草稿保存 | 草稿 Tab → 输入 → 保存 | IndexedDB (`dockItems` + `mindNodes` + `mindEdges`) | 保留 | 低 |
| PERSIST-005 | Editor 已有文档保存 | 修改 → 保存 | IndexedDB (`dockItems`) | 保留 | 低 |
| PERSIST-006 | Editor 草稿内容 | 草稿 Tab → 输入（未保存） | React state (`drafts` Record) | **丢失** | **高 — 不可接受** |
| PERSIST-007 | Editor 已有文档修改 | 修改（未保存） | React state (`editorContent`, `editorTitle`) | **丢失** | **中 — 可接受（用户应主动保存）** |
| PERSIST-008 | Workspace Tabs | 打开/切换/关闭 Tab | React state (`tabs`, `activeTabId`) | **丢失** | **高 — 不可接受**（repository 有 `workspaceOpenTabs` 表但未使用） |
| PERSIST-009 | Mind 拖拽连线 | 拖拽节点靠近另一节点 | IndexedDB (`mindEdges`) | 保留 | 低 |
| PERSIST-010 | Mind 断开连接 | Unlink edge | IndexedDB (`mindEdges` 直接 Dexie delete) | 保留 | 低 |
| PERSIST-011 | Mind 画布平移/缩放 | 拖拽/滚轮 | React state (Canvas `cameraRef`) | **丢失** | **可接受**（相机状态无需持久化） |
| PERSIST-012 | Mind 布局模式 | 切换 Radial/Force/Orbit | React state (`layoutMode`) | **丢失** | **可接受** |
| PERSIST-013 | Mind 筛选状态 | 搜索/过滤 | React state (`filterSearch`, `showDocuments` 等) | **丢失** | **可接受** |
| PERSIST-014 | Mind 节点位置 | 拖拽节点移动 | Canvas 本地坐标（未回写 DB） | **丢失** | **中 — 节点回到布局计算位置** |
| PERSIST-015 | Dock 视图模式 | Grid/List/Columns 切换 | React state (`viewMode`) | **丢失** | **可接受** |
| PERSIST-016 | Dock 筛选状态 | 状态/标签/项目筛选 | React state (`filterStatus`, `selectedProject`, `selectedTag`) | **丢失** | **可接受** |
| PERSIST-017 | Dock 搜索词 | 输入搜索 | React state (`dockSearch`) | **丢失** | **可接受** |
| PERSIST-018 | Dock Mock Folder | 点击 + Folder | React state (`mockFolderNodes`) | **丢失** | **不可接受 — Mock 功能** |
| PERSIST-019 | Dock 生成建议 | 点击"生成建议" | IndexedDB (`dockItems`) | 保留 | 低 |
| PERSIST-020 | Dock Add Tag | 点击 + 添加标签 | **无写入**（Mock Toast） | **不保留** | **高 — 不可接受**（应调用 `addTagToItem`） |
| PERSIST-021 | Quick Note 保存 | 关闭时自动保存 | IndexedDB (`dockItems` + `mindNodes` + `mindEdges`) | 保留 | 低 |
| PERSIST-022 | Quick Note 窗口位置/大小 | 拖拽/resize | React state (inline style) | **丢失** | **可接受** |
| PERSIST-023 | Floating Recorder Classic | 输入 → 保存 | IndexedDB (`dockItems` + `mindNodes` + `mindEdges`) | 保留 | 低 |
| PERSIST-024 | Floating Recorder Chat | 输入 → 发送 | IndexedDB (`dockItems` + `mindNodes` + `mindEdges`) | 保留 | 低 |
| PERSIST-025 | Sidebar Widget | 添加/移除 Widget | React state (`widgets`) | **丢失** | **可接受**（Widget 本身为硬编码） |
| PERSIST-026 | Sidebar Pin 状态 | 点击 Pin | React state (`isPinned`) | **丢失** | **低 — 可接受** |
| PERSIST-027 | Chat 消息 | 发送消息 | React state (`messages`) | **丢失** | **可接受**（全 Mock 无需持久化） |
| PERSIST-028 | TopNav 搜索状态 | 展开/输入 | React state (`isSearchMode`) | **丢失** | **可接受** |
| PERSIST-029 | TopNav 收起位置 | 拖拽 Logo | React state (`navPosition`) | **丢失** | **可接受** |
| PERSIST-030 | Tab Pin 状态 | 双击/点击 Pin | React state (`tabs[i].isPinned`) | **丢失** | **低 — 可接受** |
| PERSIST-031 | 旧版 Dock 状态流转 | suggest/archive/ignore/restore | IndexedDB (`dockItems` + `entries`) | 保留 | 低 |
| PERSIST-032 | Capture 页面保存 | 输入 → 保存 | IndexedDB (`dockItems`) | 保留 | 低 |
| PERSIST-033 | Seed 填充/清除 | 点击按钮 | IndexedDB (全部表) | 保留 | 低 |

**持久化分类汇总**：

| 分类 | 数量 | 说明 |
|---|---|---|
| IndexedDB 持久化 | 15 | 核心数据链路完整 |
| localStorage 持久化 | 2 | 仅 Auth 相关 |
| React state only（刷新丢失，可接受） | 12 | 视图/筛选/相机等临时状态 |
| React state only（刷新丢失，不可接受） | 3 | **草稿内容**、**Tab 状态**、**Dock Add Tag** |
| Mock / Hardcoded（不涉及持久化） | 1 | Dock Mock Folder |

---

## 13. Demo 风险与隐藏策略

### 13.1 Demo 必须隐藏

| 功能名 | 当前表现 | 用户误解风险 | 建议处理方式 | 优先级 |
|---|---|---|---|---|
| Floating Chat Panel | 右下角 hover 显示 Sparkles 按钮 → 弹出聊天面板 → 输入消息返回 mock 英文回复 | **极高** — 用户会认为 AI 功能已实现，输入中文无响应、回复内容无关 | 移除触发按钮或添加 "AI 功能开发中" 水印遮罩 | P0 |
| Sidebar Weather Widget | 硬编码 "Tokyo,JP / Mostly Sunny / 21°" | **高** — 用户认为天气功能已接入 | 从 Widget 添加菜单中移除 | P1 |
| Sidebar Tasks Widget | 硬编码 "Refactor Sidebar"/"Fix TopNav Bug"，checkbox 不可交互 | **高** — 用户认为任务管理已实现 | 从 Widget 添加菜单中移除 | P1 |
| Dock + Folder | 点击创建 mock 文件夹，刷新后消失 | **高** — 用户认为文件夹功能已实现，刷新后丢失造成困惑 | 隐藏 + Folder 按钮，或添加 "开发中" 标签 | P1 |
| Sidebar + → Project Folder | 同 Dock + Folder，创建 mock 文件夹 | **高** — 同上 | 隐藏菜单项 | P1 |

### 13.2 Demo 可展示但必须标注 Coming soon

| 功能名 | 当前表现 | 用户误解风险 | 建议处理方式 | 优先级 |
|---|---|---|---|---|
| Editor Rename | 菜单项 → Toast "Rename coming soon" | 中 — 用户可能认为功能存在但出 bug | 菜单项添加 `🔒` 或灰色 + "Coming soon" 文字 | P1 |
| Editor Move to... | 菜单项 → Toast "Move to... coming soon" | 中 — 同上 | 同上 | P1 |
| Editor Delete | 菜单项 → Toast "Delete coming soon" | **高** — 用户可能误以为删除成功 | 菜单项添加红色 "Coming soon" 标签 | P0 |
| Editor Export as PDF | 菜单项 → Toast "Export as PDF coming soon" | 低 — 导出非核心流程 | 菜单项灰色 + "Coming soon" | P2 |
| TopNav 搜索建议 | 硬编码 3 条建议（Graph Engine Physics / World Tree / Context Nudge） | 中 — 用户认为搜索功能已实现 | 搜索面板添加 "搜索功能开发中" 提示 | P1 |
| TopNav Account/Subscription/Settings/Feedback | 4 个菜单项均 Toast "coming soon" | 低 — 非核心流程 | 菜单项灰色 + "Coming soon" | P2 |
| Tab From Template | 菜单项 → Toast "Template gallery coming soon" | 低 | 菜单项灰色 + "Coming soon" | P3 |
| Dock Add Tag | + 按钮 → Toast "Tag added (mock)" | **高** — 用户认为标签已添加，刷新后消失 | 禁用按钮 + "Coming soon" tooltip | P0 |
| Dock More → Sort by Date / Export | 2 个菜单项 Toast mock | 低 | 菜单项灰色 + "Coming soon" | P2 |
| Block 拖拽排序 | 拖拽 Block 行 → Toast "Block moved (mock reorder)" | 中 — 用户认为排序已生效 | 拖拽手柄添加 "开发中" 提示 | P2 |
| Context Links 面板 | 3 个硬编码文档卡片，点击 Toast mock | 中 — 用户认为关联推荐已实现 | 面板标题添加 "Coming soon" 标签 | P2 |
| Sidebar Calendar Widget | 硬编码 "April 2026" 日历 | 中 — 用户认为日历已接入 | Widget 标题添加 "Demo" 标签 | P2 |
| TopNav "Pro Plan" 标签 | 用户菜单中硬编码 "Pro Plan" | 低 — 但可能涉及法律风险 | 改为 "Free Plan" 或移除 | P2 |

### 13.3 Demo 可以保留，因为不影响主流程

| 功能名 | 当前表现 | 用户误解风险 | 建议处理方式 | 优先级 |
|---|---|---|---|---|
| 着陆页底部链接 | "Phase 2 Preview" / "架构与设计系统演示" 无实际链接 | 低 — 无点击行为 | 保留，hover 样式可弱化 | P3 |
| Classic 预览面板 | 纯文本展示，无 Markdown 渲染 | 低 — 用户可理解预览为简化版 | 保留，后续集成 Markdown 渲染 | P1（功能补齐） |
| Sidebar AI Chat 模式 | 输入 → 调用 `onCapture`（创建 DockItem），非 AI 对话 | 低 — 行为与 Capture 一致 | 保留，但标题改为 "Quick Capture" 更准确 | P3 |
| Mind 虚拟域名 | 无真实 domain 节点时自动生成虚拟域名 | 低 — 有数据时不显示 | 保留 | P3 |
| Nebula Background | 简化版星云动画，非 Mind 同引擎 | 低 — 纯装饰 | 保留 | P3 |
| Quick Note 标题生成 | 硬编码 `${timestamp}_idea_01` | 低 — 功能可用但标题不优雅 | 保留，后续优化标题生成逻辑 | P3 |

---

## 14. 看板导入表

> 基于 Step2 功能清单 + Step3 代码扫描生成。优先 P0/P1 任务。

| Task ID | Title | Module | Type | Priority | Current State | Target State | Status | Backend Needed | Persistence Needed | Test Journey | Source File | Risk | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TASK-001 | Workspace Tabs 持久化 | Workspace Tabs | Backend Integration | P0 | React State Only | MVP Ready | Todo | 否 | workspaceOpenTabs 表 | JOURNEY-003 | page.tsx L57-60 | 高 | repository 已有完整 API（L1504-1630），仅需前端接入 |
| TASK-002 | Editor 草稿自动保存 | Editor | Feature | P0 | React State Only | MVP Ready | Todo | 否 | drafts 写入 IndexedDB | JOURNEY-003 | page.tsx L74 | 高 | 草稿刷新丢失，用户可能丢失未保存内容 |
| TASK-003 | Dock Add Tag 接入真实 API | Dock | Mock Replacement | P0 | Mock | MVP Ready | Todo | 否 | addTagToItem + createStoredTag | JOURNEY-005 | page.tsx L1163 | 高 | 当前 Toast mock 不写库，用户以为标签已添加 |
| TASK-004 | Floating Chat Panel 隐藏或标注 | Chat | Hide for Demo | P0 | Mock | Hidden | Todo | 是 | 无 | JOURNEY-010 | FloatingChatPanel.tsx | 高 | 全 Mock 回复，Demo 时极易误导 |
| TASK-005 | Editor Delete 接入真实实现 | Editor | Mock Replacement | P0 | Mock | MVP Ready | Todo | 否 | DockItem 删除 + 关联清理 | JOURNEY-010 | page.tsx L900 | 高 | 用户可能误以为删除成功 |
| TASK-006 | Dock Folder 持久化 | Dock | Mock Replacement | P1 | Mock | MVP Ready | Todo | 否 | collections 表 | JOURNEY-005 | page.tsx L953-999 | 中 | repository 已有 createCollection API |
| TASK-007 | Sidebar Project Folder 持久化 | Sidebar | Mock Replacement | P1 | Mock | MVP Ready | Todo | 否 | collections 表 | JOURNEY-010 | GlobalSidebar.tsx L117-162 | 中 | 同 TASK-006，应统一实现 |
| TASK-008 | Classic 预览集成 Markdown 渲染 | Editor | Feature | P1 | 部分可用 | MVP Ready | Todo | 否 | 无 | JOURNEY-004 | EditorTabView.tsx L382-384 | 中 | 当前仅 whitespace-pre-wrap 纯文本 |
| TASK-009 | Editor Rename 接入真实实现 | Editor | Mock Replacement | P1 | Mock | MVP Ready | Todo | 否 | updateDockItemText 修改 topic | JOURNEY-010 | page.tsx L890 | 中 | |
| TASK-010 | Editor Move to... 接入真实实现 | Editor | Mock Replacement | P1 | Mock | MVP Ready | Todo | 否 | updateSelectedProject | JOURNEY-010 | page.tsx L893 | 中 | |
| TASK-011 | Mind Edge 删除统一走 repository | Mind | Refactor | P1 | 可用 | MVP Ready | Todo | 否 | deleteMindEdge | JOURNEY-006 | page.tsx L795 | 中 | 当前直接操作 Dexie，绕过 repository 层 |
| TASK-012 | Sidebar Weather Widget 移除 | Sidebar | Hide for Demo | P1 | Hardcoded | Hidden | Todo | 否 | 无 | JOURNEY-010 | GlobalSidebar.tsx L150-155 | 中 | 硬编码东京天气，无意义 |
| TASK-013 | Sidebar Tasks Widget 移除 | Sidebar | Hide for Demo | P1 | Hardcoded | Hidden | Todo | 否 | 无 | JOURNEY-010 | GlobalSidebar.tsx L137-143 | 中 | 硬编码假任务 |
| TASK-014 | TopNav 搜索建议标注开发中 | TopNav | UX Polish | P1 | Hardcoded | Demo Ready | Todo | 否 | 无 | JOURNEY-010 | GoldenTopNav.tsx L48-52 | 中 | 硬编码建议内容 |
| TASK-015 | Floating Recorder Chat 接入 ChatGuidanceService | Recorder | Feature | P1 | 部分可用 | MVP Ready | Todo | 否 | 无 | JOURNEY-009 | page.tsx L1614-1621 | 中 | ChatGuidanceService 已实现但未接入前端 |
| TASK-016 | Mind 节点位置回写 | Mind | Feature | P2 | 可用 | MVP Ready | Todo | 否 | upsertMindNode 更新 positionX/Y | JOURNEY-006 | MindCanvasStage.tsx | 低 | 拖拽后位置未持久化 |
| TASK-017 | Editor Export as PDF | Editor | Feature | P2 | Mock | MVP Ready | Todo | 否 | PDF 生成库 | JOURNEY-010 | page.tsx L896 | 低 | |
| TASK-018 | Block 拖拽排序真实实现 | Editor | Mock Replacement | P2 | Mock | MVP Ready | Todo | 否 | 无 | JOURNEY-010 | EditorTabView.tsx L220 | 低 | |
| TASK-019 | Context Links 数据真实化 | Editor | Mock Replacement | P2 | Mock | MVP Ready | Todo | 是 | 基于标签/内容相似度推荐 | JOURNEY-010 | EditorTabView.tsx L396-408 | 低 | |
| TASK-020 | Dock Sort by Date 真实实现 | Dock | Mock Replacement | P2 | Mock | MVP Ready | Todo | 否 | 无 | JOURNEY-005 | page.tsx L1225 | 低 | |
| TASK-021 | Dock Export 真实实现 | Dock | Feature | P2 | Mock | MVP Ready | Todo | 否 | 导出逻辑 | JOURNEY-005 | page.tsx L1226 | 低 | |
| TASK-022 | TopNav 搜索真实化 | TopNav | Feature | P2 | 仅 UI | MVP Ready | Todo | 否 | 全局搜索逻辑 | JOURNEY-010 | GoldenTopNav.tsx | 低 | |
| TASK-023 | Sidebar Calendar Widget 数据真实化 | Sidebar | Mock Replacement | P2 | Hardcoded | MVP Ready | Todo | 否 | queryCalendarMonth | JOURNEY-010 | GlobalSidebar.tsx L127-128 | 低 | |
| TASK-024 | TopNav Account/Settings/Feedback 页面 | TopNav | Feature | P2 | Mock | MVP Ready | Todo | 是 | 账户管理后端 | JOURNEY-010 | GoldenTopNav.tsx L470-482 | 低 | |
| TASK-025 | TopNav "Pro Plan" 标签修正 | TopNav | UX Polish | P2 | Hardcoded | Demo Ready | Todo | 否 | 无 | JOURNEY-010 | GoldenTopNav.tsx L468 | 低 | 改为 "Free Plan" 或移除 |
| TASK-026 | Sidebar AI Chat 接入 LLM | Sidebar | Backend Integration | P2 | 仅 UI | MVP Ready | Todo | 是 | LLM API | JOURNEY-010 | GlobalSidebar.tsx L438-474 | 低 | |
| TASK-027 | Chat 附加功能（文件/模型/语音） | Chat | Feature | P2 | Mock | MVP Ready | Todo | 是 | 文件上传/语音 API | JOURNEY-010 | FloatingChatPanel.tsx L287-292 | 低 | |
| TASK-028 | Tab From Template | Workspace Tabs | Feature | P3 | Mock | MVP Ready | Todo | 是 | 模板系统 | JOURNEY-010 | WorkspaceTabs.tsx L122 | 低 | |
| TASK-029 | 着陆页底部链接修复 | Landing | Bug | P3 | 仅 UI | Demo Ready | Todo | 否 | 目标页面 | JOURNEY-010 | app/page.tsx L91-93 | 低 | 死链接 |
| TASK-030 | Quick Note 标题生成优化 | Quick Note | UX Polish | P3 | 可用 | MVP Ready | Todo | 否 | 无 | JOURNEY-007 | QuickNote.tsx L65 | 低 | `_idea_01` 不递增 |
| TASK-031 | Quick Note 全屏功能 | Quick Note | Feature | P3 | Mock | MVP Ready | Todo | 否 | 无 | JOURNEY-007 | QuickNote.tsx L229 | 低 | 绿色按钮未实现 |
| TASK-032 | Dock Add Block 按钮 | Editor | Mock Replacement | P3 | Mock | MVP Ready | Todo | 否 | 无 | JOURNEY-010 | EditorTabView.tsx L325 | 低 | "Add block below (mock)" |
| TASK-033 | TopNav Subscription 管理 | TopNav | Feature | P3 | Mock | Production Ready | Todo | 是 | 支付后端 | JOURNEY-010 | GoldenTopNav.tsx L474 | 低 | |
| TASK-034 | Mind 虚拟域名真实化 | Mind | Mock Replacement | P3 | Hardcoded | MVP Ready | Todo | 否 | 基于用户数据动态生成 | JOURNEY-006 | MindCanvasStage.tsx L192 | 低 | |

---

## 15. Step3 扫描新发现（Step2 未覆盖的问题）

### 15.1 Floating Recorder Chat 模式与 Step2 描述不符

- **Step2 描述**：Chat 模式为多步引导流程（topic → type → content → confirm），使用 `ChatGuidanceService` 状态机
- **实际代码**：当前 FloatingRecorder 的 Chat 模式（page.tsx L1614-1621）仅为单行 input + 发送按钮，与 Classic 模式功能完全相同，仅 UI 不同
- **ChatGuidanceService 状态**：已在 `packages/domain/src/services/ChatGuidanceService.ts` 完整实现（idle → awaiting_topic → awaiting_type → awaiting_content → awaiting_confirmation → confirmed/cancelled），但**未被前端调用**
- **影响**：Step2 中 REC-004 ~ REC-009 的描述与实际代码不符，需修正

### 15.2 Workspace Tabs 持久化 API 已存在但未使用

- repository.ts 中已有完整的 Tab 持久化 API：
  - `openWorkspaceTab` (L1504) — 打开标签页，自动去重 editor 类型
  - `closeWorkspaceTab` (L1563) — 关闭标签页，自动切换活跃标签
  - `activateWorkspaceTab` (L1594) — 激活标签页
  - `pinWorkspaceTab` (L1614) — 固定标签页
  - `restoreWorkspaceTabs` (L1624) — 恢复标签页列表
  - `getWorkspaceSession` (L1485) — 获取/创建工作区会话
- workspace/page.tsx 完全未调用这些函数，Tab 管理完全依赖 React state
- **修复成本极低**：只需将 `tabs`/`activeTabId` 的 useState 操作替换为 repository 函数调用

### 15.3 Mind Edge 删除绕过 Repository 层

- page.tsx L795 使用 `db.table('mindEdges').delete(edge.id)` 直接操作 Dexie
- repository.ts L1463-L1468 已有 `deleteMindEdge(userId, id)` 函数
- 应统一走 repository 层，保持数据访问一致性

### 15.4 QuickNote 标题硬编码问题

- QuickNote.tsx L65 标题生成逻辑为 `${timestamp}_idea_01`
- `_idea_01` 后缀永远不递增，多次保存会产生同名标题（仅 timestamp 部分不同）
- 绿色全屏按钮（L229）仅 Toast "not implemented yet"

### 15.5 Dock/Sidebar 项目和标签列表硬编码

- DockFinderView 中项目列表硬编码为 `['Core Architecture', 'Personal Growth']`（page.tsx L1247-1250）
- 标签列表硬编码为 `['physics', 'algo', 'book', '技术', '产品', '学习']`（page.tsx L1257）
- GlobalSidebar 中项目文件夹树全部硬编码（GlobalSidebar.tsx L326-399）
- 这些数据应从 IndexedDB 的 `tags` 表和 `collections` 表动态加载

### 15.6 Sidebar 文档列表硬编码

- GlobalSidebar.tsx L519-527 `sidebarDocuments` 硬编码为 `['Graph Engine Physics', 'Algorithm Design', 'Reading Notes']`
- 应从 IndexedDB 的 `entries` 表或 `dockItems` 表动态加载

### 15.7 Auth 注册同名用户行为

- auth.ts L44-62 `registerUser` 函数：若同名用户已存在，直接返回已有用户（不报错、不提示）
- 用户可能不知道自己登录的是已有账户还是新建账户

### 15.8 Editor 保存不更新 updatedAt

- `updateDockItemText` (repository.ts L436-454) 更新 `rawText` 和 `topic`，但需确认是否同时更新 `updatedAt` 时间戳
- 若未更新，Dock 中显示的修改时间不会变化