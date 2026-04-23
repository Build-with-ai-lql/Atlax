# Atlax MindDock

Atlax MindDock 是一款本地优先、结构化优先、输入自由的知识工作流产品。

## Vision

连接灵感输入、知识沉淀、结构管理与 AI 协作，让个人知识系统真正可持续生长。

---

## 仓库结构导览

```
atlax-mind-dock/
├── apps/                    # 应用层
│   └── web/                 # Next.js Web 应用
│       ├── app/             # App Router 页面
│       │   ├── capture/     # Capture 输入入口
│       │   ├── dock/        # Dock 待整理视图
│       │   ├── seed/        # 数据初始化页
│       │   └── workspace/   # Classic 主工作台
│       │       └── _components/
│       │           ├── AuthGate.tsx      # 认证守卫
│       │           ├── ChatPanel.tsx    # Chat 交互面板
│       │           ├── DetailPanel.tsx   # 详情面板
│       │           ├── DockListItem.tsx  # Dock 列表项
│       │           ├── ExpandedEditor.tsx # 展开编辑器
│       │           ├── MainPanel.tsx     # 主面板
│       │           ├── ModeSwitch.tsx    # 模式切换
│       │           ├── QuickInputBar.tsx # 快速输入栏
│       │           ├── Sidebar.tsx       # 侧边栏
│       │           └── TagEditor.tsx     # 标签编辑器
│       └── lib/             # 应用库文件
│           ├── auth.ts      # 认证服务
│           ├── db.ts        # IndexedDB 数据库配置
│           ├── events.ts    # 事件系统
│           ├── repository.ts # 仓储实现（Secondary Adapter）
│           ├── suggestion-engine.ts # 建议引擎封装
│           └── types.ts     # 应用类型
│
├── packages/                # 包层（Domain + Shared）
│   └── domain/              # 领域核心（DDD-lite）
│       └── src/
│           ├── archive-service.ts  # 归档服务
│           ├── selectors.ts        # 查询选择器
│           ├── state-machine.ts    # 状态机
│           ├── suggestion-engine.ts # 建议引擎
│           ├── tag-service.ts      # 标签服务
│           └── types.ts             # 领域类型定义
│
├── docs/                    # 文档
│   ├── product/            # 产品文档
│   │   ├── ARCHITECTURE.md  # 架构说明书
│   │   └── TECH_SPEC.md    # 技术规格
│   └── engineering/        # 工程文档
│       ├── architecture-migration-plan.md # 架构迁移计划
│       └── dev_log/        # 开发日志
│
├── scripts/                # 脚本
├── tests/                  # 测试
└── .github/               # GitHub 配置
```

---

## 前后端边界说明

### 架构视角

```
┌─────────────────────────────────────────────────────────────┐
│                    前端应用层 (apps/web)                     │
│   页面路由 / UI 组件 / 状态管理 / 用户交互处理               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼  调用领域接口
┌─────────────────────────────────────────────────────────────┐
│                     领域层 (packages/domain)                 │
│   状态机 / 规则引擎 / 标签策略 / 归档服务 / 查询选择器       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼  实现仓储接口
┌─────────────────────────────────────────────────────────────┐
│                   存储层 (apps/web/lib)                     │
│   IndexedDB (Dexie) / Repository 实现 / 事件系统            │
└─────────────────────────────────────────────────────────────┘
```

### 关键边界点

| 边界 | 前端职责 | 领域/后端职责 |
|------|---------|--------------|
| **Capture** | 接收用户输入，调用 `createDockItem` | 领域处理状态初始化 |
| **Dock** | 展示列表，调用 `listDockItems` | 领域返回标准化数据 |
| **Suggest** | 调用 `suggestItem`，展示建议 | 领域执行规则引擎 |
| **Tag** | 调用 `updateItemTags`，展示标签 | 领域管理标签策略 |
| **Archive** | 调用 `archiveItem`，跳转 Browse | 领域执行归档流程 |
| **Browse** | 调用 `listArchivedEntries`，展示 Entry | 领域提供查询选择器 |

### 数据流边界

```
用户操作 → UI Component → lib/* Service → packages/domain → lib/db (IndexedDB)
                                     ↑
                              领域接口定义
                              (packages/domain)
```

### 前端不直接做的事

- ❌ 不直接操作 IndexedDB（通过 Repository 接口）
- ❌ 不实现业务规则（规则在 packages/domain）
- ❌ 不管理跨模块状态协调（通过 Application Services）

### 后端/领域不直接做的事

- ❌ 不感知 UI 状态（React 组件状态）
- ❌ 不处理 HTTP 请求（Next.js API Routes 将来在此）
- ❌ 不直接渲染 UI（前端职责）

---

## Branch Strategy

- main：稳定主分支
- develop：日常开发集成分支
- feature/*：功能开发
- fix/*：缺陷修复
- refactor/*：重构优化
- docs/*：文档更新
