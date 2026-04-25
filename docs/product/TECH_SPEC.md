# Atlax 技术规格说明书（TECH SPEC）

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档版本 | v5.3 |
| 文档类型 | 技术规格文档 |
| 当前阶段 | Phase 3 Developer Preview |
| 最后更新 | 2026-04-25 |

---

## 0. 架构决策（Pre-Phase3-Architecture 新增）

### 0.1 架构风格

| 维度 | 决策 | 理由 |
|------|------|------|
| 整体风格 | **DDD-lite + 模块化单体** | Phase 2 已验证单体可行性，DDD-lite 提供领域边界但不引入完整 DDD 复杂度 |
| 扩展模式 | **Ports/Adapters（六边形架构）** | 隔离核心业务与外部依赖，确保后续可切换存储或接入后端服务 |
| 模块组织 | **按领域能力划分包** | Capture、Dock、Suggest、Tag、Archive 等作为独立模块 |

### 0.2 分层职责

| 层级 | 职责 | 代码位置 |
|------|------|---------|
| 前端应用层 | UI 交互、路由、状态管理 | `apps/web/app/*` |
| Primary Adapters | 将用户操作转换为领域调用 | `apps/web/app/*/_components/*.tsx` |
| Application Services | 编排领域逻辑，处理跨模块协作 | `apps/web/lib/*.ts` |
| Domain Layer | 状态机、规则引擎、标签策略 | `packages/domain/src/*` |
| Secondary Adapters | IndexedDB/Dexie 存储实现 | `apps/web/lib/db.ts` |

### 0.3 依赖规则

- **依赖单向**：外层（UI/Adapter）可依赖内层（Domain），内层不感知外层实现
- **接口所有**：Domain 层定义 Output Port 接口，Adapter 层负责实现
- **模块隔离**：领域模块之间通过接口通信，不直接依赖对方实现

## 1. 文档目标

本文档将 `PRD v5.1` 转换为可执行技术边界，目标是交付 Phase 3 Developer Preview：让 Phase 2 的闭环升级为可长期工作的 MindDock Editor、可解释智能归档、Entries 结构视图、小组件与主动 Review 体验。

技术目标：
- 双模式统一知识库落地（Classic/Chat 同模型）。
- P0 闭环能力稳定交付（Dock/Tag/Suggest/Archive/Browse/Auth）。
- 留存与验证指标可采集。
- Markdown 编辑、预览、分屏、Context Panel、可解释 Suggestion、真实 Review 数据进入当前实现范围。
- Phase 4/5 只保留导入、搜索增强、移动端、同步、AI provider 等扩展能力。

---

## 2. Phase 2 技术范围（P0）

### 2.1 必做能力

| 模块 | P0 实现 |
|------|---------|
| Mode | Classic / Chat 双入口与切换控制器 |
| Capture | Quick Input + Expanded Editor 双形态输入 |
| Dock | 统一待整理列表与状态流转 |
| Suggest | 规则引擎基础版（可解释） |
| Tag | 手动选择 + 推荐确认，用户优先 |
| Archive | 归档生成 Entry，支持 reopen |
| Browse | 基础列表与筛选、再次整理 |
| Auth | 注册 / 登录 / 退出 / 会话恢复 |
| Workspace | 单页结构稳定（Sidebar + Workspace + Input Bar） |
| Metrics | 核心事件埋点与验证指标 |

### 2.2 不在 Phase 2 实现

- 复杂 Review 策略
- 高级 Database 体验
- 高级关系浏览
- 超出 `FRONT_DESIGN.md` 基线的新增重交互能力
- 导入/搜索增强/语音输入
- 同步、协作、AI provider

---

## 3. 技术策略

### 3.1 总体策略

> Web-first + 本地内容主源 + 账号控制面 + 规则引擎优先 + 指标可验证。

### 3.2 实现原则

- 规则优先：Suggestion 以 deterministic rules 为主。
- 用户优先：Tag 最终决策权在用户。
- 统一主线：Classic/Chat 都走 Dock 主线。
- 最小可用：优先稳定闭环，不做过度前瞻实现。

