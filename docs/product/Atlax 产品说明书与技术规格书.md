## 1. 文档信息

- 产品名称：Atlax
- 文档版本：v0.2 Draft
- 文档类型：产品说明书 / 立项文档 / 技术规格草案 / 接口文档草案
- 文档目标：用于 Demo 立项、架构共识、开发排期、GitHub 仓库初始化与后续 README/PRD/技术实现拆分
- 当前阶段：Demo / MVP 规划阶段

---

## 2. 产品一句话定义

**Atlax 是一款本地优先、结构化优先、输入自由的知识工作流产品。**

它不是一个“功能更全的笔记软件”，而是一个让用户**不必先学会管理，才能开始积累知识**的系统。  
它的核心不在于“支持多少输入方式”，而在于：**不管用户怎么输入，系统都能先接住内容，再帮助用户完成第一轮归类、结构化和后续整理。**

---

## 3. 项目背景

当前主流知识工具的典型矛盾：

### 3.1 Obsidian 的强项与短板
Obsidian 的优势在于：
- 本地化
- Markdown 可控
- 链式管理
- 双向链接
- 长期知识沉淀友好
- 插件生态强

但它也有明显问题：
- 上手门槛高
- 对普通用户不够友好
- 初始搭建成本高
- 数据库与工作流能力对非技术用户不直观
- 需要用户主动维护体系

### 3.2 Notion 的强项与短板
Notion 的优势在于：
- all-in-one
- 数据库视图强
- 页面与项目组织能力强
- 适合工作流、项目流和协作流
- 上手直观

但它也有明显问题：
- 本地资产感较弱
- Markdown 体验弱于文件式工具
- 链式知识管理不够自然
- 数据锁定感更强
- 与 Obsidian 难以真正打通

### 3.3 真实用户困境
很多用户并不是缺工具，而是被工具之间的边界折磨：

- 用 Obsidian 的用户羡慕 Notion 的数据库与 all-in-one
- 用 Notion 的用户羡慕 Obsidian 的本地化、Markdown 和链式管理
- 很多人两者都在用，但始终无法优雅打通
- 记录容易，后续整理困难
- 输入自由，但维护成本高
- 工具越多，知识越碎

---

## 4. 核心需求定义

本产品只围绕三个核心需求展开，不追求做“全功能水桶”。

### 4.1 需求一：减少知识系统的取舍成本
用户不想一直在以下维度做选择：

- 本地化 vs all-in-one
- Markdown vs 结构化数据库
- 链接网络 vs 易上手
- 长期资产 vs 工作流便利

**Atlax 的目标**：尽可能减少这些取舍，让用户无感切换。

### 4.2 需求二：减少跨工具流转的搬运成本
用户当前的问题不是不能记，而是记完以后还要：

- 从 Notion 搬到 Obsidian
- 自己整理 Markdown
- 自己建立链接
- 自己决定 tag / 属性 / 类型
- 自己决定归档位置

**Atlax 的目标**：让非结构化输入进入系统后，先由系统完成第一轮初步归类与结构化。

### 4.3 需求三：减少长期维护知识系统的持续成本
很多用户知道该怎么搭建系统，但没有精力长期维护：

- tag 越来越乱
- 文件夹越来越杂
- 项目越来越多
- 链接越来越噪
- 结果是知识库越做越难用

**Atlax 的目标**：降低用户长期维护知识系统的持续精力成本。

---

## 5. 产品定位

### 5.1 产品定位
Atlax 是一款：

- 本地优先的个人知识工作流工具
- 面向 Obsidian / Notion 中间地带用户的结构化笔记系统
- 支持多输入方式的知识捕捉与归类平台
- 以 Markdown 为长期资产层、以 Database 为组织层、以 Agent/规则引擎为辅助整理层的产品

Atlax 不是：

- 另一个 Obsidian
- 另一个 Notion
- 另一个 GoodNotes
- 单纯的语音笔记软件
- 单纯的 Markdown 编辑器
- 单纯的 AI 摘要工具

Atlax 是：

- 用户灵感的统一入口
- 用户知识的结构化整理中枢
- 用户长期资产的本地归档层
- 用户从输入到产出的中间工作流系统

