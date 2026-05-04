# Phase 3 Backend Development Log

| 开发日志信息 | |
|-------------|---------|
| 阶段 | Phase 3 - 产品化打磨与留存增强 |
| 负责人 | Backend Agent |
| 状态 | 进行中 |

---

<!-- ============================================ -->
<!-- 分割线：Phase 3 Round 20 (LC-006) -->
<!-- ============================================ -->

## Phase 3 Round 20 devlog -- LC-006 Recommendation Shown Event 最小曝光记录

**时间戳**: 2026-05-05

**任务起止时间**: 04:55 - 05:10 CST

**工时**: 15 分钟

**Notion 卡片**: LC-006 Recommendation Shown Event 最小曝光记录

**任务目标**: 在 LC-004 已生成 recommendation + recommendation_generated event、LC-005 已实现 accepted / rejected / modified / ignored feedback 的基础上，补齐最小 shown 曝光事件闭环，让推荐生命周期形成 generated → shown → accepted / rejected / modified / ignored 的完整链路。

**改动文件及行数**:
- `packages/domain/src/services/IntelligenceSpine.ts` | M | +18 行（新增 RecommendationShownInput、RecommendationShownResult 领域类型）
- `apps/web/lib/repository.ts` | M | +45 行（新增 markRecommendationShown() API + 导入新类型）
- `apps/web/tests/capture-document-flow.test.ts` | M | +210 行（新增 11 个 LC-006 测试 + import markRecommendationShown）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +85 行（本轮日志）

**变更摘要**:
- **新增领域类型**:
  - `RecommendationShownInput`：{ recommendationId: string, userId: string }，对标 feedback 的输入结构
  - `RecommendationShownResult`：{ recommendation: { id, status, updatedAt }, shownEvent: { id, eventType, recommendationId } }，对标 RecommendationFeedbackResult 的返回结构
- **新增 Repository API**: `markRecommendationShown(input)` —— 核心高层 API，流程：
  1. 按 recommendationId 查询 recommendation，不存在抛 `Recommendation not found: {id}`
  2. 校验 userId 归属，不匹配抛 `User {userId} does not own recommendation {id}`
  3. 更新 recommendation.status 为 'shown'
  4. 记录 recommendation_event（eventType = 'recommendation_shown'，metadata = { source: 'recommendation_shown' }）
  5. 返回 RecommendationShownResult（含更新后的 recommendation 状态 + shownEvent ID）
- **userId 隔离**: markRecommendationShown 内部校验 userId 匹配，不匹配抛 Error（与 recordRecommendationFeedback 保持一致）；底层 recordRecommendationEvent 仍按 userId 写入
- **错误处理策略**: 不存在 recommendationId 和 userId 不匹配均抛 Error（非返回 null），确保调用方不能静默忽略失败
- **不改旧链路**: createCaptureToDocumentFlow 和 recordRecommendationFeedback 完全不变，LC-006 仅在已有链路外新增 shown 能力
- **生命周期完整性**: 完整链路 `generated → shown → accepted/rejected/modified/ignored` 已验证通过
- **测试覆盖**: 新增 11 个 LC-006 测试（web tests 总数 406 = 395 LC-002/003/004/005 + 11 LC-006），覆盖：
  - markRecommendationShown basic：status 更新为 shown + event 追加（events 从 1 条变为 2 条）
  - shown event 保留 userId
  - userId isolation：user B 标记 user A 的 recommendation → 抛 Error + 原 status 不变（仍为 generated）
  - 不存在 recommendationId → 抛 Error
  - shown → accepted：shown 后仍可 feedback accepted（events 共 3 条）
  - shown → rejected
  - shown → modified
  - shown → ignored
  - LC-004 回归：createCaptureToDocumentFlow 仍生成 landing recommendation + recommendation_generated event
  - LC-005 回归：recordRecommendationFeedback 仍正常工作
  - 空内容拒绝：不生成 recommendation / recommendation_event

**遇到的问题以及解决方式**:
| 问题 | 解决方式 | 是否解决 |
|------|---------|---------|
| `recordRecommendationEvent` 函数声明在替换 markRecommendationShown 时被意外删除（仅剩函数体） | 恢复 `export async function recordRecommendationEvent(input: RecommendationEventInput): Promise<PersistedRecommendationEvent> {` 函数声明行 | ✅ |

**自动验证**:
| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors（1 pre-existing warning 来自 GoldenTopNav.tsx，非本轮引入） |
| `pnpm typecheck` | ✅ PASS（domain + web 均通过） |
| domain tests | ✅ 312 tests / 20 files |
| web tests | ✅ 406 tests / 17 files（含 LC-006 新增 11 tests） |
| `pnpm build:web` | ✅ PASS |
| `pnpm validate` | ✅ PASS（lint + typecheck + test + terminology 全部通过） |

**手工验证方式**:
1. 调用 `createCaptureToDocumentFlow({ userId: USER_A, rawText: 'test' })` 获取 recommendationId
2. 调用 `markRecommendationShown({ recommendationId, userId: USER_A })`，返回 `shown.recommendation.status === 'shown'`，`shown.shownEvent.eventType === 'recommendation_shown'`
3. `listRecommendationEvents(USER_A, { recommendationId })` 返回 2 条事件（generated + shown），shown event 的 `recommendationId` 正确，`userId === USER_A`
4. 用户 B 调用 `markRecommendationShown({ recommendationId: recA.id, userId: USER_B })` → 抛 Error，`listRecommendations(USER_A)` 中 recA.status 仍为 generated
5. 调用 `markRecommendationShown({ recommendationId: 'non_existent_id', userId: USER_A })` → 抛 Error
6. shown 后调用 `recordRecommendationFeedback({ feedbackType: 'accepted' })` → status 变为 accepted，events 共 3 条（generated + shown + accepted）
7. shown 后调用 `recordRecommendationFeedback({ feedbackType: 'rejected' })` → status 变为 rejected
8. shown 后调用 `recordRecommendationFeedback({ feedbackType: 'modified' })` → status 变为 modified
9. shown 后调用 `recordRecommendationFeedback({ feedbackType: 'ignored' })` → status 变为 ignored
10. 调用 `createCaptureToDocumentFlow({ rawText: 'LC-004 regression' })` 仍生成 recommendation + event
11. 调用 `recordRecommendationFeedback({ ... })` 独立工作，不受 shown 影响
12. 空内容 `createCaptureToDocumentFlow({ rawText: '' })` → 抛 Error，无 recommendation / event 脏数据

**验收标准**:
- markRecommendationShown 将 recommendation.status 更新为 shown
- shown 操作新增一条 recommendation_event（eventType = recommendation_shown）
- recommendation_event.recommendationId 指向被展示的 recommendation
- shown event 保留 userId
- userId 隔离测试通过，不能跨用户标记 recommendation
- 不存在 recommendationId → 抛 Error
- 已 shown 的 recommendation 后续仍可被 LC-005 feedback 更新为 accepted / rejected / modified / ignored
- LC-004 的 recommendation_generated 流程不回归
- 空内容 rejection 仍然不会生成 recommendation / recommendation_event
- pnpm validate PASS
- pnpm build:web PASS

**已知风险或未做事项**:
| 风险 | 等级 | 说明 |
|------|------|------|
| shown 无自动触发策略 | 按设计 | 当前 markRecommendationShown 为显式调用 API，不实现自动触发策略（如"进入视图即 shown"）。前端需在推荐列表渲染时显式调用此 API |
| shown event metadata 仅含 source 字段 | 极低 | 与 generated event（含 documentId/mindNodeId 等上下文）不同，shown event 的元数据最简化。未来如需记录"展示位置/停留时长"可扩展 metadata |
| shown 后状态被 feedback 覆盖 | 按设计 | 这是预期行为：shown → accepted/rejected/modified/ignored 表示用户从看到推荐的 exposure 到做出反馈的完整生命周期。不引入 shown→shown 幂等约束（重复 shown 是合法的，如刷新页面后重新曝光） |

**是否可以进入下一轮**: 是（本卡为 LC-006 终点卡，做完后 Local Core / Intelligence Spine 的 Recommendation 事件闭环完整）

**下一轮风险评估**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 UI 接入 | 低 | 后端 Recommendation shown/feedback API 全部就绪（generated → shown → accepted/rejected/modified/ignored），前端需接入展示和交互逻辑 |

---
<!-- ============================================ -->
<!-- 分割线：Phase 3 Round 19 (LC-005) -->
<!-- ============================================ -->

## Phase 3 Round 19 devlog -- LC-005 Recommendation Feedback 最小事件闭环

**时间戳**: 2026-05-05

**任务起止时间**: 04:17 - 04:22 CST

**工时**: 5 分钟

**Notion 卡片**: LC-005 Recommendation Feedback 最小事件闭环

**任务目标**: 在 LC-004 已生成 recommendation + recommendation_generated event 的基础上，补齐最小 recommendation feedback 能力，支持 accepted / rejected / modified / ignored 四类反馈，包含 userId 隔离、不存在 recommendationId 失败路径、modified 修改上下文保存。

**改动文件及行数**:
- `packages/domain/src/services/IntelligenceSpine.ts` | M | +39 行（新增 RecommendationFeedbackType、RecommendationFeedbackInput、RecommendationFeedbackResult 类型，feedbackTypeToStatus、feedbackTypeToEventType 映射函数）
- `apps/web/lib/repository.ts` | M | +65 行（新增 getRecommendation(userId, recommendationId) + recordRecommendationFeedback() API；updateRecommendationStatus 增加 userId 校验；新增类型/函数导入）
- `apps/web/tests/intelligence-spine.test.ts` | M | +5 行（updateRecommendationStatus 5 处调用适配新签名：增加 userId 参数）
- `apps/web/tests/capture-document-flow.test.ts` | M | +166 行（新增 8 个 LC-005 测试 + import recordRecommendationFeedback）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +95 行（本轮日志）

