# M2-08.4｜Chat UX 修复与交互重构

| 项目 | 内容 |
|------|------|
| 模块 | M2-08 Chat UX |
| 状态 | 待复审 |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 目标

修复 Chat 空白页阻塞、对齐 Chat 交互模型、优化 Dock 可读性，保持 FRONT_DESIGN 设计语言一致。

---

## 2. 问题复现路径

### P0-1：Chat 展开空白页

1. 切换到 Chat 模式
2. 输入内容后按 Enter（触发 `setStep('confirm'); setExpanded(true)`）
3. `ChatFlowContainer` 中 `step='input' && !expanded` 条件不匹配
4. `step='confirm'` 条件匹配但 expanded 状态混乱
5. 若 `step='input' && expanded=true`，所有条件分支均不匹配 → `return null` → 空白页
6. 用户无退出路径，界面完全阻塞

### P1-2："去 Dock 查看"行为错误

1. Chat done 步点击"去 Dock 查看"
2. 仅执行 `setActiveNav('dock')`，未切换 `inputMode` 回 classic
3. 结果：Dock 视图上方仍覆盖 Chat 浮层，用户无法正常操作

---

## 3. 修复点

### P0-1 + P1-4：Chat 交互层级重构

**根本方案**：废弃旧的 `ChatFlowContainer`（全屏浮层 + expanded 状态），替换为 `ChatInputBar`（底部输入条 + 沉浸模式分离）。

| 旧模型 | 新模型 |
|--------|--------|
| 侧栏切 Chat → 全屏遮罩 + 居中浮层 | 侧栏切 Chat → 仅切换底部输入框样式，主区内容仍可见 |
| expanded 状态控制浮层大小 | 无 expanded，输入条始终在底部 |
| 无退出路径（空白页阻塞） | 每个步骤都有明确退出/返回路径 |
| 发送后卡在浮层 | 发送后消息进入消息流，底部保持输入框 |
| 无沉浸模式 | "聚焦模式"按钮 → 进入沉浸视图（消息流 + 底部输入） |
| done 步仅居中展示 | done 步：底部条内联展示 + 沉浸模式中消息流展示 |

**新增状态**：
- `chatMessages: ChatMessage[]` — 消息流记录
- `chatImmersive: boolean` — 沉浸模式开关

**新增组件**：
- `ChatInputBar` — 替代 `ChatFlowContainer`，所有步骤都有渲染，无 `return null` 空白

**关键行为**：
- `step='input'`：底部输入条（Mic + input + Send）
- `step='confirm'`：底部展开确认面板
- `step='context'`：底部展开上下文补充面板
- `step='tags'`：底部展开标签确认面板
- `step='done'`：底部内联成功反馈（继续记录/去 Dock 查看）
- 沉浸模式：全屏消息流 + 底部输入条

### P1-2："去 Dock 查看"行为修复

`onGoToDock` 回调现在执行：
1. `setInputMode('classic')` — 切回 Classic 模式
2. `resetChatState()` — 重置所有 chat 状态（step/draft/context/tags/immersive）
3. `setChatMessages([])` — 清空消息流
4. `setActiveNav('dock')` — 切换到 Dock 视图

### P1-3：Dock 长文本展示优化

1. **DockCard 卡片模式**：`line-clamp-3` 限制正文 3 行，标签最多显示 3 个 + "+N" 提示
2. **DockCard 列表模式**：单行紧凑布局（状态标签 + 截断正文 + 时间）
3. **视图切换按钮**：卡片/列表两个图标按钮，位于 Dock 列表上方
4. **localStorage 持久化**：`atlax-dock-view-mode` 键，默认 `'card'`

---

## 4. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/app/workspace/page.tsx` | 重大修改 | Chat 交互重构 + Dock 展示优化 |
| `docs/engineering/dev_log/Phase2/phase2-acceptance.md` | 修改 | 状态与结论更新 |
| `docs/engineering/dev_log/Phase2/phase-2.14.4-chat-ux-rework.md` | 新增 | 本开发日志 |

---

## 5. demo-path 对照矩阵

| 步骤 | 操作 | 预期结果 | 2.14.4 覆盖 | 说明 |
|------|------|----------|-------------|------|
| 1 | 注册/登录 | 进入工作区 | ✅ | 无变更 |
| 2 | 快速输入 | Dock 列表新增 | ✅ | 无变更 |
| 3 | 展开输入 | 弹出编辑器 | ✅ | 无变更 |
| 4 | 生成建议 | 显示分类/标签/动作 | ✅ | 无变更 |
| 5 | 编辑标签 | 标签出现 | ✅ | 无变更 |
| 6 | 接受归档 | 条目归档 | ✅ | 无变更 |
| 7 | 忽略条目 | 状态变为 ignored | ✅ | 无变更 |
| 8 | 浏览归档 | Entries 列表 + 筛选栏 | ✅ | 无变更 |
| 9 | 筛选 | status/type/tag/project 四维筛选 | ✅ | 无变更 |
| 10 | 查看详情 | 标题/内容/标签/项目/动作 | ✅ | 无变更 |
| 11 | 编辑归档 | 修改内容/标签/项目 | ✅ | 无变更 |
| 12 | 重新整理 | 条目回到 Dock | ✅ | 无变更 |
| 13 | 重新建议 | 生成新建议 | ✅ | 无变更 |
| 14 | Chat 模式 | 切换到 Chat | ✅ | **2.14.4 重构：侧栏切模式仅切换底部输入框** |
| 15 | Chat 输入 | 进入确认页 | ✅ | **2.14.4 重构：底部展开确认面板** |
| 16 | Chat 标签 | 添加/删除标签 | ✅ | **2.14.4 重构：底部展开标签面板** |
| 17 | Chat 入 Dock | 成功反馈 | ✅ | **2.14.4 重构：底部内联成功反馈** |
| 18 | Chat 结果 | 去 Dock 查看 | ✅ | **2.14.4 修复：切回 classic + dock 视图** |
| 19 | Review 概览 | 统计卡片 + 最近归档列表 | ✅ | 无变更 |

---

## 6. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm --dir apps/web lint` | PASS | 0 errors, 0 warnings |
| `pnpm --dir apps/web typecheck` | PASS | 无类型错误 |
| `pnpm --dir apps/web test -- --run` | PASS | 93/93 测试通过（8 test files） |

---

## 7. 未完成项

| 项目 | 说明 | 计划 |
|------|------|------|
| 散点/关系图视图 | Dock 视图模式切换中预留了扩展位，但未实现散点/关系图 | 需要引入图形库（如 d3-force / react-flow），设计节点-边数据模型，在文档中给出技术方案 |
| Chat AI 追问 | context 步骤仍为用户手动补充 | Phase 3 接入 LLM |
| 消息流持久化 | chatMessages 仅在内存中，刷新后丢失 | 可选：存入 localStorage 或 Dexie |
| workspace/page.tsx 单文件 | 约 1800+ 行 | 未来拆分到 _components/ |
