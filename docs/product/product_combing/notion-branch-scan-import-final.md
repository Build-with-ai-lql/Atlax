# Atlax MindDock Notion Branch Scan Import Final

扫描批次：`branch-scan-001`

## 汇总

- 总任务数：55
- 历史完成数量：13
- 当前未完成数量：42
- P0 / P1 数量：35（P0: 8，P1: 27）

## 各分支任务数量

| 归属分支 | 数量 |
| --- | --- |
| 跨分支 | 8 |
| codex/demo2-ui-golden-migration | 43 |
| main | 2 |
| stable-demo | 2 |

## 各阶段任务数量

| 阶段 | 数量 |
| --- | --- |
| 测试验收 | 3 |
| 后端接入 | 3 |
| 前端收敛 | 30 |
| 文档同步 | 11 |
| Demo准备 | 8 |

## 工作性质数量

| 工作性质 | 数量 |
| --- | --- |
| 当前待办 | 6 |
| 发布准备 | 4 |
| 分支同步 | 5 |
| 历史完成 | 13 |
| 文档债务 | 5 |
| 修复债务 | 22 |

## 新增任务清单

| 任务编号 | 任务 | 优先级 | 模块 | 阶段 | 证据路径 |
| --- | --- | --- | --- | --- | --- |
| TASK-001 | Workspace Tabs 持久化接入 | P0 | Tabs | 前端收敛 | apps/web/app/workspace/page.tsx; apps/web/app/workspace/features/shared/WorkspaceTabs.tsx; apps/web/lib/repository.ts |
| TASK-002 | Editor 草稿自动保存 | P0 | Editor | 前端收敛 | apps/web/app/workspace/page.tsx; apps/web/app/workspace/features/editor/EditorTabView.tsx |
| TASK-003 | Dock Add Tag 接入真实 API | P0 | Dock | 前端收敛 | apps/web/app/workspace/page.tsx; apps/web/lib/repository.ts |
| TASK-004 | Floating Chat Panel 隐藏或标注 Coming Soon | P0 | Chat | 前端收敛 | apps/web/app/workspace/_components/FloatingChatPanel.tsx |
| TASK-005 | Editor Delete 接入真实实现 | P0 | Editor | 前端收敛 | apps/web/app/workspace/page.tsx; apps/web/lib/repository.ts |
| TASK-006 | Dock Folder 持久化 | P1 | Dock | 前端收敛 | apps/web/app/workspace/page.tsx; apps/web/app/workspace/features/dock/dockTreeAdapter.ts; apps/web/lib/repository.ts |
| TASK-007 | Sidebar Project Folder 持久化 | P1 | Sidebar | 前端收敛 | apps/web/app/workspace/page.tsx; apps/web/app/workspace/_components/GlobalSidebar.tsx; apps/web/lib/repository.ts |
| TASK-008 | Classic 预览集成 Markdown 渲染 | P1 | Editor | 前端收敛 | apps/web/app/workspace/features/editor/EditorTabView.tsx; docs/product/product_combing/frontend-feature-inventory.md |
| TASK-009 | Editor Rename 接入真实实现 | P1 | Editor | 前端收敛 | apps/web/app/workspace/page.tsx; apps/web/lib/repository.ts |
| TASK-010 | Editor Move to 接入真实实现 | P1 | Editor | 前端收敛 | apps/web/app/workspace/page.tsx; apps/web/lib/repository.ts |
| TASK-011 | Mind Edge 删除统一走 repository | P1 | Mind | 前端收敛 | apps/web/app/workspace/page.tsx; apps/web/lib/repository.ts |
| TASK-012 | Sidebar Weather Widget 移除或隐藏 | P1 | Sidebar | 前端收敛 | apps/web/app/workspace/_components/GlobalSidebar.tsx; docs/product/product_combing/frontend-feature-inventory.md |
| TASK-013 | Sidebar Tasks Widget 移除或隐藏 | P1 | Sidebar | 前端收敛 | apps/web/app/workspace/_components/GlobalSidebar.tsx; docs/product/product_combing/frontend-feature-inventory.md |
| TASK-014 | TopNav 搜索建议标注开发中 | P1 | TopNav | 前端收敛 | apps/web/app/workspace/_components/GoldenTopNav.tsx; apps/web/app/workspace/page.tsx |
| TASK-015 | Floating Recorder Chat 接入 ChatGuidanceService | P1 | Chat | 前端收敛 | apps/web/app/workspace/page.tsx; packages/domain/src/services/ChatGuidanceService.ts; apps/web/lib/repository.ts |

