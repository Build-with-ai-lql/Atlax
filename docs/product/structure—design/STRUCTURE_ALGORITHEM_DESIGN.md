# Atlax MindDock 本地化结构算法设计文档

```
本地算法定义说明：
必须把“90%精准度”定义清楚：不是冷启动时就像大模型一样“什么都懂”，而是**在用户有足够记录数据后，系统给出的 Top-3 落库/链接/编辑/Review/Chat 引导建议中，用户接受或轻微修正后接受的比例达到 90% 左右**。冷启动阶段只能做到“合理”，数据积累后才能做到“很准”。下面这版基于当前 `STRUCTURE_DESIGN` 里已经确定的三主模块、取消 Entry、Mind 默认主视图、Dock 直连知识库、Chat/Classic 共用知识库与规则优先路线继续深化。
```

版本：v0.2
适用阶段：第二版 Demo / Nebula Tree 重构阶段
核心目标：在不接入 LLM 的情况下，通过本地结构算法支撑自动落库、链接推荐、编辑辅助、Review、Chat 引导、导入归类与查询推荐。
主线模块：Editor / Mind / Dock
核心产品灵魂：星云树 Nebula Tree
算法原则：本地优先、结构优先、轻量高性能、可解释、可修正、可持续学习。

---

## 1. 可行性结论

本方案可以实现。

但需要明确一点：所谓“无限接近大模型推荐策略”，不能理解为本地算法具备大模型的开放语义理解能力，而是通过以下方式逼近大模型在知识管理场景中的推荐效果：

1. 用户行为数据长期积累。
2. 内容结构元数据足够完整。
3. 本地文本特征、时间特征、图关系特征、行为习惯特征共同参与计算。
4. 所有推荐都保留用户反馈，持续修正用户偏好。
5. 不追求“一次性绝对判断”，而追求“Top-K 推荐中高概率命中”。
6. 推荐结果必须可解释、可撤销、可修正。
7. 算法不伪装成人类智能，而是成为用户知识结构的本地导航系统。

因此，本阶段算法目标不是“创造一个本地大模型”，而是构建一个：

> 基于个人知识图谱 + 行为习惯 + 时间节律 + 内容结构 + 反馈闭环的本地推荐系统。

更准确地说，Atlax 的非 LLM 算法应该是：

> 一个面向个人知识库的 Local Personal Knowledge Intelligence Engine。

中文可称为：

> 本地个人知识智能引擎。

---

## 2. 精准度定义

算法不能只说“精准”，必须定义指标。

### 2.1 推荐精准度定义

本产品中的“精准度”不指搜索引擎式的完全匹配，也不指大模型式自由回答，而指以下指标：

| 指标 | 含义 | 目标 |
|---|---|---|
| Top-1 Accept Rate | 第一推荐被用户直接接受的比例 | 成熟用户 65%+ |
| Top-3 Accept Rate | 前三推荐中至少一个被接受的比例 | 成熟用户 90%+ |
| Correction Distance | 用户修正幅度 | 越低越好 |
| Reject Rate | 用户完全拒绝推荐的比例 | 越低越好 |
| Silent Success Rate | 系统自动落库后用户不修改的比例 | 成熟用户 75%+ |
| Explanation Trust Rate | 用户认为解释合理的比例 | 80%+ |
| Recovery Rate | 错误推荐被用户修正后下次不再重复的比例 | 90%+ |

### 2.2 用户数据阶段划分

算法效果与数据量强相关，因此需要按用户数据阶段区分能力。

| 阶段 | 数据量 | 算法状态 | 可承诺效果 |
|---|---:|---|---|
| 冷启动 | 0 - 30 条记录 | 主要依赖规则、时间、显式标签 | 只能给基础建议 |
| 初步学习 | 30 - 150 条记录 | 开始学习主题、来源、习惯 | 推荐开始稳定 |
| 稳定学习 | 150 - 500 条记录 | 图谱和行为信号可用 | Top-3 明显提升 |
| 成熟知识库 | 500+ 条记录 | 结构、习惯、周期都成形 | Top-3 可冲击 90% |
| 高密度知识库 | 2000+ 条记录 | 可做长期趋势、复用、Review | 可形成明显产品壁垒 |

结论：

> 90% 精准度不能承诺给冷启动用户，只能承诺给已经形成一定记录规模的成熟用户。

这不是缺点，这是诚实。
冷启动阶段应该靠低打扰、可解释、可修正来建立信任，而不是强行装聪明。

---

## 3. 算法总体架构

### 3.1 总体结构

