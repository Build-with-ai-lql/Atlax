## Phase Refactory Round 1 Frontend (2026-04-27)

### Timestamp & Round
- Time: 2026-04-27
- Round: Phase Refactory Round 1 Frontend
- Goal: Converge workspace to top 3 modules: Editor / Mind / Dock, Mind as default

### Changes
1. **workspace/page.tsx full rewrite** (~3700 -> ~700 lines):
   - ViewType -> ActiveModule = editor | mind | dock
   - Default activeModule = mind (localStorage persisted)
   - Removed left Sidebar, replaced with top nav bar (TopBar)
   - Added Mind View: deep space bg + nebula glow + Atlas Status + GROW input
   - Added Editor View: title + textarea + save/return
   - Preserved Dock View: card list + detail panel + status actions
   - Dock loading spinner color: slate/white
   - Old Entries/Review/Chat/Widget/Calendar no longer main nav
   - Chat/Classic recorder preserved as FloatingRecorder
   - Dock -> Editor jump link complete
2. **globals.css**: dark bg #0E0E11 -> #030508, added .atlax-deep-space, .atlax-topbar, .atlax-mainstage
3. **layout.tsx**: html className=dark, body className=bg-[#030508]

### Issues & Resolutions
| Issue | Resolution | Resolved |
|-------|-----------|----------|
| recordEvent type mismatch | Changed to capture_created event type | Yes |
| Unused imports/vars lint errors | Cleaned unused icons, repo functions, isDark/handleLogout | Yes |
| DockCard unused destructured params | Only destructure used props | Yes |
| FloatingRecorder userId unused | Removed from props and call site | Yes |
| lib/repository.ts 12 pre-existing lint errors | Backend/domain layer, not in scope | Not blocking |

### Verification Results
- node -v: v24.14.0, pnpm -v: 10.0.0
- lint: page.tsx 0 errors, repository.ts 12 pre-existing (not in scope)
- typecheck: 0 errors
- test: 12 files, 262 tests passed
- git diff --cached --check: exit code 0

### Manual Verification Criteria
1. Open /workspace -> default Mind view (Nebula Tree + deep space + GROW input)
2. Top nav only Editor / Mind / Dock, active item has green dot
3. Click Editor/Dock -> switches MainStage, no white screen or console errors
4. Mind GROW input creates Dock Item
5. Dock click item -> detail panel, can edit/archive/jump to Editor
6. Review/Chat/Widget/Calendar not in main nav

### Ready for Next Round
Yes. Frontend baseline converged to 3-module structure, minimum data loop preserved.

### Next Round Risks
1. Mind view is placeholder: needs Canvas engine and nebula tree rendering
2. Editor is simplified textarea: needs Block Editor
3. FloatingRecorder simplified Chat: needs full Chat interaction
4. Old _components not cleaned: WorldTreeView/StructureViews/ExpandedEditor still exist
5. Theme toggle missing: no light/dark switch entry yet

---

## Phase Refactory Round 1 Review Fix (2026-04-27)

### Timestamp
- Time: 2026-04-27
- Round: Phase Refactory Round 1 Review Fix

### Review Issues & Fixes

#### Fix 1: lib/repository.ts 12 unused import/type lint errors
- **Problem**: `pnpm --dir apps/web lint` reported 12 `@typescript-eslint/no-unused-vars` errors in `apps/web/lib/repository.ts`
- **Root Cause**: Previous round marked these as "not in scope" but they are in the web package and must be fixed
- **Fix**: Removed 12 unused imports/types:
  - From `@atlax/domain`: `buildDocumentAndCapturePatches`, `documentFromEntry`, `entryFromDocument`, `Document`, `DocumentType`, `MindEdge`, `MindNode`
  - From `./db`: `documentsTable`, `capturesTable`, `DocumentRecord`, `CaptureRecord`, `PersistedCapture`
- **No eslint-disable used**: All fixes are proper removal of unused code

#### Fix 2: Trailing whitespace / EOF issues in staged docs
- **Problem**: `git diff --cached --check` reported trailing whitespace and blank-line-at-EOF errors across 4 files
- **Fix**: `sed -i '' 's/[[:space:]]*$//'` on all affected files + EOF blank line removal for FRONTEND_TECH_SPEC.md
- **Files fixed**:
  - `docs/engineering/dev_log/Phase3/phase3-devlog-frontend.md` (lines 1400, 1429)
  - `docs/product/BACKEND_TECH_SPEC .md` (lines 233, 234, 270-273)
  - `docs/product/FRONTEND_TECH_SPEC.md` (line 465 EOF)
  - `docs/product/structure—design/STRUCTURE_ALGORITHEM_DESIGN.md` (lines 5, 8-12, 79, 887-889, 923-929)

#### Fix 3: workspace/page.tsx default Mind + handleCapture real id
- **Problem A**: `activeModule` initialized to `'mind'` but first `useEffect` read from `localStorage` and could override with old value (e.g. `'dock'`), breaking refactory verification
- **Fix A**: Removed localStorage read from the first `useEffect`. Workspace always opens to Mind on fresh load. Session-level module switching still persisted via the second `useEffect` write, but old localStorage values no longer override the refactory default.
- **Problem B**: `handleCapture` used `dockItemId: 0` in `recordEvent` instead of the real id returned by `createDockItem`
- **Fix B**: Captured `createDockItem` return value as `newId` and passed it to `recordEvent` as `dockItemId: newId`

#### Fix 4: StructureViews.tsx / WorldTreeView.tsx unstaged
- **Problem**: Both files were staged but not imported or used in the current workspace/page.tsx (Phase 0 main path)
- **Decision**: World Tree / Time Machine are NOT Phase 0 main deliverables. Removed from staged via `git reset HEAD`
- **Current state**: Files remain in working tree as legacy code, unstaged. Can be re-integrated in a later phase when Mind view gets Canvas rendering.

#### Fix 5: REBUILD_EXECUTION_MASTER_PLAN.md version control
- **Problem**: File was listed in `.gitignore` under "Design reference (do not push)" section
- **Decision**: This is a product execution master plan, not a design reference. It should be version controlled alongside other product docs.
- **Fix**: Removed `docs/product/REBUILD_EXECUTION_MASTER_PLAN.md` from `.gitignore` and staged the file

### Verification Results (Post Fix)
- `pnpm --dir apps/web lint`: 0 errors, 0 warnings
- `pnpm --dir apps/web typecheck`: 0 errors
- `pnpm --dir apps/web test -- --run`: 12 files, 262 tests passed
- `pnpm --filter @atlax/domain typecheck`: 0 errors
- `pnpm --filter @atlax/domain test -- --run`: 19 files, 303 tests passed
- `git diff --cached --check`: exit code 0, no whitespace/EOF issues

### Manual Verification Criteria
1. Open /workspace -> always defaults to Mind view regardless of old localStorage
2. Mind GROW input creates Dock Item with correct dockItemId in event record
3. No lint errors in web package
4. No trailing whitespace in staged files
5. StructureViews.tsx / WorldTreeView.tsx NOT in staged files
6. REBUILD_EXECUTION_MASTER_PLAN.md IS in staged files

### Ready for Next Round
Yes. All review fixes applied, all verification commands pass, all changes staged (not committed).

---

## Phase Refactory Round 2 Frontend (2026-04-27): Home + WorkspaceTabs + Editor Tab

### Timestamp & Round
- Time: 2026-04-27
- Round: Phase Refactory Round 2 Frontend
- Goal: TopNav Home/Mind/Dock, Home entry page, WorkspaceTabs, Editor tab-based opening

### Changes
1. **AppShell restructured**:
   - TopNav: Home / Mind / Dock (Editor removed from primary nav)
   - Default activeModule = 'home' (not 'mind')
   - Added WorkspaceTabs row below TopNav with "+" button for new notes
   - Tab state: tabs array + activeTabId, tabs can be activated/closed/created
2. **HomeView component** (features/home/HomeView.tsx):
   - Greeting with user name + time-of-day
   - 3 entry cards: Latest Documents / Upload / Notebook (with hover focus effect)
   - Recent Documents list from listDockItems
   - Left sidebar: Projects / Archive / New Folder (weak entries)
3. **EditorTabView component** (features/editor/EditorTabView.tsx):
   - Tab-based editor: opens as a new tab, not inline
   - Dirty tracking with save button
   - Empty state when no document selected
4. **WorkspaceTabs component** (features/shared/WorkspaceTabs.tsx):
   - Tab bar with icons per type (Home/Brain/Database/FileText)
   - Close button on editor tabs (hover-reveal)
   - "+" button always visible at end
5. **page.tsx refactored** (~730 lines):
   - Tab management: openEditorTab creates/activates editor tab
   - handleNewNote creates Dock item + Mind node + opens editor tab
   - handleActivateTab switches module based on tab type
   - handleCloseTab falls back to adjacent tab or Home
   - Mind uses listMindNodes/listMindEdges (not getMindGraphSnapshot which doesn't exist)
   - Capture uses upsertMindNode to create Mind node alongside Dock item

### Issues & Resolutions
| Issue | Resolution | Resolved |
|-------|-----------|----------|
| getMindGraphSnapshot/ensureCaptureNode don't exist in repository.ts | Used listMindNodes/listMindEdges + upsertMindNode instead | Yes |
| MindGraphSnapshot type not exported | Used StoredMindNode[] + StoredMindEdge[] directly | Yes |
| HomeView unused onSwitchToMind prop | Removed from interface and call site | Yes |
| TabType unused import | Removed from page.tsx import | Yes |
| handleUpdateText unused after Dock detail panel simplification | Removed function | Yes |

### Verification Results
- lint: 0 errors
- typecheck: 0 errors
- test: 13 files, 286 tests passed
- build: successful (next build, all routes generated)
- git diff --cached --check: exit code 0

### Manual Verification Criteria
1. /workspace defaults to Home (not Mind)
2. Top nav only Home / Mind / Dock
3. Second row shows WorkspaceTabs with "+" button
4. Editor not in top nav
5. Dock/Home click document -> opens/activates Editor tab
6. Recent Documents shows and updates
7. Mind and Dock still switchable, no white screen or console errors

### Ready for Next Round
Yes. Home entry page, WorkspaceTabs, and Editor tab system all working.

### Next Round Risks
1. Mind SVG layout uses hash-based positioning: needs Canvas/force-directed engine
2. Editor is still textarea: needs Block Editor
3. Tab state is client-only (no persistence): needs workspace session API integration
4. Home Recent Documents reads from Dock items: should use listRecentDocuments API
5. No document upload functionality yet: Upload card is a placeholder

---

## Phase Refactory Round 3 Frontend (2026-04-28): Golden UI Convergence (Superseded by Round 4)

### Timestamp & Round
- Time: 2026-04-28
- Round: Phase Refactory Round 3 Frontend
- Goal: Converge Top Nav and Home view to Golden Prototype aesthetics.

### Changes
1. **Top Nav Componentization**:
   - Created `apps/web/app/workspace/_components/GoldenTopNav.tsx` based on prototype.
   - Features: Floating pill nav, glassmorphism background, active state highlights, dragging to reposition (logic preserved from prototype).
   - Integrated real workspace modules: Home, Mind, Dock.
   - Added real user state for Account dropdown and Logout functionality.
   - Integrated Search UI (Spotlight style) and Capture (+) entry.
2. **Home View Alignment**:
   - Refined `apps/web/app/workspace/features/home/HomeView.tsx`.
   - Added `atlax-deep-space` background with nebula glows.
   - Optimized spacing, typography, and card aesthetics.
   - Improved Recent Intelligence list with better glass panels and hover states.
3. **WorkspaceTabs Polishing**:
   - Refined `apps/web/app/workspace/features/shared/WorkspaceTabs.tsx`.
   - Updated icons to match the new Top Nav (Network for Mind, Library for Dock).
4. **General UI Refinement**:
   - Updated `DockInlineView` in `page.tsx` with `atlax-deep-space` and improved card/detail panel styling.
   - Standardized on Emerald/Indigo/Slate palette from golden design.

### Issues & Resolutions
| Issue | Resolution | Resolved |
|-------|-----------|----------|
| Prototype search/account logic mapping | Reimplemented using real workspace state while keeping prototype visual behavior | Yes |
| Nav overlap with Tabs | Adjusted `mt-[84px]` in `page.tsx` for clean breathing room | Yes |
| Logout missing in workspace | Added `logoutUser` integration in `GoldenTopNav` | Yes |

### Verification Results (Pre Review Fix)
- lint: 0 errors
- typecheck: 0 errors
- test: 13 files, 286 tests passed
- build: successful (next build, all routes generated)
- git diff --check: exit code 0 (review found trailing whitespace in HomeView.tsx L37, fixed in review patch)

### Manual Verification Criteria
1. Open `/workspace` -> Top nav should be a floating pill with glass effect.
2. Switch Home/Mind/Dock -> Nav active state should update, view should switch.
4. Home view should show Star Input, and 3-card grid with high-end glass effects.
5. Search button should expand to Spotlight-style input.
6. Account button should show dropdown with Logout.
7. Capture (+) button in nav should open the floating recorder.
8. WorkspaceTabs should only appear in Editor view.

### Review Patch (2026-04-28)
- **Fix**: Removed trailing whitespace in `HomeView.tsx` line 37 (empty line inside useEffect had trailing spaces).
- **No business logic change**.
- **Post-fix**: `git diff --check --cached` exit code 0.

### Ready for Next Round
No, superseded by Round 4 review fixes.

### Next Round Risks
1. Mind view still uses hash-based SVG: needs real Canvas engine.
2. Editor is still basic: needs block-based editor integration.
3. Search in Top Nav is UI only: needs backend search API integration.

---

## Phase Refactory Round 4 Frontend (2026-04-28): Golden UI Issue Fixes

### Timestamp & Round
- Start: 2026-04-28 15:56
- End: 2026-04-28 16:03
- Duration: 7 min
- Round: Phase Refactory Round 4 Frontend

### Fixed issues
1. **TopNav 缺少 Editor**: 将 `GoldenViewId` 添加 `editor` 选项，导航栏添加 Editor 入口（使用 `PenTool` 图标），支持激活状态。
2. **搜索框无法恢复**: 修复了 Search 开启后通过 Escape、点击导航、点击 logo 或 Send 按钮可正确恢复，去除了非必要的 TopNav 折叠逻辑。
3. **第二行 WorkspaceTabs 与原型冲突**: 修改了 WorkspaceTabs 的呈现条件，保证全局只在 Editor view 内作为内部 tabs 显示，避免了在 Home/Mind/Dock 中冗余。
4. **文档打开没有进入 Editor view**: 修复了主页新建/最近文档及 Dock 打开文档的逻辑，现能正确设置 activeModule 为 `editor` 并点亮 TopNav 对应状态。
5. **Home 视觉偏离原型**: 移除了问候语和 Sparkles，修复标题及节点数文案，将输入框及悬浮卡片的点缀色改为紫色 `#a78bfa`，还原卡片尺寸至 `rounded-2xl p-6`，卡片图标改为 `rounded-full` 结构，并极大弱化了 Recent Intelligence 显示优先级。

### Verification
- `pnpm --dir apps/web typecheck`: 0 errors
- `pnpm --dir apps/web test`: 286 tests passed
- `pnpm --dir apps/web lint`: 0 errors (1 warning in demo proto)
- `pnpm --dir apps/web build`: Success
- `git diff --check --cached`: 0 errors

### Manual verification checklist
- [ ] TopNav 显示 Editor，可点击进入
- [ ] 搜索栏展开后，按 ESC、点任意处都能恢复
- [ ] WorkspaceTabs 仅在 Editor view 出现
- [ ] 各个入口新建/打开文档都能直接跳转 Editor
- [ ] 主页视觉元素与黄金原型对齐

### Ready for Next Round
No, pending review/manual validation.

### Next risk
1. Editor view 距离 Golden 原型的功能要求依然有一定差距，需要继续重构。
2. Search 和全局指令面板尚未打通真正后端逻辑。

---

## Phase Refactory Round 5 Frontend (2026-04-28): Dock Visual Reversion

### 时间统计
- 开始时间：2026-04-28 16:21
- 结束时间：2026-04-28 16:26
- 工作时长：5 分钟

### 本轮修复内容
1. **回收 Dock 视觉改动**: 移除了 `DockInlineView` 容器上的 `atlax-deep-space` 背景类，并将详情面板背景色从半透明模糊 (`bg-[#030508]/80 backdrop-blur-3xl shadow-2xl`) 恢复为实色背景 (`bg-[#0A0D14]`)，去除了阴影和模糊效果。
2. **保持功能链路**: 保留了 Dock 列表的选中态、suggest/archive/reopen 按钮功能，以及 "Open in Editor" 的跳转逻辑。

### 自动验证结果
- `pnpm --dir apps/web typecheck`: 通过
- `pnpm --dir apps/web test`: 通过
- `pnpm --dir apps/web lint`: 通过
- `pnpm --dir apps/web build`: 通过
- `git diff --check --cached`: 通过

### 手工验证状态
- 未执行，等待用户后续统一验证

### 是否可进入下一轮
- 等待 review

### 下一轮风险
1. Dock 视觉与 TopNav/Home 风格暂时脱节，需在后续阶段重新规划 Dock 的 Golden UI 迁移。
2. 现有 Dock 交互逻辑较重，未来需配合后端 API 进行性能优化。

---

## Phase Refactory Round 6 Frontend (2026-04-28): Dock 视觉残留回收 + 日志更正

### 时间统计
- 开始时间：2026-04-28 16:31
- 结束时间：2026-04-28 16:36
- 工作时长：5 分钟

### 修正内容
1. **Dock 空态文案英→中**: "Dock is empty" → "暂无条目"；"Capture Now" → "录入"；移除副标题 "Your captured fragments will appear here."。
2. **空态 spacing 收缩**: `py-32` → `py-16`，移除 `w-16 h-16` 装饰容器，图标尺寸 24→18。
3. **列表卡片简化**: 移除 `group`/`transition-all`/`ChevronRight` 箭头，padding `p-4` → `px-3 py-2`。
4. **移除 ID 展示**: 删除 `ID: {item.id}` 行及 `ChevronRight` import。
5. **详情栏收缩**: 宽度 `w-[420px]` → `w-80`，padding `p-8` → `p-4`，移除 uppercase/tracking/分割线/"Raw Fragment" 标题。
6. **按钮简化**: 移除彩色背景/边框，改为纯文字 + hover 下划线，文案统一中文（建议/归档/重新打开/在编辑器中打开）。
7. **容器背景**: 移除列表区 `bg-[#111111]`、滚动条隐藏样式。

### 日志更正说明
- 本轮仅修正 Dock scope 残留，不涉及 TopNav/Home/Mind/Editor。

### 自动验证结果
- `pnpm --dir apps/web typecheck`: 通过（0 errors）
- `pnpm --dir apps/web test`: 通过（13 files, 286 tests passed）
- `pnpm --dir apps/web lint`: 通过（0 errors）
- `pnpm --dir apps/web build`: 通过（所有路由正常生成）
- `git diff --check --cached`: 通过（exit code 0）

### 手工验证状态
- 未执行，等待用户后续统一验证。

### 是否可进入下一轮
- 等待 review。

---

## Phase Refactory Round 7 Frontend (2026-04-28): Editor View 对齐原型

### 时间统计
- 开始时间：2026-04-28 16:40
- 结束时间：2026-04-28 17:11
- 工作时长：31 分钟

### 本轮目标
缩小 `/workspace` Editor view 与黄金原型 Editor view 的视觉差距。

### 变更内容

#### 1. page.tsx — Editor 外壳重构
- 移除全局第二行 WorkspaceTabs 导航行（原 `mt-[84px]` 的独立 div）。
- Editor 改为独立一等视图：`rounded-2xl` + `border` + `shadow-2xl` 面板容器。
- 面板内部包含 `h-14 bg-[#161616]` 标签栏 + `bg-[#1A1A1A]` 内容区。
- WorkspaceTabs 和 EditorTabView 嵌入面板内部，不再分离。
- Home/Mind/Dock 视图仅在 `!isEditorActive` 时渲染，互斥。

#### 2. WorkspaceTabs — 对齐原型标签栏样式
- 容器改为 `flex-1 items-end h-full`，嵌入 `h-14` 顶栏内。
- Tab 样式：`rounded-t-xl`、`border-t border-x`、`min-w-[120px] max-w-[180px]`。
- Active tab：`bg-[#1A1A1A]` + 顶部渐变指示条（`bg-gradient-to-r from-indigo-500 to-purple-400`）。
- Inactive tab：`bg-[#111]`。
- Close 按钮：`ml-auto`，hover 显示。
- 移除未使用的 `TAB_ICONS` / `Home` / `Network` / `Library` import。

#### 3. EditorTabView — 对齐原型编辑区
- 外层 `bg-[#1A1A1A]`，`flex-1 flex flex-col overflow-hidden`。
- 内容区 `max-w-3xl mx-auto py-16 px-10`（对齐原型 `#block-content-area`）。
- Title 改为 `text-3xl font-semibold` + 下方分割线 `h-px bg-white/[0.06]`。
- 空态居中，图标收缩为 32px。

#### 4. EditorOptionsMenu — 新增最小 UI
- More（`…`）按钮在标签栏右侧。
- 下拉菜单：VIEW OPTIONS（Block Edit / Classic Edit）、ACTIONS（Rename / Move to / Export as PDF / Delete）。
- 本轮仅 UI 状态，不接后端。
- 点击外部关闭（fixed overlay）。

### 遇到的问题与解决方式
| 问题 | 解决方式 |
|------|---------|
| 原 Editor 区域与 Home/Mind/Dock 共用容器 div，重构时闭合结构错乱 | 将 Editor 和非 Editor 分为两个互斥条件渲染块（`isEditorActive` / `!isEditorActive`） |
| WorkspaceTabs 旧样式使用 `rounded-xl` + `h-8`，与原型 `rounded-t-xl` + 底部对齐不符 | 完全重写 WorkspaceTabs，对齐原型的 `items-end` + `rounded-t-xl` + border-top 风格 |

### 自动验证结果
- `git diff --check --cached`: 通过（exit code 0）
- `pnpm --dir apps/web typecheck`: 通过（0 errors）
- `pnpm --dir apps/web test`: 通过（13 files, 286 tests passed）
- `pnpm --dir apps/web lint`: 通过（0 errors，1 warning 在 demo prototype）
- `pnpm --dir apps/web build`: 通过（所有路由正常生成）

### 手工验证状态
- 未执行，等待用户后续统一验证。

### 是否可进入下一轮
- 等待 review。

### 下一轮风险
1. Editor 内容区仍为 textarea，需后续替换为 Block Editor。
2. Editor Options 下拉菜单仅 UI，功能待接后端。
3. Classic Toolbar 尚未实现（原型有 Bold/Italic/Code 等按钮）。

---

## Phase Refactory Round 8 Frontend (2026-04-28): Editor 顶栏遮挡修复

### 时间统计
- 开始时间：2026-04-28 17:09
- 结束时间：2026-04-28 17:13
- 工作时长：4 分钟

### 本轮目标
修复 Editor view 中 editor tabs 被固定 TopNav 遮挡的问题。

### 变更内容

#### 1. page.tsx — Editor 面板增加顶部偏移
- 在 Editor 场景容器上增加 `mt-[72px]`（TopNav 高度 48px + 间距 24px）。
- 使 `h-14 bg-[#161616]` 标签栏完整暴露于 TopNav 下方，不再重叠。
- Home/Mind/Dock 视图不受此改动影响（它们仍在 `!isEditorActive` 分支内）。

### 遇到的问题与解决方式
| 问题 | 解决方式 |
|------|---------|
| Editor 面板的 `h-14` 标签栏与 `fixed` 定位的 TopNav 重叠 | 给 Editor 容器增加 `mt-[72px]`，留出 TopNav 占用空间 |

### 自动验证结果
- `git diff --check --cached`: 通过（exit code 0）
- `pnpm --dir apps/web typecheck`: 通过（0 errors）
- `pnpm --dir apps/web test`: 通过（13 files, 286 tests passed）
- `pnpm --dir apps/web lint`: 通过（0 errors，1 warning 在 demo prototype）
- `pnpm --dir apps/web build`: 通过（所有路由正常生成）

### 手工验证状态
- 未执行，等待用户后续统一验证。

### 是否可进入下一轮
- 等待 review。

### 下一轮风险
1. Editor 面板的 `mt-[72px]` 为硬编码值，若 TopNav 高度变化需同步调整。
2. 后续可考虑让 TopNav 在 Editor 场景下自动进入 collapsed 状态，进一步释放空间。
4. Context Panel（右侧抽屉）未实现。

---

## Phase Refactory Round 9 Frontend (2026-04-28): 日志流程修正 + Classic Toolbar 最小 UI

### 时间统计
- 开始时间：2026-04-28 17:31
- 结束时间：2026-04-28 21:47
- 工作时长：4 小时 16 分钟

### 日志规范更正
后续开发日志统一使用「手工验证标准」，不再使用「手工验证状态」。

### 本轮目标
1. 修正日志流程：明确手工验证标准。
2. 继续缩小 Editor 与原型 gap，实现 Classic Toolbar 最小 UI。

### 变更内容

#### 1. 日志流程修正
- 后续日志统一使用「手工验证标准」小节，列出具体可执行的验证 checklist。
- 不再写「未执行，等待用户后续统一验证」等笼统描述。

#### 2. Classic Toolbar 最小 UI
- 在 Editor 工作区内加入 `h-10 bg-[#161616] border-b border-white/[0.06]` toolbar。
- 图标按钮（lucide）：Bold、Italic、Strikethrough、Link、Code、Image、Bullet List、Numbered List。
- 按钮分组用 `w-px h-4 bg-white/[0.06] mx-2` 竖线分隔。
- 按钮只做 UI，不实现真实 Markdown 插入。

### 手工验证标准
1. 打开 `/workspace`。
2. 进入 Editor（通过 Home 新建文档或 Dock 打开文档）。
3. 确认 TopNav 不遮挡 editor tabs / + 按钮 / More 按钮。
4. 新建 tab 可出现（点击 + 按钮）。
5. 关闭 editor tab 可用（hover 显示 x，点击关闭）。
6. 修改标题或正文后保存按钮出现且可保存。
7. Classic Toolbar 可见，包含 Bold / Italic / Strikethrough / Link / Code / Image / Bullet List / Numbered List 图标按钮。
8. Toolbar 按钮 hover 有反馈（颜色变化）。

### 自动验证结果
- `git diff --check --cached`: 通过（exit code 0）
- `pnpm --dir apps/web typecheck`: 通过（0 errors）
- `pnpm --dir apps/web test`: 通过（13 files, 286 tests passed）
- `pnpm --dir apps/web lint`: 通过（0 errors，1 warning 在 demo prototype）
- `pnpm --dir apps/web build`: 通过（所有路由正常生成）

### 是否可进入下一轮
- 等待 review。

### 下一轮风险
1. Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入。
2. Preview 切换按钮（`btn-toggle-preview`）尚未实现。
3. Context Panel（右侧抽屉）未实现。

---

## Phase Refactory Round 10 Frontend (2026-04-28): 修复关闭 Editor Tab 黑屏

### 时间统计
- 开始时间：2026-04-28 22:00
- 结束时间：2026-04-28 22:05
- 工作时长：5 分钟

### 本轮目标
修复关闭任意 editor tab 后页面黑屏只剩 TopNav 的问题。

### 问题根因
`handleCloseTab` 无条件将 `editingItemId` 设为 `null`，导致 `isEditorActive`（依赖 `editingItemId != null`）立即变为 `false`。但 `activeModule` 在切换到另一个 editor tab 时仍为 `'editor'`。此时：
- `{isEditorActive && activeModule === 'editor'}` → false（不渲染 Editor 面板）
- `{!isEditorActive && (...)}` 中 `activeModule === 'editor'` 不匹配 home/mind/dock → 什么都不渲染 → 黑屏。

### 修复方式
重写 `handleCloseTab`：
- 关闭 active editor tab 后若切换到另一个 editor tab，同步设置 `editingItemId` 为新 tab 的 `documentId`，并加载对应 title/content。
- 若切换到 home/mind/dock，才将 `editingItemId` 设为 `null`。
- 关闭非 active tab 时，`editingItemId` 保持不变。
- 依赖数组增加 `items`。

### 自动验证结果
- `pnpm --dir apps/web typecheck`: 通过（0 errors）
- `pnpm --dir apps/web test`: 通过（13 files, 286 tests passed）
- `pnpm --dir apps/web lint`: 通过（0 errors，1 warning 在 demo prototype）
- `pnpm --dir apps/web build`: 通过（所有路由正常生成）

### 手工验证标准
1. 打开 `/workspace`。
2. 进入 Editor（新建或打开文档）。
3. 新建多个 editor tab。
4. 关闭任意一个 editor tab，页面不应黑屏，应自动切换到相邻 tab 并显示内容。
5. 关闭最后一个 editor tab，应正确回退到 Home 视图。
6. TopNav 状态与当前视图一致。

### 是否可进入下一轮
- 等待 review。

### 下一轮风险
1. Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入。
2. Preview 切换按钮（`btn-toggle-preview`）尚未实现。
3. Context Panel（右侧抽屉）未实现。
4. Block Edit 模式尚未实现。

---

## Phase Refactory Round 11 Frontend (2026-04-28): Editor Preview / Context Panel 最小 UI 对齐

### 时间统计
- 开始时间：2026-04-28 22:15
- 结束时间：2026-04-28 22:30
- 工作时长：15 分钟

### 本轮目标
继续缩小真实 Editor 与原型 Editor 的差距，实现 Preview 与 Context Panel 的最小 UI，不做真实编辑器引擎。

### 变更内容
1. **Preview 最小 UI**
   - 在 Editor toolbar 右侧加入 Preview toggle（`BookOpen` 图标）。
   - 打开 preview 后，Editor 内容区呈左右 split：
     - 左侧编辑区保留，宽度自适应（`max-w-[50%]`）。
     - 右侧 preview pane：`bg-[#111]`、`border-l border-white/[0.06]`、`p-10`。
   - Preview 内容为简单文本预览（标题 + 正文 `whitespace-pre-wrap`），不要求完整 Markdown parser。
   - 关闭 preview 后恢复单栏编辑。

2. **Context Panel 最小 UI**
   - 在 Editor toolbar 右侧加入 Context Panel toggle（`PanelRight` 图标）。
   - 打开后右侧出现绝对定位抽屉：
     - `bg-[#161616]`、`border-l border-white/[0.06]`、`w-72`。
     - 标题 "Context Links"（`text-xs font-semibold uppercase tracking-wider text-slate-500`）。
     - 关闭按钮（`X` 图标）。
   - 内容为 3 张静态占位卡片（UX Guidelines / Engine Spec / API Reference），不接后端。
   - 抽屉可关闭。

3. **Toolbar 扩展**
   - toolbar 右侧增加 `flex-1` 占位，将 toggle 按钮推到最右。
   - Preview / Context Panel toggle 按钮带 active 状态样式（`text-white` vs `text-slate-500`）。

### 遇到的问题与解决方式
- 无重大问题。Preview 与 Context Panel 均为纯 UI 状态，不改动保存链路。

### 自动验证结果
- `git diff --check --cached`: 通过（exit code 0）
- `pnpm --dir apps/web typecheck`: 通过（0 errors）
- `pnpm --dir apps/web test`: 通过（13 files, 286 tests passed）
- `pnpm --dir apps/web lint`: 通过（0 errors，1 warning 在 demo prototype）
- `pnpm --dir apps/web build`: 通过（所有路由正常生成）

### 手工验证标准
1. 打开 `/workspace`。
2. 进入 Editor（新建或打开文档）。
3. 点击 Preview toggle（BookOpen 图标），确认右侧预览区出现，显示标题与正文。
4. 再次点击 Preview toggle，确认恢复单栏编辑。
5. 打开 Context Panel toggle（PanelRight 图标），确认右侧抽屉出现，显示 3 张占位卡片。
6. 点击抽屉右上角 X 或再次点击 Context Panel toggle，确认抽屉消失。
7. 保存功能仍可用（修改内容后保存按钮出现且可点击）。
8. 关闭 tab 不黑屏。
9. TopNav 不遮挡 editor tabs。

### 是否可进入下一轮
- 等待 review。

### 下一轮风险
1. Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入。
2. Block Edit 模式尚未实现。
3. Preview 目前仅为简单文本预览，未实现完整 Markdown 渲染。

---

## Phase Refactory Round 12 Frontend (2026-04-28): 修复新建文档生命周期 + Block/Classic 模式切换

### 时间统计
- 开始时间：2026-04-28 22:38
- 结束时间：2026-04-28 22:55
- 工作时长：17 分钟

### 本轮目标
1. 修复新建空文档自动落库问题：新建 editor tab 时只创建前端本地 draft，不调用 createDockItem，保存时才落库。
2. 继续缩小 Editor 与原型差距：实现 Block Edit / Classic Edit 模式切换最小 UI。

### 变更内容

**目标 A：本地 draft tab 不自动落库**
1. **draft ID 生成**：使用 `useRef` 维护递减的负整数 draft ID（`-1, -2, -3...`），与真实 Dock documentId（正整数）区分。
2. **createDraftTab**：新建纯前端 draft tab，标题为 "Untitled"，正文为空，`editingItemId` 为负 draft ID，不调用任何后端接口。
3. **handleNewNote**：改为调用 `createDraftTab`，不再自动创建 Dock 条目。
4. **handleSaveEditor**：
   - 识别 draft：`editingItemId < 0`
   - draft 保存时：若标题和正文都为空，给出轻量提示（`setError`）不落库；否则调用 `createDockItem` + `upsertMindNode`，然后将 tab 从 draft 转换为真实 document tab（更新 tab id、documentId、title）。
   - 已有文档保存时：继续调用 `updateDockItemText`。
5. **handleActivateTab**：切换至 draft tab 时，不从 items 加载内容，保持前端状态。
6. **handleCloseTab**：关闭 draft tab 后直接丢弃，不落库；切换到其他 editor tab 时正确加载内容。
7. **isEditorActive 判断**：保留 `activeTabId.startsWith('tab-editor-') && editingItemId != null`，draft 的负 ID 也能满足条件。

**目标 B：Block/Classic 模式切换最小 UI**
1. **EditorTabView 扩展 props**：接收 `mode: 'classic' | 'block'` 和 `isDraft: boolean`。
2. **Classic 模式**：保持现有 textarea + toolbar 不变。
3. **Block 模式最小 UI**：
   - toolbar 隐藏 Classic 工具按钮，只保留 Preview / Context Panel toggle。
   - 内容区呈 block 风格：
     - breadcrumb 行（Projects / Core Architecture）
     - 标题 block：带 hover 出现的左侧 add/drag 手柄（`Plus`、`GripVertical` 图标）
     - 正文 block：同样带手柄，textarea 输入
   - 深色背景、细边框、hover 反馈，不引入新库。
4. **保存按钮逻辑**：draft 时只要有标题或正文就显示保存按钮；已有文档保持 dirty 逻辑。
5. **EditorOptionsMenu**：
   - 接收 `mode` 和 `onSetMode` props。
   - Block Edit / Classic Edit 按钮可点击切换模式，带 `Check` 图标标识当前模式。
   - 点击后自动关闭下拉菜单。

### 遇到的问题与解决方式
1. **draftCounter 闭包问题**：最初用普通变量 `draftCounter` 在 `useCallback` 中导致 lint warning（依赖缺失）。改用 `useRef` 存储计数器，避免闭包陷阱。
2. **draft 保存后 tab 转换**：需要同步更新 `tabs` 数组中的 tab id 和 documentId，并切换 `activeTabId`，否则保存后 tab 状态不一致。通过 `setTabs(prev => prev.map(...))` 实现。

### 自动验证结果
- `git diff --check --cached`: 通过（exit code 0）
- `pnpm --dir apps/web typecheck`: 通过（0 errors）
- `pnpm --dir apps/web test`: 通过（13 files, 286 tests passed）
- `pnpm --dir apps/web lint`: 通过（0 errors，1 warning 在 demo prototype）
- `pnpm --dir apps/web build`: 通过（所有路由正常生成）

### 手工验证标准
1. 打开 `/workspace`。
2. 点击 TopNav Editor，在没有文档时进入本地 draft editor（标题 Untitled，正文为空）。
3. 不输入内容直接关闭 tab，Dock 不新增 New Note/Untitled。
4. 新建 draft，输入内容但不保存，关闭后 Dock 不新增文档。
5. 新建 draft，输入内容后保存，Dock 才出现对应文档，tab 从 draft 转为真实文档 tab。
6. 从 Dock/Home 打开已有文档，保存走更新逻辑（不新建）。
7. Classic / Block 模式切换正常（通过 Editor Options 下拉菜单）。
8. Preview / Context Panel 在 Classic 和 Block 模式下都正常。
9. 关闭 tab 不黑屏。

### 是否可进入下一轮
- 等待 review。

### 下一轮风险
1. Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入。
2. Block Edit 目前只有最小可见 UI，未实现真实 block engine（block 增删、拖拽、类型切换）。
3. Preview 目前仅为简单文本预览，未实现完整 Markdown 渲染。

---

## Phase Refactory Round 13 Frontend (2026-04-28): 修复 draft tab 独立状态 + Block 模式视觉优化

### 时间统计
- 开始时间：2026-04-28 23:03
- 结束时间：2026-04-28 23:20
- 工作时长：17 分钟

### 本轮目标
1. 修复 draft tab 状态：为每个本地 draft 保存独立 title/content，不允许多个 draft 共用全局 editorTitle/editorContent 后丢失或串内容。
2. 继续缩小 Editor 与原型 gap：Block 模式视觉优化。

### 变更内容

**目标 A：draft map 独立状态管理**
1. **新增 drafts state**：`const [drafts, setDrafts] = useState<Record<number, { title: string; content: string }>>({})`
2. **createDraftTab**：生成 draftId 后，写入 `drafts[draftId] = { title: '', content: '' }`，然后激活该 draft。
3. **draft 编辑同步**：`onTitleChange` / `onContentChange` 在 draft 模式下同步更新 `drafts[editingItemId]`。
4. **handleActivateTab 切换 draft**：从 `drafts[draftId]` 恢复 title/content，不再依赖 tab.title 或全局状态。
5. **handleCloseTab 关闭 draft**：从 `drafts` 中删除对应 draft；若切换到另一个 draft，加载另一个 draft 的 title/content。
6. **handleSaveEditor 保存 draft**：
   - 从 `drafts[editingItemId]` 读取 title/content 进行保存。
   - 保存成功后删除旧 `drafts[draftId]`，tab 转为真实 document tab。
7. **已有 Dock 文档**：保存仍走 `updateDockItemText`，不新建文档。

**目标 B：Block 模式视觉优化**
1. **去掉硬编码 breadcrumb**："Projects / Core Architecture" 改为 "Drafts / {当前标题或 Untitled}"，更中性且不误导。
2. **block hover 边界优化**：标题 block 和正文 block 增加 `rounded-lg border border-transparent hover:border-white/[0.06] hover:bg-white/[0.02]`，更贴近原型的细边框和深色 hover 背景。
3. **输入框内边距调整**：`px-2 -mx-2` 让输入文字与 block 边界对齐，hover 时视觉效果更自然。
4. **间距微调**：标题与正文 block 间距从 `mt-4 space-y-2` 改为 `mt-2 space-y-1`，更紧凑。

### 遇到的问题与解决方式
1. **lint error: Forbidden non-null assertion**：`handleCloseTab` 中 `closingTab.documentId!` 触发 eslint 报错。通过提取常量 `const closingDocId = closingTab?.documentId` 后使用 `delete d[closingDocId]` 解决。

### 自动验证结果
- `git diff --check --cached`: 通过（exit code 0）
- `pnpm --dir apps/web typecheck`: 通过（0 errors）
- `pnpm --dir apps/web test`: 通过（13 files, 286 tests passed）
- `pnpm --dir apps/web lint`: 通过（0 errors，1 warning 在 demo prototype）
- `pnpm --dir apps/web build`: 通过（所有路由正常生成）

### 手工验证标准
1. 打开 `/workspace`。
2. 新建 draft A，输入标题和正文，不保存。
3. 新建 draft B，输入不同标题和正文，不保存。
4. 在 draft A/B 之间切换，确认内容不串、不丢。
5. 关闭 draft A，Dock 不新增文档。
6. 保存 draft B，Dock 才新增文档，tab 转真实文档。
7. 打开已有 Dock 文档，保存走更新逻辑。
8. Classic/Block 切换正常。
9. Preview/Context Panel 正常。
10. 关闭 tab 不黑屏。

### 是否可进入下一轮
- 等待 review。

### 下一轮风险
1. Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入。
2. Block Edit 目前只有最小可见 UI，未实现真实 block engine（block 增删、拖拽、类型切换）。
3. Preview 目前仅为简单文本预览，未实现完整 Markdown 渲染。
## 日志更正说明 (2026-04-28)

Round 13 标题使用了英文（"Phase Refactory Round 13 Frontend"），未做到全中文标题要求。从本轮（第 14 轮）开始修正，后续所有日志标题均使用全中文，不再使用英文标题前缀。

---

## 第 14 轮前端重构 (2026-04-28): 日志更正 + Dock Finder 原型迁移 + Editor 收口

### 时间统计
- 开始时间：2026-04-28 23:27
- 结束时间：2026-04-28 23:45
- 工作时长：18 分钟

### 本轮目标
1. 增量修正日志流程，标注 Round 13 标题问题。
2. Dock 视图按原型做第一批迁移，改为 Finder/Miller Columns 基础结构。
3. Editor 少量收口：修复已有文档 tab 切换时 dirty 状态残留问题。

### 变更内容

**目标 A：日志流程修正**
- 在文件末尾追加更正说明，标注 Round 13 标题未全中文问题，从本轮开始修正。

**目标 B：Dock Finder/Miller Columns 迁移**
1. **组件重命名**：`DockInlineView` → `DockFinderView`。
2. **左侧侧边栏**（w-48，bg-[#161616]）：
   - SHORTCUTS 区：Inbox（"所有条目"），显示条目总数，点击清除选中。
   - STATUS 区：按 pending/suggested/archived/reopened 分组，带状态图标和计数。
   - ACTIONS 区：录入按钮（打开 FloatingRecorder）。
3. **中间主栏**（flex-1 overflow-y）：
   - item row 风格贴近原型 `.finder-item`：`rounded-md`、图标 + 标题 + 状态标签。
   - 选中态：`bg-emerald-500/90 text-[#111] font-medium` 与原型 accent 色对齐。
   - hover 态：`hover:bg-white/[0.06]`。
   - 显示 `topic || rawText.slice(0, 50)` 和状态标签。
4. **右侧 preview panel**（w-80，bg-[#161616]，shadow-xl）：
   - 顶部状态标签 + 关闭按钮。
   - 文件图标（w-24 h-24 rounded-2xl，bg-white/5、border）。
   - 标题 + 类型描述（Document · Markdown）。
   - 内容预览区（line-clamp-4）。
   - 操作区：suggest/archive/reopen/open-in-editor，按当前状态显示对应按钮。
5. **功能保持不变**：
   - archive/reopen/suggest 调用链完整。
   - "在编辑器中打开" 点击后进入 Editor 并打开真实文档 tab。
   - 加载/错误/空态状态保留。

**目标 C：Editor dirty 状态修复**
- 在 `EditorTabView` 中新增 `useEffect`：监听 `editingItemId` 变化，重置 `dirty` 为 `false`。
- 修复场景：切换到另一个已有文档 tab 后，保存按钮不应错误显示（因为未修改过内容）。

### 遇到的问题与解决方式
1. **DockIcon 未使用**：旧组件替换后 `Dock as DockIcon` 不再使用，从 import 中移除，lint 通过。

### 自动验证结果
- `git diff --check --cached`: 通过（exit code 0）
- `pnpm --dir apps/web typecheck`: 通过（0 errors）
- `pnpm --dir apps/web test`: 通过（13 files, 286 tests passed）
- `pnpm --dir apps/web lint`: 通过（0 errors，1 warning 在 demo prototype）
- `pnpm --dir apps/web build`: 通过（所有路由正常生成）

### 手工验证标准
1. 打开 `/workspace`。
2. 进入 Dock，确认 Dock 呈 Finder/Miller Columns 基础布局（左侧侧边栏 + 中间列表 + 右侧预览面板）。
3. 点击 Dock item，右侧 preview panel 显示内容（标题、类型、内容预览、操作按钮）。
4. 点击 "在编辑器中打开"，进入 Editor 并打开真实文档。
5. archive/reopen/suggest 没有运行时报错（在 preview panel 操作区可见对应按钮）。
6. 新建两个 draft，切换内容不串、不丢。
7. 关闭未保存 draft，Dock 不新增文档。
8. 保存 draft 后 Dock 才新增文档。
9. 已有文档切换 tab 后保存按钮状态正确（不显示未保存）。
10. Classic/Block、Preview/Context Panel 仍可用。

### 是否可进入下一轮
- 等待 review。

### 下一轮风险
1. Dock Finder 目前为单层 column（flat items），未实现多层级文件夹导航。
2. Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入。
3. Block Edit 目前只有最小可见 UI，未实现真实 block engine。

---

## 日志更正说明 (2026-04-28)

1. 第 14 轮日志位置异常：实际追加在 Round 12/13 之前（文件第 766 行），系追加时未注意到文件末尾已有 Round 13 内容。后续以文件末尾追加记录为准。
2. 第 14 轮工时修正：实际开始时间 23:27，结束时间 23:45，工作时长应为 18 分钟，不是 13 分钟。
3. 从第 15 轮开始，所有日志统一在文件真实末尾追加，标题全中文，不再出现位置错乱。

---

## 第 15 轮前端重构 (2026-04-28): 日志更正 + Dock Finder 交互补齐 + 原型差距压缩

### 时间统计
- 开始时间：2026-04-28 23:50
- 结束时间：2026-04-28 23:54
- 工作时长：4 分钟

### 本轮目标
1. 增量修正日志：追加第 14 轮位置异常和工时修正说明。
2. Dock Finder 交互补齐：左侧 STATUS 分组实现可用筛选，active 样式明确，筛选后自动清空被隐藏条目的选中状态。
3. 继续缩小 Dock 与原型差距：中间栏增加 path bar，preview panel 按钮样式对齐原型。

### 变更内容

**目标 A：日志增量更正**
- 在文件真实末尾追加「日志更正说明」段落，说明第 14 轮日志位置异常（插在 Round 12/13 之前）和工时修正（18 分钟而非 13 分钟）。
- 明确后续以文件末尾追加记录为准。

**目标 B：Dock Finder 交互补齐**
1. **状态筛选 state**：`DockFinderView` 内新增 `filterStatus: EntryStatus | null`，默认 `null`（显示全部）。
2. **左侧 STATUS 点击筛选**：pending / suggested / archived / reopened 均可点击，点击后中间列表只显示对应状态条目。
3. **左侧 active 样式**：「所有条目」和每个 STATUS 项都有明确的选中态（`bg-emerald-500/90 text-[#111] font-medium`）与未选中态区分。
4. **自动清空选中**：`handleSelectFilter` 中判断若当前 `selectedItem` 的状态与新筛选状态不符，自动调用 `onSelectItem(null)`，避免右侧 preview panel 显示不在当前列表里的条目。
5. **右侧 preview 条件渲染**：使用 `effectiveSelectedItem`（仅在选中项存在于当前筛选列表时才显示），双重保险防止显示被隐藏条目。

**目标 C：缩小 Dock 与原型差距**
1. **中间栏 path bar**：在列表区顶部增加 `h-9` header，显示当前位置（如「所有条目 / 12 项」或「已归档 / 3 项」），对齐 Finder column 当前位置语义。
2. **空态文案细化**：筛选后空态显示「暂无已归档条目」等，比笼统「暂无条目」更明确。
3. **preview panel 按钮样式**：
   - suggest / archive / reopen 改为低调 ghost 样式（`text-slate-400 hover:text-white`，无背景色）。
   - 「在编辑器中打开」改为 accent 按钮样式（`bg-emerald-500/90 hover:bg-emerald-500 text-[#111]`），与原型主要操作按钮对齐。
4. **功能链路保持**：archive / reopen / suggest / open-in-editor 调用链完整，未改动后端。

### 遇到的问题与解决方式
- 无重大问题。筛选逻辑为纯前端状态，不引入新库，不改动后端。

### 自动验证结果
- `git diff --check --cached`: 通过（exit code 0）
- `pnpm --dir apps/web typecheck`: 通过（0 errors）
- `pnpm --dir apps/web test`: 通过（13 files, 286 tests passed）
- `pnpm --dir apps/web lint`: 通过（0 errors，1 warning 在 demo prototype）
- `pnpm --dir apps/web build`: 通过（所有路由正常生成）

### 手工验证标准
1. 打开 `/workspace`。
2. 进入 Dock，点击 STATUS 分组中的 pending / suggested / archived / reopened，确认中间列表只显示对应状态条目。
3. 点击「所有条目」，确认恢复显示全部列表。
4. 筛选切换后，若当前选中条目被隐藏，确认右侧 preview panel 自动关闭，不显示被隐藏条目。
5. 点击条目后，右侧 preview panel 正常显示内容、状态标签、操作按钮。
6. 点击「在编辑器中打开」，确认进入 Editor 并打开真实文档。
7. suggest / archive / reopen 点击后不报错。
8. 新建两个 draft，切换内容不串、不丢。
9. 关闭未保存 draft，确认 Dock 不新增文档。
10. Classic / Block、Preview / Context Panel 仍可用。

### 是否可进入下一轮
- 等待 review。

### 下一轮风险
1. Dock Finder 目前为单层 column（flat items），未实现多层级文件夹导航。
2. Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入。
3. Block Edit 目前只有最小可见 UI，未实现真实 block engine。

---
