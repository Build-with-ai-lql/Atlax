# Atlax MindDock Phase 3 开发者预览版计划

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax MindDock |
| 文档版本 | v1.1 |
| 文档类型 | Phase 3 功能与体验计划 |
| 当前阶段 | Phase 3 Developer Preview |
| 最后更新 | 2026-04-25 |

---

## 1. 阶段定位

Phase 3 不再定义为泛泛的“体验打磨”，而是 Atlax MindDock 正式第一版上线前的开发者预览版。

Phase 3 必须把产品文档中已经承诺的主线功能做成较完整、可真实使用、可解释、可验证的版本，尤其补齐当前最弱的三件事：

- Markdown 编辑体验必须像正式知识工作台，而不是对象调试页。
- Dock / Entry 必须呈现结构、上下文和下一步动作，而不是普通文本详情。
- 智能归档必须可感知、可解释、可修正，并驱动真实 Review 数据。
- Entries 必须能展示文档链式关系与树状结构，体现“碎片自动长成知识树”的产品特色。
- Review 必须能反向向用户提问、生成周报和健康检查，而不是只展示静态数字。

Phase 3 的判断标准不是“功能是否存在”，而是用户是否能清楚感知 Atlax 的核心价值：输入内容后，系统帮助用户理解、归类、归档、回看和再次整理。

---

## 2. 参考产品能力总结

本节基于官方帮助文档提炼，不代表 Atlax 要完整复制 Obsidian 或 Notion，而是明确 Phase 3 应吸收的成熟体验。

参考来源：
- Obsidian Help: https://obsidian.md/help/
- Obsidian Views and editing mode: https://obsidian.md/help/edit-and-read
- Obsidian Basic formatting syntax: https://obsidian.md/help/Editing%2Band%2Bformatting/Basic%2Bformatting%2Bsyntax
- Obsidian Advanced formatting syntax: https://obsidian.md/help/advanced-syntax
- Obsidian Core plugins: https://obsidian.md/help/plugins
- Notion Help: https://www.notion.com/help
- Notion Writing and editing basics: https://www.notion.com/help/writing-and-editing-basics
- Notion Pages and blocks: https://www.notion.com/help/category/write-edit-and-customize
- Notion Databases: https://www.notion.com/help/category/databases
- Notion Views, filters, sorts and groups: https://www.notion.com/help/views-filters-and-sorts

### 2.1 Obsidian 值得吸收的能力

| 能力 | 官方产品表现 | Atlax Phase 3 吸收方式 |
|------|-------------|------------------------|
| Markdown 原生 | Markdown 是核心内容格式，支持标题、列表、链接、代码、表格、任务列表等 | Entry / DockItem 内容以 Markdown 为主格式，详情页支持正式渲染 |
| Reading / Editing / Source | 阅读视图、编辑视图、Live Preview、Source mode 可切换 | Phase 3 实现 Edit / Preview / Split，先不做完整 Live Preview |
| Side-by-side 阅读编辑 | 可并排打开编辑与阅读 | Split 模式左编辑右预览 |
| 可读行宽 | 支持 readable line length，长文阅读更舒适 | Preview 使用文档版心，不再像日志文本 |
| Properties | 属性位于文档顶部或侧边，承载 tags、aliases、cssclasses 等结构信息 | Tag、Project、Status、Type、Source 等进入 Context Panel |
| Tags / nested tags | Tag 支持正文与属性，支持层级 tag | Tag 作为结构骨架，Phase 3 强化高频 Tag、建议 Tag、用户修正 |
| Outline | 根据标题形成文档目录 | Phase 3 可在 Context Panel 中展示标题大纲或预留大纲区 |
| Backlinks / outgoing links | 显示当前笔记入链与出链 | Phase 3 只做 Related / Source / Project 轻量关系，不做复杂双链 |
| Search / Quick switcher | 快速查找与打开内容 | Phase 3 Browse 增强筛选、排序、快速打开 |
| Templates | 插入预定义内容 | Phase 3 可做 Entry 类型模板的接口预留，非主线不展开 |
| File recovery / workspace | 恢复、布局、工作区记忆 | Phase 3 至少保留 UI state、编辑模式、筛选状态持久化 |
| Bases | 基于属性的表格/视图/筛选 | Phase 3 Browse / Review 使用真实属性数据驱动视图 |
| Canvas / Graph | 空间化组织和关系理解 | Phase 3 不做完整 Canvas / 复杂图谱编辑器，但必须实现 Entries Graph Tree 基础点线树状结构视图 |

