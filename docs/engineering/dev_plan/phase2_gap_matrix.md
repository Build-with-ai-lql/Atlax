# Phase 2 Gap Matrix（M2-01 输出）

更新时间：2026-04-23  
范围：`PRD v4.9`、`TECH_SPEC v4.9`、`ARCHITECTURE v4.9`、`mvp v4.9` 与当前仓库实现对照  
结论口径：`PASS` / `PARTIAL` / `FAIL`

---

## 1. 总结

- `PASS`：9 项
- `PARTIAL`：2 项
- `FAIL`：4 项
- 关键阻塞（进入后续模块前必须解决）：
  - Chat Mode 最小闭环缺失
  - 模式切换控制器缺失
  - 指标埋点与指标计算链路缺失
  - 数据模型未包含 `chat` sourceType

---

## 2. P0 对照矩阵（Phase 2）

| P0 项 | 文档要求 | 当前证据 | 结论 | Gap | 归属模块 |
|---|---|---|---|---|---|
| Classic Mode 主入口 | 工作台进入整理主线 | `workspace` 页与 Sidebar/Dock/Entries/Review 已落地 | PASS | - | M2-02 |
| Chat Mode 主入口 | 对话式进入同一主线 | `apps/web/app` 无 `chat` 路由或 Chat 面板实现 | FAIL | 缺少 Chat UI 与最小引导流程 | M2-03/M2-04 |
| 模式切换控制器 | Classic/Chat 切换，非普通 tab | Sidebar 仅 `dock/entries/review`，无模式状态机 | FAIL | 缺切换控制器与状态表达 | M2-03 |
| Capture 输入闭环 | 统一 Input Bar 提交到 Dock | `QuickInputBar -> onSubmit -> createDockItem` | PASS | - | M2-04 |
| Capture 双形态 | 快速输入 + 展开编辑器同主线 | `QuickInputBar` 与 `ExpandedEditor` 均调用 `handleCapture` | PASS | - | M2-04 |
| Dock 列表与状态流转 | pending->suggested->archived | repo + UI + tests 覆盖 | PASS | - | M2-06 |
| Suggest 基础版 | 规则建议，可解释，可修正 | `generateSuggestions` + `reason` 展示 | PARTIAL | 缺“历史偏好信号”闭环 | M2-05 |
| 用户手动 Tag | Tag 选择/创建，用户优先 | `TagEditor` + `addTagToItem/createStoredTag` | PASS | - | M2-05 |
| Chat 下 Tag 确认 | Agent 引导确认标签/类型 | 无 Chat 引导链路 | FAIL | 缺 Chat 引导确认逻辑 | M2-05 |
| Archive 最小闭环 | 归档生成 Entry，可 reopen | `archiveItem/reopenItem` + tests 覆盖 | PASS | - | M2-06 |
| Browse 基础版 | 查看、筛选、打开、再次整理 | Entries 列表、筛选、详情、reopen 已有 | PASS | - | M2-07 |
| 首页极简入口 | 首页承担“进入/继续工作” | 当前首页直接 `redirect('/workspace')` | PARTIAL | 缺独立极简入口页 | M2-02 |
| 账号登录闭环 | 注册/登录/退出/会话恢复 | `auth.ts` + `AuthGate` + workspace 守卫 | PASS | - | M2-02 |
| 单页工作台稳定 | Sidebar+Workspace+Input Bar | workspace 布局已成立，输入区不跨主模块 | PASS | - | M2-02 |
| 同一知识库约束 | Classic/Chat 共用模型与数据 | 当前仅 Classic，且 `SourceType` 无 `chat` | FAIL | 缺 chat 数据入口与统一约束验证 | M2-03/M2-04 |

---

## 3. 技术约束对照（补充）

| 技术项 | 文档要求 | 当前现状 | 结论 |
|---|---|---|---|
| SourceType | `text/chat/import` | 当前为 `text/voice/import` | FAIL |
| ChatToDockMapper | Chat 产出映射 DockItem | 未实现 | FAIL |
| 事件埋点 | capture/chat/archive/mode/review/browse 事件 | 代码中无对应事件上报调用 | FAIL |
| 指标计算 | DAU、归档率、7日留存等可计算 | 无统计层或指标聚合层 | FAIL |

---

## 4. 测试覆盖观察

- 已覆盖较好：状态流转、归档回写、标签操作、迁移兼容（repository/domain tests）。
- 覆盖缺口：
  - Chat 主链路测试缺失
  - 模式切换测试缺失
  - 埋点事件测试缺失
  - 首页极简入口行为测试缺失

---

## 5. M2-01 Review 结论

`M2-01` 通过（PASS）：  
- 已完成 Phase 2 P0 范围冻结  
- 已完成文档与代码基线盘点  
- 已输出可执行 gap 矩阵并完成模块归属

下一模块建议：`M2-02`（壳层稳定与身份闭环）。
