# M2-06｜Archive 与 Re-organize 闭环

| 项目 | 内容 |
|------|------|
| 模块 | M2-06 |
| 状态 | DONE |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 模块目标（DoD）

- 状态流可稳定跑通：`pending -> suggested -> archived -> reopened`
- 归档后内容可再次编辑并重新进入整理
- 关键测试覆盖到上述闭环并通过

---

## 2. 改动摘要

1. **修复 reopenItem 清空建议**：`reopenItem` 增加 `suggestions: []`，确保重新整理时从干净状态开始
2. **修复 updateArchivedEntry 标签同步**：编辑已归档条目的 tags 后，同步更新关联 DockItem 的 userTags，保证 reopen 后标签一致
3. **新增 12 个闭环测试**：覆盖全状态流转、reopen 再归档、编辑数据一致性、chat 与 text 来源行为一致

---

## 3. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/lib/repository.ts` | 修改 | reopenItem 清空 suggestions；updateArchivedEntry 同步 tags 到 DockItem |
| `apps/web/tests/archive-reopen.test.ts` | 新增 | 12 个闭环测试用例 |
| `docs/engineering/dev_log/Phase2/phase-2.12-archive-reopen.md` | 新增 | 本开发日志 |

---

## 4. 详细变更说明

### 4.1 reopenItem 清空建议

**问题**：`reopenItem` 仅设置 `status: 'reopened'` 和 `processedAt: null`，不清空 `suggestions`。导致重新整理后旧建议仍可见，用户无法获得"从零开始"的体验。

**修复**：增加 `suggestions: []`，与 `restoreItem` 行为一致。

```typescript
await dockItemsTable.update(id, {
  status: 'reopened',
  suggestions: [],  // 新增
  processedAt: null,
})
```

### 4.2 updateArchivedEntry 标签同步

**问题**：`updateArchivedEntry` 编辑 tags 后仅更新 entries 表，不同步到 dockItems 表。如果用户编辑了已归档条目的标签后发起 reopen，DockItem 的 userTags 仍是旧值。

**修复**：在 `updateArchivedEntry` 中，当 `updates.tags` 存在且 entry 有关联 `sourceDockItemId` 时，同步更新 DockItem 的 `userTags`。

```typescript
if (updates.tags !== undefined && entry.sourceDockItemId) {
  const dockItem = await getPersistedDockItem(entry.sourceDockItemId)
  if (dockItem && dockItem.userId === userId) {
    await dockItemsTable.update(entry.sourceDockItemId, {
      userTags: updates.tags,
    })
  }
}
```

### 4.3 状态机验证

状态流转完整闭环：

```
pending → suggested → archived → reopened → suggested → archived
pending → suggested → ignored → pending → suggested → archived
reopened → ignored → pending → suggested → archived
```

所有路径均通过 `canTransition` 校验，无状态机断链。

### 4.4 测试覆盖

| 测试组 | 用例数 | 覆盖内容 |
|-------|-------|---------|
| full state flow | 3 | pending→suggested→archived、suggested→ignored→pending、archived→reopened |
| reopen and re-archive | 3 | reopened→suggested→archived、reopened→ignored、reopen 清空建议 |
| edit archived entry consistency | 3 | 编辑 tags 同步、编辑 content/title 持久化、编辑 project 持久化 |
| chat and text source consistency | 3 | chat 归档流程、chat reopen 再归档、chat ignore/restore |

---

## 5. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm lint` | PASS | 无 lint 错误 |
| `pnpm typecheck` | PASS | 无类型错误 |
| `pnpm --dir apps/web test -- --run` | PASS | 79/79 测试通过 |

---

## 6. 风险与遗留问题

| 风险/遗留 | 说明 | 影响 |
|-----------|------|------|
| updateArchivedEntry 同步仅限 tags | 编辑 content/title 不同步到 DockItem.rawText | 低影响，DockItem.rawText 为原始记录，entry.content 可独立编辑 |
| reopen 后旧 entry 保留 | reopen 不删除 entries 表中的记录，下次 archive 会更新而非新建 | 设计意图：保留归档历史 |
