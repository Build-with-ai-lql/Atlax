# Atlax 技术规格说明书（TECH SPEC）

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档版本 | v4.0 |
| 文档类型 | 技术规格文档 |
| 当前阶段 | Phase 2 Demo 冲刺 |
| 最后更新 | 2026-04-21 |

---

## 1. 文档目标

本文档用于将 PRD v4.0 的产品目标转换为可执行的技术方案，重点保证：

- 技术实现与 Phase 2 范围一致
- 不承诺当前阶段无法稳定交付的能力
- 优先验证"输入 → 整理 → 结构化沉淀 → 回看/利用"核心闭环

---

## 2. 技术策略

### 2.1 总体策略

Atlax 当前采用 **Web-first + 本地优先 + 规则引擎优先 + Tag 驱动**：

- **形态**：Web Demo（单用户）
- **核心目标**：验证"降低整理成本"的体验
- **UI 风格**：参考 Codex Desktop / Notion，工作台式界面
- **实现优先级**：
  1. 先跑通本地数据闭环
  2. 先做稳定规则建议 + Tag 驱动整理
  3. 再逐步增强 AI 能力

### 2.2 当前阶段明确约束

| 约束 | 技术决策 |
|------|----------|
| 不做多端同步 | 不引入同步引擎和冲突解决 |
| 不做多人协作 | 不引入账号体系与权限模型 |
| 不依赖独立后端 | 采用前端本地数据层 + 可选轻 API |
| 不强依赖 LLM | 建议系统优先规则引擎，LLM 仅后续可插拔 |
| Import 模块延后 | 预留 importer interface，Phase 4 实现 |

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

### 3.2 数据与存储

| 技术 | 阶段 | 用途 |
|------|------|------|
| IndexedDB（via Dexie 等） | Phase 2 | 浏览器本地结构化数据存储 |
| 本地文件导出（Blob/下载） | Phase 2 | Markdown 导出 |
| SQLite + Prisma | Phase 3 可选 | 桌面端或服务端化后可引入 |
| PostgreSQL | Phase 5+ | 云端同步与多用户能力 |

### 3.3 AI 与建议引擎

| 层级 | Phase 2 实现 |
|------|----------|
| 建议引擎核心 | 规则引擎（关键词、模式、上下文） + Tag 驱动 |
| AI 增强层 | Phase 4，预留 AI provider 接口 |
| 成本控制 | 不默认后台连续调用 LLM |

---

## 4. 核心技术原则

### 4.1 Domain Model 不绑定 UI 视图

| 原则 | 说明 |
|------|------|
| UI 可呈现树状、列表、图谱 | 视图层自由选择呈现方式 |
| Domain 只维护结构化实体与关系 | 不绑定特定视图结构 |
| 不允许为了做树状 UI 把所有数据强塞成单一树 | 保持数据模型灵活性 |

### 4.2 当前推荐机制以 Deterministic Rules 为主

| 原则 | 说明 |
|------|------|
| 基于 Tag、关键词、来源、状态、字段映射等规则 | 可解释、可调试、可验收 |
| 先做可解释、可调试、可验收 | 不依赖黑盒模型 |
| 后续再预留 AI provider 接口 | Phase 4 可插拔 |

### 4.3 查询与后续搜索要提前考虑

| 原则 | 说明 |
|------|------|
| 不能使用只适合展示、不适合查询的数据结构 | 保持查询能力 |
| 要为后续 tag filter、relationship query、review aggregation 留空间 | 预留扩展 |

### 4.4 前端架构要支持工作台式 UI

| 原则 | 说明 |
|------|------|
| 左侧导航/对象区 | Sidebar |
| 中/右侧详情或整理面板 | Content Panel |
| 统一 action 区 | Action Area |
| 尽量减少"每个动作都跳新页面" | 单页操作 |

---

## 5. 核心数据模型

### 5.1 实体定义

