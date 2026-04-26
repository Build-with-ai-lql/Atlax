# Atlax MindDock 结构化系统重构设计文档

版本：v0.4 Nebula Tree
阶段：Demo 重构阶段
核心范围：结构化知识系统 + Markdown / Block 编辑体验
当前主线模块：Editor / Mind / Dock
明确剪枝：取消 Entry 模块；Review、小组件、Chat、订阅能力先做结构预留，不进入本阶段主交付。

---

## 1. 本轮重构结论

本轮 Demo 不再继续堆功能，而是重新建立产品骨架。

Atlax MindDock 的产品灵魂不是“笔记列表”，不是“数据库表格”，也不是“聊天框”，而是：

> 用户把碎片想法投入系统，系统将它们自动转化为可编辑、可追踪、可连接、可回看的知识星体，并在 Mind 中形成一张有秩序、有美感、有生命感的星云树。

因此，产品结构必须围绕三个主模块重新收束：

| 模块     | 定位      | 核心职责                                      |
| ------ | ------- | ----------------------------------------- |
| Editor | 内容生产区   | 负责 Markdown / Block Markdown 编辑、实时预览、内容沉淀 |
| Mind   | 星云树知识视图 | 负责知识结构展示、节点关联、自动落库反馈、关系探索                 |
| Dock   | 知识库管理区  | 负责所有文档、节点、项目、标签、来源的管理视图                   |

取消原来的 `Entry` 独立模块。
原因：Entry 会制造产品心智分裂，让用户不知道内容到底在哪里。后续所有归档内容都应由 Dock 管理，由 Mind 可视化，由 Editor 编辑。

最终用户心智应该是：

> 我在 Editor 写东西，在 Mind 看结构，在 Dock 管理知识库。

---

## 2. 当前 UI 交互设计中的功能点清单

当前 UI 已经确立了一个正确方向：不是传统左侧导航 + 中间列表 + 右侧详情，而是顶部 Dock 栏 + 中央沉浸式工作区。

### 2.1 顶部主导航

当前主导航只有三个核心入口：

| 菜单     | 页面状态      | 产品含义             |
| ------ | --------- | ---------------- |
| Editor | 切换到编辑页    | 创建、编辑、沉淀内容       |
| Mind   | 切换到星云树页   | 查看知识结构，是产品首页和主视觉 |
| Dock   | 切换到知识库管理页 | 管理全部文档和结构化数据     |

设计要求：

1. 顶部导航是唯一主导航。
2. 不再使用复杂左侧 Sidebar 承载主功能。
3. 其他非主线功能只能以浮动工具、弹窗、抽屉形式出现。
4. 用户进入产品后默认打开 Mind。
5. Mind 不是“一个图表页面”，而是产品主舞台。

---

### 2.2 Mind 星云树视图

当前 Mind 视图已经具备以下交互雏形：

| 交互      | 当前含义                                  | 后端数据接入                                    |
| ------- | ------------------------------------- | ----------------------------------------- |
| 节点展示    | 展示知识节点、主题节点、核心节点                      | `mind_nodes`                              |
| 连线展示    | 展示节点之间的关联关系                           | `mind_edges`                              |
| 节点大小差异  | 表示节点层级、重要性、连接度                        | `node_weight / degree / importance_score` |
| 节点颜色差异  | 表示节点类型或状态                             | `node_type / graph_state / cluster_id`    |
| 点击节点    | 打开节点详情                                | `GET /api/mind/nodes/{id}`                |
| 拖动节点    | 调整临时布局或建立关系                           | `PATCH /api/mind/nodes/{id}/layout`       |
| 视图缩放    | 查看全局或局部知识结构                           | 前端布局状态，不直接改业务数据                           |
| 星辰输入框   | 快速输入碎片内容并生成新节点                        | `POST /api/captures`                      |
| 右侧浮动工具栏 | 预留 Review / Chat / Calendar / Widgets | `tools_panel_state` 本地状态 + 后续功能 API       |

Mind 的核心不是“显示所有数据”，而是显示“结构化结果”。
所有进入系统的内容，无论来自 Editor、Dock 导入、Mind 输入框，最终都必须进入统一的结构化流程，再决定它在星云树中的位置。

---

### 2.3 星辰输入框

星辰输入框是 Mind 的关键交互之一。

它不是普通输入框，而是 Atlax 的“结构化入口”。

用户在 Mind 视图中输入一句话，例如：

> 下周产品评审会议，需要准备 Q2 路线图和用户反馈数据

系统行为不应该只是保存一条文本，而应该经过以下流程：

1. 创建 Capture 原始记录。
2. 生成一个临时星辰节点。
3. 判断是否属于已有项目、主题、标签、时间线。
4. 如果匹配度高，自动落到对应星群。
5. 如果匹配度中等，落入待确认轨道。
6. 如果匹配度低，作为漂浮星辰保留在 Mind 外围。
7. 用户可拖动该星辰到某个节点或星群，确认归属关系。

这个交互是 MindDock 的核心差异化点。
用户不需要先选择文件夹，不需要先选标签，不需要打开复杂表单，而是“扔进去，系统先接住”。

---

### 2.4 Dock 知识库管理区

Dock 不再是 Entry 的替代品，也不是普通列表页。
Dock 的定位应该是：

> Mind 的结构化后台，Editor 的内容仓库，用户知识库的 Finder。

Dock 管理的不是“文件”，而是所有已经进入系统的数据对象，包括：

1. 文档。
2. 星辰碎片。
3. 项目。
4. 主题。
5. 标签。
6. 来源。
7. 关系。
8. 待确认归档项。
9. 外部导入内容。
10. 已归档内容。

Dock 至少需要支持三种视图：

| 视图                 | 借鉴对象                      | 用途               |
| ------------------ | ------------------------- | ---------------- |
| List View          | 数据库列表                     | 批量管理、筛选、排序       |
| Card View          | Notion Gallery / Apple 卡片 | 快速浏览内容摘要         |
| Finder Column View | macOS Finder 分栏           | 按路径、项目、主题、来源逐级浏览 |

Dock 和 Mind 必须双向打通：

| 操作               | 结果             |
| ---------------- | -------------- |
| 在 Dock 选择文档      | Mind 高亮对应节点    |
| 在 Dock 选择项目      | Mind 聚焦对应星群    |
| 在 Mind 点击节点      | Dock 同步定位到该文档  |
| 在 Mind 拖动建立关系    | Dock 中关系字段同步更新 |
| 在 Dock 修改标签 / 项目 | Mind 重新计算边和星群  |
| 在 Dock 批量导入      | Mind 分批生成星辰和星群 |

---

### 2.5 Editor 编辑区

Editor 是内容生产区。
当前阶段必须明确：Atlax 的编辑器不能只是一个大 textarea。

Editor 需要支持两种模式：

| 模式               | 借鉴对象     | 核心体验                         |
| ---------------- | -------- | ---------------------------- |
| Classic Markdown | Obsidian | 原生 Markdown、源码编辑、实时预览        |
| Block Markdown   | Notion   | 块级编辑、拖动块、Slash Command、属性化内容 |

两种模式必须使用同一个底层内容模型，不能做成两个互不兼容的编辑器。

推荐原则：

1. 底层以 Block JSON 作为编辑结构。
2. Markdown 作为长期资产和导出格式。
3. Plain Text 作为搜索和结构化算法输入。
4. Frontmatter / Properties 作为结构化元数据。
5. 编辑器保存时自动触发结构化流程。
6. 文档更新后 Mind 中对应节点状态同步更新。

