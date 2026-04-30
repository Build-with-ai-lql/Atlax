# Phase Refactory Frontend Development Log

| 开发日志信息 | |
|-------------|---------|
| 阶段 | Phase Refactory - 前端替换阶段 |
| 负责人 | Frontend Agent |
| 状态 | 进行中 |

---

<!-- ============================================ -->
<!-- 分割线：Round 42 -->
<!-- ============================================ -->

## Phase Refactory Round 42 devlog -- Editor 草稿自动保存

**时间戳**: 2026-05-01

**任务起止时间**: 02:00 ~ 02:30

**工时**: 30 分钟

**任务目标**: 为 Editor 接入最小可用的草稿自动保存能力，使用户编辑中的内容能够写入本地持久化层，并在刷新页面或重新打开时恢复。

**改动文件及行数**:
- `apps/web/lib/db.ts` | M | +35 行（EditorDraftRecord / PersistedEditorDraft 接口、editorDrafts 表定义 v16、editorDraftsTable 导出）
- `apps/web/lib/repository.ts` | M | +72 行（saveEditorDraft / loadEditorDraft / loadAllEditorDrafts / deleteEditorDraft 四个 CRUD 函数、toPersistedEditorDraft 辅助函数、editorDraftsTable 导入）
- `apps/web/app/workspace/features/editor/useAutosave.ts` | A | +117 行（新增 - useAutosave hook：debounce 1000ms、SaveStatus 类型、latestRef 避免 stale closure、performSaveWithValues 提取、flushSave 立即保存、内容变更检测、草稿/已有文档双路径保存、保存失败 fallback）
- `apps/web/app/workspace/page.tsx` | M | +90 行（导入 useAutosave / deleteEditorDraft / loadAllEditorDrafts、flushSaveRef 桥接、draftsRestored 状态、草稿恢复 useEffect、handleActivateTab 切换前 flush、handleCloseTab 关闭前 flush、handleModuleChange 切模块前 flush、handleSaveEditor 保存后清理 IndexedDB 草稿、handleCloseTab 关闭草稿清理 IndexedDB、useAutosave hook 调用、flushSaveRef.current 赋值、beforeunload / visibilitychange 事件 flush、saveStatus 传递给 EditorTabView）
- `apps/web/app/workspace/features/editor/EditorTabView.tsx` | M | +34 行（saveStatus prop、SaveStatus 类型导入、Loader2/Check/AlertCircle 图标导入、saveStatusLabel / saveStatusIcon 函数、两处"未保存"替换为保存状态反馈）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| useAutosave 在条件返回之后调用，违反 React Hooks 规则 | 将 hook 调用移至 early return 之前，使用独立变量 `_isEditorActive` / `_activeEditorTab` / `_isActiveDraft` 计算 |
| SaveStatus 类型导入后未在 page.tsx 中直接使用导致 lint error | 移除 page.tsx 中的 type SaveStatus 导入，仅在 EditorTabView 中导入 |
| 项目中无 debounce 工具函数 | 在 useAutosave hook 内部使用 useRef + setTimeout 实现内联 debounce |
| **Review 修复**：用户输入后立刻切换 tab / 关闭 tab / 切模块 / 刷新，debounce 中尚未写入的最后输入会丢失 | useAutosave 暴露 `flushSave()`，取消 debounce 计时器并立即保存当前内容；page.tsx 在 handleActivateTab / handleCloseTab / handleModuleChange 前调用 flush |
| **Review 修复**：flushSave 存在 stale closure 风险，可能保存旧 render 的值 | useAutosave 使用 `latestRef` 追踪最新 userId / editingItemId / editorTitle / editorContent / isDraft / enabled，flushSave 和 debounce callback 都从 latestRef.current 读取 |
| **Review 修复**：flushSave 定义在 handleActivateTab 之后，直接引用导致 TDZ | page.tsx 使用 `flushSaveRef = useRef<() => Promise<void>>()` 桥接，回调中调用 `flushSaveRef.current()`，useAutosave 返回后赋值 `flushSaveRef.current = flushSave` |
| **Review 修复**：页面刷新/关闭前 debounce 内容丢失 | 添加 `beforeunload` 和 `visibilitychange` 事件监听，在页面卸载或切到后台时调用 flushSaveRef.current() |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check` | ✅ (exit 0) |
| `git diff --cached --check` | ✅ (exit 0) |
| `pnpm --dir apps/web typecheck` | ✅ (0 errors) |
| `pnpm --dir apps/web lint` | ✅ (0 errors, 1 pre-existing warning: `no-img-element`) |

**手工验证步骤说明**:
1. 启动项目并打开 /workspace
2. 打开任意 Editor / Note / Dock item 编辑入口
3. 输入一段新内容，例如："draft autosave test"
4. 等待自动保存完成（1 秒 debounce 后，状态显示 "Saved"）
5. 刷新页面
6. 重新打开同一条内容 → "draft autosave test" 仍然存在
7. **编辑已有文档，输入后不等 1 秒立刻切到另一个 editor tab，再切回，内容仍在**
8. **编辑 draft，输入后不等 1 秒立刻切 tab，再切回，内容仍在**
9. **输入后刷新，已完成 debounce 的内容可恢复；beforeunload flush 会尝试保存 debounce 中的内容**
10. **模拟保存失败时显示 "Save failed" 红色图标且内容保留在内存**
11. 连续快速输入时不应导致明显卡顿
12. 控制台不应出现新增错误
13. Home / Mind / Dock / Tabs 主流程不应受影响

**复用的 repository / service / IndexedDB API**:
- `updateDockItemText(userId, id, rawText, topic?)` — repository.ts，已有文档自动保存时复用此函数更新 rawText 和 topic
- `saveEditorDraft(userId, draftKey, title, content)` — repository.ts 新增，草稿自动保存时写入 editorDrafts 表
- `loadAllEditorDrafts(userId)` — repository.ts 新增，页面加载时恢复所有草稿
- `deleteEditorDraft(userId, draftKey)` — repository.ts 新增，草稿保存/关闭时清理
- Dexie `editorDrafts` 表 — db.ts v16 新增，复用现有 Dexie IndexedDB 封装

**debounce 策略**: 用户输入内容后，等待 1000ms 无新输入再触发保存。每次新输入重置计时器。切换 tab / 关闭 tab / 切模块 / 页面卸载时通过 `flushSave()` 立即保存 debounce 中的 pending 内容，不依赖"等 1 秒后再切换"。

**保存状态反馈如何实现**: EditorTabView 接收 `saveStatus` prop（idle / saving / saved / failed），在保存按钮旁显示状态图标和文字：
- `saving`: 旋转 Loader2 图标 + "Saving..." 文字（灰色）
- `saved`: 绿色 Check 图标 + "Saved" 文字
- `failed`: 红色 AlertCircle 图标 + "Save failed" 文字
- `idle` + dirty: 原有 "未保存" 文字

**是否存在 fallback 逻辑**: 是。
1. editingItemId 为 null 时 autosave 不触发，不导致白屏或报错
2. 草稿恢复失败时 setDraftsRestored(true) 确保 UI 不卡住
3. 保存失败时保留内存内容，显示 "Save failed" 错误反馈
4. deleteEditorDraft 失败时仅 console.error，不影响主流程
5. 草稿恢复时如果已有同 ID 的 draft tab，不重复添加
6. flushSave 是 async，切 tab UI 先更新，但 flushSave 从 latestRef 读取当前值确保保存正确内容
7. beforeunload / visibilitychange 中 flush 为 fire-and-forget，不阻塞页面关闭

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 已有文档 autosave 使用 updateDockItemText 会触发 EditSavePolicy 重置 suggestions/status | 低 | 与手动保存行为一致，编辑中重置建议是合理的 |
| DB 版本从 v15 升级到 v16，用户首次访问会触发 IndexedDB 升级 | 低 | Dexie 自动处理，新表无数据迁移 |
| 草稿恢复后 draftCounterRef 从最小 draftKey-1 开始，避免 ID 冲突 | 低 | 已处理 |
| beforeunload 中 flush 为 fire-and-forget，极端情况浏览器可能在 IndexedDB 写入完成前关闭页面 | 低 | visibilitychange hidden 时也会 flush，双保险；且 debounce 仅 1 秒，大部分内容已在之前保存 |
| Dock project/folder CRUD 为 mock-only，刷新丢失 | 中 | 需后端 schema + BFF API（Round 39 遗留） |

---

<!-- ============================================ -->
<!-- 分割线：Round 41 -->
<!-- ============================================ -->

## Phase Refactory Round 41 devlog -- Workspace Tabs 持久化接入

**时间戳**: 2026-05-01

**任务起止时间**: 01:20 ~ 01:50

**工时**: 30 分钟

**任务目标**: 将 Workspace Tabs 接入现有本地持久化能力（Dexie IndexedDB），使用户打开的 tabs、active tab 在刷新页面后能够恢复。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +95 行（导入持久化函数和类型、fromPersistedTab 辅助函数、tabsRestored 状态、Tab 恢复 useEffect、编辑器内容同步 useEffect、openEditorTab 持久化、handleActivateTab 持久化、handleCloseTab 持久化、handlePinTab 持久化、handleModuleChange 持久化、handleSaveEditor 草稿保存后持久化）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| 前端 Tab ID（`tab-home`/`tab-editor-123`）与持久化 Tab ID（`user_wt_home`/`user_wt_editor_123`）格式不同 | 添加 `fromPersistedTab` 转换函数和 `makeWorkspaceTabId` 映射，双向转换 |
| 草稿 tab（documentId < 0）不应持久化 | 所有持久化调用前检查 `documentId < 0` 跳过 |
| 恢复 editor tab 时 dock items 可能未加载 | 添加编辑器内容同步 useEffect，在 items 加载后自动填充 editor 内容 |
| 恢复的 tabs 中可能没有 home tab | 恢复时检查并自动补充 home tab 作为 fallback |
| 持久化失败不应导致白屏 | 所有持久化调用使用 `.catch()` 静默处理错误，恢复失败时保留默认状态 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check` | ✅ (exit 0) |
| `git diff --cached --check` | ✅ (exit 0) |
| `pnpm --dir apps/web typecheck` | ✅ (0 errors) |
| `pnpm --dir apps/web lint` | ✅ (0 errors, 1 pre-existing warning: `no-img-element`) |

**手工验证步骤说明**:
1. 启动项目并打开 /workspace
2. 打开至少 2 个不同 tab（例如 Dock item / Editor item / Mind view）
3. 切换到第二个 tab
4. 刷新页面
5. 页面恢复刷新前打开的 tabs
6. active tab 恢复为刷新前选中的第二个 tab
7. 关闭其中一个 tab
8. 再次刷新页面
9. 被关闭的 tab 不应重新出现
10. 如果清空本地 tabs 或首次进入，页面应正常显示默认 workspace 状态
11. 控制台不应出现新增错误
12. Home / Mind / Dock / Editor 主流程不应受影响

**复用的 repository / service / IndexedDB API**:
- `openWorkspaceTab(input)` — repository.ts，打开 tab 并写入 IndexedDB workspaceOpenTabs 表
- `closeWorkspaceTab(userId, tabId)` — repository.ts，关闭 tab 并从 IndexedDB 移除
- `activateWorkspaceTab(userId, tabId)` — repository.ts，激活 tab 并更新 isActive 标记
- `pinWorkspaceTab(userId, tabId, pinned?)` — repository.ts，固定/取消固定 tab
- `restoreWorkspaceTabs(userId)` — repository.ts，恢复用户所有打开的 tab
- `recordRecentDocumentOpen(input)` — repository.ts，记录最近打开的文档
- `makeWorkspaceTabId(userId, tabType, documentId?)` — @atlax/domain，生成持久化 tab ID
- `StoredWorkspaceOpenTab` — repository.ts/db.ts，持久化 tab 记录类型

**是否新增了 API**: 否。完全复用现有 repository 函数和 domain 类型。

**是否存在 fallback 逻辑**: 是。
1. 持久化恢复失败时保留默认状态（home tab），`catch` 中 `setTabsRestored(true)` 确保 UI 不卡住
2. 恢复的 tabs 为空时保留默认 `useState` 初始值（home tab）
3. 恢复的 tabs 不含 home tab 时自动补充
4. 持久化写入失败时仅 `console.error`，不影响 UI 操作
5. 草稿 tab 不持久化，关闭后自然消失

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 恢复的 editor tab 对应的 dock item 可能已被删除 | 低 | editor 会显示空内容，用户可关闭 tab |
| 持久化调用为 fire-and-forget，极端情况下内存态与 DB 态可能短暂不一致 | 低 | 不影响 UI 交互，下次刷新会以 DB 为准 |
| Dock project/folder CRUD 为 mock-only，刷新丢失 | 中 | 需后端 schema + BFF API（Round 39 遗留） |

---

<!-- ============================================ -->
<!-- 分割线：Round 40 -->
<!-- ============================================ -->

## Phase Refactory Round 40 devlog -- Dock Add Tag 接入真实 API

**时间戳**: 2026-05-01

**任务起止时间**: 01:00 ~ 01:20

**工时**: 20 分钟

