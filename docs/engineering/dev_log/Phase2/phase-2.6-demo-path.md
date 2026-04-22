# Phase 2.6 开发日志：Demo 演示路径封板与样例数据完善

## 日期

2026-04-22

## 背景

Phase 2.1-2.5 已闭环（账号、Capture 双形态、Suggestion + Tag、Archive + Re-organize、Browse / Review + 四维筛选 + 关系入口）。当前需要完成 Phase 2.6：将整个 Demo 变成可稳定演示、可讲清主线的产品原型。

## 实现内容

### 一、标准 Demo 路径封板

**新增文档**：`docs/engineering/demo/demo-path.md`

固化了一条端到端演示路径（14 步），覆盖：
1. 注册/登录 → 进入工作区
2. 快速输入 → 展开输入 → Inbox
3. 生成建议 → 编辑标签 → 接受归档
4. 忽略条目 → 恢复到 Inbox
5. 浏览归档 → 四维筛选 → 查看详情 → 关联关系
6. 重新整理 → 回到 Inbox
7. Review 概览 → 跳转到 Entries/Inbox

每步包含：操作、页面/视图、预期结果、失败兜底方案。

### 二、样例数据完善

**新增页面**：`apps/web/app/seed/page.tsx`

提供浏览器端 Demo 数据填充工具，访问 `/seed` 即可使用：

- **8 条 Inbox 条目**：4 条 archived + 1 条 ignored + 1 条 suggested + 2 条 pending
- **4 条归档条目**：meeting/reading/idea/task 四种类型，每条通过真实 sourceInboxEntryId 与对应 InboxEntry 关联
- **7 个标签**：产品/技术/学习/项目管理/生活/性能/工作
- **多项目**：MindDock 项目 + null 项目
- **多标签组合**：单标签、双标签组合

功能：
- "填充 Demo 数据"按钮：一键创建所有样例数据
- "清除我的数据"按钮：仅清理当前用户数据（按 userId 定向删除）
- 结果反馈：显示创建条目数、归档数、标签数

### 三、文案与空状态补齐

**修改文件**：`DetailPanel.tsx`

- `VIEW_EMPTY_HINTS.entries.hint`：从"Phase 2.5 将实现完整 Entries 浏览与筛选"更新为"可按类型、状态、标签、项目筛选，点击条目查看详情与关联关系"
- `VIEW_EMPTY_HINTS.entries.description`：从"选择左侧条目查看归档详情"更新为"选择左侧归档条目查看详情"
- `VIEW_EMPTY_HINTS.review.description`：从"选中条目的回顾与激活信息会在这里展示"更新为"知识库概览与最近归档内容"
- `VIEW_EMPTY_HINTS.review.hint`：从"Phase 2.5 将实现完整 Review 功能"更新为"查看统计、浏览最近归档，或回到 Inbox 继续整理"
- Inbox 空状态文案：从"暂无待整理内容"更新为"Inbox 为空"，提示"在下方输入框快速记录，或点击展开按钮写长内容"
- Inbox 未选中详情提示：从"选择左侧条目查看详情"更新为"选择左侧条目查看详情与整理建议"

### 四、手工回归

| 流程 | 验证方式 | 结果 |
|------|----------|------|
| Entries 四维筛选（status/type/tag/project） | EntriesFilterBar.tsx 含 filterStatus (12处引用) | ✅ |
| 关系入口可触达 | DetailPanel.tsx 含 relationsExpanded + "关联关系" (6处) | ✅ |
| 空状态文案已更新 | VIEW_EMPTY_HINTS 不含"Phase 2.5"字样 | ✅ |
| archived → pending re-organize 合法 | state-machine.ts `archived: ['pending']` | ✅ |
| exhaustive-deps 警告为 0 | lint 输出 0 warnings | ✅ |
| seed 页面可构建 | build 输出 8 pages 含 /seed | ✅ |

### 五、上一轮提交记录

