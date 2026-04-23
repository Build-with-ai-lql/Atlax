# Phase 3.0 - 架构决策与迁移计划

| 开发日志信息 | |
|-------------|---------|
| 阶段 | Phase 3 |
| 轮次 | Phase 3.0 |
| 日期 | 2026-04-23 |
| 负责人 | Architecture Agent |
| 状态 | 已完成 |

---

## 1. 本轮目标

1. **明确架构风格**：DDD-lite + 模块化单体 + Ports/Adapters
2. **产出迁移计划**：多轮执行清单，每轮有范围、风险、回滚点
3. **更新项目导览**：让小白能一眼看懂前后端边界

---

## 2. 架构决策

### 2.1 架构风格选型

| 维度 | 决策 | 理由 |
|------|------|------|
| 整体风格 | **DDD-lite + 模块化单体** | Phase 2 已验证单体可行性，DDD-lite 提供领域边界但不引入完整 DDD 复杂度 |
| 扩展模式 | **Ports/Adapters（六边形架构）** | 隔离核心业务与外部依赖，确保后续可切换存储或接入后端服务 |
| 模块组织 | **按领域能力划分包** | Capture、Dock、Suggest、Tag、Archive 等作为独立模块 |

### 2.2 分层架构

```
前端应用层 (apps/web)
         │
         ▼
适配器层 (Adapters)
  Primary: UI Handlers / API Controllers
  Secondary: Repository Impl / External Services
         │
         ▼
端口层 (Ports)
  Input: Application Services / Use Cases
  Output: Repository Interfaces / Service Interfaces
         │
         ▼
领域层 (packages/domain)
  Entities / Value Objects / Domain Services
  State Machine / Suggestion Engine / Tag Policy
```

### 2.3 关键架构原则

1. **依赖单向**：外层依赖内层，内层不感知外层实现
2. **端口隔离**：领域层只定义接口，适配器负责实现
3. **模块自治**：每个领域模块可独立测试和演进
4. **存储可替换**：通过 Repository Pattern 支持后续切换存储方案

---

## 3. 迁移计划

### 3.1 多轮执行清单

| 轮次 | 内容 | 范围 | 风险 | 回滚点 |
|------|------|------|------|-------|
| Round 1 | 仓储接口提取 | 提取 DockItemRepository、EntryRepository、TagRepository 接口 | 低 | git 回滚 |
| Round 2 | 应用服务封装 | 提取 DockItemService、EntryService | 中 | 直接调用 Repository |
| Round 3 | Suggestion 策略提取 | 抽象 SuggestionResetPolicy | 低 | 策略逻辑内联回原方法 |
| Round 4 | ImmersiveEditor 接口预留 | 定义 EditorBackendPort 接口 | 低 | 删除接口定义 |
| Round 5 | File/Project 服务接口预留 | 定义 FileService、ProjectService 接口 | 低 | 删除接口定义 |
| Round 6 | Markdown 渲染接口预留 | 定义 MarkdownRenderPort 接口 | 低 | 删除接口定义 |

### 3.2 轮次依赖

```
Round 1 (接口提取)
    │
    ▼
Round 2 (应用服务封装)  ──► Round 3 (策略提取)
    │
    ▼
Round 4-6 (后端接口预留，可并行)
```

---

## 4. 文档更新

| 文件 | 更新内容 |
|------|---------|
| `README.md` | 新增仓库结构导览、前后端边界说明 |
| `docs/product/ARCHITECTURE.md` | 新增架构决策摘要（§0）、Ports/Adapters 模块映射（§5） |
| `docs/product/TECH_SPEC.md` | 新增架构决策章节（§0）、关联文档章节（§13） |
| `docs/engineering/architecture-migration-plan.md` | 新建，多轮迁移执行清单 |

---

## 5. 约束检查

- [x] 上一轮代码已提交并推送至远端
- [x] 本轮更改仅涉及文档文件
- [x] 未修改 apps/**、packages/**、scripts/** 代码
- [x] 所有更改放入 git 暂存区，可通过 git diff 查看

---

## 6. 下一步

等待 Phase 3.1 开始执行 Round 1：仓储接口提取

---

## 7. 关联文档

| 文档 | 路径 |
|------|------|
| 架构说明书 | `docs/product/ARCHITECTURE.md` |
| 技术规格 | `docs/product/TECH_SPEC.md` |
| 迁移计划 | `docs/engineering/architecture-migration-plan.md` |
| 项目导览 | `README.md` |