**任务目标**: 将 Dock Detail Panel 的 Add Tag 交互从 mock/Toast 级别反馈接入真实本地数据能力，使用户添加的标签能够写入当前记录（IndexedDB），并在刷新页面后仍然存在。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +35 行（导入 addTagToItem/getOrCreateTag、新增 handleAddTag 回调含 null 检查与 throw、DockFinderView 新增 onAddTag prop、替换 mock handleAddTag 为真实 API 调用、添加 addingTag loading 状态、重复/空值/trim 校验、UI disabled 状态、失败时保留输入内容不关闭输入框）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| DockFinderView 中 handleAddTag 为 mock 实现，仅 Toast 不写入数据 | 替换为调用 onAddTag prop → addTagToItem + getOrCreateTag → refreshAll 刷新 UI |
| 重复 tag 会重复写入 | 在 handleAddTag 中前置 isDuplicate 检查（大小写不敏感），addTagToItem 内部也有 dedupeTagNames 兜底 |
| 空字符串或纯空格会写入无效 tag | handleAddTag 中 trimmed 为空直接 return，addTagToItem 内部 normalizeTagName 也会过滤空值 |
| 添加过程中用户可重复点击 | 新增 addingTag 状态，输入框和按钮添加 disabled 逻辑 |
| **Review 修复**：父级 handleAddTag 吞掉错误，catch 后不 throw | catch 中 setError 后 re-throw e，让错误传播到子组件 |
| **Review 修复**：addTagToItem 返回 null 时未视为失败 | `const updated = await addTagToItem(...)` → `if (!updated) throw new Error(...)` |
| **Review 修复**：无 userId 时静默 return | 改为 `throw new Error('未登录，无法添加标签')` |
| **Review 修复**：写入失败时清空输入框并关闭，显示成功 | 子级 catch 中只 toast 'Failed to add tag'，不清空输入、不关闭输入框；成功路径（try 内）才清空+关闭 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check` | ✅ (exit 0) |
| `git diff --cached --check` | ✅ (exit 0) |
| `pnpm --dir apps/web typecheck` | ✅ (0 errors) |
| `pnpm --dir apps/web lint` | ✅ (0 errors, 1 pre-existing warning: `no-img-element`) |

**手工验证步骤说明**:
1. 启动项目并打开 /workspace
2. 进入 Dock 区域
3. 打开任意 Dock item 的 Detail Panel（右侧面板）
4. 点击 + 按钮添加 Tag
5. 输入 "test-tag"，按 Enter 或点击 Add
6. 标签应立即显示在当前 Dock item 的 TAGS 区域
7. 刷新页面，再次打开同一个 Dock item，test-tag 仍然存在
8. 再次添加 "test-tag"，应提示 "already exists" 且不重复写入
9. 输入空字符串或纯空格，不应写入标签
10. 模拟写入失败时：输入框保留内容，不关闭，toast 显示 "Failed to add tag"
11. Home / Mind / Editor 主流程不应受影响

**复用的 repository / service / IndexedDB API**:
- `addTagToItem(userId, id, tagName)` — repository.ts:524，将 tag 写入 DockItem.userTags 并持久化到 IndexedDB dockItems 表
- `getOrCreateTag(userId, name)` — repository.ts:581，确保 tag 存在于 IndexedDB tags 表（用于全局标签索引）
- `normalizeTagName` / `dedupeTagNames` — @atlax/domain tag-service.ts，标签名规范化和去重

**是否新增了 API**: 否。完全复用现有 repository 函数。

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 无新增风险 | - | 仅替换 mock 为真实 API 调用，数据流与现有 archive/suggest/reopen 一致 |
| Dock project/folder CRUD 为 mock-only，刷新丢失 | 中 | 需后端 schema + BFF API（Round 39 遗留） |
| Mind node/edge 完整 CRUD 部分可用 | 低 | 需 delete/update API（Round 39 遗留） |

---

<!-- ============================================ -->
<!-- 分割线：Round 39 -->
<!-- ============================================ -->

## Phase Refactory Round 39 devlog -- 前端替换阶段最终收口 QA

**时间戳**: 2026-04-29

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 前端替换阶段最后一轮。只修最终 review 中的阻塞问题、跑全量验证、整理验收清单。禁止新增功能，禁止重构大模块，禁止后端改动。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +35 行（ColumnListView.handleNodeClick 空 folder 选中修复、mergedRoots 两阶段合并修复）
- `apps/web/app/workspace/_components/QuickNote.tsx` | M | +45 行（保存失败保护、saving 状态、关闭按钮 disabled）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +60 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| 点击空 project/folder 时只 toast 不设 selectedColumnNode | 点击任何 project/folder 都先 setSelectedColumnNode(node)，有 children 时 push 到 columnStack |
| mergedRoots 先处理 mockTreeNodes 再处理 externalMockNodes 导致 child 变 orphan | 分两阶段合并：先合并所有 project 类型 mock，再合并非 project 类型 mock |
| Quick Note 关闭时先 toast 成功再 await onSave，保存失败内容已丢失 | 增加 saving 状态，先 await onSave → 成功后清空隐藏，失败时保留内容窗口保持 OPEN |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --cached --check` | ✅ |
| `pnpm --dir apps/web typecheck` | ✅ (0 errors) |
| `pnpm --dir apps/web lint` | ✅ (0 errors, 1 pre-existing warning: `no-img-element`) |
| `pnpm --dir apps/web build` | ✅ (9 pages generated, workspace 42 kB) |

**手工验证步骤说明**:
1. 点击空 folder 后，点击 `+ Folder`，新 folder 出现在该空 folder 下
2. Sidebar 新建 Project Folder → 进入 Dock 点击该 mock project → 点 `+ Folder` → 子 folder 出现在该 project 下 → 再点子 folder 继续 `+ Folder` → 可创建二级 folder
3. 切换 Grid/List/Columns 后不重复、不串组
4. Quick Note 正常保存成功：创建 Dock item + Mind node，便签关闭
5. Quick Note 模拟失败时：文本不丢，窗口不关闭
6. 连续点击红色关闭不会重复创建多条

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Dock project/folder CRUD 为 mock-only，刷新丢失 | 中 | 需后端 schema + BFF API |
| Mind node/edge 完整 CRUD 部分可用 | 低 | 需 delete/update API |
| Floating Chat AI 为硬编码 mock | 低 | 需 LLM 接入 |

---

<!-- ============================================ -->
<!-- 分割线：Round 38 -->
<!-- ============================================ -->

## Phase Refactory Round 38 devlog -- 前端替换阶段收尾修补

**时间戳**: 2026-04-29

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 在两轮内结束前端替换阶段。本轮只修当前手测和 review 的 P1 阻塞，不引入新模块，不做后端，不做 shared World Tree engine 大重构。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +85 行（Dock 新建文件夹支持指定目录、mock tree merge mutation 修复、TopNav pinned sidebar 跟随、Editor 点击编辑区自动回缩、Mind 首屏节点布局、Dock 层级后端边界注释）
- `apps/web/app/workspace/_components/QuickNote.tsx` | A | +380 行（新增 - 沉浸式全局快捷便签组件）
- `apps/web/app/workspace/_components/GoldenTopNav.tsx` | M | +25 行（onCollapseRequest / onExpandRequest props）
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +30 行（首屏节点初始化 jitter、force 模式 calculateTargetPositions）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +70 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| handleCreateMockFolder 引用 mergedRoots 导致循环依赖 | 改用 dockTreeViewModel.roots 查找 parent |
| ESLint no-non-null-assertion 规则 | 用 parentRef?: DockTreeNode + optional chaining 替代 ! |
| leafNodeDefs.forEach 移除 i 参数后 build 报错 | 恢复 i 参数 |
| QuickNote 拖拽时 transition 干扰 | pointerdown 时设 transition: none，pointerup 时恢复；用 inlineStyleRef + forceRender 避免实时坐标放入 State |
| QuickNote 关闭后位置残留 | 关闭时清除 inlineStyleRef.current，使下次打开恢复默认位置 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --cached --check` | ✅ |
| `pnpm --dir apps/web typecheck` | ✅ |
| `pnpm --dir apps/web lint` | ✅ (0 errors, 1 pre-existing warning) |
| `pnpm --dir apps/web build` | ✅ (9 pages generated) |

**手工验证步骤说明**:
1. Dock 新建 folder 可在当前选中目录/当前 column path 下创建 mock folder
2. Dock 层级展示不重复、不串组、不 mutate 原始 adapter tree
3. TopNav pinned sidebar 下展开后跟随主界面中心
4. Editor 点击编辑区后 TopNav 自动回缩
5. Mind 首屏节点分布在合理位置，不从 root 爆开或飞出屏幕
6. Quick Note 三态状态机完整（HIDDEN/OPEN/MINIMIZED）
7. Quick Note 拖拽物理引擎手写、落库闭环、过渡动效丝滑

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Mock 持久化刷新后消失 | 中 | 需后端 schema 支持 |
| Shared graph engine 未统一 | 低 | NebulaBackground 仍为独立 canvas |
| Mind force 模式节点可能出界 | 低 | 可考虑添加边界 clamp |

---

<!-- ============================================ -->
<!-- 分割线：Round 33 -->
<!-- ============================================ -->

## Phase Refactory Round 33 devlog -- Dock 真实数据桥与 Sidebar 文档映射

**时间戳**: 2026-04-29

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 聚焦 Dock 与 Mind/Sidebar/Editor 的真实数据桥，修复 Dock 当前"按钮能切换但视图不变 / tree adapter 不稳定 / document identity 依赖 label 猜测"的问题。

**改动文件及行数**:
- `apps/web/app/workspace/features/dock/dockTreeAdapter.ts` | M | +120 行（Dock Tree Adapter 重写：selectedProject 优先分组、inferProjectGroup fallback、node 结构增强 documentId/contentType/tags/preview）
- `apps/web/app/workspace/page.tsx` | M | +95 行（DockFinderView 三视图真切换、Dock Preview Panel 打通 Mind/Editor、Sidebar Document Identity 收口、onCreateEdge 类型收口）
- `apps/web/app/workspace/_components/GlobalSidebar.tsx` | M | +20 行（documents prop 结构化文档描述符）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +55 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --cached --check` | ✅ 无空白错误 |
| `pnpm --dir apps/web typecheck` | ✅ 通过 |
| `pnpm --dir apps/web lint` | ✅ 通过 |

**手工验证步骤说明**:
1. Dock Columns 点击 folder 会增加/切换列
2. Dock Grid/List/Columns 三个按钮切换后视图明显不同
3. Dock preview 的 Edit Content 打开 Editor
4. Dock preview 的 View in Graph 切到 Mind 并有可感知反馈
5. Sidebar 文档入口打开真实 Editor 文档
6. Project folder 点击会切到 Dock 并影响 Dock 展示
7. 所有新增按钮无 silent no-op

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Dock Tree Adapter 尚未被 Dock UI 实际消费（Miller Columns 未实现） | 中 | 后端 API 就绪，前端需实现 Miller Columns |
| Sidebar document identity 仍部分依赖 label | 低 | 已通过 dockItemId 结构化映射改善 |

---

<!-- ============================================ -->
<!-- 分割线：Round 32 -->
<!-- ============================================ -->

## Phase Refactory Round 32 devlog -- Mind 语义节点与 Filter 真闭环修复

**时间戳**: 2026-04-29

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 修复 Mind 节点类型保真、Show Orphans 被 synthetic 边干扰、Show Tags 逻辑、Draft save 复用、类型边界收口。

**改动文件及行数**:
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +85 行（leaf 节点 type 从 'document' 改为 n.nodeType、DOCUMENT_LIKE_TYPES、NODE_BADGE_STYLES、nodeTypeLabel 扩展）
- `apps/web/app/workspace/features/mind/graphAdapter.ts` | M | +25 行（GEdge 新增 synthetic 字段）
- `apps/web/app/workspace/page.tsx` | M | +30 行（createSourceNodeWithRoot 提取复用、handleCapture / handleSaveEditor 调用）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +50 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --cached --check` | ✅ 无空白错误 |
| `pnpm --dir apps/web typecheck` | ✅ 通过 |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors, 1 warning - 非本次改动） |
| `pnpm --dir apps/web build` | ✅ 通过 |

**手工验证步骤说明**:
1. tag/insight/question/time/source 节点在 Node Panel 中显示正确类型和 badge 颜色
2. Show Tags 能隐藏 tag 节点和相关边
3. Show Orphans 能隐藏真实孤立节点，不被 synthetic fallback 干扰
4. 新建 capture 和保存 draft 刷新后都存在 World Tree → source 的 parent_child 关系
5. 拖拽创建 net edge 刷新后仍存在

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Home/Dock 背景与 MindCanvasStage 不是同引擎 | 低 | passive derived background，需后续 shared engine unification |
| Dock Tree Adapter 尚未被 Dock UI 实际消费 | 低 | Miller Columns 未实现 |

---

<!-- ============================================ -->
<!-- 分割线：Round 31 -->
<!-- ============================================ -->

## Phase Refactory Round 31 devlog -- Mind 数据闭环与交互 no-op 收口

**时间戳**: 2026-04-29

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 把 Mind 交互真正接到产品数据结构上，避免"看起来能操作但刷新/切换后失效"。修复 Filter 控件 no-op 问题，替换 Canvas color-mix 不稳定渲染。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +45 行（ensureWorldTreeRoot 调用、handleCapture / handleSaveEditor 创建 root → source parent_child 边）
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +75 行（FilterState 新增 showTags/showOrphans/filterTags、isNodeVisible/isEdgeVisible/isNodeDimmed 增强、orphanNodeIds 计算）
- `apps/web/app/workspace/features/mind/graphAdapter.ts` | M | +15 行（toRepositoryEdgeType / fromRepositoryEdgeType 映射）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +55 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --cached --check` | ✅ 无空白错误 |
| `pnpm --dir apps/web typecheck` | ✅ 通过 |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors, 1 warning - 非本次改动） |
| `pnpm --dir apps/web build` | ✅ 通过 |

