# M2-07｜Browse 基础版与演示路径

| 项目 | 内容 |
|------|------|
| 模块 | M2-07 |
| 状态 | DONE |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 模块目标（DoD）

- Entries 基础浏览+筛选+详情+再次整理可稳定演示。
- 演示路径文档与代码一致，按文档可复现。
- 关键测试覆盖并通过。

---

## 2. 改动摘要

1. **EntriesFilterBar 补充 reopened 状态标签**：筛选栏中 reopened 状态现在显示"重新整理"而非原始值
2. **seed 页面补充 chat 来源和 reopened 场景**：新增 `sourceType` 字段，2 条 chat 来源条目，1 条 reopened 状态条目，覆盖完整演示需要
3. **更新 demo-path.md**：术语统一（Inbox→Dock），补充 Chat 模式演示步骤（步骤 14-18），更新数据描述和演示话术
4. **新增 10 个 Browse/Seed 测试**：覆盖 Entries 列表、筛选数据可用性、entry 详情 reopen 回流、chat/text 共享列表、seed 数据场景

---

## 3. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/app/workspace/_components/EntriesFilterBar.tsx` | 修改 | 补充 reopened 状态标签 |
| `apps/web/app/seed/page.tsx` | 修改 | 新增 sourceType 字段，chat 来源 + reopened 场景 |
| `docs/engineering/demo/demo-path.md` | 修改 | 术语统一 + Chat 演示路径 + 更新数据描述 |
| `apps/web/tests/browse-seed.test.ts` | 新增 | 10 个 Browse/Seed 测试 |
| `docs/engineering/dev_log/Phase2/phase-2.13-browse-demo.md` | 新增 | 本开发日志 |

---

## 4. 详细变更说明

### 4.1 EntriesFilterBar 补充 reopened

STATUS_LABELS 中新增 `reopened: '重新整理'`，确保筛选下拉中 reopened 状态显示中文标签。

### 4.2 seed 页面数据增强

| 变更 | 说明 |
|------|------|
| 新增 `sourceType` 字段 | 每条 SEED_ITEM 增加 sourceType，创建时使用 |
| chat 来源条目 | "灵感：知识图谱+本地优先" 和 "周末去爬山" 改为 chat 来源 |
| reopened 场景 | "待办：修复 Dock 状态丢失" 从 archived 改为 reopened，保留关联 entry |
| 描述文案更新 | "覆盖 pending/suggested/archived/ignored/reopened" + "含 chat 来源" |

### 4.3 demo-path.md 更新

- 所有 "Inbox" 术语替换为 "Dock"
- 新增步骤 11（编辑归档）、步骤 13（重新建议）、步骤 14-18（Chat 模式完整流程）
- 更新数据描述：3 archived + 1 reopened + 1 ignored + 1 suggested + 2 pending
- 新增演示话术："Classic + Chat 双入口"、"建议可解释，用户优先"
- 新增翻车场景："Chat 提交后看不到"

### 4.4 测试覆盖

| 测试组 | 用例数 | 覆盖内容 |
|-------|-------|---------|
| entries filtering | 4 | 列表归档条目、类型可用、标签可用、chat/text 共享列表 |
| entry detail and reopen flow | 3 | sourceDockItemId 关联、reopen 回流 Dock、reopen 后再归档 |
| seed data coverage | 3 | chat 来源归档、reopened 场景、标签创建与筛选 |

---

## 5. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm lint` | PASS | 无 lint 错误 |
| `pnpm typecheck` | PASS | 无类型错误 |
| `pnpm --dir apps/web test -- --run` | PASS | 89/89 测试通过 |

---

## 6. 风险与遗留问题

| 风险/遗留 | 说明 | 影响 |
|-----------|------|------|
| Entries 无 sourceType 筛选 | 当前筛选栏不包含来源类型筛选 | 低影响，可后续迭代 |
| seed 数据不包含 userTags | seed 创建的 DockItem 的 userTags 为空 | 低影响，可在 Dock 中手动添加 |
| EntryListItem 不显示来源标识 | 列表项不区分 chat/text 来源 | 低影响，可后续添加图标 |
