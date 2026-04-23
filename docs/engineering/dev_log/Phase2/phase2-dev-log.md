# Phase 2 开发日志（统一版）

| 项目 | 内容 |
|------|------|
| 阶段 | Phase 2 Demo |
| 日期 | 2026-04-21 ~ 2026-04-23 |
| 状态 | 已完成 |

---

## 时间线概览

| 日期 | 阶段 | 主要内容 |
|------|------|---------|
| 2026-04-21 | 2.1-2.2 | Workspace 主工作台收敛 |
| 2026-04-21 | 2.3 | Tag 编辑器与双轨整理机制 |
| 2026-04-21 | 2.4 | Archive 与 Entry 正式入库 |
| 2026-04-21 | 2.5 | Browse 基础版与演示路径 |
| 2026-04-22 | 2.6-2.7 | Demo 路径优化 |
| 2026-04-22 | 2.8 | 壳层稳定与身份闭环 |
| 2026-04-22 | 2.9 | 双模式框架与切换控制器 |
| 2026-04-22 | 2.10 | Chat Dock 统一输入主线 |
| 2026-04-22 | 2.11-2.13 | Suggest Tag / Archive Reopen / Browse Demo |
| 2026-04-23 | 2.14 | 指标埋点与验收收口 |
| 2026-04-23 | 2.14.1-2.14.11 | 多轮补丁修复与门禁对齐 |
| 2026-04-23 | 2.15 | 统一门禁脚本 |

---

## 1. Phase 2.1-2.2：Workspace 主工作台收敛

### 关键决策

1. **统一入口**：`/` redirect → `/workspace`，替代原有 `/capture` + `/inbox` 分页面形态
2. **三栏布局**：Sidebar + MainPanel + DetailPanel + QuickInputBar
3. **状态管理**：单页面 useState，未引入 Zustand（后续跨页面共享时再引入）

### 关键问题与解决

| 问题 | 解决方案 |
|------|---------|
| 错误处理回归 | 所有异步路径加 try/catch，错误横幅显示 |
| 视图切换语义错误 | selectedEntry 绑定 activeView，非 inbox 视图清空选中 |
| 全局 overflow 锁范围过大 | 移除全局 overflow:hidden，workspace 容器自行承担 |

### 验证结果

- lint/typecheck/build: PASS
- 数据流: QuickInput → Inbox → Detail → Archive 正常

---

## 2. Phase 2.3：Tag 编辑器与双轨整理机制

### 关键决策

1. **Tag ID 生成**：基于 lowercase name 的确定性 hash，同名 tag 生成相同 ID
2. **用户选择优先**：`resolveTags()` 实现用户选择覆盖系统建议
3. **UI 视觉区分**：绿色=用户选择、蓝色=系统建议

### 关键问题与解决

| 问题 | 解决方案 |
|------|---------|
| restore 清空 userTags | restore 只清空 suggestions，保留 userTags |
| 无 Tag 选择器 | 新增 existingTags prop + 下拉选择器 |
| userTags 重复 | repository 层调用 normalize + dedupe |

### 验证结果

- lint/typecheck: PASS
- Tag 创建/添加/删除/接受建议: 正常

---

## 3. Phase 2.4：Archive 与 Entry 正式入库

### 关键决策

1. **Entry 模型**：独立实体，包含 content、tags、project、sourceDockItemId
2. **归档流程**：InboxEntry → archive → Entry（持久化）
3. **状态流转**：pending → suggested → archived / ignored

### 验证结果

- lint/typecheck: PASS
- 归档后可再次编辑、重新整理

---

## 4. Phase 2.5：Browse 基础版与演示路径

### 关键决策

1. **四维筛选**：status/type/tag/project
2. **详情面板**：展示 content/tags/project/actions
3. **演示路径**：`/seed` 填充 + demo-path.md 文档

### 关键问题与解决

