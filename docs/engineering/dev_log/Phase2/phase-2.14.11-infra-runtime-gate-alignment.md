# Phase 2.14.11｜基建运行时门禁对齐（执行端判定与签名链路收口）

| 项目 | 内容 |
|------|------|
| 模块 | 工程基建 - rollup 运行时门禁归因对齐 |
| 状态 | 已更新（待 review） |
| 日期 | 2026-04-23 |
| 执行者 | Agent（后端/工程基建） |

---

## 1. 本轮归因修正

### 1.1 需要修正的问题

上一版归因只覆盖了“架构不匹配（x64 vs arm64）”分支，未覆盖以下真实分支：

- `process.arch = arm64` 且 rollup 平台包也为 arm64
- 仍在 `dlopen` 阶段失败（`ERR_DLOPEN_FAILED`）
- 根因是 `.node` 与当前 Node 进程签名链路不兼容（Team ID 不一致）

### 1.2 修正后的完整归因模型

```
执行端 = 实际运行 pnpm 的 Node 二进制（由 PATH 决定）
→ 先看 process.platform/process.arch（是否架构匹配）
→ 再看 native 模块 dlopen 是否通过签名链路
→ 任一环节失败都可能表现为 "Cannot find module ..."
```

分支定义：

| 分支 | 条件 | 典型错误 | 归因 |
|------|------|---------|------|
| 分支 A：架构不匹配 | Node `process.arch` 与已安装 native 包不匹配 | `MODULE_NOT_FOUND`（如缺 `darwin-x64`） | 运行时架构不匹配 |
| 分支 B：架构匹配但签名失败 | Node `process.arch` 匹配，`dlopen` 返回签名错误 | `ERR_DLOPEN_FAILED` + `code signature ... different Team IDs` | 运行时签名链路失败 |
| 分支 C：架构与签名均通过 | 匹配且可加载 native | `102/102 PASS` | 可放行执行端 |

---

## 2. 单一判定口径（消除 OS arch 与 process.arch 混用）

统一口径：

1. 执行端判定只使用以下两条命令输出：
   - `which node`
   - `node -p "process.execPath + ' | ' + process.platform + ' | ' + process.arch"`
2. 门禁结论以“同一执行端下 `pnpm --dir apps/web test -- --run`”实际结果为准。
3. `uname -m`（OS arch）仅作宿主机背景信息，不作为门禁归因主判据。

---

## 3. 证据矩阵（命令 + 输出）

### 3.1 执行端 A：`/Applications/Codex.app/Contents/Resources/node`

命令 1：
```bash
env PATH="/Applications/Codex.app/Contents/Resources:$PATH" which node
```
输出：
```text
/Applications/Codex.app/Contents/Resources/node
```

命令 2：
```bash
env PATH="/Applications/Codex.app/Contents/Resources:$PATH" node -p "process.execPath + ' | ' + process.platform + ' | ' + process.arch"
```
输出：
```text
/Applications/Codex.app/Contents/Resources/node | darwin | arm64
```

命令 3：
```bash
env PATH="/Applications/Codex.app/Contents/Resources:$PATH" pnpm --dir apps/web test -- --run
```
输出（摘要）：
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

结论：A 为 `darwin/arm64`，但触发“同架构签名链路失败”（分支 B）。

### 3.2 执行端 B：`/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node`

命令 1：
```bash
env PATH="/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin:$PATH" which node
```
输出：
```text
/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node
```

命令 2：
```bash
env PATH="/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin:$PATH" node -p "process.execPath + ' | ' + process.platform + ' | ' + process.arch"
```
输出：
```text
/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node | darwin | arm64
```

命令 3：
```bash
env PATH="/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin:$PATH" pnpm --dir apps/web test -- --run
```
输出（摘要）：
```text
Test Files  8 passed (8)
Tests      102 passed (102)
Duration   669ms
```

结论：B 为 `darwin/arm64` 且门禁通过（分支 C）。

---

## 4. 放行矩阵（更新）

| 执行端 | `which node` | `process.platform/arch` | `pnpm test -- --run` | 归因 | 放行判定 |
|------|------|------|------|------|------|
| A（Codex 内置 Node） | `/Applications/Codex.app/Contents/Resources/node` | `darwin/arm64` | 失败：`ERR_DLOPEN_FAILED` + Team ID 不一致 | 同架构签名链路失败 | 不作为失败阻断业务结论 |
| B（trae Node 24.14.0） | `/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node` | `darwin/arm64` | 通过：102/102 | 架构与签名链路均通过 | 作为本轮放行基准 |
| 历史 Rosetta x64 执行端 | 路径随执行端 | `darwin/x64` | 失败：缺 `darwin-x64` | 架构不匹配 | 环境阻塞，不归因业务失败 |

阶段准入规则：

- 放行基准：可复核执行端（当前为 B）门禁全通过。
- A 的失败归因为执行端签名链路，不判为业务回归。
- CI 结果仍为辅助项，不单独替代本地可复核结果。

---

## 5. 强制约束确认

- [x] 本轮未执行 push（按要求忽略“提交上一轮代码到远端仓库”）
- [x] 本轮仅更新文档并暂存，不提交 commit
- [x] 所有变更可通过 `git diff` / `git diff --cached` 复核
- [x] 未改动前端页面文件（`apps/web/app/**`）
- [x] 新增证据矩阵日志：`phase-2.14.11.1-runtime-proof-matrix-fix.md`
