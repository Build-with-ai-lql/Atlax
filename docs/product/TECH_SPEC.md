# Atlax 技术规格说明书（TECH SPEC）

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档版本 | v4.7 |
| 文档类型 | 技术规格文档 |
| 当前阶段 | Phase 2 Demo 冲刺 |
| 最后更新 | 2026-04-22 |

---

## 1. 文档目标

本文档用于把 `PRD v4.7` 转换为可执行的技术实现边界，重点保证：

- 技术实现与 `Phase 2 / Phase 3 / Phase 4 / Phase 5` 分工一致
- 本地优先、账号驱动、规则优先、Tag 驱动的产品逻辑被准确落地
- 当前阶段只承诺稳定交付的能力，不把未来扩展提前混入主线
- 第二阶段先解决输入能力与版式结构，第三阶段再做精细交互打磨

---

## 2. 技术策略

### 2.1 总体策略

Atlax 当前采用：

> **Web-first + 本地优先内容主源 + 账号控制面 + 规则引擎优先 + Tag 驱动**

解释：
- **形态**：Web Demo（单用户优先）
- **内容主源**：本地结构化数据层
- **身份主源**：账号、会话、工作区上下文
- **建议系统**：本地 deterministic rules 优先
- **UI 目标**：工作台式界面，参考 Codex 的骨架感与 Notion 的对象交互组织

### 2.2 当前阶段明确约束

| 约束 | 技术决策 |
|------|----------|
| Phase 2 必须有账号系统 | 引入最小登录、注册、会话保持、workspace identity |
| 内容仍然本地优先 | Capture、Dock、Entry、Tag、Review 以本地存储为主 |
| 不做完整云同步 | 不引入完整同步引擎，仅预留 sync adapter |
| 不做完整多人协作 | 不引入协作流，仅保留 permission / collaboration boundary |
| 不强依赖 LLM | SuggestionEngine 优先规则引擎，AI provider Phase 5 再接入 |
| 导入与语音能力延后 | importer / capture adapter Phase 4 才完整推进 |

### 2.3 Phase 2 技术重点

`Phase 2` 的技术重点不是“做更多花哨能力”，而是先确保以下能力成立：
- 登录、注册、退出、会话恢复
- Quick Input Bar + Expanded Editor 双形态 Capture
- 输入内容统一进入 Dock，而不是分成两套数据流
- 输入区不再横跨两个主模块，主工作台结构清晰
- 已归档内容可重新打开、修改并回到整理流程

---

## 3. 技术选型

### 3.1 前端与应用层

| 技术 | 版本建议 | 用途 |
|------|---------|------|
| Next.js | 14.x | Web 应用框架 |
| React | 18.x | UI 渲染 |
| TypeScript | 5.x | 类型系统 |
| Tailwind CSS | 3.x | 样式体系 |
| Zustand | 4.x | 本地 UI / workflow 状态管理 |
| TanStack Table | 8.x | Browse / Database 表格与筛选 |
| React Hook Form + Zod | 7.x / 3.x | 输入表单、校验与编辑器状态约束 |

### 3.2 数据与存储

| 技术 | 阶段 | 用途 |
|------|------|------|
| IndexedDB（via Dexie 等） | Phase 2 | 本地内容主源 |
| 本地文件导出（Blob/下载） | Phase 2 | Markdown / 数据导出 |
| 轻量认证服务或同构认证层 | Phase 2 | 登录、注册、会话、workspace identity |
| SQLite + Prisma | Phase 5 可选 | 更强本地桌面形态或同步中间层 |
| PostgreSQL | Phase 5+ | 云同步、协作、远程数据平面 |

### 3.3 建议引擎与 AI

| 层级 | 当前实现 |
|------|----------|
| SuggestionEngine 核心 | 规则引擎（关键词、结构信号、Tag 信号、用户修正反馈） |
| 推荐信号来源 | 本地内容结构、本地 Tag 使用、用户修正行为 |
| AI 增强层 | Phase 5，预留 AI provider 接口 |
| 成本控制 | 不默认后台连续调用 LLM |

---

