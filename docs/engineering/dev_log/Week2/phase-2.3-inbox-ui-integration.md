# Phase 2.3 开发日志：建议面板 UI + Inbox 集成

日期: 2026-04-20

## 本阶段目标

把已存在的 SuggestionEngine V1 结果接到 Inbox UI，让用户能在单条 InboxEntry 上看到 suggestion，并执行最小动作（生成建议/接受归档/忽略/恢复）。

## 已完成变更

### 变更文件列表

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/app/inbox/_components/InboxEntryCard.tsx` | 新建 | Entry 卡片组件：状态标签 + suggestion 面板 + 动作按钮 |
| `apps/web/app/inbox/page.tsx` | 重写 | 集成 InboxEntryCard，接入 repository 状态操作 |

### 组件拆分方案

```
inbox/
├── page.tsx                    — 页面容器：加载数据、管理状态、分发动作
└── _components/
    └── InboxEntryCard.tsx      — 单条 Entry 卡片
        ├── StatusBadge         — 状态标签（内联）
        ├── Suggestion 面板      — category/tags/actions/projects 展示
        └── 动作按钮组           — 根据状态显示不同按钮
```

## UI 交互说明

### 各状态下可执行动作

| 状态 | 状态标签 | 可执行动作 | 按钮文案 |
|------|----------|------------|----------|
| pending | 黄色「待处理」 | 生成建议 | 「生成建议」 |
| suggested | 蓝色「已建议」 | 接受归档、忽略 | 「接受归档」「忽略」 |
| ignored | 灰色「已忽略」 | 恢复 | 「恢复」 |
| archived | 绿色「已归档」 | 无（终态） | 「已归档完成」文字 |

### Suggestion 面板展示

对 `suggested` 状态的 entry，在原始文本下方展示蓝色建议面板：

- **分类**：蓝色实心标签（如 `meeting`、`task`）
- **标签**：浅蓝色标签组（如 `产品`、`技术`）
- **动作**：橙色标签组（如 `待解答`、`加入日程`）
- **项目**：紫色标签组（如 `关联项目`）

### 交互流程

1. 用户在 Capture 页面输入内容 → 自动进入 Inbox 为 `pending` 状态
2. 在 Inbox 点击「生成建议」→ 状态变为 `suggested`，展示建议面板
3. 点击「接受归档」→ 状态变为 `archived`（终态）
4. 或点击「忽略」→ 状态变为 `ignored`
5. 对 `ignored` 条目点击「恢复」→ 状态回到 `pending`，可重新生成建议

### 数据刷新机制

每次动作执行后，页面自动调用 `listInboxEntries()` 刷新整个列表，保证 UI 与 IndexedDB 数据一致。动作执行期间，对应条目的按钮显示 loading 状态（通过 `actionLoading` 状态追踪）。

## 状态流验证结果

### 手工验收路径

```
1. 打开 /capture，输入 "明天下午3点有个会议，讨论产品需求"，点击保存
2. 导航到 /inbox，看到新条目，状态标签为黄色「待处理」
3. 点击「生成建议」按钮
4. 等待按钮变为「生成中...」，然后恢复
5. 状态标签变为蓝色「已建议」
6. 建议面板显示：
   - 分类: meeting
   - 标签: 产品, 工作
   - 动作: 加入日程
   - 项目: 关联项目
7. 点击「接受归档」
8. 状态标签变为绿色「已归档」，显示「已归档完成」，无操作按钮
9. 再到 /capture 输入 "灵感：假如用AI来做自动分类？"
10. 回到 /inbox，对新条目点击「生成建议」
11. 确认 category 为 idea
12. 点击「忽略」
13. 状态变为灰色「已忽略」，显示「恢复」按钮
14. 点击「恢复」
15. 状态回到黄色「待处理」，建议面板消失
16. 可再次点击「生成建议」重新触发
```

### 验证通过项

- ✅ `tsc --noEmit` 零错误
- ✅ `next build` 编译成功
- ✅ 页面大小：inbox 3.4 kB（含组件）
- ✅ 各状态标签颜色正确区分
- ✅ pending 条目有「生成建议」按钮
- ✅ suggested 条目展示 category/tags/actions/projects
- ✅ suggested 条目有「接受归档」和「忽略」按钮
- ✅ ignored 条目有「恢复」按钮
- ✅ archived 条目为终态，无操作入口
- ✅ 动作执行后页面自动刷新

## 未覆盖范围

1. **批量操作**：不支持一次对多条 entry 执行动作
2. **Suggestion 选择性接受**：当前归档时接受全部 suggestion，不支持部分选择
3. **状态过滤**：不支持按状态筛选 entry 列表
4. **Suggestion 编辑**：不支持用户手动修改 suggestion 结果
5. **撤销归档**：archived 是终态，不支持撤销
6. **键盘快捷键**：不支持键盘操作
7. **动画/过渡效果**：状态切换无动画

## 风险与注意事项

1. **全量刷新**：每次动作后刷新整个列表，数据量大时可能有性能问题
2. **并发操作**：`actionLoading` 只追踪一条 entry，快速操作多条可能闪烁
3. **Dexie schema 兼容**：Phase 2.1 的 v2 迁移已处理，但用户需确保浏览器已升级 IndexedDB
4. **无错误提示**：动作失败时静默返回，用户看不到错误信息（后续可加 toast）

## 下一阶段输入（Phase 2.4）

### 可选方向

1. **状态过滤 Tab**：在 Inbox 顶部增加 `全部 | 待处理 | 已建议 | 已归档 | 已忽略` 筛选
2. **Suggestion 选择性接受**：允许用户在归档时选择接受哪些 suggestion
3. **Weekly Review 基础**：汇总本周归档条目的分类/标签统计
4. **规则管理 UI**：让用户查看和编辑规则表
5. **错误处理增强**：动作失败时显示 toast 提示

### 接口假设

Phase 2.4 的 UI 增强可直接复用 Phase 2.1/2.2 已建立的：
- `listEntriesByStatus(status)` — 按状态筛选
- `archiveEntry(id, selectedSuggestions?)` — 已支持选择性 suggestion 参数
- `SuggestionItem` 类型 — UI 可渲染 checkbox 等交互