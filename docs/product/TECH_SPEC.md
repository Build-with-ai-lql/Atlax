# Atlax 技术规格说明书（TECH SPEC）

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档版本 | v3.0 |
| 文档类型 | 技术规格文档 |
| 当前阶段 | MVP 规划阶段 |
| 最后更新 | 2026-04-20 |

---

## 1. 文档目标

本文档用于将 `PRD v3.0` 的产品目标转换为可执行的技术方案，重点保证：

- 技术实现与 MVP 范围一致
- 不承诺当前阶段无法稳定交付的能力
- 优先验证“输入 → 整理 → 复用/回顾”核心闭环

---

## 2. MVP 技术策略（务实版）

### 2.1 总体策略

Atlax 当前 MVP 采用 **Web-first + 本地优先 + 规则引擎优先**：

- **形态**：Web Demo（单用户）
- **核心目标**：验证“系统代整理 + 主动提醒”的体验
- **实现优先级**：
  1. 先跑通本地数据闭环
  2. 先做稳定规则建议
  3. 再逐步增强 AI 能力

### 2.2 当前阶段明确约束

| 约束 | 技术决策 |
|------|----------|
| 不做多端同步 | 不引入同步引擎和冲突解决 |
| 不做多人协作 | 不引入账号体系与权限模型 |
| 不依赖独立后端 | 采用前端本地数据层 + 可选轻 API |
| 不强依赖 LLM | 建议系统优先规则引擎，LLM 仅后续可插拔 |

---

## 3. 技术选型

### 3.1 前端与应用层

| 技术 | 版本建议 | 用途 |
|------|---------|------|
| Next.js | 14.x | Web 应用框架 |
| React | 18.x | UI 渲染 |
| TypeScript | 5.x | 类型系统 |
| Tailwind CSS | 3.x | 样式体系 |
| Zustand | 4.x | 本地状态管理 |
| TanStack Table | 8.x | Database 视图表格 |
| React Hook Form + Zod | 7.x / 3.x | 输入表单与校验 |

> 说明：如当前仓库仍在早期脚手架阶段，以上为目标技术栈，不要求一次性全部引入。

### 3.2 数据与存储

| 技术 | 阶段 | 用途 |
|------|------|------|
| IndexedDB（via Dexie 等） | MVP | 浏览器本地结构化数据存储 |
| 本地文件导出（Blob/下载） | MVP | Markdown 导出 |
| SQLite + Prisma | Phase 2 可选 | 桌面端或服务端化后可引入 |
| PostgreSQL | 后续 | 云端同步与多用户能力 |

> 关键原则：**MVP 不把 SQLite + Prisma 作为必选前提**，避免文档与实际 Web-first 形态冲突。

### 3.3 AI 与建议引擎

| 层级 | MVP 实现 |
|------|----------|
| 建议引擎核心 | 规则引擎（关键词、模式、上下文） |
| AI 增强层 | 可选（用户触发/配置后启用） |
| 成本控制 | 不默认后台连续调用 LLM |

---

## 4. MVP 功能到技术映射

### 4.1 Capture

**产品目标**：低摩擦输入。  
**技术实现**：
- 文本输入表单
- 快速新建入口
- 语音转写入口（浏览器支持时启用）
- 新建后统一写入 `InboxEntry`

**输入数据结构（建议）**：

```ts
interface InboxEntry {
  id: string;
  rawText: string;
  sourceType: 'text' | 'voice';
  createdAt: string;
  status: 'pending' | 'suggested' | 'archived';
}
```

### 4.2 Inbox AI 整理

**产品目标**：系统先给建议，用户一键确认。  
**技术实现**：
- `SuggestionEngine`（规则驱动）
- 建议字段：`type`、`tags`、`projectId`
- 归档动作将条目转为结构化 `Entry`

**规则优先级建议**：
1. 显式关键词规则（如“会议”、“复盘”、“TODO”）
2. 最近项目上下文匹配
3. 高频标签召回
4. 默认类型回退（`note`）

### 4.3 Database View

**产品目标**：可管理、可筛选、可复用。  
**技术实现**：
- Table/List 双视图
- `Entries / Projects / Tasks` 三类对象
- 基础筛选：`type`、`status`、`project`、`tag`

**Entry 结构（建议）**：

```ts
interface Entry {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'meeting' | 'idea' | 'task' | 'reading';
  status: 'active' | 'archived';
  tags: string[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  lastViewedAt?: string;
}
```

### 4.4 Weekly Review