---

## 4. 技术选型

### 4.1 应用与前端

| 技术 | 用途 |
|------|------|
| Next.js + React + TypeScript | Web 应用骨架 |
| Tailwind CSS | 样式体系 |
| Zustand（或等价） | UI / workflow 本地状态 |
| React Hook Form + Zod（可选） | 输入校验与编辑状态 |

前端一致性约束：
- `docs/product/FRONT_DESIGN.md` 为 UI/交互/动效规范真源。
- Phase 2-5 任意前端功能新增或改造，必须在不丢失功能闭环前提下保持该设计语言一致。

### 4.2 存储与身份

| 技术 | 用途 |
|------|------|
| IndexedDB（Dexie 或现有仓储） | 本地内容主源 |
| 认证层（现有 auth 方案） | 登录、会话、身份恢复 |
| Repository 抽象 | 隔离存储实现，保证可替换性 |

### 4.3 规则引擎

| 项 | 说明 |
|----|------|
| SuggestionEngine | type/tag/归属建议 |
| 信号 | 关键词、历史 Tag、用户修正反馈 |
| 输出 | 建议值 + reason（可解释） |

---

## 5. 核心数据模型

### 5.1 领域实体

- `DockItem`
- `Entry`
- `Tag`
- `SuggestionItem`
- `ArchiveIntent`
- `WorkspaceSession`

### 5.2 状态流转

```text
pending -> suggested -> archived -> reopened
```

### 5.3 关键约束

- `sourceType` 支持 `text/chat/import`，但 `import` 当前阶段不接入完整链路。
- Chat 输出必须可映射为 `DockItem`。
- `archived` 项可回退 `reopened`。

### 5.4 `updateDockItemText` 状态重置语义

编辑 DockItem 文本时，后端强制执行状态重置，确保建议始终与最新文本一致：

| 字段 | 重置值 | 语义 |
|------|--------|------|
| `rawText` | 新文本 | 替换输入内容 |
| `status` | `pending` | 强制回退待处理 |
| `suggestions` | `[]` | 清空旧建议（与新文本不对应） |
| `processedAt` | `null` | 标记未处理 |

约束：文本变更后，调用方必须重新触发 `suggestItem` 才能获得新建议。  
与 `reopenItem` 保持对称：两者都是"重置为 pending + 清空建议"。

---

## 6. 模块到实现映射

### 6.1 Capture

- `QuickInputBar`
- `ExpandedEditor`
- `CaptureComposer`（统一草稿与提交）

### 6.2 Chat

- `ChatPanel`（或 workspace 内聊天区）
- `ChatGuidanceService`（追问策略最小版）
- `ChatToDockMapper`（对话结果转 DockItem）

### 6.3 Dock / Suggest / Tag / Archive

- `DockList`
- `SuggestionEngine`
- `TagEditor`
- `ArchiveService`

### 6.4 Browse

- `EntriesList`
- `EntriesFilterBar`
- `DetailPanel`

### 6.5 Auth & Workspace

- `AuthGate`
- `SessionStore`
- `WorkspaceShell`

### 6.6 前端接口预留点与后续实现边界

| 预留点 | 预留方式 | 后续实现边界 |
|------|---------|------------|
| **沉浸式编辑器** | `DetailHeaderActions` -> `Maximize` 按钮 | 接入基于 Monaco 或 Vditor 的全屏编辑器组件 |
| **Markdown 渲染切换** | `DetailHeaderActions` -> `BookOpen` 按钮 | 打通 `renderingMode` 状态与预览渲染器 |
| **文件操作扩展** | `DropdownItem` 统一回调占位 | 接入 `FileService` 或 `ProjectService` 业务接口 |
| **Dock 项目编辑持久化** | `updateDockItemText` 仓储方法 | 已打通：保存文本 -> 状态重置为 `pending` -> 清空建议 |
| **列表自适应挤压** | `page.tsx` 中的状态联动渲染 | 已打通：`hasSelectedItem` 驱动侧边栏/列表/详情三位一体宽度变化 |

