# Atlax 架构说明书（ARCHITECTURE）

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档版本 | v2.0 |
| 文档类型 | 架构设计文档 |
| 当前阶段 | MVP 规划阶段 |
| 最后更新 | 2026-04-20 |

---

## 1. 架构目标与边界

### 1.1 架构目标

Atlax MVP 架构只服务一个目标：

> **以最小可实现复杂度跑通“输入→整理→复用/回顾”的闭环。**

具体目标：
- 支持 Web-first 单用户体验
- 保证本地优先与数据可导出
- 支持规则引擎驱动的整理与提醒
- 为后续服务化与多端化预留演进路径

### 1.2 架构边界（MVP）

| 边界 | 处理方式 |
|------|----------|
| 多端同步 | 不做 |
| 多人协作与权限 | 不做 |
| 复杂 AI Agent | 不做 |
| 云端依赖 | 默认无强依赖 |
| 本地 Markdown 双向实时同步 | 不做 |

---

## 2. MVP 总体架构

### 2.1 高层架构

```text
┌─────────────────────────────────────────────┐
│                Web App (Next.js)            │
│                                             │
│  Capture / Inbox / Database / Review UI     │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              Application Layer              │
│                                             │
│  CaptureService                             │
│  InboxService                               │
│  SuggestionEngine (Rule-based)              │
│  ArchiveService                              │
│  ReviewService                              │
│  HealthService                              │
│  InsightService                             │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│                Data Layer                   │
│                                             │
│  Local Structured Store (IndexedDB)         │
│  Export Adapter (Markdown)                  │
└─────────────────────────────────────────────┘
```

### 2.2 架构解释

- 展示层与应用层可同仓同进程，减少部署复杂度
- 核心智能能力使用规则引擎，确保稳定可控
- 数据主源是本地结构化存储
- Markdown 是导出层，不参与 MVP 实时双向同步

---

## 3. 模块架构

### 3.1 核心模块

| 模块 | 职责 | 输入 | 输出 |
|------|------|------|------|
| Capture | 接收用户内容 | 文本/语音转写 | Inbox 条目 |
| Inbox | 管理待整理条目 | Inbox 条目 | 建议结果、归档动作 |
| SuggestionEngine | 生成结构化建议 | 原始文本、上下文 | type/tags/project 建议 |
| Archive | 将条目结构化入库 | 建议+用户修正 | Entry/Project/Task 更新 |
| Database View | 内容查询与筛选 | 结构化数据 | Table/List 展示 |
| Review | 周报与复盘聚合 | Entry/Project/Task | 周回顾视图 |
| Health | 健康信号计算 | 历史行为数据 | Health 信号 |
| Insight | 主动提醒生成 | Health 信号+行为规则 | Insight 卡片 |

### 3.2 依赖关系

```text
Capture → Inbox → SuggestionEngine → Archive → Database
                                     ↘
                                      Review ← Health ← Insight
```

说明：
- `Review` 聚合 `Health` 与 `Insight`
- `Health` 与 `Insight` 在 MVP 中是规则驱动子能力
- 模块间通过清晰接口调用，避免共享可变状态耦合

---

## 4. 数据架构

### 4.1 数据主源原则

MVP 阶段采用单主源策略：

- 主源：本地结构化存储（IndexedDB）
- 导出：按需生成 Markdown
- 不做 Markdown→主源反向自动同步

### 4.2 核心实体

| 实体 | 关键字段 |
|------|----------|
| InboxEntry | id, rawText, sourceType, status, createdAt |
| Entry | id, title, content, type, tags, projectId, status, viewCount, timestamps |
| Project | id, name, status, lastActivityAt |
| Task | id, title, status, projectId, sourceEntryId |
| InsightCard | id, type, message, actionPayload, createdAt |
| WeeklyReviewSnapshot | weekRange, metrics, healthSignals, insights |

### 4.3 数据状态流

```text
Input Created
  → Inbox Pending
  → Suggested
  → Archived as Entry
  → Queried in Database
  → Aggregated in Weekly Review
```

---

## 5. 关键流程架构

