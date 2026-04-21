# Phase 2.5 开发日志：Browse / Review 最小可用版本

## 日期

2026-04-21

## 背景

Phase 2.1-2.4 已基本闭环（账号、Capture 双形态、Suggestion + Tag、Archive + Re-organize）。当前缺口集中在新版 2.5：

- Browse / Entries 仍只有基础列表，没有筛选
- Review 仍是空壳占位页
- "回看 + 再次整理"的产品表达还不够成立

本轮目标：**补齐 Phase 2.5 最小可用版本**。

## 实现内容

### 一、Browse / Entries 基础筛选

**新增组件**：`EntriesFilterBar.tsx`

- 在 Entries 视图顶部增加筛选栏
- 支持三个维度筛选：
  - **type**：按 Entry.type 过滤（note / meeting / idea / task / reading）
  - **tag**：按 Entry.tags 包含过滤
  - **project**：按 Entry.project 过滤
- 下拉选择器形式，支持"清除筛选"
- 筛选结果实时作用于列表展示
- 列表顶部显示筛选后数量 / 总数

**repository 新增**：

- `listArchivedEntriesByType(userId, type)` — Dexie 按 userId + type 过滤
- `listArchivedEntriesByTag(userId, tag)` — Dexie 按 userId + tags 包含过滤
- `listArchivedEntriesByProject(userId, project)` — Dexie 按 userId + project 过滤
- `getWorkspaceStats(userId)` — 返回用户 workspace 统计（Entry 总数、各状态 Inbox 数、Tag 数）

**筛选数据流**：

```
archivedEntries（全量）
  → filterType ? type match : pass
  → filterTag ? tags include : pass
  → filterProject ? project match : pass
  → filtered（展示）
```

筛选在内存中完成（前端数据量可控），不额外查询数据库。

### 二、Review 最小可用版本

**新增组件**：`ReviewPanel.tsx`

替换原来的 EmptyState 占位页，提供：

1. **统计卡片**（3 张）：
   - 已归档条目数（totalEntries）
   - 待整理数（pending + suggested）
   - 标签数（tagCount）

2. **最近归档列表**：
   - 展示最近 5 条归档 Entry
   - 显示标题、type、tags
   - 点击后进入 Entries DetailPanel（可继续"重新整理"）

3. **快速回到 Inbox**：
   - "去 Inbox 整理 →" 按钮
   - 点击后切换到 Inbox 视图

### 三、再次整理入口

| 位置 | 入口 | 行为 |
|------|------|------|
| Entries DetailPanel | "重新整理"按钮 | 已存在，archived → pending，回到 Inbox |
| Review 最近归档列表 | 点击条目 | 进入 Entries DetailPanel，再点"重新整理" |
| Review 顶部 | "去 Inbox 整理 →" | 直接切换到 Inbox 视图 |

### 四、用户隔离保持

- 所有 Browse / Review 数据继续按 `userId` 隔离
- `getWorkspaceStats(userId)` 按 userId 统计
- `listArchivedEntries*` 系列函数按 userId 过滤
- Review 中的最近归档列表来自 `archivedEntries.slice(0, 5)`，已按 userId 隔离

## 新增文件

| 文件 | 说明 |
|------|------|
| `apps/web/app/workspace/_components/EntriesFilterBar.tsx` | Entries 筛选栏（type/tag/project） |
| `apps/web/app/workspace/_components/ReviewPanel.tsx` | Review 最小版（统计+最近归档+入口） |

## 修改文件

| 文件 | 变更 |
|------|------|
| `apps/web/lib/repository.ts` | 新增 `listArchivedEntriesByType/Tag/Project` + `getWorkspaceStats` |
| `apps/web/app/workspace/_components/MainPanel.tsx` | 整合 EntriesFilterBar + ReviewPanel；筛选逻辑；Review 数据传递 |
| `apps/web/app/workspace/page.tsx` | 新增筛选状态 + reviewStats 状态；所有数据加载包含 stats |

## 验收标准检查

| 标准 | 状态 |
|------|------|
| 用户可以在 Browse / Entries 中重新找到已归档内容 | ✅ Entries 列表 + 筛选 |
| 至少支持按 type / tag / project 中的基础维度查看 | ✅ 三个维度都有下拉筛选 |
| Review 不再是空壳，至少有最小统计或回看内容 | ✅ 统计卡片 + 最近归档列表 |
| 从 Browse / Review 可以再次进入整理流程 | ✅ DetailPanel "重新整理" + Review 最近归档点击 |
| 数据展示与实际归档结果一致 | ✅ 直接读取 entriesTable |
| 不破坏现有 2.1 / 2.2 / 2.3 / 2.4 成果 | ✅ 未修改核心流程 |

