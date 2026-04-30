# Phase Refactory Backend Development Log

| 开发日志信息 | |
|-------------|---------|
| 阶段 | Phase Refactory - 后端领域层收敛与数据骨架 |
| 负责人 | Backend Agent |
| 状态 | 进行中 |

---

<!-- ============================================ -->
<!-- 分割线：Round 2 -->
<!-- ============================================ -->

## Phase Refactory Round 2 devlog -- Workspace Session / Tabs / Recent Documents 数据骨架

**时间戳**: 2026-04-27

**任务起止时间**: 03:06 - 05:54 CST

**任务目标**: 建立 Workspace Tabs 数据模型，补齐 Session/Tab/Recent Documents Repository API，实现 Editor Tab 去重逻辑。

**改动文件及行数**:
- `packages/domain/src/workspace/types.ts` | A | +120 行（TabType / WorkspaceSession / WorkspaceOpenTab / RecentDocument + ID 生成）
- `packages/domain/src/workspace/index.ts` | A | +15 行（导出边界）
- `packages/domain/src/index.ts` | M | +2 行（新增 workspace 导出）
- `packages/domain/package.json` | M | +5 行（新增 workspace exports）
- `packages/domain/tests/workspace-types.test.ts` | A | +180 行（9 个 workspace 类型测试）
- `apps/web/lib/db.ts` | M | +85 行（Workspace Record 类型 + v15 migration + 3 张新表）
- `apps/web/lib/repository.ts` | M | +220 行（Session/Tab/Recent CRUD + 类型导出）
- `apps/web/tests/workspace-tabs.test.ts` | A | +420 行（24 个 workspace 集成测试）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-backend.md` | M | +80 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 312 tests / 20 files |
| `pnpm --dir apps/web typecheck` | ✅ PASS |
| `pnpm --dir apps/web test -- --run` | ✅ 286 tests / 13 files |
| `git diff --cached --check` | ✅ 仅 FRONTEND_TECH_SPEC 已有 trailing whitespace |

**手工验证步骤说明**:
1. Tab open / activate / close / pin 闭环：open → activate → close → restore 完整流程可验证
2. 同一 document editor tab 不重复打开：openWorkspaceTab(editor, docId=1) 两次只创建一个 tab
3. Recent document 去重并更新 openCount / lastOpenedAt：recordRecentDocumentOpen 同 docId 三次 → openCount=3
4. userId 隔离：用户 A 的 session/tabs/recent 不包含用户 B 数据
5. 关闭 active tab 后自动激活最后一个：close active → 最后一个 sortOrder 的 tab 变为 active
6. 所有 tab 关闭后 session.activeTabId 为 null

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 tabStore 未对接 | 中 | 需前端实现 tabStore 并调用 repository API |
| Tab 持久化恢复流程未实现 | 低 | restoreWorkspaceTabs 已可用，前端需在启动时调用 |
| 无 tab 数量上限 | 低 | 当前无最大 tab 数限制，后续可加 |

---

<!-- ============================================ -->
<!-- 分割线：Round 1 -->
<!-- ============================================ -->

## Phase Refactory Round 1 devlog -- 后端领域层收敛

**时间戳**: 2026-04-27

**任务起止时间**: 01:10 - 03:06 CST

**任务目标**: 冻结 Entry 心智，建立 Document / Capture / MindNode / MindEdge 领域命名边界，兼容式收敛避免前端断裂。

**改动文件及行数**:
- `packages/domain/src/document/types.ts` | A | +85 行（Document / DocumentType / DocumentPatch 等类型）
- `packages/domain/src/document/service.ts` | A | +95 行（buildDocumentPatch / documentFromEntry / entryFromDocument）
- `packages/domain/src/document/index.ts` | A | +12 行（导出边界）
- `packages/domain/src/capture/types.ts` | A | +45 行（Capture / CaptureStatus / CaptureSource 类型）
- `packages/domain/src/capture/index.ts` | A | +8 行（导出边界）
- `packages/domain/src/mind/types.ts` | A | +65 行（MindNode / MindEdge / makeMindNodeId / makeMindEdgeId）
- `packages/domain/src/mind/index.ts` | A | +10 行（导出边界）
- `packages/domain/src/types.ts` | M | +15 行（新增 re-export 新类型）
- `packages/domain/src/index.ts` | M | +5 行（新增 document/capture/mind 导出）
- `packages/domain/src/ports/repository.ts` | M | +120 行（新增 DocumentRepository / MindNodeRepository / MindEdgeRepository 接口）
- `packages/domain/package.json` | M | +12 行（新增 document/capture/mind exports）
- `packages/domain/tests/document-service.test.ts` | A | +280 行（17 个 Document 服务测试）
- `packages/domain/tests/mind-types.test.ts` | A | +180 行（11 个 Mind 类型测试）
- `apps/web/lib/db.ts` | M | +95 行（DocumentRecord/CaptureRecord 别名 + v14 migration + mindNodes/mindEdges 表）
- `apps/web/lib/repository.ts` | M | +280 行（Document 别名函数 + MindNode/MindEdge CRUD）
- `apps/web/tests/mind-graph.test.ts` | A | +350 行（14 个 Mind Graph + Document alias 集成测试）
- `docs/engineering/dev_log/Phase_refactory/phase-demo2-devlog-backend.md` | A | +120 行（本轮开发日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `node -v && pnpm -v` | v24.14.0 / 10.0.0 |
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 303 tests / 19 files |
| `pnpm --dir apps/web typecheck` | ✅ PASS |
| `pnpm --dir apps/web test -- --run` | ✅ 262 tests / 12 files |
| `git diff --cached --check` | ✅ 仅 2 个已有 trailing whitespace 警告（非本轮修改） |

**手工验证步骤说明**:
1. 旧代码零改动：前端 import `@atlax/domain` 的 Entry / EntryType / EntryStatus / SourceType 仍可正常使用
2. 新命名可用：`import { Document, DocumentType, Capture, CaptureStatus, MindNode, MindEdge } from '@atlax/domain'` 编译通过
3. 子包导出可用：`import { Document } from '@atlax/domain/document'` / `import { MindNode } from '@atlax/domain/mind'` 编译通过
4. DB 表别名：`documentsTable.get(id)` 与 `entriesTable.get(id)` 返回相同数据
5. MindNode/MindEdge CRUD：upsert → get → list → delete 完整闭环
6. v14 migration：新增 mindNodes/mindEdges 表，不破坏旧表数据

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端未迁移到新命名 | 低 | 旧命名仍可用，前端可渐进迁移 |
| MindNode/MindEdge 无自动从 Entry 生成逻辑 | 中 | 需后续 Round 实现 auto-landing 算法 |
| Document/Capture 别名函数未覆盖所有旧函数 | 低 | 当前覆盖 list/get/update 主路径，其余按需补充 |

---

## 关联文档

| 文档 | 路径 |
|------|------|
| 架构说明书 | `docs/product/ARCHITECTURE.md` |
| 技术规格 | `docs/product/TECH_SPEC.md` |
