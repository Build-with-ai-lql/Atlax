# M2-08.2｜回归修复：功能完整性重连

| 项目 | 内容 |
|------|------|
| 模块 | M2-08 回归修复 |
| 状态 | 待复审 |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 目标

修复 M2-08.1 全站 UI 统一引入的功能回归，以"功能完整性优先"原则补齐缺失能力，保持当前 Apple-like 设计语言一致。本轮结束仅进入"待复审"。

---

## 2. 回归分析

M2-08.1 用 Gemini 设计重写了 workspace/page.tsx，在视觉统一过程中丢失了以下功能：

| 回归项 | 原有能力 | 丢失原因 |
|--------|---------|---------|
| Entries 筛选 | status/type/tag/project 四维筛选 + 清空 + 计数 | UI 重写时未迁移 EntriesFilterBar |
| Chat 多步引导 | 输入→确认→上下文→标签→入 Dock | UI 重写时简化为单步输入 |
| 归档条目项目编辑 | content/tags/project 三项可编辑 | UI 重写时仅保留 content/tags |

---

## 3. 改动摘要

### P0-1：修复 lint 阻塞

- **文件**：`apps/web/tests/events.test.ts`
- **改动**：移除未使用变量 `sevenDaysMs`（原 line 199）
- **原因**：该变量在 retention7d 测试中声明但未使用，导致 lint 报错阻塞 CI

### P0-2：恢复 Entries 筛选能力

- **文件**：`apps/web/app/workspace/page.tsx`
- **改动**：
  - 新增 `entryFilterType`、`entryFilterTag`、`entryFilterProject` 三个筛选状态
  - 新增 `filteredEntries` 计算属性，按 type/tag/project 三维过滤
  - 新增 `uniqueProjects`、`uniqueTags` 派生列表用于筛选下拉选项
  - 新增 `EntriesFilterBar` 组件：三个 `<select>` 下拉 + "清空筛选"按钮
  - 筛选后计数展示：`{filteredEntries.length} / {archivedEntries.length} 条目`
  - 新增 `ENTRY_TYPE_OPTIONS` 常量定义类型选项
  - 新增 `clearEntryFilters` 函数一键清空
- **设计风格**：Apple-like 简洁风格，使用 `atlax-card` 类和 Tailwind 统一圆角/阴影，与当前新 UI 一致

### P0-3：恢复 Chat 多步引导闭环

- **文件**：`apps/web/app/workspace/page.tsx`
- **改动**：
  - 新增 `ChatStep` 类型：`'input' | 'confirm' | 'context' | 'tags' | 'done'`
  - 新增 chat 状态变量：`chatStep`、`chatDraft`、`chatContext`、`chatTags`、`chatNewTag`
  - 新增 `ChatFlowContainer` 组件，实现 4 步引导流程：
    1. **input**：用户输入原始内容
    2. **confirm**：确认内容，可选择补充上下文
    3. **context**：补充上下文信息（可选跳过）
    4. **tags**：确认/添加标签，最终提交入 Dock
  - 新增 `handleChatFinalSubmit`：合并 draft + context，调用 `handleSaveEntry(finalContent, chatTags)`
  - **关键约束**：`chat_guided_capture_created` 仅在 `handleSaveEntry` 中 `inputMode === 'chat'` 时触发，即最终确认入 Dock 时，不在草稿输入时触发
  - Chat 确认的标签通过 `addTagToItem` 在入 Dock 时写入
  - `handleSaveEntry` 新增可选 `tags?: string[]` 参数，支持 Chat 标签写入
  - `handleModeChange` 切换模式时重置 chat 状态

### P1-4：恢复 Archived Entry 项目可编辑能力

- **文件**：`apps/web/app/workspace/page.tsx`
- **改动**：
  - `ArchivedEntryDetail` 组件新增 `editProject` 状态
  - 编辑模式下新增 project 输入字段
  - 保存时通过 `handleUpdateEntry` 提交 content/tags/project 三项更新
  - `handleUpdateEntry` 已支持 `project` 字段更新

### P1-5：文档修正

- **文件**：`docs/engineering/dev_log/Phase2/phase-2.14.1-metrics-ui-unification.md`
  - 状态更新为 "DONE (回归已由 2.14.2 修复)"
  - 风险表新增 M2-08.1 回归条目
- **文件**：`docs/engineering/dev_log/Phase2/phase2-acceptance.md`
  - 状态更新为 "待复审（2.14.2 回归修复已完成）"
  - M2-04 结论更新为 "PASS (2.14.2 修复)"，补充多步引导说明
  - M2-07 结论更新为 "PASS (2.14.2 修复)"，补充筛选恢复说明
  - "归档后可再次编辑"更新为 "PASS (2.14.2 修复)"，注明三项可编辑
  - "Chat 模式引导输入"更新为完整 4 步流程描述
  - "Entries 浏览与筛选"更新为三维筛选 + 清空 + 计数
  - chat_guided_capture_created 事件说明更新为"最终确认入 Dock（非草稿输入时）"

---

## 4. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/tests/events.test.ts` | 修改 | 移除未使用变量 sevenDaysMs |
| `apps/web/app/workspace/page.tsx` | 修改 | 恢复筛选、Chat 引导、项目编辑 |
| `docs/engineering/dev_log/Phase2/phase-2.14.1-metrics-ui-unification.md` | 修改 | 状态与风险表更新 |
| `docs/engineering/dev_log/Phase2/phase2-acceptance.md` | 修改 | 结论与描述修正 |
| `docs/engineering/dev_log/Phase2/phase-2.14.2-regression-reconnect.md` | 新增 | 本开发日志 |

---

## 5. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm lint` | PASS | 0 errors, 0 warnings |
| `pnpm typecheck` | PASS | 无类型错误 |
| `pnpm --dir apps/web test -- --run` | PASS | 93/93 测试通过（8 test files） |

---

## 6. Chat 引导流程详细说明

```
用户操作流程：
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐
│  input   │───▶│ confirm │───▶│ context  │───▶│  tags   │───▶│   done   │
│ 输入内容  │    │ 确认内容  │    │ 补充上下文 │    │ 确认标签 │    │  入 Dock  │
└─────────┘    └─────────┘    └──────────┘    └─────────┘    └──────────┘
                   │                │
                   │  可跳过         │  可跳过
                   ▼                ▼
              直接到 tags       直接到 tags

事件触发：
- capture_created：handleSaveEntry 中触发（所有模式）
- chat_guided_capture_created：仅在 handleSaveEntry 中 inputMode === 'chat' 时触发
  → 即最终确认入 Dock 时，不在草稿输入时触发

标签写入：
- Chat 标签在 handleChatFinalSubmit 中通过 handleSaveEntry(content, tags) 传入
- handleSaveEntry 内部调用 createStoredTag + addTagToItem 写入
```

---

## 7. 风险与待办

| 风险/待办 | 说明 | 影响 |
|-----------|------|------|
| workspace/page.tsx 仍为单文件 | EntriesFilterBar、ChatFlowContainer、ArchivedEntryDetail 等均内联 | 可维护性 |
| Entries 筛选为三维而非四维 | 当前按 type/tag/project 筛选，status 筛选未恢复（归档条目均为 archived 状态） | 功能完整性 |
| Chat 引导无 AI 追问 | context 步骤为用户手动补充，非 AI 自动追问 | Phase 3 交接 |