## 仍然没有做的内容

| 未做项 | 原因 |
|--------|------|
| 复杂筛选组合器（AND/OR） | 超出 Phase 2.5 最小可用范围 |
| 搜索功能 | Phase 4 范围 |
| 排序切换（时间/名称/类型） | Phase 3 范围 |
| 高级 Review Insight | Phase 4 范围 |
| 图谱/关系可视化 | Phase 4 范围 |
| 批量操作 | Phase 3 范围 |

## 验证结果

| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors, 3 warnings（react-hooks/exhaustive-deps） |
| `pnpm typecheck` | ✅ 通过 |
| `pnpm build` | ✅ 7 pages generated，无错误 |

warnings 来源：
- `apps/web/app/inbox/page.tsx:26` — useEffect missing dep `loadEntries`
- `apps/web/app/inbox/page.tsx:82` — useCallback missing dep `refreshList`
- `apps/web/app/workspace/page.tsx:67` — useEffect missing dep `loadEntries`

---

## Repository 写路径用户隔离补丁（2026-04-21）

### 背景

读路径已按 userId 隔离，但 repository 的核心写操作仍用裸 `id` 直接读写 InboxEntry，没有验证记录是否属于当前用户。这会导致 workspace 隔离不完整。

### 修复

#### 新增 ownership 校验 helper

`getInboxEntryForUser(userId, id)` — 读取 InboxEntry 并校验 `entry.userId === userId`，不属于当前用户则返回 null。

#### 所有 mutating 函数增加 userId 参数 + ownership check

| 函数 | 修复前签名 | 修复后签名 | ownership check |
|------|-----------|-----------|----------------|
| `suggestEntry` | `(id)` | `(userId, id)` | `getInboxEntryForUser(userId, id)` |
| `ignoreEntry` | `(id)` | `(userId, id)` | `getInboxEntryForUser(userId, id)` |
| `restoreEntry` | `(id)` | `(userId, id)` | `getInboxEntryForUser(userId, id)` |
| `reopenEntry` | `(id)` | `(userId, id)` | `getInboxEntryForUser(userId, id)` |
| `archiveEntry` | `(userId, id)` | `(userId, id)` | 改为 `getInboxEntryForUser`（原用 `getPersistedInboxEntry`） |
| `updateEntryTags` | `(id, userTags)` | `(userId, id, userTags)` | `getInboxEntryForUser(userId, id)` |
| `addTagToEntry` | `(id, tagName)` | `(userId, id, tagName)` | `getInboxEntryForUser(userId, id)` |
| `removeTagFromEntry` | `(id, tagName)` | `(userId, id, tagName)` | `getInboxEntryForUser(userId, id)` |

#### archive 如何避免跨用户读取 source InboxEntry

修复前：`archiveEntry(userId, id)` 用 `getPersistedInboxEntry(id)` 全局读取 source InboxEntry。

修复后：改用 `getInboxEntryForUser(userId, id)`，如果 source InboxEntry 不属于当前用户，直接返回 null，不会生成/更新 Entry。

#### 调用点更新

| 文件 | 更新内容 |
|------|---------|
| `apps/web/app/workspace/page.tsx` | `suggestEntry(userId, id)` / `ignoreEntry(userId, id)` / `restoreEntry(userId, id)` / `reopenEntry(userId, inboxEntryId)` / `addTagToEntry(userId, id, tagName)` / `removeTagFromEntry(userId, id, tagName)` |
| `apps/web/app/inbox/page.tsx` | `suggestEntry(getUserId(), id)` / `ignoreEntry(getUserId(), id)` / `restoreEntry(getUserId(), id)` |

### 修改文件清单

| 文件 | 变更 |
|------|------|
| `apps/web/lib/repository.ts` | 新增 `getInboxEntryForUser`；所有 mutating 函数增加 userId 参数 + ownership check |
| `apps/web/app/workspace/page.tsx` | 所有 repository 写操作调用传入 userId |
| `apps/web/app/inbox/page.tsx` | 所有 repository 写操作调用传入 getUserId() |
