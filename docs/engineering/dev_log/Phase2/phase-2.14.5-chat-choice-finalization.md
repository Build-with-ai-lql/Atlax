# M2-08.5｜Chat 交互收口：自动聊天化 + 用户选择权

| 项目 | 内容 |
|------|------|
| 模块 | M2-08 Chat 交互收口 |
| 状态 | 待复审 |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 目标

1. Chat 输入后立即进入"聊天应用样式"（消息流 + 底部输入），不再依赖手动点"聚焦模式"
2. 最终入 Dock 后，必须让用户明确选择"去 Dock 查看"或"留在 Chat 继续"，不得强制切换视图
3. 日志验证结果与真实执行一致

---

## 2. 改动点

### 2.1 handleSaveEntry 增加 navigateToDock 参数

**文件**：`apps/web/app/workspace/page.tsx`

**改动**：
```typescript
// 旧签名
const handleSaveEntry = async (content: string, tags?: string[]) => {

// 新签名
const handleSaveEntry = async (content: string, tags?: string[], navigateToDock?: boolean) => {
```

**逻辑**：
- `shouldNavigate = navigateToDock ?? (inputMode !== 'chat')`
- Classic 模式调用 `handleSaveEntry(content)` → `navigateToDock` 为 `undefined` → `shouldNavigate = true` → 自动切到 Dock
- Chat 模式调用 `handleSaveEntry(content, tags, false)` → `shouldNavigate = false` → 不切换视图

### 2.2 handleChatFinalSubmit 不隐式切换 activeNav

**改动**：
- 调用 `handleSaveEntry(finalContent, chatTags, false)` 传入 `navigateToDock: false`
- 不再调用 `setActiveNav('dock')`
- 仅在用户点击"去 Dock 查看"按钮时才执行 `setActiveNav('dock') + setInputMode('classic')`

### 2.3 Chat 输入后自动进入消息流布局

**改动**：
- `ChatInputBar` 新增 `onEnterChat` 回调
- 用户按 Enter 或点击 Send 时，调用 `onEnterChat()` → `setChatImmersive(true)`
- `handleChatFinalSubmit` 中也调用 `setChatImmersive(true)` 确保沉浸模式
- 结果：用户输入后自动进入聊天应用样式，无需手动点击"聚焦模式"

### 2.4 入 Dock 后用户明确选择

**改动**：
- 沉浸模式 done 步按钮：
  - "留在 Chat"：`setChatStep('input'); setChatDraft('')` — 保持 Chat 模式和沉浸视图，可继续下一条
  - "去 Dock 查看"：`setInputMode('classic'); resetChatState(); setChatMessages([]); setActiveNav('dock')` — 切回 Classic + Dock
- 底部 ChatInputBar done 步按钮同上
- 用户选择前不强制切换视图

---

## 3. 交互时序图

```
用户操作流程（Chat 模式）：

侧栏切 Chat ──→ 底部输入条出现，主区内容仍可见
      │
      ▼
  输入内容 + Enter/Send
      │
      ▼
  自动进入沉浸模式（消息流 + 底部输入条）
      │
      ▼
  confirm 步：确认内容
      │
      ▼
  context 步：补充上下文（可选跳过）
      │
      ▼
  tags 步：确认/添加标签
      │
      ▼
  提交入 Dock（chat_guided_capture_created 触发）
      │
      ▼
  done 步：消息流显示"已成功入 Dock"
      │
      ├──→ "留在 Chat" → 重置到 input 步，保持沉浸模式，可继续下一条
      │
      └──→ "去 Dock 查看" → 切回 Classic 模式 + Dock 视图 + 清空消息流

关键约束：
- chat_guided_capture_created 仅在最终入 Dock 时触发（handleSaveEntry 中 inputMode === 'chat'）
- handleSaveEntry 不隐式切换 activeNav（navigateToDock: false）
- 用户选择前不强制切换视图
```

---

## 4. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/app/workspace/page.tsx` | 修改 | handleSaveEntry 参数 + 自动沉浸 + 用户选择权 |
| `docs/engineering/dev_log/Phase2/phase2-acceptance.md` | 修改 | 状态更新为 2.14.5 |
| `docs/engineering/dev_log/Phase2/phase-2.14.5-chat-choice-finalization.md` | 新增 | 本开发日志 |

---

## 5. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm --dir apps/web lint` | PASS | 0 errors, 0 warnings |
| `pnpm --dir apps/web typecheck` | PASS | 无类型错误 |
| `pnpm --dir apps/web test -- --run` | PASS | 93/93 测试通过（8 test files） |

---

## 6. 剩余风险

| 风险 | 说明 | 影响 |
|------|------|------|
| 消息流不持久化 | chatMessages 仅在内存中，刷新后丢失 | 低（用户预期聊天记录不持久） |
| 沉浸模式无快捷键退出 | 仅能通过顶部按钮退出 | 可加 Esc 快捷键 |
| workspace/page.tsx 仍为单文件 | 约 1800+ 行 | 可维护性 |
| 散点/关系图视图 | 未实现 | 需图形库 + 数据模型设计 |
