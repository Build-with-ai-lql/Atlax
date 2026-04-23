# Phase 2.15-BE｜统一门禁脚本 & 运行时门禁对齐收口

| 项目 | 内容 |
|------|------|
| 模块 | 工程基建 - 统一门禁入口脚本 |
| 状态 | 待复审 |
| 日期 | 2026-04-23 |
| 执行者 | Agent（后端/工程基建） |

---

## 1. 目标

1. **提交上一轮**：将 2.14.10~2.14.11 已通过 review 的改动提交并推送至远端 `develop` 分支。
2. **创建统一门禁脚本**：新增 `scripts/run-web-gate.sh`，固定 Node.js 执行端，消除 FE/BE agent 因架构/签名差异导致的门禁结论冲突。
3. **文档同步**：更新验收文档与运行时证据矩阵，纳入门禁脚本说明。

---

## 2. 上一轮提交记录

### 2.1 提交信息

| 项目 | 值 |
|------|-----|
| Commit | `986984b` |
| 分支 | `develop` → `origin/develop` |
| 消息 | `Phase 2.14.10~2.14.11: 后端测试补强 + Rollup darwin-arm64 错误链路修正 + 运行时门禁对齐` |
| 文件数 | 8 files changed, +346 / -14 |

### 2.2 包含内容

- `phase-2.14.10.1-backend-test-hardening.md` — 测试补强日志
- `phase-2.14.10.2-backend-stage-and-doc-fix.md` — 暂存区收口日志
- `phase-2.14.10.3-backend-log-truth-fix.md` — 描述对齐日志
- `phase-2.14.10.4-backend-test-block-cause-alignment.md` — 完整错误链路修正
- `phase-2.14.11-infra-runtime-gate-alignment.md` — 基建对齐
- `phase-2.14.11.1-runtime-proof-matrix-fix.md` — 运行时证据矩阵
- `package.json` + `pnpm-lock.yaml` — optionalDependencies 更新

---

## 3. 统一门禁脚本

### 3.1 脚本路径

```
scripts/run-web-gate.sh
```

### 3.2 脚本行为

1. **固定 Node.js**：硬编码 `/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node`，不存在则报错退出。
2. **输出指纹**：
   - `which node`
   - `process.execPath`
   - `process.platform`
   - `process.arch`
3. **三步门禁**：
   - `pnpm --dir apps/web lint`
   - `pnpm --dir apps/web typecheck`
   - `pnpm --dir apps/web test -- --run`
4. **汇总输出**：PASS/FAIL 计数 + 最终 GATE: PASSED/FAILED

### 3.3 脚本源码

```bash
#!/usr/bin/env bash
set -euo pipefail

GATE_NODE="/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="${PROJECT_ROOT}/apps/web"

if [ ! -f "${GATE_NODE}" ]; then
  echo "ERROR: Gate Node.js not found at ${GATE_NODE}"
  exit 1
fi

echo "[FINGERPRINT]"
echo "  node:     ${GATE_NODE}"
echo "  execPath: $(${GATE_NODE} -p "process.execPath")"
echo "  platform: $(${GATE_NODE} -p "process.platform")"
echo "  arch:     $(${GATE_NODE} -p "process.arch")"

export PATH="${GATE_NODE%/*}:${PATH}"

run_step() { ... }  # lint / typecheck / test

# 结果汇总
```

---

## 4. 验证结果（2026-04-23 实测）

### 4.1 门禁脚本完整输出

```text
============================================
 Atlax MindDock Web Gate (unified runner)
============================================

[FINGERPRINT]
  node:     /Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node
  execPath: /Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node
  platform: darwin
  arch:     arm64

--- lint ---
> eslint app lib --ext .ts,.tsx
  PASS

--- typecheck ---
> tsc --noEmit
  PASS

--- test ---
> vitest run "--" "--run"
 ✓ tests/events.test.ts (21 tests) 4ms
 ✓ tests/migration.test.ts (10 tests) 44ms
 ✓ tests/chat-source.test.ts (4 tests) 22ms
 ✓ tests/integration.test.ts (2 tests) 44ms
 ✓ tests/suggest-tag.test.ts (9 tests) 52ms
 ✓ tests/archive-reopen.test.ts (12 tests) 99ms
 ✓ tests/browse-seed.test.ts (10 tests) 113ms
✓ tests/repository.test.ts (34 tests) 189ms

 Test Files  8 passed (8)
      Tests  102 passed (102)
   Duration  653ms
  PASS

============================================
 Results: 3 passed, 0 failed
 GATE: PASSED
```

### 4.2 单独验证命令

| 命令 | 结果 |
|------|------|
| `pnpm --dir apps/web lint` | ✅ PASS（0 errors, 0 warnings） |
| `pnpm --dir apps/web typecheck` | ✅ PASS（0 type errors） |
| `pnpm --dir apps/web test -- --run` | ✅ PASS（102/102） |
| `node -p "process.execPath + ' | ' + process.platform + ' | ' + process.arch"` | `/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node \| darwin \| arm64` |

---

## 5. 修改文件汇总

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `scripts/run-web-gate.sh` | 新增 | 统一门禁入口脚本（固定 Node.js + 三步验证 + 指纹输出） |
| `docs/engineering/dev_log/Phase2/phase2-acceptance.md` | 修改 | §6.0 新增统一门禁入口说明 + 示例输出 |
| `docs/engineering/dev_log/Phase2/phase-2.14.11.1-runtime-proof-matrix-fix.md` | 修改 | §5 新增门禁脚本补充说明 |
| `docs/engineering/dev_log/Phase2/phase-2.15-backend-gate-script.md` | 新增 | 本开发日志 |

---

## 6. 解决的问题

| 问题 | 根因 | 解决方案 |
|------|------|---------|
| FE/BE agent 门禁结论不一致 | 不同执行端使用不同 Node.js 二进制（NVM x64 vs Trae arm64 vs Codex arm64），导致 rollup native 模块加载结果不同 | 固定使用 Trae bundled arm64 Node.js 作为唯一门禁执行端 |
| 架构差异误判为业务回归 | agent 未区分"环境阻塞"和"业务断言失败"，将 MODULE_NOT_FOUND / ERR_DLOPEN_FAILED 归因为代码问题 | 门禁脚本自动输出执行端指纹，归因时先检查 platform/arch 一致性 |
| 手动执行步骤遗漏 | 不同 agent 可能跳过 lint 或 typecheck 直接跑 test | 脚本强制三步顺序执行，任何一步失败都计入 FAIL |

---

## 7. 剩余风险

| 风险 | 说明 | 应对 |
|------|------|------|
| 固定 Node.js 路径不可移植 | 当前硬编码了特定用户路径，其他开发者需要修改 | 后续可改为读取环境变量或 `.gate-node` 配置文件 |
| CI runner 需独立配置 | CI Linux runner 不适用此脚本中的 darwin-arm64 路径 | CI 可使用自身 Node.js 或修改 GATE_NODE 变量 |
| 生产构建未覆盖 | 脚本仅覆盖 dev/test 阶段，不包含 `next build` | 可在后续扩展 build 步骤 |

---

## 8. 强制约束确认

- [x] 上一轮代码已提交推送至远端（commit `986984b` on `develop`）
- [x] 本轮更改放入 git 暂存区，不提交
- [x] 所有变更可通过 `git diff` / `git diff --cached` 审阅
- [x] 未修改前端页面代码（`apps/web/app/**` 无改动）
