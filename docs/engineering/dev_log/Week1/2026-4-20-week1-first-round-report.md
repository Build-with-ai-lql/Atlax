# Week 1｜第一轮收敛报告（Agent 输出归档）

## 📋 Atlax Week 1 代码收敛 - 文件分类报告

---

### 1️⃣ 文件分类清单

### **KEEP_NOW（属于 Week 1，必须保留并继续完善）**

| 文件路径 | 说明 | Week 1 角色 |
| --- | --- | --- |
| `/package.json` | Monorepo 根配置 | ✅ 工程基础包 |
| `/pnpm-workspace.yaml` | Workspace 定义 | ✅ 工程基础包 |
| `/pnpm-lock.yaml` | 依赖锁定文件 | ✅ 工程基础包 |
| `/README.md` | 项目说明 | ✅ 工程基础包 |
| `/.github/workflows/ci.yml` | CI 配置（基础验证） | ✅ 工程基础包 |
| `/.github/PULL_REQUEST_TEMPLATE.md` | PR 模板 | ✅ 工程基础包 |
| `/docs/product/PRD.md` | 产品需求文档 | ✅ 规范文档 |
| `/docs/product/TECH_SPEC.md` | 技术规格文档 | ✅ 规范文档 |
| `/docs/product/ARCHITECTURE.md` | 架构文档 | ✅ 规范文档 |
| `/docs/product/mvp.md` | MVP 定义 | ✅ 规范文档 |
| `/docs/product/vision.md` | 产品愿景 | ✅ 规范文档 |
| `/docs/engineering/branching-strategy.md` | 分支策略 | ✅ 规范文档 |
| `/apps/web/README.md` | Web 应用占位 | ✅ 需要填充实际代码 |

**注意**：当前 Week 1 实际可运行代码**几乎为零**，因为 `apps/web` 只有 README，没有实际 Next.js 代码。

---

### **KEEP_LATER（超出 Week 1，但可保留为未来扩展口子，当前不参与运行）**

| 文件路径 | 说明 | 归档阶段 | 保留原因 |
| --- | --- | --- | --- |
| `/apps/server/prisma/schema.prisma` | 数据模型定义 | Week 2+ | ✅ 数据结构设计可复用，转换为 Dexie schema |
| `/apps/server/src/shared/domain.constants.ts` | 领域常量定义 | Week 2+ | ✅ 类型定义可复用 |
| `/apps/server/src/shared/tags.utils.ts` | 标签解析工具 | Week 2+ | ✅ 工具函数可复用 |
| `/apps/server/src/shared/date.utils.ts` | 日期工具 | Week 2+ | ✅ 工具函数可复用 |
| `/apps/server/src/suggestion/suggestion.types.ts` | 建议类型定义 | Week 2+ | ✅ 类型定义可复用 |
| `/apps/server/src/health/health.types.ts` | Health 类型定义 | Week 2+ | ✅ 类型定义可复用 |
| `/apps/server/src/insight/insight.types.ts` | Insight 类型定义 | Week 2+ | ✅ 类型定义可复用 |
| `/apps/server/src/suggestion/suggestion.service.ts` | 规则引擎逻辑 | Week 2+ | ✅ 规则逻辑可迁移到前端 |
| `/apps/server/src/health/health.service.ts` | Health 规则逻辑 | Week 3+ | ✅ 规则逻辑可迁移到前端 |
| `/apps/server/src/insight/insight.service.ts` | Insight 规则逻辑 | Week 3+ | ✅ 规则逻辑可迁移到前端 |
| `/docs/engineering/dev_plan/2026-4-20-18-00-00_DEV_PLAN.md` | 后端开发计划 | Phase 2 | ✅ 后续阶段参考 |

---

### **REMOVE_NOW（超出 Week 1，且当前不可运行或会干扰主流程，应立即删除）**