## 从 Preview 中修正的任务清单

- 将所有 `需要测试` 从 boolean 转为 Notion checkbox 导入格式：`__YES__` / `__NO__`。
- 历史完成任务统一校验为 `状态 = Done`、`工作性质 = 历史完成`、`需要测试 = __NO__`，并补足“历史记录，不做新开发”边界。
- 将 Step3 中原本只在“建议更新现有任务”里的 `TASK-001` 至 `TASK-015` 转为独立可导入任务。
- HIST-BE-001：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- HIST-BE-002：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- HIST-DEMO-001：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- HIST-DEMO-002：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- HIST-DOC-001：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- HIST-DOC-002：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- HIST-FE-001：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- HIST-FE-002：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- HIST-FE-003：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- HIST-FE-004：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- HIST-FE-005：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- HIST-FE-006：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- HIST-FE-007：需要测试 checkbox 格式、历史完成状态/测试/边界规则
- TODO-BE-001：需要测试 checkbox 格式
- TODO-DOC-001：需要测试 checkbox 格式
- TODO-FE-001：需要测试 checkbox 格式
- TODO-FE-002：需要测试 checkbox 格式
- TODO-FE-003：需要测试 checkbox 格式
- TODO-QA-001：需要测试 checkbox 格式
- DEBT-DATA-001：需要测试 checkbox 格式
- DEBT-DATA-002：需要测试 checkbox 格式
- DEBT-DOC-001：需要测试 checkbox 格式
- DEBT-DOC-002：需要测试 checkbox 格式
- DEBT-DOC-003：需要测试 checkbox 格式
- DEBT-DOC-004：需要测试 checkbox 格式
- DEBT-DOC-005：需要测试 checkbox 格式
- DEBT-FE-001：需要测试 checkbox 格式
- DEBT-FE-002：需要测试 checkbox 格式
- DEBT-FE-003：需要测试 checkbox 格式
- DEBT-FE-004：需要测试 checkbox 格式
- DEBT-FE-005：需要测试 checkbox 格式
- SYNC-001：需要测试 checkbox 格式
- SYNC-002：需要测试 checkbox 格式
- SYNC-003：需要测试 checkbox 格式
- SYNC-004：需要测试 checkbox 格式
- SYNC-005：需要测试 checkbox 格式
- REL-DEMO-001：需要测试 checkbox 格式
- REL-DEMO-002：需要测试 checkbox 格式
- REL-MAIN-001：需要测试 checkbox 格式
- REL-MAIN-002：需要测试 checkbox 格式

## 当前建议优先执行的 Top 10 任务

| 排序 | 任务编号 | 任务 | 优先级 | 原因 |
| --- | --- | --- | --- | --- |
| 1 | TASK-001 | Workspace Tabs 持久化接入 | P0 | 核心路径刷新后状态丢失，阻塞 Golden UI 稳定演示。 |
| 2 | TASK-003 | Dock Add Tag 接入真实 API | P0 | 用户会误以为标签已保存，刷新后丢失，属于 P0 假功能。 |
| 3 | TASK-004 | Floating Chat Panel 隐藏或标注 Coming Soon | P0 | Floating Chat 全 mock，Demo 误导风险最高。 |
| 4 | TASK-005 | Editor Delete 接入真实实现 | P0 | Delete 只 toast，用户可能误判数据已删除。 |
| 5 | SYNC-002 | stable-demo 从旧 Demo 升级到 Golden Demo 的同步边界 | P0 | stable-demo 明显落后，必须先定义同步边界。 |
| 6 | REL-DEMO-001 | stable-demo 发布前隐藏或标注全部 Mock/Hardcoded 功能 | P0 | 发布前必须隐藏或标注所有 Mock/Hardcoded 功能。 |
| 7 | REL-DEMO-002 | stable-demo Golden UI 主流程回归 | P0 | Golden UI 同步 stable-demo 前必须完成主流程回归。 |
| 8 | TASK-002 | Editor 草稿自动保存 | P0 | 草稿刷新丢失会直接造成用户输入丢失。 |
| 9 | TASK-006 | Dock Folder 持久化 | P1 | Dock Folder 是高可见入口，当前 session-only。 |
| 10 | TASK-007 | Sidebar Project Folder 持久化 | P1 | Sidebar Project Folder 与 Dock Folder 必须同口径收敛。 |

