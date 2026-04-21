# Atlax MVP 可维护基线风险评估

日期: 2026-04-21

## 已修复风险

1. 领域逻辑分散在 `apps/web/lib`，已抽离到 `packages/domain`
2. `repository.ts` 同时承载状态机、建议规则和持久化，已收敛为 Web 适配层
3. suggestion 在组件中反复 `find/filter`，已改为 domain selector
4. 动作执行后无脑全量刷新列表，已优先改单条 state 更新
5. 仓库缺少真实的 lint/typecheck/test/CI 基线，已补最小质量门
6. 运行时版本要求未显式声明，已补 `Node 20.x` 约束与 `.nvmrc`

## 当前可接受技术债

1. Dexie 仍是 Web 专属持久化层，未做多端抽象
2. Inbox 页面仍以内聚 page-level 状态管理为主，未引入全局 store
3. UI 错误反馈仍是轻量提示条，不是完整错误边界体系
4. `next build` 暂不纳入 CI 强制门

## 明确延后处理

1. 批量操作
2. 规则持久化与编辑器
3. UI 自动化测试
4. Database View / Weekly Review
5. 服务端、移动端、插件真代码

## Week 3 前禁止事项

1. 不把 Web UI 状态搬进 `packages/domain`
2. 不把 Dexie schema 搬出 `apps/web`
3. 不让 `repository.ts` 再吸收 selector、文案、按钮逻辑
4. 不提前实现 `apps/server`、`apps/mobile`、`plugins` 功能