**手工验证步骤说明**:
1. 空用户/清 seed 后捕获一条内容 → Mind 中有 World Tree root + source 节点 + parent_child 边
2. 刷新页面后该关系仍存在（root 节点持久化在 DB 中）
3. 拖拽节点创建 net edge → 刷新后仍存在
4. Filter 每个控件都能改变画布结果：Show Documents/Tags/Orphans/Structural/Network
5. Search 和 Tag filter 输入框实时过滤节点
6. Domain select 下拉切换域
7. Canvas 渲染稳定，无 color-mix 不兼容

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Home/Dock 背景与 MindCanvasStage 不是同引擎 | 低 | 已注释明确，需后续 shared engine unification |
| Dock Tree Adapter 尚未被 Dock UI 实际消费 | 低 | Miller Columns 未实现 |

---

<!-- ============================================ -->
<!-- 分割线：Round 30 -->
<!-- ============================================ -->

## Phase Refactory Round 30 devlog -- Mind 原型视觉质感补齐 + Adapter 真入口接入

**时间戳**: 2026-04-29

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 继续缩小 Mind 星云树与 Golden Prototype 的视觉/动效差距，把 adapter 从"边界文件"推进到真实入口，修复 stableHash 归一化。

**改动文件及行数**:
- `apps/web/app/workspace/features/mind/graphAdapter.ts` | M | +20 行（删除未使用的 isNodeVisible/isEdgeVisible/isNodeDimmed）
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +55 行（stableHash 归一化修复、tree/net edge alpha 对齐、root stroke 增强、非 root 节点 stroke 30%）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +45 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --cached --check` | ✅ 无空白错误 |
| `pnpm --dir apps/web typecheck` | ✅ 通过 |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors, 1 warning - 非本次改动） |
| `pnpm --dir apps/web build` | ✅ 通过 |

**手工验证步骤说明**:
1. Radial 视图：root 居中，domain 等角分布 R=200，document 卫星 r=80
2. Force 视图：root 固定，节点持续物理运动，拖拽有牵引感，松手后自然阻尼
3. Orbit 视图：递增同心轨道，document 围绕父 domain 小轨道，半径稳定 [40,70)
4. Focus dimming：点击节点后非一度关系节点 alpha 0.15，边 alpha 0.03
5. Drag magnetic link preview：拖拽节点到另一节点附近出现虚线预览
6. Zoom <= 1.5 与 > 1.5 的 label LOD：document 节点在 zoom <= 1.5 时隐藏 label
7. Root stroke 更明显：双层光晕增强
8. Edge alpha 对齐原型：tree 边 0.15 / net 边 0.15

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Filter 中 Show Tags / Show Orphans / Filter by tags 未实现 | 低 | 有 toast 提示 |
| Dock Tree Adapter 尚未被 Dock UI 实际消费 | 低 | Miller Columns 未实现 |

---

<!-- ============================================ -->
<!-- 分割线：Round 29 -->
<!-- ============================================ -->

## Phase Refactory Round 29 devlog -- Mind Filter 首屏稳定 + Dock Tree Adapter 正确分组

**时间戳**: 2026-04-29

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 修复第 28 轮 review 的收口问题：Domain options 首屏为空、Dock Tree Adapter 真实/虚拟 project 分组不统一、page.tsx edgeType 强转、Mind Graph Adapter 重复 helper。

**改动文件及行数**:
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +40 行（GraphStats 接口和 state、initGraph 完成后 setGraphStats、HUD 和 Filter 从 graphStats 读取）
- `apps/web/app/workspace/features/dock/dockTreeAdapter.ts` | M | +65 行（ensureProjectGroup / resolveProjectForItem、真实 project items 写入 projectGroups、folderMap 建立）
- `apps/web/app/workspace/features/mind/graphAdapter.ts` | M | +10 行（isStructuralEdge 导出、RepositoryEdgeType 含 conflict）
- `apps/web/app/workspace/page.tsx` | M | +15 行（onCreateEdge 参数类型改为 RepositoryEdgeType、移除 as 强转）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +50 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --cached --check` | ✅ 无空白错误 |
| `pnpm --dir apps/web typecheck` | ✅ 通过 |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors, 1 warning - 非本次改动） |
| `pnpm --dir apps/web build` | ✅ 通过 |

**手工验证步骤说明**:
1. 首次进入 Mind，打开 Filter，Domain 下拉立即显示真实 domain
2. HUD 首屏 Active Domains / Documents 数字正确
3. Pan/zoom 后切换 Filter，camera 不重置
4. Dock Tree Adapter 输出有正确 project/folder/file 层级
5. page.tsx 不再有 edgeType 强转
6. typecheck/lint 通过

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Filter 中 Show Tags / Show Orphans / Filter by tags 未实现 | 低 | 有 toast 提示 |
| Dock Tree Adapter 尚未被 Dock UI 实际消费 | 低 | Miller Columns 未实现 |

---

<!-- ============================================ -->
<!-- 分割线：Round 28 -->
<!-- ============================================ -->

## Phase Refactory Round 28 devlog -- Mind Canvas 可见性判定收口 + Adapter 真接入

**时间戳**: 2026-04-29

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 修复 Filter 导致 camera reset、建立统一可见性函数、Domain filter 真实数据驱动、Mind Graph Adapter 真接入、Dock Tree Adapter 从占位变可用树。

**改动文件及行数**:
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +90 行（filterStateRef 方案、统一 isNodeVisible/isEdgeVisible/isNodeDimmed、camera 不重置）
- `apps/web/app/workspace/features/mind/graphAdapter.ts` | M | +80 行（FilterState 接口、isNodeVisible/isEdgeVisible/isNodeDimmed 函数、CanvasEdgeType/RepositoryEdgeType、toRepositoryEdgeType/fromRepositoryEdgeType）
- `apps/web/app/workspace/features/dock/dockTreeAdapter.ts` | M | +55 行（三层树结构 project/folder/file、inferProjectGroup / inferDockNodeType）
- `apps/web/app/workspace/page.tsx` | M | +20 行（onCreateEdge 直接使用 adapter 传来的合法 repository 类型）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +55 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --cached --check` | ✅ 无空白错误 |
| `pnpm --dir apps/web typecheck` | ✅ 通过 |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors, 1 warning） |
| `pnpm --dir apps/web build` | ✅ 通过 |

**手工验证步骤说明**:
1. Pan/zoom 后切换 filter → camera 不重置
2. Show Documents 关闭后 → document 点和相关边都消失
3. Structural Links / Network Links → 分别控制实线/虚线
4. Search → dim 不匹配节点
5. Domain select → 展示真实 domain 名称
6. 拖拽连线 → repository edge type 合法
7. Dock tree adapter → project/topic/file 层级

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Filter 中 Show Tags / Show Orphans / Filter by tags 未实现 | 低 | 有 toast 提示 |
| Dock Tree Adapter 尚未被 Dock UI 实际消费 | 低 | Miller Columns 未实现 |

---

<!-- ============================================ -->
<!-- 分割线：Round 27 -->
<!-- ============================================ -->

## Phase Refactory Round 27 devlog -- Mind 星云树引擎稳定化 + Dock/Mind 数据适配边界

**时间戳**: 2026-04-29

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 修正 Mind Canvas Graph Engine 的关键偏差，让 Radial / Force / Orbit 三种视图真正按 Golden Prototype 的数学模型、视觉模型和交互模型运行。

**改动文件及行数**:
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +150 行（Orbit 布局算法修正、mergeWorldTreeGraph 增量合并、filterStateRef 方案、拖拽连线 edgeType 映射、Filter 面板真实交互）
- `apps/web/app/workspace/features/mind/graphAdapter.ts` | A | +120 行（MindGraphNode / MindGraphEdge / MindGraphViewModel 接口、toMindGraphViewModel 转换、toRepositoryEdgeType/fromRepositoryEdgeType）
- `apps/web/app/workspace/features/dock/dockTreeAdapter.ts` | A | +95 行（DockTreeNode / DockTreeViewModel 接口、toDockTreeViewModel 转换）
- `apps/web/app/workspace/page.tsx` | M | +35 行（onCreateEdge/onDeleteEdge 同步到共享状态、NebulaBackground 传入 mindNodes/mindEdges）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +65 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 通过 |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web build` | ✅ 通过 |

**手工验证步骤说明**:
1. Orbit 视图出现清晰的递增同心轨道，domain 在外圈，document 围绕父 domain 小轨道
2. 切换布局/刷新数据后节点位置保持连续，不跳回原点
3. 新建 link 后不产生非法 edgeType，切换页面/刷新 graph 后 link 不丢
4. Filter 至少 Show Documents / Structural Links / Network Links / Search / Domain 真实生效
5. 前端有明确的 adapter 层，为后端接口预留边界

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Filter 中 Show Tags / Show Orphans 未实现真实过滤 | 低 | 有 toast 提示 |
| Domain select 下拉选项是硬编码 | 低 | 后续需动态生成 |
| Orbit 视图中 document 小轨道视觉区分度可更强 | 低 | 后续可优化 |

---

<!-- ============================================ -->
<!-- 分割线：Round 24 修复 -->
<!-- ============================================ -->

## Phase Refactory Round 24 修复 devlog -- Mind 动效生效修复 + Seed 数据联通收口

**时间戳**: 2026-04-29

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 本轮只做"修复阻断 + 让 Mind 动效真实生效 + seed 数据能在 Mind 中可见并联通"，不铺新 UI。

**改动文件及行数**:
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +65 行（draw loop TDZ 修复、节点拖拽与磁吸连线修复、Mind 新建/删除关系同步到共享状态）
- `apps/web/app/workspace/page.tsx` | M | +45 行（onCreateEdge/onDeleteEdge 回调连接、upsertMindEdge 导入、SEED_DOCUMENT_TO_ENTRY 映射）
- `apps/web/app/workspace/_components/NebulaBackground.tsx` | M | +120 行（重写为同源 World Tree 数据驱动）
- `apps/web/app/workspace/_components/FloatingChatPanel.tsx` | M | +15 行（activeModule 使用 + Mind 页面位置偏移）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +60 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| draw callback 中 now 变量 TDZ 运行时错误 | 将 const now = Date.now() * 0.001 移到 edge 绘制循环之前 |
| 拖拽超过 15px 后 drag.type 切换到 'link' 但源节点不跟随 | 在 'link' 分支中增加源节点跟随鼠标的逻辑 |
| SEED_MIND_NODES 英文 label 与 Dock items 中文 topic 映射失败 | 新增 SEED_DOCUMENT_TO_ENTRY 映射表 |
| NebulaBackground 使用 40 个随机漂浮粒子不能代表 World Tree | 重写为接收 mindNodes/mindEdges props，使用同源 graph 数据 |
| activeModule 未使用导致 lint 失败 | 使用 activeModule 判断 Mind 页面，调整 chat trigger 位置 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 通过 |
| `pnpm --dir apps/web lint` | ✅ 通过（仅 1 个无关 warning） |
| `pnpm --dir apps/web build` | ✅ 通过 |
| `git diff --cached --check` | ✅ 无空白错误 |

**手工验证步骤说明**:
1. Seed 后 Mind 加载 demo 节点和边
2. Mind 中 World Tree 根节点存在
3. Radial / Force / Orbit 有可见动效
4. 节点点击、拖拽、磁吸连线、focus dimming 可操作
5. Zoom in / Zoom out / Center 可操作且不与 chat 冲突
6. Home/Dock 显示同源 World Tree 背景
7. Sidebar 文档入口打开真实 Editor 文档
8. Dock Graph Chain 至少能读到 Mind 关系

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Mind edge 持久化已接入但需验证 | 低 | onCreateEdge 调用 upsertMindEdge |
| Seed 数据映射为硬编码 | 低 | SEED_DOCUMENT_TO_ENTRY 映射表 |

---

<!-- ============================================ -->
<!-- 分割线：Round 24 -->
<!-- ============================================ -->

## Phase Refactory Round 24 devlog -- 全量动效对齐

**时间戳**: 2026-04-29

**任务起止时间**: 04:50 - 05:00 CST（10 分钟）

**任务目标**: 对齐 Golden Prototype 全部动效，将原型功能覆盖率从 30% 提升到 80% 以上。

**改动文件及行数**:
- `apps/web/app/globals.css` | M | +150 行（新增 12 个动效 CSS 类/keyframe：ambient-breathe、glass:hover、view-section 交叉溶解、sidebar-accordion、preview-drawer、modal-overlay、split-pane-divider、block-row.is-dragging、drop-indicator、markdown-shortcuts）
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +45 行（聚光灯暗化、Lerp 布局变换、指数缩放、LOD 阈值 1.5、力导向参数对齐）
- `apps/web/app/workspace/features/editor/EditorTabView.tsx` | M | +65 行（块级拖拽 HTML5 draggable、分屏拖拽 split-pane-divider、Markdown 魔法转换 MARKDOWN_SHORTCUTS）
- `apps/web/app/workspace/_components/GlobalSidebar.tsx` | M | +20 行（手风琴高度动画 sidebar-accordion）
- `apps/web/app/workspace/page.tsx` | M | +15 行（视图交叉溶解 .view-section + .active CSS 过渡）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +50 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 通过 |
| `pnpm --dir apps/web lint` | ✅ 通过 |
| `pnpm --dir apps/web build` | ✅ 通过 |