### 6.7 Phase 3 Developer Preview 必做模块

对应 `PRD v5.1`，以下模块不再作为远期占位，必须在 Phase 3 分批落地：

| 模块 | 代码边界 | 职责 | 验收 |
|------|---------|------|------|
| `MindDockEditor` | `apps/web/app/*` 或 `_components/editor/*` | 统一 DockItem / Entry 详情编辑器，承载 Edit / Preview / Split | 任一对象打开后可编辑、预览、分屏 |
| `MarkdownRenderService` | 前端渲染适配层，必要时封装 domain-safe renderer | GFM 解析、代码高亮、安全链接、表格/任务列表渲染 | Markdown fixture 渲染稳定，Dark Mode 可读 |
| `EditorUiStateStore` | `apps/web/lib/*` 或现有 UI state | 持久化 editorMode、splitRatio、panelCollapsed 等本地偏好 | 重新打开详情保留上次模式 |
| `ContextPanelAdapter` | UI adapter + repository mapper | 读写 Status、Type、Tags、Project、Source、Created/Updated、Suggestions、Actions | 属性不再塞入正文底部 |
| `SuggestionDecisionService` | `packages/domain/src/services/*` | 记录 accept_all / accept_partial / modify / ignore 决策 | 用户修正建议可追踪 |
| `ArchiveActionPolicy` | domain service | 根据 pending/suggested/archived/reopened 输出可用操作 | 不同状态主操作不同 |
| `ReviewMetricsService` | domain service + repository query | 基于真实 DockItem / Entry / Tag / Project / event 计算 Review 数据 | 不允许 mock 或硬编码 |
| `ProjectAssociationPersistence` | repository | Dock 关联项目后，归档 Entry 必须写入 project/actions | Entries 项目筛选能筛出归档内容 |
| `WidgetRegistry` | UI state + repository query | 管理 built-in widget 列表、当前生效 widget 与 Sidebar gap placement | Phase 3 仅允许一个 Calendar Widget 生效 |
| `CalendarWidgetService` | domain query + UI adapter | 按日期查询 archived Entry，并驱动 Entries 日期定位 | 点击日期能筛出当天归档笔记 |
| `KnowledgeGraphService` | domain service | 生成 Entries Graph Tree 节点、边、聚类与推荐链路 | 节点/边按 userId 隔离，支持散点、Tag/Project 聚类 |
| `ChainLinkCommandService` | domain service + repository | 创建、更新、校验用户拖拽产生的链式关系 | 禁止跨用户链接、自引用和不存在节点 |
| `ReviewInsightService` | domain service | 生成主动提问、周报、健康检查与图表数据 | 输出可追溯到真实 Entry / Project / Tag |

Phase 4/5 保留：完整导入、文件管理与导出、复杂搜索/关系浏览、版本历史、同步、多端、AI provider。

---

## 7. API 与仓储策略

### 7.1 Phase 2 最小接口

- Auth: 登录、登出、会话查询
- Content: 本地仓储优先，接口层可薄封装
- Metrics: 事件上报接口（本地或轻量远端）

### 7.2 Repository 约束

- 读写通过 repository 接口，不直接散落在组件。
- Domain 层不感知具体存储实现。
- 为后续导入和同步适配保留统一入口。

---

## 8. 留存与验证指标实现

### 8.1 必采集事件

- `capture_created`
- `chat_guided_capture_created`
- `archive_completed`
- `mode_switched`
- `weekly_review_opened`
- `browse_revisit`

### 8.2 指标计算口径

| 指标 | 计算方式 |
|------|---------|
| DAU | 日活跃用户去重 |
| 每用户日均记录次数 | `capture_created / DAU` |
| Chat 引导后归档率 | `chat来源归档数 / chat来源记录数` |
| 7 日留存 | D0 用户在 D7 是否活跃 |
| Weekly Review 打开率 | `weekly_review_opened 用户数 / 活跃用户数` |