**变更摘要**:
- **新增领域类型**: `RecommendationFeedbackType = 'accepted' | 'rejected' | 'modified' | 'ignored'`（与 RecommendationStatus 值相同，语义上是"用户反馈动作"的标签）；`RecommendationFeedbackInput`（recommendationId + userId + feedbackType + feedbackPayload?）；`RecommendationFeedbackResult`（recommendation + feedbackEvent 返回值）
- **反馈类型到状态/事件的映射**: `feedbackTypeToStatus` 直接返回 feedbackType（因 status 值与反馈类型值一致）；`feedbackTypeToEventType` 映射到 `recommendation_{accepted|rejected|modified|ignored}` 事件类型
- **新增 Repository API**:
  - `getRecommendation(userId, recommendationId)`：按 recommendationId + userId 反查推荐记录，userId 不匹配返回 null。解决原有 `updateRecommendationStatus` 无 userId 校验的安全漏洞
  - `recordRecommendationFeedback(input)`：核心高层 API，流程如下：
    1. 按 recommendationId 查询 recommendation，不存在抛 `Recommendation not found: {id}`
    2. 校验 userId 归属，不匹配抛 `User {userId} does not own recommendation {id}`
    3. 更新 recommendation.status 为 feedbackType（accepted/rejected/modified/ignored）
    4. 记录 recommendation_event 反馈事件（eventType = recommendation_{feedbackType}，metadata = { source: 'recommendation_feedback', feedbackType, feedbackPayload? }）
    5. 返回 RecommendationFeedbackResult（含更新后的 recommendation 状态 + feedbackEvent ID）
- **修复 updateRecommendationStatus 安全漏洞**: 原函数签名 `(recommendationId, status)` 无 userId 校验，任意调用方可更新任何用户 recommendation。现改为 `(userId, recommendationId, status)`，内部增加 `if (!rec || rec.userId !== userId) return null` 校验
- **modified 反馈上下文保存**: `feedbackPayload` 通过 `RecommendationFeedbackInput.feedbackPayload` 传入，写入 recommendation_event.metadata.feedbackPayload。当前使用开放 `Record<string, unknown>` 类型，支持任意 JSON 结构的最小修改上下文
- **userId 隔离**: getRecommendation、updateRecommendationStatus、recordRecommendationFeedback 三层均强制 userId 匹配；listRecommendationEvents 底层按 userId 过滤
- **错误处理策略**: 不存在 recommendationId 和 userId 不匹配均抛 Error（非返回 null），确保调用方不能静默忽略失败
- **不改旧链路**: createCaptureToDocumentFlow 内部仍使用 `createRecommendation` + `recordRecommendationEvent`（非 recordRecommendationFeedback），保持 LC-004 生成的 recommendation 状态不受反馈逻辑影响
- **测试覆盖**: 新增 8 个 LC-005 测试（web tests 总数 395 = 387 LC-002/003/004 + 8 LC-005），覆盖：
  - accepted feedback：status 更新 + event 追加（events 从 1 条变为 2 条）
  - rejected feedback
  - modified feedback：验证 feedbackPayload 在 event.metadata 中被保存
  - ignored feedback
  - userId isolation：user B 反馈 user A 的 recommendation → 抛 Error + 原 status 不变（仍为 generated）
  - 不存在 recommendationId → 抛 Error
  - LC-004 回归：createCaptureToDocumentFlow 仍生成 landing recommendation + recommendation_generated event
  - LC-004 回归：空内容拒绝不生成 recommendation / event

**遇到的问题以及解决方式**:
| 问题 | 解决方式 | 是否解决 |
|------|---------|---------|
| `RecommendationFeedbackType` 类型 import 但未在 repository.ts 中使用（仅作为 `RecommendationFeedbackInput` 的成员类型间接使用） | 从 import 中移除 `RecommendationFeedbackType`，保留 `RecommendationFeedbackInput` 和 `RecommendationFeedbackResult` | ✅ |
| `events.find()` 返回 `T \| undefined`，`unwrap()` 期望 `T \| null` 导致 TS2532 类型错误 | `unwrap(feedbackEvent ?? null)` 转换 undefined → null | ✅ |
| `updateRecommendationStatus` 签名变更后 intelligence-spine.test.ts 中 5 处调用缺少 userId 参数 | 所有调用统一增加 `USER_A` 作为第一参数 | ✅ |

**自动验证**:
| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors（1 pre-existing warning 来自 GoldenTopNav.tsx，非本轮引入） |
| `pnpm typecheck` | ✅ PASS（domain + web 均通过） |
| domain tests | ✅ 312 tests / 20 files |
| web tests | ✅ 395 tests / 17 files（含 LC-005 新增 8 tests） |
| `pnpm build:web` | ✅ PASS（Next.js 14.2.28 构建成功，7 routes） |
| `pnpm validate` | ✅ PASS（lint + typecheck + test + terminology 全部通过） |

**手工验证方式**:
1. 调用 `createCaptureToDocumentFlow({ userId: USER_A, rawText: 'test' })` 获取 recommendationId
2. 调用 `recordRecommendationFeedback({ recommendationId, userId: USER_A, feedbackType: 'accepted' })`，返回 `feedback.recommendation.status === 'accepted'`，`feedback.feedbackEvent.eventType === 'recommendation_accepted'`
3. `listRecommendationEvents(USER_A, { recommendationId })` 返回 2 条事件（generated + accepted）
4. 重新 flow 创建新 recommendation，调用 `recordRecommendationFeedback({ feedbackType: 'rejected' })`，status 变为 rejected
5. 调用 `recordRecommendationFeedback({ feedbackType: 'modified', feedbackPayload: { originalTag: '学习', modifiedTag: 'TS' } })`，status 变为 modified，`listRecommendationEvents` 中 feedback_event.metadata.feedbackPayload 含修改上下文
6. 调用 `recordRecommendationFeedback({ feedbackType: 'ignored' })`，status 变为 ignored
7. 用户 B 调用 `recordRecommendationFeedback({ recommendationId: recA.id, userId: USER_B, feedbackType: 'accepted' })` → 抛 Error，`listRecommendations(USER_A)` 中 recA.status 仍为 generated
8. 调用 `recordRecommendationFeedback({ recommendationId: 'non_existent_id', userId: USER_A, feedbackType: 'accepted' })` → 抛 Error
9. 调用 `createCaptureToDocumentFlow({ rawText: 'LC-004 regression' })` 仍生成 recommendation + event
10. 空内容 `createCaptureToDocumentFlow({ rawText: '' })` → 抛 Error，无 recommendation / event 脏数据

**验收标准**:
- recordRecommendationFeedback 支持 accepted / rejected / modified / ignored 四类反馈
- 反馈后 recommendation.status 更新为对应状态
- 反馈后 recommendation_event 追加对应事件（recommendation_* 类型）
- recommendation_event 通过 recommendationId 关联 recommendation
- modified 反馈的 feedbackPayload 在 event.metadata 中保存
- userId 隔离：用户不能反馈其他用户的 recommendation
- 不存在 recommendationId → 抛 Error
- userId 不匹配 → 抛 Error
- LC-004 主链路不受影响（createCaptureToDocumentFlow 回归通过）
- 空内容拒绝不产生脏数据
- pnpm validate 和 pnpm build:web 通过

**已知风险或未做事项**:
| 风险 | 等级 | 说明 |
|------|------|------|
| updateRecommendationStatus 签名 breaking change | 低 | 旧签名 `(recommendationId, status)` → 新签名 `(userId, recommendationId, status)`。当前代码库仅 intelligence-spine.test.ts 有 5 处调用已全部适配。若外部 consumer 依赖此 API，需同步更新 |
| feedbackPayload 无 schema 约束 | 极低 | 开放 `Record<string, unknown>` 类型提供最大灵活性，但无结构化校验。当前推荐系统处于早期阶段，不强约束 payload 格式。未来如需统一修改上下文格式，可在 feedbackTypeToEventType 层增加 validateFeedbackPayload |
| recordRecommendationFeedback 无事务保证 | 低 | 先写 recommendation 状态更新，再写 recommendation_event。若事件写入失败，状态已更新但事件缺失。由于 Dexie 无跨表事务，此风险存在于所有 repository 操作中。后续可封装 `db.transaction()` |
| 不做 shown event | 按设计 | LC-005 卡明确不在"极低成本外"实现 shown event。当前 recommendation_events 表有 shown 状态定义（RecommendationEventType 含 recommendation_shown），但无自动写入逻辑。后续前端展示推荐时需单独调用 recordRecommendationEvent 写入 |

**是否可以进入下一轮**: 是

**下一轮风险评估**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 反馈数据无偏好学习回路 | 低 | 当前仅记录用户反馈事件（event 写入），不更新用户偏好 profile、不触发重排序。后续 LC-006 可消费 feedback event 驱动 ranking/learning |

---

<!-- ============================================ -->
<!-- 分割线：Phase 3 Round 18 (LC-004) -->
<!-- ============================================ -->

## Phase 3 Round 18 devlog -- LC-004 Capture Landing Recommendation 最小生成闭环

**时间戳**: 2026-05-05

**任务起止时间**: 03:12 - 03:32 CST

**工时**: 20 分钟

**Notion 卡片**: LC-004 Capture Landing Recommendation 最小生成闭环

**任务目标**: 在 Capture → Document → MindNode 最小闭环成功后，生成最小 landing recommendation，并写入 recommendation_event generated，把主链路推进到 Capture → Document → MindNode → Recommendation → RecommendationEvent。

**改动文件及行数**:
- `packages/domain/src/services/CaptureToDocumentFlow.ts` | M | +13 行（CaptureToDocumentResult 新增 recommendation + recommendationEvent 字段）
- `apps/web/lib/repository.ts` | M | +41 行（createCaptureToDocumentFlow 内部在 MindNode 创建后同步创建 landing recommendation + recommendation_event generated，返回值扩展包含 recommendation/recommendationEvent）
- `apps/web/tests/capture-document-flow.test.ts` | M | +205 行（新增 15 个 LC-004 测试 + 主测试扩展 recommendation 断言 + cleanAll 扩展 + 新增 import）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +105 行（本轮日志 + 格式修复）

