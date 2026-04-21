# Phase 2.1 开发日志：Suggestion 数据模型与状态流落地

日期: 2026-04-20

## 1. 新增类型定义摘要

所有类型集中在 `apps/web/lib/types.ts`：

| 类型 | 说明 |
|------|------|
| `SourceType` | `'text' \| 'voice'` — 输入来源 |
| `EntryStatus` | `'pending' \| 'suggested' \| 'archived' \| 'ignored'` — 条目生命周期状态 |
| `SuggestionType` | `'category' \| 'action' \| 'project'` — 建议类型分类 |
| `SuggestionItem` | 单条建议 `{ id, type, label, confidence }` |
| `SuggestionResult` | 引擎输出 `{ entryId: number, suggestions[], generatedAt, engineVersion }` |
| `ArchiveIntent` | 归档意图 `{ entryId: number, selectedSuggestions[], archivedAt }` |

### InboxEntry 扩展字段

```
InboxEntry {
  id?: number            // Dexie ++id 自增主键，类型为 number
  rawText: string        // 原有
  sourceType: SourceType // 原有（类型来源改为 types.ts）
  status: EntryStatus    // 新增，默认 'pending'
  suggestions: SuggestionItem[]  // 新增，内联存储
  processedAt: Date | null       // 新增，最后处理时间
  createdAt: Date        // 原有
}
```

**注意**：`id` 为 `number` 类型，与 Dexie `++id` 自增主键运行时类型一致。Repository 层所有 id 参数均为 `number`。

## 2. 状态流转图（文字版）

```
                    ┌──────────────────────────────────┐
                    │          Capture 创建             │
                    └────────────┬─────────────────────┘
                                 │
                                 ▼
                          ┌─────────────┐
                 ┌───────│   pending    │◄────── restore ──────┐
                 │       └──────┬──────┘                       │
                 │              │                              │
                 │              ▼                              │
                 │       ┌─────────────┐                      │
                 │       │  suggested  │                      │
                 │       └──┬──────┬──┘                      │
                 │          │      │                          │
                 │          ▼      ▼                          │
                 │   ┌─────────┐ ┌─────────┐                 │
                 │   │ archived│ │ ignored  │─────────────────┘
                 │   └────┬────┘ └────┬────┘
                 │        │           │
                 │        │           │ restore
                 │        │           │
                 ▼        ▼           ▼
               (终态)   (可恢复)   (可恢复)

合法转换：
  pending   → suggested, ignored
  suggested → archived, ignored
  archived  → (终态，不可恢复)
  ignored   → pending (通过 restoreEntry)
```

**关键点**：
- `archived` 是唯一终态，代表条目已完成处理流程
- `ignored` 可通过 `restoreEntry()` 恢复到 `pending`，重新进入处理流程

## 3. Mock 引擎确定性设计

当前 mock 引擎 (`suggestion-engine.ts`) 采用**确定性输出**：

### Suggestion ID 格式

```
${entryId}:${type}:${label}
```

示例：`1:category:工作`、`1:action:待解答`

**特点**：
- 同一条 `InboxEntry` 多次调用 `generateSuggestions()`，生成的 suggestion id 完全相同
- 便于 UI 做建议对比、快照测试、选中项追踪

### Confidence 固定值

| 类别 | Confidence |
|------|------------|
| 工作 | 0.85 |
| 学习 | 0.85 |
| 生活 | 0.80 |
| 灵感 | 0.75 |
| 未分类 | 0.30 |
| 待解答 | 0.80 |
| 加入日程 | 0.75 |
| 需要拆分 | 0.60 |

**无随机数**：所有 confidence 为固定常量，不依赖 `Math.random()`。

## 4. 涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/lib/types.ts` | 新建 | 集中类型定义，entryId 为 number |
| `apps/web/lib/db.ts` | 修改 | InboxEntry.id 改为 number + Dexie v2 schema 升级 |
| `apps/web/lib/suggestion-engine.ts` | 新建 | 确定性 mock 建议引擎 |
| `apps/web/lib/repository.ts` | 修改 | 所有 id 参数改为 number + 状态机守卫 |

## 5. 下一阶段对规则引擎的接口假设

当前 `suggestion-engine.ts` 导出核心函数签名：

```typescript
function generateSuggestions(entry: InboxEntry): SuggestionResult
```

后续规则引擎 V1 替换 mock 时，应遵循以下接口契约：

1. **输入**：`InboxEntry`（只读，不修改原始数据）
2. **输出**：`SuggestionResult`，包含 `SuggestionItem[]`
3. **确定性要求**：同一条输入必须产生相同输出（id、confidence 均稳定）
4. **SuggestionItem.confidence**：0~1 浮点数，后续 UI 可用阈值过滤
5. **SuggestionType 扩展**：`'category' | 'action' | 'project'` 可通过 union 扩展新类型
6. **engineVersion**：用于追踪引擎版本，后续可做 A/B 对比

### 规则引擎替换路径

```
当前: suggestion-engine.ts (mock, 确定性关键词匹配)
  ↓
Phase 2.2: 引入 RuleEngine 类，支持可配置规则列表
  ↓
Phase 2.3: 规则持久化到 Dexie，用户可自定义规则
  ↓
远期: 接入 LLM 做智能建议（保持相同接口，需处理 LLM 非确定性）
```

### Repository 层为规则引擎预留的操作

- `createInboxEntry()` → 返回 `number`（主键）
- `suggestEntry(id: number)` — 触发建议流程
- `archiveEntry(id: number, selectedSuggestions?)` — 带选择的归档
- `ignoreEntry(id: number)` — 标记忽略
- `restoreEntry(id: number)` — ignored → pending 恢复
- `listEntriesByStatus(status)` — 按状态过滤查询

## 6. 风险与注意事项

- **Dexie v1→v2 迁移**：已有 v1 数据会被自动迁移，`status` 默认设为 `'pending'`，`suggestions` 默认空数组
- **主键类型一致性**：`InboxEntry.id`、Repository 参数/返回值均为 `number`，与 Dexie `++id` 运行时类型一致
- **不建议删除浏览器 IndexedDB**：升级过程是增量的，如遇问题可在 DevTools → Application → IndexedDB 中手动删除 `AtlaxDB`
- **状态机是硬编码的**：`VALID_TRANSITIONS` 表在 repository 中，后续如需动态状态需重构
- **suggestions 内联存储**：当前为简化方案直接存在 InboxEntry 中，如 suggestion 数量大可考虑独立表
- **确定性约束**：后续规则引擎或 LLM 接入时，需保证输出稳定性，否则 UI 对比/测试会失效