# Atlax MVP 范围说明

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档版本 | v3.0 |
| 文档类型 | MVP Scope |
| 当前阶段 | Phase 2 Demo 冲刺 |
| 最后更新 | 2026-04-21 |

---

## 1. MVP 定义

### 1.1 MVP 不再只是"最小可跑"

Atlax MVP 定义为：

> **最小可演示、最小可理解产品价值、最小可持续迭代**

这意味着：
- Demo 必须像真正的生产力工具，不是只有输入框的原型
- 用户能理解产品价值，不是概念演示
- 代码结构可持续迭代，不是一次性原型

### 1.2 MVP 目标

验证下面这个闭环是否成立：

> **用户输入任何内容后，系统能先接住，再帮用户完成初步整理，让用户感受到整理成本降低了。**

### 1.3 MVP 要验证的三件事

| 验证项 | 说明 | 是否为 MVP 必须验证 |
|------|------|----------------|
| 输入自由是否成立 | 用户能否不做预分类就快速记录 | 是 |
| 整理成本是否降低 | 用户是否觉得整理比自己手动做更轻松 | 是 |
| 结构化沉淀是否成立 | 用户能否看到有组织的知识结构 | 是 |

---

## 2. MVP 必须覆盖的能力

### 2.1 必须覆盖的能力清单

| 能力 | 说明 | 优先级 |
|------|------|--------|
| 基础输入闭环 | 文本输入、Quick Input Bar、不强制分类 | P0 |
| Inbox 列表与状态流转 | pending → suggested → archived | P0 |
| Suggestion 生成与展示 | 规则引擎、关键词匹配、可解释 | P0 |
| 用户手动 Tag 入口 | Tag 选择器、Tag 创建、用户意图优先 | P0 |
| 最小归档闭环 | Archive action、Entry 创建、Tag 关联 | P0 |
| 基础浏览/回看能力 | Entries 列表、基础筛选 | P0 |
| 像样的主工作台界面 | Sidebar + Content Panel + Quick Input Bar | P0 |

### 2.2 能力详细定义

#### 基础输入闭环

- 文本输入（Quick Input Bar）
- 无标题保存
- 不强制分类
- 新建后默认进入 Inbox

#### Inbox 列表与状态流转

- Inbox 列表展示
- 状态流转：pending → suggested → archived
- 每条内容显示状态、建议、Tag 选项

#### Suggestion 生成与展示

- 规则引擎生成建议
- 关键词匹配、上下文召回
- 建议可解释、可调试、可验收
- 用户可接受或修正建议

#### 用户手动 Tag 入口

- Tag 选择器
- Tag 创建
- 用户主动选择 Tag：优先按用户意图归类
- 用户不选 Tag：系统给出建议

#### 最小归档闭环

- Archive action
- Entry 创建
- Tag 关联
- 项目归属（可选）

#### 基础浏览/回看能力

- Entries 列表
- 基础筛选（按 Tag、按状态）
- 多维度浏览（基础）

#### 像样的主工作台界面

- Sidebar：导航、对象列表
- Content Panel：内容预览、整理面板
- Quick Input Bar：快速输入
- 尽量单页完成主要操作

---

## 3. MVP 不必须完整交付，但保留扩展入口

### 3.1 砍掉但保留接口

本阶段不实现，但需要在模型、接口、页面结构上避免被彻底堵死：

| 能力 | 说明 | 预留接口 |
|------|------|----------|
| 完整导入能力 | Markdown/文档导入 | importer interface |
| 复杂图谱编辑 | 图谱可视化、双向链接 | graph view 扩展点 |
| 自动多跳关系推理 | 关系计算、关联发现 | relation 计算接口 |
| 重型富文本系统 | 复杂编辑器 | editor 扩展 |
| 云同步/多人协作 | 同步、协作 | sync adapter |

### 3.2 预留接口说明

```text
Importer Interface:
  - normalize pipeline
  - imported content -> inbox/entry
  - tag mapping / suggestion pipeline hook

Graph View Extension:
  - view layer extension point
  - not domain model binding

Relation Calculation Interface:
  - relation query interface
  - not auto execution

Editor Extension:
  - keep Markdown basic
  - reserve rich text extension

Sync Adapter:
  - keep local-first architecture
  - reserve sync adapter interface
```

---

## 4. Tag 与 Suggestion 并存

### 4.1 并存原则

```text
用户主动选择 Tag → 优先按用户意图归类
用户不选 Tag → 系统给出建议
用户接受建议 → 按建议归类
用户修正建议 → 按用户修正归类
```

### 4.2 Tag 是 MVP 的关键减压设计

- Tag 让用户可以主动控制分类
- Tag 规则引擎可以给出可解释的建议
- Tag 不依赖大模型才能成立
- Tag 是产品成立的前提能力

