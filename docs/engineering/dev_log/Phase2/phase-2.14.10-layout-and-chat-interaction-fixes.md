# Phase 2.14.10: 修复 Chat 界面遮挡与编辑面板优化 (v4.9)

## 需求背景
1. **Chat 沉浸/悬浮窗优化**：在点开某一条目进入详情态时，中间悬浮的 Chat 输入框及其背后大面积的毛玻璃遮罩不仅阻挡了主视区，还导致用户点击背景区域时会发生穿透误触。正确的逻辑应该是：在查阅或编辑详情时，Chat 输入框应该自动隐藏，或者缩放为一个可点击恢复的角落悬浮球（FAB）。
2. **编辑面板自适应高度优化**：旧版的 `ArchivedEntryDetail` 中，编辑模式下的输入框被定死在 `120px` 高度，长文本编辑非常吃力。用户期望一进入编辑，输入区能撑满整个屏幕剩余空间，而标签/项目属性退居下方。
3. **Dock 列表状态下的快速编辑支持**：旧版存在一个非常反人类的逻辑：“Dock 中的条目由于处于建议流程，无法被直接重新编辑内容，必须强制归档后才能修改”。用户提出该缺陷极其不合理。

## 具体修复与实现

### 1. Chat 输入框自适应与悬浮态控制 (apps/web/app/workspace/page.tsx)
- 在 `WorkspacePage` 引入 `isChatMinimized` 状态与 `hasSelectedItem` 判断。
- **毛玻璃阻断修复**：非沉浸式模式下，毛玻璃遮罩（blur-overlay）不再是穿透态（`pointer-events-none` 移除），并且赋予了点击取消/隐藏 Chat 框的交互（点击后使 Chat 最小化）。
- **右下角悬浮球（FAB）**：当用户点开了某一条卡片（`hasSelectedItem`），或者主动点击空白处让 Chat 最小化后，原本悬浮居中的聊天栏会隐形，系统会在屏幕右下角呼出一个蓝色的**聊天气泡悬浮球**。用户随时点击它可以切回原状态，气泡上也悬停显示了用于关闭彻底退出的按钮。

### 2. 长文本编辑页布局优化 (apps/web/app/workspace/page.tsx)
- 重构了 `ArchivedEntryDetail` 组件的 `editing` 视图层级：将最外层的包裹容器改为 `flex flex-col h-full`，输入框区域改为 `flex-1 min-h-[400px]`。
- 现在只要点击“编辑”，纯净的全高 `textarea` 就会占据主屏幕的绝大部分高度，下方通过一条细线隔开保留标签和项目栏的修改，视觉表现更为沉浸。

### 3. Dock 待处理条目快速编辑支持
- **前端支持**：为 `DetailSlidePanel` (针对 `item` 未归档状态时) 增加了 `editing` 与 `editRawText` 的内部状态管理，并提供了类似于归档项右下角的“编辑内容”小按钮。
- **持久化接口打通** (`apps/web/lib/repository.ts`)：
  - 新增 `updateDockItemText` 的仓储更新能力。
  - **状态重置逻辑**：当用户修改了某个 Dock 项目的原文（`rawText`）后，该项目的 `status` 会自动重置回 `pending`，并清空所有之前的 AI 建议（`suggestions: []`），以确保后续系统重新针对修改后的新内容做分析。
  - 在 `WorkspacePage` 层将 `handleUpdateDockItem` 透传到了属性层并实现了状态驱动的数据刷新。

## 测试与校验验证
- 执行了 `pnpm --dir apps/web lint`，已修复 `DetailHeaderActions` 组件中未使用的 `any` 警告与空 Icon 参数，类型安全校验通过。