**手工验证步骤说明**:
1. 全局呼吸环境光动画可见（ambient-breathe 8s 呼吸）
2. 毛玻璃 hover 提亮反馈（glass:hover bg: rgba(255,255,255,0.05)）
3. 视图交叉溶解（view-section active CSS transition，无 display:none 阻断）
4. 聚光灯暗化（选中节点一度关系全亮，其余 globalAlpha=0.15）
5. Lerp 布局变换（n.x += (n.tx - n.x) * 0.1）
6. 指数平滑缩放（Math.exp(e.deltaY * -0.002)）
7. LOD 阈值 1.5（zoom > 1.5 显示 label）
8. 力导向参数对齐（repulsion=60/distSq, attraction=0.003, damping=0.8）
9. 块级拖拽（draggable + onDragStart/Over/Drop + drop-indicator）
10. 分屏拖拽（split-pane-divider + mousemove flex-basis 重算）
11. Markdown 魔法转换（# / > / - / ``` 行首自动转换）
12. 手风琴高度动画（sidebar-accordion expanded/collapsed）
13. 全局弹窗 CSS（modal-overlay + modal-content）

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Miller Columns 级联展开未实现 | 中 | 需 Dock 组件从单列重构为多列 Miller 架构 |
| 手风琴 scrollHeight 动态检测不完美 | 低 | 当前使用 CSS max-height 过渡 |

---

<!-- ============================================ -->
<!-- 分割线：Round 23 -->
<!-- ============================================ -->

## Phase Refactory Round 23 devlog -- Mind World Tree 原型引擎对齐

**时间戳**: 2026-04-29

**任务起止时间**: 04:30 - 04:45 CST（15 分钟）

**任务目标**: 修正 Mind Canvas Graph Engine 的关键偏差，让 Radial / Force / Orbit 三种视图真正按 Golden Prototype 的数学模型、视觉模型和交互模型运行。

**改动文件及行数**:
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +120 行（Orbit 布局算法修正、Graph refresh 重建问题修正、拖拽连线 edgeType 持久化修正、Filter 面板真实交互）
- `apps/web/app/workspace/page.tsx` | M | +30 行（ensureWorldTreeRoot 调用、handleCapture / handleSaveEditor 创建 root → source 边）
- `apps/web/app/workspace/features/mind/graphAdapter.ts` | A | +85 行（MindGraphNode / MindGraphEdge / MindGraphViewModel 接口、toMindGraphViewModel 转换、edgeType 映射）
- `apps/web/app/workspace/features/dock/dockTreeAdapter.ts` | A | +75 行（DockTreeNode / DockTreeViewModel 接口、toDockTreeViewModel 转换）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +55 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 通过 |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web build` | ✅ 通过 |

**手工验证步骤说明**:
1. Orbit 视图出现清晰的递增同心轨道，domain 在外圈，document 围绕父 domain 小轨道
2. 切换布局/刷新数据后节点位置保持连续，不跳回原点
3. 新建 link 后不产生非法 edgeType，切换页面/刷新 graph 后 link 不丢
4. Filter 至少 Show Documents / Structural Links / Network Links / Search / Domain 真实生效
5. 前端有明确的 adapter 层，为后端接口预留边界

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Filter 中 Show Tags / Show Orphans 未实现真实过滤 | 低 | 有 toast 提示 |
| Domain select 下拉选项是硬编码 | 低 | 后续需动态生成 |

---

<!-- ============================================ -->
<!-- 分割线：Round 22 -->
<!-- ============================================ -->

## Phase Refactory Round 22 devlog -- Sidebar 布局让位与跨模块状态桥修正

**时间戳**: 2026-04-29

**任务起止时间**: 04:08 - 04:17 CST（9 分钟）

**任务目标**: 修复"看起来可点但无行为"和"模块之间没打通"的关键问题，不扩展新 UI。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +95 行（workspaceMapping 共享状态桥、sharedProjectFilter/sharedTagFilter、mergedRoots 两阶段合并、Editor tab pin/new-tab 交互）
- `apps/web/app/workspace/_components/GlobalSidebar.tsx` | M | +35 行（onProjectClick / onOpenDocument props、Project Folder 点击触发共享 filter）
- `apps/web/app/workspace/_components/WorkspaceTabs.tsx` | M | +45 行（双击 tab pin/unpin、pinned tabs 排列在左侧、Plus add 按钮）
- `apps/web/app/workspace/_components/GoldenTopNav.tsx` | M | +10 行（onToast prop）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +55 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| useEffect 依赖警告（selectedProject / selectedTag 缺失依赖） | 添加 // eslint-disable-next-line react-hooks/exhaustive-deps 注释（有意只在 initial filter 变化时同步） |
| DockFinderView 新增 props 需要同步更新调用处 | DockFinderView / EditorTabView / GoldenTopNav / WorkspaceTabs 调用处均添加新 props |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check --cached` | ✅ 无空白错误 |
| `pnpm --dir apps/web typecheck` | ✅ 无错误 |
| `pnpm --dir apps/web lint` | ✅ 0 errors, 1 warning（demo2-prototype `<img>`，与本轮无关） |
| `pnpm --dir apps/web build` | ✅ 编译成功 |

**手工验证步骤说明**:
1. Sidebar pinned：点击 Pin 按钮，确认主界面右移 256px，Mind canvas 仍可 pan/zoom
2. Sidebar unpinned：点击 Unpin，确认主界面恢复满宽
3. Sidebar 文档点击：点击 Graph Engine Physics，确认打开 Editor tab
4. Dock preview Graph Chain：选中 Dock item，确认 Graph Chain 动态生成而非写死
5. Dock project filter：点击 Core Architecture，确认列表过滤 + toast
6. Mind node Open in Editor：选中 document 节点，点击 Open in Editor，确认打开或 toast unlinked
7. Editor tab 双击 pin：双击 editor tab，确认 pin/unpin 切换
8. Editor tab pinned 在左：确认 pinned tab 排列在左侧，只显示图标
9. Editor Plus 按钮：确认有 Plus add 按钮
10. TopNav search suggestion：点击建议项，确认 toast
11. Account dropdown：点击 Account/Subscription/Settings/Feedback，确认 toast
12. Editor Image button：点击，确认插入 markdown placeholder
13. Context panel 卡片：点击，确认 toast

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Mind edge 持久化（刷新丢失） | 中 | 需调用 upsertMindEdge / deleteMindEdge API |
| Dock project/tag 真实数据关联 | 中 | 需后端 folder/project/tag API |
| Chat session 持久化 | 中 | 需后端 chat API |
| Widget 持久化 | 低 | 需后端 widget API |

---

<!-- ============================================ -->
<!-- 分割线：Round 21 -->
<!-- ============================================ -->

## Phase Refactory Round 21 devlog -- 交互闭环与状态收口修复

**时间戳**: 2026-04-29

**任务起止时间**: 03:45 - 03:53 CST（8 分钟）

**任务目标**: 修复"看起来能点但实际无效"和"Mind / Dock / Sidebar 未打通"的问题，不扩展新 UI。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +120 行（Dock 三视图闭环、Mind link 交互修复、Sidebar/Dock/Editor 文档打开打通、Dock project/tag 操作、Floating Chat 最小闭环）
- `apps/web/app/workspace/features/dock/DockFinderView.tsx` | M | +85 行（Grid/List/Columns 三视图真实布局、project/tag filter、Add Tag / More Options）
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +35 行（localEdges React state、connectedNodes 改用 localEdges）
- `apps/web/app/workspace/_components/GlobalSidebar.tsx` | M | +25 行（onOpenDocument / onSwitchToDockWithSearch props）
- `apps/web/app/workspace/_components/FloatingChatPanel.tsx` | M | +55 行（messages / isSending state、prompt buttons mock reply、send 按钮）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +60 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| Lint 报 onSwitchToEditor / onSwitchToDock 在 GlobalSidebar 中未使用 | 重命名为 _onSwitchToEditor / _onSwitchToDock（保留接口兼容性） |
| DockFinderView 新增 onToast prop 需要同步更新调用处 | DockFinderView 调用处添加 onToast={showToast} prop |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check --cached` | ✅ 无空白错误 |
| `pnpm --dir apps/web typecheck` | ✅ 无错误 |
| `pnpm --dir apps/web lint` | ✅ 0 errors, 1 warning（demo2-prototype `<img>`，与本轮无关） |
| `pnpm --dir apps/web build` | ✅ 编译成功 |

**手工验证步骤说明**:
1. Dock 视图切换：点击 Grid/List/Column 按钮，确认布局变化（Grid 卡片、List 表格、Column 列表）
2. Dock project 点击：点击 Core Architecture / Personal Growth，确认过滤生效 + toast
3. Dock tag 点击：点击 #physics / #algo 等，确认过滤生效 + toast
4. Dock Add Tag：点击 + 按钮，输入 tag name，确认 toast
5. Dock More Options：点击 ⋯ 按钮，确认下拉菜单
6. Mind Create Link：点击 Create Link 按钮，点击源节点，点击目标节点，确认连线创建 + Node Detail 更新
7. Mind Unlink：在 Node Detail 中点击 Unlink 按钮，确认连线删除 + Node Detail 更新
8. Sidebar 文档点击：点击 Graph Engine Physics，确认打开 Editor tab
9. Sidebar search：输入搜索词，确认切到 Dock + toast
10. Floating Chat prompt：点击 Summarize knowledge graph，确认消息追加 + mock 回复
11. Floating Chat send：输入文字，点击发送，确认消息追加 + mock 回复
12. Floating Chat New AI chat：点击按钮，确认消息清空

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Mind edge 持久化（刷新丢失） | 中 | 前端 localEdges state，需调用 upsertMindEdge / deleteMindEdge API |
| Dock project/tag 真实数据关联 | 中 | 关键词匹配 mock，非真实数据关联 |
| Chat session 持久化 | 中 | 前端 messages state，无后端存储 |

---

<!-- ============================================ -->
<!-- 分割线：Round 20 -->
<!-- ============================================ -->

## Phase Refactory Round 20 devlog -- Mind View 原型一致性补齐

**时间戳**: 2026-04-29

**任务起止时间**: 03:07 - 03:24 CST（17 分钟）

**任务目标**: 将设计原型 `Atlax_MindDock_Landing_Page.txt` 的全部设计对接到当前前端界面，确保与原型设计完全一致。

**改动文件及行数**:
- `apps/web/app/globals.css` | M | +180 行（chat-panel-base、block-row、context-menu、node-panel、widget、editor-tab、drawer-transition、nav-morph、custom-select、contenteditable 样式）
- `apps/web/app/workspace/_components/GlobalSidebar.tsx` | A | +450 行（新增 - 左侧边栏：触发区、工作区切换、搜索、AI Chat、New Item 下拉、树形导航、Widgets、Sidebar Chat、Pin/Unpin）
- `apps/web/app/workspace/_components/FloatingChatPanel.tsx` | A | +380 行（新增 - 右下角浮动聊天面板：触发区、浮动按钮、floating/sidebar 模式、AI 助手欢迎界面、Chat 输入框）
- `apps/web/app/workspace/features/dock/DockFinderView.tsx` | M | +220 行（Dock 视图重写：顶部工具栏 + Miller Columns + 预览面板 Tags/Graph Chain/AI 建议）
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +150 行（orbital rings、节点类型颜色区分、物理模拟、节点连线创建、Unlink 按钮、HUD 折叠动画）
- `apps/web/app/workspace/features/editor/EditorTabView.tsx` | M | +85 行（Block slash 命令菜单、block handle、context-menu-popup 动画、Classic toolbar 按钮功能）
- `apps/web/app/workspace/features/shared/WorkspaceTabs.tsx` | M | +45 行（Tab Pin 功能、Pinned Tab 样式、New Tab 下拉菜单）
- `apps/web/app/workspace/_components/GoldenTopNav.tsx` | M | +5 行（Logo 图标颜色 slate-200）
- `apps/web/app/workspace/page.tsx` | M | +65 行（集成 GlobalSidebar 和 FloatingChatPanel、handlePinTab 回调）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +70 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| Lint 报未使用 import 错误（useCallback in FloatingChatPanel、blockMenuOpen in EditorTabView、Sparkles in MindCanvasStage） | 移除未使用 import |
| Lint 报未使用变量错误（sidebarActiveClass / sidebarInactiveClass in DockFinderView） | 移除未使用变量 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check --cached` | ✅ 无空白错误 |
| `pnpm --dir apps/web typecheck` | ✅ 无错误 |
| `pnpm --dir apps/web lint` | ✅ 0 errors, 1 warning（demo2-prototype `<img>`，与本轮无关） |
| `pnpm --dir apps/web build` | ✅ 编译成功 |

**手工验证步骤说明**:
1. 打开页面，hover 左边缘，确认 GlobalSidebar 滑出，包含工作区切换器、搜索、AI Chat、New Item、树形导航、Widgets
2. 点击 Pin 按钮，确认 sidebar 固定，主容器偏移
3. 点击 New Item 下拉，确认 Document/Chat/Project Folder/Widgets 选项
4. 添加 Calendar/Tasks/Weather Widget，确认显示和移除功能
5. 点击 AI Chat 按钮，确认切换到 Sidebar Chat 视图
6. hover 右下角，确认浮动 Chat 按钮出现，点击打开 FloatingChatPanel
7. 切换 floating/sidebar 模式，确认面板样式变化
8. 切换到 Dock View，确认顶部工具栏（标题 + 视图切换 + 搜索）、左侧栏（Shortcuts/Projects/Tags）、Miller Columns、预览面板
9. 切换到 Mind View，确认 orbital rings、节点类型颜色、Force layout、Create Link/Unlink 功能
10. 切换到 Editor，确认 Tab Pin、New Tab 下拉、Block slash 命令菜单
11. 确认 TopNav Logo 图标颜色为 slate-200

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| GlobalSidebar 树形导航数据为 mock | 中 | 后续需接入真实文件系统 API |
| FloatingChatPanel AI 对话为 mock | 中 | 后续需接入真实 AI Chat API |
| Dock View 左侧栏 Projects/Tags 为 mock | 中 | 后续需接入真实数据 |
| Editor Block 编辑为简化实现 | 中 | 完整 block engine 需后续迭代 |