| 文件路径 | 说明 | 删除原因 |
| --- | --- | --- |
| `/apps/server/dist/**` | NestJS 编译产物 | ❌ 编译产物，不应保留 |
| `/apps/server/src/archive/**` | Archive 模块 | ❌ Week 2 功能，当前阶段不需要 |
| `/apps/server/src/entries/**` | Entries 模块 | ❌ Week 2 功能，当前阶段不需要 |
| `/apps/server/src/projects/**` | Projects 模块 | ❌ Week 2 功能，当前阶段不需要 |
| `/apps/server/src/tasks/**` | Tasks 模块 | ❌ Week 2 功能，当前阶段不需要 |
| `/apps/server/src/review/**` | Review 模块 | ❌ Week 3 功能，当前阶段不需要 |
| `/apps/server/src/capture/**` | Capture 后端模块 | ❌ NestJS 实现，Week 1 应为前端本地实现 |
| `/apps/server/src/inbox/**` | Inbox 后端模块 | ❌ NestJS 实现，Week 1 应为前端本地实现 |
| `/apps/server/src/prisma/**` | Prisma 服务 | ❌ SQLite 后端依赖，Week 1 不需要 |
| `/apps/server/src/common/**` | 响应拦截器/异常过滤器 | ❌ 平台化内容，Week 1 不需要 |
| `/apps/server/src/app.module.ts` | NestJS 主模块 | ❌ NestJS 架构，Week 1 不需要 |
| `/apps/server/src/main.ts` | NestJS 入口 | ❌ NestJS 架构，Week 1 不需要 |
| `/apps/server/prisma/migrations/**` | Prisma 迁移文件 | ❌ SQLite 迁移，Week 1 不需要 |
| `/apps/server/test/**` | E2E 测试 | ❌ 后端测试，Week 1 不需要 |
| `/apps/server/.env` | 环境配置 | ❌ 后端配置，Week 1 不需要 |
| `/apps/server/package.json` | Server 包配置 | ❌ NestJS 依赖，Week 1 不需要 |
| `/apps/server/jest.config.js` | Jest 配置 | ❌ 后端测试配置，Week 1 不需要 |
| `/apps/server/nest-cli.json` | NestJS CLI 配置 | ❌ NestJS 配置，Week 1 不需要 |
| `/apps/server/tsconfig.json` | Server TS 配置 | ❌ NestJS 配置，Week 1 不需要 |
| `/apps/server/tsconfig.build.json` | Server 构建配置 | ❌ NestJS 配置，Week 1 不需要 |
| `/apps/server/README.md` | Server 说明 | ❌ 后端说明，Week 1 不需要 |
| `/apps/server/src/suggestion/suggestion.module.ts` | Suggestion NestJS 模块 | ❌ NestJS 模块，Week 1 不需要 |
| `/apps/server/src/suggestion/suggestion.service.spec.ts` | Suggestion 单测 | ❌ 后端测试，Week 1 不需要 |
| `/apps/server/src/health/health.module.ts` | Health NestJS 模块 | ❌ NestJS 模块，Week 1 不需要 |
| `/apps/server/src/health/health.service.spec.ts` | Health 单测 | ❌ 后端测试，Week 1 不需要 |
| `/apps/server/src/insight/insight.module.ts` | Insight NestJS 模块 | ❌ NestJS 模块，Week 1 不需要 |
| `/apps/server/src/insight/insight.service.spec.ts` | Insight 单测 | ❌ 后端测试，Week 1 不需要 |
| `/apps/server/src/archive/archive.module.ts` | Archive NestJS 模块 | ❌ NestJS 模块，Week 1 不需要 |
| `/apps/server/src/archive/archive.service.spec.ts` | Archive 单测 | ❌ 后端测试，Week 1 不需要 |
| `/apps/server/src/review/review.module.ts` | Review NestJS 模块 | ❌ NestJS 模块，Week 1 不需要 |
| `/apps/server/src/review/review.controller.ts` | Review Controller | ❌ NestJS 控制器，Week 1 不需要 |
| `/apps/server/src/review/review.service.spec.ts` | Review 单测 | ❌ 后端测试，Week 1 不需要 |

---

### **REVIEW_MANUAL（边界不清，需要人工确认）**

| 文件路径 | 说明 | 需确认问题 |
| --- | --- | --- |
| `/packages/shared/README.md` | Shared 包占位 | ⚠️ 是否需要保留作为未来共享类型包？ |
| `/apps/server/src/suggestion/suggestion.service.ts` | 规则引擎核心逻辑 | ⚠️ 规则定义可复用，但 NestJS 包装需删除。是否提取规则定义到独立文件？ |

