# Atlax 架构说明书（ARCHITECTURE）

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档版本 | v4.7 |
| 文档类型 | 架构设计文档 |
| 当前阶段 | Phase 2 Demo 冲刺 |
| 最后更新 | 2026-04-22 |

---

## 1. 架构目标与边界

### 1.1 架构目标

Atlax 架构服务于一个明确目标：

> **在本地优先前提下，跑通“输入 → 整理 → 结构化沉淀 → 回看/利用 → 再整理”的可用闭环。**

具体目标：
- 支持 Web-first、账号驱动、单用户优先的产品形态
- 让 Capture、Dock、Suggest/Tag、Archive、Browse、Review、Re-organize 形成稳定主线
- 让内容整理与推荐优先在本地完成，避免把产品变成强依赖云端或强依赖 LLM 的系统
- 为后续导入、语音输入、图谱、搜索、同步、协作、AI provider 留出扩展位

### 1.2 Phase 2 架构边界

| 边界 | 处理方式 |
|------|----------|
| 账号系统 | Phase 2 必做，建立最小登录、会话保持、工作区身份 |
| 内容数据主源 | Phase 2 仍以本地结构化存储为主 |
| 云同步 | Phase 5 才完整交付，Phase 2 仅预留 sync adapter |
| 多人协作与权限 | Phase 5 才完整交付，Phase 2 仅预留 collaboration / permission boundary |
| AI 增强建议 | Phase 5 才接入 provider，Phase 2 只做规则引擎与本地推荐 |
| 完整导入能力 | Phase 4，预留 importer interface |
| 语音输入与扩展采集 | Phase 4，预留 capture adapter |

### 1.3 关键架构原则

- `PRD v4.7` 是产品边界唯一真源，架构定义必须跟随 PRD。
- `Dock` 是统一待整理入口，文档与后续命名不再使用产品层的 `Inbox` 口径。
- `Capture` 必须支持双形态输入：快速输入 + 展开编辑器。
- 已归档内容不是终局，架构必须支持重新打开、再次编辑、回到 Dock 再整理。
- 本地优先不等于没有账号；账号与内容数据应分层处理。

---

## 2. 高层架构

### 2.1 双平面架构

```text
┌──────────────────────────────────────────────────────────┐
│                    Presentation Plane                    │
│ apps/web                                                 │
│ Sidebar / Dock / Browse / Review / Capture UI / Auth UI │
└──────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                     Domain Core Plane                    │
│ packages/domain                                          │
│ state machine / suggestion rules / archive rules /       │
│ tag rules / review aggregation / query selectors         │
└──────────────────────────────────────────────────────────┘
                 │                             │
                 ▼                             ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│     Local Content Plane      │   │     Account Control Plane    │
│ IndexedDB / Dexie / export   │   │ Auth / session / workspace   │
│ DockItem / Entry / Tag /     │   │ identity / minimal profile   │
│ relation / review snapshot   │   │ metadata / future sync auth  │
└──────────────────────────────┘   └──────────────────────────────┘
```

### 2.2 分层职责

| 层级 | 职责 | 说明 |
|------|------|------|
| apps/web | UI、页面编排、浏览器交互、状态协调 | 工作台、Dock、Capture、Review、账户交互 |
| packages/domain | 平台无关核心逻辑 | 状态流转、建议规则、归档规则、查询与聚合 |
| Local Content Plane | 本地内容主源 | DockItem、Entry、Tag、关系、Review 数据 |
| Account Control Plane | 账号与身份控制 | 登录、注册、会话、workspace identity、未来同步授权基础 |

---

## 3. Domain Core

### 3.1 packages/domain 职责

| 职责 | 说明 |
|------|------|
| type definitions | DockItem、Entry、Tag、SuggestionItem、ArchiveIntent、WorkspaceSession 等类型定义 |
| state transitions | DockItem 状态流转与再整理规则 |
| suggestion rules | 规则引擎、本地信号、Tag 建议、关系建议 |
| tag rules | Tag 创建、Tag-Entry 关系、TagRelation、同义词、基础层级 |
| archive rules | Dock → Entry 的归档规则、回写规则、re-organize 规则 |
| review aggregation | Review 基础统计、健康信号、激活入口聚合 |
| selectors / query helpers | Dock / Browse / Review 查询与筛选辅助函数 |

### 3.2 Domain Core 不依赖

