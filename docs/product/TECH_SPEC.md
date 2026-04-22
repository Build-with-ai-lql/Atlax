# Atlax 技术规格说明书（TECH SPEC）

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档版本 | v4.9 |
| 文档类型 | 技术规格文档 |
| 当前阶段 | Phase 2 可上线 Demo 冲刺 |
| 最后更新 | 2026-04-23 |

---

## 1. 文档目标

本文档将 `PRD v4.9` 转换为可执行技术边界，目标是交付“能上线、能验证、能继续迭代”的 Phase 2 版本。

技术目标：
- 双模式统一知识库落地（Classic/Chat 同模型）。
- P0 闭环能力稳定交付（Dock/Tag/Suggest/Archive/Browse/Auth）。
- 留存与验证指标可采集。
- 对后续阶段只留扩展点，不混入当前实现。

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
- 复杂动画与微交互
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

## 9. 非功能要求（Phase 2）

| 维度 | 目标 |
|------|------|
| 可用性 | 主闭环成功率可稳定演示 |
| 性能 | 常规数据规模下主工作台流畅 |
| 稳定性 | 核心操作失败有提示与恢复路径 |
| 可维护性 | Domain 与 UI 分层，关键逻辑可测试 |
| 可观测性 | 指标事件可追踪 |

---

## 10. Phase 对齐（精简）

### 10.1 Phase 2

交付可上线 Demo 闭环与指标验证能力。

### 10.2 Phase 3

做体验统一、Review 增强、Chat 策略优化。

### 10.3 Phase 4

做导入、搜索增强、关系增强、扩展输入。

### 10.4 Phase 5

做同步、多端、协作、AI provider。

---

## 11. 风险与应对

| 风险 | 应对 |
|------|------|
| Chat 路径落不进主线 | 强制 `ChatToDockMapper` 与统一归档流程 |
| 范围膨胀导致延期 | P0 白名单机制，非白名单全部后移 |
| 建议质量波动 | 可解释、可修正、用户覆盖优先 |
| 数据结构分叉 | 统一 Dock/Entry/Tag 模型，不按模式分表 |

---

## 12. 版本差异说明（v4.9）

1. 全面对齐 PRD v4.9 的 Phase 2 P0 边界。
2. 新增 Chat 最小闭环技术实现约束。
3. 新增 North Star 指标采集与口径定义。
4. 压缩 Phase 4/5 技术细节，仅保留方向与接口。
