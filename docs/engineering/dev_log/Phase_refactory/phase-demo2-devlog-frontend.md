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
