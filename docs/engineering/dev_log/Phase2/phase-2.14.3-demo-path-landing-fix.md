# M2-08.3｜回归补丁：功能补齐 + Landing Page 替换

| 项目 | 内容 |
|------|------|
| 模块 | M2-08 回归补丁 |
| 状态 | 待复审 |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 目标

修复 M2-08.2 遗留的功能缺失，补齐 Entries 四维筛选、Archived 详情 actions、Review 最近归档列表、Chat 成功反馈态，并替换 Landing Page 为最新 Gemini 设计。保持 FRONT_DESIGN 设计语言一致，不允许通过删功能"规避问题"。

---

## 2. 改动摘要

### P0：Entries 四维筛选补齐

1. **新增 `entryFilterStatus` 状态**：添加第四维 status 筛选
2. **新增 `ENTRY_STATUS_OPTIONS` 常量**：pending/suggested/archived/ignored/reopened 五种状态选项
3. **新增 `dockItemStatusMap`**：`Map<dockItemId, status>` 映射，基于 `items` 数组构建
4. **`filteredEntries` 增加 status 过滤**：通过 `entry.sourceDockItemId` 查找对应 DockItem 状态，真实过滤
5. **`EntriesFilterBar` 新增 status 下拉**：位于筛选栏首位，使用 Filter 图标
6. **`hasActiveFilters` / `clearEntryFilters` 包含 status**

### P1：Archived 详情补齐 actions

7. **`ArchivedEntryDetail` 只读态展示 actions**：在 project 之后、归档时间之前展示动作列表
8. **空态文案**：actions 为空时显示"暂无动作建议"（italic + 低对比度色）
9. **样式**：amber 色系标签 + Sparkles 图标，与 DockItem 详情的 action 建议样式一致

### P1：Review 补齐最近归档列表

10. **`ReviewView` 新增 `archivedEntries` 和 `onSelectArchivedEntry` props**
11. **新增"最近归档"卡片**：展示最近 10 条归档，每条显示标题、类型、标签（最多3个）、项目、归档日期
12. **点击打开详情**：调用 `onSelectArchivedEntry(entry.id)`，自动切换到 Entries 视图并选中条目
13. **保留现有卡片**：概览卡片和行为指标卡片未删除

### P1：Chat 成功反馈态补齐

14. **`handleChatFinalSubmit` 改为 `setChatStep('done')`**：提交后进入 done 步而非直接回到 input
15. **`ChatFlowContainer` 新增 `onGoToDock` prop**
16. **新增 done 步渲染**：绿色勾图标 + "已成功入 Dock" + 两个按钮：
    - "继续记录"：`setStep('input'); setExpanded(false)`
    - "去 Dock 查看"：`onGoToDock()` → 切换到 Dock 视图
17. **事件语义不变**：`chat_guided_capture_created` 仍在 `handleSaveEntry` 中 `inputMode === 'chat'` 时触发

### 新增：Landing Page 替换

18. **`apps/web/app/page.tsx` 完全重写**：基于 Gemini 设计稿 `Atlax_MindDock_Landing_Page.tsx`
19. **品牌 Logo 动画**：拟物化 Logo（毛玻璃底座 + 渐变流光 + 玻璃高光 + 白色核心）
20. **品牌排版**：ATLAX 宽字距 + Mind/Dock 粗细对比
21. **Slogan**：Sparkles 图标 + 已登录/未登录差异化文案
22. **CTA 按钮**：深色/白色反转 + 流光 shimmer 动画 + 回弹缩放
23. **穿越转场**：点击进入后 800ms 空间放大 + 毛玻璃遮罩 + 圆形爆发遮罩
24. **背景光晕**：蓝紫色/靛紫色旋转模糊色块
25. **暗色模式**：跟随系统 `prefers-color-scheme`
26. **"进入工作区"按钮跳转 `/workspace`**：已登录用户显示"继续整理"

### 文档与配置

27. **`.gitignore` 更新**：添加 `docs/product/Front_Design_by_Gemini(do-not-push-on-git)/`
28. **`phase2-acceptance.md` 更新**：状态改为 2.14.3，M2-04/M2-07/首页/Chat/归档编辑/Entries筛选/Review列表 结论更新
29. **本开发日志新增**

---

## 3. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/app/workspace/page.tsx` | 修改 | 四维筛选 + actions 展示 + Review 归档列表 + Chat done 步 |
| `apps/web/app/page.tsx` | 重写 | Gemini 设计 Landing Page |
| `.gitignore` | 修改 | 添加设计参考目录排除 |
| `docs/engineering/dev_log/Phase2/phase2-acceptance.md` | 修改 | 结论更新为 2.14.3 |
| `docs/engineering/dev_log/Phase2/phase-2.14.3-demo-path-landing-fix.md` | 新增 | 本开发日志 |

---

## 4. demo-path 对照矩阵

| 步骤 | 操作 | 预期结果 | 2.14.3 覆盖 | 说明 |
|------|------|----------|-------------|------|
| 1 | 注册/登录 | 进入工作区 | ✅ | 无变更 |
| 2 | 快速输入 | Dock 列表新增 | ✅ | 无变更 |
| 3 | 展开输入 | 弹出编辑器 | ✅ | 无变更 |
| 4 | 生成建议 | 显示分类/标签/动作 | ✅ | 无变更 |
| 5 | 编辑标签 | 标签出现 | ✅ | 无变更 |
| 6 | 接受归档 | 条目归档 | ✅ | 无变更 |
| 7 | 忽略条目 | 状态变为 ignored | ✅ | 无变更 |
| 8 | 浏览归档 | Entries 列表 + 筛选栏 | ✅ | 无变更 |
| 9 | 筛选 | status/type/tag/project 四维筛选 | ✅ | **2.14.3 补齐 status 筛选** |
| 10 | 查看详情 | 标题/内容/标签/项目/动作 | ✅ | **2.14.3 补齐 actions 展示** |
| 11 | 编辑归档 | 修改内容/标签/项目 | ✅ | 无变更 |
| 12 | 重新整理 | 条目回到 Dock | ✅ | 无变更 |
| 13 | 重新建议 | 生成新建议 | ✅ | 无变更 |
| 14 | Chat 模式 | 切换到 Chat | ✅ | 无变更 |
| 15 | Chat 输入 | 进入确认页 | ✅ | 无变更 |
| 16 | Chat 标签 | 添加/删除标签 | ✅ | 无变更 |
| 17 | Chat 入 Dock | 成功反馈 | ✅ | **2.14.3 补齐 done 反馈态** |
| 18 | Chat 结果 | 去 Dock 查看 | ✅ | **2.14.3 done 步"去 Dock 查看"按钮** |
| 19 | Review 概览 | 统计卡片 + 最近归档列表 | ✅ | **2.14.3 补齐最近归档列表** |

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
| workspace/page.tsx 仍为单文件 | 所有组件内联，约 1700+ 行 | 可维护性 |
| Landing Page 使用 `dangerouslySetInnerHTML` | shimmer keyframes 注入 | 安全性（内容可控） |
| Landing Page `style` 标签 | 不符合 FRONT_DESIGN "Tailwind 优先"原则 | 可迁移到 globals.css |
| EntryCard 未展示 DockItem 状态 | Entries 列表中条目未显示对应 DockItem 状态标签 | 信息可见性 |