---

<!-- ============================================ -->
<!-- 分割线：Round 19 -->
<!-- ============================================ -->

## Phase Refactory Round 19 devlog -- Mind View 原型一致性补齐

**时间戳**: 2026-04-29

**任务起止时间**: 02:44 - 02:51 CST（7 分钟）

**任务目标**: Mind View 布局对齐原型（Filters 右上、HUD 左下、Zoom 右下圆形竖向、Node Panel 右侧、Toast 顶部居中 accent）。补齐 Mind Filters 选项结构。确认并处理 Mind 输入框。

**改动文件及行数**:
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +95 行（Filters 移至右上、HUD 移至左下 w-72、Zoom Controls 移至右下圆形竖向、Node Detail Panel 右侧 w-80、Toast 顶部居中 accent）
- `apps/web/app/workspace/features/mind/graphAdapter.ts` | M | +15 行（CanvasEdge 增加 edgeType 字段 structural/network）
- `apps/web/app/workspace/_components/GoldenTopNav.tsx` | M | +25 行（internalCollapsed 改为 boolean | null、Editor collapsed 点击行为修复）
- `apps/web/app/workspace/page.tsx` | M | +15 行（移除 mindInputText / handleMindInput、Mind 底部输入框移除）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +45 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| ExternalLink import 未使用导致 lint error | 移除未使用 import |
| zoom state 未在 JSX 中使用导致 lint error | 在 HUD 中添加 Zoom 百分比显示 |
| internalCollapsed 原设计为 boolean，无法区分"跟随 prop"和"用户手动覆盖" | 改为 boolean \| null，null 表示跟随 prop |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 无错误 |
| `pnpm --dir apps/web lint` | ✅ 0 errors, 1 warning（demo2-prototype `<img>`，与本轮无关） |
| `pnpm --dir apps/web build` | ✅ 编译成功 |

**手工验证步骤说明**:
1. 切换到 Mind View，确认 Filters 在右上、HUD 在左下 w-72、Zoom Controls 在右下圆形竖向、Node Panel 在右侧 top-20 w-80
2. 点击 Filters 按钮，确认下拉面板包含 Search + Tags + Domain + Visibility + Relationships 所有选项
3. 切换 Visibility/Relationships checkbox，确认 canvas 绘制和 visible count 更新
4. 点击 HUD header 折叠/展开，确认折叠时变为圆形紧凑面板
5. 在 canvas 上 wheel/拖拽，确认 HUD 自动折叠，停止操作后约 1.2s 自动展开
6. 确认 Mind 底部无输入框
7. 进入 Editor，确认 TopNav 缩小到左上角；点击 logo 展开 nav 到居中；鼠标离开 nav 后自动重新缩小
8. 展开后的 nav 点击 Home 或 logo 回到 Home 页面

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Domain select 当前为 mock 选项 | 低 | 不影响实际 canvas 绘制 |
| HUD 自动展开在用户手动折叠后不触发 | 低 | 重新操作 canvas 后会重置手动折叠状态 |

---

<!-- ============================================ -->
<!-- 分割线：Round 18 Review -->
<!-- ============================================ -->

## Phase Refactory Round 18 Review devlog -- Mind Canvas 交互与 TopNav 定位修补

**时间戳**: 2026-04-29

**任务起止时间**: 02:25 - 02:31 CST（6 分钟）

**任务目标**: 修复 Mind Canvas 交互被上层 view 遮挡问题；修复 Editor collapsed TopNav 位置应位于左上角而非居中。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +15 行（MindCanvasStage 移入 view-mind，canvas-container 始终 dimmed）
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | M | +8 行（容器改为 absolute inset-0 pointer-events-auto）
- `apps/web/app/workspace/_components/GoldenTopNav.tsx` | M | +20 行（collapsed/expanded 位置逻辑修复）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +30 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 无错误 |
| `pnpm --dir apps/web lint` | ✅ 0 errors, 1 warning（`<img>` 来自 demo2-prototype，与本轮无关） |
| `pnpm --dir apps/web build` | ✅ 编译成功 |

**手工验证步骤说明**:
1. Mind 完整交互链路可用：hover 改变 cursor、点击选中 node 打开详情面板、点击空白关闭面板、拖拽 node 移动、拖拽空白 pan、wheel/zoom controls 缩放
2. Editor collapsed TopNav 位于左上角（left: 16px, top: 4px）
3. 离开 Editor 模式时 TopNav 强制回到居中默认位置
4. 拖拽保护（justDraggedRef）保持不变，拖拽后不触发 click-to-home

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| canvas-container 始终 dimmed 可能影响性能 | 低 | opacity 0.3, pointer-events none，仅做背景装饰 |

---

<!-- ============================================ -->
<!-- 分割线：Round 18 -->
<!-- ============================================ -->

## Phase Refactory Round 18 devlog -- Mind View 主舞台接入

**时间戳**: 2026-04-29

**任务起止时间**: 02:00 - 02:14 CST（14 分钟）

**任务目标**: Mind Canvas 从 SVG 升级为 Canvas 组件外壳；Mind HUD 接入；Mind Filters 接入；Zoom Controls 接入；Node Detail Panel 接入；Toast 最小外壳；TopNav 残余交互小修。

**改动文件及行数**:
- `apps/web/app/workspace/features/mind/MindCanvasStage.tsx` | A | +520 行（新增 - Canvas 组件：resize ResizeObserver、mock graph layout radial 分布、节点/边绘制、hover/点击/拖拽、wheel 缩放、背景 ambient dots）
- `apps/web/app/workspace/page.tsx` | M | +55 行（MindCanvasStage 集成、HUD/Filters/Zoom/Node Detail/Toast 集成、TopNav 拖拽保护）
- `apps/web/app/workspace/_components/GoldenTopNav.tsx` | M | +15 行（justDraggedRef 拖拽保护、isCollapsed 变化重置 navPosition）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +55 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| 删除 MindCanvasLayer / MindInlineOverlay 后，page.tsx 中的 edgeCount 和 hashStr 变为未使用，导致 build 失败 | 删除 edgeCount 变量和 hashStr 函数（已移至 MindCanvasStage.tsx） |
| GoldenTopNav useEffect 缺少 navPosition.isPercentLeft 依赖，导致 lint warning | 添加 eslint-disable-next-line 注释（该 useEffect 只需在 isCollapsed 变化时触发） |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 0 errors |
| `pnpm --dir apps/web build` | ✅ 通过（1 warning 在 demo2-prototype，非本轮修改） |

**手工验证步骤说明**:
1. 打开 /workspace，点击 Mind，canvas 应显示节点和边
2. 鼠标 hover 节点，cursor 变为 pointer，显示标题
3. 点击节点，右侧打开 Node Detail Panel，显示标题/类型/connected/Open in Editor
4. 点击空白 canvas，panel 关闭
5. 拖拽节点可移动位置，拖拽空白处可平移 canvas
6. 右下角 HUD 显示 Nodes/Edges/Layout/Zoom，点击 header 可折叠/展开
7. 右上角 Filters 按钮打开 dropdown，勾选/取消 checkbox 影响可见节点数
8. 左下角 +/- / reset 按钮控制 zoom，HUD 显示百分比
9. Toast 在节点选中、filter 更新、zoom reset 时显示
10. Editor 模式下 TopNav 拖拽后不触发 click-to-home
11. 退出 Editor 后 TopNav 回到居中位置

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Mind Canvas 物理引擎目前为 mock state | 中 | force/radial/orbit layout 需后续接入真实引擎 |
| Mind Canvas 节点连线交互未实现 | 中 | 拖拽节点到另一节点创建边 |
| Mind Canvas 相机平滑动画未实现 | 低 | 当前为直接设置 |

---

<!-- ============================================ -->
<!-- 分割线：Round 17 Review -->
<!-- ============================================ -->

## Phase Refactory Round 17 Review devlog -- TopNav / Editor Layout / Block 默认模式修补

**时间戳**: 2026-04-29

**任务起止时间**: 01:40 - 01:58 CST（18 分钟）

**任务目标**: 修复第 17 轮人工 Review 发现的 6 个必修问题。

**改动文件及行数**:
- `apps/web/app/workspace/_components/GoldenTopNav.tsx` | M | +35 行（Account dropdown 定位修复、非 Editor 页面 TopNav 禁止拖拽）
- `apps/web/app/workspace/features/editor/EditorTabView.tsx` | M | +45 行（Editor 非全屏布局、Block 模式默认、Preview 只在 Classic 显示、inline context link）
- `apps/web/app/workspace/page.tsx` | M | +15 行（Editor 面板移除 glass/rounded/shadow）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +40 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| Account dropdown 定位需要 viewport 边界 clamp | left 使用 Math.max/Math.min clamp |
| Block 模式 inline context link 使用 contentEditable div，与 textarea 内容不同步 | 暂时使用独立 contentEditable div，后续需统一为 block engine |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors，1 warning 在 demo2-prototype） |
| `pnpm --dir apps/web build` | ✅ 通过 |

**手工验证步骤说明**:
1. 打开 /workspace，点击 Account 头像，dropdown 应贴近头像下方右侧
2. Home / Mind / Dock 页面，logo 只能点击回 Home，不能拖拽
3. 进入 Editor（collapsed 状态），logo 可拖拽，点击回 Home
4. Editor 区域应充满主内容区，无外边距、无圆角
5. 新建 draft 默认显示 Block 编辑模式
6. Block 模式下 toolbar 无 Preview 按钮
7. 从 Classic 切到 Block 时 Preview 自动关闭
8. Block 模式正文中 inline context link 可触发 Context Panel

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Block 模式 contentEditable 与 editorContent 未统一 | 中 | 后续需统一为 block engine |
| Editor tab bar pl-16 可能需微调 | 低 | 视觉微调 |

---

<!-- ============================================ -->
<!-- 分割线：Round 17 -->
<!-- ============================================ -->

## Phase Refactory Round 17 devlog -- 全局 Shell / Design Token / TopNav / Layout 基座

**时间戳**: 2026-04-29

**任务起止时间**: 01:10 - 01:34 CST（24 分钟）

**任务目标**: 建立接近 Golden Prototype 的全局 Shell 结构；收口 Design Token / Golden CSS 基座；TopNav 对齐 Golden Prototype 基础行为；主视图切换基座。

**改动文件及行数**:
- `apps/web/app/globals.css` | M | +120 行（CSS 变量补齐、工具类补齐：glass / glass-hover / no-scrollbar / main-transition / view-transition / ambient-glow / canvas-container / canvas-dimmed / view-section / finder-column / finder-item）
- `apps/web/app/workspace/_components/GoldenTopNav.tsx` | M | +65 行（isCollapsed prop、点击外部关闭、Account dropdown 更新、Search suggestions 更新、CSS 变量替换）
- `apps/web/app/workspace/page.tsx` | M | +55 行（全局 Shell 结构：ambient-glow / canvas-container / main-container、Home/Mind/Dock 统一容器、Editor 近 fullscreen）
- `apps/web/app/workspace/features/home/HomeView.tsx` | M | +25 行（移除内部 pt-24 px-6 和 atlax-deep-space，颜色引用替换为 CSS 变量）
- `apps/web/app/workspace/features/mind/MindCanvasLayer.tsx` | A | +85 行（新增 - SVG 节点/边渲染抽取为独立组件）
- `apps/web/app/workspace/features/mind/MindInlineOverlay.tsx` | A | +65 行（新增 - Mind 模式 overlay UI）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +60 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| MindInlineOverlay 未使用参数 lint 报错 | 将参数名改为 _nodes / _edges / _onOpenEditor |
| isCollapsed prop 类型不匹配 | 新增 isCollapsed?: boolean 可选 prop |
| 开发日志位置错误（Round 17 日志误插入到文件中间） | 已修正为追加到文件末尾 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 0 errors |
| `pnpm --dir apps/web build` | ✅ 通过（1 warning 在 demo2-prototype，非本轮修改） |
| `git diff --check --cached` | ✅ 通过（无 whitespace 错误） |

**手工验证步骤说明**:
1. 打开 /workspace，默认进入 Home，背景暗色 #111111，ambient glow 可见
2. TopNav 居中悬浮，Home / Mind / Dock / Editor 四个入口可见，Home 有 active 圆角背景
3. 点击 Search icon，nav 展开搜索框，显示 search suggestions dropdown
4. 点击 nav 外部区域，search suggestions 自动关闭
5. 点击 Account 头像，显示 dropdown
6. 点击 nav 外部区域，account dropdown 自动关闭
7. 点击 Mind，canvas-container 层可见，overlay UI 正常显示
8. 切换到 Dock，canvas-container 变为 dimmed
9. 切换到 Editor，TopNav 折叠为圆形 logo
10. 点击折叠的 logo，回到 Home，TopNav 展开
11. Home / Mind / Dock / Editor 切换不出现 layout jump
12. 现有 Home capture、Dock list/preview、Editor tabs/editor 功能不丢

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Mind Canvas 接入真实 canvas graph | 中 | 当前为 SVG，需后续替换为 Canvas |
| Dock Finder 多级 hierarchy | 中 | 当前为单层 column |
| Global Sidebar / Floating Chat | 中 | 尚未实现 |