| 不依赖 | 说明 |
|------|------|
| Web 框架 | 不依赖 React、Next.js |
| UI 组件 | 不依赖具体组件实现 |
| 本地存储实现 | 不依赖 Dexie、IndexedDB 细节 |
| 外部 AI 服务 | 不依赖 LLM 或远程 provider |
| 同步与协作后端 | 不依赖云同步、协作服务 |

### 3.3 核心状态机

```text
CaptureInput
  → DockItem(pending)
  → DockItem(suggested)
  → Entry(archived)
  → Re-organize
  → DockItem(reopened or pending)
```

规则要求：
- 用户主动选择 Tag 时，始终优先于系统建议。
- 建议结果必须可忽略、可修正、可关闭。
- 归档后必须保留再次编辑入口，不能把 Entry 锁死为只读结果。

---

## 4. 核心实体与关系

### 4.1 核心实体

| 实体 | 说明 |
|------|------|
| UserAccount | 用户身份、认证来源、基础资料 |
| Workspace | 用户工作区元数据与入口定义 |
| WorkspaceSession | 当前登录状态、会话与工作区上下文 |
| DockItem | 待整理内容主实体，统一承接 Capture 结果 |
| Entry | 结构化沉淀后的正式知识单元 |
| Tag | 用户主动分类与推荐的基础组织能力 |
| SuggestionItem | 规则引擎给出的 type / tag / relation / project 建议 |
| ArchiveIntent | 用户接受建议与手动修正后的归档意图 |
| ReviewSnapshot | Review 基础统计与结构健康信号快照 |

### 4.2 关系实体

| 实体 | 说明 |
|------|------|
| EntryTagRelation | Entry-Tag 关系 |
| EntryProjectRelation | Entry-Project 关系 |
| TagRelation | Tag-Tag 关系（层级、同义词、相关） |
| EntryRelation | Entry-Entry 关联（后续搜索 / 关系增强可扩展） |

### 4.3 命名收敛要求

- 产品与架构文档统一使用 `Dock`，不再用 `Inbox` 作为产品层概念。
- 旧代码中若仍存在 `InboxEntry`，应视为遗留命名；文档层统一收敛为 `DockItem`。
- `QuickInputBar` 与 `ExpandedEditor` 属于同一条 Capture 主线，而不是两个孤立模块。

---

## 5. Capture 架构

### 5.1 双形态输入

| 输入形态 | 目标 | 架构要求 |
|------|------|------|
| Quick Input Bar | 灵感、短句、临时记录 | 低门槛、常驻、快速写入 Dock |
| Expanded Editor | 长笔记、长文章、富文本输入 | 更大编辑空间、同一 Capture pipeline、可回到 Dock |

### 5.2 Capture 模块拆分

| 模块 | 职责 |
|------|------|
| CaptureComposer | 统一管理短输入与展开输入的草稿状态 |
| QuickCapture | 常驻快速输入入口 |
| ExpandedEditor | 展开编辑器、富文本工具栏、长内容输入 |
| CaptureSubmitService | 统一提交、校验、清洗、落库 |

### 5.3 架构约束

- 长短输入必须写入同一类 `DockItem`，不能拆成两套内容主源。
- 输入区布局不能横跨列表区与详情区，避免破坏工作台结构。
- 展开编辑器可以是弹层、抽屉或独立局部面板，但必须属于同一条 Capture 主线。
- Phase 2 先建立合理可用性；Phase 3 再细化富文本工具栏、动画反馈、层级和微交互。

---

## 6. apps/web 职责

### 6.1 UI 模块

| 模块 | 职责 |
|------|------|
| WorkspaceShell | Sidebar、主布局、模块入口、工作区边界 |
| DockPage | Dock 列表、状态流转、建议入口 |
| EntryPage / BrowsePage | 结构化浏览、筛选、详情、再次整理入口 |
| ReviewPage | 基础统计、健康信号、激活入口 |
| AuthUI | 登录、注册、会话状态、工作区身份展示 |
| CaptureUI | Quick Input Bar、Expanded Editor、提交反馈 |

### 6.2 视图层要求

| 视图类型 | 当前要求 |
|------|------|
| 列表视图 | Dock、Browse 的基础表达方式 |
| 工作台视图 | 当前阶段主表达方式 |
| 树感视图 | Phase 4 后增强，不绑底层结构 |
| 图谱视图 | Phase 4 后增强，作为 view extension |

---

## 7. 关键流程架构

### 7.1 登录与工作区启动

1. 用户完成注册 / 登录。
2. 系统恢复 `WorkspaceSession`。
3. 工作台根据当前身份加载本地内容主源与用户工作区元数据。
4. 用户进入总工作台，看见 Dock、Browse、Review 与知识库总览入口。