```text
User Input / Import / Editor / Dock Action / Mind Action
        ↓
Ingestion Layer
        ↓
Feature Extraction Layer
        ↓
Local Index Layer
        ↓
Graph Intelligence Layer
        ↓
Recommendation Engine
        ↓
Ranking & Explanation Layer
        ↓
UI Delivery Layer
        ↓
User Feedback Loop
        ↓
Preference Update / Cache Update / Graph Update
````

### 3.2 核心算法模块

| 模块                          | 职责                             |
| --------------------------- | ------------------------------ |
| Ingestion Engine            | 接收 Editor、Mind、Dock、导入、Chat 输入 |
| Feature Extractor           | 提取文本、结构、时间、来源、行为特征             |
| Local Indexer               | 建立本地倒排索引、标签索引、时间索引、图索引         |
| Graph Builder               | 构建星云树节点、边、星群、权重                |
| Auto Landing Engine         | 自动落库推荐                         |
| Link Recommendation Engine  | 链接推荐                           |
| Import Mapping Engine       | 外部数据导入归类                       |
| Editor Assist Engine        | 编辑辅助与卡住提醒                      |
| Review Engine               | 周报、趋势、沉没内容、复用建议                |
| Chat Nudge Engine           | 本地化 Chat 引导消息推送                |
| Query Recommendation Engine | 查询建议与相关内容召回                    |
| Layout Intelligence Engine  | 支撑星云树结构清晰、美观、低混乱度              |
| Feedback Learning Engine    | 根据用户接受、修改、拒绝行为调整推荐权重           |

---

## 4. 数据采集原则

算法是否精准，首先取决于数据字段是否完整。

如果数据库只存标题、正文、标签，那么算法只能做到浅层推荐。

Atlax 必须保存以下几类数据：

1. 内容数据。
2. 结构数据。
3. 来源数据。
4. 用户行为数据。
5. 时间节律数据。
6. 编辑过程数据。
7. 推荐反馈数据。
8. 星云树交互数据。
9. 导入映射数据。
10. Chat 推送反馈数据。

本地结构优先策略下，用户数据可以在本地被充分分析，因此字段设计必须比普通笔记软件更完整。

---

## 5. 核心数据表设计

### 5.1 documents 文档表

```sql
CREATE TABLE documents (
  id                  VARCHAR(64) PRIMARY KEY,
  user_id             VARCHAR(64) NOT NULL,

  title               TEXT,
  content_markdown    TEXT,
  content_plain       TEXT,
  content_json        JSON,

  document_type       VARCHAR(32),
  status              VARCHAR(32),

  source_type         VARCHAR(32),
  source_id           VARCHAR(64),
  source_url          TEXT,
  source_platform     VARCHAR(64),

  primary_project_id  VARCHAR(64),
  primary_topic_id    VARCHAR(64),
  primary_cluster_id  VARCHAR(64),

  word_count          INT DEFAULT 0,
  block_count         INT DEFAULT 0,
  heading_count       INT DEFAULT 0,
  link_count          INT DEFAULT 0,
  media_count         INT DEFAULT 0,

  importance_score    DOUBLE DEFAULT 0,
  activity_score      DOUBLE DEFAULT 0,
  structure_score     DOUBLE DEFAULT 0,
  freshness_score     DOUBLE DEFAULT 0,

  created_at          TIMESTAMP,
  updated_at          TIMESTAMP,
  last_opened_at      TIMESTAMP,
  last_edited_at      TIMESTAMP,
  archived_at         TIMESTAMP
);
```

### 5.2 document_blocks 块表

Editor 必须支持 Classic Markdown 和 Block Markdown，两种模式不能割裂，所以底层必须以 block 作为结构基础。

```sql
CREATE TABLE document_blocks (
  id                  VARCHAR(64) PRIMARY KEY,
  document_id         VARCHAR(64) NOT NULL,

  block_type          VARCHAR(32),
  parent_block_id     VARCHAR(64),
  order_index         INT,

  markdown_text       TEXT,
  plain_text          TEXT,
  block_json          JSON,

  heading_level       INT,
  word_count          INT,
  has_task            BOOLEAN DEFAULT FALSE,
  task_status         VARCHAR(32),

  local_keywords      JSON,
  linked_node_ids     JSON,
  referenced_doc_ids  JSON,

  created_at          TIMESTAMP,
  updated_at          TIMESTAMP
);
```

### 5.3 captures 临时输入表

Capture 是所有快速输入、Mind 星辰输入、Chat 引导记录、导入碎片的统一入口。

```sql
CREATE TABLE captures (
  id                  VARCHAR(64) PRIMARY KEY,
  user_id             VARCHAR(64) NOT NULL,

  raw_text            TEXT NOT NULL,
  normalized_text     TEXT,
  capture_type        VARCHAR(32),

  input_surface       VARCHAR(32),
  input_context       JSON,

  status              VARCHAR(32),
  landing_state       VARCHAR(32),

  suggested_doc_id    VARCHAR(64),
  suggested_node_id   VARCHAR(64),
  suggested_cluster_id VARCHAR(64),

  confidence          DOUBLE DEFAULT 0,
  user_decision       VARCHAR(32),

  created_at          TIMESTAMP,
  processed_at        TIMESTAMP,
  confirmed_at        TIMESTAMP
);
```

推荐状态：

```text
raw
processing
suggested
anchored
rejected
manual_adjusted
archived
```

### 5.4 mind_nodes 星云节点表

```sql
CREATE TABLE mind_nodes (
  id                  VARCHAR(64) PRIMARY KEY,
  user_id             VARCHAR(64) NOT NULL,

  node_type           VARCHAR(32),
  node_status         VARCHAR(32),

  title               TEXT,
  summary             TEXT,

  document_id         VARCHAR(64),
  capture_id          VARCHAR(64),
  project_id          VARCHAR(64),
  topic_id            VARCHAR(64),
  cluster_id          VARCHAR(64),

  degree              INT DEFAULT 0,
  in_degree           INT DEFAULT 0,
  out_degree          INT DEFAULT 0,

  importance_score    DOUBLE DEFAULT 0,
  activity_score      DOUBLE DEFAULT 0,
  centrality_score    DOUBLE DEFAULT 0,
  confidence_score    DOUBLE DEFAULT 0,

  visual_size         DOUBLE,
  visual_color        VARCHAR(32),
  visual_depth        DOUBLE,

  x                   DOUBLE,
  y                   DOUBLE,
  z                   DOUBLE,

  pinned              BOOLEAN DEFAULT FALSE,
  hidden              BOOLEAN DEFAULT FALSE,

  created_at          TIMESTAMP,
  updated_at          TIMESTAMP,
  last_interacted_at  TIMESTAMP
);
```

### 5.5 mind_edges 星云连线表

```sql
CREATE TABLE mind_edges (
  id                  VARCHAR(64) PRIMARY KEY,
  user_id             VARCHAR(64) NOT NULL,

  source_node_id      VARCHAR(64) NOT NULL,
  target_node_id      VARCHAR(64) NOT NULL,

  edge_type           VARCHAR(32),
  relation_reason     VARCHAR(128),

  weight              DOUBLE DEFAULT 0,
  confidence          DOUBLE DEFAULT 0,
  user_confirmed      BOOLEAN DEFAULT FALSE,

  source              VARCHAR(32),
  explanation         TEXT,

  visible_level       INT DEFAULT 2,
  is_suggested        BOOLEAN DEFAULT FALSE,
  is_hidden           BOOLEAN DEFAULT FALSE,

  created_at          TIMESTAMP,
  updated_at          TIMESTAMP,
  confirmed_at        TIMESTAMP
);
```

### 5.6 clusters 星群表

```sql
CREATE TABLE clusters (
  id                  VARCHAR(64) PRIMARY KEY,
  user_id             VARCHAR(64) NOT NULL,

  name                TEXT,
  cluster_type        VARCHAR(32),

  center_node_id      VARCHAR(64),
  parent_cluster_id   VARCHAR(64),

  keyword_signature   JSON,
  tag_signature       JSON,
  source_signature    JSON,

  node_count          INT DEFAULT 0,
  density_score       DOUBLE DEFAULT 0,
  coherence_score     DOUBLE DEFAULT 0,
  activity_score      DOUBLE DEFAULT 0,

  visual_radius       DOUBLE,
  visual_color        VARCHAR(32),

  created_at          TIMESTAMP,
  updated_at          TIMESTAMP
);
```

### 5.7 user_behavior_events 用户行为事件表

```sql
CREATE TABLE user_behavior_events (
  id                  VARCHAR(64) PRIMARY KEY,
  user_id             VARCHAR(64) NOT NULL,

  event_type          VARCHAR(64),
  target_type         VARCHAR(64),
  target_id           VARCHAR(64),

  surface             VARCHAR(32),
  context             JSON,

  duration_ms         INT,
  before_state        JSON,
  after_state         JSON,

  created_at          TIMESTAMP
);
```

事件类型包括：

```text
document_created
document_opened
document_edited
document_archived
block_created
block_moved
node_clicked
node_dragged
node_linked
node_unlinked
recommendation_accepted
recommendation_rejected
recommendation_modified
dock_filter_used
dock_view_changed
mind_zoomed
mind_cluster_focused
chat_nudge_clicked
chat_nudge_dismissed
weekly_review_opened
import_confirmed
```

### 5.8 recommendation_events 推荐记录表

```sql
CREATE TABLE recommendation_events (
  id                  VARCHAR(64) PRIMARY KEY,
  user_id             VARCHAR(64) NOT NULL,

  recommendation_type VARCHAR(64),
  trigger_type        VARCHAR(64),
  trigger_id          VARCHAR(64),

  candidates          JSON,
  selected_candidate  JSON,

  score_breakdown     JSON,
  explanation         TEXT,

  status              VARCHAR(32),
  user_feedback       VARCHAR(32),
  feedback_detail     JSON,

  created_at          TIMESTAMP,
  resolved_at         TIMESTAMP
);
```

### 5.9 rhythm_profiles 用户节律表

```sql
CREATE TABLE rhythm_profiles (
  id                  VARCHAR(64) PRIMARY KEY,
  user_id             VARCHAR(64) NOT NULL,

  active_hours        JSON,
  active_weekdays     JSON,

  writing_frequency   DOUBLE,
  inspiration_frequency DOUBLE,
  review_frequency    DOUBLE,

  avg_session_minutes DOUBLE,
  avg_words_per_day   DOUBLE,

  topic_cycle         JSON,
  source_cycle        JSON,

  last_inspiration_at TIMESTAMP,
  last_deep_work_at   TIMESTAMP,
  last_review_at      TIMESTAMP,

  updated_at          TIMESTAMP
);
```

### 5.10 algorithm_cache 算法缓存表

```sql
CREATE TABLE algorithm_cache (
  id                  VARCHAR(64) PRIMARY KEY,
  user_id             VARCHAR(64) NOT NULL,

  cache_type          VARCHAR(64),
  cache_key           VARCHAR(255),

  cache_value         JSON,
  version             INT,

  expires_at          TIMESTAMP,
  created_at          TIMESTAMP,
  updated_at          TIMESTAMP
);
```

---



### 5.11 markdown_syntax_rules Markdown 语法规则表

```sql
CREATE TABLE markdown_syntax_rules (
  id VARCHAR(64) PRIMARY KEY,
  rule_key VARCHAR(64),
  trigger_text VARCHAR(64),
  block_type VARCHAR(32),
  template_text TEXT,
  priority_score DOUBLE DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
);
```

### 5.12 editor_suggestion_events 编辑器推荐事件表

```sql
CREATE TABLE editor_suggestion_events (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  document_id VARCHAR(64),
  suggestion_type VARCHAR(64),
  suggestion_payload JSON,
  accepted BOOLEAN,
  created_at TIMESTAMP
);
```

### 5.13 user_editor_habits 用户编辑习惯表

```sql
CREATE TABLE user_editor_habits (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  habit_key VARCHAR(64),
  score DOUBLE DEFAULT 0,
  updated_at TIMESTAMP
);
```


## 6. 特征工程设计

### 6.1 文本特征

不接 LLM 时，文本理解主要依赖轻量特征。

| 特征           | 用途          |
| ------------ | ----------- |
| 标题关键词        | 判断主题与归属     |
| 正文关键词        | 内容相似度       |
| 高频词          | 长期兴趣识别      |
| 低频重要词        | 专业概念识别      |
| Markdown 标题  | 文档结构识别      |
| 任务块          | 行动项识别       |
| 链接           | 外部引用关系      |
| 图片 / 视频 / 附件 | 内容来源与类型判断   |
| 中文分词 token   | 中文内容匹配      |
| 字符 n-gram    | 解决中文分词不稳定问题 |
| SimHash      | 快速近似去重      |
| MinHash      | 快速相似内容召回    |
| TF-IDF       | 本地关键词权重     |
| BM25         | 本地全文搜索排序    |

### 6.2 时间特征

| 特征       | 用途           |
| -------- | ------------ |
| 创建时间     | 判断记录场景       |
| 编辑时间     | 判断活跃内容       |
| 打开时间     | 判断复用价值       |
| 一天中的时间段  | 判断用户习惯       |
| 星期几      | 判断周期性        |
| 月份 / 季度  | Review 与长期趋势 |
| 距离上次记录时间 | 判断沉默、恢复、打断   |
| 周期性主题    | 判断长期关注点      |

### 6.3 行为特征

| 特征          | 用途        |
| ----------- | --------- |
| 用户常点的节点     | 判断关注主题    |
| 用户常修改的推荐    | 修正算法权重    |
| 用户常拒绝的标签    | 降低错误推荐    |
| 用户拖动建立的关系   | 高价值人工反馈   |
| 用户主动搜索的关键词  | 查询推荐      |
| 用户停留时间      | 判断内容重要性   |
| 用户反复打开的文档   | 判断长期价值    |
| 用户长时间未打开的内容 | Review 提醒 |
| 用户保存但不编辑的内容 | 判断导入收藏型内容 |
| 用户编辑中频繁删除   | 可能卡住或不确定  |

### 6.4 图谱特征

| 特征     | 用途         |
| ------ | ---------- |
| 节点度数   | 判断连接强度     |
| 中心性    | 判断核心主题     |
| 聚类密度   | 判断星群稳定性    |
| 孤立节点比例 | 判断落库质量     |
| 弱边数量   | 判断推荐质量     |
| 用户确认边  | 高置信结构      |
| 系统建议边  | 待验证结构      |
| 跨星群边   | 判断新洞察      |
| 冷却节点   | Review 激活  |
| 新增节点速度 | 判断用户近期记录密度 |

### 6.5 来源特征

| 来源          | 特征                           |
| ----------- | ---------------------------- |
| Obsidian    | 文件路径、frontmatter、双链、tag、标题层级 |
| Notion      | 页面层级、数据库属性、block 类型、创建时间     |
| 微信          | 聊天对象、收藏时间、链接标题、公众号来源         |
| 小红书         | 标题、正文、标签、作者、收藏时间、图片数量        |
| 抖音          | 视频标题、作者、收藏夹、音频、话题            |
| B站          | 视频标题、UP 主、分区、收藏夹、观看时间、简介     |
| 浏览器剪藏       | URL、域名、标题、选中文本、保存时间          |
| 本地 Markdown | 文件路径、标题、tag、修改时间             |

---



### 6.6 编辑器语法行为特征

| 特征 | 用途 |
|---|---|
| 高频标题结构 | 推荐标题层级 |
| 常用列表格式 | 推荐任务/清单 |
| 常用代码语言 | 推荐代码块语言 |
| 常用快捷键 | 个性化操作提示 |
| 常用链接对象 | 内链推荐 |
| 常用表格结构 | 表格模板推荐 |


## 7. 自动落库算法

### 7.1 自动落库目标

自动落库不是简单分类，而是回答四个问题：

1. 这条内容是什么？
2. 它应该进入哪个文档或节点？
3. 它和哪些已有内容有关？
4. 它在星云树中应该处于什么位置？

### 7.2 自动落库流程

```text
Input
  ↓
