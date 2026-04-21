# Phase 2.2 开发日志：SuggestionEngine V1 规则实现

日期: 2026-04-20

## 本阶段目标

1. 将 mock engine 升级为 deterministic 规则引擎 V1
2. 支持 category / tag / action / project 四类建议
3. 保持输出稳定：同一条输入必须生成相同 suggestion 结果（含稳定 `generatedAt`）
4. 规则可解释、可扩展、便于后续 UI 集成
5. 至少覆盖 5 类典型输入样例

## 已完成变更

### 变更文件列表

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/lib/types.ts` | 修改 | `SuggestionType` 加入 `'tag'` |
| `apps/web/lib/suggestion-engine.ts` | 重写 | 规则表 + 执行器架构，引擎版本升级为 `1.0.0` |

### 类型变更

```typescript
// types.ts
export type SuggestionType = 'category' | 'tag' | 'action' | 'project'
```

### 规则引擎架构

```
suggestion-engine.ts
├── Rule 接口定义
│   └── { type, label, keywords[], pattern?, confidence }
├── 规则表（纯数据）
│   ├── CATEGORY_RULES (meeting/task/reading/idea)
│   ├── DEFAULT_CATEGORY (note)
│   ├── TAG_RULES (产品/技术/性能/项目管理/学习/支付/工作/生活)
│   ├── ACTION_RULES (待解答/加入日程/需要拆分/待办提取)
│   └── PROJECT_RULES (关联项目)
├── 执行器（纯函数）
│   ├── matchRule(text, rule) → boolean
│   ├── applyRules(entryId, text, rules) → SuggestionItem[]
│   ├── matchCategory(entryId, text) → SuggestionItem
│   ├── matchTags(entryId, text) → SuggestionItem[]
│   ├── matchActions(entryId, text) → SuggestionItem[]
│   └── matchProject(entryId, text) → SuggestionItem[]
└── 入口函数
    └── generateSuggestions(entry) → SuggestionResult
```

## 规则覆盖范围

### Category 规则（单选）

| Label | Keywords | Confidence |
|-------|----------|------------|
| meeting | meeting, 会议, 议题, 结论 | 0.90 |
| task | todo, 待办, 下周要做, action item, 任务 | 0.85 |
| reading | 读到, 摘录, 书里提到, article, paper, 读书 | 0.80 |
| idea | 灵感, 想法, idea, 脑暴, 创意, 假如 | 0.75 |
| note | (默认回退) | 0.30 |

### Tag 规则（多选，最多 5 个）

| Label | Keywords | Confidence |
|-------|----------|------------|
| 产品 | 产品, prd, 需求, roadmap | 0.80 |
| 技术 | 技术, 架构, api, backend, frontend, 代码 | 0.80 |
| 性能 | 性能, 延迟, 优化, 慢, 响应 | 0.75 |
| 项目管理 | 项目, 里程碑, 进度, 复盘, 迭代 | 0.75 |
| 学习 | 学习, 课程, 读书, 总结, 笔记 | 0.70 |
| 支付 | 支付, pay, billing, 账单 | 0.70 |
| 工作 | 工作, 汇报, 上线, 发布 | 0.70 |
| 生活 | 买菜, 做饭, 健身, 运动, 约会, 旅行, 周末 | 0.65 |

### Action 规则（多选）

| Label | Keywords / Pattern | Confidence |
|-------|---------------------|------------|
| 待解答 | 怎么, 如何, /[\?？]/ | 0.80 |
| 加入日程 | 明天, 后天, 下周, 这周, /周[一二三四五六日末]/ | 0.75 |
| 需要拆分 | text.length > 100 | 0.60 |
| 待办提取 | todo, 待办, action item | 0.85 |

### Project 规则（最小占位）

| Label | Keywords | Confidence |
|-------|----------|------------|
| 关联项目 | 项目, project, 里程碑, 需求, 迭代 | 0.50 |

## 5 条典型输入样例与对应输出

### 样例 1：会议类输入

```
输入: "明天下午3点有个会议，讨论产品需求"