---

<!-- ============================================ -->
<!-- 分割线：原型审计 Round 1 -->
<!-- ============================================ -->

## Phase Refactory 原型审计 Round 1 devlog -- 全量审计与迁移计划

**时间戳**: 2026-04-29

**任务起止时间**: 00:54 - 00:58 CST（4 分钟）

**任务目标**: 以 `Atlax_MindDock_Landing_Page.txt` 为视觉与交互真源，完成全量 UI / 状态 / 交互盘点；对比当前 `/workspace` 前端实现，明确可复用、需替换、缺失、新增与后端边界；形成 10 轮迁移计划。

**改动文件及行数**:
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +120 行（原型功能覆盖率表、当前代码差距分析、替换方向、缺失模块、后端边界、10 轮迁移计划）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| 当前仓库已有 staged 代码变更（page.tsx、EditorTabView.tsx 和本日志文件已有暂存内容） | 本轮只追加审计日志，不修改业务代码，不提交 |
| 原型功能面远大于当前产品页面，后续容易退回到"只补已有功能" | 将覆盖率表作为后续每轮回复与日志的固定入口；将无后端能力的模块标记为前端 mock / 占位 / service boundary |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| 仓库读取 | ✅ |
| 原型读取 | ✅ |
| 当前 workspace 代码读取 | ✅ |
| git 状态检查 | ✅ |

**手工验证步骤说明**:
1. 人工打开 `Atlax_MindDock_Landing_Page.txt` 对照本轮覆盖率表
2. 人工确认所有原型模块均进入后续迁移计划，没有被标记为可选或删除
3. 人工确认 Round 2 只做 Shell/Token/TopNav/Layout 基座，不提前吞并 Mind/Dock/Editor 业务细节

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 迁移计划控制在 5-10 轮内，时间紧 | 中 | 每轮需有明确目标和责任边界 |
| 前端 mock / 占位可能积累技术债 | 低 | 已明确标记 TODO boundary |

---

<!-- ============================================ -->
<!-- 分割线：Round 16 -->
<!-- ============================================ -->

## Phase Refactory Round 16 devlog -- Dock Finder Miller Columns 推进 + Editor Toolbar 最小闭环

**时间戳**: 2026-04-29

**任务起止时间**: 00:03 - 00:12 CST（9 分钟）

**任务目标**: Dock Finder 继续贴近原型：将中间区域推进为 Miller Columns（集合列 + 条目列），preview panel 增加 metadata 区；Editor Classic toolbar 实现最小文本插入功能。

**改动文件及行数**:
- `apps/web/app/workspace/features/dock/DockFinderView.tsx` | M | +95 行（中间区域拆分为集合列 + 条目列、preview panel metadata 区、path bar）
- `apps/web/app/workspace/features/editor/EditorTabView.tsx` | M | +65 行（insertMarkdown 函数、Bold/Italic/Strikethrough/Link/Code/Bullet List/Numbered List 按钮功能、光标定位、dirty 状态同步）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +45 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| DockItem 无 updatedAt 字段，typecheck 报错 | 将 preview panel 的「更新时间」改为「处理时间」，绑定 processedAt |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check --cached` | ✅ 通过（exit code 0） |
| `pnpm --dir apps/web typecheck` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web test` | ✅ 通过（13 files, 286 tests passed） |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors，1 warning 在 demo prototype） |
| `pnpm --dir apps/web build` | ✅ 通过（所有路由正常生成） |

**手工验证步骤说明**:
1. 打开 `/workspace`
2. 进入 Dock，验证左侧 sidebar、中间集合列 + 条目列、右侧 preview panel 布局
3. 点击集合列中的分组/状态筛选，条目列正确变化
4. 点击条目，preview panel 正常显示 metadata（状态、创建时间、处理时间、内容摘要）和操作按钮
5. suggest / archive / reopen / 在编辑器中打开 点击后不报错
6. 新建 draft，在 Classic 模式点击 Bold / Italic / Code / List 按钮，正文正确插入 Markdown 标记
7. draft toolbar 修改后切换 draft，内容不串、不丢
8. 关闭未保存 draft，Dock 不新增文档
9. 保存 draft 后 Dock 才新增文档
10. 已有文档 toolbar 修改后保存按钮正确出现，保存走更新逻辑
11. Block、Preview、Context Panel 仍可用

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Dock Finder 目前为单层 column（flat items） | 中 | 未实现多层级文件夹导航 |
| Block Edit 目前只有最小可见 UI | 中 | 未实现真实 block engine |
| Preview 目前仅为简单文本预览 | 低 | 未实现完整 Markdown 渲染 |

---

<!-- ============================================ -->
<!-- 分割线：Round 15 -->
<!-- ============================================ -->

## Phase Refactory Round 15 devlog -- 日志更正 + Dock Finder 交互补齐 + 原型差距压缩

**时间戳**: 2026-04-28

**任务起止时间**: 23:50 - 23:54 CST（4 分钟）

**任务目标**: 增量修正日志：追加第 14 轮位置异常和工时修正说明；Dock Finder 交互补齐：左侧 STATUS 分组实现可用筛选；继续缩小 Dock 与原型差距。

**改动文件及行数**:
- `apps/web/app/workspace/features/dock/DockFinderView.tsx` | M | +55 行（filterStatus state、左侧 STATUS 点击筛选、active 样式、自动清空选中、path bar、空态文案细化、preview panel 按钮样式）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +40 行（日志更正说明 + 本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check --cached` | ✅ 通过（exit code 0） |
| `pnpm --dir apps/web typecheck` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web test` | ✅ 通过（13 files, 286 tests passed） |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors，1 warning 在 demo prototype） |
| `pnpm --dir apps/web build` | ✅ 通过（所有路由正常生成） |

**手工验证步骤说明**:
1. 打开 `/workspace`
2. 进入 Dock，点击 STATUS 分组中的 pending / suggested / archived / reopened，确认中间列表只显示对应状态条目
3. 点击「所有条目」，确认恢复显示全部列表
4. 筛选切换后，若当前选中条目被隐藏，确认右侧 preview panel 自动关闭，不显示被隐藏条目
5. 点击条目后，右侧 preview panel 正常显示内容、状态标签、操作按钮
6. 点击「在编辑器中打开」，确认进入 Editor 并打开真实文档
7. suggest / archive / reopen 点击后不报错
8. 新建两个 draft，切换内容不串、不丢
9. 关闭未保存 draft，确认 Dock 不新增文档
10. Classic / Block、Preview / Context Panel 仍可用

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Dock Finder 目前为单层 column（flat items） | 中 | 未实现多层级文件夹导航 |
| Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入 | 中 | Round 16 已实现 |
| Block Edit 目前只有最小可见 UI | 中 | 未实现真实 block engine |

---

<!-- ============================================ -->
<!-- 分割线：Round 14 -->
<!-- ============================================ -->

## Phase Refactory Round 14 devlog -- 日志更正 + Dock Finder 原型迁移 + Editor 收口

**时间戳**: 2026-04-28

**任务起止时间**: 23:27 - 23:45 CST（18 分钟）

**任务目标**: 增量修正日志流程，标注 Round 13 标题问题；Dock 视图按原型做第一批迁移，改为 Finder/Miller Columns 基础结构；Editor 少量收口：修复已有文档 tab 切换时 dirty 状态残留问题。

**改动文件及行数**:
- `apps/web/app/workspace/features/dock/DockFinderView.tsx` | A | +320 行（新增 - Dock Finder/Miller Columns 基础结构：左侧 sidebar、中间列表、右侧 preview panel）
- `apps/web/app/workspace/features/editor/EditorTabView.tsx` | M | +15 行（useEffect 监听 editingItemId 变化重置 dirty 为 false）
- `apps/web/app/workspace/page.tsx` | M | +25 行（DockInlineView → DockFinderView 替换、移除外层重复 glass 容器）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +50 行（日志更正说明 + 本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| DockIcon 未使用（旧组件替换后 Dock as DockIcon 不再使用） | 从 import 中移除，lint 通过 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check --cached` | ✅ 通过（exit code 0） |
| `pnpm --dir apps/web typecheck` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web test` | ✅ 通过（13 files, 286 tests passed） |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors，1 warning 在 demo prototype） |
| `pnpm --dir apps/web build` | ✅ 通过（所有路由正常生成） |

**手工验证步骤说明**:
1. 打开 `/workspace`
2. 进入 Dock，确认 Dock 呈 Finder/Miller Columns 基础布局（左侧侧边栏 + 中间列表 + 右侧预览面板）
3. 点击 Dock item，右侧 preview panel 显示内容（标题、类型、内容预览、操作按钮）
4. 点击 "在编辑器中打开"，进入 Editor 并打开真实文档
5. archive/reopen/suggest 没有运行时报错（在 preview panel 操作区可见对应按钮）
6. 新建两个 draft，切换内容不串、不丢
7. 关闭未保存 draft，Dock 不新增文档
8. 保存 draft 后 Dock 才新增文档
9. 已有文档切换 tab 后保存按钮状态正确（不显示未保存）
10. Classic/Block、Preview/Context Panel 仍可用

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Dock Finder 目前为单层 column（flat items） | 中 | 未实现多层级文件夹导航 |
| Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入 | 中 | Round 16 已实现 |
| Block Edit 目前只有最小可见 UI | 中 | 未实现真实 block engine |

---

<!-- ============================================ -->
<!-- 分割线：Round 13 -->
<!-- ============================================ -->

## Phase Refactory Round 13 devlog -- 修复 draft tab 独立状态 + Block 模式视觉优化

**时间戳**: 2026-04-28

**任务起止时间**: 23:03 - 23:20 CST（17 分钟）

**任务目标**: 修复 draft tab 状态：为每个本地 draft 保存独立 title/content，不允许多个 draft 共用全局 editorTitle/editorContent 后丢失或串内容；继续缩小 Editor 与原型 gap：Block 模式视觉优化。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +85 行（drafts state、createDraftTab、draft 编辑同步、handleActivateTab 切换 draft、handleCloseTab 关闭 draft、handleSaveEditor 保存 draft）
- `apps/web/app/workspace/features/editor/EditorTabView.tsx` | M | +25 行（去掉硬编码 breadcrumb、block hover 边界优化、输入框内边距调整、间距微调）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +45 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| lint error: Forbidden non-null-assertion（handleCloseTab 中 closingTab.documentId!） | 提取常量 const closingDocId = closingTab?.documentId 后使用 delete d[closingDocId] |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check --cached` | ✅ 通过（exit code 0） |
| `pnpm --dir apps/web typecheck` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web test` | ✅ 通过（13 files, 286 tests passed） |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors，1 warning 在 demo prototype） |
| `pnpm --dir apps/web build` | ✅ 通过（所有路由正常生成） |

**手工验证步骤说明**:
1. 打开 `/workspace`
2. 新建 draft A，输入标题和正文，不保存
3. 新建 draft B，输入不同标题和正文，不保存
4. 在 draft A/B 之间切换，确认内容不串、不丢
5. 关闭 draft A，Dock 不新增文档
6. 保存 draft B，Dock 才新增文档，tab 转真实文档
7. 打开已有 Dock 文档，保存走更新逻辑
8. Classic/Block 切换正常
9. Preview/Context Panel 正常
10. 关闭 tab 不黑屏

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入 | 中 | 后续需实现 |
| Block Edit 目前只有最小可见 UI | 中 | 未实现真实 block engine |
| Preview 目前仅为简单文本预览 | 低 | 未实现完整 Markdown 渲染 |

---

<!-- ============================================ -->
<!-- 分割线：Round 12 -->
<!-- ============================================ -->

## Phase Refactory Round 12 devlog -- 修复新建文档生命周期 + Block/Classic 模式切换

**时间戳**: 2026-04-28

**任务起止时间**: 22:38 - 22:55 CST（17 分钟）

**任务目标**: 修复新建空文档自动落库问题：新建 editor tab 时只创建前端本地 draft，不调用 createDockItem，保存时才落库；继续缩小 Editor 与原型差距：实现 Block Edit / Classic Edit 模式切换最小 UI。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +75 行（draft ID 生成、createDraftTab、handleNewNote、handleSaveEditor draft 识别、handleActivateTab、handleCloseTab、isEditorActive 判断）
- `apps/web/app/workspace/features/editor/EditorTabView.tsx` | M | +55 行（mode / isDraft props、Classic 模式保持、Block 模式最小 UI、保存按钮逻辑）
- `apps/web/app/workspace/features/editor/EditorOptionsMenu.tsx` | M | +35 行（mode 和 onSetMode props、Block Edit / Classic Edit 切换）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +50 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| draftCounter 闭包问题（普通变量在 useCallback 中导致 lint warning） | 改用 useRef 存储计数器，避免闭包陷阱 |
| draft 保存后 tab 转换需要同步更新 tabs 数组中的 tab id 和 documentId | 通过 setTabs(prev => prev.map(...)) 实现 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check --cached` | ✅ 通过（exit code 0） |
| `pnpm --dir apps/web typecheck` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web test` | ✅ 通过（13 files, 286 tests passed） |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors，1 warning 在 demo prototype） |
| `pnpm --dir apps/web build` | ✅ 通过（所有路由正常生成） |

