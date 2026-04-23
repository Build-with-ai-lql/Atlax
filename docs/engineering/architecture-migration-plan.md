# Atlax 架构迁移计划

| 文档信息 | |
|---------|---------|
| 产品名称 | Atlax |
| 文档类型 | 架构迁移执行计划 |
| 当前阶段 | Pre-Phase3-Architecture |
| 最后更新 | 2026-04-23 |

---

## 1. 背景与目标

### 1.1 架构现状

Phase 2 交付了可上线的单体应用：
- 前端：`apps/web` 包含 UI 组件、状态管理、Repository 实现
- 领域层：`packages/domain` 包含核心业务逻辑（状态机、规则引擎、标签策略）
- 存储：IndexedDB/Dexie 在 `lib/db.ts` 中直接实现

### 1.2 目标架构

**DDD-lite + 模块化单体 + Ports/Adapters**

- 显式化领域边界，模块内聚
- 通过端口接口隔离核心业务与外部依赖
- 支持后续独立部署或切换存储方案

### 1.3 迁移原则

1. **渐进式迁移**：不影响现有功能，按模块分批迁移
2. **接口先行**：新模块先定义接口，再实现，最后迁移调用方
3. **可回滚**：每轮迁移后功能等效，支持回滚
4. **零停机**：前端/后端分离过程中保持系统可用

---

## 2. 多轮迁移执行清单

### 2.1 第一轮：仓储接口提取（Round 1）

**目标**：将 `packages/domain/src/types.ts` 中的仓储接口显式化，隔离 Domain 与 Repository 实现

| 属性 | 说明 |
|------|------|
| **范围** | 提取 `DockItemRepository`、`EntryRepository`、`TagRepository` 接口到 `packages/domain/src/ports/` |
| **风险** | 低 - 仅提取接口，不改变现有实现 |
| **回滚点** | 如有问题，可直接回退本轮更改到 git commit |

**涉及文件**：
- 新增：`packages/domain/src/ports/repository.ts`（仓储接口定义）
- 修改：`packages/domain/src/types.ts`（移除具体实现类型定义，保留领域类型）
- 修改：`apps/web/lib/repository.ts`（实现接口）

**验收标准**：
- [ ] Domain 层不直接依赖 `apps/web/lib/db.ts`
- [ ] 所有仓储操作通过接口进行
- [ ] 现有测试全部通过

---

### 2.2 第二轮：应用服务封装（Round 2）

**目标**：将 `apps/web/lib/repository.ts` 中的跨模块调用封装为 Application Services

| 属性 | 说明 |
|------|------|
| **范围** | 提取 `DockItemService`、`EntryService`，封装跨模块协作逻辑 |
| **风险** | 中 - 涉及状态重置等业务逻辑，需要测试覆盖 |
| **回滚点** | 回滚后直接调用 Repository，但需要手动同步状态 |

**涉及文件**：
- 新增：`packages/domain/src/services/` 目录
- 新增：`DockItemService.ts`、`EntryService.ts`
- 修改：`apps/web/lib/repository.ts`（简化为适配器，调用 Application Services）

**验收标准**：
- [ ] 业务逻辑集中在 Application Services 层
- [ ] UI 层不直接调用多个 Repository 方法
- [ ] `updateDockItemText` 的状态重置逻辑在 Service 层统一处理

---

### 2.3 第三轮：Suggestion 策略提取（Round 3）

**目标**：将 `SuggestionResetPolicy` 从 `updateDockItemText` 中抽象出来

| 属性 | 说明 |
|------|------|
| **范围** | 提取 `SuggestionResetPolicy` 策略类 |
| **风险** | 低 - 仅重构，不改变行为 |
| **回滚点** | 回滚后策略逻辑内联回原方法 |

**涉及文件**：
- 新增：`packages/domain/src/policies/SuggestionResetPolicy.ts`
- 修改：`apps/web/lib/repository.ts`（注入策略）

**验收标准**：
- [ ] 策略可单独测试
- [ ] 策略可替换（如未来支持不同的重置行为）
- [ ] 现有测试全部通过

---

### 2.4 第四轮：ImmersiveEditor 后端接口预留（Round 4）

**目标**：为沉浸式编辑器预留后端接口，支持后续全屏编辑能力

| 属性 | 说明 |
|------|------|
| **范围** | 定义 `EditorBackendPort` 接口，预留 `ImmersiveEditorBackend` |
| **风险** | 低 - 仅定义接口，不实现 |
| **回滚点** | 删除接口定义即可回滚 |

**涉及文件**：
- 新增：`packages/domain/src/ports/editor.ts`（编辑器端口定义）
- 修改：`packages/domain/src/index.ts`（导出新端口）

**验收标准**：
- [ ] 前端 `Maximize` 按钮的回调可通过接口注入实现
- [ ] 接口定义覆盖：内容保存、内容加载、渲染模式切换

---

