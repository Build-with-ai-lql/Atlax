# Phase 2.4 开发日志：最小归档闭环 + Demo 验收收口

日期: 2026-04-20

## 本阶段目标

把 Week 2 的"输入 -> 建议 -> 用户确认 -> 状态变化"闭环打磨成可稳定演示、可手工验收、可进入 Week 3 的版本。

## 已完成变更

### 修复的问题列表

| # | 问题 | 修复方式 | 文件 |
|---|------|----------|------|
| 1 | 动作异常未捕获，按钮永久 loading | `wrapAction` 统一 try-catch + finally 重置 loading | `page.tsx` |
| 2 | 动作失败无反馈 | `wrapAction` 检查返回值，失败时 `setError` 显示红色提示条 | `page.tsx` |
| 3 | 重复点击导致竞态 | `wrapAction` 中 `actionLoading !== null` 时直接返回 | `page.tsx` |
| 4 | suggested 但 suggestions 为空时面板空白 | 增加 `!hasSuggestions` 分支显示"暂无建议，请尝试刷新" | `InboxEntryCard.tsx` |
| 5 | 加载/刷新异常无处理 | `loadEntries` 和 `refreshList` 增加 try-catch | `page.tsx` |

### 变更文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/app/inbox/page.tsx` | 重写 | 增加 error 状态、`wrapAction` 统一处理、异常捕获、重复点击保护 |
| `apps/web/app/inbox/_components/InboxEntryCard.tsx` | 修改 | 增加 suggested 但 suggestions 为空的空状态提示 |
| `docs/engineering/dev_log/Week2/phase-2.4-demo-acceptance.md` | 新建 | 本文件 |

## 主闭环验收结果

### 主闭环路径（全部通过）

| # | 路径 | 验证结果 |
|---|------|----------|
| 1 | Capture → Inbox (pending) | ✅ 输入内容后导航到 Inbox，新条目状态为「待处理」 |
| 2 | pending → 生成建议 → suggested | ✅ 点击「生成建议」，状态变为「已建议」，展示建议面板 |
| 3 | suggested → 接受归档 → archived | ✅ 点击「接受归档」，状态变为「已归档」，显示「已归档完成」 |
| 4 | suggested → 忽略 → ignored | ✅ 点击「忽略」，状态变为「已忽略」，显示「恢复」按钮 |
| 5 | ignored → 恢复 → pending | ✅ 点击「恢复」，状态回到「待处理」，建议面板消失 |

### 异常路径验收结果

| # | 路径 | 验证结果 |
|---|------|----------|
| 1 | 快速重复点击按钮 | ✅ 第一次点击后按钮 disabled，后续点击被忽略 |
| 2 | 对 archived 条目尝试操作 | ✅ 无操作按钮，显示「已归档完成」 |
| 3 | 对 ignored 条目尝试归档 | ✅ 无「接受归档」按钮，只能「恢复」 |
| 4 | 对 pending 条目尝试归档 | ✅ 无「接受归档」按钮，只能「生成建议」 |
| 5 | 动作失败（如 Dexie 异常） | ✅ 显示红色错误提示条，按钮恢复可点击 |
| 6 | 刷新页面后状态保持 | ✅ 从 IndexedDB 加载，状态与刷新前一致 |

## Demo 验收脚本

### 前置条件

1. 运行 `pnpm --dir apps/web dev` 启动开发服务器
2. 浏览器打开 `http://localhost:3000`
3. 建议先清空浏览器 IndexedDB（DevTools → Application → IndexedDB → AtlaxDB → Delete database）

### 验收路径 A：完整主闭环

```
步骤 1: 输入内容
  - 打开 /capture
  - 输入 "明天下午3点有个会议，讨论产品需求"
  - 点击「保存」
  - 预期：显示「已保存到 Inbox」

步骤 2: 查看 Inbox
  - 点击「查看 Inbox →」或导航到 /inbox
  - 预期：看到新条目，状态标签为黄色「待处理」
  - 预期：按钮区域显示「生成建议」

步骤 3: 生成建议
  - 点击「生成建议」
  - 预期：按钮变为「生成中...」
  - 预期：状态标签变为蓝色「已建议」
  - 预期：建议面板显示：
      分类: meeting
      标签: 产品, 工作
      动作: 加入日程
      项目: 关联项目
  - 预期：按钮区域显示「接受归档」「忽略」

步骤 4: 接受归档
  - 点击「接受归档」
  - 预期：按钮变为「处理中...」
  - 预期：状态标签变为绿色「已归档」
  - 预期：按钮区域显示「已归档完成」
  - 预期：建议面板仍显示（供参考）

步骤 5: 验证状态持久
  - 刷新浏览器页面
  - 预期：该条目状态仍为「已归档」，建议面板仍在
```