---

### 2.6 浮动工具栏

Review、小组件、Chat、Calendar 不应该在当前阶段作为主导航出现。
它们应该作为右侧浮动工具栏的扩展能力存在。

原因：

1. 当前产品核心还没有稳，不能继续摊大饼。
2. 浮动工具可以保留未来扩展感。
3. 不会破坏 Editor / Mind / Dock 的主结构。
4. 也符合 Cerebro AI 这类产品的极简主界面思路。

本阶段浮动工具栏只做入口样式和状态预留，不做完整功能。

建议保留四个入口：

| 工具       | 当前阶段 | 后续能力              |
| -------- | ---- | ----------------- |
| Chat     | 入口预留 | 知识库问答、节点解释、输出辅助   |
| Review   | 入口预留 | 周报、健康检查、停滞提醒      |
| Calendar | 入口预留 | 时间回看、Time Machine |
| Widgets  | 入口预留 | 小组件系统             |

---

## 3. 产品核心对象模型

Atlax 的数据结构不能按“文件夹 + 文件”来设计，也不能只按“图节点 + 边”来设计。

它应该使用三层模型：

```text
Content Layer      内容层：文档、块、附件、来源、Markdown
Structure Layer    结构层：节点、边、星群、标签、项目、时间线
View Layer         视图层：Mind、Dock、Editor、Calendar、Review
```

### 3.1 内容层 Content Layer

内容层负责保存真实内容。

核心对象：

| 对象         | 含义               |
| ---------- | ---------------- |
| Document   | 一篇完整文档           |
| Block      | 文档中的块            |
| Asset      | 图片、附件、音频、视频封面等资源 |
| Capture    | 临时输入或碎片记录        |
| SourceItem | 外部来源数据           |
| ImportJob  | 导入任务             |
| Version    | 文档版本历史           |

内容层必须稳定、可导出、可迁移。

---

### 3.2 结构层 Structure Layer

结构层负责把内容变成知识网络。

核心对象：

| 对象             | 含义        |
| -------------- | --------- |
| MindNode       | 星云树中的节点   |
| MindEdge       | 节点之间的关系   |
| Cluster        | 星群 / 主题团簇 |
| Project        | 项目        |
| Tag            | 标签        |
| Topic          | 主题        |
| TimelineAnchor | 时间锚点      |
| GraphLayout    | 前端布局缓存    |
| GraphSignal    | 算法信号      |
| UserAction     | 用户修正行为    |

结构层是 Atlax 最重要的资产层。
它决定产品是不是“智能知识系统”，还是只是“换皮笔记软件”。

---

### 3.3 视图层 View Layer

视图层不直接创造业务数据，只负责用不同方式呈现结构。

| 视图                      | 数据来源                                                 |
| ----------------------- | ---------------------------------------------------- |
| Mind                    | `mind_nodes + mind_edges + clusters + graph_layouts` |
| Dock List               | `documents + mind_nodes + projects + tags`           |
| Dock Card               | `documents + summary + source + cluster`             |
| Dock Finder             | `projects / topics / sources / dates + documents`    |
| Editor                  | `documents + blocks + properties`                    |
| Calendar / Time Machine | `documents + events + timeline_anchors`              |
| Review                  | `graph_signals + documents + user_actions`           |

---

## 4. 节点类型设计

Mind 中不能所有节点都长得一样。
如果所有节点都只是圆点 + 线，视觉一定会乱，而且没有产品层次。

### 4.1 节点类型

| 类型   | 英文       | 含义                            | 视觉表现         |
| ---- | -------- | ----------------------------- | ------------ |
| 根节点  | root     | 当前用户 / 当前知识宇宙                 | 默认隐藏或作为中心引力源 |
| 领域节点 | domain   | 长期领域，如产品、技术、生活                | 大型星核，低频移动    |
| 项目节点 | project  | 具体项目，如 Atlax Phase 3          | 明亮星核，有轨道     |
| 主题节点 | topic    | 某类反复出现的主题                     | 中型节点，形成星群中心  |
| 文档节点 | document | 已归档文档                         | 普通星体         |
| 碎片节点 | fragment | 未完全结构化内容                      | 小星点          |
| 来源节点 | source   | 微信、小红书、B站、Notion、Obsidian 等来源 | 带来源徽记        |
| 标签节点 | tag      | 标签概念                          | 小型辅助节点       |
| 问题节点 | question | 系统反问用户的问题                     | 有脉冲效果        |
| 洞察节点 | insight  | 系统生成的洞察                       | 高亮但不喧宾夺主     |
| 时间节点 | time     | 日期、周、月、阶段                     | 细线环形节点       |

---

### 4.2 节点状态

| 状态  | 英文         | 含义             | 视觉表现     |
| --- | ---------- | -------------- | -------- |
| 漂浮  | drifting   | 尚未确定归属         | 外围微光星尘   |
| 待确认 | suggested  | 系统已推荐归属，等待用户确认 | 柔和闪烁边框   |
| 已锚定 | anchored   | 已进入稳定结构        | 清晰节点     |
| 已归档 | archived   | 已确认长期保存        | 稳定亮度     |
| 冷却  | dormant    | 长期未访问          | 亮度降低     |
| 活跃  | active     | 最近编辑、访问或关联增强   | 节点轻微呼吸   |
| 冲突  | conflicted | 多个归属冲突         | 节点出现分裂光环 |
| 孤立  | isolated   | 缺少有效关系         | 周围无线或弱线  |

---

### 4.3 节点大小规则

节点大小不能随便写死，必须有含义。

推荐计算：

```text
node_size =
base_size
+ degree_score * 0.25
+ recent_activity_score * 0.2
+ document_weight_score * 0.2
+ user_pin_score * 0.2
+ cluster_center_score * 0.15
```

解释：

| 因子                    | 含义             |
| --------------------- | -------------- |
| degree_score          | 节点连接数量         |
| recent_activity_score | 最近是否被编辑、访问、链接  |
| document_weight_score | 文档长度、引用次数、任务数量 |
| user_pin_score        | 用户是否手动置顶       |
| cluster_center_score  | 是否是星群中心        |

限制：

```text
fragment: 4 - 8 px
document: 8 - 18 px
topic: 18 - 32 px
project: 32 - 52 px
domain: 52 - 72 px
```

不要让节点过大，否则会变成儿童玩具感。
大节点只应该代表真正重要的结构中心。

---

## 5. 连线设计

当前 Mind 视图最大的问题之一是连线容易显得粗糙、杂乱、廉价。
连线必须重新设计为“信息层级”，而不是简单画线。

### 5.1 连线类型

| 类型   | 英文           | 含义              | 视觉     |
| ---- | ------------ | --------------- | ------ |
| 父子关系 | parent_child | 项目 - 文档、主题 - 文档 | 稳定细线   |
| 语义相似 | semantic     | 内容相似            | 极细半透明线 |
| 引用关系 | reference    | 文档内链接、块引用       | 明亮细线   |
| 来源关系 | source       | 来自同一平台或导入批次     | 虚线或弱线  |
| 时间关系 | temporal     | 同一天、同一周、同一阶段    | 弧线     |
| 用户确认 | confirmed    | 用户手动建立          | 更稳定、更亮 |
| 系统建议 | suggested    | 算法推荐            | 虚线、低透明 |
| 冲突关系 | conflict     | 系统不确定或多重归属冲突    | 暖色弱线   |

---

### 5.2 连线强度规则

```text
edge_strength =
relation_weight * 0.35
+ confidence * 0.25
+ user_confirmed_weight * 0.25
+ recent_interaction_weight * 0.15
```

