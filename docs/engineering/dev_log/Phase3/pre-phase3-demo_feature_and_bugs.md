# Phase 3 Demo Feature & Bugs Worklog

| Field | Value |
|---|---|
| Phase | Phase 3 - 产品化打磨与留存增强 |
| Source | GitHub issues + Notion Phase 3 |
| Round | Round 0 - intake / task split |
| Timestamp | 2026-04-24 11:45 CST |
| Owner | Coordinator |
| Status | Ready for Frontend/Backend Round 1 |

---

## 1. Phase 3 Scope

Phase 3 的核心目标是基于 Phase 2 可上线闭环做产品化打磨，不扩主功能面，优先提升一致性、可用性和留存能力。

必须落地：

- 前端体验统一，遵循 `docs/product/FRONT_DESIGN.md`
- Chat 引导策略优化，支持连续对话、确认记录、取消/重填
- Review 能力增强，Weekly Review 成为周留存入口
- Browse / Database 体验优化，降低历史内容回访成本
- 模式切换体验细化，减少误操作
- 首页和空状态引导优化

本轮 GitHub issue 主要覆盖 Chat、编辑页、建议、链式结构、沉浸工作区与侧边栏体验，是 Phase 3 Demo 前的阻断项。

---

## 2. GitHub Issues Intake

当前仓库 issues 页面经 `gh issue list --state all` 和 REST API 复核，共读取到 10 个 open issue：#2 到 #11；未发现 #1 issue。

| Issue | 类型 | 前/后端 | 优先级 | 摘要 | 验收口径 |
|---|---|---|---|---|---|
| #2 前端页面bug -- 用户体验 | Bug | Frontend | P0 | Chat 模式点击外部空白处无法收起，且可选中外部元素 | 点击外部后 Chat 缩为按钮或退出焦点态，背景不可误选 |
| #3 chat模式下切换侧边菜单无法收回 | Bug | Frontend | P0 | Chat 模式切换 Sidebar 菜单后状态未正确收敛 | 菜单切换时 Chat 焦点态关闭，状态一致 |
| #4 侧边添加记录菜单，取消模式切换滑块 | Feature | Frontend | P0 | 侧边栏用“记录”菜单替换模式切换滑块 | Sidebar 信息架构清晰，记录入口不与页面功能冲突 |
| #5 Chat 记录时不占据全屏 | UX | Frontend | P0 | 使用 Chat 记录时保持侧边栏，仅右侧主页面切换为聊天界面 | Chat 进入右侧主内容区，Sidebar 保持可用 |
| #6 聊天无法持续交互 | Feature | Full-stack | P0 | Chat 应像聊天软件一样连续引导，临时固定句式直到确认记录方案 | 无 LLM 时完成主题、类型、内容、确认、取消、重填闭环 |
| #7 链式结构依旧没有落地 | Feature | Backend | P1 | 需要支持记录之间或编辑流程中的链式结构 | Domain/Repository 能保存和读取基本 parent/child 或 source 链路 |
| #8 重新编辑选项 | Feature | Full-stack | P1 | 短内容内联编辑，长内容全屏编辑，保存后在下级页面展示 | 编辑体验按内容长度适配，保存后详情/下级视图同步 |
| #9 生成建议 | Bug/Feature | Full-stack | P0 | 标签展示乱码，动作建议不可选择，无法关联项目 | 标签正常显示；动作建议可选；项目可关联并持久化 |
| #10 左上角 logo | Feature | Frontend | P2 | Logo 触发水波纹全屏动画进入沉浸工作状态，侧边栏边缘 hover 显隐 | 动画克制且可关闭；Sidebar hover 敏感度可控 |
| #11 编辑页功能项 | Feature | Backend-first | P1 | 拆解 Obsidian 编辑功能并制作接口 | 先定义编辑能力接口/端口，前端可按能力渲染工具栏 |

---

## 3. 分类与执行顺序

### 3.1 Frontend Track

P0 今日首轮：

- #2/#3 Chat 焦点态收敛 bug
- #4 Sidebar 记录菜单替换模式切换滑块
- #5 Chat 主内容区化，不再全屏遮蔽 Sidebar
- #6 连续聊天 UI 壳层和固定句式交互
- #9 建议区 UI 修复：标签乱码、动作建议选择、项目选择入口

P1 今日第二轮：

- #8 重新编辑短/长内容体验
- #10 Logo 沉浸工作区与 Sidebar hover 显隐
- Phase 3 首页/空状态与模式切换动效收敛

P2 今日收口：

- Review / Browse / Database 体验增强
- Demo path 全链路验收

### 3.2 Backend / Domain Track

P0 今日首轮：

- #6 无 LLM Chat 引导状态机：主题、类型、内容、确认、取消、重填
- #9 Suggestion 数据结构修复：tag/action/project 选择与持久化
- #7 链式结构最小落地：source/parent/child link 能力