Normalize
  ↓
Extract Features
  ↓
Detect Type
  ↓
Find Candidate Containers
  ↓
Find Candidate Nodes
  ↓
Find Candidate Links
  ↓
Score Candidates
  ↓
Generate Landing Suggestion
  ↓
Create / Update Document
  ↓
Create / Update Mind Node
  ↓
Update Graph
  ↓
Update Dock
  ↓
Wait for Feedback
```

### 7.3 内容类型识别

```text
type_score =
keyword_pattern_score * 0.25
+ markdown_structure_score * 0.2
+ source_type_score * 0.2
+ time_context_score * 0.1
+ user_history_score * 0.25
```

类型候选：

```text
idea
note
task
project_log
meeting_note
reading_note
learning_note
life_record
inspiration
question
quote
resource
draft
review
```

### 7.4 候选容器召回

候选容器包括：

1. 已有文档。
2. 项目节点。
3. 主题节点。
4. 星群。
5. 标签。
6. 来源集合。
7. 时间集合。

召回策略：

```text
candidate_score =
keyword_similarity * 0.25
+ tag_similarity * 0.2
+ graph_proximity * 0.2
+ source_similarity * 0.1
+ time_context_similarity * 0.1
+ user_behavior_similarity * 0.15
```

### 7.5 落库置信度分级

|         置信度 | 行为                    |
| ----------: | --------------------- |
| 0.85 - 1.00 | 自动落库，并显示“已归入 xxx，可撤销” |
| 0.65 - 0.85 | 推荐落库，默认选中，等待用户确认      |
| 0.45 - 0.65 | 给出 2-3 个候选位置          |
| 0.25 - 0.45 | 作为漂浮星辰，进入待确认          |
| 0.00 - 0.25 | 保留原始记录，不强行结构化         |

### 7.6 自动落库解释

每次推荐都必须给出解释。

示例：

```text
推荐归入「Atlax 产品设计」
原因：
1. 内容中出现“星云树 / Dock / Editor”等高频关键词。
2. 你最近 7 天持续编辑该项目。
3. 该内容与项目下 5 个节点存在相似关键词。
4. 你过去 3 次类似内容都确认归入该项目。
```

解释必须简洁，不能像日志，也不能像算法论文。

---

## 8. 链接推荐算法

### 8.1 链接推荐目标

链接推荐不是把所有相似内容都连起来，而是找到“对用户有意义的关系”。

### 8.2 边类型推荐

| 边类型           | 推荐依据       |
| ------------- | ---------- |
| parent_child  | 项目 / 主题归属  |
| reference     | 文档中出现明确引用  |
| similar       | 内容相似       |
| temporal      | 同一周期内反复出现  |
| source        | 同来源或同导入批次  |
| continuation  | 内容是之前记录的延续 |
| contradiction | 内容与之前观点冲突  |
| inspiration   | 新内容由旧内容启发  |
| task_followup | 行动项后续记录    |

### 8.3 链接评分公式

```text
link_score =
text_similarity * 0.25
+ graph_distance_score * 0.2
+ tag_overlap_score * 0.15
+ temporal_score * 0.1
+ source_score * 0.1
+ user_history_score * 0.15
+ manual_signal_score * 0.05
```

### 8.4 链接显示原则

1. 默认只展示强链接。
2. 弱链接只在节点聚焦时展示。
3. 系统建议链接使用虚线。
4. 用户确认链接使用稳定实线。
5. 用户删除过的链接不应反复推荐。
6. 跨星群链接优先用于洞察推荐，不直接污染主结构。
7. 链接推荐必须控制数量，宁少勿乱。

### 8.5 推荐数量限制

| 场景          |       推荐数量 |
| ----------- | ---------: |
| 新建文档        |    3 - 5 条 |
| 新建碎片        |    1 - 3 条 |
| 导入批次        |   每条最多 3 条 |
| Editor 旁侧推荐 |      3 条以内 |
| Mind 节点详情   |      5 条以内 |
| Dock 批量整理   | 每项最多 3 个候选 |

---

## 9. Editor 编辑辅助算法

### 9.1 Editor 的算法定位

Editor 不是简单输入区域，而是结构生成的入口。

编辑辅助算法需要支持：

1. 自动识别当前文档主题。
2. 推荐已有相关节点。
3. 推荐可引用内容。
4. 用户卡住时给轻提示。
5. 识别任务、问题、灵感、总结。
6. 保存时自动更新星云树。
7. 编辑过程中不打扰用户。

### 9.2 卡住识别

```text
stuck_score =
idle_time_score * 0.25
+ repeated_delete_score * 0.2
+ cursor_stay_score * 0.15
+ unfinished_sentence_score * 0.15
+ low_progress_score * 0.15
+ historical_pattern_score * 0.1
```

触发条件：

```text
stuck_score > 0.72
AND 当前文档编辑时间 > 3 分钟
AND 最近 10 分钟未推送过同类提示
```

### 9.3 编辑提示类型

| 场景          | 提示                            |
| ----------- | ----------------------------- |
| 用户停在标题下很久   | “可以先写一句最粗糙的判断，结构之后再补。”        |
| 用户反复删除同一段   | “这段可能还没成形，要不要先把它保存成一个漂浮星辰？”   |
| 用户写技术内容     | “你之前在「xxx」里写过类似问题，可能可以接上。”    |
| 用户写产品内容     | “这个想法和「xxx 需求分析」有关系，要不要建立链接？” |
| 用户长时间只写生活记录 | “这段时间生活记录很多。好好休息也是在给下一次输出蓄力。” |
| 用户一周没有灵感记录  | “最近灵感少一点也正常，可以先记录一个很小的问题。”    |

### 9.4 编辑辅助原则

1. 不抢用户笔。
2. 不写大段内容。
3. 不假装比用户懂。
4. 不把所有建议都变成 Chat。
5. 只在用户可能需要时出现。
6. 用户关闭一次，同类提示短期内不再出现。
7. 用户接受某类提示，未来适度增加权重。

---



### 9.5 Markdown 自动补全与语法推荐

目标：

1. 降低 Markdown 学习门槛。
2. 提升 Block 编辑效率。
3. 让新用户无需记忆语法即可产出结构化内容。

触发方式：

| 触发 | 行为 |
|---|---|
| `/` | 打开 Slash Command |
| `# ` | 标题推荐 |
| `- ` | 列表推荐 |
| `> ` | 引用推荐 |
| ``` | 代码块推荐 |
| `[[` | 内链推荐 |
| `|` | 表格推荐 |

推荐评分：

```text
hint_score =
trigger_match * 0.35
+ cursor_context * 0.25
+ user_habit * 0.20
+ doc_context * 0.20
```

展示规则：

| 分数 | 行为 |
|---|---|
| >0.82 | 主动弹出 |
| 0.65-0.82 | 弱提示 |
| <0.65 | 不打扰 |

支持能力：

1. 语法补全
2. 表格模板插入
3. 链接补全
4. 标题层级修正
5. 代码块闭合
6. Frontmatter 模板生成
7. 当前文档结构建议

用户连续拒绝同类提示 3 次后，7 天内自动降权。


## 10. Chat Nudge 本地推送算法

### 10.1 Chat 的定位

Atlax 的 Chat 不是用户依赖型聊天机器人，而是：

> 引导用户输出、整理、回看、恢复节奏的知识陪跑系统。

在不接 LLM 的情况下，Chat 仍然可以通过本地算法做到自然化推送。

### 10.2 Chat 推送不是模板群发

要避免这种廉价提示：

```text
你已经 7 天没有记录了，请记录。
```

应该转为具有人味的上下文提示：

```text
这周你记录了不少生活片段，说明你确实在认真过日子。工作灵感少一点也没关系，好好休息本身就是恢复生产力的一部分。
```

这类提示不需要 LLM，也可以通过：

1. 用户近期记录类型分布。
2. 最近主题变化。
3. 时间节律。
4. 用户历史偏好。
5. 语气模板库。
6. 同义模板随机。
7. 冷却机制。
8. 反馈学习。

组合生成。

### 10.3 Chat 推送触发器

| 触发器                | 条件            | 推送意图      |
| ------------------ | ------------- | --------- |
| inspiration_gap    | 长期没有灵感记录      | 温和引导      |
| life_heavy_week    | 生活记录明显多于工作/学习 | 接纳与鼓励     |
| project_stall      | 某项目长期没有推进     | 轻提醒       |
| orphan_nodes_high  | 孤立节点过多        | 引导整理      |
| weekly_review_due  | 到达周回顾时间       | 推送 Review |
| repeated_topic     | 某主题反复出现       | 建议形成专题    |
| import_pending     | 导入后未整理        | 提醒处理      |
| editor_stuck       | 编辑卡住          | 提供低负担建议   |
| dormant_core_node  | 核心节点长期未打开     | 激活旧知识     |
| high_output_day    | 当天输出很多        | 鼓励沉淀      |
| low_energy_pattern | 晚间多次记录负面或疲惫内容 | 降低工作型催促   |

### 10.4 Chat 消息生成结构

```text
message =
opening_empathy
+ context_observation
+ light_suggestion
+ optional_action
```

示例：

```text
opening_empathy:
“这周你其实记录了不少东西。”

context_observation:
“只是它们更多分布在生活、休息和日常片段里。”

light_suggestion:
“这不一定是效率下降，可能只是你进入了恢复期。”

optional_action:
“要不要我帮你把这些内容整理成一份轻量周回顾？”
```

最终消息：

```text
这周你其实记录了不少东西，只是它们更多分布在生活、休息和日常片段里。这不一定是效率下降，可能只是你进入了恢复期。要不要我帮你把这些内容整理成一份轻量周回顾？
```

### 10.5 语气模板库

模板需要按场景维护。

```json
{
  "life_heavy_week": [
    "这周你记录了不少生活片段。好好休息不是偏离目标，而是在给下一次输出蓄力。",
    "最近你的记录更偏向生活状态，这其实也是知识库的一部分：它记录了你当时为什么这样选择。",
    "这几天工作相关内容少一点也没关系。稳定生活节奏，有时候比硬挤灵感更重要。"
  ],
  "project_stall": [
    "你已经有一段时间没碰「{project}」了。要不要先写一句现在卡在哪里？",
    "「{project}」最近安静了下来。也许不需要马上推进，只要补一个当前状态就够了。",
    "这个项目之前积累了不少内容，现在可以先做一次轻量回看。"
  ],
  "orphan_nodes_high": [
    "最近有一些星辰还没有接入主结构。要不要我帮你挑出最容易归类的几个？",
    "你的知识星云里出现了一些漂浮节点，它们可能不是没用，只是还没找到轨道。",
    "有几条记录和现有主题很接近，可以考虑把它们接进已有星群。"
  ]
}
```

### 10.6 Chat 推送限制

| 限制     | 规则           |
| ------ | ------------ |
| 频率     | 普通提示每天最多 2 条 |
| Review | 每周最多 1 次主动周报 |
| 同类提示   | 24 小时内不重复    |
| 用户关闭   | 同类提示 7 天冷却   |
| 用户接受   | 同类权重增加       |
| 用户忽略   | 轻微降权         |
| 用户反感   | 直接进入长期冷却     |

### 10.7 避免心理诊断

Chat 可以温和，但不能越界。

禁止：

```text
你最近可能焦虑。
你状态不好。
你需要调整心理健康。
你正在逃避工作。
```

允许：

```text
最近你的记录更偏向生活片段。
这周工作类记录少了一些。
你已经有几天没有更新这个项目。
这段内容可以先不用整理得很完整。
```

算法只能观察行为，不评价人格和心理状态。

---

## 11. 周 Review 算法

### 11.1 周 Review 目标

周 Review 不是流水账统计，而是帮助用户看见：

1. 本周记录了什么。
2. 哪些主题变强了。
3. 哪些项目停滞了。
4. 哪些灵感值得继续。
5. 哪些孤立内容应该归档。
6. 哪些旧内容被重新激活。
7. 下周最值得关注的 1-3 件事。

### 11.2 周 Review 数据源

| 数据源                   | 用途        |
| --------------------- | --------- |
| documents             | 本周新增和编辑内容 |
| captures              | 本周碎片输入    |
| mind_nodes            | 新增节点和活跃节点 |
| mind_edges            | 新增链接      |
| clusters              | 活跃星群      |
| behavior_events       | 用户实际操作    |
| recommendation_events | 推荐接受和拒绝   |
| rhythm_profiles       | 用户节律变化    |

### 11.3 周 Review 生成流程

```text
Collect Weekly Data
  ↓
Calculate Topic Distribution
  ↓
Calculate Project Progress
  ↓
Detect Dormant / Active Clusters
  ↓
Detect Orphan Nodes
  ↓
Detect Repeated Themes
  ↓
Generate Review Sections
  ↓
Generate Suggested Actions
  ↓
Push Chat Nudge
```

### 11.4 周 Review 内容结构

```text
本周概览
  - 新增记录数量
  - 编辑文档数量
  - 新增链接数量
  - 活跃星群数量

主题变化
  - 变强主题
  - 变弱主题
  - 新出现主题

项目状态
  - 推进项目
  - 停滞项目
  - 值得回看的项目

灵感整理
  - 新增灵感
  - 可连接灵感
  - 漂浮星辰

下周建议
  - 最值得继续的主题
  - 最应该整理的内容
  - 最轻量的下一步
```

### 11.5 周 Review 评分

```text
weekly_focus_score =
active_cluster_score * 0.25
+ repeated_topic_score * 0.2
+ project_momentum_score * 0.2
+ user_interaction_score * 0.15
+ unfinished_item_score * 0.1
+ dormant_reactivation_score * 0.1
```

---

## 12. 导入推荐算法

### 12.1 导入目标

Atlax 不能只服务 Markdown 用户。
必须能接住中国大陆真实信息流环境。

支持来源：

1. Obsidian。
2. Notion。
3. Markdown 文件夹。
4. 微信收藏。
5. 微信聊天片段。
6. 公众号文章。
7. 小红书收藏。
8. 抖音收藏。
9. B站收藏。
10. 浏览器剪藏。
11. PDF / 图片 / 音频 / 视频元数据。

### 12.2 导入后的处理流程

```text
Import Source
  ↓
Parse Metadata
  ↓
Normalize Content
  ↓
Deduplicate
  ↓
Extract Source Features
  ↓
Batch Grouping
  ↓
Suggest Clusters
  ↓
Generate Dock Import Queue
  ↓
User Confirm / Adjust
  ↓
Create Documents / Nodes / Edges
  ↓
Update Mind
```

### 12.3 导入推荐策略

导入时不能直接把所有内容打散进星云树，否则 Mind 会爆炸。

必须先进入 Dock 的 Import Queue。

分层策略：

| 层级 | 处理方式                      |
| -- | ------------------------- |
| 批次 | 按来源、导入时间、收藏夹分组            |
| 主题 | 按标题、标签、关键词聚合              |
| 内容 | 创建文档或碎片                   |
| 结构 | 推荐星群和链接                   |
| 视觉 | Mind 中批量生成低亮度节点，用户确认后稳定显示 |

### 12.4 中国平台字段映射

| 平台       | 关键字段                | 推荐用途        |
| -------- | ------------------- | ----------- |
| 微信       | 聊天对象、时间、链接、标题       | 人际/项目/时间上下文 |
| 公众号      | 标题、作者、账号、发布时间       | 阅读主题、信息来源   |
| 小红书      | 标题、正文、标签、作者、图片      | 生活/消费/灵感主题  |
| 抖音       | 视频标题、作者、话题、收藏夹      | 视频资源、趋势灵感   |
| B站       | 标题、UP主、分区、收藏夹、简介    | 学习资源、长期项目   |
| Notion   | 页面层级、数据库属性          | 原有结构继承      |
| Obsidian | 文件路径、双链、frontmatter | 链接结构继承      |

### 12.5 导入置信度

```text
import_landing_score =
source_metadata_score * 0.25
+ title_keyword_score * 0.2
+ existing_cluster_similarity * 0.2
+ user_import_history_score * 0.15
+ tag_overlap_score * 0.1
+ time_context_score * 0.1
```

---

## 13. Dock 与 Mind 打通算法

### 13.1 Dock 的本质

Dock 是知识库管理区，不是文件列表。

Dock 管理的对象包括：

1. 文档。
2. 星辰碎片。
3. 星群。
4. 项目。
5. 标签。
6. 来源。
7. 导入批次。
8. 待确认推荐。
9. 孤立节点。
10. 冷却节点。

### 13.2 Dock 视图

| 视图                 | 算法支持                  |
| ------------------ | --------------------- |
| List View          | 排序、筛选、批量操作            |
| Card View          | 摘要、主题色、状态、推荐操作        |
| Finder Column View | 项目 / 主题 / 来源 / 日期层级浏览 |
| Relation View      | 当前文档相关节点              |
| Import Queue       | 导入待确认                 |
| Review Queue       | 需要回看的内容               |

### 13.3 Mind-Dock 联动

| 操作        | 算法行为         |
| --------- | ------------ |
| Dock 选中文档 | Mind 聚焦对应节点  |
| Dock 选中项目 | Mind 展开项目星群  |
| Dock 修改标签 | 重新计算相关边      |
| Dock 批量归档 | 批量更新节点状态     |
| Mind 点击节点 | Dock 定位对应文档  |
| Mind 拖动节点 | 生成用户确认边      |
| Mind 删除弱边 | 更新推荐负反馈      |
| Mind 聚焦星群 | Dock 展示该星群内容 |

### 13.4 Dock 推荐排序

```text
dock_priority_score =
unconfirmed_score * 0.25
+ recent_activity_score * 0.2
+ importance_score * 0.15
+ orphan_score * 0.15
+ review_due_score * 0.1
+ source_batch_score * 0.1
+ user_pin_score * 0.05
```

---

## 14. 星云树布局算法

### 14.1 目标

星云树不能只是力导向图。
普通 force graph 会乱、会糊、会像一团毛线。

Mind 的布局目标是：

1. 星群清晰。
2. 核心节点突出。
3. 弱关系不干扰。
4. 层级有空间感。
5. 拖动自然。
6. 缩放时有信息层级。
7. 默认状态要美，不需要用户整理后才美。

### 14.2 布局流程

```text
Build Graph
  ↓
Detect Clusters
  ↓
Select Core Nodes
  ↓
Assign Cluster Regions
  ↓
Place Domain / Project Nodes
  ↓
Place Topic Nodes
  ↓
Place Document Nodes
  ↓
Place Fragment Nodes
  ↓
Calculate Edge Visibility
  ↓
Apply Visual LOD
  ↓
Cache Layout
```

### 14.3 节点位置策略

| 节点       | 布局策略         |
| -------- | ------------ |
| domain   | 稳定大星核，低频移动   |
| project  | 星群中心，保持视觉位置  |
| topic    | 围绕项目分布       |
| document | 围绕主题分布       |
| fragment | 外围漂浮，等待确认    |
| source   | 作为侧向星群，不抢主结构 |
| tag      | 默认隐藏或弱显示     |
| insight  | 高亮短期显示       |
| review   | 临时浮层，不长期占图   |

### 14.4 混乱度评分

```text
graph_chaos_score =
edge_crossing_score * 0.3
+ node_overlap_score * 0.25
+ weak_edge_density_score * 0.2
+ cluster_overlap_score * 0.15
+ isolated_noise_score * 0.1
```

当混乱度过高时：

1. 隐藏弱边。
2. 折叠低权重节点。
3. 聚合碎片节点。
4. 只显示星群边界。
5. 提示用户进入 Dock 整理。

---

## 15. 查询推荐算法

### 15.1 查询场景

用户查询不一定发生在搜索框，也可能发生在：

1. Dock 搜索。
2. Editor 引用。
3. Mind 节点详情。
4. Chat 输入。
5. Review 页面。
6. 导入整理时。

### 15.2 查询召回策略

```text
query_score =
bm25_score * 0.25
+ tag_match_score * 0.15
+ graph_proximity_score * 0.2
+ recent_activity_score * 0.1
+ user_frequency_score * 0.1
+ source_relevance_score * 0.1
+ exact_match_score * 0.1
```

### 15.3 查询建议

当用户搜索时，系统应推荐：

1. 相关文档。
2. 相关节点。
3. 相关星群。
4. 可能的标签。
5. 最近相关内容。
6. 可继续编辑的草稿。
7. 可回看的旧内容。

---

## 16. 用户习惯学习算法

### 16.1 用户画像不是广告画像

Atlax 的用户画像只服务用户自己，不做商业广告。

用户画像包括：

1. 常写主题。
2. 常用来源。
3. 常用时间段。
4. 常接受推荐类型。
5. 常拒绝推荐类型。
6. 常编辑文档类型。
7. 常复用内容。
8. 常停滞项目。
9. 常见记录节奏。
10. 常见整理习惯。

### 16.2 偏好更新

```text
preference_weight_new =
preference_weight_old * decay
+ feedback_signal * learning_rate
```

推荐：

```text
decay = 0.96
learning_rate = 0.08
```

解释：

1. 用户偏好会变化，所以旧偏好要衰减。
2. 用户一次行为不能过度影响算法。
3. 多次相同行为才形成稳定偏好。

### 16.3 正反馈

| 行为         |   权重 |
| ---------- | ---: |
| 接受推荐       | +1.0 |
| 手动确认链接     | +1.2 |
| 手动拖入星群     | +1.5 |
| 反复打开推荐内容   | +0.6 |
| 在推荐基础上轻微修改 | +0.5 |

### 16.4 负反馈

| 行为         |   权重 |
| ---------- | ---: |
| 拒绝推荐       | -1.0 |
| 删除推荐链接     | -1.2 |
| 将内容移出推荐星群  | -1.5 |
| 忽略同类推荐多次   | -0.5 |
| 关闭 Chat 提示 | -0.8 |

---

## 17. 性能设计

### 17.1 性能目标

| 场景          |           目标 |
| ----------- | -----------: |
| 输入保存        |      < 100ms |
| 初步落库建议      |      < 300ms |
| Editor 旁侧推荐 |      < 300ms |
| Mind 节点点击详情 |      < 150ms |
| Dock 筛选排序   |      < 200ms |
| 本地全文搜索      |      < 300ms |
| 批量导入初步预览    | 1000 条内 < 5s |
| 图谱局部重算      |      < 500ms |
| 全量图谱重算      |         后台异步 |

### 17.2 本地索引

必须维护以下索引：

1. 文档倒排索引。
2. block 倒排索引。
3. tag → document 索引。
4. node → edge 邻接索引。
5. cluster → node 索引。
6. source → document 索引。
7. date bucket 索引。
8. keyword → cluster 索引。
9. user action 最近行为索引。
10. recommendation feedback 索引。

### 17.3 增量计算优先

不能每次输入都全量重算。

事件触发策略：

| 事件          | 计算方式               |
| ----------- | ------------------ |
| 新建 capture  | 只计算该 capture 的候选归属 |
| 新建 document | 更新文档特征、局部图谱        |
| 修改 block    | 更新该 block 和文档摘要特征  |
| 修改 tag      | 更新相关索引和边           |
| 用户确认推荐      | 更新偏好权重             |
| 用户拖动节点      | 更新布局和确认边           |
| 批量导入        | 分批异步计算             |
| 每日空闲        | 重算活跃星群             |
| 每周          | 生成 Review 快照       |

### 17.4 缓存策略

| 缓存                       | 内容          |
| ------------------------ | ----------- |
| hot_nodes_cache          | 最近活跃节点      |
| candidate_clusters_cache | 常用落库候选      |
| user_preference_cache    | 用户偏好权重      |
| graph_adjacency_cache    | 图邻接表        |
| dock_filter_cache        | Dock 常用筛选结果 |
| editor_context_cache     | 当前编辑上下文     |
| weekly_review_cache      | 周报草稿        |
| import_preview_cache     | 导入预览结果      |

### 17.5 Redis 使用建议

如果当前 Demo 是纯本地，可以先不引入 Redis。
如果后续接入后端和多端同步，可以使用 Redis 缓存：

1. 用户热节点。
2. 最近推荐候选。
3. 图谱邻接快照。
4. Dock 查询结果。
5. 导入任务状态。
6. 周 Review 临时结果。
7. Chat 推送冷却状态。

Redis 不是算法核心，只是性能层。
不要让算法正确性依赖 Redis。

---

## 18. 前后端交互接口设计

### 18.1 自动落库接口

```http
POST /api/captures
```

请求：

```json
{
  "rawText": "下周产品评审会议，需要准备 Q2 路线图和用户反馈数据",
  "inputSurface": "mind",
  "context": {
    "currentView": "mind",
    "focusedNodeId": null,
    "timezone": "Asia/Shanghai"
  }
}
```

响应：

```json
{
  "captureId": "cap_001",
  "status": "suggested",
  "suggestions": [
    {
      "type": "landing",
      "targetType": "project",
      "targetId": "project_atlax",
      "targetName": "Atlax 产品设计",
      "confidence": 0.82,
      "explanation": [
        "内容包含产品评审、路线图等关键词",
        "你最近持续编辑 Atlax 产品设计",
        "该项目下存在多个相似节点"
      ]
    }
  ],
  "createdNode": {
    "nodeId": "node_001",
    "state": "suggested",
    "visual": {
      "x": 120,
      "y": 340,
      "size": 8
    }
  }
}
```

### 18.2 推荐反馈接口

```http
POST /api/recommendations/{id}/feedback
```

请求：

```json
{
  "action": "accepted",
  "modifiedTargetId": null,
  "surface": "mind"
}
```

### 18.3 链接推荐接口

```http
GET /api/mind/nodes/{nodeId}/link-suggestions
```

响应：

```json
{
  "nodeId": "node_001",
  "suggestions": [
    {
      "targetNodeId": "node_089",
      "edgeType": "similar",
      "confidence": 0.76,
      "reason": "两者都涉及产品路线图和用户反馈"
    }
  ]
}
```

### 18.4 Editor 推荐接口

```http
POST /api/editor/context-suggestions
```

请求：

```json
{
  "documentId": "doc_001",
  "currentBlockId": "block_009",
  "cursorContext": "这里需要重新设计 Dock 与 Mind 的关系",
  "idleMs": 12000
}
```

响应：

```json
{
  "stuckScore": 0.68,
  "suggestions": [
    {
      "type": "related_node",
      "title": "Dock 与 Mind 双向联动",
      "targetId": "node_023",
      "confidence": 0.81
    }
  ]
}
```

### 18.5 Chat 推送接口

```http
GET /api/chat/nudges/next
```

响应：

```json
{
  "shouldPush": true,
  "nudgeType": "life_heavy_week",
  "message": "这周你记录了不少生活片段。好好休息不是偏离目标，而是在给下一次输出蓄力。",
  "actions": [
    {
      "label": "生成轻量周回顾",
      "action": "open_weekly_review"
    },
    {
      "label": "稍后再说",
      "action": "dismiss"
    }
  ],
  "cooldownHours": 24
}
```

---



### 18.6 Markdown 语法提示接口

```http
POST /api/editor/syntax-hints
```

```json
{
  "documentId":"doc_001",
  "prefix":"[[",
  "cursorLine":"[[Pro"
}
```

### 18.7 Slash Command 推荐接口

```http
POST /api/editor/slash-commands
```

### 18.8 推荐反馈接口

```http
POST /api/editor/suggestion-feedback
```


## 19. 付费功能预留

### 19.1 免费版应保留的能力

免费版必须能体现产品核心价值，否则用户不会信任。

建议免费版支持：

1. 基础 Editor。
2. 基础 Mind 星云树。
3. 基础 Dock。
4. 本地自动落库。
5. 基础标签推荐。
6. 基础链接推荐。
7. 本地全文搜索。
8. 少量导入。
9. 基础周 Review。

### 19.2 可作为 Pro 的能力

| 功能         | 付费理由                        |
| ---------- | --------------------------- |
| 高级自动落库     | 更强候选召回与排序                   |
| 高级链接推荐     | 跨星群洞察、旧知识激活                 |
| 高级周 Review | 趋势、项目健康、长期复盘                |
| 高级导入       | 微信 / 小红书 / 抖音 / B站批量导入      |
| 高级 Dock 视图 | Finder 分栏、关系视图、Review Queue |
| 高级星云布局     | 多主题宇宙、历史快照、Time Machine     |
| 本地智能 Chat  | 更丰富的推送策略与个性化语气              |
| 图谱健康检测     | 孤立节点、混乱度、重复内容、沉没知识          |
| 跨设备同步      | 多端知识库                       |
| LLM 增强     | 智能摘要、语义问答、自动写作辅助            |

### 19.3 付费设计原则

不能把“产品能不能用”放到付费后。
可以把“产品是否更聪明、更省时间、更高级”放到付费后。

基础版解决：

> 我能记录、自动落库、看到结构。

Pro 版解决：

> 系统更懂我，能帮我节省大量整理和复盘时间。

---

## 20. 开发落地步骤

### Phase A：基础数据闭环

目标：保证所有输入都能落到统一数据结构。

任务：

1. 建立 documents / blocks / captures。
2. 建立 mind_nodes / mind_edges / clusters。
3. 建立 recommendation_events / behavior_events。
4. Editor 保存后自动生成或更新 MindNode。
5. Mind 输入框创建 Capture 和临时节点。
6. Dock 展示全部文档、碎片、待确认项。
7. 用户确认推荐后更新结构。

验收标准：

1. Editor 输入能出现在 Dock。
2. Mind 输入能出现在 Dock。
3. Dock 文档能在 Mind 中定位。
4. Mind 节点能打开 Editor。
5. 推荐接受 / 拒绝能被记录。

---

### Phase B：基础推荐算法

目标：不接 LLM，实现可用自动落库。

任务：

1. 实现关键词提取。
2. 实现中文分词与 n-gram。
3. 实现 tag 相似度。
4. 实现时间上下文评分。
5. 实现用户历史偏好权重。
6. 实现候选项目 / 主题 / 星群召回。
7. 实现推荐解释。
8. 实现反馈学习。

验收标准：

1. 新 capture 能推荐落库位置。
2. 推荐结果能解释。
3. 用户修改后，下次同类内容推荐变化。
4. Top-3 推荐在测试集上达到 70%+。

---

### Phase C：链接推荐与星云树优化

目标：让 Mind 结构更清晰、更美观。

任务：

1. 实现节点连接度计算。
2. 实现边权重。
3. 实现链接推荐。
4. 实现孤立节点检测。
5. 实现星群聚合。
6. 实现弱边隐藏。
7. 实现聚焦节点一跳/二跳展示。
8. 实现图混乱度评分。

验收标准：

1. 默认 Mind 不乱。
2. 点击节点时能显示相关关系。
3. 弱边不会污染全局视图。
4. 孤立节点可在 Dock 中集中处理。

---

### Phase D：Editor 辅助与 Chat Nudge

目标：让算法开始“像人一样懂节奏”。

任务：

1. 实现编辑上下文分析。
2. 实现卡住识别。
3. 实现相关节点推荐。
4. 实现 Chat Nudge 触发器。
5. 实现语气模板库。
6. 实现推送冷却机制。
7. 实现用户反馈降权。
8. 实现生活/工作/灵感类型比例分析。
9. 实现 Markdown 语法提示。
10. 实现 Slash Command 推荐。
11. 实现用户编辑习惯学习。

验收标准：

1. Chat 不打扰。
2. 推送内容和用户上下文有关。
3. 用户关闭后不会反复出现。
4. 周期性提示明显比机械提醒自然。

---

### Phase E：导入与 Review

目标：让产品不只是笔记软件，而是个人信息流结构化入口。

任务：

1. 建立 ImportJob。
2. 建立 SourceItem。
3. 实现 Obsidian / Notion / Markdown 导入。
4. 设计微信 / 小红书 / 抖音 / B站字段映射。
5. 实现导入预览和批量确认。
6. 实现周 Review。
7. 实现沉没内容检测。
8. 实现主题趋势分析。

验收标准：

1. 导入内容不会直接污染 Mind。
2. Dock 能处理导入队列。
3. Mind 能分批展示导入星辰。
4. 周 Review 能给出有价值的下一步建议。

---

## 21. 风险与边界

### 21.1 最大风险

| 风险          | 解决方式                  |
| ----------- | --------------------- |
| 算法过度自信      | 所有推荐可解释、可撤销           |
| Mind 视图混乱   | LOD、弱边隐藏、星群折叠         |
| Chat 像模板机器人 | 场景触发 + 多模板 + 冷却 + 反馈  |
| 用户数据太少      | 冷启动只做低风险建议            |
| 性能下降        | 增量计算 + 缓存 + 异步任务      |
| 导入污染知识库     | 先进入 Dock Import Queue |
| 推荐重复错误      | 记录负反馈并长期降权            |
| 过度心理化       | 只描述行为，不诊断用户           |

### 21.2 不能做的事

1. 不能假装没有 LLM 也能完全理解复杂语义。
2. 不能在冷启动时强行自动归类。
3. 不能把用户所有内容都连成线。
4. 不能把 Chat 做成鸡汤推送器。
5. 不能用算法剥夺用户最终决定权。
6. 不能为了视觉酷炫牺牲结构清晰。
7. 不能让 Dock 和 Mind 变成两套系统。
8. 不能让 Editor 只保存文本而不更新结构。

---

## 22. 最终算法原则

Atlax 的本地算法不是为了炫技，而是为了让用户感觉：

1. 我随手记录，系统能接住。
2. 我不用马上整理，也不会丢。
3. 我的内容会自然长出结构。
4. 系统知道我最近在关注什么。
5. 系统不会乱打扰我。
6. 推荐错了，我能改。
7. 我改过之后，系统会记住。
8. 时间越久，星云树越像我自己的知识宇宙。

最终判断标准：

> 用户不是因为算法“看起来智能”而留下，而是因为系统真的降低了整理成本、提升了复用率，并且让知识结构变得越来越清晰。

这就是 Atlax MindDock 在不接入 LLM 阶段必须打牢的算法地基。