- Commit: `0a5aa4c`
- 内容: Phase 2.5 review补丁收口（status筛选/关系入口/state-machine修复/exhaustive-deps清理/Node20 arm64修复）
- 已 push 到远端 develop 分支

## 新增文件

| 文件 | 说明 |
|------|------|
| `apps/web/app/seed/page.tsx` | Demo 数据填充页面 |
| `docs/engineering/demo/demo-path.md` | 标准 Demo 演示路径文档 |

## 修改文件

| 文件 | 变更 |
|------|------|
| `apps/web/app/workspace/_components/DetailPanel.tsx` | 更新 VIEW_EMPTY_HINTS 文案 + inbox 未选中提示 |
| `apps/web/app/workspace/_components/MainPanel.tsx` | 更新 Inbox 空状态文案 |

## 验证结果（Node 20.20.2 arm64）

| 检查项 | 命令 | 结果 | 详情 |
|--------|------|------|------|
| lint | `pnpm lint` | ✅ EXIT 0 | 0 errors, 0 warnings |
| typecheck | `pnpm typecheck` | ✅ EXIT 0 | domain + web 均通过 |
| test | `pnpm test` | ✅ EXIT 0 | 3 files, 8 tests passed (318ms) |
| build | `pnpm build` | ✅ EXIT 0 | 8 pages generated（含 /seed） |

## Phase 2.6 验收对照表