### 2.2 Notion 值得吸收的能力

| 能力 | 官方产品表现 | Atlax Phase 3 吸收方式 |
|------|-------------|------------------------|
| Page as workspace | 页面既是文档又能承载属性、子内容、动作 | Dock / Entry 详情升级为 MindDock Editor |
| Block 操作心智 | `+`、拖拽手柄、`/` 命令让内容创建和转换低成本 | Phase 3 不做 Block Editor，但在工具栏与快捷动作中吸收低摩擦操作 |
| Markdown shortcuts | 输入 `#`、`-`、`[]` 等可快速形成结构 | Phase 3 编辑器支持 Markdown 原生输入，不阻断快捷输入 |
| 多内容类型 | 标题、列表、待办、引用、代码、表格、图片、嵌入、数学等 | Phase 3 先支持 GFM 主线；图片/嵌入/数学后续扩展但不阻塞主文档体验 |
| Formatting toolbar | 选中文本出现格式操作 | Phase 3 可先做基础工具栏或快捷按钮，重点保证编辑/预览可靠 |
| Columns / simple tables | 文档内部可结构化排版 | Phase 3 支持 Markdown 表格渲染，暂不做拖拽列布局 |
| Table of contents | 页面可基于标题生成目录 | Phase 3 作为 Context Panel 可选增强 |
| Databases | 页面集合可按属性组织 | Phase 3 Browse / Review 必须基于真实 DockItem / Entry / Tag / Project 数据 |
| Views / filters / sorts / groups | 同一数据库可用列表、表格、看板、日历、图表等视图展示 | Phase 3 至少实现列表/表格、筛选、排序、分组；图表只用于 Review 真实数据 |
| Properties | 状态、负责人、日期、URL、最后编辑时间等属性支持筛选和排序 | Phase 3 属性面板与 Browse 筛选共用同一属性模型 |
| Relations / rollups | 数据库之间可建立关系并聚合 | Phase 3 实现 Project / Tag 聚合，复杂 rollup 后移 |
| Templates | 重复页面结构可一键复用 | Phase 3 预留类型模板，优先保证归档后的结构稳定 |
| Keyboard shortcuts | 搜索、跳转、新建、深浅色、数据库前后项切换等高频动作可键盘完成 | Phase 3 实现编辑器模式切换、保存、复制 Markdown、搜索/过滤基础快捷键 |
| Comments / suggest edits | 围绕内容做反馈与修订 | Phase 3 不做协作评论，但 Suggestion decision 需要像“修订记录”一样可追踪 |

### 2.3 对 Atlax 的产品取舍

Atlax 不做完整 Notion 式 Block Editor，也不复制 Obsidian 的复杂插件、图谱与双链学习成本。Phase 3 需要做的是把 Markdown 文档、结构属性、解释型建议、归档动作和 Review 数据编织成同一条主线。

---

## 3. Phase 3 总目标

| 目标 | 说明 |
|------|------|
| 编辑像编辑 | Dock / Entry 详情页升级为 MindDock Editor，支持正式 Markdown 编辑、预览、分屏和阅读排版 |
| 结构像结构 | 属性、Tag、Project、Status、Source、时间、大纲、建议和动作进入右侧 Context Panel |
| 智能归档可感知 | Suggestion 展示 reason、confidence、suggestedType、suggestedTags、suggestedProject，并支持用户决策 |
| Review 用真数据 | Review 统计来自真实 DockItem / Entry / Tag / Project，不允许假数据和装饰性报告 |
| Browse 可回用 | Browse 支持筛选、排序、分组、打开、再次整理，不只是归档列表 |
| Chat 推动主线 | Chat 追问、整理推动、回顾触发都必须落回 Dock / Entry / Review，不做孤立对话 |
| 结构可视化 | Entries 支持列表、表格、点线树状视图；文档是节点，链式关系是线，Tag / Project 形成枝叶聚类 |
| Review 会反问 | Review 与 Chat 以每周为周期基于用户知识库生成固定模板问题、周报和健康检查 |
| 小组件可工作 | 右上角小组件入口与内置日历组件能定位到具体日期的归档内容 |
| 开发者预览可上线 | 主线功能完整、状态可信、无明显占位按钮、无关键假数据 |

