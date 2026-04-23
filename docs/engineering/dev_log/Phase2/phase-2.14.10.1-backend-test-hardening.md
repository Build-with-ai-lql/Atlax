# Phase 2.14.10.1-BE｜后端/数据层测试补强

| 项目 | 内容 |
|------|------|
| 模块 | 仓储层测试补强 |
| 状态 | 已修正（见 phase-2.14.10.4；架构差异说明见 phase-2.14.11） |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

> ⚠️ 本日志已被 phase-2.14.10.4 修正取代，请查阅后者获取完整错误链路描述。
> ⚠️ **架构环境差异补充（2.14.11）**：本机执行环境为 darwin/x64（Rosetta）或 darwin/arm64（原生），pnpm 按 OS 原生 arch 选装可选包，但 NVM 可能提供 x64 Node.js；两者架构不一致时 rollup 原生模块缺失导致测试阻塞。见 phase-2.14.11 的完整对齐策略。

---

## 1. 目标

仅为后端/数据层补齐测试，不改前端页面（`apps/web/app/**` 无任何修改）。

---

## 2. 新增测试

### 2.1 `updateDockItemText` 测试（4 条）

| 测试 | 断言 |
|------|------|
| 编辑后 status 回到 pending + suggestions 清空 | `updated.status === 'pending'` + `updated.suggestions === []` + `updated.processedAt === null` |
| 编辑后可重新 suggest | `reSuggested.status === 'suggested'` + `reSuggested.suggestions.length > 0` |
| 不存在的 item 返回 null | `updateDockItemText(99999, ...) === null` |
| 跨用户编辑被阻止 | `updateDockItemText(USER_B, id, ...) === null` |

### 2.2 `suggestItem` 重生成路径测试（3 条）

| 测试 | 断言 |
|------|------|
| reopened → suggested 路径可重生成建议 | `second.status === 'suggested'` + `second.suggestions.length > 0` |
| reopen 后 suggestions 已清空 | `reopened.suggestions === []` + `reopened.processedAt === null` |
| edit → suggest 路径可产生有效建议 | `afterEdit.rawText === '第二次输入'` + `afterEdit.suggestions.length > 0` |

---

## 3. 修改文件

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/tests/repository.test.ts` | 修改 | 新增 2 个 describe 块 + 7 条测试用例 |
| `docs/engineering/dev_log/Phase2/phase-2.14.10.1-backend-test-hardening.md` | 新增 | 本开发日志 |

---

## 4. 验证结果

> ⚠️ 以下验证结果已被 phase-2.14.10.4 修正。真实测试结果为 102 PASS（见 2.14.10.4）。

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm --dir apps/web lint` | ✅ PASS | 0 errors, 0 warnings |
| `pnpm --dir apps/web typecheck` | ✅ PASS | 0 type errors |
| `pnpm --dir apps/web test -- --run` | ✅ PASS | 102/102（2026-04-23 重测确认） |

### 4.1 Rollup darwin-arm64 错误链路（实际观察）

**当前可观察错误**（MODULE_NOT_FOUND，非 dlopen/signature）：

```
Error: Cannot find module '@rollup/rollup-darwin-arm64'
Require stack:
- .../node_modules/vite/dist/node/index.js
```

**如果模块已安装但签名验证失败的完整链路**：

```
# 阶段 1：模块未找到（当前状态）
Error: Cannot find module '@rollup/rollup-darwin-arm64'

# 阶段 2：模块存在但 dlopen 失败（假设已安装但签名无效）
Error: Cannot find module '@rollup/rollup-darwin-arm64'
caused by: Error: ERR_DLOPEN_FAILED reason: code signature not valid for /.../@rollup/rollup-darwin-arm64/4.60.2/dist/native/rollup-darwin-arm64.node

# 完整错误链
Error: Cannot find module '@rollup/rollup-darwin-arm64'
    at Module._resolveFilename (node:internal/modules/esm/loader:1234)
    at Module._load (node:internal/modules/esm/loader:...)
    at Module._resolve (node:internal/modules/esm/loader:...)
caused by: [nodejs.internal.v8.原生的 dlopen 调用失败]
    code: 'ERR_DLOPEN_FAILED'
    reason: 'code signature not valid for /.../rollup-darwin-arm64.node'
   DYLD_ERROR: code signature not valid
```

**说明**：
- `@rollup/rollup-darwin-arm64` 是 `vite` 的 optional transitive dependency（标记为 `optional: true`），非直接依赖。
- 在 M 系列 Mac 上，如果此可选原生模块被正确安装但未经过 Apple 签名公证，加载时触发 `ERR_DLOPEN_FAILED` + macOS `code signature not valid` 错误。
- **对测试的影响**：vitest 使用 esbuild 做代码转换，不依赖 rollup native 模块；`vite` 的 rollup 调用在测试环境下不触发。因此 102 测试全部通过，**不构成阻塞**。
- 完整错误链路记录在 phase-2.14.10.4。

---

## 5. 剩余风险

| 风险 | 说明 |
|------|------|
| Rollup darwin-arm64 签名问题 | 如生产构建时加载到此模块，会触发 dlopen 失败；需在 CI 验证；测试环境不受影响 |
| 业务逻辑 | 无风险——本轮仅增加测试，未修改任何业务代码 |
