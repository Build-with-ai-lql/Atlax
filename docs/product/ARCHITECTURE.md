# Atlax 架构说明书（ARCHITECTURE）

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档版本 | v3.0 |
| 文档类型 | 架构设计文档 |
| 当前阶段 | Phase 2 Demo 冲刺 |
| 最后更新 | 2026-04-21 |

---

## 1. 架构目标与边界

### 1.1 架构目标

Atlax 架构只服务一个目标：

> **以最小可实现复杂度跑通"输入→整理→结构化沉淀→回看/利用"的闭环。**

具体目标：
- 支持 Web-first 单用户体验
- 保证本地优先与数据可导出
- 支持规则引擎驱动的整理与建议
- 为后续服务化与多端化预留演进路径

### 1.2 架构边界（Phase 2）

| 边界 | 处理方式 |
|------|----------|
| 多端同步 | 不做，预留 sync adapter |
| 多人协作与权限 | 不做，保持本地优先 |
| 复杂 AI Agent | 不做，预留 AI provider 接口 |
| 云端依赖 | 默认无强依赖 |
| 本地 Markdown 双向实时同步 | 不做 |
| 完整导入能力 | Phase 4，预留 importer interface |

---

## 2. 分层架构

### 2.1 高层架构

```text
┌─────────────────────────────────────────────┐
│                apps/web                      │
│                                             │
│  UI / 页面编排 / 本地存储适配 / 用户交互     │
│  视图层表达（列表/树感/图谱感）              │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              packages/domain                 │
│                                             │
│  platform-agnostic domain core              │
│  type definitions                           │
│  state transitions                          │
│  suggestion rules                           │
│  tag / archive / relation 基础规则          │
│  selectors / query helpers                  │
└─────────────────────────────────────────────┘
```

### 2.2 分层职责

| 层级 | 职责 | 说明 |
|------|------|------|
| apps/web | UI、页面编排、本地存储适配、用户交互 | 视图层，可自由选择呈现方式 |
| packages/domain | 类型定义、状态流转、规则、查询辅助 | 平台无关，不依赖 Web、Dexie 或 UI |

---

## 3. Platform-Agnostic Domain Core

### 3.1 packages/domain 职责清单

| 职责 | 说明 |
|------|------|
| type definitions | InboxEntry、Entry、Tag、SuggestionItem、ArchiveIntent 等类型定义 |
| state transitions | InboxEntry 状态流转规则（pending → suggested → archived） |
| suggestion rules | 规则引擎、关键词匹配、上下文召回、Tag 规则 |
| tag rules | Tag 创建、Tag-Entry 关系、Tag 同义词、Tag 层级 |
| archive rules | Archive action、Entry 创建、Tag 关联规则 |
| relation rules | Entry-Tag 关系、Entry-Project 关系、Tag-Tag 关系 |
| selectors / query helpers | 查询辅助函数、筛选函数、聚合函数 |

### 3.2 Domain Core 不依赖

| 不依赖 | 说明 |
|------|------|
| Web 框架 | 不依赖 React、Next.js 等 |
| UI 组件 | 不依赖具体 UI 组件 |
| 存储实现 | 不依赖 Dexie、IndexedDB 等 |
| 外部服务 | 不依赖 API、云服务等 |

---

## 4. apps/web 职责

### 4.1 apps/web 职责清单

| 职责 | 说明 |
|------|------|
| UI | React 组件、页面布局 |
| 页面编排 | 路由、页面结构 |
| 本地存储适配 | Dexie、IndexedDB 适配 |
| 用户交互 | 表单、按钮、事件处理 |
| 视图层表达 | 列表、树感、图谱感等呈现方式 |

### 4.2 视图层自由选择

| 视图类型 | 说明 |
|------|------|
| 列表视图 | Entries 列表、Inbox 列表 |
| 树感视图 | 可选，树状感组织体验 |
| 图谱视图 | 可选，关联可视化 |
| 卡片视图 | 可选，卡片式展示 |

---

## 5. 视图结构与数据结构分离

### 5.1 核心原则

> **树状感是用户体验目标，不是底层存储约束。**

| 层级 | 说明 |
|------|------|
| 用户体验层 | 可以提供"像树一样有层次感"的组织体验 |
| 底层数据模型 | 采用适合查询、关联、过滤、扩展的结构化模型 |
| 不要求 | 不要求真实物理存储为树 |