**手工验证步骤说明**:
1. 打开 `/workspace`
2. 点击 TopNav Editor，在没有文档时进入本地 draft editor（标题 Untitled，正文为空）
3. 不输入内容直接关闭 tab，Dock 不新增 New Note/Untitled
4. 新建 draft，输入内容但不保存，关闭后 Dock 不新增文档
5. 新建 draft，输入内容后保存，Dock 才出现对应文档，tab 从 draft 转为真实文档 tab
6. 从 Dock/Home 打开已有文档，保存走更新逻辑（不新建）
7. Classic / Block 模式切换正常（通过 Editor Options 下拉菜单）
8. Preview / Context Panel 在 Classic 和 Block 模式下都正常
9. 关闭 tab 不黑屏

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入 | 中 | 后续需实现 |
| Block Edit 目前只有最小可见 UI | 中 | 未实现真实 block engine |
| Preview 目前仅为简单文本预览 | 低 | 未实现完整 Markdown 渲染 |

---

<!-- ============================================ -->
<!-- 分割线：Round 11 -->
<!-- ============================================ -->

## Phase Refactory Round 11 devlog -- Editor Preview / Context Panel 最小 UI 对齐

**时间戳**: 2026-04-28

**任务起止时间**: 22:15 - 22:30 CST（15 分钟）

**任务目标**: 继续缩小真实 Editor 与原型 Editor 的差距，实现 Preview 与 Context Panel 的最小 UI，不做真实编辑器引擎。

**改动文件及行数**:
- `apps/web/app/workspace/features/editor/EditorTabView.tsx` | M | +85 行（Preview toggle、左右 split 布局、Context Panel toggle、绝对定位抽屉、toolbar 右侧扩展）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +35 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check --cached` | ✅ 通过（exit code 0） |
| `pnpm --dir apps/web typecheck` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web test` | ✅ 通过（13 files, 286 tests passed） |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors，1 warning 在 demo prototype） |
| `pnpm --dir apps/web build` | ✅ 通过（所有路由正常生成） |

**手工验证步骤说明**:
1. 打开 `/workspace`
2. 进入 Editor（新建或打开文档）
3. 点击 Preview toggle（BookOpen 图标），确认右侧预览区出现，显示标题与正文
4. 再次点击 Preview toggle，确认恢复单栏编辑
5. 打开 Context Panel toggle（PanelRight 图标），确认右侧抽屉出现，显示 3 张占位卡片
6. 点击抽屉右上角 X 或再次点击 Context Panel toggle，确认抽屉消失
7. 保存功能仍可用（修改内容后保存按钮出现且可点击）
8. 关闭 tab 不黑屏
9. TopNav 不遮挡 editor tabs

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入 | 中 | 后续需实现 |
| Block Edit 模式尚未实现 | 中 | 后续需实现 |
| Preview 目前仅为简单文本预览 | 低 | 未实现完整 Markdown 渲染 |

---

<!-- ============================================ -->
<!-- 分割线：Round 10 -->
<!-- ============================================ -->

## Phase Refactory Round 10 devlog -- 修复关闭 Editor Tab 黑屏

**时间戳**: 2026-04-28

**任务起止时间**: 22:00 - 22:05 CST（5 分钟）

**任务目标**: 修复关闭任意 editor tab 后页面黑屏只剩 TopNav 的问题。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +35 行（handleCloseTab 重写：关闭 active editor tab 后若切换到另一个 editor tab 同步设置 editingItemId、切换到 home/mind/dock 才设为 null、关闭非 active tab 时 editingItemId 保持不变）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +30 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web test` | ✅ 通过（13 files, 286 tests passed） |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors，1 warning 在 demo prototype） |
| `pnpm --dir apps/web build` | ✅ 通过（所有路由正常生成） |

**手工验证步骤说明**:
1. 打开 `/workspace`
2. 进入 Editor（新建或打开文档）
3. 新建多个 editor tab
4. 关闭任意一个 editor tab，页面不应黑屏，应自动切换到相邻 tab 并显示内容
5. 关闭最后一个 editor tab，应正确回退到 Home 视图
6. TopNav 状态与当前视图一致

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入 | 中 | 后续需实现 |
| Preview 切换按钮（btn-toggle-preview）尚未实现 | 中 | Round 11 已实现 |
| Context Panel（右侧抽屉）未实现 | 中 | Round 11 已实现 |
| Block Edit 模式尚未实现 | 中 | 后续需实现 |

---

<!-- ============================================ -->
<!-- 分割线：Round 9 -->
<!-- ============================================ -->

## Phase Refactory Round 9 devlog -- 日志流程修正 + Classic Toolbar 最小 UI

**时间戳**: 2026-04-28

**任务起止时间**: 17:31 - 21:47 CST（4 小时 16 分钟）

**任务目标**: 修正日志流程：明确手工验证标准；继续缩小 Editor 与原型 gap，实现 Classic Toolbar 最小 UI。

**改动文件及行数**:
- `apps/web/app/workspace/features/editor/EditorTabView.tsx` | M | +55 行（toolbar 容器、图标按钮分组、竖线分隔）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +35 行（日志规范更正 + 本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check --cached` | ✅ 通过（exit code 0） |
| `pnpm --dir apps/web typecheck` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web test` | ✅ 通过（13 files, 286 tests passed） |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors，1 warning 在 demo prototype） |
| `pnpm --dir apps/web build` | ✅ 通过（所有路由正常生成） |

**手工验证步骤说明**:
1. 打开 `/workspace`
2. 进入 Editor（通过 Home 新建文档或 Dock 打开文档）
3. 确认 TopNav 不遮挡 editor tabs / + 按钮 / More 按钮
4. 新建 tab 可出现（点击 + 按钮）
5. 关闭 editor tab 可用（hover 显示 x，点击关闭）
6. 修改标题或正文后保存按钮出现且可保存
7. Classic Toolbar 可见，包含 Bold / Italic / Strikethrough / Link / Code / Image / Bullet List / Numbered List 图标按钮
8. Toolbar 按钮 hover 有反馈（颜色变化）

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Toolbar 按钮目前只做 UI，未实现真实 Markdown 插入 | 中 | Round 16 已实现 |
| Preview 切换按钮（btn-toggle-preview）尚未实现 | 中 | Round 11 已实现 |
| Context Panel（右侧抽屉）未实现 | 中 | Round 11 已实现 |

---

<!-- ============================================ -->
<!-- 分割线：Round 8 -->
<!-- ============================================ -->

## Phase Refactory Round 8 devlog -- Editor 顶栏遮挡修复

**时间戳**: 2026-04-28

**任务起止时间**: 17:09 - 17:13 CST（4 分钟）

**任务目标**: 修复 Editor view 中 editor tabs 被固定 TopNav 遮挡的问题。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +5 行（Editor 场景容器增加 mt-[72px]）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +25 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| Editor 面板的 h-14 标签栏与 fixed 定位的 TopNav 重叠 | 给 Editor 容器增加 mt-[72px]，留出 TopNav 占用空间 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check --cached` | ✅ 通过（exit code 0） |
| `pnpm --dir apps/web typecheck` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web test` | ✅ 通过（13 files, 286 tests passed） |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors，1 warning 在 demo prototype） |
| `pnpm --dir apps/web build` | ✅ 通过（所有路由正常生成） |

**手工验证步骤说明**:
1. 打开 `/workspace`
2. 进入 Editor，确认 editor tabs 完整暴露于 TopNav 下方，不再重叠
3. Home/Mind/Dock 视图不受此改动影响

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Editor 面板的 mt-[72px] 为硬编码值 | 低 | 若 TopNav 高度变化需同步调整 |
| 后续可考虑让 TopNav 在 Editor 场景下自动进入 collapsed 状态 | 低 | 进一步释放空间 |

---

<!-- ============================================ -->
<!-- 分割线：Round 7 -->
<!-- ============================================ -->

## Phase Refactory Round 7 devlog -- Editor View 对齐原型

**时间戳**: 2026-04-28

**任务起止时间**: 16:40 - 17:11 CST（31 分钟）

**任务目标**: 缩小 `/workspace` Editor view 与黄金原型 Editor view 的视觉差距。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +45 行（Editor 外壳重构：移除全局第二行 WorkspaceTabs、Editor 改为独立一等视图、Home/Mind/Dock 与 Editor 互斥条件渲染）
- `apps/web/app/workspace/features/shared/WorkspaceTabs.tsx` | M | +55 行（容器改为 flex-1 items-end h-full、Tab 样式 rounded-t-xl、Active tab 顶部渐变指示条、Close 按钮 hover 显示）
- `apps/web/app/workspace/features/editor/EditorTabView.tsx` | M | +35 行（外层 bg-[#1A1A1A]、内容区 max-w-3xl mx-auto py-16 px-10、Title text-3xl font-semibold、空态居中）
- `apps/web/app/workspace/features/editor/EditorOptionsMenu.tsx` | A | +85 行（新增 - More 按钮下拉菜单：VIEW OPTIONS / ACTIONS）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +45 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| 原 Editor 区域与 Home/Mind/Dock 共用容器 div，重构时闭合结构错乱 | 将 Editor 和非 Editor 分为两个互斥条件渲染块（isEditorActive / !isEditorActive） |
| WorkspaceTabs 旧样式使用 rounded-xl + h-8，与原型 rounded-t-xl + 底部对齐不符 | 完全重写 WorkspaceTabs，对齐原型的 items-end + rounded-t-xl + border-top 风格 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --check --cached` | ✅ 通过（exit code 0） |
| `pnpm --dir apps/web typecheck` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web test` | ✅ 通过（13 files, 286 tests passed） |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors，1 warning 在 demo prototype） |
| `pnpm --dir apps/web build` | ✅ 通过（所有路由正常生成） |

**手工验证步骤说明**:
1. 打开 `/workspace`
2. 进入 Editor，确认标签栏完整暴露，样式对齐原型（rounded-t-xl、顶部渐变指示条）
3. 编辑区内容区 max-w-3xl 居中，标题 text-3xl font-semibold
4. 新建 tab 可出现，关闭 tab 可用
5. Editor Options 下拉菜单可见（Block Edit / Classic Edit / Rename / Move to / Export / Delete）
6. Home/Mind/Dock 切换正常，无 layout jump

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Editor 内容区仍为 textarea | 中 | 需后续替换为 Block Editor |
| Editor Options 下拉菜单仅 UI，功能待接后端 | 中 | 后续需实现 |
| Classic Toolbar 尚未实现 | 中 | Round 9 已实现最小 UI |

---

<!-- ============================================ -->
<!-- 分割线：Round 6 -->
<!-- ============================================ -->

## Phase Refactory Round 6 devlog -- Dock 视觉残留回收 + 日志更正

**时间戳**: 2026-04-28

**任务起止时间**: 16:31 - 16:36 CST（5 分钟）

**任务目标**: 回收 Dock 视觉改动，将过度设计的视觉效果恢复为简洁风格。

**改动文件及行数**:
- `apps/web/app/workspace/features/dock/DockInlineView.tsx` | M | +45 行（移除 atlax-deep-space 背景类、详情面板背景恢复为实色、空态文案英→中、列表卡片简化、移除 ID 展示、详情栏收缩、按钮简化、容器背景移除）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +30 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web test` | ✅ 通过（13 files, 286 tests passed） |
| `pnpm --dir apps/web lint` | ✅ 通过（0 errors） |
| `pnpm --dir apps/web build` | ✅ 通过（所有路由正常生成） |
| `git diff --check --cached` | ✅ 通过（exit code 0） |

**手工验证步骤说明**:
1. 打开 `/workspace`
2. 进入 Dock，确认 Dock 视觉简洁，无过度设计
3. 空态文案为中文（"暂无条目" / "录入"）
4. 列表卡片简化，无 ChevronRight 箭头
5. 详情面板宽度 w-80，padding p-4
6. 按钮为纯文字 + hover 下划线
7. archive/reopen/suggest 功能链路完整

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Dock 视觉与 TopNav/Home 风格暂时脱节 | 低 | 需在后续阶段重新规划 Dock 的 Golden UI 迁移 |
| 现有 Dock 交互逻辑较重 | 低 | 未来需配合后端 API 进行性能优化 |

---

<!-- ============================================ -->
<!-- 分割线：Round 5 -->
<!-- ============================================ -->

## Phase Refactory Round 5 devlog -- Dock Visual Reversion

**时间戳**: 2026-04-28

**任务起止时间**: 16:21 - 16:26 CST（5 分钟）

**任务目标**: 回收 Dock 视觉改动：移除过度设计的背景效果和模糊效果，恢复为简洁实色背景。

