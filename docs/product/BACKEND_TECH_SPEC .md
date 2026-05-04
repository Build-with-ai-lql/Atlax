
# 后端技术规格说明书（Backend Technical Specification）

## 1. 文档基础信息
- 文档名称：BACKEND_TECH_SPEC.md
- 项目名称：Atlax
- 系统名称：MindDock Backend
- 模块名称：Knowledge Core / Graph Engine / Review Engine / Auth
- 版本：v0.9 Draft
- 状态：评审中
- 关联文档：PRD.md / ARCHITECTURE.md / STRUCTURE_DESIGN.md / STRUCTURE_ALGORITHEM_DESIGN.md / FRONTEND_TECH_SPEC_FINAL.md

## 2. 项目概述
### 2.1 项目背景
Atlax 是本地优先、结构优先的知识工作流产品，后端负责同步、账号、结构算法、Review、导入、订阅能力。
### 2.2 建设目标
- 支撑 Home / Mind / Dock 三主模块 + Editor 工作页 + Workspace Tabs
- 支撑自动落库、图谱关系、周报推荐
- 支撑工作区会话恢复与标签持久化
- 支持未来多端同步与协作
### 2.3 本期范围
账号体系、知识库 API、图谱 API、导入 API、Review API、订阅预留
### 2.4 非本期范围
复杂协作编辑、公开分享社区、第三方开放平台
### 2.5 成功指标
- API 成功率 > 99.9%
- P95 RT < 300ms
- 图谱查询 < 500ms
- 导入任务成功率 > 98%

## 3. 业务域模型设计
### 核心聚合根
- User
- Workspace
- WorkspaceSession（工作区会话）
- WorkspaceOpenTab（工作区打开标签）
- RecentDocument（最近文档记录）
- Document
- MindNode
- MindEdge
- Capture
- ImportJob
- ReviewReport
- Subscription
### 领域事件
- DocumentCreated
- CaptureReceived
- NodeLinked
- ReviewGenerated
- ImportCompleted

## 4. 系统架构设计
```text
API Gateway
 ├─ Auth Service
 ├─ Knowledge Service
 ├─ Graph Service
 ├─ Review Service
 ├─ Import Service
 ├─ Workspace Service（工作区会话与标签管理）
 └─ Billing Service(预留)
```
Shared:
MySQL / Redis / MQ / Object Storage / Elasticsearch(可选)
```
- MVP 可单体模块化
- 成长期拆分微服务

## 5. 技术栈说明
- MyBatis Plus / JOOQ
- MySQL 8
- Redis
- RocketMQ / RabbitMQ
- MinIO / S3
- Nacos
- Logback + ELK
- Prometheus + Grafana

## 6. 工程结构设计
```text
backend/
 ├─ atlax-api
 ├─ atlax-auth
 ├─ atlax-knowledge
 ├─ atlax-graph
 ├─ atlax-review
 ├─ atlax-import
 ├─ atlax-workspace（工作区会话与标签管理）
 ├─ atlax-common
 └─ atlax-job