### 5.2 分离原则

| 原则 | 说明 |
|------|------|
| tree-like view 不是 tree-only storage | 视图层可呈现树状，存储层不绑定树 |
| graph-like view 不是 graph DB requirement | 视图层可呈现图谱，存储层不绑定图数据库 |
| Domain model 不绑定 UI 视图 | Domain 只维护结构化实体与关系 |

---

## 6. 数据架构

### 6.1 数据主源原则

Phase 2 阶段采用单主源策略：

- 主源：本地结构化存储（IndexedDB）
- 导出：按需生成 Markdown
- 不做 Markdown→主源反向自动同步

### 6.2 核心实体

| 实体 | 关键字段 |
|------|----------|
| InboxEntry | id, rawText, sourceType, status, createdAt |
| Entry | id, title, content, type, tags, projectId, status, viewCount, timestamps |
| Tag | id, name, category, usageCount, synonyms |
| Project | id, name, status, lastActivityAt |
| Task | id, title, status, projectId, sourceEntryId |
| SuggestionItem | field, value, confidence, reason |
| ArchiveIntent | inboxEntryId, acceptedSuggestions, userModifications |

### 6.3 关系实体

| 实体 | 说明 |
|------|------|
| EntryTagRelation | Entry-Tag 关系 |
| EntryProjectRelation | Entry-Project 关系 |
| TagRelation | Tag-Tag 关系（层级、同义词、相关） |

---

## 7. 模块架构

### 7.1 核心模块

| 模块 | 职责 | 输入 | 输出 |
|------|------|------|------|
| Capture | 接收用户内容 | 文本/语音 | Inbox 条目 |
| Inbox | 管理待整理条目 | Inbox 条目 | 建议结果、归档动作 |
| SuggestionEngine | 生成结构化建议 | 原始文本、上下文 | type/tags/project 建议 |
| Archive | 将条目结构化入库 | 建议+用户修正 | Entry 更新 |
| Browse | 内容查询与筛选 | 结构化数据 | 列表展示 |
| TagService | Tag 管理 | Tag 操作 | Tag 创建、关联 |

### 7.2 依赖关系

```text
Capture → Inbox → SuggestionEngine → Archive → Browse
                                     ↘
                                      TagService
```

---

## 8. 关键流程架构

### 8.1 Capture → Inbox

1. 用户输入文本
2. Capture 做基础清洗（空值、长度）
3. 写入 `InboxEntry(status=pending)`

### 8.2 Inbox Suggestion → Archive

1. SuggestionEngine 基于规则生成建议
2. 用户接受或微调建议
3. 用户可选择 Tag（优先按用户意图）
4. Archive 生成 `Entry`，并更新 Tag 关联
5. 原 `InboxEntry` 标记 `archived`

---

## 9. 为未来扩展预留架构入口

### 9.1 预留入口清单

| 入口 | 说明 |
|------|------|
| importer adapters | 导入能力扩展点 |
| AI suggestion provider | AI 增强建议扩展点 |
| richer graph view | 图谱可视化扩展点 |
| sync adapter | 同步能力扩展点 |

### 9.2 预留接口说明

```text
Importer Adapters:
  - importer interface
  - normalize pipeline
  - imported content -> inbox/entry
  - tag mapping hook

AI Suggestion Provider:
  - suggestion provider interface
  - pluggable into SuggestionEngine
  - not required for Phase 2

Richer Graph View:
  - view layer extension point
  - not domain model binding

Sync Adapter:
  - sync adapter interface
  - keep local-first architecture
  - not required for Phase 2
```

---

## 10. 目录结构建议

### 10.1 当前收敛结构

```text
apps/
  web/
    app/
      workspace/           # 工作台 UI
        components/
          Sidebar.tsx
          ContentPanel.tsx
          QuickInputBar.tsx
        page.tsx
      inbox/
      entries/
    lib/
      db.ts                # 本地数据层（Dexie）
      repository.ts        # 持久化适配层
packages/
  domain/
    src/
      types.ts            # 平台无关类型定义
      state-machine.ts    # 状态流转规则
      suggestion-engine.ts # 建议引擎
      tag-service.ts      # Tag 服务
      selectors.ts        # 查询辅助函数
      rules/              # 规则定义
        keyword-rules.ts
        tag-rules.ts
```

### 10.2 设计原则

