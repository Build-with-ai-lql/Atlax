# Atlax 架构说明书（ARCHITECTURE）

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档版本 | v4.9 |
| 文档类型 | 架构设计文档 |
| 当前阶段 | Phase 2 可上线 Demo 冲刺 |
| 最后更新 | 2026-04-23 |

---

## 1. 架构目标与边界

### 1.1 架构目标

Atlax 架构服务于一个明确目标：

> 在本地优先前提下，跑通“输入 → 整理 → 归档 → 回看 → 再整理”的可上线闭环。

阶段目标：
- 支撑 `Classic / Chat` 双入口，但始终写入同一知识库。
- 支撑 `Dock → Suggest/Tag → Archive → Browse` 主线稳定可用。
- 支撑账号身份与工作区隔离，但不引入重服务端依赖。
- 支撑后续扩展接口（导入、搜索、同步、AI），当前不实现完整能力。

### 1.2 Phase 2 架构边界（P0）

| 边界 | Phase 2 处理方式 |
|------|------------------|
| 双模式交互 | 必做，Classic / Chat 共用同一数据主线 |
| 账号系统 | 必做，最小登录、会话恢复、工作区上下文 |
| 内容主源 | 必做，本地结构化存储为主 |
| Suggestion | 必做，规则引擎基础版，可解释可修正 |
| Tag | 必做，用户显式选择优先 |
| Review 完整版 | 不做，后移 Phase 3 |
| 导入、语音、搜索增强 | 不做，后移 Phase 4 |
| 同步、多端、协作、AI provider | 不做，后移 Phase 5 |

### 1.3 关键架构原则

- `PRD v4.9` 是产品边界唯一真源。
- `Dock` 是统一待整理入口，不再使用产品术语 `Inbox`。
- `Classic / Chat` 只影响交互层，不影响底层数据模型。
- `Tag` 是当前结构骨架，不是可选筛选器。
- 归档不是终局，架构必须支持 `re-organize`。

---

## 2. 高层架构

### 2.1 三层四面架构

```text
┌──────────────────────────────────────────────────────────────┐
│                     Interaction Layer                        │
│ Classic Workspace UI / Chat UI / Mode Switch Controller     │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                        Domain Layer                          │
│ Capture Flow / Dock State / Suggest Rules / Archive Rules   │
│ Tag Policy / Browse Query / Reorganize Policy               │
└──────────────────────────────────────────────────────────────┘
                 │                               │
                 ▼                               ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│      Local Content Plane     │   │      Identity Control Plane  │
│ DockItem / Entry / Tag /     │   │ User / Session / Workspace   │
│ Relations / Snapshots        │   │ Auth context / future sync id|
└──────────────────────────────┘   └──────────────────────────────┘
```

### 2.2 分层职责

| 层级 | 职责 |
|------|------|
| Interaction Layer | Classic/Chat 展示与交互，模式切换，输入承接 |
| Domain Layer | 状态流转、建议规则、归档规则、标签策略、查询策略 |
| Local Content Plane | 知识内容主源，承担结构化沉淀 |
| Identity Control Plane | 登录、会话、工作区上下文与授权边界 |

---

## 3. 统一知识模型

### 3.1 核心实体

| 实体 | 作用 |
|------|------|
| `DockItem` | 待整理内容主实体（Classic/Chat 都写入） |
| `Entry` | 归档后的结构化知识条目 |
| `Tag` | 结构骨架与聚合入口 |
| `SuggestionItem` | 类型、Tag、归属建议 |
| `ArchiveIntent` | 归档时用户确认后的最终意图 |
| `WorkspaceSession` | 当前身份与工作区上下文 |

### 3.2 关系模型

- `EntryTagRelation`
- `EntryProjectRelation`（可选）
- `EntryRelation`（预留）
- `TagRelation`（预留）

### 3.3 统一约束

- Classic 新建内容必须生成 `DockItem`。
- Chat 对话整理结果也必须生成 `DockItem` 或直接 `ArchiveIntent`。
- 任一模式归档后统一生成 `Entry`。
- 任一 `Entry` 都必须可重新回到 `Dock` 再整理。