| 问题 | 解决方案 |
|------|---------|
| 2.14.1 UI 重写丢失筛选 | 恢复三维筛选 |
| 2.14.3 缺失 status 筛选 | 补齐 status 筛选 |

### 验证结果

- lint/typecheck: PASS
- 四维筛选 + 清空筛选 + 筛选后计数展示

---

## 5. Phase 2.8：壳层稳定与身份闭环

### 关键决策

1. **首页极简入口**：根据登录状态显示"进入工作区"或"继续整理"
2. **身份闭环**：注册/登录/退出/刷新恢复四条路径完整可用

### 验证结果

- lint/typecheck: PASS
- 身份闭环四条路径: PASS

---

## 6. Phase 2.9：双模式框架与切换控制器

### 关键决策

1. **双模式**：Classic / Chat，共享同一 DockItem 列表
2. **mode_switched 事件**：记录模式切换

### 验证结果

- lint/typecheck: PASS
- 模式切换: 正常

---

## 7. Phase 2.10：Chat Dock 统一输入主线

### 关键决策

1. **SourceType 扩展**：新增 `'chat'`
2. **ChatPanel 三步引导**：input → confirm → done
3. **统一处理**：Chat 提交复用 `createDockItem`，写入同一 IndexedDB 表

### 验证结果

- lint/typecheck/test: PASS
- Chat 与 Classic 共享同一列表

---

## 8. Phase 2.14：指标埋点与验收收口

### 关键决策

1. **6 个事件埋点**：capture_created、chat_guided_capture_created、archive_completed、mode_switched、weekly_review_opened、browse_revisit
2. **5 个指标计算**：DAU、日均记录次数、Chat 归档率、7日留存率、Review 打开率
3. **事件日志容量**：500 条

### 关键问题与解决

| 问题 | 解决方案 |
|------|---------|
| chatArchiveRate 口径错误 | 按唯一 dockItemId 去重统计 |
| retention7d 口径错误 | D0→D7 cohort 口径，先排序后计算 |
| Metrics UI 入口缺失 | Review 视图新增 Metrics 卡片 |

### 验证结果

- lint/typecheck/test: PASS
- 93/93 测试通过（含 5 个新增口径测试）

---

## 9. Phase 2.14.1-2.14.11：多轮补丁修复

### 关键修复

| 阶段 | 问题 | 解决方案 |
|------|------|---------|
| 2.14.2 | reconnect 回归 | 恢复三维筛选 |
| 2.14.3 | demo-path landing | 修复归档后编辑 |
| 2.14.4 | Chat 交互重构 | 侧栏切模式仅切换输入框位置 |
| 2.14.5-2.14.8 | Chat/Tag 交互优化 | 多轮 UX 修复 |
| 2.14.9 | 布局挤压与折叠 | 侧边栏手动折叠、详情区自动占满 |
| 2.14.10 | 交互回归修正 | 修复非沉浸 Chat 遮罩交互阻断 |
| 2.14.11 | 运行时门禁对齐 | 统一执行端判定规则 |

---

## 10. Phase 2.15：统一门禁脚本

### 关键决策

1. **统一入口**：`scripts/run-web-gate.sh`
2. **固定 Node.js**：`/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node`
3. **三步门禁**：lint → typecheck → test

### 放行矩阵

| 执行端 | platform/arch | 结果 | 归因 |
|--------|---------------|------|------|
| Trae bundled Node | darwin/arm64 | PASS | 架构与签名链路均通过 |
| Codex Node | darwin/arm64 | FAIL | ERR_DLOPEN_FAILED + code signature |
| Rosetta x64 | darwin/x64 | FAIL | 架构不匹配 |

### 验证结果

- lint/typecheck/test: PASS (102/102)

---

## 11. 功能验收结论