- packages/domain 只承载纯逻辑，不依赖 Web、Dexie 或 UI
- apps/web 负责页面、交互、浏览器持久化
- 视图层自由选择呈现方式，不绑定 Domain model

---

## 11. Phase 规划

### 11.1 Phase 1 / MVP 闭环

**状态**：已完成或接近完成

| 内容 | 说明 |
|------|------|
| 输入 | Capture 基础能力 |
| 本地闭环 | 本地存储、基础结构 |
| 基础结构 | Entry、Tag 基础模型 |

### 11.2 Phase 2 / Demo 冲刺

**状态**：当前阶段

| 内容 | 说明 |
|------|------|
| 完整主线功能补齐 | Capture → Inbox → Suggest/Tag → Archive → Browse |
| 工作台式界面成型 | Sidebar + Content Panel + Quick Input Bar |
| Suggestion + Tag 并存 | 用户主动选择优先，系统建议补充 |
| 最小结构化浏览成立 | Entries 列表、基础筛选 |
| 像样的 Demo | 像真正的生产力工具 |

### 11.3 Phase 3 / 质量收敛

**状态**：后续阶段

| 内容 | 说明 |
|------|------|
| 代码质量 | 结构收敛、代码规范 |
| 风险治理 | 边界处理、异常处理 |
| 测试与可维护性 | 单元测试、集成测试 |
| 搜索增强 | 预留索引设计 |

### 11.4 Phase 4 / 体验打磨

**状态**：后续阶段

| 内容 | 说明 |
|------|------|
| UI polish | 视觉优化、交互优化 |
| 浏览/图谱/树感增强 | 树状感浏览、图谱可视化 |
| 导入能力推进 | Markdown 导入、文档导入 |
| 搜索与关系体验增强 | 搜索增强、关系计算 |
| AI 增强建议 | AI provider 接口 |

---

## 12. 架构风险与缓解

| 风险 | 影响 | 缓解方案 |
|------|------|---------|
| 规则建议效果有限 | "整理价值"感知偏弱 | 持续迭代规则、增加用户修正反馈回路 |
| 本地存储能力上限 | 数据量增长后体验下降 | Phase 2 控制数据规模、增强导出机制 |
| 范围回弹 | 交付失焦 | 以核心闭环为唯一优先级 |
| 视图层绑定 Domain | 数据模型灵活性丧失 | 明确"视图结构与数据结构分离"原则 |
| Tag 碎片化 | 标签过多导致混乱 | Tag 整理建议、同义词合并 |

---

## 13. ADR（架构决策记录）

### ADR-001：采用 Platform-Agnostic Domain Core

**决策**：packages/domain 不依赖 Web、Dexie 或 UI。  
**原因**：保持 Domain 核心逻辑的平台无关性，便于后续扩展到其他平台。

### ADR-002：视图结构与数据结构分离

**决策**：tree-like view 不是 tree-only storage，graph-like view 不是 graph DB requirement。  
**原因**：保持数据模型灵活性，不绑定特定视图结构。

### ADR-003：采用规则引擎优先，AI 可插拔

**决策**：Phase 2 默认规则引擎，不以 LLM 作为必备依赖。  
**原因**：成本可控、稳定性可控、可解释性更强。

### ADR-004：Markdown 作为导出层而非主写入层

**决策**：Phase 2 采用"结构化主源 + Markdown 导出"策略。  
**原因**：避免早期双向同步导致一致性和复杂度失控。

### ADR-005：预留扩展入口

**决策**：预留 importer adapters、AI provider、graph view、sync adapter 扩展入口。  
**原因**：为后续 Phase 4-5 扩展能力预留架构空间，避免被彻底堵死。

---

## 14. 版本差异说明（v3.0 相对旧版）

本次收敛更新的核心变化：

1. **分层架构明确**：packages/domain（platform-agnostic）+ apps/web（UI/存储适配）
2. **视图结构与数据结构分离**：明确"树状感是用户体验目标，不是底层存储约束"
3. **删除 Tree Knowledge Graph 章节**：改为"视图结构与数据结构分离"章节
4. **预留扩展入口**：明确 importer adapters、AI provider、graph view、sync adapter
5. **Phase 规划统一**：使用 Phase 1-4 语言，不再使用 Week 语言
6. **ADR 更新**：新增 ADR-001/002/005，删除旧版 ADR-005/006/007/008/009/010