---

## 6. 目标用户画像

### 6.1 核心用户
- 同时使用 Obsidian 和 Notion 的重度知识工作者
- 喜欢 Markdown 但放弃过 Obsidian 的普通用户
- 喜欢 Notion 数据库能力但担心资产锁定的用户
- 程序员、产品经理、设计师、创作者、学生、自媒体、研究型用户

### 6.2 用户特征
- 有持续记录习惯
- 有一定信息密度
- 知道整理重要，但没时间维护
- 对工具体验敏感
- 希望知识能够长期复用
- 希望系统比自己更先接住内容

### 6.3 典型使用场景
- 会议记录
- 日常灵感捕捉
- 项目资料整理
- 阅读笔记
- 任务拆解
- 个人知识库搭建
- Notion / Obsidian 内容迁移中转

---

## 7. 产品核心原则

1. **输入自由，不强迫分类**
2. **系统先接住，再做整理**
3. **每条内容既是文档，也是数据库条目**
4. **Markdown 是长期资产层**
5. **Database 是组织层**
6. **自动化只做建议，不做强制接管**
7. **第一版优先稳定，不优先炫技**
8. **可导出、可迁移、不锁死**
9. **本地优先，云端能力后置**
10. **先做个人闭环，再谈协作**

---

## 8. 产品形态

### 8.1 多端职责分工

#### iPad / 平板端（后续）
定位：创作端 / 捕捉端

核心职责：
- 手写输入（后续）
- 语音输入
- 快速文本输入
- 模板化记录
- 快速查看与轻编辑

#### 桌面端 / Web 端（优先）
定位：整理端 / 结构化管理端

核心职责：
- 数据库视图
- 属性编辑
- 批量归档
- 关系管理
- Markdown 深度编辑
- 导入导出管理
- 项目与主题整理

#### 手机端（后续）
定位：检索端 / 消费端 / 轻 capture 端

核心职责：
- 搜索
- 阅读
- 快速记录
- 回顾
- 轻量属性修改

### 8.2 MVP 阶段的建议端策略
为了降低成本，MVP 不建议三端齐发。

#### 推荐优先级
1. 桌面端 / Web Demo
2. 语音输入 + 文本输入
3. Inbox + Database 视图
4. Markdown 存储与导出
5. 后续再接手写与多端同步

---

## 9. 产品功能总览

### 9.1 功能模块总表

- Capture（输入）
- Inbox（待整理）
- Organize（整理）
- Database（数据库视图）
- Editor（编辑器）
- Links（链接建议）
- Export / Import（导入导出）
- Search（搜索）
- Review（回顾）
- Settings（设置）
- AI / Agent（后续增强）

---

## 10. 功能模块详细设计

## 10.1 Capture 模块

### 目标
让用户在最短时间内把内容丢进系统，而不是先学会系统。

### 支持的输入方式
#### MVP
- 文本输入
- 语音输入

#### 后续
- 手写输入
- 网页剪藏
- 拖拽文件/PDF
- 图片 OCR 导入
- 邮件转入
- API 写入

### 入口形式
- 全局快捷键弹窗
- 新建按钮
- 浮动 capture 面板
- 快速语音记录按钮
- 移动端一键录入

### 字段
- 标题（可选）
- 原始输入内容
- 输入类型
- 创建时间
- 录入设备
- 临时上下文（可选：项目/场景）

### Capture 设计原则
- 可以无标题保存
- 可以不选分类保存
- 必须先进 Inbox
- 系统自动补建议
- 用户可稍后再整理

---

## 10.2 Inbox 模块

### 目标
承接所有未经整理的内容，作为“系统先接住”的落点。

### 功能
- 待处理列表
- 自动类型建议
- tag 建议
- project 建议
- topic 建议
- 摘要预览
- 一键接受建议
- 一键归档
- 手动修改后归档
- 批量归档

### Inbox 关键交互
- 左侧待处理列表
- 中间内容预览
- 右侧建议面板
- 操作区：接受 / 调整 / 忽略 / 删除

### 状态定义
- unprocessed
- suggested
- reviewed
- archived

---

## 10.3 Organize 模块