视觉映射：

| 强度         | 视觉                 |
| ---------- | ------------------ |
| 0.0 - 0.3  | 几乎不可见，只在 hover 时显示 |
| 0.3 - 0.55 | 弱线，低透明             |
| 0.55 - 0.8 | 常规细线               |
| 0.8 - 1.0  | 稳定主线               |

连线宽度建议：

```text
weak: 0.4px - 0.7px
normal: 0.8px - 1.2px
strong: 1.3px - 1.8px
```

不要大面积使用 2px 以上的线。
一旦线太粗，星云树会立刻变成廉价流程图。

---

### 5.3 连线显示策略

为了避免 Cerebro Brain 那种高级感被破坏，Mind 视图必须做 LOD 分层显示。

LOD = Level of Detail。

| 缩放级别 | 显示内容               |
| ---- | ------------------ |
| 全局远景 | 只显示大节点、星群轮廓、主干连线   |
| 中景   | 显示项目、主题、部分文档、确认连线  |
| 近景   | 显示具体文档、小节点、弱关系     |
| 聚焦节点 | 显示该节点一跳、二跳关系，隐藏无关线 |

规则：

1. 默认不展示所有线。
2. 鼠标 hover 节点时显示邻接边。
3. 点击节点后显示一跳强关系和二跳弱关系。
4. 拖动节点时只显示可连接候选节点。
5. 星群内部线条默认隐藏，只显示星群边界和核心节点。
6. 用户需要探索时再展开细节。

Mind 的美感不是靠“显示更多”，而是靠“隐藏得更聪明”。

---

## 6. 星云树视觉升级方案

当前节点和连线看起来粗糙，本质原因不是动效问题，而是视觉层级不够。

星云树需要从“节点图”升级为“空间中的知识星系”。

### 6.1 视觉关键词

| 关键词  | 设计要求                  |
| ---- | --------------------- |
| 深邃   | 背景不能纯黑，要有低亮度渐变、空间雾感   |
| 精致   | 节点不能只是纯色圆，要有内核、光晕、边缘  |
| 克制   | 颜色数量少，避免花哨            |
| 有秩序  | 星群分布有结构，不是随机散开        |
| 有生命感 | 节点轻微呼吸、线条轻微流动         |
| 专业   | 不出现过度卡通化图标，不使用大面积高饱和色 |
| 空间感  | 节点有 z-depth、视差、远近层级   |

---

### 6.2 推荐配色

基础色：

```text
background-deep: #02040A
background-mid:  #070A12
panel:           rgba(18, 22, 30, 0.72)
border:          rgba(255, 255, 255, 0.08)
text-primary:    #F4F7FB
text-secondary:  #9BA6B8
text-muted:      #5F6B7D
```

星云色：

```text
atlax-blue:      #4F7DFF
nebula-cyan:     #10D5FF
nebula-teal:     #18E0B5
nebula-violet:   #7B61FF
nebula-amber:    #F4B860
danger-soft:     #FF6B81
```

使用规则：

1. 紫色只用于高层级节点或用户确认的重要节点。
2. 青色用于项目 / 主题中心。
3. 绿色用于普通文档和已归档节点。
4. 灰蓝色用于冷却、弱关系、历史内容。
5. 红色不要常用，只用于冲突或异常。
6. 所有颜色必须带透明度，不使用纯色块。

---

### 6.3 节点视觉构成

每个节点由四层组成：

```text
1. Core       内核：真实节点大小
2. Glow       光晕：表示活跃度 / 重要性
3. Ring       环：表示状态
4. Label      标签：根据缩放和 hover 决定是否显示
```

#### 普通文档节点

```text
core: 6 - 12px
glow: 8 - 20px，透明度 0.12 - 0.24
ring: 默认不显示
label: hover 或近景显示
```

#### 项目节点

```text
core: 18 - 28px
glow: 36 - 70px
ring: 显示一圈淡色轨道
label: 中景显示
```

#### 领域节点

```text
core: 32 - 48px
glow: 80 - 140px
ring: 双层轨道
label: 远景也显示
```

#### 待确认节点

```text
core: 5 - 10px
glow: 呼吸闪烁
ring: 虚线环
label: 不默认显示
```

#### 漂浮星辰

```text
core: 2 - 5px
glow: 微弱
position: 星云外围
motion: 缓慢漂浮
```

---

### 6.4 星群视觉

星群不是文件夹，不应该画成框。

星群应该是淡淡的“星云雾区”。

每个 cluster 使用：

```text
nebula_hull:
  type: radial-gradient / canvas blur region
  opacity: 0.04 - 0.12
  color: cluster_theme_color
  shape: irregular blob
```

规则：

1. 星群中心是 topic / project 节点。
2. 星群内部文档围绕中心分布。
3. 星群之间保持一定距离。
4. 星群之间只显示少量强关系。
5. 星群边界非常淡，不要像卡片边框。
6. 鼠标进入星群后，边界略微增强。
7. 点击星群后进入 Focus Mode。

---

### 6.5 Focus Mode

当用户点击一个项目节点或主题节点时，进入局部聚焦。

Focus Mode 行为：

1. 当前节点移动到视觉中心。
2. 一跳节点清晰显示。
3. 二跳节点半透明显示。
4. 无关星群降低透明度。
5. 右侧弹出节点详情浮层。
6. Dock 如果打开，应同步定位到对应项目或文档。
7. Esc 退出 Focus Mode。

这样可以解决“全局美观”和“局部可用”之间的冲突。

---

## 7. Mind 布局算法设计

Mind 不能使用纯随机布局。
随机布局会导致每次打开都不同，用户无法建立空间记忆。

推荐使用：

```text
稳定布局 + 增量布局 + 局部力导向
```

D3 force simulation 可以作为第一阶段布局引擎，适合处理节点、连接、碰撞、中心力等基础关系；后续如果数据量变大，可考虑用 Sigma.js / Graphology 这类面向图结构和 WebGL 渲染的方案承接大规模渲染。D3 force 官方提供 forceLink、forceManyBody、forceCollide 等力模型能力；Sigma.js 官方定位是面向图网络的 WebGL 渲染库。

### 7.1 布局层级

```text
Root Gravity       用户根引力，默认不可见
Domain Ring        领域环
Project Belt       项目带
Topic Cluster      主题星群
Document Orbit     文档轨道
Fragment Dust      碎片星尘
```

### 7.2 坐标系统

每个节点需要保存布局缓存：

```json
{
  "node_id": "node_xxx",
  "layout_scope": "global",
  "x": 120.4,
  "y": -80.2,
  "z": 0.38,
  "vx": 0,
  "vy": 0,
  "pinned": false,
  "last_layout_at": "2026-04-26T20:10:00Z"
}
```

字段说明：

| 字段             | 含义                       |
| -------------- | ------------------------ |
| x / y          | 画布坐标                     |
| z              | 视觉深度                     |
| vx / vy        | 动画速度缓存                   |
| pinned         | 用户是否手动固定位置               |
| layout_scope   | global / cluster / focus |
| last_layout_at | 上次布局更新时间                 |

---

### 7.3 稳定布局规则

1. 已确认节点的位置尽量稳定。
2. 新节点只能局部影响布局，不能重排整个宇宙。
3. 用户手动拖动过的节点默认 pinned。
4. 同一项目 / 主题内的新文档进入该星群边缘。
5. 未确认节点进入外围漂浮区。
6. 批量导入时先生成临时星群，不立即打散到全局。
7. 每次布局变更都记录 `graph_events`，支持撤销。

