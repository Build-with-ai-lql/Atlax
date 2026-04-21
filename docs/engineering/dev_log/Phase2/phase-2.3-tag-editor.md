# Phase 2.3 开发日志：Suggestion + Tag 双轨整理机制

日期: 2026-04-21

## 本阶段目标

1. 在 workspace 的 DetailPanel 中引入 Tag 正式交互入口
2. 用户可以查看系统建议的 tags、手动添加/删除/创建 tag
3. 系统建议保留 deterministic rules，不接 LLM
4. 用户显式选择优先于系统建议
5. 为后续 2.4 的 archive→Entry 正式入库保留清晰数据结构

## 约束与边界

| 约束 | 处理方式 |
|------|----------|
| 不接 LLM | 未引入任何 AI / LLM 依赖 |
| 不引入后端 | 所有数据流走前端 IndexedDB (Dexie) |
| 不实现完整 Entry 正式归档 | 仅保留 userTags 字段，Phase 2.4 实现 Entry |
| 不实现完整 Review | 未涉及 |
| 不破坏 domain platform-agnostic | tag-service.ts 纯逻辑，无 Dexie/浏览器依赖 |
| Dexie 留在 apps/web | db.ts / repository.ts 保持位置不变 |
| 不混在一起 | domain 纯逻辑 / repository 数据层 / UI 组件三层分离 |

## 已完成变更

### 新增文件（2 个）

| 文件 | 说明 |
|------|------|
| `packages/domain/src/tag-service.ts` | Tag 纯逻辑：normalization、dedupe、resolve、createTag |
| `apps/web/app/workspace/_components/TagEditor.tsx` | Tag 编辑组件：建议/用户 tag 区分展示、添加/删除/创建 |

### 修改文件（6 个）

| 文件 | 变更 |
|------|------|
| `packages/domain/src/types.ts` | 新增 `Tag`、`ResolvedTags` 类型定义 |
| `packages/domain/src/index.ts` | 导出 tag-service |
| `apps/web/lib/db.ts` | 新增 `tags` 表 + `InboxEntryRecord.userTags` 字段 + Dexie v3 migration |
| `apps/web/lib/repository.ts` | 新增 Tag CRUD（listTags、createStoredTag、getOrCreateTag）+ Entry Tag 操作（updateEntryTags、addTagToEntry、removeTagFromEntry） |
| `apps/web/lib/types.ts` | 导出 `Tag`、`ResolvedTags` 类型 |
| `apps/web/app/workspace/_components/DetailPanel.tsx` | 集成 TagEditor，将"系统建议"区块改为"整理区"，展示分类 + TagEditor + 动作 + 项目 |
| `apps/web/app/workspace/page.tsx` | 新增 handleAddTag / handleRemoveTag，串联 Tag 数据流 |

## Tag 数据建模

### Domain 层类型

```typescript
interface Tag {
  id: string        // 基于 name 的确定性 hash
  name: string      // normalized tag name
  createdAt: Date
}

interface ResolvedTags {
  suggested: string[]      // 系统建议的 tag 名称列表
  userSelected: string[]   // 用户手动选择的 tag 名称列表
  final: string[]          // 最终合并结果（用户优先）
}
```

### 存储层结构

```typescript
// Dexie tags 表
interface TagRecord {
  id?: string
  name: string
  createdAt: Date
}

// InboxEntry 新增字段
interface InboxEntryRecord {
  // ...原有字段
  userTags: string[]    // 用户手动选择的 tag 名称列表
}
```

### Tag ID 生成策略

```typescript
function makeTagId(name: string): string {
  const normalized = normalizeTagName(name)
  const lower = normalized.toLowerCase()
  // 基于 lowercase name 的确定性 hash
  let hash = 0
  for (let i = 0; i < lower.length; i++) {
    const chr = lower.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return `tag:${Math.abs(hash).toString(36)}`
}
```

**特点**：
- 同名 tag 生成相同 ID，避免重复创建
- 不依赖随机数，确定性生成
- ID 格式 `tag:xxx`，便于识别

## "用户选择优先于系统建议"实现

### resolveTags 函数

```typescript
function resolveTags(
  suggestedTagNames: string[],
  userSelectedTags: string[],
): ResolvedTags {
  // 1. 用户选择的 tag 构建 lowercase Set
  const userSet = new Set(userSelectedTags.map((t) => t.toLowerCase()))
  
  // 2. 过滤掉已被用户覆盖的建议 tag
  const filteredSuggestions = suggestedTagNames.filter(
    (t) => !userSet.has(t.toLowerCase())
  )
  
  // 3. 合并：用户选择在前，未被覆盖的建议在后
  const finalTags = dedupeTagNames([...userSelectedTags, ...filteredSuggestions])
  
  return {
    suggested: suggestedTagNames,
    userSelected: userSelectedTags,
    final: finalTags,
  }
}
```

### UI 视觉区分

| Tag 类型 | 样式 | 交互 |
|----------|------|------|
| 用户选择的 tag | 绿色背景 `bg-green-100` | 显示 × 按钮，可删除 |
| 系统建议的 tag | 蓝色背景 + "建议" 标识 + "+" 按钮 | 点击 "+" 接受建议 |
| 最终 tag（归档用） | 底部展示区，绿色=用户、蓝色=建议 | 无交互，仅展示 |

### 交互流程

```
用户点击建议 tag 的 "+" 按钮
  → onAddTag(tagName)
  → createStoredTag(tagName)  // 确保 tag 存在于 tags 表
  → addTagToEntry(entryId, tagName)  // 更新 entry.userTags
  → UI 更新：tag 从"建议区"移到"用户选择区"
```

## 为 Phase 2.4 预留的内容