---

## 9. Phase 3 Editor / Archive 技术细则

### 9.1 Markdown 渲染

- 推荐前端采用 `react-markdown` + `remark-gfm` + `rehype-highlight` 或等价组合，封装为独立 renderer adapter。
- 支持标题、段落、粗体、斜体、列表、任务列表、表格、引用、水平线、行内代码、代码块、链接。
- 链接渲染必须安全处理：外链新开页，避免直接注入 HTML。
- 代码块必须支持语言标识与高亮；未知语言回退为纯文本代码块。
- Preview 不允许使用源码 textarea 样式伪装。

### 9.2 Editor Mode

| 模式 | 行为 |
|------|------|
| Edit | 显示 Markdown 源码，保留当前编辑体验与保存能力 |
| Preview | 显示正式渲染文档，不展示源码符号 |
| Split | 左侧源码，右侧预览，滚动互不破坏布局 |

状态持久化：
- `editorMode` 按用户维度存储。
- 可选存储 `splitRatio`、`contextPanelCollapsed`。
- UI state 不进入 Entry 正文，不污染 domain 内容。

### 9.3 Suggestion 数据模型

`SuggestionItem` 需要扩展：

| 字段 | 说明 |
|------|------|
| `reason` | 推荐原因，面向用户可读 |
| `confidence` | 0-1 置信度 |
| `suggestedType` | 推荐内容类型 |
| `suggestedTags` | 推荐 Tag 集合 |
| `suggestedProject` | 推荐项目 |
| `sourceSignals` | 可选，关键词、历史偏好、Chat 回答等信号 |

`SuggestionDecision` 需要记录：

| 字段 | 说明 |
|------|------|
| `decision` | `accept_all` / `accept_partial` / `modify` / `ignore` |
| `finalType` / `finalTags` / `finalProject` | 用户最终选择 |
| `createdAt` / `userId` / `itemId` | 审计与用户隔离 |

### 9.4 Review 真实数据口径

Review 数据必须按 `userId` 查询，不得读取全局指标。Phase 3 最小指标：

| 指标 | 来源 |
|------|------|
| 本周记录数 | 本周创建的 DockItem + Entry |
| 本周归档数 | 本周 archived Entry |
| 高频 Tag | EntryTagRelation / Entry.tags 聚合 |
| 待整理数量 | DockItem status in pending/suggested/reopened |
| 整理完成率 | archived / created |
| 建议回看条目 | 长期未更新、Tag 高频、reopened、低置信建议等真实条件筛选 |

### 9.5 技术验收门槛

- `pnpm --dir apps/web lint` 必须通过。
- `pnpm --dir apps/web typecheck` 必须通过。
- 相关 domain tests / repository tests 必须覆盖真实 repository 行为，不只用 mock 排序。
- `git diff --cached --check` 必须通过。
- 开发日志不得用“待实机测试”替代“已验证”，关键路径未手测通过时必须标记不可进入下一轮。

### 9.6 Widget / Calendar 技术细则

- `WidgetRegistry` 只管理 built-in widgets，Phase 3 仅内置 `calendar`。
- 当前只允许一个 active widget，placement 固定为 `sidebar_gap`。
- Calendar Widget 查询 `Entry.archivedAt` 或等价归档时间字段，按用户隔离。
- 点击日期应产生 Entries filter state：`archivedAt in selectedDay`，并定位到 Entries 结果。
- 关闭按钮仅在组件管理态、hover/focus 或进入组件模块时显示。

### 9.7 Entries Graph Tree 技术细则

- Graph Tree 数据由 `KnowledgeGraphService` 输出，不直接在 UI 中拼接。
- node 来源：Entry、必要时包含 pending/reopened DockItem 的散点节点。
- edge 来源：source/parent chain link、Tag 聚类、Project 聚类、用户手动拖拽创建关系。
- 布局目标是“有序树状感”，不是随机力导图；默认按 Project -> Tag -> Chain 分层，未关联内容进入 unlinked cluster。
- UI 支持 zoom、pan、drag node、drag edge connect、click node open editor。
- 任何创建链路的操作都必须调用 `ChainLinkCommandService` 校验 userId、sourceId、targetId、self-reference 与存在性。

