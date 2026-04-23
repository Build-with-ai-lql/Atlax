# Week 2+ Backend Reference Index

> 本目录归档了超出 Week 1 范围的后端实现参考，供后续阶段复用。

---

## 代码迁移说明

**2026-04-23 迁移**：`.ts` 代码文件已迁移至 `packages/domain/src/reference/week2/`，保持 docs 目录仅含文档。

| 原路径 | 新路径 |
|--------|--------|
| `types/domain.constants.ts` | `packages/domain/src/reference/week2/types/domain.constants.ts` |
| `types/health.types.ts` | `packages/domain/src/reference/week2/types/health.types.ts` |
| `types/insight.types.ts` | `packages/domain/src/reference/week2/types/insight.types.ts` |
| `utils/date.utils.ts` | `packages/domain/src/reference/week2/utils/date.utils.ts` |
| `utils/tags.utils.ts` | `packages/domain/src/reference/week2/utils/tags.utils.ts` |

---

## 当前目录结构

```
week2-backend-reference/
├── README.md                   # 本文档（含迁移说明）
├── data-model-reference.md     # 数据模型设计参考
└── rules/
    └── suggestion-rules.md     # 规则引擎思想参考
```

---

## 使用说明

### Week 1 不使用这些内容

Week 1 只需要：
- 工程骨架（Monorepo + pnpm）
- `apps/web` Next.js 前端
- IndexedDB + Dexie 本地存储
- Capture 输入页面
- Inbox 展示页面

### Week 2 可参考这些内容

Week 2 开始实现：
- Suggestion 规则引擎（前端本地）
- Archive 归档流程
- Database View（entries/projects/tasks）

可参考：
- `rules/suggestion-rules.md` - 规则逻辑
- `packages/domain/src/reference/week2/types/domain.constants.ts` - 类型定义
- `data-model-reference.md` - Dexie schema 设计

### Week 3 可参考这些内容

Week 3 开始实现：
- Weekly Review
- Health 信号检测
- Insight 卡片生成

可参考：
- `packages/domain/src/reference/week2/types/health.types.ts` - Health 类型
- `packages/domain/src/reference/week2/types/insight.types.ts` - Insight 类型
- `packages/domain/src/reference/week2/utils/date.utils.ts` - 周范围计算

---

## 来源

所有内容归档自 `apps/server/src/` 目录，原始 NestJS 实现已删除。

归档时间：2026-04-20
迁移时间：2026-04-23
迁移原因：docs 目录仅保留文档，代码迁移至 packages/domain。