---

## 4. Phase 3 任务拆分

### Task 1: Markdown Preview Rendering

目标：接入正式 Markdown 渲染能力，让知识条目在 Preview 中像正式文档。

功能要求：
- 接入 Markdown 渲染器，优先采用 `react-markdown` + `remark-gfm` + `rehype-highlight` 或同等级方案。
- 支持 GFM：标题、段落、粗体、斜体、删除线、链接、列表、任务列表、表格、引用、行内代码、代码块、分割线。
- 支持代码高亮，Dark Mode 与 Light Mode 都必须可读。
- 链接默认安全打开；外链有明确样式。
- Markdown 渲染需做 XSS 安全处理，禁止直接渲染不可信 HTML。

验收标准：
- 一篇包含标题、列表、任务列表、代码块、引用、表格和链接的 Markdown 文档，在详情页中可被渲染为正式文档样式。

### Task 2: Editor Mode Switch

目标：把详情页从“文本对象详情”升级为可用编辑器。

功能要求：
- 增加 `Edit` / `Preview` / `Split` 三种模式。
- `Edit` 显示 Markdown 源码。
- `Preview` 显示渲染结果。
- `Split` 左侧编辑、右侧预览，滚动区域相互独立。
- 模式状态持久化到本地 UI state，刷新后保留用户偏好。
- 模式切换不得丢失未保存内容。
- 提供键盘快捷键：保存、切换预览、复制 Markdown。

验收标准：
- 用户可以在不离开当前详情页的情况下切换编辑、预览、分屏，且刷新后保持最近使用模式。

### Task 3: Document Reading Layout

目标：Preview 模式必须具备正式知识文档的阅读舒适度。

功能要求：
- 增加文档版心，正文最大宽度建议控制在 `720px - 860px`。
- 标题、正文、列表、任务列表、代码块、引用、表格、链接均有独立样式。
- 代码块支持横向滚动，不挤压页面。
- 表格支持横向滚动和清晰边界。
- 引用与 callout 类内容具备轻量视觉强调。
- Dark Mode 下避免高对比刺眼，保证长文阅读舒适。
- 移除类似日志文本、调试文本、未排版纯文本的视觉效果。

验收标准：
- Markdown 文档在 Preview 模式下视觉上接近正式知识文档，而不是源码文本。

### Task 4: Context Panel

目标：把结构信息从正文底部移入右侧上下文面板。

功能要求：
- DockItem / Entry 详情右侧固定或响应式展示 Context Panel。
- Panel 展示 Status、Type、Tags、Project、Source、Created、Updated、Suggestions、Actions。
- Tags 支持新增、删除、接受建议、用户修正。
- Project 支持选择、清空、接受建议。
- Status 与主操作按钮联动。
- 移动端或窄屏下 Panel 以抽屉形式展示。

验收标准：
- 用户打开任一 DockItem / Entry，可以一眼看到内容状态、归属、推荐和下一步动作。

### Task 5: Explainable Suggestion UI

目标：让“智能归档”从黑盒标签变成可理解、可修正的整理建议。

数据要求：
- `SuggestionItem` 增加 `reason`、`confidence`、`suggestedType`、`suggestedTags`、`suggestedProject`。
- 增加 `decision` 记录：`accepted_all`、`accepted_partial`、`modified`、`ignored`。
- 记录用户修改后的最终 Type / Tags / Project。
- 建议生成时间与对应内容版本需要可追踪，避免旧建议污染新内容。

交互要求：
- UI 展示推荐原因与置信度。
- 支持接受全部、部分接受、修改、忽略。
- 用户修改建议后记录 decision，并作为后续本地偏好信号。
- 置信度低的建议不得以强 CTA 呈现，应以候选提示呈现。

验收标准：
- 用户能够理解为什么系统推荐某个 Tag / Type / Project，并能修正建议。