### 目标
让用户在不增加认知负担的前提下，把内容纳入长期可管理系统。

### 组织对象
- Note
- Project
- Topic
- Task
- Daily Entry
- Source

### 组织动作
- 分类
- 绑定项目
- 增加 topic
- 提取任务
- 设置状态
- 添加关系
- 存入视图

### 组织原则
- 自动建议优先
- 人工确认收口
- 结构少而稳
- 不做过度自由 schema

---

## 10.4 Database 模块

### 目标
让笔记不只是文档，而是可筛选、可排序、可视图化的对象。

### 支持对象
- Notes
- Projects
- Tasks
- Topics

### MVP 支持视图
- Table View
- List View
- Board View（可选，若时间允许）

### 后续视图
- Timeline
- Calendar
- Graph-lite
- Review Queue

### 基础字段
#### Note
- id
- title
- type
- status
- tags
- topics
- project_id
- created_at
- updated_at
- source_type
- source_device
- markdown_path
- summary
- suggested_links

#### Project
- id
- name
- description
- status
- tags
- created_at
- updated_at

#### Task
- id
- title
- status
- due_at
- source_note_id
- project_id
- priority

#### Topic
- id
- name
- description
- related_note_count

### MVP 不做
- formula
- rollup
- complex automations
- permission system
- multi-user collaboration

---

## 10.5 Editor 模块

### 目标
让用户能够在结构化系统中自然编辑 Markdown 内容。

### 能力
- Markdown 正文编辑
- Frontmatter 可视化编辑
- 标题自动生成
- 待办项语法支持
- 引用块
- 代码块
- 内链插入
- 自动保存
- 版本快照（后续）

### 界面结构
- 左侧导航
- 中间正文
- 右侧属性面板
- 底部建议栏（链接 / 标签 / 项目）

### 原则
- 不做过重编辑器
- 优先稳定与清晰
- 和数据库视图统一数据模型

---

## 10.6 智能链接模块

### 目标
减少用户手动建立链接的成本，但不制造大量噪声。

### MVP 方案
- 基于 tags / topics / title similarity 给出建议
- 基于内容关键词给出相关记录
- 只提供“建议”，不自动写入

### 后续增强
- embedding 相似度
- 自动 cluster
- topic graph
- 双向链接自动候选

### 风险控制
- 限制单次建议数量
- 允许一键忽略
- 不强制生成
- 不默认污染正文

---

## 10.7 Import / Export 模块

### 目标
保证 Atlax 不是封闭系统。

### Export
- 导出 Markdown 文件
- 导出 Markdown + frontmatter
- 导出 JSON
- 导出 CSV（数据库）
- 导出 ZIP 包（资源+内容）

### Import
- 导入 Markdown 目录
- 导入单篇 Markdown
- 导入 CSV
- 导入 Notion 导出包（后续）
- 导入 Obsidian Vault（后续）

### Notion -> Atlax 路线
MVP 不做“一键全量智能部署”，只做：
- 页面导入
- 属性基础映射
- block 到 Markdown 的基础转换
- 媒体资源收集

### Atlax -> Obsidian 路线
- 导出标准 Markdown
- frontmatter 保留 metadata
- links 尽量转为 wiki-link 或 markdown link

---

## 10.8 Search 模块

### 目标
让用户以后真的找得回来。

### MVP
- 全文搜索
- 标题搜索
- 标签搜索
- 项目筛选
- 类型筛选

### 后续
- 语义搜索
- 时间范围搜索
- OCR 搜索
- 音频转写搜索
- 搜索结果聚类

---

## 10.9 Review 模块

### 目标
减少知识沉没，让内容被重新激活。

### MVP
- 最近新增
- 最近未整理
- 最近修改
- 某 topic 下最近记录

### 后续
- 每周回顾
- 待复习条目
- 冷门但高价值内容提醒
- 关联笔记推荐回顾

---

## 10.10 AI / Agent 模块

### 核心定位
AI 不是产品本体，而是辅助降低整理成本的增强层。

### MVP 建议
默认不开启复杂 Agent，只做：
- 规则引擎
- 分类建议
- 简单摘要
- task 提取

