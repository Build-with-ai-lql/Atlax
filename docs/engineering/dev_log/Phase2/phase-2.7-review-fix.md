# Phase 2 Review - 终审整改开发日志

## Phase 2.7: 命名统一与质量门 (2026-04-22)

### 变更概述
- **术语收敛**：全量替换 Inbox -> Dock（路由、类型、函数、变量、UI文案）
- **路由迁移**：`/inbox` -> `/dock`，文件重命名
- **组件命名**：InboxEntryCard -> DockItemCard, InboxListItem -> DockListItem
- **质量门**：pnpm lint/typecheck/test/build 全部通过
- **术语检查**：新增 `pnpm check:terminology` 脚本，CI 阻断 Inbox 残留

---

## Phase 2.8: 数据迁移安全与模型对齐 (2026-04-22)

### 变更概述
- **SourceType**：新增 `import` 类型
- **EntryStatus**：新增 `reopened` 状态
- **状态机**：`archived -> reopened -> suggested/ignored`
- **db.ts**：新增 v8 版本（导出 `runV8Upgrade` 函数供测试复用）
- **repository**：reopenItem 返回 reopened 状态，stats 增加 reopenedCount

### 数据库版本历史（db.ts v1-v8）
| 版本 | 变更 |
|------|------|
| v1 | dockItems 表（id, rawText, sourceType, createdAt） |
| v2 | dockItems 增加 status 索引，upgrade 填充 status/suggestions/processedAt |
| v3 | 新增 tags 表，dockItems 增加 userTags |
| v4 | 新增 entries 表 |
| v5 | 三表增加 userId 索引，upgrade 填充 `_legacy` |
| v6 | tags 增加 `[userId+name]` 复合索引 |
| v7 | 清理残留 inboxEntries 表引用（无 schema 变更） |
| v8 | 兜底 upgrade：userId/sourceType/status/suggestions/userTags 回填，导出 runV8Upgrade |

### 字段映射
| 概念 | 旧名 | 新名 |
|------|------|------|
| 表 | inboxEntries | dockItems |
| 类型 | InboxEntry | DockItem |
| 外键 | sourceInboxEntryId | sourceDockItemId |
| 状态 | - | reopened (新增) |
| 来源类型 | - | import (新增) |

---

## Phase 2.9: 补充修复 - Review 阻塞项 (2026-04-22)

### 问题来源
Review 发现以下阻塞项：

1. **DockItemCard 缺少 reopened 状态**：独立 dock 页面未配置 reopened 状态
2. **repository 测试 stats 断言错误**：getWorkspaceStats 中 suggestedCount 与实际数据不符
3. **migration 测试非真实升级路径**：只测当前 schema 读写，未模拟旧版本升级

---

## Phase 2.9.2: 迁移验证收口 + 日志一致性修正 (2026-04-22)

### 问题来源
1. migration.test.ts 复制了 upgrade 逻辑（双份漂移风险）
2. 开发日志版本号描述与实际不一致
3. 测试统计数字与实际不符

### 修复内容

#### 1. migration.test.ts 绑定生产迁移实现
- 文件：`apps/web/tests/migration.test.ts`
- 从 `@/lib/db` 导入 `runV8Upgrade` 函数（生产实现），不再复制逻辑
- 固定数据库名 `AtlaxDB_MigrationTest`，每个 describe 结束后 close + delete
- 测试路径：v1（v7 schema 写入）→ v2（调用 runV8Upgrade 升级）→ 断言
- 10 个用例，覆盖全部兜底场景

#### 2. db.ts 导出 runV8Upgrade
- 文件：`apps/web/lib/db.ts`
- 将 v8 upgrade 回调提取为独立函数 `runV8Upgrade`
- 保持 v8 version 定义不变：`.upgrade(runV8Upgrade)`
- 常量 `FALLBACK_USER_ID` 在 db.ts 定义，升级函数直接使用

#### 3. 开发日志修正
- 文件：`docs/engineering/dev_log/Phase2/phase-2.7-review-fix.md`
- 新增 Phase 2.9.2 小节
- 版本号与实际一致（v1-v8）
- 数据库命名与测试一致（`AtlaxDB_MigrationTest`）
- 测试统计以实际运行为准

### 质量门（Node v20.20.2）
- pnpm lint: ✅ PASS
- pnpm typecheck: ✅ PASS
- pnpm test: ✅ PASS
- pnpm check:terminology: ✅ PASS
- pnpm build: ✅ PASS

---

## Phase 2.9.4: 修复 migration tags 用例 + 日志对齐 (2026-04-22)

### 问题来源
Phase 2.9.2 完成后，tags fallback 测试失败：
- 错误：`DataError: Data provided to an operation does not meet requirements.`
- 根因：tags 表 schema 为 `id, name`，主键 `id` 非自增，必须显式提供
- 原测试未提供 `id`，导致 IndexedDB 报错

### 修复内容

#### 1. migration.test.ts tags fallback 用例修复
- 文件：`apps/web/tests/migration.test.ts`
- 修改：显式提供合法 `id`（`'legacy-tag-id'`），只让 `userId` 缺失
- 测试目标不变：升级后 `userId` 被回填为 `_legacy`
- 继续使用 `@/lib/db` 导出的 `runV8Upgrade`（无逻辑复制）

#### 2. 开发日志对齐
- 文件：`docs/engineering/dev_log/Phase2/phase-2.7-review-fix.md`
- 新增 Phase 2.9.4 小节，记录失败根因与修复结果
- 质量门结果与本轮真实复验一致

### 质量门（Node v20.20.2）
- pnpm lint: ✅ PASS
- pnpm typecheck: ✅ PASS
- pnpm test: ✅ PASS（domain 38 + web 39 = 77 tests）
- pnpm check:terminology: ✅ PASS
- pnpm build: ✅ PASS