### Task 6: Archive Action Redesign

目标：主操作按钮必须符合对象状态，而不是统一显示“保存变更”。

DockItem pending / suggested 状态操作：
- 保存
- 重新建议
- 接受建议
- 归档
- 忽略建议

Entry archived 状态操作：
- 保存
- 重新整理
- 放回 Dock
- 复制 Markdown

状态规则：
- 文本变更后自动清空旧建议并回到 `pending`。
- 放回 Dock 后必须保留原 Entry 来源信息，便于追踪二次整理。
- 归档前如果存在未处理建议，应提示用户确认采用哪些结构信息。

验收标准：
- 不同状态下的主操作按钮符合当前对象的工作流。

### Task 7: Review Data Repair

目标：Review 只能来自真实数据，不能展示假数据或纯装饰性报告。

功能要求：
- Review 所有统计来自真实 DockItem / Entry / Tag / Project 数据。
- 增加本周记录数、本周归档数、高频 Tag、待整理数量、整理完成率、建议回看条目。
- 建议回看条目必须有可解释原因，例如长时间未更新、高频主题、近期重复 Tag、待整理堆积。
- Review 中任何空数据都显示真实空状态，不用假趋势图补位。

验收标准：
- Review 页面不允许展示假数据或装饰性报告；所有数字可追溯到本地数据查询。

### Task 8: Browse / Database 体验补齐

目标：让 Browse 成为可回用、可再整理的结构化内容入口。

功能要求：
- Entries 支持列表与表格两种基础视图。
- 支持按 Type、Status、Tag、Project、Source、Created / Updated 时间筛选。
- 支持按更新时间、创建时间、标题、归档时间排序。
- 支持按 Tag / Project / Type 分组。
- 每条 Entry 可直接打开 MindDock Editor。
- Browse 中可触发放回 Dock、复制 Markdown、重新整理。
- 筛选与排序状态持久化到本地 UI state。

验收标准：
- 用户能通过真实属性找回内容，并从 Browse 继续进入编辑与再整理。

### Task 9: Chat Guidance 与主线衔接

目标：Chat 不再只是输入窗口，而是推动整理主线的引导器。

功能要求：
- Chat 对话产生的内容必须能生成 DockItem 或归档候选。
- Agent 追问围绕缺失上下文、Type、Tags、Project 和下一步动作。
- 当内容已经足够归档时，Agent 应推动用户确认建议或归档。
- Chat 触发的建议与 Classic Suggestion 共用同一数据结构。
- Chat 回顾提醒必须基于真实 Review / Dock / Entry 数据。

验收标准：
- 用户从 Chat 进入的内容，能够完整走到 Dock、建议、归档、Browse 与 Review。

### Task 10: Editor Quality Bar

目标：开发者预览版不能留下明显的编辑体验短板。

功能要求：
- 未保存状态明确展示。
- 保存成功、失败、建议失效、归档成功都有反馈。
- 空内容、超短内容、长内容、代码内容、表格内容都有可用状态。
- 编辑区、预览区和 Context Panel 在常见桌面宽度下不互相挤压。
- 移动端至少可阅读、可编辑、可打开属性抽屉。
- 所有 Phase 2 占位按钮要么打通，要么移除，不允许继续制造假能力。

验收标准：
- Phase 3 结束时，Dock / Entry 详情页可以被当作日常知识编辑器使用。

### Task 11: Widget System 与 Calendar Widget

目标：让常用知识视图以轻量小组件进入工作台，不只是页面级入口。

功能要求：
- 右上角增加小组件按钮，点击后弹出小组件视图。
- 小组件视图中展示可用 built-in widgets，Phase 3 首个内置组件为 Calendar Widget。
- 用户可将 Calendar Widget 拖动到 Sidebar 的 gap 区域生效。
- Phase 3 仅支持一个生效小组件；后续再评估叠放、堆叠与多组件布局。
- 生效小组件默认不显示关闭按钮；当用户进入该模块或 hover/focus 管理态时，在左上角显示关闭按钮。
- Calendar Widget 点击日期后，自动定位并筛出该日期内所有已归档笔记。
- 日历数据按用户隔离，并与 Entries / Review 共用真实归档时间字段。