```

## 7. 分层详细设计
- Controller：REST 接口、鉴权、参数校验
- Application：编排事务、DTO 转换
- Domain：实体、规则、事件
- Repository：数据访问
- Infrastructure：Redis/MQ/OSS/第三方

## 8. 接口设计（API）
统一前缀：`/api/v1`
返回结构：
```json
{ "code":0, "message":"ok", "traceId":"xxx", "data":{} }
```
错误码：
- 0 成功
- 4001 参数错误
- 4010 未登录
- 4030 无权限
- 4040 资源不存在
- 4090 幂等冲突
- 5000 系统异常

## 9. 接口详细设计（核心）
### 9.1 登录
- POST /auth/login
### 9.2 获取知识库文档
- GET /documents?pageNo=1&pageSize=20
### 9.3 保存文档
- POST /documents
### 9.4 获取图谱
- GET /mind/graph?workspaceId=
### 9.5 Capture 输入
- POST /captures
### 9.6 Review 周报
- GET /reviews/latest
### 9.7 导入任务
- POST /imports

### 9.8 Workspace Session / Tabs（工作区会话与标签管理）

#### 9.8.1 获取当前工作区会话
- GET /workspace/session

响应：
```json
{
  "sessionId": "sess_xxx",
  "workspaceId": "ws_xxx",
  "tabs": [
    {
      "tabId": "tab_xxx",
      "type": "editor",
      "title": "文档标题",
      "documentId": "doc_xxx",
      "path": "/editor/doc_xxx",
      "isPinned": false,
      "isActive": true,
      "openedAt": "2026-04-27T10:00:00Z"
    }
  ],
  "activeTabId": "tab_xxx",
  "lastSyncAt": "2026-04-27T10:30:00Z"
}
```

#### 9.8.2 获取最近打开的文档
- GET /workspace/recent?limit=20

响应：
```json
{
  "documents": [
    {
      "documentId": "doc_xxx",
      "title": "文档标题",
      "lastOpenedAt": "2026-04-27T10:00:00Z",
      "openCount": 5
    }
  ]
}
```

#### 9.8.3 打开标签
- POST /workspace/tab/open

请求：
```json
{
  "type": "editor",
  "documentId": "doc_xxx",
  "title": "文档标题",
  "path": "/editor/doc_xxx"
}
```

响应：
```json
{
  "tabId": "tab_xxx",
  "success": true
}
```

#### 9.8.4 关闭标签
- POST /workspace/tab/close

请求：
```json
{
  "tabId": "tab_xxx"
}
```

#### 9.8.5 激活标签
- POST /workspace/tab/activate

请求：
```json
{
  "tabId": "tab_xxx"
}
```

#### 9.8.6 置顶/取消置顶标签
- POST /workspace/tab/pin

请求：
```json
{
  "tabId": "tab_xxx",
  "isPinned": true
}
```

#### 9.8.7 恢复上次标签状态
- POST /workspace/tab/restore

响应：
```json
{
  "restoredTabs": [...],
  "activeTabId": "tab_xxx",
  "restoredAt": "2026-04-27T10:00:00Z"
}
```

用途说明：
- 恢复用户上次打开的标签页
- 记录最近打开文档，用于 Home 页面展示
- 支持多文档编辑状态恢复
- 支持多设备间标签同步（后续阶段）

幂等：Header `Idempotency-Key`

## 10. 数据库设计
数据库：MySQL（核心交易数据）+ Redis（缓存）+ 对象存储（附件）
核心表：
- users
- workspaces
- workspace_sessions（工作区会话表）
- workspace_open_tabs（工作区打开标签表）
- recent_documents（最近打开文档记录表）
- documents
- document_blocks
- captures
- mind_nodes
- mind_edges
- clusters
- import_jobs
- review_reports
- subscriptions
- audit_logs

## 11. 表详细设计（节选）
### documents
- id bigint PK
- workspace_id bigint
- title varchar(255)
- content_md longtext
- content_json json
- status tinyint
- created_at / updated_at

索引：
- idx_workspace_updated
- idx_workspace_status

### workspace_sessions（工作区会话表）

```sql
CREATE TABLE workspace_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  session_token TEXT NOT NULL,
  device_info TEXT,
  active_tab_id TEXT,
  last_activity_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  INDEX idx_user_workspace (user_id, workspace_id),
  INDEX idx_session_token (session_token)
);
```

用途：
- 记录用户工作区会话状态
- 存储当前激活标签
- 支持多设备会话管理
- 用于标签状态恢复

### workspace_open_tabs（工作区打开标签表）

```sql
CREATE TABLE workspace_open_tabs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  tab_type TEXT NOT NULL,
  title TEXT,
  path TEXT NOT NULL,
  document_id TEXT,
  is_pinned INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  opened_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  INDEX idx_session_id (session_id),
  INDEX idx_user_workspace (user_id, workspace_id),
  INDEX idx_document_id (document_id)
);
```

tab_type 可选值：
```text
home, mind, dock, editor, document, node, project, review, settings
```

用途：
- 存储用户打开的标签页信息
- 支持标签持久化与恢复
- 记录标签顺序、置顶状态、激活状态

### recent_documents（最近打开文档记录表）

```sql
CREATE TABLE recent_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  open_count INTEGER DEFAULT 1,
  last_opened_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  UNIQUE KEY uk_user_doc (user_id, workspace_id, document_id),
  INDEX idx_user_workspace (user_id, workspace_id),
  INDEX idx_last_opened (last_opened_at DESC)
);
```

用途：
- 记录用户最近打开的文档
- 用于 Home 页面展示最近文档列表
- 支持快速访问常用文档
- 统计文档使用频率

### mind_nodes
- id
- document_id
- node_type
- x,y,z
- score

## 12. 缓存设计
Key 规范：
- atlax:user:{id}
- atlax:doc:{id}
- atlax:graph:{workspaceId}
- atlax:review:{workspaceId}:latest
- atlax:workspace:session:{userId}:{workspaceId}
- atlax:workspace:tabs:{sessionId}
- atlax:workspace:recent:{userId}:{workspaceId}
TTL：
- 用户信息 30m
- 图谱快照 10m
- 周报 24h
- 工作区会话 1h
- 标签状态 30m
- 最近文档 15m

## 13. 消息队列设计
Topic：
- doc-changed
- graph-rebuild
- review-generate
- import-process
- billing-events

## 14. 任务调度设计
- 每日凌晨图谱健康扫描
- 每周一生成 Review
- 每小时导入重试任务
- 每10分钟清理过期缓存

## 15. 权限与安全设计
- JWT + Refresh Token
- RBAC：Owner/Admin/Member
- BCrypt 密码
- 接口签名（预留）
- 审计日志全量记录敏感操作

## 16. 事务设计
- 单服务本地事务 @Transactional
- 跨服务最终一致性（MQ + Outbox）
- 导入任务补偿重试

## 17. 性能设计
- QPS 目标：500（MVP）
- P95 RT < 300ms
- 批量写入 blocks 使用 batch insert
- 图谱查询 Redis + DB 双层缓存
- 异步生成 Review / 导入解析

## 18. 高可用设计
- 服务多实例部署
- Sentinel 限流熔断
- Redis 主从
- MySQL 主从
- 健康检查自动摘除异常节点

## 19. 日志设计
字段：
time level traceId userId uri cost code msg
保留：
- info 30天
- error 180天

## 20. 监控告警设计
- JVM Heap > 85%
- CPU > 80%
- API 错误率 > 2%
- MQ 堆积 > 1000
- 慢 SQL > 1s

## 21. 配置管理设计
dev/test/prod 三环境隔离
Nacos 配置中心
敏感配置 KMS/加密存储

## 22. 部署发布设计
- GitHub Actions / Jenkins
- Docker 镜像
- Kubernetes 部署
- 灰度 10% -> 50% -> 100%
- 一键回滚上一版本

## 23. 测试设计
- 单元测试覆盖率 > 70%
- 集成测试：登录/文档/图谱/导入
- 压测：500QPS 持续30分钟
- 容灾演练：Redis 宕机降级

## 24. 运维设计
- 标准启停脚本
- 故障 SOP
- 数据修复脚本审批制
- 紧急开关：关闭推荐/导入/Review

## 25. 开发规范
- Git Flow：main/develop/feature/hotfix
- Commit：Conventional Commits
- PR 必须 Code Review

## 26. 风险清单
- 图谱规模增长导致查询慢
- 导入来源规则频繁变化
- 推荐结果不稳定
- 多端同步冲突
- 订阅支付外部依赖

## 27. 附录
### ER 摘要
User 1:N Workspace
Workspace 1:N Document
Document 1:N Block
Workspace 1:N MindNode
MindNode N:N MindEdge