### 验收路径 B：忽略与恢复

```
步骤 1: 创建新条目
  - 打开 /capture
  - 输入 "todo: 完成技术架构设计文档"
  - 保存后导航到 /inbox

步骤 2: 生成建议
  - 点击「生成建议」
  - 预期：状态变为「已建议」，建议面板显示 category=task, tag=技术, action=待办提取

步骤 3: 忽略
  - 点击「忽略」
  - 预期：状态变为「已忽略」，建议面板消失
  - 预期：按钮区域显示「恢复」

步骤 4: 恢复
  - 点击「恢复」
  - 预期：状态回到「待处理」，建议面板消失
  - 预期：按钮区域显示「生成建议」

步骤 5: 再次生成建议
  - 点击「生成建议」
  - 预期：状态再次变为「已建议」，建议面板重新显示
```

### 验收路径 C：异常路径

```
步骤 1: 重复点击保护
  - 找到一个 pending 条目
  - 快速连续点击「生成建议」3 次
  - 预期：只有第一次生效，后续点击被忽略
  - 预期：按钮在「生成中...」期间 disabled

步骤 2: 状态保护
  - 找到一个 archived 条目
  - 预期：无操作按钮，只有「已归档完成」文字
  - 尝试通过 console 调用 archiveEntry(id)
  - 预期：返回 null（状态机守卫阻止）

步骤 3: 错误提示
  - 模拟异常情况（如手动删除 IndexedDB 后快速操作）
  - 预期：页面顶部显示红色错误提示条
  - 预期：错误提示包含操作名称和失败原因
```

## 未覆盖范围

1. **批量操作**：不支持一次对多条 entry 执行动作
2. **Suggestion 选择性接受**：归档时接受全部 suggestion，不支持部分选择
3. **状态过滤 Tab**：不支持按状态筛选 entry 列表
4. **Suggestion 编辑**：不支持用户手动修改 suggestion 结果
5. **撤销归档**：archived 是终态，不支持撤销
6. **键盘快捷键**：不支持键盘操作
7. **动画/过渡效果**：状态切换无动画
8. **移动端适配**：未针对移动端优化

## 风险与注意事项

1. **全量刷新策略**：每次动作后刷新整个列表，数据量大时可能有性能问题
2. **无持久化错误日志**：错误提示只在当前页面会话显示，刷新后消失
3. **Dexie schema 兼容**：Phase 2.1 的 v2 迁移已处理，但用户需确保浏览器已升级 IndexedDB
4. **单用户场景**：当前设计假设单用户单机使用，无多设备同步

## Week 3 输入

### 已完成基础（Week 2 交付）

- ✅ Capture → Inbox 基础闭环
- ✅ Suggestion 数据模型与状态流（pending/suggested/archived/ignored）
- ✅ Deterministic 规则引擎 V1（category/tag/action/project）
- ✅ Inbox UI 集成建议面板与状态动作
- ✅ 异常处理与重复点击保护

### Week 3 建议方向

1. **Database View / 状态筛选**：在 Inbox 顶部增加状态过滤 Tab（全部/待处理/已建议/已归档/已忽略）
2. **Weekly Review 基础**：汇总本周归档条目的分类/标签统计
3. **规则管理 UI**：让用户查看和编辑规则表（Phase 2.2 的 `RULES` 导出已预留接口）
4. **Suggestion 选择性接受**：归档时允许用户选择接受哪些 suggestion
5. **批量操作**：支持一次对多条 entry 执行忽略/归档
6. **数据导出**：支持导出归档数据为 JSON/Markdown

### 接口假设

Week 3 可直接复用已建立的接口：
- `listEntriesByStatus(status)` — 状态筛选
- `archiveEntry(id, selectedSuggestions?)` — 已支持选择性 suggestion
- `RULES` 导出 — 规则管理 UI 可直接消费
- `SuggestionItem` 类型 — UI 可渲染 checkbox 等交互
