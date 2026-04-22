# M2-03 Patch｜CI 修复与事件类型收口

| 项目 | 内容 |
|------|------|
| 模块 | M2-03 patch |
| 状态 | DONE |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 问题根因

### P0：CI 阻塞

`.github/workflows/ci.yml` 中 `pnpm/action-setup@v4` 使用了 `with.version: 10`，与 `package.json` 的 `packageManager: pnpm@10.0.0` 重复指定版本，且 `version` 字段在 pnpm/action-setup@v4 中已不推荐使用（应依赖 `packageManager` 字段作为唯一版本来源），可能导致 CI 版本不一致或 action 行为异常。

### P1：事件类型不一致

`lib/events.ts` 中 `recordEvent` 使用 `{ ...event, _ts: Date.now() } as AppEvent` 绕过类型系统。`AppEvent` 类型不含 `_ts` 字段，但持久化日志实际包含 `_ts`，导致：
- 类型声明与运行时数据不一致
- `getEventLog()` 返回 `AppEvent[]` 但实际每条记录都有 `_ts`
- 调用方无法通过类型系统获知 `_ts` 字段存在

---

## 2. 修复动作

### 2.1 CI 修复（P0）

**文件**：`.github/workflows/ci.yml`

**变更**：移除 `pnpm/action-setup@v4` 的 `with.version: 10`，保留 `package.json` 的 `packageManager: pnpm@10.0.0` 作为唯一 pnpm 版本来源。

```yaml
# 变更前
- uses: pnpm/action-setup@v4
  with:
    version: 10

# 变更后
- uses: pnpm/action-setup@v4
```

### 2.2 事件类型一致性修复（P1）

**文件**：`apps/web/lib/events.ts`

**变更**：

1. 新增 `PersistedEvent` 类型：`AppEvent & { _ts: number }`，明确持久化日志条目包含时间戳
2. `memoryLog` 类型从 `AppEvent[] | null` 改为 `PersistedEvent[] | null`
3. `loadEventLog()` 返回 `PersistedEvent[]`
4. `saveEventLog()` 接收 `PersistedEvent[]`
5. `recordEvent()` 中使用 `const persisted: PersistedEvent = { ...event, _ts: Date.now() }` 替代 `{ ...event, _ts: Date.now() } as AppEvent`
6. `getEventLog()` 返回 `PersistedEvent[]`

**调用方影响**：`workspace/page.tsx` 中 `handleModeChange` 调用 `recordEvent`，入参类型为 `AppEvent`，不受影响。

### 2.3 测试更新

**文件**：`apps/web/tests/events.test.ts`

**新增测试用例**：

| 用例 | 验证内容 |
|------|---------|
| `persisted event includes _ts timestamp` | 持久化事件包含 `_ts` 且值在合理时间范围内 |
| `getEventLog returns PersistedEvent type with _ts` | `getEventLog()` 返回类型为 `PersistedEvent[]`，`_ts` 为 `number` 类型 |
| `each mode switch has distinct _ts timestamp` | 多次切换的时间戳非递减 |

**保留测试**：原有 10 个测试用例全部保留，行为不变。

---

## 3. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm lint` | PASS | 无 lint 错误 |
| `pnpm typecheck` | PASS | 无类型错误 |
| `pnpm --dir apps/web test -- --run tests/events.test.ts` | PASS | 13/13 测试通过 |

---

## 4. 遗留风险

| 风险 | 说明 | 影响 |
|------|------|------|
| CI 修复未实际触发验证 | 本地无法运行 GitHub Actions，需 push 后观察 CI 结果 | 中，需在 push 后确认 |
| `loadEventLog` 中 `as PersistedEvent[]` 仍存在 | 从 localStorage 反序列化时需类型断言，这是 JSON.parse 的固有局限 | 低，运行时数据由 `saveEventLog` 写入，结构可信 |