```ts
interface InboxEntry {
  id: string;
  rawText: string;
  sourceType: 'text' | 'voice' | 'import';
  createdAt: string;
  status: 'pending' | 'suggested' | 'archived';
  suggestedTags?: string[];
  suggestedType?: EntryType;
  suggestedProjectId?: string;
}

interface Entry {
  id: string;
  title: string;
  content: string;
  type: EntryType;
  status: 'active' | 'archived';
  tags: string[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  lastViewedAt?: string;
}

type EntryType = 'note' | 'meeting' | 'idea' | 'task' | 'reading';

interface Tag {
  id: string;
  name: string;
  category?: string;
  usageCount: number;
  synonyms?: string[];
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  lastActivityAt: string;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  projectId?: string;
  sourceEntryId?: string;
}
```

### 5.2 关系定义

```ts
interface EntryTagRelation {
  entryId: string;
  tagId: string;
  createdAt: string;
}

interface EntryProjectRelation {
  entryId: string;
  projectId: string;
  createdAt: string;
}

interface TagRelation {
  sourceTagId: string;
  targetTagId: string;
  relationType: 'parent_child' | 'related' | 'synonym';
}
```

### 5.3 Suggestion 模型

```ts
interface SuggestionItem {
  field: 'type' | 'tag' | 'project';
  value: string;
  confidence: number;
  reason: string;
}

interface SuggestionResult {
  entryId: string;
  suggestions: SuggestionItem[];
  generatedAt: string;
  engineVersion: string;
}

interface ArchiveIntent {
  inboxEntryId: string;
  acceptedSuggestions: SuggestionItem[];
  userModifications: Partial<Entry>;
  createdAt: string;
}
```

---

## 6. 功能到技术映射

### 6.1 Capture

**产品目标**：快速输入内容。  
**技术实现**：
- Quick Input Bar 组件
- 文本输入表单
- 新建后写入 `InboxEntry(status=pending)`

### 6.2 Inbox

**产品目标**：查看待整理内容。  
**技术实现**：
- Inbox 列表组件
- 状态流转：pending → suggested → archived
- Suggestion 触发机制

### 6.3 Suggest

**产品目标**：系统给出建议。  
**技术实现**：
- `SuggestionEngine`（规则驱动）
- 关键词匹配、上下文召回、Tag 规则
- 可解释的 reason 字段

### 6.4 Tag

**产品目标**：用户手动标记。  
**技术实现**：
- Tag 选择器组件
- Tag 创建入口
- Tag-Entry 关系维护

### 6.5 Archive

**产品目标**：归档到结构化单元。  
**技术实现**：
- Archive action
- Entry 创建
- Tag 关联、项目归属

### 6.6 Browse

**产品目标**：回看与筛选。  
**技术实现**：
- Entries 列表组件
- 基础筛选（type、status、tag）
- 多维度浏览（预留）

---

## 7. 导入能力扩展接口

### 7.1 Importer Interface（预留）

```ts
interface Importer {
  name: string;
  supportedFormats: string[];
  import(file: File): Promise<ImportResult>;
}

interface ImportResult {
  entries: ImportedEntry[];
  metadata: ImportMetadata;
}

interface ImportedEntry {
  rawContent: string;
  suggestedTags?: string[];
  suggestedType?: EntryType;
  sourceMetadata?: Record<string, unknown>;
}
```

### 7.2 Normalize Pipeline（预留）

```ts
interface NormalizePipeline {
  normalize(rawContent: string): NormalizedContent;
}

interface NormalizedContent {
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}
```

### 7.3 Imported Content → Inbox/Entry（预留）

```ts
interface ImportFlow {
  importer: Importer;
  normalizePipeline: NormalizePipeline;
  tagMappingHook?: TagMappingHook;
  suggestionHook?: SuggestionHook;
}

interface TagMappingHook {
  map(importedTags: string[]): string[];
}

interface SuggestionHook {
  suggest(importedEntry: ImportedEntry): SuggestionResult;
}
```

---

## 8. API 策略

### 8.1 Phase 2 阶段

Phase 2 可采用以下两种方式之一：

1. **前端本地数据模式（优先）**：不依赖远程 API
2. **轻量同构 API 模式**：在 Next.js 中提供最小 API 层

### 8.2 建议接口（若启用 API）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/capture` | 创建 Inbox 条目 |
| GET | `/api/inbox` | 获取待整理列表 |
| POST | `/api/inbox/{id}/suggest` | 生成建议 |
| POST | `/api/inbox/{id}/archive` | 归档并结构化 |
| GET | `/api/entries` | 获取条目列表 |
| GET | `/api/tags` | 获取 Tag 列表 |
| POST | `/api/tags` | 创建 Tag |

