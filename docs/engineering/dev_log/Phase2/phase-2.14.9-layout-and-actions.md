# Phase 2.14.9: 界面布局重构与沉浸式操作占位 (v4.9)

## 需求背景
1. 当在 Dock 或 Entries 点击某一条记录的详情时，系统应自动进行层级挤压（折叠侧边栏并缩小列表栏宽度），让出尽可能多的空间供详情面板占据主模块，以支持深度阅读和长文编辑。
2. 侧边栏需要加入手动的 收起 / 展开 功能，以达到视觉纯净状态（仅呈现核心功能图标）。
3. 在详情模块顶部增加入口，包含：
   - 全屏沉浸式编辑按钮。
   - Markdown 预览模式切换（预览、源码、左右/上下分屏）。
   - 文件与标签操作的拓展菜单（重命名、移动、属性、导出 PDF 等）。

## 具体改造与实现方案

### 1. 侧边栏手动折叠 (apps/web/app/workspace/page.tsx)
- 在 `WorkspacePage` 引入 `isSidebarManuallyCollapsed` 状态。
- `Sidebar` 增加折叠宽度缓动过渡（从 `w-64` 变至 `w-[72px]`）。折叠后，左侧的徽标文本、模块文本全部隐藏或简化为 Tooltip 图标提示。
- 在 `Sidebar` 顶部区域提供展开/收起按钮。

### 2. 主列表区域被动挤压 (apps/web/app/workspace/page.tsx)
- 当用户进入详情态（`selectedItem || selectedArchivedEntry` 存在）时，中间列容器从 `flex-1` （全宽）平滑切换至 `w-[320px] flex-shrink-0`。
- 联动让原本只有 `w-[420px]` 从右滑入的详情浮窗 (`DetailSlidePanel` 和 `ArchivedEntryDetail`) 变更为 `flex-1`（占据剩余的所有主屏幕区域），以满足沉浸阅读。

### 3. Header 顶部悬浮菜单栏组件补齐 (apps/web/app/workspace/_components/DetailHeaderActions.tsx)
- 新建了一个独立的功能组件，承担了所有被提出需求的入口“占位”功能，并集成了对应的 Lucide UI 图标。
- 预留了**全屏编辑入口** `Maximize`。
- 预留了**Markdown 模式切换**入口 `BookOpen` 及其悬浮提示窗。
- 补齐了与截图完全一致的**下拉菜单 (`MoreHorizontal`)** 列表（如反向链接、左右分屏、在新窗口打开、修改属性、导出PDF、查找替换、文件历史等）。

### 4. 前端接口预留情况说明
- 目前新增菜单的所有按钮与切换选项全部打通了前端交互状态和样式层级控制，但因为暂无对应后端接口与状态，因此触发操作时仅统一执行 `console.log('... 接口预留')` 控制台打印动作。
- 后续如需引入完整的 Markdown 在线编辑器、Vditor 分屏预览支持以及各种文件级系统操作（移动/合并/复制路径），可以直接在 `DetailHeaderActions` 组件中填补点击事件调用。

## 测试与校验验证
```bash
pnpm --dir apps/web lint
pnpm --dir apps/web typecheck
```
编译通过无异常。相关的视觉组件交互可以进入本地环境实测效果。
