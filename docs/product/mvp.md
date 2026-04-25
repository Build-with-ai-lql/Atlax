# Atlax MVP 范围说明

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档版本 | v5.1 |
| 文档类型 | MVP Scope |
| 当前阶段 | Phase 3 Developer Preview |
| 最后更新 | 2026-04-25 |

---

## 1. MVP 定义

Atlax MVP 分两层定义：

> Phase 2 是最小可上线 Demo 闭环；Phase 3 是正式第一版上线前的 Developer Preview。

这意味着：
- 不是“功能最多”，而是“主闭环最稳”。
- 不是“展示原型”，而是“可被真实用户连续使用”。
- 不是“先堆未来能力”，而是“先证明记录与整理价值”。
- Phase 3 不是继续展示占位，而是把编辑、结构、归档、Review、Browse 主线打磨到可真实使用。

---

## 2. MVP 要验证的问题

### 2.1 产品价值验证

- 用户是否愿意持续记录（不仅首日试用）。
- 用户是否觉得整理成本下降。
- Chat Mode 是否真正帮助表达启动并进入归档。
- 同一知识库双模式是否比单一输入更有效。

### 2.2 市场替代验证

- Atlax 是否开始替代备忘录、微信收藏夹、零散文档中的至少一种。

---

## 3. MVP 必须覆盖能力（P0）

| 能力 | 说明 |
|------|------|
| Classic Mode 基础闭环 | 显式输入、Tag、归档、浏览 |
| Chat Mode 最小闭环 | 引导输入、追问补全、进入归档主线 |
| 模式切换 | 有状态感，切换后仍是同一知识库 |
| Dock | 统一待整理入口，状态流转可见 |
| Suggest 基础版 | 规则建议可解释、可修正 |
| Tag | 用户显式选择优先，系统建议辅助 |
| Archive | 形成正式 Entry，并可再次整理 |
| Browse 基础版 | 找得到、看得懂、改得动 |
| 登录系统 | 用户可进入自己的工作区 |
| 单页工作台 | Sidebar + Workspace + Input Bar 结构稳定 |
| 长短输入都可用 | 快速输入 + 展开输入属于同一主线 |

---

## 4. Phase 3 Developer Preview 必须覆盖能力（P0）

Phase 3 不再把以下能力视为“体验锦上添花”，而是产品成立所需的主线功能：

| 能力 | 说明 |
|------|------|
| MindDock Editor | DockItem / Entry 详情统一为 Markdown 编辑工作台 |
| Markdown Preview | 支持 GFM、标题、列表、任务列表、表格、引用、代码块、行内代码、链接与代码高亮 |
| Edit / Preview / Split | 用户可在源码、预览、分屏之间切换，模式状态本地持久化 |
| Document Reading Layout | Preview 具备正式文档版心，Dark Mode 下可长时间阅读 |
| Context Panel | Status、Type、Tags、Project、Source、Created/Updated、Suggestions、Actions 进入右侧结构面板 |
| Explainable Suggestion | 推荐展示 reason、confidence、suggestedType、suggestedTags、suggestedProject |
| Suggestion Decision | 用户接受、部分接受、修改、忽略建议时记录 decision |
| Archive Action Redesign | pending / suggested / archived / reopened 对应不同主操作 |
| Review Data Repair | Weekly Review 只读取真实 DockItem / Entry / Tag / Project 数据 |
| Browse / Database 基础体验 | Entries 支持列表/表格、筛选、排序、分组、打开与再次整理 |
| Chat 主线汇合 | Chat 产物进入同一 Dock / Editor / Archive / Review 主线 |
| 小组件与日历 | 右上角小组件入口，Calendar Widget 可拖到 Sidebar gap 并定位日期归档笔记 |
| Entries Graph Tree | Entries 支持点线树状结构视图，节点是文档、线是关系、散点是未关联内容 |
| Review 主动提问 | Review / Chat 能基于知识库指标每周提出固定模板问题 |
| Review 周报 | 自动汇总本周项目进展、卡点和停滞方向 |
| 知识库健康检查 | 找出 30 天未看、缺少关联、主题重复但未深入、pending 堆积等问题 |
| Review 图表模型 | 折线、饼图、柱状、甘特图展示真实且对用户有意义的数据 |

---

## 5. MVP 明确不做（后移）

| 能力 | 后移阶段 |
|------|---------|
| 完整 Notion 式 Block Editor | 不做，非当前产品路线 |
| 完整 Obsidian 式复杂图谱 / Canvas | Phase 4 后评估 |
| 完整导入 | Phase 4 |
| 导入、搜索增强、关系增强 | Phase 4 |
| 语音输入 | Phase 4 |
| 同步、多端、协作、AI provider | Phase 5 |

---

## 6. Chat Mode 的 MVP 落地标准

Chat Mode 在 MVP 不追求“全能聊天”，只验证是否能推动知识整理：

- 用户只说一句话也能开始。
- Agent 至少能完成一轮有效追问。
- 对话结果能落入 Dock 或直接触发归档确认。
- 用户能在 Browse 中找到该条内容并继续整理。

---

## 7. 留存闭环（MVP 视角）

### 7.1 日留存

- 每天有低负担记录入口（Classic/Chat 任一即可）。
- 能快速找到昨天记录并继续整理。

### 7.2 周留存

- 有 Weekly Review 基础入口。
- 用户能看到本周主题或项目变化。
- 系统能基于本周数据反过来问用户问题，并生成简短周报。

### 7.3 长期留存

- 知识库结构逐渐清晰。
- Tag 与历史内容可持续复用。

---

## 8. MVP 验收标准

### 8.1 功能验收

- P0 能力清单全部可演示。
- 主链路可稳定跑通：

```text
Capture (Classic/Chat)
  -> Dock
  -> Suggest/Tag
  -> Archive
  -> Browse
  -> Re-organize
```

### 8.2 产品验收

- 用户能理解 Classic 与 Chat 的关系。
- 用户能在两种模式下都完成一次整理。
- 模式切换不导致内容割裂。

### 8.3 指标验收

上线后至少能追踪：
- DAU
- 每用户日均记录次数
- Chat 引导后归档率
- 7 日留存率
- Weekly Review 打开率

---

## 9. 范围判断原则

Phase 3 中，新增需求只要命中以下任一条件，即默认后移：
- 不影响 MindDock Editor、解释型归档、真实 Review、Browse / Database、Calendar Widget、Entries Graph Tree 主线成立。
- 属于完整 Block Editor、复杂 Canvas/图谱编辑器、协作、同步、多端、完整 AI provider。
- 主要价值是扩展功能，而不是修复当前主线体验 gap。

---

## 10. 版本差异说明（v5.1）

1. 将 Calendar Widget、Entries Graph Tree、Review 主动提问、周报、健康检查和图表模型纳入 Phase 3 P0。
2. 明确基础点线树状结构视图不是 Phase 4 复杂图谱，而是当前产品结构感的主线能力。
3. 强化“自动整理碎片信息、反向提问、替用户看全局、知识库健康检查”的产品价值验收。
4. Phase 3 详细执行计划见 `docs/product/PHASE3_DEVELOPER_PREVIEW.md`。