---

## 9. 数据一致性与导出策略

### 9.1 Phase 2 数据主源

Phase 2 维护一个主数据源：**本地结构化存储（IndexedDB）**。

Markdown 作为导出产物，而不是实时双向同步主源。

### 9.2 导出策略

- 支持单条 / 批量导出 Markdown
- frontmatter 包含核心结构化字段
- 导出失败不影响主数据完整性

### 9.3 暂不支持

- 浏览器直接监听本地 Markdown 文件并反向同步
- 跨设备自动同步
- 冲突自动合并
- Import 模块（Phase 4）

---

## 10. Phase 规划

### 10.1 Phase 1 / MVP 闭环

**状态**：已完成或接近完成

| 内容 | 说明 |
|------|------|
| 输入 | Capture 基础能力 |
| 本地闭环 | 本地存储、基础结构 |
| 基础结构 | Entry、Tag 基础模型 |

### 10.2 Phase 2 / Demo 冲刺

**状态**：当前阶段

| 内容 | 说明 |
|------|------|
| 完整主线功能补齐 | Capture → Inbox → Suggest/Tag → Archive → Browse |
| 工作台式界面成型 | Sidebar + Content Panel + Quick Input Bar |
| Suggestion + Tag 并存 | 用户主动选择优先，系统建议补充 |
| 最小结构化浏览成立 | Entries 列表、基础筛选 |
| 像样的 Demo | 像真正的生产力工具 |

### 10.3 Phase 3 / 质量收敛

**状态**：后续阶段

| 内容 | 说明 |
|------|------|
| 代码质量 | 结构收敛、代码规范 |
| 风险治理 | 边界处理、异常处理 |
| 测试与可维护性 | 单元测试、集成测试 |
| 搜索增强 | 预留索引设计 |

### 10.4 Phase 4 / 体验打磨

**状态**：后续阶段

| 内容 | 说明 |
|------|------|
| UI polish | 视觉优化、交互优化 |
| 浏览/图谱/树感增强 | 树状感浏览、图谱可视化 |
| 导入能力推进 | Markdown 导入、文档导入 |
| 搜索与关系体验增强 | 搜索增强、关系计算 |
| AI 增强建议 | AI provider 接口 |

---

## 11. 非功能要求

| 维度 | Phase 2 目标 |
|------|----------|
| 响应速度 | 常用页面首屏可交互 < 2s（本地环境） |
| 稳定性 | 关键路径（Capture→Archive→Browse）成功率 > 95% |
| 可用性 | 首次用户 5 分钟内可完成一次完整闭环 |
| 数据安全 | 本地数据可导出，默认不上传云端 |
| UI 体验 | 像真正的生产力工具 |

---

## 12. 风险与应对

| 风险 | 说明 | 应对 |
|------|------|------|
| 规则建议命中率不高 | 用户感知"整理价值"不足 | 优先优化 Tag 规则，记录用户修正行为 |
| 范围反复膨胀 | 再次变成"大而全"路线 | 以闭环验收标准卡范围 |
| 浏览器本地存储限制 | 大数据量与迁移能力不足 | Phase 2 控制数据体量，尽快提供导出 |
| 语音能力兼容性差异 | 浏览器支持不一致 | 语音入口可降级，不阻断文本流程 |
| Tag 碎片化 | 标签过多导致混乱 | Tag 整理建议、同义词合并 |

---

## 13. 版本差异说明（v4.0 相对旧版）

本次收敛更新的核心变化：

1. **Domain Model 不绑定 UI 视图**：明确原则，保持数据模型灵活性
2. **推荐机制以 Deterministic Rules 为主**：可解释、可调试、可验收
3. **Tag 进入正式模型**：明确 Tag、Entry、Suggestion、ArchiveIntent 关系
4. **导入能力扩展接口**：预留 importer interface、normalize pipeline
5. **查询与搜索提前考虑**：为后续 tag filter、relationship query 留空间
6. **Phase 规划统一**：使用 Phase 1-4 语言，不再使用 Week 语言
7. **删除 Tree Knowledge Graph Store**：改为结构化存储 + 关系索引