### 2.5 第五轮：File/Project 服务接口预留（Round 5）

**目标**：为文件操作和项目管理预留服务接口

| 属性 | 说明 |
|------|------|
| **范围** | 定义 `FileService`、`ProjectService` 接口 |
| **风险** | 低 - 仅定义接口，预留扩展点 |
| **回滚点** | 删除接口定义即可回滚 |

**涉及文件**：
- 新增：`packages/domain/src/ports/file.ts`
- 新增：`packages/domain/src/ports/project.ts`

**验收标准**：
- [ ] 前端 `DropdownItem` 的文件操作回调可通过接口注入
- [ ] 接口支持后续接入本地文件系统或云存储

---

### 2.6 第六轮：Markdown 渲染服务接口预留（Round 6）

**目标**：为 Markdown 渲染预留服务端接口

| 属性 | 说明 |
|------|------|
| **范围** | 定义 `MarkdownRenderPort` 接口 |
| **风险** | 低 - 仅定义接口 |
| **回滚点** | 删除接口定义即可回滚 |

**涉及文件**：
- 新增：`packages/domain/src/ports/rendering.ts`

**验收标准**：
- [ ] 支持纯前端渲染和混合渲染模式切换
- [ ] 接口可对接不同渲染后端

---

## 3. 轮次依赖关系

```text
Round 1 (接口提取)
    │
    ▼
Round 2 (应用服务封装)  ──► Round 3 (策略提取)
    │
    ▼
Round 4-6 (后端接口预留，可并行)
```

---

## 4. 风险与缓解

| 轮次 | 风险 | 缓解措施 |
|------|------|---------|
| Round 1 | 接口设计不合理导致后续重构 | 接口设计先评审再实现 |
| Round 2 | 业务逻辑迁移遗漏 | 充分测试覆盖，特别是边缘情况 |
| Round 3 | 策略可替换性设计过度 | 按需设计，不做过度抽象 |
| Round 4-6 | 接口预留过多导致死代码 | 仅预留当前功能需要的最小接口集 |

---

## 5. 后续阶段规划

| 阶段 | 内容 | 前提 |
|------|------|------|
| Phase 4 | 导入、搜索增强、关系增强、扩展输入 | Round 1-3 完成 |
| Phase 5 | 多端同步、协作、AI provider | Ports/Adapters 体系稳定 |

---

## 6. 附录：迁移检查清单

每轮迁移完成后，需确认：

- [ ] 代码编译通过
- [ ] 单元测试通过
- [ ] 集成测试通过（如果存在）
- [ ] 功能等效于迁移前
- [ ] 文档已更新
- [ ] 本轮更改已放入 git 暂存区

---

## 7. 结构整理完成状态

### 7.1 已完成轮次

| 轮次 | 内容 | 状态 | 完成日期 |
|------|------|------|---------|
| Round 1 | 仓储接口提取 | ✅ 已完成 | 2026-04-23 |
| Round 2 | 应用服务封装 | ✅ 已完成 | 2026-04-23 |
| Round 3 | Suggestion 策略提取 | ✅ 已完成 | 2026-04-23 |
| Round A | 后端预留端口补齐 | ✅ 已完成 | 2026-04-23 |
| Round B | 文档与结构收敛 | ✅ 已完成 | 2026-04-23 |
| Round C | 结构清理收口 | ✅ 已完成 | 2026-04-23 |

### 7.2 结构整理成果

| 整理项 | 结果 |
|--------|------|
| `packages/domain/src/ports/` | 5 个端口接口文件 |
| `packages/domain/src/services/` | 2 个应用服务文件 |
| `packages/domain/src/policies/` | 1 个策略文件 |
| `packages/domain/src/reference/` | Week2+ 后端参考代码 |
| `docs/` | 仅保留文档文件，无业务代码 |
| `docs/design_refs/` | 本地保留，不提交 Git |
| Phase2 日志 | 收敛为统一文件 `phase2-dev-log.md` |

---

## 8. 进入 Phase3 条件

### 8.1 必须满足

- [x] Round 1-3 架构迁移完成
- [x] Round A 后端端口预留完成
- [x] 门禁脚本 `scripts/run-web-gate.sh` 可执行且通过
- [x] 文档结构清晰，docs 仅保留文档
- [x] README.md 目录说明与实际结构一致

### 8.2 建议满足

- [ ] 补充 packages/domain 的单元测试覆盖率
- [ ] 补充 ports 接口的使用文档

### 8.3 Phase3 启动标志

当以下条件全部满足时，可认为 Pre-Phase3-Architecture 阶段完成，进入 Phase3 功能迭代：

1. `bash scripts/run-web-gate.sh` 输出 `GATE: PASSED`
2. 所有架构迁移轮次（Round 1-3, A-C）日志已记录
3. 无未解决的 lint/typecheck 错误

---

**当前状态**：Pre-Phase3-Architecture 已完成，可进入 Phase3 功能迭代。
