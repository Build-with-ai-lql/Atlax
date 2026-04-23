# Atlax 架构说明书（ARCHITECTURE）

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档版本 | v5.1 |
| 文档类型 | 架构设计文档 |
| 当前阶段 | Pre-Phase3-Architecture |
| 最后更新 | 2026-04-23 |

---

## 0. 架构决策摘要（Pre-Phase3-Architecture 新增）

### 0.1 架构风格选型

| 维度 | 决策 | 理由 |
|------|------|------|
| 整体风格 | **DDD-lite + 模块化单体** | 团队规模中小型，Phase 2 已验证单体可行性，DDD-lite 提供领域边界但不引入完整 DDD 复杂度 |
| 扩展模式 | **Ports/Adapters（六边形架构）** | 隔离核心业务与外部依赖（DB、UI、API），确保后续可切换存储或接入后端服务 |
| 模块组织 | **按领域能力划分包** | Capture、Dock、Suggest、Tag、Archive 等作为独立模块，模块内聚、模块间松耦合 |

### 0.2 架构分层

```text
┌─────────────────────────────────────────────────────────────┐
│                    前端应用层 (apps/web)                     │
│    Classic UI / Chat UI / Mode Switch / Workspace Shell    │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/RPC
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   适配器层 (Adapters)                        │
│    Primary Adapters: UI Handlers / API Controllers         │
│    Secondary Adapters: Repository Impl / External Services   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     端口层 (Ports)                           │
│    Input Ports: Application Services / Use Cases             │
│    Output Ports: Repository Interfaces / Service Interfaces  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     领域层 (Domain)                         │
│    Entities / Value Objects / Domain Services               │
│    State Machine / Suggestion Engine / Tag Policy           │
└─────────────────────────────────────────────────────────────┘
```

### 0.3 关键架构原则

1. **依赖单向**：外层依赖内层，内层不感知外层实现
2. **端口隔离**：领域层只定义接口，适配器负责实现
3. **模块自治**：每个领域模块可独立测试和演进
4. **存储可替换**：通过 Repository Pattern 支持后续切换存储方案

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
- `FRONT_DESIGN.md` 是前端 UI/交互/动效规范真源；Phase 2-5 所有前端变更均需对齐该规范。
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

### 4.4 `updateDockItemText` 状态重置语义

当用户编辑 DockItem 文本内容时，后端执行以下强制状态重置：

| 字段 | 重置值 | 说明 |
|------|--------|------|
| `rawText` | 新文本 | 替换原始输入内容 |
| `status` | `pending` | 强制回退到待处理状态 |
| `suggestions` | `[]`（清空） | 旧建议在新文本下无效，必须清空 |
| `processedAt` | `null` | 标记为未处理，等待重新 suggest |

语义规则：文本变更 => 上下文失效 => 建议失效 => 必须重走 suggest 流程。  
此语义与 `reopenItem`（archived -> reopened）保持一致：两者都将条目重置为 `pending + 清空建议`。

---

## 5. 模块边界与代码映射（Phase 3 强化）

### 5.1 整体模块结构（Ports/Adapters 视角）

| 层级 | 模块 | 代码位置 | 职责 |
|------|------|---------|------|
| **前端应用层** | `apps/web` | `app/*/page.tsx`, `app/*/_components/*` | UI 交互、路由、状态管理 |
| **Primary Adapters** | UI 适配器 | `app/*/_components/*.tsx` | 将用户操作转换为领域调用 |
| **Application Services** | 用例封装 | `lib/*.ts` (auth, events, repository) | 编排领域逻辑，处理跨模块协作 |
| **Domain Layer** | 领域核心 | `packages/domain/src/*` | 状态机、规则引擎、标签策略 |
| **Secondary Adapters** | 存储适配器 | `lib/db.ts` | IndexedDB/Dexie 实现 |
| **Output Ports** | 仓储接口 | `packages/domain/src/types.ts` | 领域定义的仓储接口 |

### 5.2 前端应用层（`apps/web`）

- `workspace`：Classic 主工作台
- `capture`：输入入口与展开编辑
- `dock`：待整理视图
- `auth`：会话与路由守卫
- `chat`（新增或并入 workspace）：引导式交互入口

### 5.3 领域层（`packages/domain`）

- `state-machine`：状态流转
- `suggestion-engine`：规则建议
- `tag-service`：Tag 策略
- `archive-service`：归档与回写
- `selectors`：Browse 查询

### 5.4 存储层（Secondary Adapters）

- 本地内容：IndexedDB/Dexie（`lib/db.ts` 实现）
- 身份控制：认证服务 + session 存储
- 后续同步：仅预留 adapter，当前不接入

### 5.5 后端待实现模块拆分规划（仅规划，不实现）

以下模块对应前端接口预留点，后端尚未拆分为独立服务/模块，此处列出规划边界供后续迭代对齐：

| 规划模块 | 对应前端预留点 | 状态 | 优先级 |
|---------|--------------|------|--------|
| `DockItemEditService` | `updateDockItemText` 调用层封装，含状态重置校验 | 已在 repository 实现，待提取为独立 service | Phase 3 |
| `SuggestionResetPolicy` | 文本变更后建议失效策略 | 规则内嵌于 `updateDockItemText`，待抽象为策略类 | Phase 3 |
| `ImmersiveEditorBackend` | 沉浸式编辑器后端适配（全文内容保存接口） | 未实现，前端已预留 `Maximize` 按钮 | Phase 3 |
| `FileService` / `ProjectService` | 文件操作扩展后端实现 | 未实现，前端 `DropdownItem` 已占位 | Phase 4 |
| `MarkdownRenderService` | Markdown 渲染预览后端接口（若需服务端渲染） | 未实现，当前为纯前端渲染 | Phase 4 |

> 约束：以上规划仅为接口边界对齐，Phase 2 不实现上述拆分，不影响当前可上线闭环。

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
- 不做：复杂 Review、高级关系浏览、超出 `FRONT_DESIGN` 基线的新增重交互能力。

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

## 9. 版本差异说明（v4.9 -> v4.10）

1. 对齐 `PRD v4.9`，从“功能扩展导向”切换到“可上线闭环导向”。
2. 架构边界明确为 `Phase 2 P0`，后续阶段仅保留方向。
3. 明确 Chat/Classic 共用同一知识模型与状态机。
4. 新增指标埋点与 North Star 指标映射，支持上线验证。
5. **v4.10 新增**：补充 `updateDockItemText` 状态重置语义（§4.4）与后端待实现模块拆分规划（§5.4），与 Phase 2.14.10.2 工程对齐。