P1 今日第二轮：

- #8 编辑保存服务：短编辑/长编辑共用 update path，保存后重置建议或保持已归档状态的规则明确
- #11 编辑器能力端口：Obsidian-like 命令/工具栏能力先抽象接口，不做完整编辑器

P2 今日收口：

- Review / Weekly Review 所需 stats/selectors
- Browse / Database 筛选和回访路径补足
- 测试与质量门禁

---

## 4. Task Blocks

### T0 - Coordination / Intake

- 状态：Done
- 内容：读取 GitHub issues、读取 Notion Phase 3、读取本地设计规范和 demo path
- 结果：确认 10 个 open issue，拆成 Frontend/Backend tracks
- 是否解决：是
- 是否进入下一轮：是
- 风险：需求密度高，需要前后端并行且每轮 review 后动态裁剪范围

### T1 - Chat / Sidebar P0 Stabilization

- Owner：Frontend + Backend
- Scope：#2 #3 #4 #5 #6
- 目标：先让 Chat 记录入口、布局、连续交互闭环稳定，避免 Demo 第一段翻车
- 验收：Chat 不再错误遮蔽全局；可连续记录并确认入 Dock；取消/重填有明确状态

### T2 - Suggestion / Project / Chain P0-P1

- Owner：Backend + Frontend
- Scope：#7 #9
- 目标：修复建议可用性和持久化模型，补上项目关联与最小链式结构
- 验收：生成建议后 tag/action/project 均可选择、保存、回显；链式关系可在数据层读写

### T3 - Editing Experience P1

- Owner：Frontend + Backend
- Scope：#8 #11
- 目标：短内容内联编辑，长内容全屏编辑；编辑器能力接口先收敛
- 验收：编辑保存后详情同步，长内容全屏体验符合设计语言；接口不阻塞后续编辑器扩展

### T4 - Immersive Mode / Phase 3 Polish P2

- Owner：Frontend
- Scope：#10 + Phase 3 体验统一
- 目标：Logo 进入沉浸工作区、Sidebar hover 显隐、首页/空状态/模式切换动效收敛
- 验收：动画克制、误触少、可退出；不影响基础 Dock/Entries/Review/Chat

### T5 - Review / Browse / Quality Gate

- Owner：Full-stack
- Scope：Phase 3 Notion 验收
- 目标：Weekly Review、Browse 回访、筛选路径、Demo path 全验收
- 验收：`pnpm lint`、`pnpm typecheck`、可运行测试尽量通过；若 Rollup native 阻塞需记录环境错误

---

## 5. Round 1 Prompts

### 5.1 Frontend Agent Prompt

你是 Frontend Agent，工作目录是 `/Users/qilong.lu/WorkDir/atlax-tech/mind-dock`。本轮目标是 Phase 3 Demo P0 前端稳定化，处理 GitHub issues #2 #3 #4 #5 #6，以及 #9 的前端入口。

执行前请先阅读：

- `docs/engineering/dev_log/Phase3/pre-phase3-demo_feature_and_bugs.md`
- `docs/product/FRONT_DESIGN.md`
- `docs/engineering/demo/demo-path.md`
- 相关代码：`apps/web/app/workspace/page.tsx`、`apps/web/app/workspace/_components/*`

本轮没有已通过的上一轮 feature 代码需要提交；不要提交本轮代码。所有变更必须进入 git 暂存区，便于 Coordinator 用 `git diff --cached` review。

任务范围：

1. 修复 #2：Chat 模式点击外部空白处后，Chat 焦点态应收起为按钮或退出焦点态，不能继续选中外部元素。
2. 修复 #3：Chat 模式下切换 Sidebar 菜单时，Chat 状态必须收敛，不能残留无法关闭的 Chat UI。
3. 落地 #4：取消当前模式切换滑块，Sidebar 增加清晰的“记录”菜单入口，避免记录主页和其他功能冲突。
4. 落地 #5：Chat 记录时保持 Sidebar，仅右侧主页面切换为聊天界面，不再进入全屏记录页。
5. 支持 #6 前端壳层：实现连续聊天式 UI，先对接固定句式流程；可用临时本地状态，但需要给 Backend Agent 预留接入状态机/服务的边界。
6. 处理 #9 前端入口：标签展示不能乱码；动作建议应可选择；项目关联至少提供清晰 UI 入口，若后端能力未完成，用禁用态或 TODO 注释标明等待接口。

约束：