---

### 2️⃣ 拟删除文件清单

**删除整个 `apps/server` 目录（保留部分可复用逻辑提取到其他位置）**

```
apps/server/
├── dist/                          # 编译产物 - 删除
├── prisma/
│   ├── migrations/                # 迁移文件 - 删除
│   └── schema.prisma              # 数据模型 - 提取后删除
├── src/
│   ├── archive/                   # Archive 模块 - 删除
│   ├── capture/                   # Capture 后端 - 删除
│   ├── common/                    # 响应协议 - 删除
│   ├── entries/                   # Entries 模块 - 删除
│   ├── health/                    # Health 模块 - 提取类型后删除
│   ├── inbox/                     # Inbox 后端 - 删除
│   ├── insight/                   # Insight 模块 - 提取类型后删除
│   ├── prisma/                    # Prisma 服务 - 删除
│   ├── projects/                  # Projects 模块 - 删除
│   ├── review/                    # Review 模块 - 删除
│   ├── shared/                    # 共享工具 - 提取后删除
│   ├── suggestion/                # Suggestion 模块 - 提取规则后删除
│   ├── tasks/                     # Tasks 模块 - 删除
│   ├── app.module.ts              # 主模块 - 删除
│   └── main.ts                    # 入口 - 删除
├── test/                          # E2E 测试 - 删除
├── .env                           # 环境配置 - 删除
├── package.json                   # 包配置 - 删除
├── jest.config.js                 # Jest 配置 - 删除
├── nest-cli.json                  # NestJS 配置 - 删除
├── tsconfig.json                  # TS 配置 - 删除
├── tsconfig.build.json            # 构建配置 - 删除
├── README.md                      # 说明 - 删除
```

---

### 3️⃣ 拟冻结文件清单

**冻结 = 保留但不参与当前运行，作为后续阶段参考**

| 文件路径 | 冻结方式 | 后续用途 |
| --- | --- | --- |
| `/docs/engineering/dev_plan/2026-4-20-18-00-00_DEV_PLAN.md` | 保留文档 | Phase 2 后端开发参考 |
| `/apps/server/prisma/schema.prisma` | 提取数据模型定义到 `docs/engineering/archive/` | Dexie schema 设计参考 |
| `/apps/server/src/shared/domain.constants.ts` | 提取类型定义到 `packages/shared/` | 前端类型复用 |
| `/apps/server/src/shared/tags.utils.ts` | 提取工具函数到 `packages/shared/` | 前端工具复用 |
| `/apps/server/src/shared/date.utils.ts` | 提取工具函数到 `packages/shared/` | 前端工具复用 |
| `/apps/server/src/suggestion/suggestion.service.ts` | 提取规则定义到 `docs/engineering/archive/` | Week 2 规则引擎参考 |
| `/apps/server/src/health/health.types.ts` | 提取类型定义到 `packages/shared/` | Week 3 类型复用 |
| `/apps/server/src/insight/insight.types.ts` | 提取类型定义到 `packages/shared/` | Week 3 类型复用 |

---

### 4️⃣ 收敛后主链路说明

**Week 1 收敛后的正确主链路：**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Week 1 主链路（Web-first 本地优先）                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 工程基础                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Monorepo 结构：apps/web + packages/shared                           │   │
│  │ pnpm workspace 配置                                                  │   │
│  │ CI 基础验证                                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  2. 数据模型与本地存储                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ packages/shared/types/                                               │   │
│  │   - InboxEntry 类型定义                                              │   │
│  │   - Entry 类型定义                                                   │   │
│  │ apps/web/lib/db/                                                     │   │
│  │   - Dexie schema 定义                                                │   │
│  │   - 本地 IndexedDB 存储                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  3. Capture 输入                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ apps/web/app/capture/page.tsx                                        │   │
│  │   - 文本输入表单                                                      │   │
│  │   - 写入 IndexedDB (InboxEntry)                                      │   │
│  │   - 不做分类、不做建议                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  4. Inbox 展示                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ apps/web/app/inbox/page.tsx                                          │   │
│  │   - 读取 IndexedDB                                                   │   │
│  │   - 展示待整理列表                                                    │   │
│  │   - 不做 Suggest、不做 Archive                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  5. 主链路联调与稳定性                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 验证闭环：                                                            │   │
│  │   输入文本 → 存入 IndexedDB → Inbox 页面展示                          │   │
│  │ 不依赖后端、不依赖远程服务                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Week 1 不包含：**

