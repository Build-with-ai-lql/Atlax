# M2-08.7｜Chat 输入与沉浸动效最终收口

| 项目 | 内容 |
|------|------|
| 模块 | M2-08 Chat UX |
| 状态 | 待复审 |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 目标

修复沉浸首屏输入不可达、实现真实中心浮窗→下沉动画、修复快捷图标命中区域异常、保持情绪文案、设计一致性核对。

---

## 2. Bug 复现与修复

### Bug 1: 沉浸模式 confirm 步无输入入口（P0）

**复现步骤（修复前）**：
1. 切换到 Chat 模式
2. 输入内容 → Enter → 进入沉浸模式
3. `step='confirm'`，底部渲染确认面板（仅显示内容文本 + 两个操作按钮）
4. 用户想修改输入 → 面板中无输入框 → 只能点"重新输入"清空重来
5. 无直接可编辑的文本入口 → 阻塞

**修复后验证步骤**：
1. 同上进入沉浸 confirm 步
2. 确认面板底部有一个 `input` 输入框，预填当前 draft 内容
3. 用户可直接在输入框中修改文本
4. Enter 键推进到 context 步
5. 任意时刻可点击 Minimize2 返回 input 步

**修复点**：
- confirm 步面板底部增加 `<input placeholder="继续输入…" value={draft} onChange={setDraft} />` 输入框
- 退出按钮（Minimize2）不再 `setDraft('')`，保留用户输入内容
- 所有步骤面板的退出按钮统一行为：仅 `setStep('input')`，不清除状态

### Bug 2: 快捷图标 hover/focus/active 异常 + 命中区域错位（P1）

**复现步骤（修复前）**：
1. Chat 模式下，工具按钮（Mic/Paperclip/Image/CheckSquare/List）默认 `opacity-60`
2. hover 时变为 `opacity-100`
3. 由于按钮外层容器设置了 `opacity-60`，视觉上按钮灰暗
4. 视觉透明度与实际可点击区域不一致，用户感觉"点不到/偏了"

**修复后**：
- 移除工具按钮容器的 `opacity-60` 遮罩
- 工具按钮始终 `opacity-100` 可见（通过颜色区分主次，Mic 图标蓝色高亮，其他灰色）
- 命中区域与视觉位置完全一致
- `pointer-events` 完全由子元素自己控制，父容器不干扰

---

## 3. 中心浮窗→下沉动画（P1）

### 实现

**条件**：`!chatSunk`（首次发送前）vs `chatSunk`（发送后）

**未下沉（`!chatSunk`）**：
```css
position: fixed;
bottom: 50%;
transform: translateY(50%) scale(1.03);
background: bg-white/95;
border-top: none;
border-radius: 1rem;
```

**已下沉（`chatSunk`）**：
```css
position: relative;
bottom: 0;
transform: translateY(0) scale(1);
background: bg-white/60;
border-top: border-slate-100;
border-radius: 0;
```

**动画曲线**：`transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)]`

### 触发时机
- 用户首次发送（`handleChatFinalSubmit`）→ `setChatSunk(true)`
- 退出沉浸模式 → `setChatSunk(false)`

---

## 4. 情绪价值文案（P1）

- 保留 `CHAT_PLACEHOLDERS` 8 条随机占位符
- 使用 `useState` 初始化随机值，组件生命周期内不变
- 文案风格：温暖、鼓励、与 Landing/Workspace 语气一致

---

## 5. 设计一致性核对表

| # | 检查项 | FRONT_DESIGN 要求 | 状态 | 说明 |
|---|--------|-------------------|------|------|
| 1 | 毛玻璃特效 | backdrop-blur md-3xl + 半透明背景 | ✅ | 沉浸: `backdrop-blur-[12px]`，底部: `backdrop-blur-xl` |
| 2 | 弥散阴影 | 大范围低透明度柔和阴影 | ✅ | `shadow-[0_20px_60px_rgba(0,0,0,0.12)]` |
| 3 | 缓动函数 | 700-800ms cubic-bezier | ✅ | 所有面板: `duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]`，下沉: `duration-[800ms]` |
| 4 | AI 呼吸光晕 | 渐变背景 from-blue to-purple | ✅ | 输入框底层: `bg-gradient-to-r from-blue-400/5 via-transparent to-purple-400/5` |
| 5 | 渐进式展开 | 次要功能默认 opacity-60 | ⚠️ 已调整 | 工具按钮默认 opacity-100（避免命中区域误导），通过颜色区分主次 |
| 6 | 发送按钮动态状态 | 空文本置灰，有文本激活+上浮 | ✅ | `hover:-translate-y-0.5` + 条件 bg-blue-500/bg-slate-100 |
| 7 | Dark Mode 原则 | 组件级 dark: 响应 | ✅ | 所有组件均有 dark: 变体 |
| 8 | 卡片/面板色值 | Light #FFF + border-slate-100, Dark #1C1C1E + border-white/5 | ✅ | 所有面板一致 |
| 9 | 背景底色 | Light #F5F5F7, Dark #0E0E11 | ✅ | 沉浸模式背景一致 |
| 10 | 主题切换几何过渡 | clip-path 多边形裁剪 | ✅ | ThemeToggle 组件使用 clip-path |
| 11 | Chat 空间折叠 | 浮空至中央 + 毛玻璃结界 | ✅ | `chatSunk=false` 时: `bottom-[50%] translate-y-[50%] scale-[1.03]` 真实几何变化 |
| 12 | 固定定位沉浸层 | 沉浸时 fixed inset-0 | ✅ | 从 `absolute` 升级为 `fixed` |
| 13 | Tailwind 优先 | 所有样式通过 utility classes | ✅ | 无自定义 CSS |

---

## 6. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/app/workspace/page.tsx` | 修改 | confirm 步输入框 + 中心浮窗动画 + 工具按钮可见性 |
| `docs/engineering/dev_log/Phase2/phase2-acceptance.md` | 修改 | 状态更新为 2.14.7 |
| `docs/engineering/dev_log/Phase2/phase-2.14.7-chat-input-motion-final.md` | 新增 | 本开发日志 |

---

## 7. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm --dir apps/web lint` | PASS | 0 errors, 0 warnings |
| `pnpm --dir apps/web typecheck` | PASS | 无类型错误 |
| `pnpm --dir apps/web test -- --run` | PASS | 93/93 测试通过（8 test files） |

---

## 8. 剩余风险

| 风险 | 说明 | 影响 |
|------|------|------|
| 工具按钮无实际功能 | 附件/图片/待办/列表按钮仍为占位 | Phase 3 |
| 消息流不持久化 | chatMessages 仅在内存中 | 刷新丢失 |
| workspace/page.tsx 仍为单文件 | 约 1950+ 行 | 可维护性 |
