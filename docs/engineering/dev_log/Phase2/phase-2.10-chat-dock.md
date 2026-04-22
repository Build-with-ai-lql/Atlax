# M2-04｜输入主线统一（Classic + Chat -> Dock）

| 项目 | 内容 |
|------|------|
| 模块 | M2-04 |
| 状态 | DONE |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 模块目标（DoD）

- Chat 模式下可完成一次引导输入并进入 Dock。
- Dock 中可看到该条记录，且与 Classic 创建记录共享同一列表与状态流转。
- 不出现 Chat 独立仓或分叉链路。
- lint/typecheck 通过；关键测试通过并可复现。

---

## 2. 改动摘要

1. **扩展 SourceType**：在 `@atlax/domain` 的 `SourceType` 中新增 `'chat'`，保持向后兼容
2. **改造 ChatPanel**：从占位页升级为三步引导输入闭环（input → confirm → done），支持补充上下文、确认入 Dock、继续记录或跳转 Dock 查看
3. **新增 chat_guided_capture_created 事件**：Chat 提交入 Dock 时记录事件，含 `dockItemId` 和 `rawText`，用于后续 M2-08 指标对接
4. **workspace/page.tsx 接入统一处理**：新增 `handleChatSubmitToDock`（以 `sourceType='chat'` 调用 `createDockItem` + 记录事件 + 刷新列表）和 `handleSwitchToClassic`（切换模式并定位到 Dock 视图）
5. **补充测试**：新增 `chat-source.test.ts`（chat sourceType 写入/读取/共享列表/状态流转）和 events.test.ts 中 chat 事件测试（4 个新用例）

---

## 3. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `packages/domain/src/types.ts` | 修改 | SourceType 新增 `'chat'` |
| `apps/web/lib/events.ts` | 修改 | AppEvent 新增 `chat_guided_capture_created` |
| `apps/web/app/workspace/_components/ChatPanel.tsx` | 修改 | 从占位页改为三步引导输入闭环 |
| `apps/web/app/workspace/page.tsx` | 修改 | 新增 handleChatSubmitToDock / handleSwitchToClassic |
| `apps/web/tests/events.test.ts` | 修改 | 新增 4 个 chat 事件测试 |
| `apps/web/tests/chat-source.test.ts` | 新增 | 4 个 chat sourceType 仓储测试 |
| `docs/engineering/dev_log/Phase2/phase-2.10-chat-dock.md` | 新增 | 本开发日志 |

---

## 4. 详细变更说明

### 4.1 SourceType 扩展

```typescript
// packages/domain/src/types.ts
export type SourceType = 'text' | 'voice' | 'import' | 'chat'
```

向后兼容：`createDockItem` 默认 `sourceType = 'text'`，现有调用方无需修改。

### 4.2 ChatPanel 三步引导

| 步骤 | UI | 行为 |
|------|-----|------|
| input | 文本输入框 + "继续"按钮 | 用户输入一句话，Enter 或点击继续 |
| confirm | 原文预览 + 补充输入框 + "返回修改"/"确认入 Dock" | 用户可补充上下文，确认后调用 `onSubmitToDock` |
| done | 成功反馈 + "继续记录"/"去 Dock 查看" | 可重置继续记录，或切换到 Classic 模式查看 Dock |

### 4.3 统一处理函数

```typescript
// workspace/page.tsx
const handleChatSubmitToDock = async (text: string) => {
  const id = await createDockItem(userId, text, 'chat')
  recordEvent({ type: 'chat_guided_capture_created', dockItemId: id, rawText: text })
  await refreshList()
}

const handleSwitchToClassic = () => {
  setMode('classic')
  setActiveView('dock')
  setSelectedItemId(null)
  setSelectedArchivedEntryId(null)
}
```

关键设计：Chat 提交复用 `createDockItem`（仅 `sourceType='chat'` 不同），写入同一 IndexedDB 表，共享同一 `listDockItems` 列表和状态流转。

### 4.4 事件记录

```typescript
// events.ts
export type AppEvent =
  | { type: 'mode_switched'; from: AppMode; to: AppMode }
  | { type: 'chat_guided_capture_created'; dockItemId: number; rawText: string }
```

### 4.5 测试覆盖

| 测试文件 | 用例数 | 覆盖内容 |
|---------|-------|---------|
| `chat-source.test.ts` | 4 | chat sourceType 写入/读取、与 text 共享列表、默认 sourceType 为 text、chat 条目状态流转 |
| `events.test.ts` (新增) | 4 | chat_guided_capture_created 事件记录、_ts 时间戳、订阅接收、混合事件顺序 |

---

## 5. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm lint` | PASS | 无 lint 错误 |
| `pnpm typecheck` | PASS | 无类型错误 |
| `pnpm --dir apps/web test -- --run` | PASS | 60/60 测试通过 |

---

## 6. 手工验证步骤

### 6.1 Chat 引导输入

1. 登录进入 workspace
2. 切换到 Chat 模式
3. 输入"今天讨论了产品路线图"，点击"继续"
4. 确认页面显示原文预览，可补充上下文（如"需要确认技术方案"）
5. 点击"确认入 Dock"
6. 显示"已加入 Dock"成功反馈

### 6.2 Dock 中查看 Chat 创建的记录

1. 在成功反馈页点击"去 Dock 查看"
2. 自动切换到 Classic 模式，Dock 视图
3. 列表顶部可见刚创建的记录
4. 该记录 `sourceType` 为 `chat`，状态为 `pending`
5. 可正常执行 suggest/archive/ignore 等操作

### 6.3 Classic 与 Chat 共享同一列表

1. 在 Classic 模式下通过 QuickInputBar 创建一条记录
2. 切换到 Chat 模式创建另一条
3. 切回 Classic 模式，Dock 列表中可见两条记录

---

## 7. 风险与遗留问题

| 风险/遗留 | 说明 | 影响 |
|-----------|------|------|
| Chat 无 AI 引导追问 | 当前仅支持"补充上下文"，未实现 AI 自动追问 | 符合 M2-04 范围，AI 引导属于 Phase 3 |
| Chat 输入无历史记录 | 每次输入后重置，不保留对话历史 | 低影响，可后续迭代 |
| sourceType 在 UI 中不可见 | Dock 列表项未显示来源标识 | 低影响，可后续在 DockListItem 中添加来源标签 |
