# M2-08.1｜指标口径修复与全站 UI 统一

| 项目 | 内容 |
|------|------|
| 模块 | M2-08 补丁 |
| 状态 | DONE (回归已由 2.14.2 修复) |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 目标

完成 Phase2 补丁收口：先修指标口径缺陷，再做全站 UI 风格统一。本轮结束后进入"待复审"状态。

---

## 2. 改动摘要

### P0：指标口径修复

1. **chatArchiveRate 按 dockItemId 去重**：原实现直接用 `chatArchives.length / chatCaptures.length`，同一 dockItemId 被 reopen 后再次 archive 会重复计入分子，导致归档率可能超过 1。修复后按唯一 dockItemId 去重，且仅计入在 chat capture 集合中存在的 ID，结果保证 ≤ 1。
2. **retention7d 改为 D0→D7 cohort 口径**：原实现依赖 `events[0]` 原始顺序且仅检查"最近1天是否活跃"，不等于 D0→D7 留存定义。修复后先按 `_ts` 排序，以首次 capture 事件时间为 cohort 起点（D0），检查 D7 当天（cohortTs + 7d ~ cohortTs + 8d）是否有事件。
3. **新增 5 个口径测试**：覆盖重复归档去重、归档率不超过 1、乱序事件留存、D7 活跃留存、非 D7 活跃不计留存。

### P1：可复核最小统计输出入口

4. **Review 视图新增 Metrics 卡片**：展示 DAU/日均记录/Chat 归档率/7日留存/Review 打开率，数据来自 `getEventLog()` + `computeMetrics()`，实时计算。卡片底部标注口径说明。

### P1：文档一致性修正

5. **phase-2.14-metrics-acceptance.md**：更新状态为 PATCHED (2.14.1)，补充口径修复说明、Metrics UI 入口说明、测试数量更新。
6. **phase2-acceptance.md**：更新状态为"待复审"，修正指标口径说明，将验收结论从"PASS"改为"待复审（2.14.1 补丁已提交）"。

### P1：全站前端视觉统一

7. **globals.css 设计 tokens**：新增 CSS 变量（颜色、圆角、阴影、过渡时间）和可复用组件类（`.atlax-card`、`.atlax-btn-primary`、`.atlax-btn-secondary`、`.atlax-input`、`.atlax-badge`、`.atlax-page-bg`），统一设计语言。
8. **首页 `/`**：替换为 Gemini 风格，包含品牌 Logo 动画、渐变按钮、暗色模式支持。
9. **`/seed` 页面**：统一配色、圆角、阴影，使用 lucide-react 图标和 atlax 组件类。
10. **`/dock` 页面**：统一配色、圆角、阴影，使用 lucide-react 图标和 atlax 组件类。
11. **`/capture` 页面**：统一配色、圆角、阴影，使用 lucide-react 图标和 atlax 组件类。
12. **AuthGate 组件**：统一配色、圆角、阴影，添加品牌 Logo，使用 atlax 组件类。
13. **tailwind.config.ts**：添加 `darkMode: 'class'` 支持暗色模式切换。

### P1：前端页面替换（前置任务）

14. **workspace/page.tsx**：用 Gemini 设计替换原页面，对接真实 repository/auth/events 层，保留所有业务逻辑和数据流。
15. **lucide-react 依赖**：新增图标库。

---

## 3. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/lib/events.ts` | 修改 | chatArchiveRate 去重 + retention7d cohort 口径 |
| `apps/web/tests/events.test.ts` | 修改 | 新增 5 个口径测试 |
| `apps/web/app/workspace/page.tsx` | 重写 | Gemini 设计 + 真实数据层 + Metrics 卡片 |
| `apps/web/app/page.tsx` | 重写 | Gemini 风格首页 |
| `apps/web/app/seed/page.tsx` | 重写 | Gemini 风格 seed 页面 |
| `apps/web/app/dock/page.tsx` | 重写 | Gemini 风格 dock 页面 |
| `apps/web/app/capture/page.tsx` | 重写 | Gemini 风格 capture 页面 |
| `apps/web/app/workspace/_components/AuthGate.tsx` | 重写 | Gemini 风格认证页面 |
| `apps/web/app/globals.css` | 修改 | 设计 tokens + 可复用组件类 |
| `apps/web/tailwind.config.ts` | 修改 | darkMode: 'class' |
| `apps/web/package.json` | 修改 | 新增 lucide-react |
| `pnpm-lock.yaml` | 更新 | 锁文件同步 |
| `docs/engineering/dev_log/Phase2/phase-2.14-metrics-acceptance.md` | 修改 | 口径修复说明 |
| `docs/engineering/dev_log/Phase2/phase2-acceptance.md` | 修改 | 状态修正为待复审 |
| `docs/engineering/dev_log/Phase2/phase-2.14.1-metrics-ui-unification.md` | 新增 | 本开发日志 |

---

## 4. 口径说明

### chatArchiveRate

- **修复前**：`chatArchives.length / chatCaptures.length`，同一 dockItemId 被 reopen 后再次 archive 会重复计入分子
- **修复后**：按唯一 dockItemId 去重，分子 = 在 chat capture 集合中且已被 archive 的唯一 dockItemId 数，分母 = chat capture 的唯一 dockItemId 数
- **保证**：结果 ≤ 1

### retention7d

- **修复前**：依赖 `events[0]` 原始顺序，仅检查"最近1天是否活跃"
- **修复后**：先按 `_ts` 排序，以首次 capture 事件时间为 cohort 起点（D0），检查 D7 当天（cohortTs + 7d ~ cohortTs + 8d）是否有事件
- **新用户**：cohort 年龄 < 7 天 → retention7d = 1

---

## 5. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm lint` | PASS | 0 errors, 0 warnings |
| `pnpm typecheck` | PASS | 无类型错误 |
| `pnpm --dir apps/web test -- --run` | PASS | 93/93 测试通过（含 5 个新增口径测试） |

---

## 6. 风险与待办

| 风险/待办 | 说明 | 影响 |
|-----------|------|------|
| workspace/page.tsx 为单文件 all-in-one | 内联了所有子组件（Sidebar、DockCard、ModeSwitch 等），未来可拆分到 _components/ | 可维护性 |
| 旧 _components/ 中部分组件不再被引用 | 如 DockItemCard、MainPanel、DetailPanel 等 | 可清理或保留备用 |
| globals.css 中 CSS 变量未被 Tailwind 直接引用 | 当前仍使用硬编码 Tailwind 类名 | 未来可迁移到 CSS 变量驱动 |
| M2-08.1 引入功能回归 | Entries 筛选、Chat 多步引导、归档条目项目编辑在 UI 重写时丢失 | 已由 2.14.2 修复 |
