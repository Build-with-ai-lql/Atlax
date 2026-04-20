# Week 1 Convergence Log

| 信息 | |
|------|------|
| 日期 | 2026-04-20 |
| 操作类型 | 代码收敛 |
| 执行者 | CTO 审核 + Agent 执行 |
| 目标 | 回到 Week 1 正确起跑线 |

---

## 背景

### 问题发现

在执行 Week 1 开发前，发现仓库中已存在完整的 NestJS 后端实现（`apps/server`），包括：

- NestJS + Prisma + SQLite 完整架构
- 10 个模块：capture、inbox、archive、entries、projects、tasks、review、suggestion、health、insight
- 完整 API 契约
- 单元测试 + E2E 测试
- 统一响应协议

### 与规划冲突

根据 `TECH_SPEC.md` 和 `PRD.md`，Week 1 应执行：

- **Web-first MVP**
- **Next.js 前端主工程**
- **本地优先**
- **IndexedDB / Dexie**
- **Capture 输入**
- **Inbox 展示**
- **最小数据模型**

而 `apps/server` 是 **Phase 2 可选** 的后端实现，完全超出 Week 1 范围。

---

## 收敛决策

### CTO 审核结论

1. 保留工程骨架与文档资产，但明确不是已完成的 Week 1 产品代码
2. 保留 `packages/shared/README.md`，不删除 shared 包骨架
3. 不保留 `apps/server/src/suggestion/suggestion.service.ts` 原文件；规则思想转写为文档
4. 先执行"归档可复用参考资产"，再执行"删除 apps/server 运行体系"
5. 删除整个 `apps/server` 及相关 NestJS / Prisma / SQLite 代码
6. 补 Week 1 convergence log

---

## 执行记录

### 归档内容

将可复用参考资产归档到 `docs/engineering/archive/week2-backend-reference/`：

| 归档文件 | 来源 | 用途 |
|----------|------|------|
| `data-model-reference.md` | `schema.prisma` | Dexie schema 设计参考 |
| `types/domain.constants.ts` | `domain.constants.ts` | 类型定义复用 |
| `types/health.types.ts` | `health.types.ts` | Week 3 Health 类型参考 |
| `types/insight.types.ts` | `insight.types.ts` | Week 3 Insight 类型参考 |
| `utils/date.utils.ts` | `date.utils.ts` | 日期工具函数复用 |
| `utils/tags.utils.ts` | `tags.utils.ts` | 标签解析工具复用 |
| `rules/suggestion-rules.md` | `suggestion.service.ts` | 规则引擎思想参考 |

### 删除内容

删除整个 `apps/server` 目录：

```
apps/server/
├── dist/                          [已删除] 编译产物
├── prisma/
│   ├── migrations/                [已删除] 迁移文件
│   └── schema.prisma              [已删除] 数据模型（已归档）
├── src/
│   ├── archive/                   [已删除] Archive 模块
│   ├── capture/                   [已删除] Capture 后端
│   ├── common/                    [已删除] 响应协议
│   ├── entries/                   [已删除] Entries 模块
│   ├── health/                    [已删除] Health 模块（已归档类型）
│   ├── inbox/                     [已删除] Inbox 后端
│   ├── insight/                   [已删除] Insight 模块（已归档类型）
│   ├── prisma/                    [已删除] Prisma 服务
│   ├── projects/                  [已删除] Projects 模块
│   ├── review/                    [已删除] Review 模块
│   ├── shared/                    [已删除] 共享工具（已归档）
│   ├── suggestion/                [已删除] Suggestion 模块（已归档规则）
│   ├── tasks/                     [已删除] Tasks 模块
│   ├── app.module.ts              [已删除] 主模块
│   └── main.ts                    [已删除] 入口
├── test/                          [已删除] E2E 测试
├── .env                           [已删除] 环境配置
├── package.json                   [已删除] 包配置
├── jest.config.js                 [已删除] Jest 配置
├── nest-cli.json                  [已删除] NestJS 配置
├── tsconfig.json                  [已删除] TS 配置
├── tsconfig.build.json            [已删除] 构建配置
└── README.md                      [已删除] 说明
```

