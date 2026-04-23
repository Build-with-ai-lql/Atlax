# Phase 2 验收收口文档

| 项目 | 内容 |
|------|------|
| 阶段 | Phase 2 Demo |
| 日期 | 2026-04-23 |
| 状态 | 待复审（2.14.15 统一门禁脚本已就绪） |

---

## 1. 功能验收结论

| M2 模块 | 功能 | 结论 | 说明 |
|---------|------|------|------|
| M2-01 | 项目工程基座 | PASS | monorepo + Next.js + Dexie + domain 包 |
| M2-02 | 壳层稳定与身份闭环 | PASS | 首页极简入口、注册/登录/退出/刷新恢复 |
| M2-03 | 双模式框架与切换控制器 | PASS | Classic/Chat 切换、mode_switched 事件 |
| M2-04 | 输入主线统一 | PASS (2.14.4 重构) | Chat 交互层级重构：侧栏切模式仅切换输入框位置、沉浸模式独立入口、消息流布局、确认后分流（去 Dock/留在 Chat）；2.14.4 修复空白页阻塞 |
| M2-05 | Suggest / Tag 最小可用 | PASS | reason 可见、用户 Tag 覆盖建议、Chat Tag 确认、忽略建议按条目隔离 |
| M2-06 | Archive 与 Re-organize 闭环 | PASS | 全状态流转、reopen 清空建议、编辑标签同步 |
| M2-07 | Browse 基础版与演示路径 | PASS (2.14.3 修复) | Entries 四维筛选（status/type/tag/project）、详情含 actions、reopen 回流、seed 数据增强、demo-path 文档；2.14.1 UI 重写丢失筛选，2.14.2 恢复三维，2.14.3 补齐 status 筛选 |
| M2-08 | 指标埋点与验收收口 | PASS (2.14.1 patched) | 6 个事件埋点、5 个指标计算（口径已修复）、Metrics UI 入口、验收文档 |
| M2-09 | 界面布局挤压与侧边栏折叠 | PASS (2.14.9) | 侧边栏手动折叠 (w-64 to 72px)、详情打开时列表自动挤压 (flex-1 to 320px)、详情区自动占满剩余空间 |
| M2-10 | 交互回归修正与 Dock 快速编辑 | PASS (2.14.10.1) | 修复非沉浸 Chat 遮罩交互阻断 (回归到 2.14.7 体验)、右下角 FAB 悬浮球切换、Dock 条目支持实时编辑并重置建议状态 |

---

## 2. 产品验收结论

| 产品能力 | 结论 | 说明 |
|---------|------|------|
| 新用户注册并进入工作区 | PASS | AuthGate + localStorage 本地认证 |
| 已登录用户刷新后会话恢复 | PASS | getCurrentUser 从 localStorage 恢复 |
| 首页极简入口 | PASS (2.14.3) | Landing Page 替换为 Gemini 设计，含品牌动画、暗色模式、穿越转场 |
| Classic 模式完整整理链路 | PASS | Capture → Suggest → Tag → Archive |
| Chat 模式引导输入 | PASS (2.14.5 收口) | 输入 → 自动进入聊天布局 → 确认 → 上下文 → 标签 → 入 Dock → 用户选择（去 Dock/留在 Chat）；不强制切换视图 |
| Classic 与 Chat 共享同一数据主线 | PASS | 同一 DockItem 列表、同一状态流转 |
| Dock 列表展示优化 | PASS (2.14.4) | 卡片/列表视图切换 + line-clamp + localStorage 持久化 |
| 建议可解释 | PASS | reason 字段可见 |
| 用户 Tag 覆盖系统建议 | PASS | resolveTags 用户优先 + 忽略建议 |
| 归档后可再次编辑 | PASS (2.14.3 修复) | updateArchivedEntry，content/tags/project/actions 四项可查看，content/tags/project 可编辑 |
| 归档后可重新整理 | PASS | reopenItem → suggestItem → archiveItem |
| Entries 浏览与筛选 | PASS (2.14.3 修复) | status/type/tag/project 四维筛选 + 清空筛选 + 筛选后计数展示 |
| 演示路径可复现 | PASS | /seed 填充 + demo-path.md 文档 |
| 指标可复核 | PASS (2.14.1) | Review 视图 Metrics 卡片展示 5 个关键指标 |
| Review 最近归档列表 | PASS (2.14.3) | Review 视图展示最近 10 条归档，点击可打开详情 |

---

## 3. 指标口径与当前结果

| 指标 | 口径 | 计算方式 | 当前结果 |
|------|------|---------|---------|
| DAU | 日活跃用户数 | 当日有 capture_created 或 chat_guided_capture_created 事件的用户数 | 本地单用户：1（有记录时）/ 0（无记录时） |
| 每用户日均记录次数 | 当日总 capture 事件数 / DAU | (capture_created + chat_guided_capture_created) / dau | 依赖使用频率 |
| Chat 引导后归档率 | 按**唯一 dockItemId** 去重：已归档的 chat capture 数 / chat capture 总数 | uniqueChatArchivedFromCaptures / uniqueChatCaptureIds | 依赖使用数据，结果 ≤ 1 |
| 7日留存率 | D0→D7 cohort：首次 capture 后第 7 天是否有事件 | 先排序 → firstCapture._ts 为 cohort → 检查 D7 窗口内事件 | 本地单用户：1（新用户）/ 0 或 1（老用户） |
| Weekly Review 打开率 | 7天内 weekly_review_opened 事件数 / 7 | review 事件数 / 7天 | 依赖使用数据 |