### 后续订阅版能力
- 长文本摘要
- 项目归档建议
- 自动 task 抽取
- meeting -> minutes
- reading -> highlights summary
- relationship suggestion
- weekly review generation

### 成本控制
- 只在用户主动触发时调用
- 默认本地规则优先
- 大模型调用异步化
- 结果缓存
- 支持模型切换
- 支持用户自带 key（后续）

---

## 11. 信息架构

## 11.1 顶级导航
- Inbox
- Notes
- Projects
- Tasks
- Topics
- Search
- Review
- Settings

## 11.2 典型数据流
### 路径 A：文本 / 语音输入
Capture -> Inbox -> 建议分类 -> 用户确认 -> Database -> 后续编辑 -> 导出/回顾

### 路径 B：导入内容
Import -> 转换 -> Inbox -> 建议修正 -> Archive

### 路径 C：检索复用
Search -> 打开记录 -> 编辑 / 链接 / 归档到项目

---

## 12. UI / UX 设计说明

## 12.1 整体设计风格
- 极简
- 中性专业
- 少装饰
- 内容优先
- 系统感强于玩具感
- 不模仿 Notion 或 Obsidian 外观

## 12.2 UI 关键词
- calm
- structured
- local-first
- focus
- clarity
- flow

## 12.3 主要页面

### A. 首页 / Dashboard
模块：
- 今日待整理
- 最近记录
- 快速输入
- 当前项目
- 今日建议

### B. Inbox 页面
区域：
- 条目列表
- 内容预览
- 建议面板
- 操作按钮

### C. 数据库页面
区域：
- 视图切换栏
- 过滤器
- 数据表格
- 批量编辑工具栏

### D. 编辑器页面
区域：
- 标题区
- 属性面板
- Markdown 编辑区
- 建议链接区

### E. 设置页
区域：
- 存储位置
- 导出格式
- AI 设置
- 同步设置
- 快捷键设置
- 数据备份

---

## 13. 技术选型

## 13.1 技术路线总判断
如果目标是尽快做出 Demo，同时保留后续多端扩展能力，推荐采用：

### 方案一：Web 优先 Demo（推荐做首个 Demo）
适合快速验证产品逻辑。

#### 前端
- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand 或 Jotai
- Tiptap / CodeMirror（Markdown 编辑）
- TanStack Table（数据库表格）
- React Hook Form
- Zod

#### 后端
- Node.js
- Next.js API Routes / NestJS（若后端分离）
- Prisma
- PostgreSQL / SQLite（Demo 可先 SQLite）
- Drizzle 亦可选

#### 本地/桌面扩展
- Tauri（后续）
- Electron（不优先）

### 方案二：Apple 生态优先
适合后续 iPad/手写路线。

#### 客户端
- SwiftUI
- PencilKit（后续手写）
- Speech framework
- Core Data / SQLite
- CloudKit（后续）
- Markdown 渲染库

### 13.2 当前建议
**先做 Web Demo + 本地导出能力。**

原因：
- 速度快
- UI 验证方便
- 数据库视图开发成熟
- GitHub 演示友好
- 便于后续部署与内测
- 更适合先验证“系统代整理”这个命题

---

## 14. 框架选型建议

## 14.1 前端框架
推荐：**Next.js + React + TypeScript**

原因：
- 生态成熟
- 组件丰富
- SSR/SSG 可选
- API 路由灵活
- 便于后续官网与应用统一
- GitHub 展示友好

## 14.2 UI 框架
推荐：
- Tailwind CSS
- shadcn/ui
- Radix UI

原因：
- 开发快
- 风格现代
- 易于控制细节
- 适合做专业型工具界面

## 14.3 编辑器
推荐：
- Tiptap（富文本增强场景）
- CodeMirror 6（Markdown 更强）
- Monaco（若更偏工程编辑体验）

当前建议：
**MVP 选择 CodeMirror 6。**

## 14.4 数据表格
推荐：
- TanStack Table
- AG Grid（太重，MVP 不推荐）

## 14.5 状态管理
推荐：
- Zustand（轻）
- React Query / TanStack Query（数据缓存）
- Jotai（如组件状态复杂）

---

## 15. 存储模型与数据架构

