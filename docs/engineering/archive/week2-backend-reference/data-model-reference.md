# Week 2+ Backend Data Model Reference

> 本文档归档自 `apps/server/prisma/schema.prisma`，供后续阶段设计 Dexie schema 或其他数据模型时参考。
> 
> **注意**：这是参考文档，不是 Week 1 实现内容。Week 1 使用 IndexedDB + Dexie 本地存储。

---

## 核心数据模型

### InboxEntry（待整理条目）

```typescript
interface InboxEntry {
  id: string;                    // cuid
  rawText: string;               // 原始输入文本
  sourceType: 'text' | 'voice';  // 输入来源类型
  status: 'pending' | 'suggested' | 'archived';  // 状态流转
  createdAt: Date;               // 创建时间
  suggestedAt?: Date;            // 建议生成时间
  archivedAt?: Date;             // 归档时间
}
```

**状态流转**：
- `pending` → `suggested` → `archived`

---

### Entry（已归档条目）

```typescript
interface Entry {
  id: string;                    // cuid
  title: string;                 // 标题（从 rawText 提取）
  content: string;               // 内容（原始 rawText）
  type: EntryType;               // 类型
  status: 'active' | 'archived'; // 状态
  tags: string[];                // 标签数组
  projectId?: string;            // 关联项目 ID
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
  viewCount: number;             // 查看次数
  lastViewedAt?: Date;           // 最后查看时间
  sourceInboxId?: string;        // 来源 Inbox ID
}
```

**EntryType 枚举**：
```typescript
type EntryType = 'note' | 'meeting' | 'idea' | 'task' | 'reading';
```

---

### Project（项目）

```typescript
interface Project {
  id: string;                    // cuid
  name: string;                  // 项目名称（唯一）
  description?: string;          // 项目描述
  status: 'active' | 'paused' | 'completed';  // 状态
  lastActivityAt: Date;          // 最后活动时间
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
}
```

---

### Task（任务）

```typescript
interface Task {
  id: string;                    // cuid
  title: string;                 // 任务标题
  status: 'todo' | 'doing' | 'done';  // 状态
  projectId?: string;            // 关联项目 ID
  sourceEntryId?: string;        // 来源 Entry ID
  dueAt?: Date;                  // 截止时间
  priority?: number;             // 优先级
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
}
```

---

## 关系设计

```
InboxEntry (1) ──→ (0..1) Entry    // 归档后创建 Entry
Entry (1) ──→ (0..1) Project       // 可关联项目
Entry (1) ──→ (0..n) Task          // 可提取多个任务
Project (1) ──→ (0..n) Entry       // 项目包含多个 Entry
Project (1) ──→ (0..n) Task        // 项目包含多个 Task
```

---

## 索引建议

| 表 | 索引字段 | 用途 |
|----|----------|------|
| InboxEntry | createdAt, status | Inbox 列表查询 |
| Entry | createdAt, status, projectId, type | Database View 筛选 |
| Project | lastActivityAt, status | 项目活跃度排序 |
| Task | projectId, sourceEntryId, status | 任务列表查询 |

---

## Week 1 最小数据模型

Week 1 只需要实现：

```typescript
// Week 1 最小模型（IndexedDB + Dexie）
interface InboxEntry {
  id: string;
  rawText: string;
  sourceType: 'text' | 'voice';
  createdAt: Date;
}

// Week 1 不需要 Entry、Project、Task
// 这些是 Week 2+ 的内容
```

---

## 来源

- 原始文件：`apps/server/prisma/schema.prisma`
- 归档时间：2026-04-20
- 归档原因：Week 1 收敛，后端代码超出当前阶段