验收标准：
- 用户能从右上角打开小组件面板，将日历拖到 Sidebar gap 区，并通过点击日期查看当天归档笔记。

### Task 12: Entries Graph / Tree View

目标：Phase 3 必须落地文档链式关系与结构化视图，让用户看到知识如何从碎片变成有序结构。

功能要求：
- Entries 增加视图切换：List / Table / Graph Tree。
- Graph Tree 使用点线关系呈现：节点代表文档，线代表链式关系。
- 未归档或未关联内容以散点分布呈现，提示“等待整理或关联”。
- 已关联 Tag、Project、source/parent/chain 的内容，根据算法聚类为更有序的树状枝叶结构。
- 节点可点击打开 MindDock Editor。
- 节点可拖动；用户可拖动枝与叶快速创建或调整链式关系。
- 视图支持缩放、拖拽画布、自动布局、局部聚焦与回到中心。
- 视觉动效参考 Obsidian graph 的丝滑拖拽，但 Atlax 需要更有序，用户视角应像看到一棵不断生长的知识树。
- 数据量增长时必须保持可读：支持节点聚合、Tag/Project 分层、缩放层级与搜索定位。

验收标准：
- 用户能在 Entries 中切换到 Graph Tree，看到散点、文档节点、关系线、Tag/Project 聚类，能拖拽连接并点击节点进入文档。

### Task 13: Review Proactive Thinking / Weekly Report / Health Check

目标：Review 不只是复盘页面，而是系统反过来用用户自己的知识库逼用户思考、输出和修正结构。

功能要求：
- Review 新增“推荐提问”模块：每周一为周期，根据真实知识库指标生成固定模板问题。
- Chat 中可弹出新消息提醒，形态像有联系人发来消息；问题来自 Review insight，不做泛聊天。
- 无 LLM 阶段使用固定模板问答，例如项目停滞、主题反复、待整理堆积、长期未更新等。
- Review 新增“本周周报”模块：扫描所有项目进展和更新，汇总本周做了什么、哪件事卡住、哪个方向停滞。
- Review 新增“知识库健康检查”模块：超过 30 天没看的笔记、缺少关联的知识、反复出现但没有深入的主题、长期 pending 内容。
- 所有结论必须提供可追溯的条目列表或筛选入口，不能只展示一句总结。

验收标准：
- Review 能基于真实数据提出问题、生成周报、列出健康检查结果，并能跳转到对应 Entry / Project / Tag。

### Task 14: Review Mathematical Model & Charts

目标：用直观图表展示真正有价值的数据，而不是展示对用户无意义的数字。

功能要求：
- Review 支持折线图、饼图、柱状图、甘特图四类基础图表。
- 折线图：记录/归档趋势、待整理堆积变化。
- 饼图：Tag / Project / Type 分布。
- 柱状图：高频 Tag、项目更新次数、归档量排行。
- 甘特图：项目时间线、停滞周期、连续更新区间。
- 图表数据必须来自真实 DockItem / Entry / Tag / Project / event 聚合，并按用户隔离。
- 空数据时展示真实空状态与下一步建议，不允许 mock 图表。
- 指标必须服务用户决策：整理压力、项目进展、知识沉没、主题重复、关系缺口。

验收标准：
- Review 看板至少能展示一组真实趋势图、一组分布图、一组排行图和一组项目时间线，且每个图表可解释其数据来源。

---

## 5. 数据模型增量

### 5.1 SuggestionItem

```ts
type SuggestionDecision =
  | "accepted_all"
  | "accepted_partial"
  | "modified"
  | "ignored";

type SuggestionItem = {
  id: string;
  targetId: string;
  targetType: "dock_item" | "entry";
  contentVersion: string;
  reason: string;
  confidence: number;
  suggestedType?: EntryType;
  suggestedTags: string[];
  suggestedProject?: string;
  decision?: SuggestionDecision;
  finalType?: EntryType;
  finalTags?: string[];
  finalProject?: string;
  createdAt: string;
  decidedAt?: string;
};
```

### 5.2 Editor UI State