### 9.8 Review Insight / Chart 技术细则

- Review 以每周为周期，默认周一生成当周 insight。
- 无 LLM 阶段使用模板问题：项目停滞、30 天未看、缺少关联、主题重复但未深入、pending 堆积。
- 周报基于项目、Tag、Entry 更新事件生成：completed、blocked、stagnant 三类输出。
- 健康检查至少输出：not_viewed_30d、missing_relation、repeated_but_shallow、stale_project、pending_followup。
- 图表模型支持 line、pie、bar、gantt 四类；所有图表必须标明数据来源字段。
- Chat 消息提醒只展示 ReviewInsight 生成的问题，不进入泛 AI 问答。

---

## 10. 非功能要求（Phase 3）

| 维度 | 目标 |
|------|------|
| 可用性 | 主闭环成功率可稳定演示 |
| 性能 | 常规数据规模下主工作台流畅 |
| 稳定性 | 核心操作失败有提示与恢复路径 |
| 可维护性 | Domain 与 UI 分层，关键逻辑可测试 |
| 可观测性 | 指标事件可追踪 |

---

## 11. Phase 对齐（精简）

### 11.1 Phase 2

交付可上线 Demo 闭环与指标验证能力。

### 11.2 Phase 3

交付 Developer Preview：MindDock Editor、Markdown Preview、Context Panel、可解释 Suggestion、真实 Review 数据、Chat 与 Editor 汇合、小组件日历、Entries Graph Tree、主动 Review insight。

### 11.3 Phase 4

做导入、搜索增强、关系增强、扩展输入。

### 11.4 Phase 5

做同步、多端、协作、AI provider。

---

## 12. 风险与应对

| 风险 | 应对 |
|------|------|
| Chat 路径落不进主线 | 强制 `ChatToDockMapper` 与统一归档流程 |
| 范围膨胀导致延期 | P0 白名单机制，非白名单全部后移 |
| 建议质量波动 | 可解释、可修正、用户覆盖优先 |
| 数据结构分叉 | 统一 Dock/Entry/Tag 模型，不按模式分表 |
| 编辑器继续停留在占位 | Phase 3 将 Markdown Editor 设为 P0，未完成不得进入下一阶段 |
| Review 变成装饰报表 | ReviewMetricsService 只允许读取真实数据并按 userId 隔离 |
| Graph Tree 变成随机点图 | KnowledgeGraphService 必须输出聚类与分层，未关联散点和已关联树状结构分开处理 |
| 小组件变成装饰入口 | Calendar Widget 必须能定位真实归档笔记，否则不算完成 |
| 主动提问变成空泛提醒 | ReviewInsightService 必须输出可追溯条目和模板来源 |

---

## 13. 版本差异说明（v5.2 -> v5.3）

1. 增加 `WidgetRegistry`、`CalendarWidgetService`，明确 Phase 3 内置日历小组件与日期定位能力。
2. 增加 `KnowledgeGraphService` 与 `ChainLinkCommandService`，支撑 Entries 点线树状视图和链式关系校验。
3. 增加 `ReviewInsightService` 与 chart model，支撑主动提问、周报、健康检查和真实图表。
4. 强化 userId 隔离、链路校验、图表数据来源与小组件验收门槛。

---

## 14. 关联文档

| 文档 | 位置 | 用途 |
|------|------|------|
| 架构迁移计划 | `docs/engineering/architecture-migration-plan.md` | 分批迁移执行清单 |
| 开发日志 | `docs/engineering/dev_log/Phase3/phase-3.0-architecture-decision-and-plan.md` | Phase 3 决策记录 |
| Phase 3 开发者预览版计划 | `docs/product/PHASE3_DEVELOPER_PREVIEW.md` | Phase 3 产品与技术执行真源 |