**变更摘要**:
- **recommendation 生成规则**: createCaptureToDocumentFlow 成功后，同步创建一条 landing recommendation：
  - `subjectType = 'dockItem'`，`subjectId = captureId`（指向本次 capture）
  - `recommendationType = 'landing'`（复用已有 recommendationType 开放字符串字段）
  - `candidateType = 'mindNode'`，`candidateId = mindNode.id`（指向本次生成的 mindNode）
  - `status = 'generated'`
  - `confidenceScore = 1.0`（最小闭环确定性高，不引入概率语义）
  - `reasonJson` 写入结构化可解释信息：`{ source: 'capture_to_document_flow', reason: 'created from successful capture landing flow', documentId, mindNodeId }`
- **recommendation_event generated 写入规则**: 同步调用 `recordRecommendationEvent` 写入一条事件：
  - `eventType = 'recommendation_generated'`（对应领域枚举 `RecommendationEventType`）
  - `recommendationId` 关联刚创建的 recommendation
  - `metadata` 写入 `{ source: 'capture_to_document_flow', documentId, mindNodeId }`
- **subject 指向决策**: subject 指向 capture（dockItem），而非 document。理由是 capture 是用户输入的原点，推荐系统应当知道"为什么推荐"源于哪次用户输入。从 capture 可通过 `document.sourceDockItemId` 反查 document
- **userId 隔离**: createCaptureToDocumentFlow 内部调用的 `createDockItem`、`entriesTable.add`、`upsertMindNode`、`createRecommendation`、`recordRecommendationEvent` 均继承现有 userId 隔离语义。`listRecommendations` / `listRecommendationEvents` 底层查询均以 userId 为前缀过滤
- **workspaceId**: 当前数据模型无 workspaceId 字段（`recommendationsTable` / `recommendationEventsTable` 仅有 userId 隔离），不硬引入。原因：LC-001 阶段定义的三张 Intelligence Spine 表均未设计 workspaceId，强行添加会破坏现有 schema 一致性（需额外 migration + 回填策略）。未来如引入 workspace 概念，需统一补齐所有 Intelligence Spine 表的 workspaceId
- **不修改已有状态规则**: LC-003 的 `capture.status = archived` / `processedAt` 写入逻辑完全不变；LC-002 的 `document.sourceDockItemId` / `mindNode.documentId` 关联完全不变
- **测试覆盖**: 新增 15 个 LC-004 测试（web tests 总数 387 = 372 LC-002/003 + 15 LC-004），覆盖：
  - landing recommendation 创建 + recommendation_event generated 创建
  - recommendation.subject 指向 capture
  - recommendation.candidate 指向 mindNode
  - recommendation_event 关联 recommendation（by recommendationId 过滤）
  - userId 隔离：recommendation + recommendation_event 双层
  - 空内容拒绝时无 recommendation / recommendation_event 写入
  - LC-003 状态规则不回退（capture.status=archived, processedAt 非空）
  - LC-002 关联规则不回退（sourceDockItemId, documentId）
  - reasonJson 结构化元数据验证
  - recommendation_event metadata 内容验证

**遇到的问题以及解决方式**:
| 问题 | 解决方式 | 是否解决 |
|------|---------|---------|
| LC-001~LC-004 开发日志未遵循 devlog-structure.md 规范（顺序正排、缺工时、题目格式不一致） | 在 LC-004 交付后统一修复：重排为倒序（LC-004→LC-003→LC-002→LC-001），补充工时记录，统一题目格式为 Phase 3 Round X | ✅ |

**自动验证**:
| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors（1 pre-existing warning 来自 GoldenTopNav.tsx，非本轮引入） |
| `pnpm typecheck` | ✅ PASS（domain + web 均通过） |
| domain tests | ✅ 312 tests / 20 files |
| web tests | ✅ 387 tests / 17 files（含 LC-004 新增 15 tests） |
| `pnpm build:web` | ✅ PASS（Next.js 14.2.28 构建成功，7 routes） |
| `pnpm validate` | ✅ PASS（lint + typecheck + test + terminology 全部通过） |

**手工验证方式**:
1. 调用 `createCaptureToDocumentFlow({ userId: 'test', rawText: '测试推荐生成' })`，返回结果含 `recommendation` 和 `recommendationEvent` 字段
2. `result.recommendation.recommendationType === 'landing'`，`result.recommendation.status === 'generated'`
3. `result.recommendation.subjectType === 'dockItem'`，`result.recommendation.subjectId === result.capture.id`
4. `result.recommendation.candidateType === 'mindNode'`，`result.recommendation.candidateId === result.mindNode.id`
5. `result.recommendationEvent.eventType === 'recommendation_generated'`
6. 调用 `listRecommendationEvents(userId, { recommendationId: result.recommendation.id })` 返回 1 条记录，`eventType === 'recommendation_generated'`，`recommendationId === result.recommendation.id`
7. 调用 `listRecommendations(userId)` 返回 1 条记录，`reasonJson` 可 JSON.parse 得到 `{ source, reason, documentId, mindNodeId }`
8. 不同 userId A/B 创建后，`listRecommendations(USER_B)` 不包含 USER_A 的 recommendation
9. `listRecommendationEvents(USER_B, { recommendationId: recA.id })` 返回空
10. 空字符串 rawText → 抛出异常，且 `listRecommendations` / `listRecommendationEvents` 均为空

**验收标准**:
- createCaptureToDocumentFlow 成功后自动生成 landing recommendation（status = generated）
- 同步写入 recommendation_event generated（eventType = recommendation_generated）
- recommendation.subject 指向 capture（dockItem 类型）
- recommendation.candidate 指向 mindNode（mindNode 类型）
- recommendation_event 可通过 recommendationId 关联到 recommendation
- recommendation / recommendation_event 按 userId 隔离
- 空内容拒绝时不产生任何 recommendation / recommendation_event 脏数据
- LC-003 状态规则（archived + processedAt）不回退
- LC-002 关联规则（sourceDockItemId + documentId）不回退
- pnpm validate 和 pnpm build:web 通过

**已知风险或未做事项**:
| 风险 | 等级 | 说明 |
|------|------|------|
| recommendation 写入在 capture status 更新之前 | 低 | 当前流程顺序：MindNode 创建 → Recommendation 创建 → Capture status 更新。若 Recommendation 创建成功后 Capture status 更新失败，会产生一条无对应 archived capture 的 recommendation。由于 Dexie 无跨表事务，此风险存在但极低（dockItemsTable.update 简单操作失败概率极小） |
| landing 使用开放字符串 recommendationType | 低 | 当前 `recommendationType` 为开放 `string` 类型（非枚举），`landing` 值不与任何领域枚举冲突。未来如需强类型化，可将 `landing` 加入 RecommendationType 联合类型 |
| confidenceScore = 1.0 的语义 | 极低 | 最小闭环中推荐确定性高，使用 1.0 合理。但若后续引入概率排序算法，此值可能需要重新审视。当前不影响任何排序逻辑（不做 Top-K） |
| 不做推荐排序/Top-K | 按设计 | LC-004 仅为最小生成闭环，不引入排序/Top-K 策略。后续如需 Top-K 展示，可基于 `confidenceScore` 或 `createdAt` 排序 |

**是否可以进入下一轮**: 是

**下一轮风险评估**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 后续轮次需补齐 recommendation shown 事件 | 低 | 当前未做 shown 事件（严格按卡要求），前端展示推荐列表时需单独写入 shown 事件以形成完整审计链路 |
| 多 candidate 场景需重新设计 | 低 | 当前一条 flow 生成一条 recommendation + 一个 candidate（mindNode），未来如需多 candidate 需改为批量创建 |

---

<!-- ============================================ -->
<!-- 分割线：Phase 3 Round 17 (LC-003) -->
<!-- ============================================ -->

## Phase 3 Round 17 devlog -- LC-003 状态一致性与结构投影收口

**时间戳**: 2026-05-05

**任务起止时间**: 02:25 - 02:35 CST

**工时**: 10 分钟

**Notion 卡片**: LC-003 Local Core 状态一致性与结构投影收口

**任务目标**: 收紧 Capture → Document → MindNode 最小闭环完成后的状态规则，解决 LC-002 遗留的 Capture 保持 pending 状态的一致性问题。

**改动文件及行数**:
- `packages/domain/src/services/CaptureToDocumentFlow.ts` | M | +1 行（CaptureToDocumentResult.capture 新增 processedAt 字段）
- `apps/web/lib/repository.ts` | M | +7 行（createCaptureToDocumentFlow 内部在 Document/MindNode 创建后更新 Capture 状态为 archived + 写入 processedAt，返回结果增加 processedAt）
- `apps/web/tests/capture-document-flow.test.ts` | M | +60 行（修正旧断言 status=pending→archived，新增 processedAt 断言，新增 5 个 LC-003 状态一致性测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +50 行（本轮日志）

**变更摘要**:
- **状态规则收紧**: createCaptureToDocumentFlow 现在在 Document + MindNode 创建成功后，立即将 Capture.status 更新为 `archived`，同时写入 `processedAt = new Date()`。不再允许已形成 Document 的 Capture 继续以 pending 状态停留在 Inbox 语义中
- **领域类型扩展**: CaptureToDocumentResult.capture 新增 `processedAt: Date | null` 字段，让调用方可以感知 Capture 的处理时间
- **MindNode.state 决策**: 保持 `drifting` 不变。当前产品在创作阶段无更强语义依据（如是否已 review/是否需合并），强行切 `anchored`/`archived` 可能引入过度承诺。`drifting` 代表"已投影但拓扑待后续确定"，与 Phase 3.1 Local Core 阶段语义一致
- **不新增状态枚举**: 完全复用已有 `EntryStatus`（archived）和 `MindNodeState`（drifting），不引入 CaptureStatus / MindNodeState 新值
- **测试覆盖**: 新增 5 个 LC-003 测试（web tests 总数 372 = 367 LC-002 + 5 LC-003），覆盖：
  - capture status 在 DB 中为 archived
  - capture processedAt 在 DB 中非空
  - document.sourceDockItemId 仍稳定指向 capture
  - mindNode.documentId 仍稳定指向 document
  - 成功后 capture 不再出现在 pending 列表中