## 15.1 数据分层
- 结构化元数据：数据库
- 正文：Markdown
- 资源：本地文件/对象存储
- 索引：全文索引/向量索引（后续）

## 15.2 推荐存储结构
### 数据库
- SQLite（本地 Demo）
- PostgreSQL（后续云端）

### 文件目录
```text
/workspace
  /notes
    note-001.md
    note-002.md
  /assets
    image-001.png
    audio-001.m4a
  metadata.db
```
### Markdown 样例
``` Markdown
---
id: note_001
title: 项目周会记录
type: meeting
status: inbox_reviewed
tags: [支付, 性能]
topics: [支付系统]
project_id: proj_01
created_at: 2026-04-20T10:00:00+09:00
updated_at: 2026-04-20T10:20:00+09:00
source_type: voice
source_device: ipad
---

# 项目周会记录

今天讨论了支付接口延迟问题……
```
## 16. 技术规格

## 16.1 非功能性指标

### 性能

- 首屏加载 < 2s（Demo 环境）
- 单次保存 < 300ms
- 5000 条记录以内检索可接受
- 表格 1000 行分页稳定显示

### 可用性

- 自动保存
- 崩溃恢复
- 导出不丢数据
- 编辑器输入不卡顿

### 可扩展性

- 输入类型可扩展
- 数据模型支持新对象加入
- AI 服务可替换
- 存储可从 SQLite 平滑迁移到 PostgreSQL

### 安全性

- 本地文件优先
- 敏感内容不默认上传
- AI 调用前显式提示
- 关键设置本地保存

## 17. 接口文档草案

## 17.1 API 设计原则

- REST 优先
- 语义清晰
- 前后端可分离
- 支持后续桌面/移动端复用
- 响应结构统一

``` JSON
统一响应格式：

{  
  "code": 0,  
  "message": "ok",  
  "data": {}  
}

错误响应：

{  
  "code": 4001,  
  "message": "invalid params",  
  "data": null  
}
```


---

## 17.2 Notes 接口

### 1. 创建笔记

`POST /api/notes`

请求：
``` JSON
{  
  "title": "项目灵感",  
  "content": "想做一个系统代整理的知识工具",  
  "sourceType": "text",  
  "projectId": null  
}

响应：

{  
  "code": 0,  
  "message": "ok",  
  "data": {  
    "id": "note_001",  
    "status": "inbox"  
  }  
}
```
### 2. 获取笔记详情

`GET /api/notes/:id`

### 3. 更新笔记

`PATCH /api/notes/:id`

### 4. 删除笔记

`DELETE /api/notes/:id`

### 5. 获取笔记列表

`GET /api/notes?status=inbox&type=meeting&page=1&pageSize=20`

---
## 17.3 Inbox 接口

### 1. 获取待整理列表

`GET /api/inbox`

### 2. 获取建议

`POST /api/inbox/:id/suggestions`

请求：
``` JSON
{
  "forceRefresh": false
}
```
响应：
``` JSON
{
  "code": 0,
  "message": "ok",
  "data": {
    "suggestedType": "meeting",
    "suggestedTags": ["支付", "性能"],
    "suggestedProjectId": "proj_01",
    "suggestedLinks": ["note_010", "note_021"]
  }
}
```

### 3. 接受建议并归档

`POST /api/inbox/:id/archive`

请求：
``` JSON
{
  "type": "meeting",
  "tags": ["支付", "性能"],
  "projectId": "proj_01"
}
```
---
## 17.4 Projects 接口

### 1. 创建项目

`POST /api/projects`

### 2. 获取项目列表

`GET /api/projects`

### 3. 获取项目详情

`GET /api/projects/:id`

### 4. 更新项目

`PATCH /api/projects/:id`

---
## 17.5 Search 接口

### 1. 全文搜索

`GET /api/search?q=支付&page=1&pageSize=20`

响应：
``` JSON
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": "note_021",
        "title": "支付接口问题",
        "snippet": "今天排查支付延迟……"
      }
    ]
  }
}
```

---
## 17.6 Import / Export 接口

### 1. 导入 Markdown

`POST /api/import/markdown`

### 2. 导出单篇笔记