### 7.2 Quick Capture / Expanded Editor → Dock

1. 用户通过快速输入或展开编辑器写入内容。
2. `CaptureComposer` 做基础校验、内容清洗、草稿归一化。
3. 写入 `DockItem(status=pending)`。
4. Dock 列表即时可见该条目。

### 7.3 Dock Suggest / Tag / Archive

1. `SuggestionEngine` 基于规则与本地信号生成建议。
2. 用户接受、忽略或修正建议。
3. 用户可主动选择 Tag，且始终优先于系统建议。
4. `ArchiveService` 生成 `Entry`，并写入关系实体。
5. 原 `DockItem` 进入 `archived` 或 `reorganized` 状态。

### 7.4 Browse / Review / Re-organize

1. 用户在 Browse 找到已归档内容。
2. 用户可查看详情、筛选、再次编辑。
3. 用户可把内容重新送回整理流程。
4. Review 聚合基础统计、结构健康度和激活入口。

---

## 8. 数据架构

### 8.1 数据主源原则

Phase 2 采用双源分层，而不是单一“纯本地”叙事：

- 内容主源：本地结构化存储（IndexedDB / Dexie）
- 身份主源：账号与会话控制面
- 导出层：Markdown / 其他导出格式

说明：
- 内容整理、归档、推荐与查询优先围绕本地内容主源展开。
- 账号控制面负责身份、会话、工作区归属，以及未来同步授权基础。
- Phase 2 不要求云端存储用户全部内容，但不能没有账号体系。

### 8.2 本地内容存储

| 数据 | 说明 |
|------|------|
| DockItem | Capture 原始输入、状态、建议快照 |
| Entry | 归档后的结构化知识单元 |
| Tag / TagRelation | 分类与关系组织能力 |
| EntryRelation | 基础关联与未来扩展位 |
| ReviewSnapshot | Review 页面聚合数据缓存 |

### 8.3 账号控制面

| 能力 | 说明 |
|------|------|
| 登录 / 注册 / 退出 | Phase 2 必做 |
| 会话保持 | 刷新后身份恢复 |
| Workspace identity | 当前用户与工作区归属 |
| future sync authorization | 为 Phase 5 同步授权预留边界 |
| future collaboration permission | 为协作授权预留边界 |

---

## 9. 扩展入口

### 9.1 预留入口清单

| 入口 | 对应阶段 | 说明 |
|------|------|------|
| importer adapters | Phase 4 | Markdown / 文档导入扩展点 |
| capture adapters | Phase 4 | 语音输入与扩展采集接入点 |
| search index adapter | Phase 4 | 搜索增强扩展点 |
| graph / tree view extension | Phase 4 | 树感 / 图谱增强视图 |
| sync adapter | Phase 5 | 多端同步扩展点 |
| collaboration boundary | Phase 5 | 共享、权限、协作空间扩展点 |
| AI suggestion provider | Phase 5 | 用户自带模型 / 平台模型扩展点 |

### 9.2 接口原则

```text
Importer Adapters:
  - importer interface
  - normalize pipeline
  - imported content -> dock
  - tag mapping hook

Capture Adapters:
  - text / voice / import unified capture contract
  - all capture results -> DockItem

Sync Adapter:
  - local-first architecture preserved
  - workspace-scoped sync authorization

AI Suggestion Provider:
  - pluggable provider interface
  - default rules-first
  - provider not required for product validity
```

---

## 10. 目录结构建议

```text
apps/
  web/
    app/
      workspace/
        components/
          Sidebar.tsx
          WorkspaceShell.tsx
          QuickInputBar.tsx
          ExpandedEditor.tsx
          ContentPanel.tsx
      dock/
      browse/
      review/
      auth/
    lib/
      auth/
        session.ts
        workspace-context.ts
      db/
        local-content-db.ts
        repositories/
packages/
  domain/
    src/
      types.ts
      state-machine.ts
      suggestion-engine.ts
      archive-service.ts
      review-aggregator.ts
      selectors.ts
      rules/
        keyword-rules.ts
        tag-rules.ts
        relation-rules.ts
```

原则：
- `packages/domain` 只承载纯逻辑，不依赖 UI、Web 框架或具体存储实现。
- `apps/web` 负责工作台、账户交互、浏览器持久化与页面编排。
- 账号控制面与本地内容主源逻辑隔离，避免未来同步或协作时重构整个域模型。

---