**遇到的问题以及解决方式**:
| 问题 | 解决方式 | 是否解决 |
|------|---------|---------|
| 无 | — | — |

**自动验证**:
| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors（1 pre-existing warning 来自 GoldenTopNav.tsx，非本轮引入） |
| `pnpm typecheck` | ✅ PASS（domain + web 均通过） |
| domain tests | ✅ 312 tests / 20 files |
| web tests | ✅ 372 tests / 17 files（含 LC-003 新增 5 tests） |
| `pnpm build:web` | ✅ PASS（Next.js 14.2.28 构建成功，7 routes） |
| `pnpm validate` | ✅ PASS（lint + typecheck + test + terminology 全部通过） |

**手工验证方式**:
1. 调用 `createCaptureToDocumentFlow({ userId: 'test', rawText: '测试文本' })`，返回 `capture.status === 'archived'`
2. 返回结果中 `capture.processedAt` 为 Date 实例（非 null）
3. 查询 `db.table('dockItems').get(captureId)`，`status === 'archived'`，`processedAt` 不为 null
4. 查询 `db.table('entries').get(documentId)`，`sourceDockItemId === captureId`
5. 查询 `db.table('mindNodes').get(mindNodeId)`，`documentId === documentId`
6. 按 userId + `status === 'pending'` 查询 dockItems，不包含此 capture
7. 空字符串 rawText → `'rawText must not be empty'`
8. 空 userId → `'userId must not be empty'`
9. 不同 userId A/B 的 capture/document/mindNode 三层均可交叉查询返回 null

**验收标准**:
- Capture 已形成 Document 后，Capture.status 为 archived（非 pending）
- Capture.processedAt 已写入（非 null）
- Document.sourceDockItemId 稳定指向 Capture
- MindNode.documentId 稳定指向 Document
- MindNode.state 保持 drifting（有意识决策，非遗漏）
- userId 隔离仍然有效
- 空内容拒绝仍然有效
- pnpm validate 和 pnpm build:web 通过

**已知风险或未做事项**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Dexie/repository 层无完整事务保证 | 中 | 当前 createCaptureToDocumentFlow 涉及 3 张表（dockItems/entries/mindNodes），分步写入失败时可能出现部分写入。例如：Document 写入成功但 MindNode 写入失败时，Capture 不会回退。Dexie 支持 transaction() API，但当前 repository 架构未统一封装事务。后续如需强事务一致性，建议将三表写入封装到 `db.transaction('rw', [dockItemsTable, entriesTable, mindNodesTable], async () => {...})` 中 |
| MindNode.state 为 drifting 的长期影响 | 低 | `drifting` 表示节点已存在但拓扑关系未确定。若后续 MindGraph 可视化需区分"有 document 但未连接"和"真正的孤岛"，可引入 `projected` 状态或通过 degreeScore 过滤。当前决策不阻塞后续轮次 |
| createDockItem 的 processedAt 先置 null 再覆盖 | 极低 | createDockItem 内部 created_at 初始 processedAt = null，createCaptureToDocumentFlow 随后 update 为当前时间。两次原子写入无逻辑问题，但额外多一次 DB 写入 |
| 前端 Inbox 列表依赖 pending status | 中 | 若前端 Inbox 视图按 `status === 'pending'` 过滤，LC-003 后已形成 Document 的 Capture 将不再显示在 Inbox 中——这是正确语义（已处理的不应停留在 Inbox）。但前端需确保不会因此出现空 Inbox 导致的 UI 异常 |

**是否可以进入下一轮**: 是

**下一轮风险评估**:
| 风险 | 等级 | 说明 |
|------|------|------|
| MindEdge 自动连接 | 低 | 当前 MindNode 仍为孤立节点，需后续轮次补齐 parent/child 或 semantic 边 |
| 事务一致性 | 中 | 如上述，当前无事务封装，多表写入有部分失败风险 |

---

<!-- ============================================ -->
<!-- 分割线：Phase 3 Round 16 (LC-002) -->
<!-- ============================================ -->

## Phase 3 Round 16 devlog -- LC-002 Capture / Document / MindNode 最小闭环服务化

**时间戳**: 2026-05-05

**任务起止时间**: 01:44 - 01:57 CST

**工时**: 13 分钟

**Notion 卡片**: LC-002 Capture / Document / MindNode 最小闭环服务化

**任务目标**: 补齐 Local Core 主链路前半段 Capture → Document → MindNode 的最小闭环服务化，让一次文本输入通过统一 Local Core service / repository contract 创建 Capture 记录、Document 记录和 MindNode 结构投影。

**改动文件及行数**:
- `packages/domain/src/services/CaptureToDocumentFlow.ts` | A | +50 行（领域类型定义 + 验证函数：CaptureToDocumentInput、CaptureToDocumentResult 类型，validateCaptureInput、extractDocumentTitle 函数）
- `packages/domain/src/services/index.ts` | M | +1 行（导出 CaptureToDocumentFlow）
- `apps/web/lib/repository.ts` | M | +75 行（新增 createCaptureToDocumentFlow API + 4 行类型/函数导入）
- `apps/web/tests/capture-document-flow.test.ts` | A | +234 行（16 个 repository 集成测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +60 行（本轮日志）

**变更摘要**:
- **新增领域服务**: CaptureToDocumentFlow 定义 CaptureToDocumentInput（userId/rawText/topic/sourceType）、CaptureToDocumentResult（capture/document/mindNode 三元组）、validateCaptureInput（空内容拒绝 + userId 非空校验）、extractDocumentTitle（取首行，>60 字符截断）
- **新增 Repository API**: createCaptureToDocumentFlow — 一次调用完成 Capture（dockItem）创建 → Document（entry）创建 → MindNode（'document' 类型，drifting 状态）创建，返回完整三元组结果
- **userId 隔离**: createCaptureToDocumentFlow 内部的 createDockItem、entriesTable.add、upsertMindNode 均继承现有 userId 隔离语义
- **workspaceId**: 当前数据模型无 workspaceId 字段，未硬加。所有 capture/document/mindNode 表仅按 userId 隔离
- **测试覆盖**: 16 个测试用例覆盖完整流程创建、自定义 topic/sourceType、标题提取（多行/长标题截断）、空内容/纯空白/空 userId 拒绝、userId 隔离（capture/document/mindNode 三层）、document ↔ mindNode 关联稳定性

**遇到的问题以及解决方式**:
| 问题 | 解决方式 | 是否解决 |
|------|---------|---------|
| 无 | — | — |

**自动验证**:
| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors（1 pre-existing warning 来自 GoldenTopNav.tsx，非本轮引入） |
| `pnpm typecheck` | ✅ PASS（domain + web 均通过） |
| domain tests | ✅ 312 tests / 20 files |
| web tests | ✅ 367 tests / 17 files（含 LC-002 新增 16 tests） |
| `pnpm build:web` | ✅ PASS（Next.js 14.2.28 构建成功，7 routes） |
| `pnpm validate` | ✅ PASS（lint + typecheck + test + terminology 全部通过） |

**手工验证方式**:
1. 调用 `createCaptureToDocumentFlow({ userId: 'test', rawText: '今日学习笔记' })`，返回的 capture.id > 0，document.id > 0，mindNode.id 非空
2. 返回结果中 `capture.rawText === document.content === '今日学习笔记'`，`document.sourceCaptureId === capture.id`
3. `mindNode.documentId === document.id`，`mindNode.nodeType === 'document'`，`mindNode.state === 'drifting'`
4. `mindNode.label === document.title === '今日学习笔记'`（首行提取）
5. 调用 `getDocumentByCaptureId(userId, captureId)` 返回的 document.id 与结果一致
6. 调用 `getMindNode(userId, mindNodeId)` 返回的 node.documentId 与 document.id 一致
7. 空字符串/纯空白 rawText 抛出 `'rawText must not be empty'`
8. 空 userId 抛出 `'userId must not be empty'`
9. 不同 userId A/B 创建后，`getDocumentByCaptureId(USER_B, captureA.id)` 返回 null
10. 不同 userId 的 mindNode 交叉查询返回 null

**验收标准**:
- Capture → Document → MindNode 三元组一次调用创建成功，各字段值正确
- document.sourceCaptureId 指向正确的 capture
- mindNode.documentId 指向正确的 document
- 空内容/空 userId 被拒绝，抛异常而非静默创建脏数据
- 跨 userId 查询均返回 null/空

**是否可以进入下一轮**: 是

**下一轮风险评估**:
| 风险 | 等级 | 说明 |
|------|------|------|
| Capture 状态为 pending 而非 archived | 低 | 当前 createCaptureToDocumentFlow 创建的 capture status 为 pending（createDockItem 默认值），而非 archived。若后续需要 capture 自动标记为 archived，可在 createCaptureToDocumentFlow 内部追加状态更新 |
| MindNode 无自动边连接 | 低 | 当前仅创建孤立 document 类型 MindNode，未自动创建与父级/同级节点的 MindEdge。需后续轮次补齐图谱拓扑逻辑 |
| workspaceId 缺失 | 低 | 当前数据模型无 workspaceId，仅按 userId 隔离。多工作区场景下无法区分同一用户的不同工作区，未来如引入 workspace 需补齐 |

---

<!-- ============================================ -->
<!-- 分割线：Phase 3 Round 15 (LC-001) -->
<!-- ============================================ -->

## Phase 3 Round 15 devlog -- LC-001 反馈事件骨架落地

**时间戳**: 2026-05-04

**任务起止时间**: 20:05 - 20:22 CST

**工时**: 17 分钟

**Notion 卡片**: LC-001 Local Core 反馈事件骨架落地

**任务目标**: 补齐 Local Core / Intelligence Spine 的最小反馈事件数据骨架，让系统具备记录 recommendation、recommendation_event、user_behavior_event 的本地能力。