- 保持 Tailwind + 现有组件风格，遵循 `FRONT_DESIGN.md`，不要引入新 UI 框架。
- 不要做 #10 Logo 沉浸动画和 #8 长编辑器，本轮只保留接口/状态兼容。
- 不要破坏 Phase 2 demo path 中 Dock/Entries/Review 的基础路径。
- 更新开发日志时遵循双日志收敛原则：只增量更新本轮手动创建的 Phase 3 前端日志文件，不新建其他 dev log，也不要继续把前端执行日志写入本统筹文件。添加 `Round 1 Frontend` 小节，写明时间戳、运行轮次、变更内容、遇到的问题、解决方式、是否解决、收口验证、是否可以进入下一轮、下一轮风险评估，内容精炼。

验证：

- 至少运行 `pnpm --dir apps/web lint`
- 至少运行 `pnpm --dir apps/web typecheck`
- 如测试受本地 Rollup native/code signature 阻塞，记录原始错误摘要到日志。

收尾：

- `git add` 本轮修改文件。
- 不要 commit，不要 push。
- 最终回复列出变更文件、验证结果、未解决风险。

### 5.2 Backend Agent Prompt

你是 Backend/Domain Agent，工作目录是 `/Users/qilong.lu/WorkDir/atlax-tech/mind-dock`。本轮目标是 Phase 3 Demo P0 后端/领域能力补齐，处理 GitHub issues #6 #7 #9，并为 #8 #11 预留接口。

执行前请先阅读：

- `docs/engineering/dev_log/Phase3/pre-phase3-demo_feature_and_bugs.md`
- `docs/engineering/dev_log/Phase3/pre-phase3-architecture_rebuild.md`
- `docs/product/TECH_SPEC.md`
- 相关代码：`packages/domain/src/**`、`apps/web/lib/repository.ts`、`apps/web/lib/types.ts`、`apps/web/lib/suggestion-engine.ts`

本轮没有已通过的上一轮 feature 代码需要提交；不要提交本轮代码。所有变更必须进入 git 暂存区，便于 Coordinator 用 `git diff --cached` review。

任务范围：

1. 落地 #6 无 LLM 临时 Chat 引导状态机/服务：主题 -> 类型/tag -> 内容 -> 确认记录方案 -> 确认入 Dock；支持取消、重新记录、按“标题/类型/内容”重填。
2. 落地 #9 数据能力：修复建议结构中标签乱码的源头；动作建议必须可被选择/保存；项目关联必须能在 repository/domain 层持久化和回显。
3. 最小落地 #7 链式结构：支持 source/parent/child 或等价 link 字段，能表达“由某条记录继续编辑/重新整理/派生”的关系。范围必须小，避免大迁移。
4. 为 #8 编辑保存路径收敛：短内容和长内容共用一个 domain/repository update path，明确保存后是否重置 suggestions/status。
5. 为 #11 编辑器能力接口预留：拆出 Obsidian-like 编辑功能的最小 port/type，例如 command/tool capability，不实现完整编辑器。

约束：

- 遵循当前 DDD-lite + Ports/Adapters 方向，领域能力优先放在 `packages/domain`，Web persistence 适配留在 `apps/web/lib`。
- 不要改大范围 UI 文件；如必须改 UI，只做类型接线或最小适配。
- 数据结构变更要兼容现有 IndexedDB demo 数据；需要迁移时必须写清楚兼容策略。
- 更新开发日志时遵循双日志收敛原则：只增量更新本轮手动创建的 Phase 3 后端日志文件，不新建其他 dev log，也不要继续把后端执行日志写入本统筹文件。添加 `Round 1 Backend` 小节，写明时间戳、运行轮次、变更内容、遇到的问题、解决方式、是否解决、收口验证、是否可以进入下一轮、下一轮风险评估，内容精炼。

验证：

- 至少运行 `pnpm --filter @atlax/domain typecheck`
- 至少运行 `pnpm --dir apps/web typecheck`
- 尽量运行相关 tests；如受本地 Rollup native/code signature 阻塞，记录原始错误摘要到日志。

收尾：

- `git add` 本轮修改文件。
- 不要 commit，不要 push。
- 最终回复列出变更文件、验证结果、未解决风险。

---

## 6. Coordinator Review Rules

下一轮由 Coordinator review `git diff --cached`：

- 如果 Round 1 前后端均通过：下一轮 prompt 必须要求 agent 先提交并推送已通过的上一轮代码，再开始 Round 2；Round 2 目标转向 #8 #10 #11 与 Review/Browse polish。
- 如果某一侧未通过：整理 review finding，生成单侧补充修复 prompt；未通过侧不得提交，另一侧可在不依赖失败代码时继续。
- 每轮必须遵循双日志收敛：Frontend Agent 只更新固定 Phase 3 前端日志文件，Backend Agent 只更新固定 Phase 3 后端日志文件；除这两个手动创建的日志外，不新增其他并行 dev log。本文件保留为 intake / coordination 基线，不再承载后续每轮执行日志。