## 最终导入任务表

| 任务编号 | 任务 | 模块 | 优先级 | 状态 | 任务类型 | 当前状态 | 目标状态 | 需要测试 | 工作性质 | 阶段 | 归属分支 | 工作量 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-001 | Workspace Tabs 持久化接入 | Tabs | P0 | Next | Backend Integration | React State | Real IndexedDB | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| TASK-002 | Editor 草稿自动保存 | Editor | P0 | Next | Fix | React State | Real IndexedDB | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| TASK-003 | Dock Add Tag 接入真实 API | Dock | P0 | Next | Mock Replacement | Mock | Real IndexedDB | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | S |
| TASK-004 | Floating Chat Panel 隐藏或标注 Coming Soon | Chat | P0 | Next | Demo Hide | Mock | Coming Soon | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | S |
| TASK-005 | Editor Delete 接入真实实现 | Editor | P0 | Next | Mock Replacement | Mock | Real IndexedDB | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| TASK-006 | Dock Folder 持久化 | Dock | P1 | Next | Mock Replacement | Mock | Real IndexedDB | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| TASK-007 | Sidebar Project Folder 持久化 | Sidebar | P1 | Next | Mock Replacement | Mock | Real IndexedDB | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| TASK-008 | Classic 预览集成 Markdown 渲染 | Editor | P1 | Next | Fix | Partial | MVP Ready | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| TASK-009 | Editor Rename 接入真实实现 | Editor | P1 | Next | Mock Replacement | Mock | Real IndexedDB | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | S |
| TASK-010 | Editor Move to 接入真实实现 | Editor | P1 | Next | Mock Replacement | Mock | Real IndexedDB | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| TASK-011 | Mind Edge 删除统一走 repository | Mind | P1 | Next | Tech Debt | Partial | Real IndexedDB | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | S |
| TASK-012 | Sidebar Weather Widget 移除或隐藏 | Sidebar | P1 | Next | Demo Hide | Hardcoded | Hidden | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | S |
| TASK-013 | Sidebar Tasks Widget 移除或隐藏 | Sidebar | P1 | Next | Demo Hide | Hardcoded | Hidden | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | S |
| TASK-014 | TopNav 搜索建议标注开发中 | TopNav | P1 | Next | Demo Hide | Hardcoded | Coming Soon | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | S |
| TASK-015 | Floating Recorder Chat 接入 ChatGuidanceService | Chat | P1 | Next | Backend Integration | Partial | MVP Ready | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| HIST-BE-001 | IndexedDB Repository v15 能力已完成 | Data | P2 | Done | Feature | Real | Tested | __NO__ | 历史完成 | 后端接入 | codex/demo2-ui-golden-migration | L |
| HIST-BE-002 | Domain mind/document/workspace 类型与服务已完成 | Data | P2 | Done | Feature | Real | Tested | __NO__ | 历史完成 | 后端接入 | codex/demo2-ui-golden-migration | L |
| HIST-DEMO-001 | Demo2 原型预览路由已完成 | Home | P3 | Done | Feature | Real | Documented | __NO__ | 历史完成 | Demo准备 | codex/demo2-ui-golden-migration | S |
| HIST-DEMO-002 | Demo Seed 数据填充工具已完成 | Data | P3 | Done | Feature | Partial | Documented | __NO__ | 历史完成 | Demo准备 | codex/demo2-ui-golden-migration | M |
| HIST-DOC-001 | 前端功能盘点文档初稿已完成 | Docs | P3 | Done | Docs | Partial | Documented | __NO__ | 历史完成 | 文档同步 | codex/demo2-ui-golden-migration | M |
| HIST-DOC-002 | UI 分支重构与后端接入文档已新增 | Docs | P3 | Done | Docs | Partial | Documented | __NO__ | 历史完成 | 文档同步 | codex/demo2-ui-golden-migration | M |
| HIST-FE-001 | Golden Workspace UI Shell 已完成 | Home | P3 | Done | Feature | Real | MVP Ready | __NO__ | 历史完成 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| HIST-FE-002 | Home Dashboard 与快速捕获已接入 IndexedDB | Home | P2 | Done | Feature | Real | MVP Ready | __NO__ | 历史完成 | 前端收敛 | codex/demo2-ui-golden-migration | S |
| HIST-FE-003 | Mind Canvas 基础图谱交互已完成 | Mind | P2 | Done | Feature | Partial | MVP Ready | __NO__ | 历史完成 | 前端收敛 | codex/demo2-ui-golden-migration | L |
| HIST-FE-004 | Dock Finder 三视图浏览已完成 | Dock | P2 | Done | Feature | Partial | MVP Ready | __NO__ | 历史完成 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| HIST-FE-005 | Block / Classic Editor 主体已完成 | Editor | P2 | Done | Feature | Partial | MVP Ready | __NO__ | 历史完成 | 前端收敛 | codex/demo2-ui-golden-migration | L |
| HIST-FE-006 | Quick Note 与 Floating Recorder 捕获闭环已完成 | Editor | P2 | Done | Feature | Real | MVP Ready | __NO__ | 历史完成 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| HIST-FE-007 | 本地用户注册/恢复/退出已完成 | Auth | P3 | Done | Feature | Real | MVP Ready | __NO__ | 历史完成 | 前端收敛 | 跨分支 | S |
| TODO-BE-001 | 定义 UI 分支到后端 API 的最小接入矩阵 | Data | P1 | Next | Backend Integration | Partial | Backend API | __YES__ | 当前待办 | 后端接入 | 跨分支 | M |
| TODO-DOC-001 | 恢复或重写 UI 分支 Demo 演示路径文档 | Docs | P1 | Backlog | Docs | Missing | Documented | __NO__ | 当前待办 | 文档同步 | codex/demo2-ui-golden-migration | M |
| TODO-FE-001 | Home 最近文档接入 recentDocuments repository | Home | P1 | Next | Backend Integration | Partial | Real IndexedDB | __YES__ | 当前待办 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| TODO-FE-002 | Mind 节点位置持久化接入 positionX/positionY | Mind | P2 | Backlog | Feature | React State | Real IndexedDB | __YES__ | 当前待办 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| TODO-FE-003 | Seed 工具发布前访问边界确认 | Data | P1 | Backlog | Demo Hide | Partial | Hidden | __YES__ | 当前待办 | Demo准备 | codex/demo2-ui-golden-migration | S |
| TODO-QA-001 | 补齐 Golden UI 回归测试矩阵 | QA | P1 | Next | Test | Partial | Tested | __YES__ | 当前待办 | 测试验收 | codex/demo2-ui-golden-migration | M |
| DEBT-DATA-001 | Mind 虚拟 Domain 硬编码分组标记或替换 | Mind | P1 | Backlog | Tech Debt | Hardcoded | Real IndexedDB | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| DEBT-DATA-002 | Seed 页面直接写 DB 的边界债务收敛 | Data | P2 | Backlog | Tech Debt | Partial | Documented | __YES__ | 修复债务 | 文档同步 | codex/demo2-ui-golden-migration | S |
| DEBT-DOC-001 | README Repository 边界与直接 db.table 使用不一致 | Docs | P2 | Backlog | Docs | Partial | Documented | __NO__ | 文档债务 | 文档同步 | 跨分支 | S |
| DEBT-DOC-002 | PRD 当前阶段与 Golden UI 真实状态未同步 | Docs | P1 | Backlog | Docs | Partial | Documented | __NO__ | 文档债务 | 文档同步 | codex/demo2-ui-golden-migration | M |
| DEBT-DOC-003 | FRONTEND_TECH_SPEC 与实际 WorkspaceTabs 状态不一致 | Docs | P1 | Backlog | Docs | Partial | Documented | __NO__ | 文档债务 | 文档同步 | codex/demo2-ui-golden-migration | S |
| DEBT-DOC-004 | 结构/算法文档需区分未来算法与当前 v15 实现 | Docs | P1 | Backlog | Docs | Partial | Documented | __NO__ | 文档债务 | 文档同步 | codex/demo2-ui-golden-migration | M |
| DEBT-DOC-005 | frontend-feature-inventory 需纳入分支或标注本地状态 | Docs | P2 | Backlog | Docs | Partial | Documented | __NO__ | 文档债务 | 文档同步 | codex/demo2-ui-golden-migration | S |
| DEBT-FE-001 | Editor Block 操作中的 mock reorder / add block 收敛 | Editor | P1 | Backlog | Mock Replacement | Mock | Real IndexedDB | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| DEBT-FE-002 | Editor 右侧 Context Links mock 卡片收敛 | Editor | P1 | Backlog | Mock Replacement | Mock | Coming Soon | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | S |
| DEBT-FE-003 | Sidebar Calendar Widget 从硬编码改为真实或隐藏 | Sidebar | P1 | Backlog | Mock Replacement | Hardcoded | Real IndexedDB | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | M |
| DEBT-FE-004 | TopNav 账号菜单硬编码能力收敛 | TopNav | P1 | Backlog | Demo Hide | Hardcoded | Coming Soon | __YES__ | 修复债务 | Demo准备 | codex/demo2-ui-golden-migration | S |
| DEBT-FE-005 | 旧 /dock 路由与 Workspace Dock 定位收敛 | Dock | P2 | Backlog | Tech Debt | Partial | Documented | __YES__ | 修复债务 | 前端收敛 | codex/demo2-ui-golden-migration | S |
| SYNC-001 | Golden UI 合入 develop 的同步边界 | Data | P1 | Backlog | Tech Debt | Partial | MVP Ready | __YES__ | 分支同步 | 前端收敛 | 跨分支 | L |
| SYNC-002 | stable-demo 从旧 Demo 升级到 Golden Demo 的同步边界 | QA | P0 | Backlog | Tech Debt | Partial | MVP Ready | __YES__ | 分支同步 | Demo准备 | 跨分支 | L |
| SYNC-003 | Dexie schema 版本跨分支对齐 | Data | P1 | Backlog | Backend Integration | Partial | Tested | __YES__ | 分支同步 | 测试验收 | 跨分支 | M |
| SYNC-004 | main 维持空代码分支直到发布门槛通过 | QA | P2 | Backlog | Tech Debt | Missing | MVP Ready | __NO__ | 分支同步 | Demo准备 | 跨分支 | S |
| SYNC-005 | UI 分支删除的旧工程文档需决定是否迁回 | Docs | P2 | Backlog | Docs | Partial | Documented | __NO__ | 分支同步 | 文档同步 | 跨分支 | S |
| REL-DEMO-001 | stable-demo 发布前隐藏或标注全部 Mock/Hardcoded 功能 | QA | P0 | Next | Demo Hide | Mock | Coming Soon | __YES__ | 发布准备 | Demo准备 | stable-demo | L |
| REL-DEMO-002 | stable-demo Golden UI 主流程回归 | QA | P0 | Backlog | Test | Partial | Tested | __YES__ | 发布准备 | 测试验收 | stable-demo | M |
| REL-MAIN-001 | main 首次产品发布最低门槛清单 | QA | P1 | Backlog | Test | Missing | MVP Ready | __YES__ | 发布准备 | Demo准备 | main | S |
| REL-MAIN-002 | 发布前帮助文档与演示口径同步 | Docs | P1 | Backlog | Docs | Partial | Documented | __NO__ | 发布准备 | 文档同步 | main | M |
