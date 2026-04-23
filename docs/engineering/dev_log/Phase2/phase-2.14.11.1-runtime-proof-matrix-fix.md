# Phase 2.14.11.1｜运行时证据矩阵修正（同架构签名失败分支补齐）

| 项目 | 内容 |
|------|------|
| 模块 | 工程基建 - 运行时门禁归因与验收口径修正 |
| 状态 | 已更新（待 review） |
| 日期 | 2026-04-23 |
| 执行者 | Agent（后端/工程基建） |

---

## 1. 目标

1. 为 phase-2.14.11 补齐“同为 arm64 但 Node 签名链路失败”的归因分支。
2. 用可复核命令输出统一执行端判定口径，消除 `OS arch` 与 `process.arch` 混用。
3. 同步 phase2-acceptance 放行矩阵，纳入签名失败分支与执行端判定规则。

---

## 2. 证据矩阵（命令 + 输出）

### 2.1 执行端 A：`/Applications/Codex.app/Contents/Resources/node`

命令：
```bash
env PATH="/Applications/Codex.app/Contents/Resources:$PATH" which node
```
输出：
```text
/Applications/Codex.app/Contents/Resources/node
```

命令：
```bash
env PATH="/Applications/Codex.app/Contents/Resources:$PATH" node -p "process.execPath + ' | ' + process.platform + ' | ' + process.arch"
```
输出：
```text
/Applications/Codex.app/Contents/Resources/node | darwin | arm64
```

命令：
```bash
env PATH="/Applications/Codex.app/Contents/Resources:$PATH" pnpm --dir apps/web test -- --run
```
输出（关键片段）：
```text
Error: Cannot find module @rollup/rollup-darwin-arm64 ...
  [cause]: Error: dlopen(.../rollup.darwin-arm64.node, 0x0001): ...
  code signature ... not valid for use in process:
  mapping process and mapped file (non-platform) have different Team IDs
  ...
  code: 'ERR_DLOPEN_FAILED'
Node.js v24.14.0
ELIFECYCLE Test failed.
```

结论：A 的 `process.arch` 为 arm64，但在 native 模块加载阶段触发签名链路失败（Team ID 不一致）。

### 2.2 执行端 B：`/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node`

命令：
```bash
env PATH="/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin:$PATH" which node
```
输出：
```text
/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node
```

命令：
```bash
env PATH="/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin:$PATH" node -p "process.execPath + ' | ' + process.platform + ' | ' + process.arch"
```
输出：
```text
/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node | darwin | arm64
```

命令：
```bash
env PATH="/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin:$PATH" pnpm --dir apps/web test -- --run
```
输出（关键片段）：
```text
Test Files  8 passed (8)
Tests      102 passed (102)
Duration   669ms
```

结论：B 的 `process.arch` 同为 arm64，且门禁 102/102 通过。

---

## 3. 统一口径

- 执行端判定：`which node` + `node -p ...`。
- 门禁归因：只看同一执行端下 `pnpm --dir apps/web test -- --run` 实际结果。
- `uname -m` 仅记录宿主机，不作为门禁主判据。

归因分支：

| 分支 | 条件 | 结论 |
|------|------|------|
| 架构不匹配 | `process.arch` 与可用 native 包不一致 | 环境阻塞（`MODULE_NOT_FOUND`） |
| 架构匹配但签名失败 | `process.arch` 一致但 `ERR_DLOPEN_FAILED` + Team ID 不一致 | 环境阻塞（签名链路） |
| 架构与签名通过 | native 模块加载成功 | 门禁通过（可放行） |

---

## 4. 本轮文档同步

| 文件 | 动作 | 说明 |
|------|------|------|
| `phase-2.14.11-infra-runtime-gate-alignment.md` | 修正 | 补齐签名失败分支 + 证据矩阵 + 单一判定口径 |
| `phase2-acceptance.md` | 修正 | 更新放行矩阵，纳入执行端判定规则和签名失败分支 |
| `phase-2.14.11.1-runtime-proof-matrix-fix.md` | 新增 | 本日志 |

---

## 5. 强制约束确认

- [x] 未执行 push。
- [x] 本轮改动仅放入暂存区，不提交。
- [x] 变更可通过 `git diff` / `git diff --cached` 审阅。
- [x] 未改前端页面文件。