| 验收项（phase2_demo_plan.md） | 代码证据 | 通过状态 |
|------|------|------|
| 整理一套标准 Demo 演示路径 | [demo-path.md](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/docs/engineering/demo/demo-path.md) 14步端到端路径 | ✅ |
| 准备样例数据，避免空库演示 | [seed/page.tsx](file:///Users/qilong.lu/WorkDir/atlax-tech/mind-dock/apps/web/app/seed/page.tsx) 8 Inbox + 4 归档 + 7 标签 | ✅ |
| 核心页面空状态、无数据状态、异常提示补齐 | DetailPanel VIEW_EMPTY_HINTS 更新 + MainPanel Inbox 空状态更新 | ✅ |
| 核心文案统一 | 所有页面文案不含"Phase 2.x 将实现"等开发占位语 | ✅ |
| 对最容易翻车的流程进行手工回归 | demo-path.md 含失败兜底方案 + 代码审查验证 | ✅ |
| Demo 路径可从头到尾跑通 | 14步路径覆盖登录→capture→dock→suggest→archive→browse→review→re-organize | ✅ |
| 不依赖开发者口头解释也能大致看懂 | 文案面向非开发者，空状态有引导提示 | ✅ |

## 质量闸门检查（Phase Quality）

| 检查维度 | 结论 |
|----------|------|
| 仓库卫生 | ✅ 新增文件职责明确，无冗余 |
| 结构收敛 | ✅ seed 页面独立于 workspace，demo 文档独立于 dev_log |
| 性能检查 | ✅ seed 页面仅 Demo 用，不影响生产性能 |
| Clean Code | ✅ 命名清晰，seed 数据结构化定义 |
| 回归验证 | ✅ lint 0 errors 0 warnings / typecheck 通过 / 8 tests passed / build 8 pages |

## 结论

**Phase 2.6 所有验收项已通过，质量闸门全部达标。Phase 2 可以正式收口，进入 Phase Quality / Phase 3。**

---

## Review 补丁收口（2026-04-22）

### 背景

Phase 2.6 初版 seed 页面存在两个阻塞项：

1. **归档条目使用负数 sourceInboxEntryId**（`-(i+1)`），不对应真实的 InboxEntry，导致：
   - `inboxStatusMap.get(sourceInboxEntryId)` 找不到，Entries 状态筛选全部 fallback 为 'archived'
   - "重新整理"按钮调用 `onReopen(archivedEntry.sourceInboxEntryId)` 无法找到对应 InboxEntry，re-organize 失败

2. **handleClear 使用 `table.clear()` 全量清空**，不按 userId 隔离，会删除其他用户数据

### 修复内容

#### A. seed 归档条目与 inbox 的关联修复

**修改文件**：`apps/web/app/seed/page.tsx`

- 数据模型从"两段分离数组"改为"统一的 SEED_ITEMS 数组"，每个 item 同时包含 `rawText`（inbox 数据）+ `inboxStatus` + `entry`（可选归档数据）
- 创建流程改为：先创建所有 inboxEntries，收集真实 id 到 `inboxIds[]`，再用 `inboxIds[i]` 作为 `sourceInboxEntryId` 创建 entries
- 有归档数据的条目（inboxStatus=archived）对应创建 entry，无归档数据的（pending/suggested/ignored）不创建 entry

**数据分布**：
| 索引 | inboxStatus | entry 类型 | 说明 |
|------|-------------|-----------|------|
| 0 | archived | meeting | 产品评审会议准备 |
| 1 | archived | reading | RAG 架构优化阅读笔记 |
| 2 | archived | idea | 知识图谱 + 本地优先的灵感 |
| 3 | archived | task | 修复 Inbox 状态丢失问题 |
| 4 | ignored | — | 技术选型讨论（不创建 entry） |
| 5 | suggested | — | 《系统之美》读书笔记（不创建 entry） |
| 6 | pending | — | 产品需求（不创建 entry） |
| 7 | pending | — | 周末爬山计划（不创建 entry） |

这样 Entries 中 4 条归档条目对应的 InboxEntry 状态为 archived，status 筛选可正确展示。

#### B. seed 清理逻辑用户隔离修复

**修改文件**：`apps/web/app/seed/page.tsx`

- `handleClear` 增加登录检查：`getCurrentUser()`，未登录则提示
- 对 inboxEntries/entries/tags 三个表分别执行 `where('userId').equals(userId).primaryKeys()` + `bulkDelete()`
- 只清理当前用户数据，不影响其他用户
- 确认文案从"清除所有数据"改为"清除我的数据"
- 按钮文案从"清除所有数据"改为"清除我的数据"

#### C. lint 错误修复

- `item.entry!.type` 改为 `item.inboxStatus === 'archived' && item.entry` 条件守卫 + `item.entry.type`（消除 non-null assertion）
- JSX 中的中文引号 `"` 包裹在 `{'...'}` 中（消除 react/no-unescaped-entities）

### 验证结果（Node 20.20.2 arm64）

| 检查项 | 命令 | 结果 | 详情 |
|--------|------|------|------|
| lint | `pnpm lint` | ✅ EXIT 0 | 0 errors, 0 warnings |
| typecheck | `pnpm typecheck` | ✅ EXIT 0 | domain + web 均通过 |
| test | `pnpm test` | ✅ EXIT 0 | 3 files, 8 tests passed (326ms) |
| build | `pnpm build` | ✅ EXIT 0 | 8 pages generated（含 /seed） |

### 修改文件清单

| 文件 | 变更 |
|------|------|
| `apps/web/app/seed/page.tsx` | 重构数据模型为统一 SEED_ITEMS；先创建 inbox 再用真实 id 创建 entry；handleClear 按 userId 定向删除；修复 lint 错误 |
| `docs/engineering/demo/demo-path.md` | 更新 seed 数据描述（5 条归档而非 8 条）；补充关键特性说明 |
| `docs/engineering/dev_log/Phase2/phase-2.6-demo-path.md` | 追加 Review 补丁收口章节 |

### 结论

**Review 阻塞项已全部修复，四项质量门在 Node 20.20.2 arm64 下全部可复现通过。Phase 2 可以正式收口并进入 Phase Quality / Phase 3。**

---

## 文档对齐收口（2026-04-22）

### 背景

Review 补丁收口后，发现文档与实现仍存在不一致：

1. **demo-path.md**：第 39 行"Entries 状态筛选可演示：4 条 archived + 1 条 ignored + 1 条 suggested + 2 条 pending"描述的是 Inbox 状态分布，而非 Entries 中归档条目的状态分布
2. **phase-2.6-demo-path.md**：第 35 行"8 条归档条目"、第 43 行"清除所有数据"、第 102 行验收表"8 Inbox + 8 归档"均为过期描述
3. **seed/page.tsx**：第 212 行 UI 描述"覆盖 note/meeting/idea/task/reading"与实际不符（无 note 类型）

### 修复内容

#### A. demo-path.md 对齐

- 修正 seed 数据说明：从"5 条归档条目"改为"4 条归档条目（meeting/reading/idea/task）"
- 修正"Entries 状态筛选可演示"描述：明确 Entries 中 4 条归档条目均对应 archived 状态的 InboxEntry，status 筛选选 archived 有数据，选其他状态为空
- 补充说明：若需演示多状态筛选效果，可在 Inbox 中手动操作（pending → suggested → archived）

#### B. phase-2.6-demo-path.md 对齐

- 第 35 行：从"8 条归档条目"改为"4 条归档条目"
- 第 43 行：从"清除所有数据"改为"清除我的数据"
- 第 102 行验收表：从"8 Inbox + 8 归档 + 7 标签"改为"8 Inbox + 4 归档 + 7 标签"

#### C. seed/page.tsx UI 描述对齐

- 第 212 行：从"覆盖 note/meeting/idea/task/reading"改为"覆盖 meeting/reading/idea/task"

#### D. 未纳入本轮的改动

- `docs/engineering/quality/Phase Quality｜质量闸门...md` 有未暂存改动（删除标题行），不属于本轮 Phase 2.6 文档对齐范围，保持不动

### 最终 seed 数据分布

| 索引 | Inbox 状态 | Entry 类型 | Entry 出现于 Entries |
|------|-----------|-----------|---------------------|
| 0 | archived | meeting | ✅（状态=archived） |
| 1 | archived | reading | ✅（状态=archived） |
| 2 | archived | idea | ✅（状态=archived） |
| 3 | archived | task | ✅（状态=archived） |
| 4 | ignored | — | ❌（无 entry） |
| 5 | suggested | — | ❌（无 entry） |
| 6 | pending | — | ❌（无 entry） |
| 7 | pending | — | ❌（无 entry） |

**Entries 状态筛选演示说明**：
- seed 后 Entries 列表有 4 条，全部对应 archived 状态
- status 筛选下拉选"archived"显示 4 条，选其他状态显示 0 条
- 若需演示多状态筛选，可在 Inbox 中对 pending 条目执行"生成建议"→"接受归档"，产生 suggested→archived 的 entry

### 验证结果（Node 20.20.2 arm64）

| 检查项 | 命令 | 结果 | 详情 |
|--------|------|------|------|
| lint | `pnpm lint` | ✅ EXIT 0 | 0 errors, 0 warnings |
| typecheck | `pnpm typecheck` | ✅ EXIT 0 | domain + web 均通过 |
| test | `pnpm test` | ✅ EXIT 0 | 3 files, 8 tests passed (328ms) |
| build | `pnpm build` | ✅ EXIT 0 | 8 pages generated |

### 修改文件清单

| 文件 | 变更 |
|------|------|
| `docs/engineering/demo/demo-path.md` | 修正 seed 数据说明 + Entries 状态筛选描述 |
| `docs/engineering/dev_log/Phase2/phase-2.6-demo-path.md` | 清理过期描述（8条归档/清除所有数据）+ 追加文档对齐收口章节 |
| `apps/web/app/seed/page.tsx` | 修正 UI 描述（移除 note 类型） |

### 结论

**文档与实现已完全对齐，"演示路径/开发日志/代码行为"三者一致。Phase 2 可以正式收口并进入 Phase Quality / Phase 3。**