## 11. Phase 对齐

### 11.1 Phase 2 / Demo 闭环与可用基线

| 内容 | 架构要求 |
|------|------|
| 账号系统成立 | 必须有 Auth / Session / Workspace identity |
| Capture 双形态输入 | 必须有 Quick Input Bar + Expanded Editor 共用 Capture pipeline |
| 输入区结构纠偏 | 工作台布局边界清晰，输入区不横跨主模块 |
| Dock 主线成立 | DockItem 状态流转稳定 |
| 二次整理成立 | Entry 可回到整理链路 |
| Browse / Review 可用 | 查询、筛选、聚合与再整理入口成立 |

### 11.2 Phase 3 / 产品化打磨与前端交互优化

| 内容 | 架构关注点 |
|------|------|
| 输入体验打磨 | Quick Input / Expanded Editor 层级与反馈统一 |
| 工作台信息架构打磨 | WorkspaceShell、总览、对象阅读顺序优化 |
| 前端状态收敛 | 页面状态、局部更新、错误恢复更稳定 |

### 11.3 Phase 4 / 扩展功能与结构增强

| 内容 | 架构关注点 |
|------|------|
| 导入能力 | importer adapters |
| 语音输入 | capture adapters |
| 搜索增强 | search index adapter |
| 图谱 / 树感增强 | graph / tree view extension |
| 高级 Review / Insight | review aggregation 扩展 |

### 11.4 Phase 5 / 同步、协作与智能增强

| 内容 | 架构关注点 |
|------|------|
| 云同步 | sync adapter |
| 多人协作 | collaboration / permission boundary |
| AI provider | pluggable suggestion provider |
| 账号扩展 | 多登录方式、更多 workspace 边界 |

---

## 12. 架构风险与缓解

| 风险 | 影响 | 缓解方案 |
|------|------|---------|
| 规则建议效果有限 | 用户对整理价值失望 | 记录用户修正反馈，持续强化本地规则与信号 |
| 账号与本地数据耦合过深 | 后续同步重构成本高 | 明确 Account Control Plane 与 Local Content Plane 分层 |
| 输入能力仍偏短文本 | 无法服务知识库用户 | 以双形态输入作为 Phase 2 架构前提，不降级回单一输入框 |
| 工作台布局继续漂移 | UI 难以进入 Phase 3 打磨 | 把版式边界写入架构约束与验收标准 |
| Tag 碎片化 | 组织能力退化 | TagRelation、同义词与推荐反馈回路提前预留 |

---

## 13. ADR（架构决策记录）

### ADR-001：采用 Platform-Agnostic Domain Core

**决策**：`packages/domain` 不依赖 Web、UI 或具体存储实现。  
**原因**：保持核心规则稳定，便于后续多端与服务化演进。

### ADR-002：内容主源与账号控制面分层

**决策**：内容继续本地优先，但账号与会话不与本地内容存储混成同一层。  
**原因**：Phase 2 必须有账号，且未来还要接同步、协作与授权。

### ADR-003：产品层统一从 Inbox 收敛为 Dock

**决策**：文档与后续新模块命名统一使用 `Dock` / `DockItem`。  
**原因**：与 PRD、产品命名和 MindDock 品牌保持一致。

### ADR-004：Capture 采用双形态输入

**决策**：Quick Input Bar 与 Expanded Editor 共用一条 Capture pipeline。  
**原因**：既保留低门槛记录，又能支持长内容输入，不让知识库用户被单一小输入框限制。

### ADR-005：规则引擎优先，AI Provider 后置可插拔

**决策**：Phase 2-4 默认规则引擎和本地推荐，Phase 5 再接 AI provider。  
**原因**：保证稳定性、可解释性与成本控制。

### ADR-006：归档不是一次性终局

**决策**：Entry 必须支持再次打开与重新整理。  
**原因**：产品主线要求持续整理，而不是一次性入库后只读。

---

## 14. 版本差异说明（v4.7）

本次对齐 PRD 的核心变化：

1. **从纯本地单用户叙事改为“本地内容主源 + 账号控制面”**：账号系统被前移到 Phase 2，架构不再否认身份层存在。
2. **从 Inbox 收敛到 Dock**：产品层与架构层术语统一。
3. **Capture 升级为双形态输入架构**：Quick Input Bar 与 Expanded Editor 共同组成 Capture 主线。
4. **Phase 规划重新对齐 PRD v4.7**：Phase 3 不再写成“质量收敛”，Phase 4 / 5 的扩展边界同步更新。
