# Week 2+ Backend Reference Index

> 本目录归档了超出 Week 1 范围的后端实现参考，供后续阶段复用。

---

## 目录结构

```
week2-backend-reference/
├── data-model-reference.md    # 数据模型设计参考
├── rules/
│   └── suggestion-rules.md    # 规则引擎思想参考
├── types/
│   ├── domain.constants.ts    # 领域常量定义
│   ├── health.types.ts        # Health 信号类型
│   └── insight.types.ts       # Insight 卡片类型
└── utils/
    ├── date.utils.ts          # 日期工具函数
    └── tags.utils.ts          # 标签解析工具
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
- `types/domain.constants.ts` - 类型定义
- `data-model-reference.md` - Dexie schema 设计

### Week 3 可参考这些内容

Week 3 开始实现：
- Weekly Review
- Health 信号检测
- Insight 卡片生成

可参考：
- `types/health.types.ts` - Health 类型
- `types/insight.types.ts` - Insight 类型
- `utils/date.utils.ts` - 周范围计算

---

## 来源

所有内容归档自 `apps/server/src/` 目录，原始 NestJS 实现已删除。

归档时间：2026-04-20
归档原因：Week 1 收敛，超出阶段代码归档保留参考价值。