## 4. 核心技术原则

### 4.1 Domain Model 不绑定 UI 视图

| 原则 | 说明 |
|------|------|
| UI 可呈现工作台、列表、树感、图谱感 | 视图层自由扩展 |
| Domain 只维护结构化实体与关系 | 不绑定特定页面结构 |
| 不允许为了树感 UI 强塞单一树结构 | 保持查询与扩展能力 |

### 4.2 Dock 是统一待整理入口

| 原则 | 说明 |
|------|------|
| 产品层统一使用 Dock | 不再沿用 `Inbox` 作为产品术语 |
| Capture 所有输入都进 Dock | 文本、语音、导入都统一汇入 DockItem |
| 已归档内容可返回整理链路 | 支持 Re-organize |

### 4.3 Capture 必须支持双形态输入

| 原则 | 说明 |
|------|------|
| Quick Input Bar | 负责灵感、短句、短文本 |
| Expanded Editor | 负责长笔记、长文章、富文本输入 |
| 两者同属一条 Capture pipeline | 不能拆成两套孤立数据流 |
| Phase 2 先达成合理可用 | Phase 3 再打磨富文本细节与微交互 |

### 4.4 推荐机制以 Deterministic Rules 为主

| 原则 | 说明 |
|------|------|
| 规则可解释、可调试、可验收 | 避免黑盒建议破坏信任 |
| 用户主动 Tag 永远优先 | 系统建议只做辅助 |
| 后续 AI provider 可插拔 | 但不是产品成立前提 |

### 4.5 内容主源与账号控制面分层

| 原则 | 说明 |
|------|------|
| 本地内容数据独立 | 便于本地优先与导出 |
| 账号与会话独立 | 便于未来同步、协作、授权扩展 |
| Phase 2 不要求远程内容主源 | 但必须有身份层 |

---

## 5. 核心数据模型

### 5.1 实体定义

```ts
type CaptureMode = 'quick' | 'expanded';
type DockStatus = 'pending' | 'suggested' | 'archived' | 'reopened' | 'ignored';
type EntryType = 'note' | 'meeting' | 'idea' | 'task' | 'reading';

interface UserAccount {
  id: string;
  provider: 'email' | 'apple' | 'google' | 'github' | 'wechat' | 'x' | 'phone';
  displayName?: string;
  createdAt: string;
}

interface WorkspaceSession {
  userId: string;
  workspaceId: string;
  sessionState: 'authenticated' | 'anonymous' | 'expired';
  lastValidatedAt?: string;
}

interface DockItem {
  id: string;
  rawText: string;
  normalizedContent?: string;
  captureMode: CaptureMode;
  sourceType: 'text' | 'voice' | 'import';
  status: DockStatus;
  createdAt: string;
  updatedAt: string;
  archivedEntryId?: string;
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

interface Tag {
  id: string;
  name: string;
  category?: string;
  usageCount: number;
  synonyms?: string[];
  createdAt: string;
}
```

### 5.2 建议与归档模型

```ts
interface SuggestionItem {
  field: 'type' | 'tag' | 'project' | 'relation';
  value: string;
  confidence: number;
  reason: string;
}

interface SuggestionResult {
  dockItemId: string;
  suggestions: SuggestionItem[];
  generatedAt: string;
  engineVersion: string;
}

interface ArchiveIntent {
  dockItemId: string;
  acceptedSuggestions: SuggestionItem[];
  userSelectedTags: string[];
  userModifications: Partial<Entry>;
  createdAt: string;
}
```

### 5.3 关系模型

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

---

## 6. 模块到技术映射

### 6.1 Capture

**产品目标**：快速输入短内容，并支持长内容写入。  
**技术实现**：
- `QuickInputBar` 组件
- `ExpandedEditor` 组件
- `CaptureComposerStore` 统一管理输入草稿与切换状态
- 提交后统一写入 `DockItem(status=pending)`

### 6.2 Dock

**产品目标**：查看待整理内容并进入建议 / 归档流程。  
**技术实现**：
- Dock 列表组件
- 状态流转：`pending → suggested → archived / ignored / reopened`
- 详情区、建议区、操作区联动