**改动文件及行数**:
- `apps/web/app/workspace/features/dock/DockInlineView.tsx` | M | +15 行（移除 atlax-deep-space 背景类、详情面板背景恢复为实色 bg-[#0A0D14]、去除阴影和模糊效果）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +25 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 通过 |
| `pnpm --dir apps/web test` | ✅ 通过 |
| `pnpm --dir apps/web lint` | ✅ 通过 |
| `pnpm --dir apps/web build` | ✅ 通过 |
| `git diff --check --cached` | ✅ 通过 |

**手工验证步骤说明**:
1. 打开 `/workspace`
2. 进入 Dock，确认 Dock 视觉简洁，无过度设计
3. 详情面板为实色背景，无模糊效果
4. archive/reopen/suggest 功能链路完整

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Dock 视觉与 TopNav/Home 风格暂时脱节 | 低 | 需在后续阶段重新规划 Dock 的 Golden UI 迁移 |

---

<!-- ============================================ -->
<!-- 分割线：Round 4 -->
<!-- ============================================ -->

## Phase Refactory Round 4 devlog -- Golden UI Issue Fixes

**时间戳**: 2026-04-28

**任务起止时间**: 15:56 - 16:03 CST（7 分钟）

**任务目标**: 修复 TopNav 缺少 Editor、搜索框无法恢复、WorkspaceTabs 与原型冲突、文档打开没有进入 Editor view、Home 视觉偏离原型等问题。

**改动文件及行数**:
- `apps/web/app/workspace/_components/GoldenTopNav.tsx` | M | +25 行（GoldenViewId 添加 editor 选项、Editor 入口 PenTool 图标、激活状态）
- `apps/web/app/workspace/page.tsx` | M | +45 行（Search 开启后 Escape/点击导航/点击 logo/Send 按钮恢复、WorkspaceTabs 呈现条件修正、文档打开设置 activeModule 为 editor、Home 视觉修复）
- `apps/web/app/workspace/features/home/HomeView.tsx` | M | +35 行（移除问候语和 Sparkles、修复标题及节点数文案、输入框及悬浮卡片点缀色改为紫色 #a78bfa、卡片尺寸 rounded-2xl p-6、卡片图标 rounded-full、弱化 Recent Intelligence 显示优先级）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +40 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web typecheck` | ✅ 0 errors |
| `pnpm --dir apps/web test` | ✅ 286 tests passed |
| `pnpm --dir apps/web lint` | ✅ 0 errors (1 warning in demo proto) |
| `pnpm --dir apps/web build` | ✅ Success |
| `git diff --check --cached` | ✅ 0 errors |

**手工验证步骤说明**:
1. TopNav 显示 Editor，可点击进入
2. 搜索栏展开后，按 ESC、点任意处都能恢复
3. WorkspaceTabs 仅在 Editor view 出现
4. 各个入口新建/打开文档都能直接跳转 Editor
5. 主页视觉元素与黄金原型对齐

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Editor view 距离 Golden 原型的功能要求仍有差距 | 中 | 需要继续重构 |
| Search 和全局指令面板尚未打通真正后端逻辑 | 低 | 后续需接入 |

---

<!-- ============================================ -->
<!-- 分割线：Round 3 -->
<!-- ============================================ -->

## Phase Refactory Round 3 devlog -- Converge Top Nav and Home view to Golden Prototype

**时间戳**: 2026-04-28

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 将 Top Nav 和 Home view 收敛到 Golden Prototype 美学标准。

**改动文件及行数**:
- `apps/web/app/workspace/_components/GoldenTopNav.tsx` | A | +280 行（新增 - Floating pill nav、glassmorphism background、active state highlights、dragging to reposition、real user state for Account dropdown and Logout、Search UI Spotlight style、Capture (+) entry）
- `apps/web/app/workspace/features/home/HomeView.tsx` | M | +65 行（atlax-deep-space background with nebula glows、spacing/typography/card aesthetics、Recent Intelligence list with glass panels and hover states）
- `apps/web/app/workspace/features/shared/WorkspaceTabs.tsx` | M | +20 行（icons 更新为 Network for Mind、Library for Dock）
- `apps/web/app/workspace/features/dock/DockInlineView.tsx` | M | +35 行（atlax-deep-space、improved card/detail panel styling）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +50 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| Prototype search/account logic mapping | Reimplemented using real workspace state while keeping prototype visual behavior |
| Nav overlap with Tabs | Adjusted mt-[84px] in page.tsx for clean breathing room |
| Logout missing in workspace | Added logoutUser integration in GoldenTopNav |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| lint | ✅ 0 errors |
| typecheck | ✅ 0 errors |
| test | ✅ 13 files, 286 tests passed |
| build | ✅ successful (next build, all routes generated) |
| git diff --check | ✅ exit code 0 (review found trailing whitespace in HomeView.tsx L37, fixed in review patch) |

**手工验证步骤说明**:
1. Open `/workspace` -> Top nav should be a floating pill with glass effect
2. Switch Home/Mind/Dock -> Nav active state should update, view should switch
3. Home view should show Star Input, and 3-card grid with high-end glass effects
4. Search button should expand to Spotlight-style input
5. Account button should show dropdown with Logout
6. Capture (+) button in nav should open the floating recorder
7. WorkspaceTabs should only appear in Editor view

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Mind view still uses hash-based SVG | 中 | needs real Canvas engine |
| Editor is still basic textarea | 中 | needs Block Editor |
| Search in Top Nav is UI only | 低 | needs backend search API integration |

---

<!-- ============================================ -->
<!-- 分割线：Round 2 -->
<!-- ============================================ -->

## Phase Refactory Round 2 devlog -- TopNav Home/Mind/Dock, Home entry page, WorkspaceTabs, Editor tab-based opening

**时间戳**: 2026-04-27

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 重构 AppShell：TopNav 只保留 Home/Mind/Dock；默认 activeModule = 'home'；添加 WorkspaceTabs；HomeView 组件；EditorTabView 组件。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +380 行（AppShell 重构：ViewType -> ActiveModule、默认 activeModule = 'home'、WorkspaceTabs 行、Tab 状态管理、openEditorTab、handleNewNote、handleActivateTab、handleCloseTab）
- `apps/web/app/workspace/features/home/HomeView.tsx` | A | +220 行（新增 - Greeting with user name + time-of-day、3 entry cards、Recent Documents list、Left sidebar）
- `apps/web/app/workspace/features/editor/EditorTabView.tsx` | A | +180 行（新增 - Tab-based editor、Dirty tracking、Empty state）
- `apps/web/app/workspace/features/shared/WorkspaceTabs.tsx` | A | +120 行（新增 - Tab bar with icons、Close button、+ button）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +55 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| getMindGraphSnapshot/ensureCaptureNode don't exist in repository.ts | Used listMindNodes/listMindEdges + upsertMindNode instead |
| MindGraphSnapshot type not exported | Used StoredMindNode[] + StoredMindEdge[] directly |
| HomeView unused onSwitchToMind prop | Removed from interface and call site |
| TabType unused import | Removed from page.tsx import |
| handleUpdateText unused after Dock detail panel simplification | Removed function |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| lint | ✅ 0 errors |
| typecheck | ✅ 0 errors |
| test | ✅ 13 files, 286 tests passed |
| build | ✅ successful (next build, all routes generated) |
| git diff --cached --check | ✅ exit code 0 |

**手工验证步骤说明**:
1. /workspace defaults to Home (not Mind)
2. Top nav only Home / Mind / Dock
3. Second row shows WorkspaceTabs with "+" button
4. Editor not in top nav
5. Dock/Home click document -> opens/activates Editor tab
6. Recent Documents shows and updates
7. Mind and Dock still switchable, no white screen or console errors

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Mind SVG layout uses hash-based positioning | 中 | needs Canvas/force-directed engine |
| Editor is still textarea | 中 | needs Block Editor |
| Tab state is client-only (no persistence) | 中 | needs workspace session API integration |
| Home Recent Documents reads from Dock items | 低 | should use listRecentDocuments API |
| No document upload functionality yet | 低 | Upload card is a placeholder |

---

<!-- ============================================ -->
<!-- 分割线：Round 1 Review -->
<!-- ============================================ -->

## Phase Refactory Round 1 Review devlog -- Review 问题修复

**时间戳**: 2026-04-27

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 修复 Round 1 review 发现的 5 个问题：lib/repository.ts 12 个 unused import lint 错误、trailing whitespace / EOF issues、workspace/page.tsx 默认 Mind + handleCapture real id、StructureViews.tsx / WorldTreeView.tsx unstaged、REBUILD_EXECUTION_MASTER_PLAN.md version control。

**改动文件及行数**:
- `apps/web/lib/repository.ts` | M | -35 行（移除 12 个 unused imports/types：buildDocumentAndCapturePatches、documentFromEntry、entryFromDocument、Document、DocumentType、MindEdge、MindNode、documentsTable、capturesTable、DocumentRecord、CaptureRecord、PersistedCapture）
- `docs/engineering/dev_log/Phase3/phase3-devlog-frontend.md` | M | +3 行（移除 trailing whitespace lines 1400, 1429）
- `docs/product/BACKEND_TECH_SPEC .md` | M | +5 行（移除 trailing whitespace lines 233, 234, 270-273）
- `docs/product/FRONTEND_TECH_SPEC.md` | M | +1 行（移除 EOF blank line line 465）
- `docs/product/structure—design/STRUCTURE_ALGORITHEM_DESIGN.md` | M | +10 行（移除 trailing whitespace lines 5, 8-12, 79, 887-889, 923-929）
- `apps/web/app/workspace/page.tsx` | M | +8 行（移除 localStorage read from first useEffect、handleCapture 使用 createDockItem 返回的 newId）
- `.gitignore` | M | -1 行（移除 REBUILD_EXECUTION_MASTER_PLAN.md）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | M | +55 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| lib/repository.ts 12 unused import/type lint errors | 移除 12 个 unused imports/types，不使用 eslint-disable |
| git diff --cached --check 报告 trailing whitespace 和 blank-line-at-EOF | sed -i '' 's/[[:space:]]*$//' 修复所有受影响文件 |
| activeModule 初始化 'mind' 但 localStorage 可能覆盖为旧值 | 移除第一个 useEffect 中的 localStorage read |
| handleCapture 使用 dockItemId: 0 而非真实 id | 捕获 createDockItem 返回值作为 newId 传入 recordEvent |
| StructureViews.tsx / WorldTreeView.tsx staged 但未在当前 page.tsx 中使用 | git reset HEAD 移除 staged，文件保留在 working tree 作为 legacy code |
| REBUILD_EXECUTION_MASTER_PLAN.md 在 .gitignore 中 | 从 .gitignore 移除并 staged |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web lint` | ✅ 0 errors, 0 warnings |
| `pnpm --dir apps/web typecheck` | ✅ 0 errors |
| `pnpm --dir apps/web test -- --run` | ✅ 12 files, 262 tests passed |
| `pnpm --filter @atlax/domain typecheck` | ✅ 0 errors |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 19 files, 303 tests passed |
| `git diff --cached --check` | ✅ exit code 0, no whitespace/EOF issues |

**手工验证步骤说明**:
1. Open /workspace -> always defaults to Mind view regardless of old localStorage
2. Mind GROW input creates Dock Item with correct dockItemId in event record
3. No lint errors in web package
4. No trailing whitespace in staged files
5. StructureViews.tsx / WorldTreeView.tsx NOT in staged files
6. REBUILD_EXECUTION_MASTER_PLAN.md IS in staged files

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| WorldTreeView 从 staged 移除，后续 Mind Canvas 渲染时需重新集成 | 低 | 文件保留在 working tree |
| localStorage 不再持久化 activeModule | 低 | 每次刷新默认 Mind，用户手动切换仍通过第二个 useEffect 写入 |

---

<!-- ============================================ -->
<!-- 分割线：Round 1 -->
<!-- ============================================ -->

## Phase Refactory Round 1 devlog -- Converge workspace to top 3 modules: Editor / Mind / Dock

**时间戳**: 2026-04-27

**任务起止时间**: 原始日志未记录精确起止时间

**任务目标**: 将 workspace 收敛为 top 3 模块：Editor / Mind / Dock，Mind 作为默认视图。

**改动文件及行数**:
- `apps/web/app/workspace/page.tsx` | M | +320 行（完整重写：ViewType -> ActiveModule = editor | mind | dock、默认 activeModule = mind、移除左侧 Sidebar 替换为 top nav bar、Mind View、Editor View、Dock View 保留、Chat/Classic recorder 保留为 FloatingRecorder）
- `apps/web/app/globals.css` | M | +35 行（dark bg #0E0E11 -> #030508、.atlax-deep-space、.atlax-topbar、.atlax-mainstage）
- `apps/web/app/layout.tsx` | M | +5 行（html className=dark、body className=bg-[#030508]）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-frontend.md` | A | +65 行（本轮开发日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| recordEvent type mismatch | Changed to capture_created event type |
| Unused imports/vars lint errors | Cleaned unused icons, repo functions, isDark/handleLogout |
| DockCard unused destructured params | Only destructure used props |
| FloatingRecorder userId unused | Removed from props and call site |
| lib/repository.ts 12 pre-existing lint errors | Backend/domain layer, not in scope |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `node -v && pnpm -v` | v24.14.0 / 10.0.0 |
| lint | ✅ page.tsx 0 errors, repository.ts 12 pre-existing (not in scope) |
| typecheck | ✅ 0 errors |
| test | ✅ 12 files, 262 tests passed |
| git diff --cached --check | ✅ exit code 0 |

**手工验证步骤说明**:
1. Open /workspace -> default Mind view (Nebula Tree + deep space + GROW input)
2. Top nav only Editor / Mind / Dock, active item has green dot
3. Click Editor/Dock -> switches MainStage, no white screen or console errors
4. Mind GROW input creates Dock Item
5. Dock click item -> detail panel, can edit/archive/jump to Editor
6. Review/Chat/Widget/Calendar not in main nav

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Mind view is placeholder | 中 | needs Canvas engine and nebula tree rendering |
| Editor is simplified textarea | 中 | needs Block Editor |
| FloatingRecorder simplified Chat | 低 | needs full Chat interaction |
| Old _components not cleaned | 低 | WorldTreeView/StructureViews/ExpandedEditor still exist |
| Theme toggle missing | 低 | no light/dark switch entry yet |

---

## 关联文档

| 文档 | 路径 |
|------|------|
| 架构说明书 | `docs/product/ARCHITECTURE.md` |
| 技术规格 | `docs/product/TECH_SPEC.md` |
| Golden Prototype | `docs/product/Atlax_MindDock_Landing_Page.txt` |