**改动文件及行数**:
- `packages/domain/src/services/IntelligenceSpine.ts` | A | +113 行（领域类型定义 + ID 生成函数：Recommendation、RecommendationEvent、UserBehaviorEvent 类型，makeRecommendationId/makeRecommendationEventId/makeUserBehaviorEventId）
- `packages/domain/src/services/index.ts` | M | +1 行（导出 IntelligenceSpine）
- `apps/web/lib/db.ts` | M | +75 行（新增 3 张表 Record 类型 + v17 migration + recommendationsTable/recommendationEventsTable/userBehaviorEventsTable 导出）
- `apps/web/lib/repository.ts` | M | +180 行（新增 7 个 repository API + 3 个 toPersisted 辅助函数 + 类型导入）
- `apps/web/tests/intelligence-spine.test.ts` | A | +470 行（28 个 repository 集成测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +80 行（本轮日志）

**变更摘要**:
- **新增 IndexedDB 表**: recommendations、recommendationEvents、userBehaviorEvents（3 张新表，34 个字段，11 个索引）
- **新增 Repository API**: createRecommendation、listRecommendations、updateRecommendationStatus、recordRecommendationEvent、listRecommendationEvents、recordUserBehaviorEvent、listUserBehaviorEvents（7 个 API，均支持 userId 隔离）
- **领域类型**: RecommendationStatus(6 种)、RecommendationEventType(6 种)、UserBehaviorEventType(12 种)、UserBehaviorTargetType(9 种)
- **测试覆盖**: 28 个测试用例覆盖 CRUD + 过滤 + userId 隔离

**遇到的问题以及解决方式**:
| 问题 | 解决方式 | 是否解决 |
|------|---------|---------|
| typecheck 阶段 `UserBehaviorEventTargetType` 导入名错误（实际导出名为 `UserBehaviorTargetType`） | 修正 import 语句，`UserBehaviorEventTargetType` → `UserBehaviorTargetType` | ✅ |
| lint 阶段 `no-non-null-assertion` 规则触发 5 处 `updated!.status` 等非空断言 | 引入 `unwrap()` 辅助函数，替换全部非空断言为 `unwrap(updated).status` | ✅ |
| fake-indexeddb 同毫秒内两次 `createRecommendation` / `recordRecommendationEvent` / `recordUserBehaviorEvent` 触发 `ConstraintError`（ID 仅含 timestamp 无随机性） | 为 `makeRecommendationId`、`makeRecommendationEventId`、`makeUserBehaviorEventId` 分别添加 `Math.random().toString(36).slice(2,6)` 随机后缀 | ✅ |

**自动验证**:
| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors（1 pre-existing warning 来自 GoldenTopNav.tsx，非本轮引入） |
| `pnpm typecheck` | ✅ PASS（domain + web 均通过） |
| domain tests | ✅ 312 tests / 20 files |
| web tests | ✅ 327 tests / 15 files（含 LC-001 新增 28 tests） |
| `pnpm build:web` | ✅ PASS（Next.js 14.2.28 构建成功，7 routes） |
| `pnpm validate` | ✅ PASS（lint + typecheck + test + terminology 全部通过） |

**手工验证方式**:
1. IndexedDB 打开 AtlaxDB，确认 recommendations、recommendationEvents、userBehaviorEvents 三张表存在，schema 与 db.ts 定义一致
2. 调用 `createRecommendation` 后，`listRecommendations(USER_A)` 返回 1 条记录，`listRecommendations(USER_B)` 返回 0 条（userId 隔离）
3. 创建 2 条 recommendation 后，按 status='generated' 过滤只返回对应 1 条
4. 调用 `updateRecommendationStatus` 将 generated→accepted/shown→rejected/generated→modified/generated→ignored，返回 status 正确
5. `updateRecommendationStatus('non_existent_id', 'accepted')` 返回 null
6. `recordRecommendationEvent` 写入后，`listRecommendationEvents` 按 recommendationId 过滤正确
7. `recordUserBehaviorEvent` 写入后，`listUserBehaviorEvents` 按 eventType/targetType 过滤正确
8. 不同 userId 之间的 recommendation、recommendationEvent、userBehaviorEvent 完全隔离，不互相污染

**验收标准**:
- 三张 IndexedDB 表 schema 与 db.ts version(17) 定义一致
- 所有 repository API 返回的 Persisted 对象 userId 与请求 userId 匹配
- 跨用户查询不返回其他用户数据
- 过滤参数（status/subjectType/recommendationId/eventType/targetType）生效，不匹配的记录不返回
- 对不存在的 recommendation 更新 status 返回 null 而非抛异常

**是否可以进入下一轮**: 是

**下一轮风险评估**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端未适配 Intelligence Spine 数据层 | 低 | 当前为纯后端骨架，前端无接入需求，不影响已有功能 |
| 事件表持续增长 | 低 | recommendationEvents / userBehaviorEvents 无自动清理策略，需后续 TTL 或归档 |
| 更新 recommendation status 未自动同步写入 recommendationEvents | 低 | 当前保持最小实现，状态变更不自动产生事件。如需完整审计链路，可在后续轮次将 `updateRecommendationStatus` 内部同步调用 `recordRecommendationEvent` |

**Review 追记（2026-05-04 21:17 CST）**:
- 测试 `records multiple recommendation events for same recommendation` 中两个事件同毫秒 createdAt，`reverse().sortBy('createdAt')` 排序不确定，偶发断言顺序不匹配。将固定位置断言改为 `.map().sort()` 后比较，不改变测试覆盖范围。

---

<!-- ============================================ -->
<!-- 分割线：Round 14 -->
<!-- ============================================ -->

## Phase 3 Round 14 devlog -- 关系变更链路 TemporalActivity 补齐

**时间戳**: 2026-04-26

**任务起止时间**: 09:15 - 09:45 CST

**工时**: 30 分钟

**任务目标**: 补齐 createEntryRelation/deleteEntryRelation 的 TemporalActivity 双写链路，确保 Time Machine 能拿到关系变更时间事件。

**改动文件及行数**:
- `packages/domain/src/services/KnowledgeStructure.ts` | M | +1 行（TemporalActivityType 新增 relation_deleted）
- `apps/web/lib/repository.ts` | M | +25 行（createEntryRelation 补齐 TemporalActivity；deleteEntryRelation 补齐 KnowledgeEvent + TemporalActivity）
- `apps/web/tests/knowledge-structure.test.ts` | M | +80 行（新增 4 个测试）
- `packages/domain/tests/KnowledgeStructureService.test.ts` | M | +45 行（新增 6 个 computeTemporalKeys 稳定性测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +80 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| non-null assertion lint 错误 | `relationEvent!.targetId` → `unwrap(relationEvent).targetId` |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors |
| `pnpm typecheck` | ✅ PASS |
| domain tests | ✅ 275 tests / 17 files |
| web tests | ✅ 248 tests / 11 files |
| `pnpm build` | ✅ PASS |

**手工验证步骤说明**:
1. 创建 EntryRelation 后，`listTemporalActivities` 返回 type='relation_created' 的记录，且 dayKey/weekKey/monthKey 格式正确
2. 创建 EntryRelation 后，`listKnowledgeEvents` 返回 eventType='relation_created' 的记录，且 targetId 与 TemporalActivity.entityId 一致
3. 删除 EntryRelation 后，`listKnowledgeEvents` 返回 eventType='relation_deleted'，`listTemporalActivities` 返回 type='relation_deleted'
4. 跨用户删除不产生任何事件
5. computeTemporalKeys 对同一日期多次调用返回相同结果

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| deleteEntryRelation 先写事件再删记录 | 低 | 若删除失败事件已写入，但当前逻辑在 userId 校验后才写事件，风险可控 |
| TemporalActivity 增长 | 低 | 每次关系变更产生 1 条 TemporalActivity + 1 条 KnowledgeEvent，后续需清理策略 |

---

<!-- ============================================ -->
<!-- 分割线：Round 13 -->
<!-- ============================================ -->

## Phase 3 Round 13 devlog -- 知识结构化底座（Knowledge Structure Foundation）

**时间戳**: 2026-04-26

**任务起止时间**: 08:10 - 09:15 CST

**工时**: 65 分钟

**任务目标**: 建立 Phase 3 知识结构化底座，包含 Collection、EntryTagRelation、EntryRelation、KnowledgeEvent、TemporalActivity 五张表及结构投影服务，支撑 World Tree / Time Machine / Review Insight 视图。

**改动文件及行数**:
- `packages/domain/src/services/KnowledgeStructure.ts` | A | +180 行（Phase 3 最小类型定义 + ID 生成函数 + computeTemporalKeys）
- `packages/domain/src/services/KnowledgeStructureService.ts` | A | +220 行（结构投影 + 关系校验 + backfill 纯函数）
- `packages/domain/src/services/index.ts` | M | +2 行（导出 KnowledgeStructure + KnowledgeStructureService）
- `packages/domain/tests/KnowledgeStructureService.test.ts` | A | +350 行（20 个 domain 测试）
- `apps/web/lib/db.ts` | M | +120 行（5 张新表 Record 类型 + v13 migration + 表导出）
- `apps/web/lib/repository.ts` | M | +380 行（15 个新 repository 函数 + getStructureProjection + backfillStructureData）
- `apps/web/tests/knowledge-structure.test.ts` | A | +480 行（29 个 repository 集成测试）
- `apps/web/app/seed/page.tsx` | M | +3 行（修复预存 non-null assertion）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +120 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| `Set<string>` 在 TS target < es2015 下不可迭代 | `Array.from(projectNames)` 转换后再遍历 |
| build 时 non-null assertion lint 报错 | `c.id!` → `c.id as string`；测试中 `!` → `unwrap()` |
| `createStoredTag` 返回 `null` 可能 | 测试中用 `unwrap()` 包装 |
| backfill 测试 Entry.tags 包含 suggestion 引擎额外标签 | `toEqual` → `toContain` |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors |
| `pnpm typecheck` | ✅ PASS |
| domain tests | ✅ 269 tests / 17 files |
| web tests | ✅ 244 tests / 11 files |
| `pnpm build` | ✅ PASS |

