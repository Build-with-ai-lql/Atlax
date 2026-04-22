# Phase 2 可上线 Demo 执行计划（小步串行版）

## 1. 执行原则

- 仅做 `PRD v4.9 / TECH_SPEC v4.9 / ARCHITECTURE v4.9` 的 Phase 2 P0 白名单。
- 按模块串行推进：`一个模块完成并验收` 后才进入下一个模块。
- 每个模块都必须有：范围、产出、验收（DoD）、证据（测试/截图/演示路径）。
- 非 P0 内容全部放入 Phase 3 backlog，不在 Phase 2 混入实现。

---

## 2. Phase 2 模块拆解（优先执行）

> 状态约定：`TODO` / `DOING` / `DONE`  
> 当前建议从 `M2-01` 开始。

## M2-01｜范围冻结与基线盘点
状态：`DONE`

目标：
- 锁定 Phase 2 P0 白名单，形成统一执行清单。
- 产出当前仓库与 P0 的 gap 表（功能/页面/数据/测试）。

产出：
- P0 清单（Classic、Chat、Mode Switch、Dock、Suggest、Tag、Archive、Browse、Auth、Home、Metrics）。
- gap 矩阵（已满足/缺失/风险/依赖）。

DoD：
- 所有 P0 条目有且仅有一个归属模块。
- 明确“不做项”清单并写入文档。
- 产出 `phase2_gap_matrix.md` 并完成模块归属映射。

---

## M2-02｜壳层稳定与身份闭环
状态：`TODO`

范围：
- 单页工作台结构稳定（Sidebar + Workspace + Input Bar）。
- 登录系统闭环（注册/登录/退出/会话恢复）。
- 首页极简入口（只承担进入和继续工作）。

DoD：
- 新用户可注册并进入工作区。
- 已登录用户刷新后会话仍可恢复。
- 首页不承担复杂分发，只保留最小入口动作。

---

## M2-03｜双模式框架与切换控制器
状态：`TODO`

范围：
- 建立 `Classic / Chat` 双模式切换控制器。
- 切换具备明确状态感（不是普通 tab）。
- 确保两种模式共享同一知识库上下文。

DoD：
- 用户可在工作台完成模式切换。
- 切换后看到的是同一用户、同一内容集合。
- 产生 `mode_switched` 事件。

---

## M2-04｜输入主线统一（Classic + Chat -> Dock）
状态：`TODO`

范围：
- Classic：Quick Input + Expanded Editor。
- Chat：最小引导输入（一句话 -> 追问补全 -> 形成可整理内容）。
- 两种输入统一写入 Dock，不允许分叉数据流。

DoD：
- 10 秒内可完成一条短输入并进入 Dock。
- 长内容输入可用并进入同一 Dock 主线。
- Chat 输入可生成 DockItem（或等价归档候选）并可继续整理。

---

## M2-05｜Suggest / Tag 最小可用
状态：`TODO`

范围：
- Suggest 规则基础版（可解释、可忽略、可修正）。
- Tag 用户优先策略。
- Chat 下支持 Tag/类型确认引导。

DoD：
- 每条建议可展示 reason。
- 用户手动 Tag 覆盖系统建议。
- Chat 引导后可完成至少一次 Tag 确认。

---

## M2-06｜Archive 与 Re-organize 闭环
状态：`TODO`

范围：
- Dock -> Archive -> Entry。
- 已归档内容支持 reopen 并返回整理链路。

DoD：
- 状态流可稳定跑通：`pending -> suggested -> archived -> reopened`。
- 归档后内容可再次编辑并重新进入整理。

---

## M2-07｜Browse 基础版与演示路径
状态：`TODO`

范围：
- Entries 基础列表、筛选、打开详情、再次整理入口。
- 样例数据与演示路径可复现。

DoD：
- 用户可找到并打开历史归档内容。
- 至少支持基础筛选（type/tag/status/project 中的 P0 子集）。
- 完整演示链路可连续跑通。

---

## M2-08｜指标埋点与 Phase 2 验收收口
状态：`TODO`

范围：
- 接入 P0 事件：`capture_created`、`chat_guided_capture_created`、`archive_completed`、`mode_switched`、`weekly_review_opened`、`browse_revisit`。
- 输出指标验证口径与最小统计看板（或可导出的统计结果）。

DoD：
- 可计算：DAU、每用户日均记录次数、Chat 引导后归档率、7日留存率、Weekly Review 打开率。
- Phase 2 验收记录齐全（功能验收 + 产品验收 + 指标验收）。

---

## 3. Phase 3 工作拆解（先规划，后执行）

> 仅规划，不在 Phase 2 内实现。

## M3-01｜Chat 策略优化
- 追问节奏、整理推动、回顾触发策略优化。

## M3-02｜Review 增强
- Weekly Review 完整版、主题变化、项目进展追踪。

## M3-03｜Browse/Database 体验优化
- 筛选与阅读路径优化、再整理效率提升。

## M3-04｜模式切换体验细化
- 状态表达、轻动画、连贯性优化。

## M3-05｜留存闭环优化
- 日引导、周回顾、历史回访的策略收敛与指标提升。

---

## 4. 执行纪律（强制）

- 当前只推进 `M2-*`，且一次只允许一个模块为 `DOING`。
- 模块未达 DoD，禁止切换到下一个模块。
- 若出现新需求，先判断是否直接提升 Phase 2 上线闭环或指标验证；否则后移 Phase 3。
