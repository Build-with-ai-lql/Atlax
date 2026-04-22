# M2-05｜Suggest / Tag 最小可用

| 项目 | 内容 |
|------|------|
| 模块 | M2-05 |
| 状态 | DONE |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 模块目标（DoD）

- 每条建议可展示 reason。
- 用户手动 Tag 能覆盖系统建议。
- Chat 引导后可完成至少一次 Tag 确认。
- lint/typecheck/关键测试通过。

---

## 2. 改动摘要

1. **CI 升级**：升级到 actions v5 + `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`，CI 通过
2. **TagEditor 显示建议 reason**：传入 `suggestedTagDetails`（`SuggestionItem[]`），每个建议标签旁显示 reason 文本
3. **TagEditor 支持忽略建议**：新增 `onDismissSuggestion` 回调 + `dismissedSuggestions` 状态，用户可点击 ✕ 忽略单条建议，被忽略的建议从列表和最终标签中消失
4. **Chat 路径 Tag 确认**：ChatPanel 新增 `tag` 步骤（input → confirm → tag → done），用户可在提交前添加标签，标签随 DockItem 一起写入
5. **用户 Tag 覆盖系统建议**：`resolveTags` 已实现用户优先逻辑，TagEditor 中"用户选择优先"文案 + 最终标签预览（绿色=用户、蓝色=系统）明确体现覆盖策略
6. **补充测试**：新增 `suggest-tag.test.ts`（7 个用例覆盖 reason 可见性、用户 Tag 覆盖、Chat Tag 确认）

---

## 3. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `.github/workflows/ci.yml` | 修改 | 升级 actions v5 + FORCE_JAVASCRIPT_ACTIONS_TO_NODE24 |
| `apps/web/app/workspace/_components/TagEditor.tsx` | 修改 | 新增 suggestedTagDetails/dismissedSuggestions/onDismissSuggestion |
| `apps/web/app/workspace/_components/DetailPanel.tsx` | 修改 | 传入新 props 到 TagEditor |
| `apps/web/app/workspace/_components/ChatPanel.tsx` | 修改 | 新增 tag 确认步骤，onSubmitToDock 签名增加 tags 参数 |
| `apps/web/app/workspace/page.tsx` | 修改 | 新增 dismissedSuggestions 状态、handleDismissSuggestion、handleChatSubmitToDock 支持 tags |
| `apps/web/tests/suggest-tag.test.ts` | 新增 | 7 个测试用例 |
| `docs/engineering/dev_log/Phase2/phase-2.11-suggest-tag.md` | 新增 | 本开发日志 |

---

## 4. 详细变更说明

### 4.1 CI 升级

- `actions/checkout@v5`
- `pnpm/action-setup@v5`
- `actions/setup-node@v5`
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`
- pnpm 版本仅来自 `package.json#packageManager`

### 4.2 TagEditor reason 显示

- 新增 `suggestedTagDetails?: SuggestionItem[]` prop
- 构建 `reasonMap`：从 `suggestedTagDetails` 中提取 `type === 'tag'` 的 reason
- 每个建议标签旁显示 reason 文本（灰色小字）

### 4.3 TagEditor 忽略建议

- 新增 `dismissedSuggestions?: string[]` prop
- 新增 `onDismissSuggestion?: (tagName: string) => void` prop
- 被忽略的建议从 `suggestedOnly` 列表和最终标签预览中移除
- 每个建议标签旁显示 ✕ 按钮

### 4.4 Chat Tag 确认

- ChatPanel 流程：input → confirm → **tag** → done
- tag 步骤：输入框 + 已添加标签列表 + "返回"/"确认入 Dock"按钮
- `onSubmitToDock` 签名改为 `(text: string, tags: string[]) => Promise<void>`
- `handleChatSubmitToDock` 遍历 tags 调用 `createStoredTag` + `addTagToItem`

### 4.5 用户 Tag 覆盖策略

- `resolveTags`（domain 层）：用户标签优先，系统建议中与用户标签重复的自动过滤
- TagEditor UI：绿色=用户标签（可删除），蓝色=系统建议（可接受/忽略）
- 最终标签预览：区分用户标签（绿色）和系统建议标签（蓝色）
- 忽略建议：显式拒绝，从最终标签中排除

---

## 5. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm lint` | PASS | 无 lint 错误 |
| `pnpm typecheck` | PASS | 无类型错误 |
| `pnpm --dir apps/web test -- --run` | PASS | 67/67 测试通过 |
| CI (run 24799244602) | PASS | commit 841dbee |

---

## 6. 风险与遗留问题

| 风险/遗留 | 说明 | 影响 |
|-----------|------|------|
| Chat Tag 确认为手动输入 | 未提供已有标签选择器 | 低影响，可后续迭代 |
| reason 文本可能较长 | 当前截断显示，hover 显示完整 | 低影响，可后续优化排版 |

---

## 7. Patch 修复记录（2026-04-23）

### 7.1 P0：修复 lint 阻塞

**问题**：`suggest-tag.test.ts` 中使用 `tag.reason!` 非空断言，违反 lint 规则。

**修复**：将 `tag.reason!.length` 改为 `typeof tag.reason === 'string' && tag.reason.length > 0`，类型安全断言替代非空断言。

**复核命令**：`pnpm lint` → PASS

### 7.2 P1：修复忽略建议跨条目污染

**问题**：`dismissedSuggestions` 为全局 `string[]`，忽略条目 A 的建议会影响条目 B 的建议显示。

**修复**：
- `dismissedSuggestions` 类型从 `string[]` 改为 `Record<number, string[]>`，按 `item.id` 隔离
- `handleDismissSuggestion` 签名从 `(tagName: string)` 改为 `(itemId: number, tagName: string)`
- DetailPanel 传入 `dismissedSuggestions[selectedItem.id] ?? []`
- DetailPanel 的 `onDismissSuggestion` 回调闭包捕获 `selectedItem.id`

**复核命令**：`pnpm typecheck` → PASS，`pnpm --dir apps/web test -- --run` → 67/67 PASS

### 7.3 P1：修正文档一致性

**问题**：开发日志中"风险与遗留问题"第一条"dismissedSuggestions 为组件级状态"已通过 patch 修复，需更新。

**修复**：移除已修复的风险条目，补充 patch 修复记录。

### 7.4 验证结果

| 命令 | 结果 |
|------|------|
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm --dir apps/web test -- --run` | PASS（67/67） |