**产品目标**：让用户看到“知识在推动我前进”。  
**技术实现**：
- 周维度聚合统计
- 健康摘要（规则检测）
- 提醒卡片（Insight 规则触发）

**周统计结构（建议）**：

```ts
interface WeeklyReviewSnapshot {
  weekStart: string;
  weekEnd: string;
  newEntries: number;
  archivedEntries: number;
  inboxPending: number;
  activeProjects: number;
  healthSignals: HealthSignal[];
  insights: InsightCard[];
}
```

---

## 5. Knowledge Health 与 Insight Engine（MVP 定义）

### 5.1 Knowledge Health（规则版）

MVP 阶段按规则计算健康信号，不做复杂智能评分平台。

**规则项**：
- 长期未复用内容（如 30 天未打开）
- 高频主题未沉淀（高频标签但无项目）
- 停滞项目（14 天无更新）
- 孤岛内容（无标签且无项目）

### 5.2 Insight Engine（提醒版）

MVP 阶段 Insight Engine 是提醒系统，不是问答机器人。

**卡片类型（建议）**：
- `project_stalled`
- `topic_cluster`
- `knowledge_activation`

**结构建议**：

```ts
interface InsightCard {
  id: string;
  type: 'project_stalled' | 'topic_cluster' | 'knowledge_activation';
  message: string;
  actionLabel?: string;
  actionPayload?: Record<string, string>;
  createdAt: string;
}
```

---

## 6. API 策略（分阶段）

### 6.1 MVP 阶段

MVP 可采用以下两种方式之一，取决于实现速度：

1. **前端本地数据模式（优先）**：不依赖远程 API
2. **轻量同构 API 模式**：在 Next.js 中提供最小 API 层（仅为结构清晰）

### 6.2 建议接口（若启用 API）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/capture` | 创建 Inbox 条目 |
| GET | `/api/inbox` | 获取待整理列表 |
| POST | `/api/inbox/{id}/suggest` | 生成建议 |
| POST | `/api/inbox/{id}/archive` | 归档并结构化 |
| GET | `/api/entries` | 获取条目列表 |
| GET | `/api/review/weekly` | 获取周回顾数据 |

> 不在 MVP 首轮引入复杂接口分层、鉴权、版本治理。

---

## 7. 数据一致性与导出策略

### 7.1 MVP 数据主源

MVP 仅维护一个主数据源：**本地结构化存储**。  
Markdown 作为导出产物，而不是实时双向同步主源。

### 7.2 导出策略

- 支持单条 / 批量导出 Markdown
- frontmatter 包含核心结构化字段
- 导出失败不影响主数据完整性

### 7.3 暂不支持

- 浏览器直接监听本地 Markdown 文件并反向同步
- 跨设备自动同步
- 冲突自动合并

---

## 8. 非功能要求（MVP）

| 维度 | MVP 目标 |
|------|----------|
| 响应速度 | 常用页面首屏可交互 < 2s（本地环境） |
| 稳定性 | 关键路径（Capture→Archive→Review）成功率 > 95% |
| 可用性 | 首次用户 5 分钟内可完成一次完整闭环 |
| 数据安全 | 本地数据可导出，默认不上传云端 |

---

## 9. 开发排期建议（4 周）

| 周次 | 目标 |
|------|------|
| Week 1 | 数据模型、Capture、Inbox 基础流 |
| Week 2 | SuggestionEngine、归档、Database 基础视图 |
| Week 3 | Weekly Review、Health 信号、Insight 卡片 |
| Week 4 | Markdown 导出、稳定性修复、Demo 打磨 |

---

## 10. 风险与应对

| 风险 | 说明 | 应对 |
|------|------|------|
| 规则建议命中率不高 | 用户感知“AI 整理”价值不足 | 优先优化高频规则，记录用户修正行为 |
| 范围反复膨胀 | 再次变成“大而全”路线 | 以闭环验收标准卡范围 |
| 浏览器本地存储限制 | 大数据量与迁移能力不足 | MVP 控制数据体量，尽快提供导出 |
| 语音能力兼容性差异 | 浏览器支持不一致 | 语音入口可降级，不阻断文本流程 |

---

## 11. 版本差异说明（v3.0 相对旧版）

本次同步更新的核心变化：

1. 从“默认后端 + SQLite/Prisma 必选”调整为“Web-first 本地优先”
2. 将 `Knowledge Health` / `Insight Engine` 明确定义为规则版可落地能力
3. 删除或后置无法在 MVP 稳定交付的复杂能力（协作、同步、复杂 AI）
4. 用“功能-数据-技术”一一映射替代泛化技术堆砌