- ❌ SuggestionEngine
- ❌ ArchiveService
- ❌ Database View (entries/projects/tasks)
- ❌ Weekly Review
- ❌ Health / Insight
- ❌ 任何 NestJS / Prisma / SQLite 代码

---

### 5️⃣ 最小测试清单

**Week 1 验收测试项：**

| 测试项 | 测试方法 | 验收标准 |
| --- | --- | --- |
| **工程基础** | `pnpm install` 成功 | 无报错 |
| **Web 应用启动** | `pnpm dev` 在 apps/web | Next.js 开发服务器启动 |
| **Capture 页面渲染** | 打开 `/capture` | 页面正常显示输入框 |
| **Inbox 页面渲染** | 打开 `/inbox` | 页面正常显示列表 |
| **本地存储写入** | 在 Capture 输入文本 | IndexedDB 有新记录 |
| **本地存储读取** | Inbox 页面刷新 | 显示刚才输入的内容 |
| **闭环验证** | 输入 → 存储 → 展示 | 10 秒内完成 |

**Week 1 不测试：**

- ❌ 后端 API
- ❌ Suggest 规则
- ❌ Archive 流程
- ❌ Database View
- ❌ Review 功能

---

### 6️⃣ 建议 Commit 分组

**建议分 3 个 Commit 进行收敛：**

| Commit 序号 | Commit 名称 | 内容 |
| --- | --- | --- |
| **Commit 1** | `chore: archive Phase 2 backend code to docs/engineering/archive` | 提取可复用代码到归档目录 |
| **Commit 2** | `chore: remove apps/server and Phase 2+ code` | 删除超出 Week 1 的代码 |
| **Commit 3** | `docs: add Week 1 convergence dev log` | 记录开发日志 |

**详细 Commit 内容：**

### Commit 1: 提取可复用代码

```
提取以下文件到 docs/engineering/archive/week2-backend-reference/:
- schema.prisma → data-model-reference.md
- domain.constants.ts → types/domain.constants.ts
- tags.utils.ts → utils/tags.utils.ts
- date.utils.ts → utils/date.utils.ts
- suggestion.service.ts 规则部分 → rules/suggestion-rules.md
- health.types.ts → types/health.types.ts
- insight.types.ts → types/insight.types.ts
```

### Commit 2: 删除超出阶段代码

```
删除:
- apps/server/ 整个目录
- docs/engineering/dev_plan/2026-4-20-18-00-00_DEV_PLAN.md 移到 archive/
```

### Commit 3: 记录开发日志

```
创建:
- docs/engineering/dev_log/2026-4-20-week1-convergence.md
```

---

### ⚠️ REVIEW_MANUAL 文件需要你确认

| 文件 | 问题 | 建议选项 |
| --- | --- | --- |
| `/packages/shared/README.md` | 是否保留作为未来共享类型包？ | **A. 保留并填充实际类型定义** / **B. 删除，Week 1 不需要** |
| `/apps/server/src/suggestion/suggestion.service.ts` | 规则定义是否提取？ | **A. 提取 TYPE_RULES 和 TAG_KEYWORDS 到独立文件** / **B. 直接删除，Week 2 再重写** |

---

请确认以上分类方案，特别是 **REVIEW_MANUAL** 文件的处理方式。确认后我将执行收敛操作。

toolName: todo_write

status: success

Todos updated: 8 items

---

## 📋 分类报告已完成

以上是完整的文件分类报告。请确认：

1. **分类方案是否认可？**
2. **REVIEW_MANUAL 文件处理方式：**
    - `/packages/shared/README.md`：选择 **A（保留并填充）** 还是 **B（删除）**？
    - `/apps/server/src/suggestion/suggestion.service.ts` 规则定义：选择 **A（提取）** 还是 **B（删除）**？

确认后我将执行收敛操作并记录开发日志。