`GET /api/export/notes/:id`

### 3. 导出全库

`GET /api/export/workspace`

### 4. 导入 Notion 导出包（后续）

`POST /api/import/notion`

---
## 17.7 AI 接口

### 1. 生成建议

`POST /api/ai/suggest`

### 2. 摘要

`POST /api/ai/summarize`

### 3. 提取任务

`POST /api/ai/extract-tasks`

AI 接口必须：

- 可关闭
- 可切换模型
- 可审计
- 可重试
- 可缓存
---
## 18. 数据库表设计草案

## 18.1 notes

- id
- title
- type
- status
- content
- markdown_path
- project_id
- source_type
- source_device
- summary
- created_at
- updated_at
- deleted_at

## 18.2 note_tags

- id
- note_id
- tag_name

## 18.3 note_topics

- id
- note_id
- topic_id

## 18.4 projects

- id
- name
- description
- status
- created_at
- updated_at

## 18.5 topics

- id
- name
- description
- created_at
- updated_at

## 18.6 tasks

- id
- note_id
- project_id
- title
- status
- due_at
- created_at
- updated_at

## 18.7 note_links

- id
- from_note_id
- to_note_id
- link_type
- source
- created_at

---

## 19. Agent / 自动归类方案

## 19.1 MVP 方案

不用大模型做全自动自治，先采用：

- 规则引擎
- 关键词词典
- 轻量 embedding
- 用户历史上下文
- 类型模板匹配

### 类型识别规则示例

- 包含“今天”“复盘”“晨间” -> daily
- 包含“会议”“结论”“议题” -> meeting
- 包含“TODO”“待办”“下周要做” -> task
- 包含“读到”“摘录”“书里提到” -> reading

## 19.2 后续增强

- LLM 分类
- 关系建议
- project assignment recommendation
- long-form summary
- duplicate merging suggestion

## 19.3 风险控制

- 结果必须可改
- 不默认覆盖人工设置
- 不自动大量写 link
- 不自动批量改 tag
- 保留建议来源

---

## 20. 部署平台与环境方案

## 20.1 Demo 环境

推荐：

- Vercel：前端 + 轻 API
- Railway / Render：后端服务
- Supabase / Neon：数据库
- 本地文件导出：浏览器下载或服务端打包

## 20.2 正式环境候选

### Web

- Vercel
- Cloudflare Pages
- AWS Amplify

### Backend

- Railway
- Render
- Fly.io
- ECS / EC2（后期）

### Database

- Supabase Postgres
- Neon
- RDS（后期）

### Object Storage

- Cloudflare R2
- S3
- Supabase Storage

## 20.3 桌面端发布平台

- macOS
- Windows（后续）
- Linux（后续）

## 20.4 移动端发布平台

- iPadOS / iOS（后续）
- App Store
- TestFlight 内测

---

## 21. 开发优先级

## 21.1 Phase 0：立项与 Demo 设计

- 明确数据模型
- 明确导航结构
- 完成 PRD
- 完成技术方案
- 设计 GitHub 仓库结构
- 设计 Demo 页面流

## 21.2 Phase 1：MVP Demo

必须项：

- 文本输入
- 语音输入
- Inbox
- 自动分类建议
- Notes Table
- Markdown 编辑器
- 标签/项目管理
- 导出 Markdown

不做项：

- 手写
- 多人协作
- 复杂 AI agent
- Notion 全量导入
- 实时同步
- 高级 graph

## 21.3 Phase 2：可用版本

- Board View
- Search
- Project View
- Topic View
- Import Markdown
- 导入 Notion 基础支持
- Review 页面
- 简单同步

## 21.4 Phase 3：增强版本

- 手写输入
- 模板系统
- AI 摘要
- AI 回顾
- iPad/手机端
- 轻协作

---

## 22. GitHub 仓库建议

## 22.1 仓库命名候选

- flownote
- flownote-app
- flownote-demo
- flownote-workspace

## 22.2 仓库目录建议

``` Text
/flownote
  /apps
    /web
  /packages
    /ui
    /config
    /types
    /db
    /editor
  /docs
    PRODUCT_SPEC.md
    API_SPEC.md
    ROADMAP.md
    ARCHITECTURE.md
  /scripts
  README.md
  package.json
  turbo.json
```