### 6.3 Suggest

**产品目标**：系统给出低打扰、可解释、可修正的建议。  
**技术实现**：
- `SuggestionEngine`（规则驱动）
- 关键词匹配、结构信号、Tag 历史、用户修正反馈
- `reason` 字段用于 UI 解释

### 6.4 Tag

**产品目标**：用户主动标记、创建 Tag，且优先级高于建议。  
**技术实现**：
- Tag 选择器组件
- Tag 创建入口
- Tag-Entry 关系维护
- 用户主动选择覆盖建议结果

### 6.5 Archive / Re-organize

**产品目标**：归档到结构化单元，并支持再次整理。  
**技术实现**：
- `ArchiveService`
- Entry 创建 / 更新
- DockItem 与 Entry 双向引用
- `reopenToDock()` 或等价流程

### 6.6 Browse / Database

**产品目标**：回看、筛选、再次整理。  
**技术实现**：
- Entries 列表与详情组件
- 基础筛选（type、status、tag、project）
- 详情页可再次编辑或回到 Dock

### 6.7 Review

**产品目标**：基础统计、健康信号、知识激活入口。  
**技术实现**：
- `ReviewAggregator`
- 本地聚合统计
- 健康度 / 最近活动 / 待整理压力等基础指标

### 6.8 账号与工作区

**产品目标**：登录、注册、会话保持、工作区身份成立。  
**技术实现**：
- `AuthProvider`
- `SessionStore`
- `WorkspaceContext`
- 登录态恢复与路由守卫

---

## 7. Repository 与存储策略

### 7.1 本地内容主源

```ts
interface DockRepository {
  create(item: DockItem): Promise<void>;
  update(item: DockItem): Promise<void>;
  list(filters?: DockFilters): Promise<DockItem[]>;
  reopen(id: string): Promise<void>;
}

interface EntryRepository {
  create(entry: Entry): Promise<void>;
  update(entry: Entry): Promise<void>;
  getById(id: string): Promise<Entry | null>;
  list(filters?: EntryFilters): Promise<Entry[]>;
}
```

实现要求：
- Phase 2 默认使用 IndexedDB / Dexie。
- 内容 repository 不依赖远程 API 才能工作。
- 导出失败不影响本地内容主源完整性。

### 7.2 账号控制面

```ts
interface AuthService {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  logout(): Promise<void>;
  restoreSession(): Promise<WorkspaceSession | null>;
}
```

实现要求：
- Phase 2 必须能恢复用户身份与工作区上下文。
- 账号数据与内容数据不共享同一套 repository 语义。
- 后续多登录方式扩展不应要求重写内容层。

---

## 8. API 策略

### 8.1 Phase 2 API 原则

Phase 2 不要求把内容主线全部服务化，但需要最小身份层能力。

推荐策略：
1. **内容链路本地优先**：Capture / Dock / Archive / Browse / Review 可直接走本地 repository
2. **账号链路最小远程化或同构化**：登录、注册、会话验证、当前用户信息通过认证层提供

### 8.2 最小接口需求

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 退出 |
| GET | `/api/auth/session` | 获取当前会话 |
| GET | `/api/auth/me` | 获取当前用户 / 工作区信息 |

说明：
- 内容接口如 `/api/dock`、`/api/entries` 在 Phase 2 可以不强制远程化。
- 若后续切换到轻量同构 API 模式，应保持 repository contract 不变。

---

## 9. 扩展接口

### 9.1 Importer Interface（Phase 4）

```ts
interface Importer {
  name: string;
  supportedFormats: string[];
  import(file: File): Promise<ImportResult>;
}

interface ImportResult {
  dockItems: ImportedDockItem[];
  metadata: ImportMetadata;
}
```

### 9.2 Capture Adapter（Phase 4）

```ts
interface CaptureAdapter {
  type: 'text' | 'voice' | 'import';
  produce(input: unknown): Promise<DockItem>;
}
```

### 9.3 AI Provider（Phase 5）

```ts
interface SuggestionProvider {
  name: string;
  suggest(context: SuggestionContext): Promise<SuggestionResult>;
}
```

