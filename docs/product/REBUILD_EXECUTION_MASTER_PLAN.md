
# REBUILD_EXECUTION_MASTER_PLAN.md
# MindDock 第二版 Demo 重构总执行文档（可直接开工版）

## 1. 文档目标

本文件用于指导 MindDock 第二版 Demo 正式重构落地。

目标：

1. 将重构任务拆成可执行小任务
2. 明确每阶段前端 / 后端 / 联调任务
3. 控制进度，不失控
4. 动态调整任务优先级
5. 保证质量
6. 最终产出可演示 Demo

---

## 2. 总执行原则

```text
主线优先：
Editor > Mind > Dock > Auto Landing > 其他功能
```

```text
体验优先：
用户感知价值 > 技术优雅 > 功能数量
```

```text
每轮必须可运行：
任何阶段结束，项目都必须能启动演示
```

```text
每轮最多3个核心任务：
避免摊子过大
```

---

## 3. 总阶段拆分

```text
Phase 0 旧系统冻结与重构基线
Phase 1 工程骨架 + 数据骨架
Phase 2 Editor 重构
Phase 3 Mind 星云树重构
Phase 4 Dock 重构
Phase 5 自动落库算法接入
Phase 6 联调 + 打磨
Phase 7 Demo 封版
```

---

# Phase 0 旧系统冻结与重构基线

## 完成定义
项目进入重构模式，旧功能停止扩张。

## 前端任务

### FE-0.1 清理旧模块
- 删除废弃页面入口
- 废弃旧 Entry 模块 UI
- legacy 目录收纳旧代码

### FE-0.2 固定主布局

```text
TopBar:
Editor | Mind | Dock

MainStage:
activeModule 渲染对应页面
```

### FE-0.3 建立规范
- ESLint
- Prettier
- Husky

## 后端任务

### BE-0.1 统一命名
Entry 全改 Document

### BE-0.2 建立模块目录

```text
auth
document
mind
dock
algorithm
review
common
```

## 联调任务

### INT-0.1 前后端环境跑通

## 验收

- 项目可运行
- 旧入口关闭
- 新结构开始生效

## 卡住怎么办

旧代码过乱：

```text
直接新建 src_v2
旧代码保留不继续修
```

---

# Phase 1 工程骨架 + 数据骨架

## 完成定义

Document / Node / Edge 三核心模型打通。

## 前端任务

### FE-1.1 TypeScript 类型

- Document
- MindNode
- MindEdge
- Capture
- Suggestion

### FE-1.2 Store

- appStore
- editorStore
- mindStore
- dockStore

### FE-1.3 API Client

- documentApi
- mindApi
- dockApi

## 后端任务

### BE-1.1 建表

- documents
- mind_nodes
- mind_edges
- captures
- suggestions

### BE-1.2 API

```text
POST /documents
GET /documents
GET /mind/graph
POST /captures
```

## 联调任务

### INT-1.1 创建文档闭环

```text
创建文档 -> DB成功 -> Dock显示
```

### INT-1.2 Graph 闭环

```text
读取节点 -> Mind展示
```

## 验收

- 新建文档成功
- Dock 显示真实数据
- Mind 显示真实节点

## 动态调整

后端慢：

```text
前端临时 Mock，但结构必须一致
```

---

# Phase 2 Editor 重构

## 完成定义

Editor 成为可用编辑器。

## 前端任务

### FE-2.1 双模式

- Markdown
- Block

### FE-2.2 编辑能力

- 标题
- 列表
- 表格
- 代码块
- 双链

### FE-2.3 自动保存

### FE-2.4 Slash Command

### FE-2.5 实时预览

## 后端任务

### BE-2.1 保存文档接口

```text
PUT /documents/{id}
```

### BE-2.2 文本解析

提取：

- plainText
- tags
- headings
- links

### BE-2.3 推荐接口

```text
/editor/suggestions
```

## 联调任务

### INT-2.1 Dock 打开 Editor

### INT-2.2 保存后 Dock 更新时间更新

### INT-2.3 保存后 Mind 节点更新

## 验收

- 输入顺畅
- 自动保存稳定
- 可编辑真实文档

## 动态调整

Block 太难：