## 22.3 Monorepo 建议

推荐：

- pnpm workspace
- Turborepo

原因：

- 后续可扩 web / desktop / shared packages
- 统一 types
- 统一 lint / build / config

---

## 23. README 建议结构

- 项目简介
- 为什么做这个产品
- 核心问题
- 产品能力
- 当前状态
- 技术栈
- 本地运行方式
- Roadmap
- 截图/原型
- License

---

## 24. 推广方式

## 24.1 推广核心信息

不要宣传“支持很多功能”，而要宣传：

- 你的灵感不该先学分类，再允许被记录
- 不管你怎么输入，系统都会先帮你放进正确的位置
- 在 Obsidian 和 Notion 之间，终于有一个更轻的中间层
- 不是替代它们，而是减少你在它们之间来回搬运

## 24.2 冷启动渠道

### GitHub

- 开源 Demo
- 持续写开发日志
- 发布 release notes
- 通过 README 明确定位

### Twitter / X / 小红书 / 即刻 / Reddit

- 发“从 Obsidian 和 Notion 中间切一个产品”的过程内容
- 展示真实使用前后对比
- 展示 Demo GIF
- 发路线图与思考

### Product Hunt

- 适合 Web Demo 成型后

### 独立开发者社区

- Indie Hackers
- Hacker News（需要打磨）
- V2EX
- 少数派（内容型渠道）
- 中文 Obsidian / Notion 社群

## 24.3 推广内容策略

- 不是“我做了一个笔记工具”
- 而是“我试图解决一个更真实的问题：为什么我们总在 Obsidian 和 Notion 之间折返跑”

---

## 25. 商业化预留位

当前不以收费为优先，但可以预留订阅位：

### 免费层

- 文本输入
- 基础语音输入
- Inbox
- 基础数据库
- Markdown 导出

### 订阅层

- 高级 AI
- 高级回顾
- 高级链接建议
- 手写识别
- 多设备同步
- 高级模板
- Notion 高级导入

### 企业层（非常后期）

- 团队知识库
- 权限
- 共享项目空间
- 审批流

---

## 26. 风险评估

### 产品风险

- 容易做成四不像
- 功能边界不清
- 用户以为是另一个笔记软件

### 技术风险

- 自动归类效果不稳定
- Notion 导入映射复杂
- Markdown 与数据库双模型一致性难维护

### 开发风险

- 多端同时推进会失控
- 手写太早上会拖慢节奏
- AI 接太深会抬高成本

### 风险应对

- 先做 Web Demo
- 先证明“系统代整理”命题
- AI 后置
- 手写后置
- 同步后置
- 先做几类固定场景

---

## 27. 成功指标（Demo / MVP）

### 定性指标

- 用户是否理解产品定位
- 用户是否接受 Inbox 工作流
- 用户是否觉得“比自己整理省力”
- 用户是否愿意把真实内容放进来

### 定量指标

- 新建内容数
- Inbox -> Archive 转化率
- 手动修改建议比例
- 搜索使用率
- 导出率
- 次日留存 / 7日留存
- 项目绑定率

---

## 28. Demo 范围最终建议

### 推荐 Demo 主题

“从任意输入到结构化知识条目”

### Demo 最小闭环

1. 输入一段文字或语音
2. 自动进入 Inbox
3. 系统给出类型、标签、项目建议
4. 用户确认
5. 进入 Notes Table
6. 打开记录编辑 Markdown
7. 导出成 Markdown 文件

这个闭环已经足够说明产品价值。

---

## 29. 后续文档拆分建议

本说明书后续应拆分为：

- `README.md`
- `PRODUCT_SPEC.md`
- `TECH_SPEC.md`
- `API_SPEC.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `CHANGELOG.md`

---

## 30. 结语

Atlax 的核心不是“功能更多”，而是：

**在 Obsidian 和 Notion 之间，给用户一条更轻、更稳、更容易开始的路。**

如果这个方向成立，那么手写、语音、Markdown、Database、Agent 都只是围绕同一条主线逐步展开的能力层，而不是互相打架的功能集合。  