---

## 4. 关键流程架构

### 4.1 Classic 路径

1. 用户在 `Quick Input` 或 `Expanded Editor` 输入。
2. 生成 `DockItem(status=pending)`。
3. 执行 Suggestion / Tag 确认。
4. Archive 生成 `Entry`。
5. 在 Browse 中回看、筛选、再整理。

### 4.2 Chat 路径

1. 用户以一句话或片段进入 Chat。
2. Agent 追问并补足最小上下文。
3. 产出整理候选（type/tag/归属）。
4. 写入 `DockItem` 并进入同一归档链路。
5. 在 Browse 中与 Classic 内容统一管理。

### 4.3 状态机

```text
pending -> suggested -> archived -> reopened -> pending
```

强约束：
- 用户主动 Tag 始终覆盖系统建议。
- 建议可忽略、可修正、可延后。
- 不允许形成 Chat 独立内容仓。

---

## 5. 模块边界与代码映射

### 5.1 应用层（`apps/web`）

- `workspace`：Classic 主工作台。
- `capture`：输入入口与展开编辑。
- `dock`：待整理视图。
- `auth`：会话与路由守卫。
- `chat`（新增或并入 workspace）：引导式交互入口。

### 5.2 领域层（`packages/domain`）

- `state-machine`：状态流转。
- `suggestion-engine`：规则建议。
- `tag-service`：Tag 策略。
- `archive-service`：归档与回写。
- `selectors`：Browse 查询。

### 5.3 存储层

- 本地内容：IndexedDB/Dexie（或当前仓储实现）。
- 身份控制：认证服务 + session 存储。
- 后续同步：仅预留 adapter，当前不接入。

---

## 6. 可观测性与验证接口

### 6.1 事件埋点（Phase 2 必做）

- `capture_created`
- `chat_guided_capture_created`
- `suggestion_shown`
- `tag_confirmed`
- `archive_completed`
- `browse_revisit`
- `mode_switched`
- `weekly_review_opened`

### 6.2 指标映射

| 指标 | 依赖事件 |
|------|---------|
| 每用户日均记录次数 | `capture_created` |
| Chat 引导后归档率 | `chat_guided_capture_created` + `archive_completed` |
| 7 日留存 | 登录/活跃事件 |
| Weekly Review 打开率 | `weekly_review_opened` |
| Chat 使用占比 | `mode_switched` + chat 相关事件 |

---

## 7. Phase 对齐（精简）

### 7.1 Phase 2（当前）

目标：可上线 Demo 闭环。
- 做：Classic/Chat 最小闭环、Dock/Tag/Suggest/Archive/Browse、登录、单页结构稳定。
- 不做：复杂 Review、高级关系浏览、复杂动画。

### 7.2 Phase 3

目标：体验统一与留存增强。
- Review 增强、Chat 策略优化、Browse/Database 体验优化。

### 7.3 Phase 4

目标：扩展能力验证。
- 导入、搜索增强、关系增强、扩展输入。

### 7.4 Phase 5

目标：同步与智能增强。
- 多端同步、协作、AI provider。

---

## 8. 架构风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| Chat 与 Classic 各自长出独立模型 | 知识库割裂 | 强制统一 `DockItem/Entry/Tag` 模型 |
| Phase 2 范围膨胀 | 无法上线验证 | 严格按 P0 清单验收 |
| Suggestion 不可信 | 用户放弃整理 | 强制可解释 + 用户覆盖优先 |
| 输入结构不稳定 | 使用成本上升 | 固化单页结构与输入布局边界 |

---

## 9. 版本差异说明（v4.9）

1. 对齐 `PRD v4.9`，从“功能扩展导向”切换到“可上线闭环导向”。
2. 架构边界明确为 `Phase 2 P0`，后续阶段仅保留方向。
3. 明确 Chat/Classic 共用同一知识模型与状态机。
4. 新增指标埋点与 North Star 指标映射，支持上线验证。