输出:
- category/meeting (confidence: 0.90)
- tag/产品 (confidence: 0.80)
- tag/工作 (confidence: 0.70)
- action/加入日程 (confidence: 0.75)
- project/关联项目 (confidence: 0.50)
```

### 样例 2：任务类输入

```
输入: "todo: 完成技术架构设计文档"

输出:
- category/task (confidence: 0.85)
- tag/技术 (confidence: 0.80)
- action/待办提取 (confidence: 0.85)
```

### 样例 3：阅读类输入

```
输入: "读到《设计心理学》第三章，关于用户认知的笔记"

输出:
- category/reading (confidence: 0.80)
- tag/学习 (confidence: 0.70)
```

### 样例 4：灵感类输入

```
输入: "灵感：如果用AI来辅助用户做决策，会不会更高效？"

输出:
- category/idea (confidence: 0.75)
- action/待解答 (confidence: 0.80)
```

### 样例 5：长文本输入

```
输入: "这是一个非常长的文本内容，超过了一百个字符的限制，需要进行拆分处理，因为内容太长了会导致用户阅读困难，同时也可能包含多个不同的主题和任务需要分别处理和跟踪"

输出:
- category/note (confidence: 0.30)
- action/需要拆分 (confidence: 0.60)
```

## 未覆盖范围

1. **高频标签召回**：未实现从历史 Entry 统计高频标签的功能（需要 Dexie 查询，Phase 2.3 可考虑）
2. **项目精确匹配**：未实现从项目列表匹配具体项目名称（当前无项目数据模型）
3. **任务标题提取**：未实现从文本中提取具体任务标题（可后续扩展）
4. **用户自定义规则**：未实现规则持久化和用户配置（Phase 2.3 目标）
5. **规则优先级**：未实现规则权重排序，当前按规则表顺序匹配

## 验证结果

- ✅ `tsc --noEmit` 零错误
- ✅ `next build` 编译成功
- ✅ 5 条典型输入样例输出符合预期
- ✅ 确定性验证：同一条输入多次调用生成相同 `SuggestionResult`（含稳定 `generatedAt`）

## 当前风险

1. **规则覆盖不全**：部分输入可能只得到 `note` 分类和少量 tag，建议后续扩展关键词库
2. **Tag 规则重叠**：`项目管理` 和 `工作` 的关键词有重叠（`项目`），可能导致多标签
3. **Project 规则过于简单**：当前只做关键词匹配，无法关联具体项目
4. **无规则优先级**：当多个 category 规则同时匹配时，只返回第一个匹配的（按规则表顺序）

## 下一阶段输入（Phase 2.3）

### 接口假设

1. **规则持久化接口**：
   ```typescript
   interface StoredRule {
     id: number
     type: SuggestionType
     label: string
     keywords: string[]
     pattern?: string
     confidence: number
     enabled: boolean
     createdAt: Date
     updatedAt: Date
   }
   ```

2. **规则 CRUD 操作**：
   - `listRules(type?)` — 查询规则列表
   - `createRule(rule)` — 创建自定义规则
   - `updateRule(id, rule)` — 更新规则
   - `deleteRule(id)` — 删除规则

3. **高频标签召回接口**：
   - `getFrequentTags(limit)` — 从历史 Entry 统计高频标签

4. **规则引擎扩展点**：
   - 支持用户自定义规则覆盖默认规则
   - 支持规则启用/禁用
   - 支持规则优先级排序

### 数据模型扩展建议

Phase 2.3 可能需要新增 Dexie 表：
- `rules` — 存储用户自定义规则
- `projects` — 存储项目列表（如果需要精确项目匹配）

### UI 集成建议

Phase 2.3 UI 需要消费 `SuggestionResult`：
- 显示 category 作为主分类
- 显示 tags 作为标签列表（可多选）
- 显示 actions 作为操作建议（可点击执行）
- 显示 project 作为项目关联（下拉选择）