---

### 7.4 新节点落点算法

新内容进入系统后，计算候选位置：

```text
candidate_cluster = top matched cluster
candidate_parent = top matched project/topic node
position =
  if confidence >= 0.78:
      parent orbit position
  else if confidence >= 0.55:
      suggested orbit position
  else:
      drifting dust area
```

落点具体规则：

| 置信度         | 行为            |
| ----------- | ------------- |
| >= 0.78     | 自动锚定到星群       |
| 0.55 - 0.78 | 作为建议节点，等待用户确认 |
| < 0.55      | 漂浮在外层，作为未归档星辰 |

不要为了显得“智能”而强行归类。
错归类比不归类更伤用户信任。

---

## 8. 自动落库系统设计

自动落库是 Atlax 的核心能力。
这里必须严肃设计，不能做成“根据关键词随便打个标签”。

### 8.1 自动落库输入来源

| 来源          | 示例                    | 接入方式                             |
| ----------- | --------------------- | -------------------------------- |
| Mind 星辰输入   | 一句话想法                 | `POST /api/captures`             |
| Editor 文档保存 | Markdown / Block 文档   | `POST /api/documents`            |
| Dock 手动创建   | 新建项目 / 文档             | `POST /api/dock/items`           |
| Obsidian 导入 | Markdown 文件夹          | Import Adapter                   |
| Notion 导入   | Markdown / HTML / CSV | Import Adapter                   |
| 微信          | 文章链接、收藏、手动复制内容        | Web Clip / Manual Import         |
| 小红书         | 分享链接、截图、手动摘录          | Link / OCR Later                 |
| 抖音          | 视频链接、标题、描述、字幕摘要       | Link Metadata / Transcript Later |
| B站          | 视频链接、标题、简介、字幕         | Link Metadata / Transcript       |
| 网页          | URL / Readability 内容  | Web Clipper                      |
| PDF / 图片    | 文件导入                  | Parser / OCR Later               |

注意：
中国大陆信息流平台接入必须先采用“用户主动导入 / 分享 / 复制 / 上传”的方式，不做绕过平台权限或反爬策略的采集。

---

### 8.2 自动落库主流程

```text
Input
  ↓
Capture / Import Item
  ↓
Normalize 标准化
  ↓
Extract 信息抽取
  ↓
Classify 分类
  ↓
Link 关系生成
  ↓
Cluster 星群归属
  ↓
Layout 视觉落点
  ↓
Persist 入库
  ↓
Feedback 前端反馈
```

---

### 8.3 标准化 Normalize

不同来源的数据格式完全不同，所以必须先转换成 Atlax Universal Document。

统一格式：

```json
{
  "aud_version": "1.0",
  "source": {
    "source_type": "wechat | xiaohongshu | douyin | bilibili | obsidian | notion | manual | web",
    "source_url": "",
    "source_title": "",
    "source_author": "",
    "captured_at": "",
    "raw_id": "",
    "import_job_id": ""
  },
  "content": {
    "title": "",
    "markdown": "",
    "plain_text": "",
    "blocks": [],
    "assets": []
  },
  "metadata": {
    "created_at": "",
    "updated_at": "",
    "language": "zh-CN",
    "tags": [],
    "properties": {},
    "frontmatter": {}
  },
  "relations": {
    "outgoing_links": [],
    "backlinks_hint": [],
    "embedded_assets": []
  }
}
```

所有导入源必须先转成 AUD，再进入后续流程。
不能让每个导入源直接写业务表，否则系统后期一定会崩。

---

### 8.4 信息抽取 Extract

MVP 不依赖 LLM，也要能工作。

抽取字段：

| 字段       | 方法                         |
| -------- | -------------------------- |
| 标题       | 原始标题 / 首行 / H1             |
| 摘要       | 前 N 字 / 标题组合               |
| 关键词      | TF-IDF / 词频 / 标题权重         |
| 时间       | created_at / 文中日期 / 导入时间   |
| 项目候选     | 已有项目名匹配                    |
| 标签候选     | 标签词典匹配                     |
| 来源       | source_type                |
| 人名 / 产品名 | 简单实体识别                     |
| 链接       | Markdown link / URL        |
| 任务       | checkbox / “待办”“需要”“下周”等模式 |
| 状态       | 未归档 / 待确认 / 已归档            |

中文场景下，算法必须考虑中文分词。
可先使用轻量分词策略：

1. 标点切分。
2. 标题词权重提升。
3. 已有项目名 / 标签名优先匹配。
4. 用户历史高频词优先。
5. 2-6 字短语抽取。
6. 英文、数字、版本号保持原样。

---

### 8.5 分类 Classify

分类不是简单 tag。
分类要决定这个内容应该进入哪个知识位置。

候选归属：

```text
Project
Topic
Domain
Source
Time
Tag
```

推荐评分：

```text
landing_score =
title_match_score * 0.25
+ keyword_match_score * 0.2
+ content_similarity_score * 0.2
+ user_history_score * 0.15
+ source_context_score * 0.1
+ time_context_score * 0.1
```

说明：

| 分数                       | 含义              |
| ------------------------ | --------------- |
| title_match_score        | 标题是否命中已有项目 / 主题 |
| keyword_match_score      | 关键词是否重合         |
| content_similarity_score | 内容相似度           |
| user_history_score       | 用户过去是否经常这样归档    |
| source_context_score     | 来源是否与某类内容稳定相关   |
| time_context_score       | 是否属于近期活跃项目      |

---

### 8.6 关系生成 Link

自动落库的重点不是“放进文件夹”，而是建立关系。

关系候选来源：

| 来源          | 关系类型           |
| ----------- | -------------- |
| Markdown 链接 | reference      |
| 相同项目        | parent_child   |
| 相同标签        | tag_related    |
| 内容相似        | semantic       |
| 同一来源        | source_related |
| 同一时间段       | temporal       |
| 用户手动拖动      | user_confirmed |
| 系统推荐        | suggested      |

关系评分：

```text
edge_confidence =
explicit_link_score * 0.3
+ semantic_score * 0.25
+ shared_project_score * 0.2
+ shared_tag_score * 0.1
+ time_score * 0.05
+ user_behavior_score * 0.1
```

规则：

1. 用户手动建立的关系优先级最高。
2. Markdown 明确链接优先级高于语义相似。
3. 系统推荐关系默认不等于用户确认关系。
4. 低置信度关系不能强行展示成强线。
5. 每条系统关系必须保存 evidence，方便用户理解为什么关联。

---

### 8.7 自动落库防翻车机制

自动落库最怕两件事：

1. 系统乱归类。
2. 用户不知道系统为什么这么归类。

因此必须设计防翻车机制。

#### 机制一：三段式归档

| 置信度 | 状态   | 用户感受      |
| --- | ---- | --------- |
| 高   | 自动锚定 | 系统直接放好    |
| 中   | 建议归档 | 系统推荐，用户确认 |
| 低   | 漂浮星辰 | 系统先接住，不乱动 |

#### 机制二：所有自动行为可撤销

每次自动落库写入：

```json
{
  "event_type": "auto_landing",
  "target_id": "doc_xxx",
  "before": {},
  "after": {},
  "reason": [],
  "created_at": ""
}
```

用户可以 Undo：

```http
POST /api/graph-events/{event_id}/rollback
```

#### 机制三：用户修正会反哺规则

如果用户把 A 从“技术”拖到“产品”，系统记录：