| 预留项 | 说明 |
|--------|------|
| `entry.userTags` 字段 | archive 时可直接消费，写入 Entry.tags |
| `tags` 表 | 后续 Entry 可关联 Tag 实体 |
| `ResolvedTags.final` | archive 时作为最终 tag 列表 |
| `createStoredTag` | archive 流程可复用，确保 tag 存在 |
| DetailPanel "整理区" 结构 | 后续可扩展为完整归档表单 |

## 还没有做的内容

| 未做项 | 原因 |
|--------|------|
| Entry 正式模型 | Phase 2.4 范围 |
| archive → Entry 创建 | Phase 2.4 范围 |
| Tag 层级/同义词 | 超出当前范围 |
| Tag 统计/使用次数 | 超出当前范围 |
| Tag 批量操作 | 超出当前范围 |
| Tag 搜索/过滤 | Phase 3 范围 |

## 验证结果

| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors, 0 warnings |
| `pnpm typecheck` | ✅ 通过 |
| Dexie v3 migration | ✅ userTags 默认空数组 |
| Tag 创建 | ✅ 确定性 ID，同名不重复 |
| Tag 添加到 entry | ✅ userTags 更新 |
| Tag 从 entry 删除 | ✅ userTags 更新 |
| 建议 tag 接受 | ✅ 移入 userTags |
| 用户选择优先 | ✅ resolveTags 正确合并 |
| UI 视觉区分 | ✅ 绿色=用户、蓝色=建议 |

> **环境注**：本机 Node v24.14.0，项目声明 20.x，产生 engine warning，不影响代码正确性。

## 验收标准对照

| 验收标准 | 状态 |
|----------|------|
| 至少 5 类典型输入仍能产生稳定建议 | ✅ suggestion-engine 未改动 |
| 用户能看到 tag 建议 | ✅ TagEditor 展示建议区 |
| 用户能手动补 tag / 改 tag / 删 tag | ✅ 添加/删除功能完整 |
| 用户显式选择优先于系统建议 | ✅ resolveTags 实现 |
| UI 不需要依赖文档解释也能看懂 | ✅ "建议"标识 + "+" 按钮 + 绿色/蓝色区分 |
| 不破坏现有 workspace 主工作台体验 | ✅ DetailPanel 结构保持，新增整理区 |

---

## 补丁收口（2026-04-21）

初版 Tag 双轨机制合入后 review 发现 3 个问题，已修复。

### 修复 1：restore 流程不应清空 userTags

**问题**：`restoreEntry()` 当前会把 `userTags` 清空，导致用户已经做出的显式 tag 选择在 ignore → restore 后丢失。

**修复**：
- `restoreEntry()` 只清空 `suggestions`，保留 `userTags`
- 明确区分：`suggestions` 是系统生成的建议（restore 时应清空），`userTags` 是用户显式选择（restore 时应保留）

**数据保留/清空规则**：

| 数据 | restore 时处理 | 原因 |
|------|----------------|------|
| `suggestions` | 清空 | 系统建议，restore 后需重新生成 |
| `userTags` | 保留 | 用户显式选择，不应丢失 |
| `status` | → pending | 状态流转 |
| `processedAt` | → null | 处理时间清空 |

### 修复 2：实现 Tag 选择器

**问题**：只支持接受建议 tag 和手动输入新 tag，没有"从已有 tag 中选择"的交互。

**修复**：
- TagEditor 新增 `existingTags` prop，接收已有 tag 列表
- 输入框 focus 时显示下拉选择器，展示已有 tags（过滤掉已选中的）
- 输入时实时过滤匹配的已有 tags
- 点击已有 tag 直接选择，无需手打
- page.tsx 新增 `existingTags` state，`loadEntries` / `refreshList` 同时加载 tags
- DetailPanel 传入 `existingTags` 给 TagEditor

**Tag 选择器交互**：
- 输入框 focus → 显示下拉列表（最多 8 个）
- 输入文字 → 实时过滤匹配的已有 tags
- 点击已有 tag → 直接添加到 userTags
- 支持手打新 tag（原有功能保留）

### 修复 3：repository 层保证 userTags normalize + dedupe

**问题**：`addTagToEntry()` 直接 append，未做 normalize / dedupe，UI 去重不够，persistence boundary 仍允许重复。

**修复**：
- `addTagToEntry()` 调用 `normalizeTagName()` + `dedupeTagNames()`
- `removeTagFromEntry()` 用 normalized lowercase 比较删除
- 保证：大小写/空格差异不会造成重复，userTags 保持干净一致

**normalize + dedupe 层级**：

| 层级 | 职责 |
|------|------|
| domain/tag-service.ts | 提供 `normalizeTagName`、`dedupeTagNames` 纯函数 |
| repository.ts | 调用 domain 函数，保证写入数据干净 |
| TagEditor.tsx | UI 层额外去重（用户体验），不依赖 UI 去重 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `apps/web/lib/repository.ts` | restoreEntry 保留 userTags；addTagToEntry / removeTagFromEntry 使用 normalize + dedupe |
| `apps/web/app/workspace/_components/TagEditor.tsx` | 新增 existingTags prop + 下拉选择器 |
| `apps/web/app/workspace/_components/DetailPanel.tsx` | 新增 existingTags prop，传给 TagEditor |
| `apps/web/app/workspace/page.tsx` | 新增 existingTags state + 加载逻辑 |

### 验证结果

| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors, 0 warnings |
| `pnpm typecheck` | ✅ 通过 |
| restore 保留 userTags | ✅ ignore → restore 后 userTags 不丢失 |
| Tag 选择器 | ✅ 输入框 focus 显示已有 tags 下拉 |
| userTags normalize | ✅ 大小写/空格差异不造成重复 |
| userTags dedupe | ✅ 同名 tag 不重复写入 |