### 5.1 Capture → Inbox

1. 用户输入文本或语音转写
2. `CaptureService` 做基础清洗（空值、长度、非法字符）
3. 写入 `InboxEntry(status=pending)`

### 5.2 Inbox Suggestion → Archive

1. `SuggestionEngine` 基于规则生成建议
2. 用户接受或微调建议
3. `ArchiveService` 生成 `Entry`，并更新项目/任务关联
4. 原 `InboxEntry` 标记 `archived`

### 5.3 Weekly Review 聚合

1. `ReviewService` 按周聚合新增、归档、项目活动
2. `HealthService` 输出健康信号
3. `InsightService` 生成提醒卡片
4. 前端渲染统一回顾页面

---

## 6. Knowledge Health / Insight Engine 架构定位

### 6.1 Knowledge Health

在 MVP 中不是独立复杂平台，而是 `Review` 的规则计算子系统。

建议规则：
- `unused_entries`: 长期未打开内容
- `stalled_projects`: 长期无活动项目
- `orphan_entries`: 无标签无项目内容
- `unstructured_inbox`: 长期未处理 Inbox

### 6.2 Insight Engine

在 MVP 中不是对话系统，而是提醒生成器。

建议输出：
- 项目停滞提醒
- 主题聚合提醒
- 内容回顾提醒

> 仅输出“建议下一步”，不自动执行操作。

---

## 7. 分层与目录建议（与当前仓库兼容）

### 7.1 建议结构

```text
apps/
  web/
    src/
      components/
      modules/
        capture/
        inbox/
        database/
        review/
      services/
        capture.service.ts
        inbox.service.ts
        suggestion.engine.ts
        archive.service.ts
        review.service.ts
        health.service.ts
        insight.service.ts
      stores/
      types/
      utils/
packages/
  shared/
```

### 7.2 设计原则

- 以业务模块（`modules/*`）组织 UI
- 以能力服务（`services/*`）组织逻辑
- 类型定义统一管理，减少跨模块隐式耦合

---

## 8. 部署架构（MVP）

### 8.1 当前推荐

- 部署形态：单 Web 应用
- 可选平台：Vercel / 本地运行
- 数据存储：浏览器本地
- 备份方式：用户手动导出

### 8.2 不在 MVP 承诺范围

- 独立后端服务集群
- 云端数据库高可用架构
- 多地域部署
- 实时协同基础设施

---

## 9. 演进路线（架构视角）

### 9.1 Phase 2（可用版本）

- 引入可选 API 层，统一服务接口
- 引入 SQLite/Prisma（桌面端或服务端场景）
- 增强搜索能力
- 增加基础同步设计（仍可选）

### 9.2 Phase 3（增强版本）

- 云端同步与冲突解决
- 多设备体验一致性
- LLM 增强建议（成本可控前提）
- 可插拔扩展机制

---

## 10. 架构风险与缓解

| 风险 | 影响 | 缓解方案 |
|------|------|---------|
| 规则建议效果有限 | “AI 整理”感知偏弱 | 持续迭代规则、增加用户修正反馈回路 |
| 本地存储能力上限 | 数据量增长后体验下降 | 控制 MVP 数据规模、增强导出机制 |
| 范围回弹 | 交付失焦 | 以核心闭环为唯一优先级 |
| 语音兼容问题 | 部分用户体验不一致 | 语音入口降级为可选，不阻断主流程 |

---

## 11. ADR（本次同步）

### ADR-005：MVP 采用 Web-first 本地优先架构

**决策**：MVP 不强依赖独立后端与云端数据库，优先本地闭环。  
**原因**：实现复杂度低、验证速度快、与 PRD 的“先验证核心价值”一致。

### ADR-006：Suggestion/Insight 采用规则优先

**决策**：MVP 默认规则引擎，不以 LLM 作为必备依赖。  
**原因**：成本可控、稳定性可控、可解释性更强。

### ADR-007：Markdown 作为导出层而非主写入层

**决策**：MVP 采用“结构化主源 + Markdown 导出”策略。  
**原因**：避免早期双向同步导致一致性和复杂度失控。