**手工验证步骤说明**:
1. 旧归档 Entry 能生成真实 EntryTagRelation（backfillStructureData 后 listEntryTagRelations 可查到）
2. 项目字段能映射到结构关系或集合归属，不丢旧数据（backfillStructureData 后 listCollections 含 project 类型集合，原 Entry.project 不变）
3. 手动创建 EntryRelation 后，查询结构投影能看到关系（getStructureProjection 返回 relations 含对应边）
4. 不同用户之间 Collection / TagRelation / EntryRelation / KnowledgeEvent 不串数据（所有 repository 函数 userId 隔离）

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| backfill 全表扫描 | 低 | 当前数据量可接受，后续可增量 backfill |
| 前端未适配结构视图 | 中 | 后端 API 就绪，前端需新增 World Tree / Time Machine 组件 |
| EntryRelation 无双向自动维护 | 低 | parent/child 需手动创建反向关系，后续可加自动推导 |
| KnowledgeEvent 无自动清理 | 低 | 事件表会持续增长，后续需加 TTL 或归档策略 |

---

<!-- ============================================ -->
<!-- 分割线：Round 12 -->
<!-- ============================================ -->

## Phase 3 Round 12 devlog -- Widget/Calendar 主线

**时间戳**: 2026-04-26

**任务起止时间**: 04:50 - 08:10 CST

**工时**: 200 分钟

**任务目标**: 实现 Widget 持久化模型和 Calendar 日期查询能力，为前端提供 Widget/Calendar 主线后端支撑。

**改动文件及行数**:
- `packages/domain/src/services/CalendarWidgetService.ts` | A | +65 行（Calendar 日期查询纯函数）
- `packages/domain/src/services/index.ts` | M | +1 行（导出 CalendarWidgetService）
- `packages/domain/tests/CalendarWidgetService.test.ts` | A | +120 行（8 个 domain 测试）
- `apps/web/lib/db.ts` | M | +55 行（WidgetRecord/PersistedWidget，v12 migration，widgetsTable）
- `apps/web/lib/repository.ts` | M | +95 行（Widget CRUD + Calendar 查询）
- `apps/web/tests/widget-calendar.test.ts` | A | +180 行（12 个 repository 测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +70 行（v10→v11 修正，Round 12 日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors |
| `pnpm typecheck` | ✅ PASS |
| domain tests | ✅ 249 tests / 16 files |
| web tests | ✅ 215 tests / 10 files |
| `pnpm build` | ✅ PASS |

**手工验证步骤说明**:
1. 仅允许一个生效 widget（activateWidget 自动 deactivate 旧 widget）
2. 点击某日期时能返回该日期真实归档内容
3. 空日期返回真实空状态
4. 不同用户之间日期结果不串数据

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端未适配 Widget UI | 中 | 后端 API 就绪，前端需新增 Widget 容器组件 |
| Calendar 查询全表扫描 | 低 | 当前数据量可接受，后续可加索引优化 |
| 仅支持 calendar 类型 | 低 | Phase 3 范围限定，后续可扩展 |

---

<!-- ============================================ -->
<!-- 分割线：Round 11 -->
<!-- ============================================ -->

## Phase 3 Round 11 devlog -- Refill 两层选择逻辑（重走流程 + 单修模块）

**时间戳**: 2026-04-26

**任务起止时间**: 02:04 - 02:35 CST

**工时**: 31 分钟

**任务目标**: 实现取消后的两层 refill/refield 选择逻辑，支持"重走流程"和"单修模块"两种模式。

**改动文件及行数**:
- `packages/domain/src/services/ChatGuidanceService.ts` | M | +55 行（新增 refieldStateFromOption、buildRefieldPatch、refield 方法）
- `packages/domain/tests/ChatGuidanceService.test.ts` | M | +90 行（新增 8 个 refield/buildRefieldPatch 测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +50 行（修正验证标准 #4，新增 Round 11 日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors |
| `pnpm typecheck` | ✅ PASS |
| domain tests | ✅ 241 tests / 15 files |
| web tests | ✅ 203 tests / 9 files |
| `pnpm build` | ✅ PASS |

**手工验证步骤说明**:
1. 取消后展示两层选择 UI：第一层选择"重走流程"或"单修模块"，第二层选择要修改的字段（topic/type/content）
2. 选择"重走流程" → 调用 `service.refill(option)` + `buildRefillPatch(option)` 更新 session
3. 选择"单修模块" → 调用 `service.refield(option)` + `buildRefieldPatch(option)` 更新 session
4. `refield` 不触发 start transition，前端需在用户提交新值后自行推进 step

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端未适配 refield 模式 | 中 | 前端需新增两层选择 UI，旧 refill API 仍可用 |
| refield 后 rawText 未更新 | 低 | rawText 在 submitContent 时重新构建 |

---

<!-- ============================================ -->
<!-- 分割线：Round 10 -->
<!-- ============================================ -->

## Phase 3 Round 10 devlog -- ChatSession Dock 文档映射 + Refill 状态语义修正

**时间戳**: 2026-04-26

**任务起止时间**: 01:52 - 02:04 CST

**工时**: 12 分钟

**任务目标**: 实现 ChatSession 与 DockItem 的映射关系，避免重复确认产生重复文档；修正 Refill 语义并增加持久化 patch。

**改动文件及行数**:
- `packages/domain/src/ports/repository.ts` | M | +15 行（ChatSession/CreateInput/UpdateInput 增加 dockItemId；DockItem 增加 topic）
- `packages/domain/src/types.ts` | M | +2 行（ArchiveInput 增加 topic）
- `packages/domain/src/services/ChatGuidanceService.ts` | M | +25 行（修正 refillStateFromOption 语义，新增 buildRefillPatch）
- `apps/web/lib/db.ts` | M | +12 行（ChatSessionRecord 增加 dockItemId，DockItemRecord 增加 topic，v11 migration）
- `apps/web/lib/repository.ts` | M | +45 行（createDockItem/updateDockItemText 支持 topic，confirmChatSession 含 topic/type，新增 dockItemId）
- `apps/web/tests/chat-session.test.ts` | M | +150 行（新增 11 个 dockItemId/confirmChatSession 测试）
- `packages/domain/tests/ChatGuidanceService.test.ts` | M | +35 行（修正 refill 断言，新增 4 个 buildRefillPatch 测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +90 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| `first` 变量声明后未使用触发 lint | 移除无用变量声明 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors |
| `pnpm typecheck` | ✅ PASS |
| domain tests | ✅ 233 tests / 15 files |
| web tests | ✅ 203 tests / 9 files |
| `pnpm build` | ✅ PASS |

**手工验证步骤说明**:
1. 一个 Chat 历史记录第一次确认生成一个 Dock 文档
2. 选择同一历史记录后重新确认，只更新同一个 Dock 文档，不新增文档
3. 新建聊天才生成新的 Dock 文档
4. DockItem.topic 归档后同步为 Entry.title（topic 优先，否则从 rawText 提取首行）
5. 取消后两层选择：(a) 重走流程 — 选"类型"保留标题并重走类型+内容+确认，选"内容"保留标题+类型并重走内容+确认；(b) 单修模块 — 选哪块只改哪块，其他字段不变

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| confirmChatSession 重复确认时 DockItem 被删 | 低 | 若已绑定 DockItem 不存在，fallback 创建新 DockItem |
| 前端未调用 confirmChatSession | 中 | 前端需迁移到新 API，旧路径仍可用 |
| v11 migration 兼容性 | 低 | 仅新增字段默认 null，不影响现有数据 |

---

<!-- ============================================ -->
<!-- 分割线：Round 9 -->
<!-- ============================================ -->

## Phase 3 Round 9 devlog -- 质量收口复核

**时间戳**: 2026-04-26

**任务起止时间**: 01:02 - 01:52 CST

**工时**: 50 分钟

**任务目标**: 对 Round 8 修复进行质量收口复核，确保 trailing whitespace、reopen 复用逻辑、编辑策略、userId 隔离全部正确。

**改动文件及行数**:
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +30 行（复核日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `git diff --cached --check` | ✅ 无输出 |
| `pnpm lint` | ✅ 0 errors |
| `pnpm typecheck` | ✅ PASS |
| `pnpm test` | ✅ PASS |
| `pnpm build` | ✅ PASS |

**手工验证步骤说明**:
1. 归档记录重新整理后不用重新生成即可看到既有整理结果
2. 编辑正文后才要求重新建议
3. 跨用户 reopen 不可读取缓存

**当前风险及影响范围**:
无新增风险。本轮为纯复核，无业务逻辑变更。

---

<!-- ============================================ -->
<!-- 分割线：Round 8 -->
<!-- ============================================ -->

## Phase 3 Round 8 devlog -- reopenItem 缓存复用策略 + lint 修复

**时间戳**: 2026-04-25

**任务起止时间**: 23:45 - 01:02 CST

**工时**: 77 分钟

**任务目标**: 修复 reopenItem 清空 suggestions + processedAt 的问题，实现归档记录重新打开后复用已有整理结果；同时修复 27 个 lint error。

