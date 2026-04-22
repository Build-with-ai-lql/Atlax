# M2-03｜双模式框架与切换控制器

| 项目 | 内容 |
|------|------|
| 模块 | M2-03 |
| 状态 | DONE |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 模块目标（DoD）

- 建立 Classic/Chat 双模式切换控制器（不是普通 tab）
- 用户可明确感知模式切换
- 切换后仍作用于同一用户、同一知识库上下文（不产生双仓）
- 产生 `mode_switched` 事件

---

## 2. 改动摘要

1. **新建事件记录模块** `lib/events.ts`：支持 `AppMode` 类型定义、`mode_switched` 事件记录、事件订阅/发布、localStorage + 内存双回退存储
2. **新建 ModeSwitch 组件**：Sidebar 内的 Classic/Chat 切换控件，使用分段按钮样式（非普通 tab），带图标区分两种模式
3. **新建 ChatPanel 骨架组件**：Chat 模式的最小占位容器，显示用户名和"即将上线"提示，不实现 Chat 引导归档链路
4. **改造 Sidebar**：新增 `mode` 和 `onModeChange` props，在导航区上方嵌入 ModeSwitch
5. **改造 workspace/page.tsx**：新增 `mode` 状态管理，`handleModeChange` 触发 `mode_switched` 事件并切换视图（Classic 显示 MainPanel+DetailPanel，Chat 显示 ChatPanel），用户上下文（user/items/tags）在模式切换间保持不变
6. **新增测试** `tests/events.test.ts`：覆盖默认模式、切换行为、事件记录、订阅机制、模式切换不清空用户上下文

---

## 3. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/lib/events.ts` | 新增 | 事件记录模块（AppMode、recordEvent、subscribe、getEventLog） |
| `apps/web/app/workspace/_components/ModeSwitch.tsx` | 新增 | Classic/Chat 切换控件 |
| `apps/web/app/workspace/_components/ChatPanel.tsx` | 新增 | Chat 模式占位容器 |
| `apps/web/app/workspace/_components/Sidebar.tsx` | 修改 | 新增 mode/onModeChange props，嵌入 ModeSwitch |
| `apps/web/app/workspace/page.tsx` | 修改 | 新增 mode 状态、handleModeChange、Chat/Classic 视图切换 |
| `apps/web/tests/events.test.ts` | 新增 | 事件模块与模式切换行为测试 |

---

## 4. 详细变更说明

### 4.1 事件记录模块（`lib/events.ts`）

- `AppMode = 'classic' | 'chat'`：双模式类型定义
- `AppEvent`：联合类型，当前仅 `mode_switched`
- `recordEvent(event)`：记录事件（emit + 持久化）
- `subscribe(listener)` / `emit(event)`：发布订阅机制
- `getEventLog()` / `clearEventLog()`：事件日志读写
- 存储策略：优先 localStorage，无 localStorage 时回退到内存（支持测试环境）

### 4.2 ModeSwitch 组件

- 分段按钮样式（`bg-gray-100` 容器 + 白色高亮选中项）
- Classic 图标：四宫格（代表工作台）
- Chat 图标：对话气泡
- 选中项带 `shadow-sm` 和白色背景，明确标识当前模式

### 4.3 ChatPanel 骨架

- 接收 `user` prop，显示用户名
- 居中显示"Chat 引导式整理即将上线"提示
- 引导用户使用 Classic 模式完成整理
- 不包含任何输入或对话功能

### 4.4 模式切换逻辑

- `handleModeChange`：仅在模式实际变更时触发 `recordEvent`
- Classic 模式：显示 MainPanel + DetailPanel（原有三栏布局）
- Chat 模式：显示 ChatPanel（占位）
- 模式切换不清空 user/items/tags 等状态，确保同一知识库上下文

### 4.5 测试覆盖

| 测试用例 | 验证内容 |
|---------|---------|
| records mode_switched event to log | 事件正确记录到日志 |
| emits event to subscribers | 订阅者正确接收事件 |
| unsubscribes correctly | 取消订阅后不再接收 |
| supports multiple subscribers | 多订阅者并行接收 |
| clears event log | 清空日志功能正常 |
| default mode is classic | 默认模式为 classic |
| switching mode records correct from/to | 切换记录正确的 from/to |
| switching to same mode does not record event | 同模式切换不产生事件 |
| mode switch does not affect user context | 模式切换不清空用户上下文 |
| records multiple mode switches in order | 多次切换按顺序记录 |

---

## 5. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm --dir apps/web test -- --run tests/events.test.ts` | PASS | 10/10 测试通过 |
| `pnpm lint` | PASS | 无 lint 错误 |
| `pnpm typecheck` | PASS | 无类型错误 |

---

## 6. 手工验证步骤

### 6.1 模式切换可见

1. 登录进入 workspace
2. Sidebar 顶部可见 ModeSwitch 控件（Classic / Chat 分段按钮）
3. Classic 默认高亮（白色背景 + 阴影）

### 6.2 切换到 Chat 模式

1. 点击 Chat 按钮
2. 主区域从三栏布局切换为 ChatPanel 占位页面
3. Chat 按钮高亮，Classic 取消高亮

### 6.3 切换回 Classic 模式

1. 点击 Classic 按钮
2. 主区域恢复三栏布局（MainPanel + DetailPanel）
3. 数据（Dock items、Entries、Tags）保持不变

### 6.4 事件记录

1. 打开浏览器 DevTools → Application → Local Storage
2. 查看 `atlax_event_log` 键值
3. 可看到 `mode_switched` 事件记录

---

## 7. 风险与遗留问题

| 风险/遗留 | 说明 | 影响 |
|-----------|------|------|
| ChatPanel 为空态占位 | 当前仅显示提示文字，无实际 Chat 功能 | 符合 M2-03 范围，Chat 引导归档链路属于 M2-04 |
| 模式状态未持久化 | 刷新后 mode 回到 classic | 低影响，可后续在 M2-03 补丁或 Phase 3 中处理 |
| 事件日志仅本地存储 | 无远端上报，M2-08 再扩展 | 符合当前范围 |
| ModeSwitch 无动画 | 切换为即时状态变化，无过渡动画 | Phase 3 体验打磨时处理 |

---

## 8. Gap Matrix 更新建议

| P0 项 | 原结论 | 建议更新 |
|-------|--------|---------|
| 模式切换控制器 | FAIL | PARTIAL（控制器已建立，Chat 引导归档链路待 M2-04） |
| 同一知识库约束 | FAIL | PARTIAL（模式切换共享同一数据上下文已验证，Chat sourceType 待 M2-04） |