```json
{
  "action": "move_node",
  "from_cluster": "技术",
  "to_cluster": "产品",
  "content_keywords": ["路线图", "用户反馈", "需求"],
  "confirmed": true
}
```

后续类似内容提高“产品”归属权重。

#### 机制四：批量导入不立即全量入图

批量导入时：

1. 先进入 Import Staging。
2. 解析和标准化。
3. 去重。
4. 分批生成临时星群。
5. 显示导入预览。
6. 用户确认后再正式锚定。
7. 大批量数据分批布局，不一次性重排整个 Mind。

#### 机制五：系统推荐必须有解释

每个建议归档都要提供原因：

```text
推荐归入「Atlax Phase 3」
原因：
- 标题命中 “Phase 3”
- 内容包含 “结构化 / 星云树 / Dock”
- 与 12 篇已有文档相似
- 最近 7 天该项目活跃
```

---

## 9. 批量导入结构化设计

批量导入是后续增长的关键。
如果用户从 Obsidian / Notion / 微信收藏 / B站学习资料导入大量内容，系统不能卡死，也不能把 Mind 搞成垃圾场。

### 9.1 导入流程

```text
Create Import Job
  ↓
Scan Files / Links
  ↓
Parse Source
  ↓
Convert to AUD
  ↓
Deduplicate
  ↓
Extract Metadata
  ↓
Generate Candidate Clusters
  ↓
Preview
  ↓
Confirm
  ↓
Batch Persist
  ↓
Incremental Layout
```

---

### 9.2 ImportJob 表

```sql
CREATE TABLE import_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  status TEXT NOT NULL,
  total_count INTEGER DEFAULT 0,
  parsed_count INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  options_json TEXT,
  error_log TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

### 9.3 ImportItem 表

```sql
CREATE TABLE import_items (
  id TEXT PRIMARY KEY,
  import_job_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  raw_path TEXT,
  raw_url TEXT,
  raw_title TEXT,
  raw_content_hash TEXT,
  aud_json TEXT,
  status TEXT NOT NULL,
  matched_document_id TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

### 9.4 去重规则

```text
dedupe_score =
content_hash_match * 0.5
+ title_similarity * 0.2
+ source_url_match * 0.2
+ created_time_similarity * 0.1
```

| 分数        | 行为          |
| --------- | ----------- |
| >= 0.9    | 判定重复，不重复导入  |
| 0.7 - 0.9 | 标记可能重复，用户确认 |
| < 0.7     | 正常导入        |

---

### 9.5 Obsidian 导入

支持内容：

| Obsidian 内容 | Atlax 映射                      |
| ----------- | ----------------------------- |
| Markdown 文件 | Document                      |
| 文件夹         | Project / Topic / Source Path |
| Frontmatter | Document Properties           |
| `[[双链]]`    | MindEdge reference            |
| Tag         | Tag Node                      |
| 图片附件        | Asset                         |
| Canvas      | 后续支持，先作为 Asset / Document     |
| Daily Notes | Time Anchor                   |

Obsidian 的双向链接、出链、反链、图谱是其核心知识管理能力之一，Atlax 在导入时必须优先保留这些明确关系，而不是只导入纯文本。

---

### 9.6 Notion 导入

支持内容：

| Notion 内容         | Atlax 映射               |
| ----------------- | ---------------------- |
| Page              | Document               |
| Block             | Block                  |
| Database          | Collection / Dock View |
| Database Property | Document Property      |
| Relation          | MindEdge               |
| Tag / Select      | Tag Node               |
| Sub-page          | Parent-child Edge      |
| Attachment        | Asset                  |
| Exported Markdown | Document Markdown      |
| Exported CSV      | Collection Data        |

Notion 导入时不能完全照搬数据库结构。
必须转换为 Atlax 的统一结构：

```text
Notion Database
  ↓
Atlax Collection
  ↓
Documents + Properties + Mind Nodes
```

---

### 9.7 中国大陆信息流导入

Atlax 不能只服务“写 Markdown 的人”。
必须支持真实中文互联网内容流。

#### 微信

| 内容     | 接入方式              |
| ------ | ----------------- |
| 公众号文章  | URL / 手动分享 / 网页剪藏 |
| 微信聊天片段 | 用户复制粘贴            |
| 收藏内容   | 后续通过手动导入          |
| 图片     | OCR 后续支持          |

#### 小红书

| 内容           | 接入方式              |
| ------------ | ----------------- |
| 笔记链接         | URL Metadata      |
| 标题 / 正文 / 标签 | 用户分享或手动粘贴         |
| 图片           | Asset / OCR Later |
| 评论           | 暂不支持              |

#### 抖音

| 内容           | 接入方式         |
| ------------ | ------------ |
| 视频链接         | URL Metadata |
| 标题 / 作者 / 描述 | Metadata     |
| 字幕           | 后续支持         |
| 视频本体         | 不保存，保存引用     |

#### B站

| 内容             | 接入方式                      |
| -------------- | ------------------------- |
| 视频链接           | URL Metadata              |
| 标题 / UP 主 / 简介 | Metadata                  |
| 字幕             | 后续支持                      |
| 分 P / 合集       | Collection / Source Group |
| 学习笔记           | Document                  |

设计原则：

1. 优先保存“用户主动输入或导入”的内容。
2. 不承诺全平台自动抓取。
3. 不绕过平台权限。
4. 保存链接、标题、摘要、用户笔记、来源信息。
5. 把外部内容变成 Atlax 中的 Source Node + Document Node。

---

## 10. 后端数据结构设计

推荐本阶段使用本地优先数据库。

本地 Demo 可使用：

```text
SQLite + FTS5 + JSON 字段
```

后续云端可迁移到：

```text
PostgreSQL + pgvector + object storage
```

---

### 10.1 users

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'zh-CN',
  timezone TEXT DEFAULT 'Asia/Shanghai',
  plan TEXT DEFAULT 'free',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

### 10.2 workspaces

```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mode TEXT DEFAULT 'local',
  root_node_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

### 10.3 documents

```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL,
  markdown TEXT,
  plain_text TEXT,
  block_json TEXT,
  properties_json TEXT,
  source_type TEXT DEFAULT 'manual',
  source_url TEXT,
  source_ref_id TEXT,
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  content_hash TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_opened_at TEXT
);
```

字段说明：

| 字段              | 含义                                                |
| --------------- | ------------------------------------------------- |
| markdown        | 长期资产格式                                            |
| plain_text      | 搜索和算法输入                                           |
| block_json      | 编辑器结构                                             |
| properties_json | 属性、状态、标签、项目                                       |
| source_type     | 内容来源                                              |
| content_hash    | 去重                                                |
| status          | draft / captured / suggested / archived / deleted |

---

### 10.4 document_blocks

```sql
CREATE TABLE document_blocks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  parent_block_id TEXT,
  block_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  markdown TEXT,
  text TEXT,
  attrs_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

Block 类型：

```text
paragraph
heading
bullet_list
ordered_list
todo
quote
code
table
image
file
callout
divider
embed
math
bookmark
toggle
block_reference
```

---

### 10.5 assets

```sql
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  document_id TEXT,
  asset_type TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  local_path TEXT,
  remote_url TEXT,
  hash TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);
```

---

### 10.6 mind_nodes

```sql
CREATE TABLE mind_nodes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  document_id TEXT,
  node_type TEXT NOT NULL,
  graph_state TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  summary TEXT,
  color_key TEXT,
  icon_key TEXT,
  weight REAL DEFAULT 1,
  importance_score REAL DEFAULT 0,
  activity_score REAL DEFAULT 0,
  confidence_score REAL DEFAULT 0,
  cluster_id TEXT,
  parent_node_id TEXT,
  source_type TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_visited_at TEXT
);
```