**改动文件及行数**:
- `apps/web/lib/repository.ts` | M | +25 行（reopenItem 从 Entry 回写 tags/project/actions，保留 suggestions 和 processedAt）
- `apps/web/tests/archive-reopen.test.ts` | M | +60 行（修改旧断言，新增 8 个缓存复用测试）
- `apps/web/tests/browse-seed.test.ts` | M | +8 行（修正 reopen 断言）
- `apps/web/tests/repository.test.ts` | M | +12 行（修正 reopen 断言，修复非空断言）
- `packages/domain/src/ports/repository.ts` | M | +1 行（移除 hasMessages unused local）
- `packages/domain/src/services/EditSavePolicy.ts` | M | +1 行（policy → _policy）
- `packages/domain/tests/ChainLinkService.test.ts` | M | +1 行（移除 buildChainLink unused import）
- `packages/domain/tests/ChatGuidanceService.test.ts` | M | +2 行（移除 buildGuidancePrompt、beforeEach unused imports）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +75 行（本轮日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| 测试中 `entry`/`item` 变量声明后未使用触发 lint | 移除无用变量声明 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm lint` | ✅ 0 errors |
| `pnpm typecheck` | ✅ PASS |
| domain tests | ✅ 229 tests / 15 files |
| web tests | ✅ 192 tests / 9 files |
| `pnpm build` | ✅ PASS |

**手工验证步骤说明**:
1. 归档记录 → 重新整理/重新入库 → 已有建议/标签/项目/动作可复用（suggestions.length > 0, userTags === entry.tags, selectedProject === entry.project, selectedActions === entry.actions）
2. 编辑正文后 → suggestions 清空、status 回退 pending、processedAt 置 null（EditSavePolicy 生效）
3. 跨用户 reopen → 返回 null，不能读取缓存
4. 无 Entry 场景 reopen → processedAt 为 null

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| suggestItem 对 reopened 状态仍可重生成建议 | 无 | state-machine 允许 reopened→suggested，行为不变 |
| archived Entry 不存在时的 fallback | 低 | 仅改状态、清 processedAt，与旧行为一致 |
| Entry 回写可能与 DockItem 现有值不同 | 无 | 这是预期行为——Entry 是归档时的快照 |

---

<!-- ============================================ -->
<!-- 分割线：Round 7 -->
<!-- ============================================ -->

## Phase 3 Round 7 devlog -- createDockItem chain link 安全校验修复

**时间戳**: 2026-04-25

**任务起止时间**: 22:55 - 23:45 CST

**工时**: 50 分钟

**任务目标**: 修复 createDockItem 绕过 chain link 校验的安全漏洞，确保 sourceId/parentId 的合法性验证覆盖创建路径。

**改动文件及行数**:
- `apps/web/lib/repository.ts` | M | +18 行（createDockItem 接入 validateChainLinkWithContext 校验）
- `packages/domain/tests/ChainLinkService.test.ts` | M | +25 行（新增 3 个 currentItemId=-1 场景测试）
- `apps/web/tests/repository.test.ts` | M | +70 行（新增 7 个 createDockItem chain link 校验测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +60 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 229 tests / 15 files |
| `pnpm --dir apps/web typecheck` | ✅ PASS |
| `pnpm --dir apps/web test -- --run` | ✅ 185 tests / 9 files |
| `git diff --cached --check` | ⚠️ trailing whitespace（来自前端 page.tsx，非本轮修改） |

**手工验证步骤说明**:
1. sourceId 指向同用户存在的 item → 允许创建
2. parentId 指向同用户存在的 item → 允许创建
3. sourceId 指向其他用户的 item → 抛出错误，不创建
4. parentId 指向其他用户的 item → 抛出错误，不创建
5. sourceId 指向不存在的 ID → 抛出错误，不创建
6. parentId 指向不存在的 ID → 抛出错误，不创建
7. 不传 options（无 chain links）→ 正常创建
8. 显式传 sourceId: null, parentId: null → 正常创建

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 handleDerive 需处理 createDockItem 异常 | 低 | 当前前端在 try/finally 中调用，异常会被捕获，但用户不会看到错误提示 |
| currentItemId = -1 假设 | 极低 | Dexie 自增 ID 从 1 开始，-1 不可能冲突。如未来改为 UUID，需重新设计 |

---

<!-- ============================================ -->
<!-- 分割线：Round 6 -->
<!-- ============================================ -->

## Phase 3 Round 6 devlog -- 链式结构读取能力 + 编辑器命令 domain 支撑

**时间戳**: 2026-04-25

**任务起止时间**: 17:42 - 22:55 CST

**工时**: 313 分钟

**任务目标**: 补齐 Chain provenance 异步查询能力，修复 EditorCommandTransform 测试期望值，增加跨用户隔离测试。

**改动文件及行数**:
- `packages/domain/src/services/index.ts` | M | +1 行（修复 EditCommandTransform → EditorCommandTransform 导入路径）
- `packages/domain/tests/ChainLinkService.test.ts` | M | +55 行（新增 6 个 buildProvenanceAsync 测试）
- `packages/domain/tests/EditorCommandTransform.test.ts` | M | +4 行（修复 2 个空选区测试期望值）
- `apps/web/tests/repository.test.ts` | M | +95 行（新增 8 个 getChainProvenance Dexie 测试 + 7 个跨用户隔离测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +55 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 226 tests / 15 files |
| `pnpm --dir apps/web typecheck` | ✅ PASS |
| `pnpm --dir apps/web test -- --run` | ✅ 178 tests / 9 files |
| `git diff --cached --check` | ✅ PASS |

**手工验证步骤说明**:
1. reorganize 关系 provenance 正确显示（含多行 rawText 取首行）
2. continue_edit 关系 provenance 正确显示
3. derive 关系 provenance 正确显示
4. root item provenance 返回 null source/parent
5. 不存在 item 返回 null
6. 跨用户查询返回 null
7. 不暴露其他用户 source title
8. 长标题截断到 60 字符

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 chain link UI 接入 | 低 | 后端 API 已就绪，前端需实现链路展示 |
| 前端编辑器 command 接入 | 低 | port 类型已稳定，前端需对接 |

---

<!-- ============================================ -->
<!-- 分割线：Round 5 -->
<!-- ============================================ -->

## Phase 3 Round 5 devlog -- updateChainLinks 验证修复

**时间戳**: 2026-04-24

**任务起止时间**: 15:12 - 17:42 CST

**工时**: 150 分钟

**任务目标**: 修复 updateChainLinks 未验证 sourceId/parentId 存在性和 ownership 的问题。

**改动文件及行数**:
- `packages/domain/src/services/ChainLinkService.ts` | M | +35 行（新增 validateChainLinkWithContext (async)）
- `packages/domain/tests/ChainLinkService.test.ts` | M | +70 行（新增 9 个 validateChainLinkWithContext 测试）
- `apps/web/lib/repository.ts` | M | +8 行（updateChainLinks 接入验证）
- `apps/web/tests/repository.test.ts` | M | +65 行（新增 7 个 chain link 验证测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +50 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 186 tests / 14 files |
| `pnpm --dir apps/web typecheck` | ✅ PASS |
| `pnpm --dir apps/web test -- --run` | ✅ 163 tests / 9 files |
| `git diff --cached --check` | ⚠️ trailing whitespace（来自前端 page.tsx，非本轮修改） |

**手工验证步骤说明**:
1. sourceId 指向其他用户 item → 返回 null，原 item 不变
2. parentId 指向其他用户 item → 返回 null
3. sourceId/parentId 指向不存在 id → 返回 null
4. sourceId/self → 返回 null
5. parentId/self → 返回 null
6. 合法同用户 source/parent → 可保存

**当前风险及影响范围**:
无新增风险。

---

<!-- ============================================ -->
<!-- 分割线：Round 4 -->
<!-- ============================================ -->

## Phase 3 Round 4 devlog -- 链式结构/编辑策略/编辑器接口收口

**时间戳**: 2026-04-24

**任务起止时间**: 14:28 - 15:12 CST

**工时**: 44 分钟

**任务目标**: 收口链式结构服务、编辑保存策略（archived entry 编辑）、编辑器能力接口测试。

**改动文件及行数**:
- `packages/domain/src/services/ChainLinkService.ts` | A | +150 行（新增 - 链式结构服务）
- `packages/domain/src/services/index.ts` | M | +1 行（导出 ChainLinkService）
- `packages/domain/src/services/EditSavePolicy.ts` | M | +30 行（新增 ArchivedEntryEditPolicy）
- `packages/domain/tests/ChainLinkService.test.ts` | A | +280 行（新增 - 21 个链式结构测试）
- `packages/domain/tests/EditorCapabilityPort.test.ts` | A | +90 行（新增 - 14 个编辑器能力测试）
- `packages/domain/tests/EditSavePolicy.test.ts` | M | +35 行（新增 4 个 archived entry 测试）
- `apps/web/tests/repository.test.ts` | M | +55 行（新增 6 个 chain link Dexie 测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +55 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 177 tests / 14 files |
| `pnpm --dir apps/web typecheck` | ✅ PASS |
| `pnpm --dir apps/web test -- --run` | ✅ 156 tests / 9 files |

**手工验证步骤说明**:
1. ChainLinkService 21 个测试全部通过（reorganize/continue_edit/derive 关系、清除链路、跨用户阻止、suggest/archive 周期保留）
2. EditorCapabilityPort 14 个测试全部通过（command/tool 列表、唯一性、可用性检查、常量一致性）
3. EditSavePolicy 19 个测试全部通过（含 archived entry 编辑 4 个新测试）
4. repository chain link 6 个 Dexie 测试全部通过

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 chain link UI 接入 | 低 | 后端 API 已就绪，前端需实现链路展示 |
| 前端编辑器 command 接入 | 低 | port 类型已稳定，前端需对接 |

---

<!-- ============================================ -->
<!-- 分割线：Round 3 -->
<!-- ============================================ -->

## Phase 3 Round 3 devlog -- 数据正确性修复

**时间戳**: 2026-04-24

**任务起止时间**: 18:16 - 19:30 CST

**工时**: 74 分钟

**任务目标**: 修复 archiveItem 写入 selectedProject/selectedActions 的问题，Events userId 隔离，ChatSession 真实 Dexie 层测试。

**改动文件及行数**:
- `packages/domain/src/types.ts` | M | +4 行（ArchiveInput 新增 selectedProject/selectedActions）
- `packages/domain/src/archive-service.ts` | M | +12 行（selectedProject/selectedActions 优先级逻辑）
- `packages/domain/tests/archive-service.test.ts` | M | +60 行（新增 4 个优先级测试 + 适配新字段）
- `apps/web/lib/repository.ts` | M | +5 行（archiveItem 传入 selectedProject/selectedActions）
- `apps/web/lib/events.ts` | M | +3 行（PersistedEvent.userId 改为必填）
- `apps/web/tests/chat-session.test.ts` | A | +420 行（新增 - 35 个真实 Dexie ChatSession 测试）
- `apps/web/tests/events.test.ts` | M | +45 行（新增 5 个 userId 隔离测试）
- `apps/web/tests/repository.test.ts` | M | +70 行（新增 8 个 selectedProject/selectedActions archive 测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +90 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 138 tests / 12 files |
| `pnpm --dir apps/web lint` | ✅ PASS |
| `pnpm --dir apps/web typecheck` | ✅ PASS |
| `pnpm --dir apps/web test -- --run` | ✅ 150 tests / 9 files |

**手工验证步骤说明**:
1. 设置 selectedProject 后 archive，entry.project 正确
2. 设置 selectedActions 后 archive，entry.actions 正确
3. selectedProject 优先级高于 suggestion 推断
4. selectedActions 优先级高于 suggestion 推断
5. 无选择时 fallback 到 suggestion
6. listArchivedEntriesByProject 能查到 selectedProject 设置的 entry
7. re-archive 保留 selectedProject/selectedActions
8. user A 无法看到 user B 的 events
9. 清除 user A log 不影响 user B
10. 不同 userId 的 ChatSession 完全隔离

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 page.tsx recordEvent 调用 | ⚠️ 需前端确认 | events.ts API 签名已固定为需要 userId，前端调用需传 userId |
| 前端 ChatSession 接入 | ⏳ 待前端 | 后端 API 已就绪，前端需替换内存实现 |
| events.ts localStorage 隔离 | ✅ 已有 | key 格式 `atlax_event_log_{userId}` 已按 userId 隔离 |

---

<!-- ============================================ -->
<!-- 分割线：Round 2 Review -->
<!-- ============================================ -->

## Phase 3 Round 2 Review devlog -- Chat Session 模型补齐

**时间戳**: 2026-04-24

**任务起止时间**: 15:54 - 18:16 CST

**工时**: 142 分钟

**任务目标**: 补齐 ChatSession 模型的 title/pinned 字段，修复 lint 错误，增加 repository 测试。

**改动文件及行数**:
- `packages/domain/src/ports/repository.ts` | M | +6 行（添加 title/pinned 字段）
- `apps/web/lib/db.ts` | M | +8 行（添加 title/pinned 字段和 migration）
- `apps/web/lib/repository.ts` | M | +25 行（删除未使用 import，添加 pin/unpin 方法，更新排序逻辑）
- `packages/domain/tests/ChatSession.test.ts` | A | +220 行（新增 - ChatSession 测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +45 行（本轮日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --dir apps/web lint` | ✅ PASS |
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 134 tests passed / 12 files |