---

## 5. 数据结构原则

### 5.1 树状感是用户体验目标，不是底层存储约束

| 层级 | 说明 |
|------|------|
| 用户体验层 | 可以提供"像树一样有层次感"的组织体验 |
| 底层数据模型 | 采用适合查询、关联、过滤、扩展的结构化模型 |
| 不要求 | 不要求真实物理存储为树 |

### 5.2 MVP 数据模型

| 实体 | 说明 |
|------|------|
| InboxEntry | 待整理条目 |
| Entry | 结构化知识单元 |
| Tag | 标签 |
| SuggestionItem | 建议项 |
| ArchiveIntent | 归档意图 |

---

## 6. Demo 最小闭环

### 6.1 演示路径

1. 用户打开工作台界面
2. 用户在 Quick Input Bar 输入一段文本
3. 系统将内容写入 Inbox（状态：pending）
4. 用户打开 Inbox，看到待整理内容
5. 系统给出建议（Tag、类型）
6. 用户选择：接受建议 / 手动选择 Tag / 修正建议
7. 用户点击归档
8. 内容进入 Entries，状态变为 archived
9. 用户打开 Entries，看到归档内容
10. 用户按 Tag 筛选，找到相关内容

### 6.2 演示验收

- Demo 像真正的生产力工具
- 用户能理解产品价值
- 整理成本明显降低

---

## 7. Phase 规划

### 7.1 Phase 1 / MVP 闭环

**状态**：已完成或接近完成

| 内容 | 说明 |
|------|------|
| 输入 | Capture 基础能力 |
| 本地闭环 | 本地存储、基础结构 |
| 基础结构 | Entry、Tag 基础模型 |

### 7.2 Phase 2 / Demo 冲刺

**状态**：当前阶段

| 内容 | 说明 |
|------|------|
| 完整主线功能补齐 | Capture → Inbox → Suggest/Tag → Archive → Browse |
| 工作台式界面成型 | Sidebar + Content Panel + Quick Input Bar |
| Suggestion + Tag 并存 | 用户主动选择优先，系统建议补充 |
| 最小结构化浏览成立 | Entries 列表、基础筛选 |
| 像样的 Demo | 像真正的生产力工具 |

### 7.3 Phase 3 / 质量收敛

**状态**：后续阶段

| 内容 | 说明 |
|------|------|
| 代码质量 | 结构收敛、代码规范 |
| 风险治理 | 边界处理、异常处理 |
| 测试与可维护性 | 单元测试、集成测试 |

### 7.4 Phase 4 / 体验打磨

**状态**：后续阶段

| 内容 | 说明 |
|------|------|
| UI polish | 视觉优化、交互优化 |
| 浏览/图谱/树感增强 | 树状感浏览、图谱可视化 |
| 导入能力推进 | Markdown 导入、文档导入 |
| 搜索与关系体验增强 | 搜索增强、关系计算 |
| 再评估 AI 增强 | AI provider 接口、增强建议 |

---

## 8. 验收标准

### 8.1 功能验收

| 项目 | 验收标准 |
|------|----------|
| Capture | 用户可在 10 秒内完成新建内容并进入 Inbox |
| Inbox | 每条内容都能看到状态、建议、Tag 选项 |
| Suggest | 系统能给出可解释的建议 |
| Tag | 用户能主动选择 Tag、创建 Tag |
| Archive | 用户能完成归档，内容进入 Entries |
| Browse | 用户能在列表中找到归档内容，支持基础筛选 |
| UI | 像真正的生产力工具，不是只有输入框的原型 |

### 8.2 产品验收

MVP 通过的判断：

- 用户能快速记录，不被结构打断
- 用户会觉得整理比自己手动做更轻松
- Demo 像真正的生产力工具

---

## 9. 范围判断原则

如果一个需求不直接增强以下闭环，就不进入当前 MVP：

**输入 → 进入 Inbox → 接受建议/选择 Tag → 归档 → 在 Entries 中可浏览**

这条原则用于防止 MVP 再次膨胀成"另一个什么都想做的知识平台"。

---

## 10. 版本差异说明（v3.0 相对旧版）

本次收敛更新的核心变化：

1. **MVP 定义调整**：从"最小可跑"改为"最小可演示、最小可理解产品价值、最小可持续迭代"
2. **必须覆盖的能力**：明确 7 项必须覆盖的能力
3. **砍掉但保留接口**：新增章节，明确预留接口
4. **Tag 与 Suggestion 并存**：明确用户主动选择优先
5. **数据结构原则**：明确"树状感是用户体验目标，不是底层存储约束"
6. **Phase 规划统一**：使用 Phase 1-4 语言，不再使用 Week 语言
7. **删除 Tree Knowledge Graph 章节**：改为"数据结构原则"章节