---

## 收敛后仓库状态

### 保留内容

```
Atlax/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                 [保留] CI 基础验证
│   └── PULL_REQUEST_TEMPLATE.md   [保留] PR 模板
├── apps/
│   └── web/
│       └── README.md              [保留] Web 应用占位（需填充）
├── docs/
│   ├── engineering/
│   │   ├── archive/
│   │   │   └── week2-backend-reference/  [新增] 归档参考
│   │   ├── dev_plan/
│   │   │   └── 2026-4-20-18-00-00_DEV_PLAN.md  [保留] 后端计划参考
│   │   ├── branching-strategy.md  [保留] 分支策略
│   │   └── dev_log/
│   │       └── 2026-4-20-week1-convergence.md  [新增] 本日志
│   └── product/
│       ├── ARCHITECTURE.md        [保留] 架构文档
│       ├── PRD.md                 [保留] 产品需求
│       ├── TECH_SPEC.md           [保留] 技术规格
│       ├── mvp.md                 [保留] MVP 定义
│       └── vision.md              [保留] 产品愿景
├── packages/
│   └── shared/
│       └── README.md              [保留] Shared 包占位
├── package.json                   [保留] Monorepo 根配置
├── pnpm-lock.yaml                 [保留] 依赖锁定
├── pnpm-workspace.yaml            [保留] Workspace 定义
└── README.md                      [保留] 项目说明
```

### Week 1 主链路骨架

当前仓库是 **Week 1 起跑线骨架**，不是已完成的 Week 1 产品代码：

| 组件 | 状态 | Week 1 需要实现 |
|------|------|-----------------|
| 工程骨架 | ✅ 已有 | Monorepo + pnpm workspace |
| 文档资产 | ✅ 已有 | PRD/TECH_SPEC/ARCHITECTURE |
| `apps/web` | ⚠️ 只有 README | 需创建 Next.js 项目 |
| `packages/shared` | ⚠️ 只有 README | 需填充类型定义 |
| Capture 输入 | ❌ 未实现 | 需实现前端页面 |
| Inbox 展示 | ❌ 未实现 | 需实现前端页面 |
| 本地存储 | ❌ 未实现 | 需引入 Dexie |

---

## 下一步行动

### Week 1 实现路径

```
1. 在 apps/web 创建 Next.js 14 项目
   - pnpm create next-app@latest apps/web
   - 配置 TypeScript + Tailwind CSS

2. 引入 Dexie（IndexedDB wrapper）
   - pnpm add dexie
   - 定义最小数据模型：InboxEntry

3. 实现 Capture 页面
   - apps/web/app/capture/page.tsx
   - 文本输入表单
   - 写入 IndexedDB

4. 实现 Inbox 页面
   - apps/web/app/inbox/page.tsx
   - 读取 IndexedDB
   - 展示待整理列表

5. 验证闭环
   - 输入 → 存储 → 展示
   - 不依赖后端
```

### 不做内容

Week 1 不实现：
- ❌ SuggestionEngine
- ❌ ArchiveService
- ❌ Database View
- ❌ Weekly Review
- ❌ Health / Insight
- ❌ 任何后端代码

---

## Commit 分组

本次收敛分 3 个 commit：

1. `chore(archive): preserve reusable backend references for later phases`
2. `chore(cleanup): remove out-of-scope backend implementation`
3. `docs(convergence): record week1 convergence decision`

---

## 总结

本次收敛将仓库从"已实现 Phase 2 后端"状态回到"Week 1 起跑线骨架"状态。

**核心原则**：
- 本轮目标是"收敛并回到正确起跑线"，不是直接完成 Week 1
- 保留工程骨架和文档资产
- 归档可复用参考内容
- 删除超出阶段的运行代码

**下一步**：按照 Week 1 实现路径，从 `apps/web` 开始构建前端 MVP。