**手工验证步骤说明**:
1. 空 session 不创建
2. 不同 userId 互相不可见
3. updatedAt 更新后排序变化
4. pinned session 排在非 pinned 前面
5. update confirmed 不新建重复 session

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 pinned UI 未实现 | 低 | 后端 API 已就绪，前端需在历史列表中展示置顶功能 |

---

<!-- ============================================ -->
<!-- 分割线：Round 2 -->
<!-- ============================================ -->

## Phase 3 Round 2 devlog -- Chat Session 持久化

**时间戳**: 2026-04-24

**任务起止时间**: 15:18 - 15:54 CST

**工时**: 36 分钟

**任务目标**: 设计并实现 ChatSession 数据结构的持久化存储，包含 IndexedDB 表、Migration 和 Repository 方法。

**改动文件及行数**:
- `packages/domain/src/ports/repository.ts` | M | +45 行（添加 ChatSession 类型定义和接口）
- `apps/web/lib/db.ts` | M | +35 行（添加 chatSessions 表和 v9 migration）
- `apps/web/lib/repository.ts` | M | +85 行（添加 ChatSession repository 方法）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +50 行（本轮开发日志）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 115 tests passed / 11 files |

**手工验证步骤说明**:
1. 创建有效 user message 的 session 能成功持久化
2. assistant welcome 消息不创建空 session
3. 空 session 不创建
4. 按 userId 隔离查询单个会话
5. 列出用户所有会话按 updatedAt 倒序
6. 更新会话不创建重复记录
7. 跨 userId 操作被阻止

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 ChatSession 接入 | 中 | 后端 API 已就绪，前端需替换内存实现 |
| 空会话过滤规则 | 低 | 当前规则可能过于严格，需根据实际使用调整 |

---

<!-- ============================================ -->
<!-- 分割线：Round 1 Review -->
<!-- ============================================ -->

## Phase 3 Round 1 Review devlog -- 测试补齐与 sanitize 接入

**时间戳**: 2026-04-24

**任务起止时间**: 12:40 - 14:28 CST

**工时**: 108 分钟

**任务目标**: 补齐 Round 1 的测试覆盖，接入 sanitizeSuggestionLabel，确认 repository 导出。

**改动文件及行数**:
- `packages/domain/src/suggestion-engine.ts` | M | +8 行（接入 sanitizeSuggestionLabel）
- `packages/domain/tests/sanitizeSuggestionLabel.test.ts` | A | +85 行（新增 - sanitize 测试）
- `packages/domain/tests/ChatGuidanceService.test.ts` | A | +150 行（新增 - ChatGuidanceService 测试）
- `packages/domain/tests/EditSavePolicy.test.ts` | A | +130 行（新增 - EditSavePolicy 测试）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | M | +40 行（更新验证结果）

**遇到的问题以及解决方式**:
无。

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 115 tests passed / 11 files |
| `pnpm --dir apps/web typecheck` | ⚠️ 受阻 | 前端代码 `TS1128` 错误，非 backend 责任 |

**手工验证步骤说明**:
1. 所有生成的建议 label 经过 sanitize 处理，去除换行、制表符、重复空白
2. ChatGuidanceService 完整流程测试通过（topic -> type -> content -> confirmation -> confirm）
3. ChatGuidanceService 取消流程测试通过
4. EditSavePolicy 文本变化时 reset suggestions/status/processedAt
5. EditSavePolicy 文本不变时保留当前 status

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 typecheck 阻塞 | 中 | 需要 frontend agent 修复 `uniqueProjects` 作用域问题 |

---

<!-- ============================================ -->
<!-- 分割线：Round 1 -->
<!-- ============================================ -->

## Phase 3 Round 1 devlog -- Chat 引导状态机/数据能力/链式结构/编辑策略/编辑器接口

**时间戳**: 2026-04-24

**任务起止时间**: 11:45 - 12:40 CST

**工时**: 55 分钟

**任务目标**: Phase 3 后端底座建设，包含 #6 Chat 引导状态机、#9 数据能力补齐、#7 链式结构最小落地、#8 编辑保存路径收敛、#11 编辑器能力接口预留。

**改动文件及行数**:
- `packages/domain/src/services/ChatGuidanceService.ts` | A | +180 行（新增 - Chat 引导状态机）
- `packages/domain/src/services/EditSavePolicy.ts` | A | +60 行（新增 - 编辑保存策略）
- `packages/domain/src/services/index.ts` | M | +2 行（添加新服务导出）
- `packages/domain/src/ports/editor.ts` | M | +85 行（扩展编辑器能力接口）
- `packages/domain/src/ports/repository.ts` | M | +25 行（添加新字段和方法）
- `packages/domain/src/types.ts` | M | +15 行（添加 sanitizeSuggestionLabel）
- `packages/domain/tests/DockItemService.test.ts` | M | +8 行（添加新字段到测试对象）
- `packages/domain/tests/state-machine.test.ts` | M | +3 行（修复导入路径）
- `apps/web/lib/db.ts` | M | +20 行（添加新字段和 migration）
- `apps/web/lib/repository.ts` | M | +35 行（添加新字段和 repository 方法）
- `docs/engineering/dev_log/Phase3/phase3-devlog-backend.md` | A | +120 行（本轮开发日志）

**遇到的问题以及解决方式**:
| 问题 | 解决方式 |
|------|---------|
| `canTransition` 名称冲突（services 和 state-machine 都导出） | 将 ChatGuidanceService 中的函数重命名为 `canTransitionGuidance` |
| 测试文件 DockItem 类型不完整 | 更新 DockItemService.test.ts 添加新字段 |
| state-machine.test.ts 导入路径问题 | 改为直接从 `../src/state-machine` 导入 |

**自动验证结果**:
| 检查项 | 结果 |
|--------|------|
| `pnpm --filter @atlax/domain typecheck` | ✅ PASS |
| `pnpm --filter @atlax/domain test -- --run` | ✅ 115 tests passed / 11 files |
| `pnpm --dir apps/web typecheck` | ⚠️ 受阻 | 存在前端代码错误（`TS1128: Declaration or statement expected`），来自 frontend agent 的 staged 修改，非本轮 backend 代码问题 |

**手工验证步骤说明**:
1. ChatGuidanceService 状态机步骤正确：idle -> awaiting_topic -> awaiting_type -> awaiting_content -> awaiting_confirmation -> confirmed / cancelled
2. 支持操作：start, submit_topic, submit_type, submit_content, confirm, cancel, refill, reset
3. 固定句式正确返回
4. 取消流程返回情绪价值 dismissal message
5. 重填选项支持按"标题/类型/内容"单独重填
6. DockItem 新增 selectedActions/selectedProject/sourceId/parentId 字段，向后兼容
7. 编辑保存后 suggestions 重置，status 回退到 pending
8. 编辑器能力接口包含 Obsidian-like 命令和工具类型

**当前风险及影响范围**:
| 风险 | 等级 | 说明 |
|------|------|------|
| 前端 typecheck 阻塞 | 中 | 需要 frontend agent 修复 `uniqueProjects` 作用域问题 |
| 链式结构查询 API 未实现 | 低 | 当前仅添加字段和 repository 方法，前端查询 UI 未实现 |
| 项目关联 UI 预览 | 低 | 前端显示 "项目关联能力正在接入中"，后端能力已就绪 |

---

## 关联文档

| 文档 | 路径 |
|------|------|
| 架构说明书 | `docs/product/ARCHITECTURE.md` |
| 技术规格 | `docs/product/TECH_SPEC.md` |
| Phase 3 Feature & Bugs | `docs/engineering/dev_log/Phase3/pre-phase3-demo_feature_and_bugs.md` |
| 架构调整日志 | `docs/engineering/dev_log/Phase3/pre-phase3-architecture_rebuild.md` |