| M2 模块 | 功能 | 结论 |
|---------|------|------|
| M2-01 | 项目工程基座 | PASS |
| M2-02 | 壳层稳定与身份闭环 | PASS |
| M2-03 | 双模式框架与切换控制器 | PASS |
| M2-04 | 输入主线统一 | PASS |
| M2-05 | Suggest / Tag 最小可用 | PASS |
| M2-06 | Archive 与 Re-organize 闭环 | PASS |
| M2-07 | Browse 基础版与演示路径 | PASS |
| M2-08 | 指标埋点与验收收口 | PASS |
| M2-09 | 界面布局挤压与侧边栏折叠 | PASS |
| M2-10 | 交互回归修正与 Dock 快速编辑 | PASS |

---

## 12. Phase 3 交接项

| 交接项 | 说明 | 优先级 |
|--------|------|--------|
| 后端认证与云同步 | 用户数据持久化到云端 | P0 |
| LLM 接入 | Suggest/Tag/Archive 使用 AI 生成 | P0 |
| Chat AI 引导追问 | Chat 模式自动追问补全上下文 | P1 |
| 多用户指标聚合 | DAU/留存等指标需后端支持 | P1 |
| 动画与交互打磨 | 模式切换动画、列表过渡 | P2 |
| sourceType 筛选 | Entries 按来源类型筛选 | P2 |

---

## 13. 已知风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 本地认证无加密 | localStorage 可被读取 | Phase 3 引入后端认证 |
| IndexedDB 数据无备份 | 清除浏览器数据会丢失 | Phase 3 引入云同步 |
| 事件日志容量限制 | localStorage 上限约 5MB | Phase 3 引入远端事件上报 |
| Suggest 为本地规则 | 非真正 AI | Phase 3 接入 LLM API |

---

## 14. 历史日志处理

本文件为 Phase 2 统一开发日志。原分散日志（36 个 `phase-2.*.md` 文件）已删除，仅保留本统一日志文件与验收主文档 `phase2-acceptance.md`。

已删除的分散日志清单（36 个）：
- phase-2.1-2.2-workspace-convergence.md
- phase-2.3-tag-editor.md
- phase-2.4-archive-entry.md
- phase-2.5-browse-review.md
- phase-2.6-demo-path.md
- phase-2.7-review-fix.md
- phase-2.8-shell-auth.md
- phase-2.9-mode-switch.md
- phase-2.9.1-mode-switch-patch.md
- phase-2.10-chat-dock.md
- phase-2.11-suggest-tag.md
- phase-2.12-archive-reopen.md
- phase-2.13-browse-demo.md
- phase-2.14-metrics-acceptance.md
- phase-2.14.1-metrics-ui-unification.md
- phase-2.14.2-regression-reconnect.md
- phase-2.14.3-demo-path-landing-fix.md
- phase-2.14.4-chat-ux-rework.md
- phase-2.14.5-chat-choice-finalization.md
- phase-2.14.6-chat-motion-consistency.md
- phase-2.14.7-chat-input-hitbox-suggest-tag-fix.md
- phase-2.14.7-chat-input-motion-final.md
- phase-2.14.8-suggest-tag-recovery.md
- phase-2.14.9-layout-and-actions.md
- phase-2.14.10-layout-and-chat-interaction-fixes.md
- phase-2.14.10.1-backend-test-hardening.md
- phase-2.14.10.1-frontend-gate-fix.md
- phase-2.14.10.2-backend-stage-and-doc-fix.md
- phase-2.14.10.2-frontend-doc-sync.md
- phase-2.14.10.3-backend-log-truth-fix.md
- phase-2.14.10.3-frontend-doc-truth-fix.md
- phase-2.14.10.4-backend-test-block-cause-alignment.md
- phase-2.14.10.4-frontend-log-cause-alignment.md
- phase-2.14.11-infra-runtime-gate-alignment.md
- phase-2.14.11.1-runtime-proof-matrix-fix.md
- phase-2.15-backend-gate-script.md
- phase-2.15-frontend-chat-dock-regression.md
