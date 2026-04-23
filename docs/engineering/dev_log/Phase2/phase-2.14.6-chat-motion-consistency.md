# M2-08.6｜Chat 沉浸动效与一致性收口

| 项目 | 内容 |
|------|------|
| 模块 | M2-08 Chat UX |
| 状态 | 待复审 |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 目标

修复沉浸模式无法输入、实现空间动画、恢复情绪文案、补齐快捷操作图标层、设计一致性自检。

---

## 2. P0：沉浸模式无法输入

### 问题复现路径

**修复前**：
1. 切换到 Chat 模式
2. 输入内容 → Enter → 进入沉浸模式（`chatImmersive=true`, `chatSunk=true`）
3. 沉浸模式底部渲染 `ChatInputBar`，当前 `step='confirm'`
4. confirm 步渲染确认面板（无输入框）
5. 用户想输入新内容 → 无入口 → 阻塞

**修复后**：
1. 同上流程进入沉浸模式
2. confirm 步渲染确认面板，带有标题栏和"重新输入"退出按钮
3. 每个步骤（confirm/context/tags）都有 Minimize2 退出按钮，点击后回到 input 步
4. context 步有 textarea 可输入，tags 步有标签输入框可聚焦
5. input 步有完整输入框（ToolButton 层 + input + Send），始终可达

### 修复点
- 每个步骤面板增加标题栏 + 退出按钮（Minimize2 → 回到 input）
- confirm/context/tags 面板增加 header，可点击退出
- tags 步标签输入框增加 `autoFocus`
- 沉浸模式退出时同步重置 `chatSunk=false`

---

## 3. P1：中心浮窗→下沉聊天窗空间动画

### 实现
- **沉浸模式初态**：输入框在底部（`chatSunk=false` 时），配合 `backdrop-blur-[12px]` 毛玻璃结界
- **发送后下沉**：`handleChatFinalSubmit` 设置 `setChatSunk(true)`，底部输入区域带 `duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)]` 过渡
- **动画曲线**：统一使用 `ease-[cubic-bezier(0.23,1,0.32,1)]`，持续时间 700-800ms
- **背景**：`bg-[#F5F5F7]/80 dark:bg-[#0E0E11]/80 backdrop-blur-[12px]`（FRONT_DESIGN 毛玻璃结界）

---

## 4. P1：Chat 情绪价值文案

### 实现
- 新增 `CHAT_PLACEHOLDERS` 常量（8 条文案）
- `ChatInputBar` 使用 `useState` 初始化随机占位符
- 文案风格：温暖、鼓励、与 Landing/Workspace 语气一致

---

## 5. P1：快捷操作图标层补齐

### 实现
- Chat input 步增加完整 ToolButton 层：Mic + Paperclip + ImageIcon + 分隔线 + CheckSquare + List
- 图标默认 `opacity-60`，hover/focus-within 时 `opacity-100`
- 与 Classic ExpandedEditor 的 ToolButton 层完全一致
- hover/focus/disabled 状态复用 `ToolButton` 组件

---

## 6. 设计一致性核对表

| # | 检查项 | FRONT_DESIGN 要求 | 状态 | 说明 |
|---|--------|-------------------|------|------|
| 1 | 毛玻璃特效 | backdrop-blur md-3xl + 半透明背景 | ✅ 已满足 | 沉浸模式: `backdrop-blur-[12px]`, 底部: `backdrop-blur-xl` |
| 2 | 弥散阴影 | 大范围低透明度柔和阴影 | ✅ 已满足 | 输入框: `shadow-[0_20px_60px_rgba(0,0,0,0.12)]` |
| 3 | 缓动函数 | 700-800ms cubic-bezier | ✅ 已满足 | 面板: `duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]`, 底部: `duration-[800ms]` |
| 4 | AI 呼吸光晕 | 渐变背景 from-blue to-purple | ✅ 已满足 | 输入框底层: `bg-gradient-to-r from-blue-400/5 via-transparent to-purple-400/5` |
| 5 | 渐进式展开 | 次要功能 opacity-60, focus/hover 时显现 | ✅ 已满足 | ToolButton 层 `opacity-60 group-hover:opacity-100` |
| 6 | 发送按钮动态状态 | 空文本置灰，有文本激活+上浮 | ✅ 已满足 | `hover:-translate-y-0.5` + 条件 bg-blue-500/bg-slate-100 |
| 7 | Dark Mode 原则 | 组件级 dark: 响应 | ✅ 已满足 | 所有组件均有 dark: 变体 |
| 8 | 卡片/面板色值 | Light #FFF + border-slate-100, Dark #1C1C1E + border-white/5 | ✅ 已满足 | 所有面板一致 |
| 9 | 背景底色 | Light #F5F5F7, Dark #0E0E11 | ✅ 已满足 | 沉浸模式背景一致 |
| 10 | 主题切换几何过渡 | clip-path 多边形裁剪 | ✅ 已满足 | ThemeToggle 组件使用 clip-path |
| 11 | Chat 空间折叠 | 浮空至中央 + 毛玻璃结界 | ⚠️ 部分满足 | 沉浸模式使用毛玻璃但输入框在底部而非中心浮窗；非沉浸模式下侧栏切 Chat 不遮挡主区 |
| 12 | Tailwind 优先 | 所有样式通过 utility classes | ✅ 已满足 | 无自定义 CSS |

**未满足项**：
- #11 Chat 空间折叠：FRONT_DESIGN 要求"输入组件克服重力浮空至中央（bottom-[50%] translate-y-[50%]）并微放大（scale-[1.03]）"，当前实现输入框始终在底部。原因是 M2-08.5 要求"侧栏切 Chat 不遮挡主区"，与 FRONT_DESIGN 的浮空设计有冲突。作为折中，沉浸模式使用全屏毛玻璃覆盖 + 底部输入框布局。

---

## 7. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/app/workspace/page.tsx` | 修改 | ChatInputBar 重构 + 沉浸动效 + 情绪文案 + ToolButton |
| `docs/engineering/dev_log/Phase2/phase2-acceptance.md` | 修改 | 状态更新 |
| `docs/engineering/dev_log/Phase2/phase-2.14.6-chat-motion-consistency.md` | 新增 | 本开发日志 |

---

## 8. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm --dir apps/web lint` | PASS | 0 errors, 0 warnings |
| `pnpm --dir apps/web typecheck` | PASS | 无类型错误 |
| `pnpm --dir apps/web test -- --run` | PASS | 93/93 测试通过（8 test files） |

---

## 9. 剩余风险

| 风险 | 说明 | 影响 |
|------|------|------|
| Chat 空间折叠未完全对齐 FRONT_DESIGN | 输入框未浮空至中央，使用底部布局 | 视觉差异 |
| 消息流不持久化 | chatMessages 仅在内存中 | 刷新丢失 |
| ToolButton 仅为视觉占位 | 附件/图片/待办/列表按钮无实际功能 | Phase 3 |
| workspace/page.tsx 仍为单文件 | 约 1900+ 行 | 可维护性 |