### 9.4 Sync Adapter（Phase 5）

```ts
interface SyncAdapter {
  push(workspaceId: string): Promise<void>;
  pull(workspaceId: string): Promise<void>;
  resolveConflict(input: ConflictInput): Promise<ConflictResolution>;
}
```

---

## 10. Phase 对齐

### 10.1 Phase 2 / Demo 闭环与可用基线

| 内容 | 技术要求 |
|------|------|
| 账号系统成立 | Auth / Session / WorkspaceContext 必须成立 |
| Capture 双形态输入 | Quick Input Bar + Expanded Editor 必须打通 |
| 输入区结构纠偏 | 布局不跨主模块，工作台边界清晰 |
| Dock 主线成立 | DockItem 状态流转稳定 |
| 二次整理成立 | 已归档条目可 reopen 到整理流程 |
| Browse / Review 可用 | 本地查询、筛选、聚合成立 |

### 10.2 Phase 3 / 产品化打磨与前端交互优化

| 内容 | 技术要求 |
|------|------|
| 输入交互打磨 | 工具栏层级、切换、反馈、快捷键、状态表达优化 |
| 工作台信息架构打磨 | 页面状态与局部更新逻辑收敛 |
| 组件语义统一 | 统一按钮、状态、弹层、空态模式 |

### 10.3 Phase 4 / 扩展功能与结构增强

| 内容 | 技术要求 |
|------|------|
| 导入能力 | Importer interface 落地 |
| 语音输入 | Capture adapter 落地 |
| 搜索增强 | 索引与查询增强 |
| 图谱 / 树感增强 | 视图扩展，不绑 domain model |
| 高级 Review / Insight | 更丰富的聚合与信号计算 |

### 10.4 Phase 5 / 同步、协作与智能增强

| 内容 | 技术要求 |
|------|------|
| 云同步 | Sync adapter 落地 |
| 多人协作 | 共享、权限、协作空间模型落地 |
| AI provider | pluggable provider 落地 |
| 多登录方式扩展 | provider 扩展不破坏现有身份层 |

---

## 11. 非功能要求

| 维度 | Phase 2 目标 |
|------|----------|
| 响应速度 | 常用页面首屏可交互 < 2s（本地环境） |
| 可用性 | 首次用户 5 分钟内可完成一次完整闭环 |
| Capture 体验 | 短输入 10 秒内可完成；长内容有明确展开入口 |
| 布局稳定性 | 输入区不横跨两个主模块，主工作台结构不崩坏 |
| 数据安全 | 本地内容可导出，默认不上传全部内容到服务端 |
| 身份可靠性 | 刷新后可恢复登录状态与工作区上下文 |

---

## 12. 风险与应对

| 风险 | 说明 | 应对 |
|------|------|------|
| 规则建议命中率不高 | 用户感知“整理价值”不足 | 记录用户修正行为，持续优化本地规则与 Tag 信号 |
| 输入能力仍然偏短文本 | 知识库用户无法正常使用 | 以双形态输入作为 Phase 2 P0，不允许降回单一小输入框 |
| 账号层缺失或不稳定 | 用户无法管理自己的工作区 | 把认证与会话列为 Phase 2 必做项 |
| 本地内容与账号层耦合过深 | 同步 / 协作阶段重构成本高 | 内容 repository 与认证 service 分层 |
| 布局持续漂移 | Phase 3 无法进入精细打磨 | 将版式结构写入技术约束和验收目标 |

---

## 13. 版本差异说明（v4.7）

本次对齐 PRD 的核心变化：

1. **技术口径从“纯本地单用户 Demo”升级为“本地内容主源 + 账号控制面”**。
2. **产品术语从 Inbox 全面收敛到 Dock**，并统一到数据模型与模块说明。
3. **Capture 技术方案升级为双形态输入**：Quick Input Bar 与 Expanded Editor 同属一条主线。
4. **阶段规划重新对齐 PRD v4.7**：Phase 3 不再是“质量收敛”，Phase 4 / 5 能力边界同步更新。