**2.14.1 口径修复说明**：
- chatArchiveRate：原实现直接用 chatArchives.length / chatCaptures.length，同一 dockItemId 被 reopen 后再次 archive 会重复计入分子，导致归档率可能超过 1。修复后按唯一 dockItemId 去重。
- retention7d：原实现依赖 events[0] 原始顺序且仅检查"最近1天是否活跃"，不等于 D0→D7 留存定义。修复后先按 _ts 排序，以首次 capture 事件时间为 cohort 起点，检查 D7 当天是否有事件。

**说明**：当前为本地单用户 Demo 阶段，指标计算基于事件日志（localStorage），无远端上报。多用户场景需 Phase 3 后端支持。

---

## 4. 事件埋点清单

| 事件 | 触发点 | 字段 |
|------|--------|------|
| capture_created | Classic/Chat 模式输入提交 | sourceType, dockItemId |
| chat_guided_capture_created | Chat 模式最终确认入 Dock（非草稿输入时） | dockItemId, rawText |
| archive_completed | 点击"接受归档" | dockItemId, sourceType |
| mode_switched | 切换 Classic/Chat 模式 | from, to |
| weekly_review_opened | 切换到 Review 视图 | (无额外字段) |
| browse_revisit | 选中已归档条目查看详情 | entryId |

---

## 5. 已知风险与 Phase 3 交接项

### 风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 本地认证无加密 | 任何可访问 localStorage 的脚本可读取用户数据 | Phase 3 引入后端认证 |
| IndexedDB 数据无备份 | 清除浏览器数据会丢失所有内容 | Phase 3 引入云同步 |
| 事件日志容量限制 | localStorage 上限约 5MB，当前保留最近 500 条 | Phase 3 引入远端事件上报 |
| Suggest 为本地规则 | 非真正 AI，基于关键词匹配 | Phase 3 接入 LLM API |

### Phase 3 交接项

| 交接项 | 说明 | 优先级 |
|--------|------|--------|
| 后端认证与云同步 | 用户数据持久化到云端 | P0 |
| LLM 接入 | Suggest/Tag/Archive 使用 AI 生成 | P0 |
| Chat AI 引导追问 | Chat 模式自动追问补全上下文 | P1 |
| 多用户指标聚合 | DAU/留存等指标需后端支持 | P1 |
| 动画与交互打磨 | 模式切换动画、列表过渡 | P2 |
| sourceType 筛选 | Entries 按来源类型筛选 | P2 |
| EntryListItem 来源标识 | 列表项显示 chat/text 来源图标 | P2 |

---

## 6. 跨架构门禁放行标准

> **详细对齐见 [phase2-dev-log.md#9-phase-2141-21411多轮补丁修复](phase2-dev-log.md#9-phase-2141-21411多轮补丁修复)**；**统一门禁入口见 `scripts/run-web-gate.sh`（[phase-2.15](phase2-dev-log.md#10-phase-215统一门禁脚本)）**

### 6.0 统一门禁入口（[phase-2.15](phase2-dev-log.md#10-phase-215统一门禁脚本) 新增）

所有 FE/BE agent 执行门禁时，统一使用：

```bash
bash scripts/run-web-gate.sh
```

该脚本固定使用 `/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node`，自动输出执行端指纹 + lint/typecheck/test 三步结果。

示例输出：
```text
============================================
 Atlax MindDock Web Gate (unified runner)
============================================

[FINGERPRINT]
  node:     /Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node
  execPath: /Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node
  platform: darwin
  arch:     arm64

--- lint ---
  PASS
--- typecheck ---
  PASS
--- test ---
 Test Files  8 passed (8)
      Tests  102 passed (102)
   Duration  653ms
  PASS

============================================
 Results: 3 passed, 0 failed
 GATE: PASSED
```

### 6.1 执行端判定规则（统一口径）

1. 先记录执行端二进制：`which node`。
2. 再记录运行时身份：`node -p "process.execPath + ' | ' + process.platform + ' | ' + process.arch"`。
3. 最后在同一执行端运行：`pnpm --dir apps/web test -- --run`。
4. 门禁归因仅依据上述同端输出；`uname -m` 仅作宿主机背景，不作为主判据。

### 6.2 放行矩阵（已纳入签名失败分支）

| 执行端 | `process.platform/arch` | 门禁结果 | 归因 | 放行口径 |
|-----------|-------------|------------------|----------------|
| `/Applications/Codex.app/Contents/Resources/node` | `darwin/arm64` | ✖️ 失败：`ERR_DLOPEN_FAILED` + `code signature ... different Team IDs` | 同为 arm64，但 Node 签名链路失败 | 环境执行端失败，不判业务回归 |
| `/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node` | `darwin/arm64` | ✅ `102/102 PASS` | 架构与签名链路均通过 | 作为本轮可复核放行基准 |
| 历史 Rosetta x64 执行端 | `darwin/x64` | ✖️ 失败：`Cannot find module @rollup/rollup-darwin-x64` | 架构不匹配 | 环境阻塞，不判业务回归 |
| CI Linux runner | `linux/x64` | ✅ PASS | Linux 平台链路通过 | 辅助验证 |

**阶段放行准入**：以可复核执行端（本轮为 `/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node`）门禁全部 PASS 为准；其他执行端失败需先归因为环境分支（架构或签名链路），再决定是否阻断。
