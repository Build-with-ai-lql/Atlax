# M2-08｜指标埋点与 Phase 2 验收收口

| 项目 | 内容 |
|------|------|
| 模块 | M2-08 |
| 状态 | PATCHED (2.14.1) |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 模块目标（DoD）

- 补齐 Phase2 P0 指标事件并可计算关键指标。
- 形成可复核的最小统计输出。
- 完成 Phase2 验收收口文档。

---

## 2. 改动摘要

1. **事件埋点补齐**：新增 4 个事件类型（capture_created、archive_completed、weekly_review_opened、browse_revisit），保留已有 mode_switched 和 chat_guided_capture_created
2. **事件触发点集成**：workspace/page.tsx 中 handleCapture、handleArchive、handleViewChange、handleSelectArchivedEntry 分别触发对应事件
3. **指标计算函数**：新增 `computeMetrics(events)` 函数，计算 DAU、每用户日均记录次数、Chat 引导后归档率、7日留存率、Weekly Review 打开率
4. **事件日志容量扩展**：从 200 条扩展到 500 条
5. **测试更新**：events.test.ts 重写为 21 个测试（8 个事件完整性 + 13 个指标计算）
6. **验收文档**：新增 phase2-acceptance.md，包含功能验收、产品验收、指标口径、事件清单、风险与交接项

### 2.14.1 补丁改动

7. **chatArchiveRate 口径修复**：改为按唯一 dockItemId 去重统计，避免同一条目 reopen 后重复归档导致归档率超过 1
8. **retention7d 口径修复**：改为 D0→D7 cohort 口径，先按 _ts 排序后以首次 capture 事件时间作为 cohort 起点，检查 D7 当天是否有事件
9. **Metrics UI 入口**：Review 视图新增"行为指标"卡片，展示 DAU/日均记录/Chat 归档率/7日留存/Review 打开率，数据来自 getEventLog + computeMetrics
10. **新增 5 个口径测试**：覆盖重复归档去重、归档率不超过 1、乱序事件留存、D7 活跃留存、非 D7 活跃不计留存

---

## 3. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/lib/events.ts` | 修改 | 新增 4 个事件类型 + SourceType + computeMetrics + 口径修复 |
| `apps/web/app/workspace/page.tsx` | 修改 | 集成事件触发点 + Review 视图 Metrics 卡片 |
| `apps/web/tests/events.test.ts` | 修改 | 重写为 21 个测试（含 5 个口径测试） |
| `docs/engineering/dev_log/Phase2/phase-2.14-metrics-acceptance.md` | 修改 | 本开发日志 |
| `docs/engineering/dev_log/Phase2/phase2-acceptance.md` | 修改 | Phase 2 验收收口文档 |

---

## 4. 详细变更说明

### 4.1 事件埋点补齐

| 事件 | 触发点 | 字段 |
|------|--------|------|
| capture_created | handleSaveEntry (Classic/Chat 输入) | sourceType, dockItemId |
| chat_guided_capture_created | handleSaveEntry (Chat 模式) | dockItemId, rawText |
| archive_completed | handleArchive (接受归档) | dockItemId, sourceType |
| mode_switched | handleModeChange (切换模式) | from, to |
| weekly_review_opened | handleViewChange (切到 Review) | (无额外字段) |
| browse_revisit | handleSelectArchivedEntry (查看归档详情) | entryId |

### 4.2 指标计算

`computeMetrics(events: PersistedEvent[]): MetricsResult`

| 指标 | 口径 | 本地实现 |
|------|------|---------|
| DAU | 当日有 capture 事件 | todayCaptures > 0 → 1 |
| 每用户日均记录次数 | 当日 capture 数 / DAU | todayCaptures / dau |
| Chat 引导后归档率 | 按**唯一 dockItemId** 去重：已归档的 chat capture 数 / chat capture 总数 | uniqueChatArchivedFromCaptures / uniqueChatCaptureIds |
| 7日留存率 | D0→D7 cohort：首次 capture 后第 7 天是否有事件 | 先排序 → firstCapture._ts 为 cohort → 检查 D7 窗口内事件 |
| Weekly Review 打开率 | 7天内 review 事件数 / 7 | reviewEvents / 7天 |

**口径修复说明（2.14.1）**：
- chatArchiveRate：原实现直接用 chatArchives.length / chatCaptures.length，同一 dockItemId 被 reopen 后再次 archive 会重复计入分子，导致归档率可能超过 1。修复后按唯一 dockItemId 去重，且仅计入在 chat capture 集合中存在的 ID。
- retention7d：原实现依赖 events[0] 原始顺序且仅检查"最近1天是否活跃"，不等于 D0→D7 留存定义。修复后先按 _ts 排序，以首次 capture 事件时间为 cohort 起点（D0），检查 D7 当天（cohortTs + 7d ~ cohortTs + 8d）是否有事件。

### 4.3 事件日志容量

从 `events.slice(-200)` 扩展到 `events.slice(-500)`，支持更长时间范围的指标计算。

### 4.4 Metrics UI 入口

Review 视图新增"行为指标"卡片，展示 5 个关键指标（DAU、日均记录、Chat 归档率、7日留存、Review 打开率），数据来自 `getEventLog()` + `computeMetrics()`，实时计算。卡片底部标注口径说明。

---

## 5. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm lint` | PASS | 无 lint 错误 |
| `pnpm typecheck` | PASS | 无类型错误 |
| `pnpm --dir apps/web test -- --run` | PASS | 93/93 测试通过（含 5 个新增口径测试） |

---

## 6. 风险与遗留问题

| 风险/遗留 | 说明 | 影响 |
|-----------|------|------|
| 指标为本地单用户口径 | DAU/留存等指标在单用户本地场景下为 0/1 二值 | Phase 3 需后端支持多用户聚合 |
| 事件日志无远端上报 | 仅存储在 localStorage | Phase 3 需接入事件上报服务 |
| ~~computeMetrics 未集成到 UI~~ | ~~当前仅作为函数导出，未在 workspace 中展示~~ | **已修复**：Review 视图新增 Metrics 卡片 |