```text
先做 Markdown 模式
```

---

# Phase 3 Mind 星云树重构

## 完成定义

做出产品灵魂页面。

## 前端任务

### FE-3.1 Canvas Engine

- 缩放
- 平移
- 拖拽

### FE-3.2 Node Layer

- glow
- hover
- selected

### FE-3.3 Edge Layer

- 渐隐
- 聚焦显示

### FE-3.4 Detail Panel

### FE-3.5 Star Input

输入即生成星辰

## 后端任务

### BE-3.1 Graph API

```text
GET /mind/graph
```

### BE-3.2 Layout Save API

### BE-3.3 Link API

## 联调任务

### INT-3.1 输入一句话

```text
StarInput -> Capture -> Node生成
```

### INT-3.2 点击节点打开 Editor

### INT-3.3 Dock 点击定位 Mind

## 验收

- 第一眼惊艳
- 可拖动
- 不杂乱
- 真数据驱动

## 动态调整

卡顿：

```text
先隐藏弱边
label hover显示
```

---

# Phase 4 Dock 重构

## 完成定义

知识库管理区可用。

## 前端任务

### FE-4.1 List View

### FE-4.2 Card View

### FE-4.3 Finder Column View

### FE-4.4 Search

### FE-4.5 批量操作

## 后端任务

### BE-4.1 Dock List API

### BE-4.2 Search API

### BE-4.3 Bulk API

## 联调任务

### INT-4.1 Dock 打开 Editor

### INT-4.2 Dock 定位 Mind

### INT-4.3 Mind 选中同步 Dock

## 验收

- 管理效率提升
- 三视图可切换
- 联动稳定

## 动态调整

时间紧：

```text
先做 List + Search + Locate
```

---

# Phase 5 自动落库算法接入

## 完成定义

系统体现产品价值。

## 前端任务

### FE-5.1 推荐浮层

### FE-5.2 Pending Queue

### FE-5.3 Chat Nudge 区域

## 后端任务

### BE-5.1 自动分类

### BE-5.2 链接推荐

### BE-5.3 周 Review

### BE-5.4 用户反馈学习

## 联调任务

### INT-5.1 输入内容 -> 推荐落库

### INT-5.2 编辑保存 -> 推荐链接

## 验收

- 推荐可感知
- 不乱推荐
- 用户能确认/拒绝

## 动态调整

不准：

```text
全部改 suggested
不自动确认
```

---

# Phase 6 联调 + 打磨

## 完成定义

从能用到像产品。

## 前端任务

- Loading
- Empty State
- Error State
- 动效统一
- UI统一

## 后端任务

- 慢SQL优化
- 缓存优化
- 日志完善
- TraceId

## 联调任务

完整主路径回归：

```text
Mind输入
-> Dock出现
-> Editor编辑
-> 保存
-> Mind更新
-> 推荐出现
```

## 验收

- 无明显断点
- 无重大Bug
- 风格统一

---

# Phase 7 Demo 封版

## 前端任务

- 演示数据美化
- 录屏路径优化
- 控制台无报错

## 后端任务

- Demo Seed Data
- Reset Script
- 稳定接口

## 演示路径

```text
打开Mind
输入灵感
生成星辰
Dock管理
Editor深化编辑
系统推荐结构
```

---

# 4. 每轮进度控制机制

## 每轮开始

写清：

```text
本轮3个必做任务
本轮2个可选任务
本轮最大风险
```

## 每轮结束

复盘：

```text
完成什么
卡住什么
为什么卡
下轮调整什么
```

---

# 5. 动态调整总规则

## 如果进度慢

砍：

- 高级动画
- Finder高级交互
- 次级推荐

保：

- Editor
- Mind
- Dock

## 如果进度快

加：

- Finder完整体
- Review
- Widget

---

# 6. 质量红线

## UI红线

- 越做越丑禁止合并
- 体验割裂禁止合并

## 功能红线

- 主路径断裂禁止合并
- 数据不同步禁止合并

## 性能红线

- 输入卡顿禁止合并
- Graph明显掉帧禁止合并

---

# 7. 最终成功标准

```text
第一次打开：高级感
第一次输入：顺手
第一次看Mind：震撼
持续使用：离不开
```