---

### 10.7 mind_edges

```sql
CREATE TABLE mind_edges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  direction TEXT DEFAULT 'undirected',
  confidence REAL DEFAULT 0,
  strength REAL DEFAULT 0,
  status TEXT NOT NULL,
  evidence_json TEXT,
  created_by TEXT DEFAULT 'system',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

relation_type：

```text
parent_child
reference
backlink
semantic
tag_related
project_related
source_related
temporal
manual
suggested
conflict
```

status：

```text
suggested
confirmed
rejected
hidden
```

---

### 10.8 clusters

```sql
CREATE TABLE clusters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  cluster_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  center_node_id TEXT,
  color_key TEXT,
  confidence REAL DEFAULT 0,
  node_count INTEGER DEFAULT 0,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

cluster_type：

```text
domain
project
topic
source
time
import_batch
temporary
```

---

### 10.9 graph_layouts

```sql
CREATE TABLE graph_layouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  layout_scope TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  z REAL DEFAULT 0,
  vx REAL DEFAULT 0,
  vy REAL DEFAULT 0,
  pinned INTEGER DEFAULT 0,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

### 10.10 captures

```sql
CREATE TABLE captures (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  capture_type TEXT NOT NULL,
  status TEXT NOT NULL,
  source_type TEXT DEFAULT 'mind_input',
  generated_document_id TEXT,
  generated_node_id TEXT,
  analysis_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

capture_type：

```text
quick_text
mind_star
chat_message
clipboard
web_clip
voice
image
```

---

### 10.11 graph_events

```sql
CREATE TABLE graph_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  reason_json TEXT,
  reversible INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);
```

用途：

1. 记录自动落库。
2. 记录用户拖拽。
3. 记录自动连线。
4. 支持撤销。
5. 训练用户偏好。

---

### 10.12 graph_signals

```sql
CREATE TABLE graph_signals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  target_node_id TEXT,
  target_document_id TEXT,
  severity TEXT,
  title TEXT NOT NULL,
  description TEXT,
  data_json TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

后续 Review 使用。

signal_type：

```text
orphan_node
stale_document
missing_link
repeated_topic
project_stalled
weekly_summary
question_prompt
```

---

## 11. API 设计

### 11.1 Capture

```http
POST /api/captures
```

请求：

```json
{
  "raw_text": "下周产品评审会议，需要准备 Q2 路线图和用户反馈数据",
  "capture_type": "mind_star",
  "source_type": "mind_input"
}
```

响应：

```json
{
  "capture_id": "cap_001",
  "document_id": "doc_001",
  "node_id": "node_001",
  "landing": {
    "status": "suggested",
    "confidence": 0.72,
    "candidate_cluster_id": "cluster_phase3",
    "reason": [
      "命中关键词：产品评审",
      "与 Atlax Phase 3 最近文档相似",
      "近期该项目活跃"
    ]
  }
}
```

---

### 11.2 Mind Graph

```http
GET /api/mind/graph?scope=global
```

响应：

```json
{
  "nodes": [],
  "edges": [],
  "clusters": [],
  "layout": {
    "version": "layout_v1",
    "scope": "global"
  }
}
```

---

### 11.3 Node Detail

```http
GET /api/mind/nodes/{node_id}
```

返回：

```json
{
  "node": {},
  "document": {},
  "relations": {
    "incoming": [],
    "outgoing": [],
    "suggested": []
  },
  "dock_path": [],
  "signals": []
}
```

---

### 11.4 Manual Link

```http
POST /api/mind/edges
```

请求：

```json
{
  "source_node_id": "node_a",
  "target_node_id": "node_b",
  "relation_type": "manual",
  "status": "confirmed"
}
```

---

### 11.5 Drag Landing

```http
POST /api/mind/nodes/{node_id}/land
```

请求：

```json
{
  "target_node_id": "node_project_phase3",
  "relation_type": "parent_child",
  "user_confirmed": true
}
```

---

### 11.6 Layout Update

```http
PATCH /api/mind/nodes/{node_id}/layout
```

请求：

```json
{
  "x": 120.4,
  "y": -80.2,
  "z": 0.2,
  "pinned": true
}
```

---

### 11.7 Dock Query

```http
GET /api/dock/items?view=list&status=archived&sort=updated_desc
```

响应：

```json
{
  "items": [],
  "facets": {
    "projects": [],
    "tags": [],
    "sources": [],
    "statuses": []
  }
}
```

---

### 11.8 Finder Columns

```http
GET /api/dock/finder?root=projects
```

响应：

```json
{
  "columns": [
    {
      "level": 0,
      "items": []
    },
    {
      "level": 1,
      "items": []
    },
    {
      "level": 2,
      "items": []
    }
  ],
  "preview": {}
}
```

---

### 11.9 Editor Save

```http
PUT /api/documents/{document_id}
```

请求：

```json
{
  "title": "Atlax Phase 3 结构设计",
  "markdown": "",
  "block_json": {},
  "plain_text": "",
  "properties_json": {}
}
```

保存后触发：

```text
document_saved
  ↓
extract signals
  ↓
update node
  ↓
update edges
  ↓
refresh Mind / Dock
```

---

### 11.10 Import Job

```http
POST /api/import/jobs
```

请求：

```json
{
  "source_type": "obsidian",
  "options": {
    "preserve_folder_structure": true,
    "preserve_tags": true,
    "preserve_links": true,
    "staging_first": true
  }
}
```

---

## 12. Dock 与 Mind 打通设计

Dock 不是另一个页面。
Dock 是 Mind 的结构化管理界面。

### 12.1 Dock 三种视图

#### List View

适合批量管理。

字段：

| 字段      | 含义   |
| ------- | ---- |
| Title   | 文档标题 |
| Status  | 状态   |
| Project | 所属项目 |
| Cluster | 所属星群 |
| Tags    | 标签   |
| Source  | 来源   |
| Updated | 更新时间 |
| Links   | 关系数量 |
| Health  | 健康状态 |

支持操作：

1. 批量归档。
2. 批量改项目。
3. 批量打标签。
4. 批量确认建议关系。
5. 批量隐藏弱关系。
6. 批量删除。
7. 批量导出。

---

#### Card View

适合浏览。

卡片内容：

```text
Title
Summary
Source Badge
Project Badge
Tags
Last Updated
Mini Relation Count
```

卡片 hover：

1. 显示 Mind 小预览。
2. 显示最近关联节点。
3. 显示快速打开 Editor。
4. 显示定位到 Mind。

---

#### Finder Column View

这是最适合 Atlax 的管理视图。
它同时吸收 Notion 的组织感和 macOS Finder 的空间感。

默认列：

```text
Column 1: Space
  - Projects
  - Topics
  - Sources
  - Dates
  - Tags
  - Unsorted

Column 2: Group
  - Atlax
  - Java
  - 产品设计
  - 微信导入
  - B站学习

Column 3: Documents
  - 文档列表

Column 4: Preview
  - 文档摘要
  - 关联关系
  - Mind 定位按钮
```

点击行为：

| 操作                     | 结果                 |
| ---------------------- | ------------------ |
| 点击 Project             | Mind 聚焦项目星群        |
| 点击 Topic               | Mind 聚焦主题星群        |
| 点击 Document            | Editor 打开文档        |
| Hover Document         | Mind 中节点轻微闪烁       |
| 拖动 Document 到 Project  | 建立 parent_child 关系 |
| 拖动 Document 到 Topic    | 建立 topic 关系        |
| 拖动 Document 到 Unsorted | 取消归档关系             |

---

### 12.2 Dock 和 Mind 状态同步

前端需要一个共享状态：

```ts
type WorkspaceSelection = {
  selectedNodeId?: string
  selectedDocumentId?: string
  selectedClusterId?: string
  focusMode: 'global' | 'cluster' | 'node'
  source: 'mind' | 'dock' | 'editor'
}
```

同步规则：

| 来源          | 行为          |
| ----------- | ----------- |
| Mind 选中节点   | Dock 定位对应项  |
| Dock 选中文档   | Mind 高亮节点   |
| Editor 保存文档 | Mind 更新节点亮度 |
| Dock 批量修改   | Mind 重新计算星群 |
| Mind 建立连线   | Dock 更新关系字段 |

---

## 13. Editor 编辑体验设计

Editor 必须成为产品第二核心。
结构再美，如果编辑难用，用户还是不会留下。

### 13.1 编辑器双模式

| 模式               | 名称          | 面向用户                           |
| ---------------- | ----------- | ------------------------------ |
| Classic Markdown | 经典 Markdown | Obsidian 用户、开发者、重度 Markdown 用户 |
| Block Markdown   | 块级 Markdown | Notion 用户、普通用户、结构化记录用户         |

两个模式不是两套数据。

底层统一：

```text
Block JSON
  ↕
Markdown
  ↕
Plain Text
```

---

### 13.2 Classic Markdown 功能

必须支持：

1. 标题 H1-H6。
2. 粗体、斜体、删除线。
3. 无序列表、有序列表。
4. Todo checkbox。
5. 引用。
6. 代码块。
7. Inline code。
8. 表格。
9. 分割线。
10. 数学公式。
11. Callout。
12. 图片。
13. 附件。
14. 内链。
15. 外链。
16. 块引用。
17. Frontmatter。
18. 实时预览。
19. 源码模式。
20. 大纲。
21. 查找替换。
22. 字数统计。
23. 自动保存。
24. 版本历史。

---

### 13.3 Block Markdown 功能

必须支持：

1. Slash Command。
2. 拖动块。
3. 块级菜单。
4. 块复制。
5. 块删除。
6. 块折叠。
7. Toggle。
8. Callout。
9. Todo。
10. 表格。
11. 图片。
12. 文件。
13. Bookmark。
14. Embed。
15. Block Reference。
16. 属性面板。
17. 模板插入。
18. AI / Chat 预留操作入口。
19. Convert to Document。
20. Convert to Node。

---

### 13.4 编辑器和 Mind 的联动

保存文档后：

```text
Editor Save
  ↓
Update Document
  ↓
Extract Plain Text
  ↓
Update Mind Node
  ↓
Recompute Relations
  ↓
Refresh Dock
```

编辑器侧边可显示：

| 面板           | 用途           |
| ------------ | ------------ |
| Properties   | 项目、标签、状态、来源  |
| Links        | 出链、反链        |
| Mind Preview | 当前文档在星云树中的位置 |
| Suggestions  | 系统推荐关联       |
| History      | 版本历史         |

---

### 13.5 编辑器技术建议

可以选择基于 ProseMirror / Tiptap / Lexical 这类结构化编辑器内核实现。
ProseMirror 的核心思路是文档模型、事务、Schema、插件系统；这类模型更适合实现 Block 编辑、Markdown 序列化、实时预览和扩展能力。

建议优先级：

```text
第一选择：Tiptap / ProseMirror
第二选择：Lexical
第三选择：自研 textarea + parser，不推荐作为长期方案
```

原因：

1. 不要自己从 0 写复杂编辑器。
2. 编辑器是深坑，必须站在成熟内核上。
3. 自研只适合做 UI 层，不适合自研文档模型。
4. Markdown 序列化必须稳定，否则长期资产会出问题。

---

## 14. Chat 接入设计

Chat 是主线功能之一，但当前不应该喧宾夺主。
Chat 必须符合星云树概念，而不是像普通客服聊天框一样贴在页面上。

### 14.1 Chat 产品定位

Chat 在 Atlax 中应该叫：

```text
Oracle / 星核对话 / Mind Chat
```

它不是和用户闲聊，而是基于知识库上下文帮助用户：

1. 解释当前节点。
2. 总结某个星群。
3. 找出缺失关系。
4. 向用户提出反问。
5. 生成周报。
6. 帮助输出文章。
7. 帮助整理导入内容。
8. 帮助判断文档应该落到哪里。

---

### 14.2 Chat 入口

入口位置：

1. 右侧浮动工具栏。
2. 节点详情面板。
3. Editor 内选中文本后呼出。
4. Dock 批量选择后呼出。

---

### 14.3 MVP 无 LLM 方案

当前不接大模型，也可以先做“模板化 Chat”。

示例：

| 场景     | 系统回复                            |
| ------ | ------------------------------- |
| 点击孤立节点 | “这条内容暂时没有关联，要不要把它放入某个项目？”       |
| 项目停滞   | “这个项目 7 天没有新增内容，是否需要复盘？”        |
| 重复主题   | “你最近多次记录了‘星云树’，是否需要创建一个主题节点？”   |
| 导入完成   | “已导入 42 条内容，其中 12 条建议归入 Atlax。” |

---

### 14.4 后续 LLM 接入

Chat 需要基于 Graph Context，而不是把所有文档塞进 prompt。

上下文结构：

```json
{
  "current_node": {},
  "neighbor_nodes": [],
  "related_documents": [],
  "cluster_summary": {},
  "user_question": "",
  "system_task": "explain | summarize | suggest_links | ask_question | weekly_review"
}
```

---

## 15. Review 与小组件的预留设计

Review 和小组件是合伙人明确需求，但不是本阶段主交付。

处理策略：

1. 保留浮动工具入口。
2. 不进入顶部主导航。
3. 不占用主工作区。
4. 不影响 Editor / Mind / Dock。
5. 所需数据通过 `graph_signals` 预留。

### 15.1 Review 后续模块

| 模块   | 数据来源                     |
| ---- | ------------------------ |
| 周报   | documents + graph_events |
| 健康检查 | graph_signals            |
| 停滞项目 | activity_score           |
| 孤立节点 | edge count               |
| 重复主题 | topic frequency          |
| 反问用户 | question_prompt          |

---

### 15.2 Widget 后续模块

| 小组件          | 数据来源             |
| ------------ | ---------------- |
| Calendar     | timeline_anchors |
| Todo         | todo blocks      |
| Recent Stars | captures         |
| Health       | graph_signals    |
| Weekly Focus | active projects  |

---

## 16. 订阅付费能力预留

免费版不能太残废，否则用户不愿意用。
付费版应该卖“自动化、智能化、大规模处理、高级洞察”，不是卖基础编辑。

### 16.1 Free

适合个人轻量使用。

包含：

1. 本地文档编辑。
2. Classic Markdown。
3. Block Markdown 基础功能。
4. Mind 基础星云树。
5. Dock List / Card / Finder。
6. 手动创建关系。
7. 少量导入。
8. 基础搜索。
9. 本地导出 Markdown。

---

### 16.2 Pro

适合重度知识工作者。

包含：

1. 高级自动落库。
2. 批量导入。
3. Obsidian / Notion 结构保留导入。
4. 中国大陆信息流导入增强。
5. 高级 Mind 布局。
6. Time Machine。
7. Review 周报。
8. 知识库健康检查。
9. Chat with Knowledge Base。
10. 版本历史增强。
11. 高级导出。
12. 多设备同步。

---

### 16.3 Creator / Team 后续

包含：

1. 多知识宇宙。
2. 协作星云树。
3. 共享 Dock。
4. 团队知识健康报告。
5. 权限管理。
6. 高级 AI Agent。
7. API 接入。
8. 自动发布。

---

## 17. 本阶段明确不做

为了避免再次变成粗糙大杂烩，本阶段不做：

1. 浅色模式。
2. 完整 Review 页面。
3. 完整小组件系统。
4. 多人协作。
5. 云同步。
6. 复杂权限系统。
7. 移动端。
8. 完整 AI Agent。
9. 全平台自动爬取。
10. 复杂任务管理。
11. 类 Notion 全量数据库系统。
12. 类 Obsidian 插件生态。
13. 花哨但无结构意义的动效。

本阶段只做：

```text
Editor 写得舒服
Mind 看得高级
Dock 管得清楚
自动落库跑得稳
```

---

## 18. 开发落地路线

### Phase A：数据骨架重建

目标：先把结构层建稳。

交付：

1. 新增 `documents`。
2. 新增 `document_blocks`。
3. 新增 `mind_nodes`。
4. 新增 `mind_edges`。
5. 新增 `clusters`。
6. 新增 `graph_layouts`。
7. 新增 `captures`。
8. 新增 `graph_events`。
9. 完成 Capture → Document → Node 的最小链路。
10. 完成 Node / Edge API。

验收标准：

1. Mind 输入一句话，可以生成 document + node。
2. Dock 能看到该文档。
3. Mind 能看到该节点。
4. Editor 能打开该文档。
5. 删除或修改文档后 Mind 同步变化。

---

### Phase B：Mind 视觉重构

目标：把 Mind 从“节点图”升级为“星云树”。

交付：

1. 重写节点视觉。
2. 重写连线视觉。
3. 增加星群雾区。
4. 增加 LOD 显示。
5. 增加 Focus Mode。
6. 增加节点 hover / click / drag。
7. 增加节点详情浮层。
8. 增加自动落库反馈动画。
9. 增加布局缓存。
10. 增加局部布局更新。

验收标准：

1. 默认视图不乱。
2. 节点大小有层级。
3. 连线不粗糙。
4. hover 后关系清楚。
5. 点击节点有聚焦感。
6. 拖动节点不会破坏整体布局。
7. 新星辰进入时有“落入宇宙”的感觉。

---

### Phase C：Dock 重构

目标：Dock 成为知识库 Finder。

交付：

1. List View。
2. Card View。
3. Finder Column View。
4. Dock 与 Mind selection 同步。
5. Dock 批量操作。
6. Dock 筛选和排序。
7. Dock 预览面板。
8. Dock 定位 Mind。
9. Mind 定位 Dock。

验收标准：

1. 用户能在 Dock 中管理所有文档。
2. 用户能通过 Finder 分栏理解知识结构。
3. 用户能从 Dock 快速跳到 Mind。
4. 用户能从 Mind 快速定位 Dock。
5. 不再需要 Entry 模块。

---

### Phase D：Editor 重构

目标：编辑器达到可长期使用标准。

交付：

1. Classic Markdown。
2. Block Markdown。
3. 实时预览。
4. Slash Command。
5. Block 拖拽。
6. Markdown 导入导出。
7. Properties 面板。
8. Links 面板。
9. Editor 保存触发结构化。
10. Editor 与 Mind 节点同步。

验收标准：

1. 用户愿意真的用它写东西。
2. Markdown 渲染不丑。
3. Block 编辑不割裂。
4. 保存后 Mind 自动更新。
5. 文档能稳定导出为 Markdown。

---

### Phase E：自动落库 MVP

目标：自动落库可用但不冒进。

交付：

1. 关键词抽取。
2. 项目匹配。
3. 标签匹配。
4. 主题匹配。
5. 来源识别。
6. 置信度计算。
7. 三段式落库。
8. 用户确认。
9. 撤销。
10. 用户修正反哺。

验收标准：

1. 高置信内容能自动落入正确项目。
2. 中置信内容能给出合理建议。
3. 低置信内容不会乱归类。
4. 用户可以一键修正。
5. 修正后同类内容推荐更准。

---

### Phase F：导入预备

目标：为 Obsidian / Notion / 中文信息流导入打基础。

交付：

1. ImportJob。
2. ImportItem。
3. AUD 转换格式。
4. Markdown 文件导入。
5. URL 手动导入。
6. 导入预览。
7. 去重。
8. 批量落库 staging。

验收标准：

1. 能导入 Markdown 文件夹。
2. 能保留基础链接。
3. 能生成临时星群。
4. 不会一次导入就污染主 Mind。
5. 用户确认后才正式入库。

---

## 19. 核心体验验收标准

### 19.1 第一眼体验

用户打开产品后，必须感受到：

1. 专业。
2. 深邃。
3. 安静。
4. 有空间感。
5. 不是玩具。
6. 不是普通笔记软件。
7. Mind 是产品灵魂。

---

### 19.2 输入体验

用户输入内容后，必须感受到：

1. 系统接住了。
2. 内容不是丢进黑洞。
3. 有一个星辰诞生。
4. 系统开始理解它。
5. 用户可以修正它。
6. 不需要先想文件夹和标签。

---

### 19.3 结构体验

用户进入 Mind 后，必须感受到：

1. 结构有秩序。
2. 关系能被理解。
3. 重点内容一眼可见。
4. 未整理内容不会污染主结构。
5. 节点可以探索。
6. 星群可以聚焦。
7. 不是 Obsidian 那种无序毛线球。

---

### 19.4 管理体验

用户进入 Dock 后，必须感受到：

1. 所有内容都能找到。
2. 可以像 Finder 一样浏览。
3. 可以像 Notion 一样管理属性。
4. 可以和 Mind 双向联动。
5. 不需要 Entry 模块。

---

### 19.5 编辑体验

用户进入 Editor 后，必须感受到：

1. 写 Markdown 舒服。
2. 看实时预览舒服。
3. Block 编辑不别扭。
4. 文档结构清楚。
5. 保存后自动进入知识系统。
6. 编辑不是孤立行为，而是在喂养 Mind。

---

## 20. 最终产品结构定义

Atlax MindDock 的最终结构应该是：

```text
Atlax MindDock
│
├── Editor
│   ├── Classic Markdown
│   ├── Block Markdown
│   ├── Properties
│   ├── Links
│   └── Mind Preview
│
├── Mind
│   ├── Nebula Tree
│   ├── Star Input
│   ├── Node Detail
│   ├── Focus Mode
│   ├── Drag Linking
│   └── Auto Landing Feedback
│
└── Dock
    ├── List View
    ├── Card View
    ├── Finder Column View
    ├── Batch Management
    ├── Import Staging
    └── Mind Sync
```

后续扩展：

```text
Floating Tools
├── Chat
├── Review
├── Calendar
├── Time Machine
└── Widgets
```

这才是 MindDock 应该有的骨架。

不是：

```text
一堆页面 + 一个编辑框 + 一个图谱
```

而是：

```text
编辑产生内容
内容进入结构
结构形成星云
星云反过来帮助用户管理和思考
```

---

## 21. 一句话执行原则

后续所有功能都必须通过这句话判断是否值得做：

> 这个功能是否能让用户更容易输入内容、更清楚看见结构、更稳定沉淀知识？

如果不能，就暂时不要做。