```ts
type EditorMode = "edit" | "preview" | "split";

type MindDockEditorState = {
  editorMode: EditorMode;
  browseView: "list" | "table" | "graph_tree";
  browseFilters: {
    type?: string[];
    status?: string[];
    tags?: string[];
    project?: string[];
    source?: string[];
  };
  browseSort: {
    field: "updatedAt" | "createdAt" | "archivedAt" | "title";
    direction: "asc" | "desc";
  };
  contextPanelCollapsed: boolean;
};
```

### 5.3 Widget State

```ts
type BuiltInWidgetType = "calendar";

type WidgetPlacement = {
  activeWidget?: {
    type: BuiltInWidgetType;
    placement: "sidebar_gap";
    collapsed?: boolean;
  };
  widgetPanelOpen: boolean;
};
```

### 5.4 Knowledge Graph / Tree

```ts
type KnowledgeGraphNode = {
  id: string;
  entryId: string;
  title: string;
  status: "pending" | "suggested" | "archived" | "reopened";
  tags: string[];
  project?: string;
  cluster: "unlinked" | "tag" | "project" | "chain";
  lastViewedAt?: string;
  updatedAt: string;
};

type KnowledgeGraphEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: "source" | "parent" | "tag" | "project" | "manual";
  confidence?: number;
  createdBy: "system" | "user";
};
```

### 5.5 Review Aggregates

```ts
type WeeklyReviewStats = {
  weekStart: string;
  weekEnd: string;
  createdCount: number;
  archivedCount: number;
  pendingCount: number;
  completionRate: number;
  topTags: Array<{ tagId: string; count: number }>;
  suggestedReviewEntries: Array<{
    entryId: string;
    reason:
      | "stale_project"
      | "frequent_tag"
      | "pending_followup"
      | "recently_reopened"
      | "not_viewed_30d"
      | "missing_relation"
      | "repeated_but_shallow";
  }>;
  proactiveQuestions: Array<{
    id: string;
    templateId: string;
    question: string;
    relatedEntryIds: string[];
    relatedProject?: string;
  }>;
  weeklyReport: {
    completed: string[];
    blocked: string[];
    stagnant: string[];
  };
  charts: {
    trend: Array<{ date: string; created: number; archived: number; pending: number }>;
    tagDistribution: Array<{ tagId: string; count: number }>;
    projectTimeline: Array<{ project: string; start: string; end: string; status: string }>;
  };
};
```

---

## 6. 阶段验收总表

| 领域 | Phase 3 通过标准 |
|------|------------------|
| Markdown 编辑 | Edit / Preview / Split 全部可用，GFM 渲染稳定 |
| 阅读体验 | Preview 有正式文档版式，Dark Mode 可长时间阅读 |
| 上下文结构 | Context Panel 展示状态、属性、建议和动作 |
| 智能归档 | 建议可解释、可接受、可修改、可忽略，用户决策可记录 |
| 归档工作流 | DockItem 与 Entry 在不同状态下有不同主操作 |
| Review | 所有数据来自真实本地对象，无假数据 |
| Browse | 可筛选、排序、分组、打开、再整理 |
| 小组件 | 右上角小组件入口、日历拖放到 Sidebar gap、日期定位归档笔记可用 |
| Entries 结构视图 | 点线树状视图可展示文档节点、关系线、散点、聚类、拖拽连接、缩放 |
| 主动 Review | 每周提问、周报、健康检查、图表均由真实数据生成并可跳转到相关内容 |
| Chat | Chat 产物进入统一知识主线，不形成独立对话仓 |
| 质量 | 无关键占位按钮，无主要假数据，无对象调试页感 |

---

## 7. 明确不进入 Phase 3 的内容

以下内容不作为 Phase 3 必须交付，但不得阻碍后续扩展：

- 完整 Notion 式 Block Editor。
- 多人协作、评论系统、实时协同。
- 完整插件系统。
- 完整 Obsidian 式复杂图谱与 Canvas 编辑。
- 完整导入系统。
- 移动端完整原生体验。
- 完整 AI provider 接入。

注意：以上不进入 Phase 3，不代表 Phase 3 可以继续缺失编辑、结构、建议、归档、Review、Browse、小组件、Entries 点线树状视图这些主线能力。
