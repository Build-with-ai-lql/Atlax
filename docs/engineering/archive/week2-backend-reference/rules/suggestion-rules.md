# Suggestion 规则引擎参考

> 本文档归档自 `apps/server/src/suggestion/suggestion.service.ts` 的规则逻辑部分。
> 
> **注意**：这是规则思想参考，不是 Week 1 实现内容。Week 2 可在前端本地实现类似规则。

---

## 类型识别规则

### 规则定义

```typescript
const TYPE_RULES = [
  {
    type: 'meeting',
    keywords: ['meeting', '会议', '议题', '结论']
  },
  {
    type: 'task',
    keywords: ['todo', '待办', '下周要做', 'action item']
  },
  {
    type: 'reading',
    keywords: ['读到', '摘录', '书里提到', 'article', 'paper']
  },
  {
    type: 'idea',
    keywords: ['灵感', '想法', 'idea', '脑暴']
  }
];
```

### 匹配逻辑

1. 将输入文本转为小写
2. 遍历 TYPE_RULES，检查是否包含任一关键词
3. 匹配成功则返回对应类型
4. 默认回退：`note`

---

## 标签建议规则

### 关键词映射

```typescript
const TAG_KEYWORDS = {
  '产品': ['产品', 'prd', '需求', 'roadmap'],
  '技术': ['技术', '架构', 'api', 'backend', 'frontend'],
  '性能': ['性能', '延迟', '优化', '慢'],
  '项目管理': ['项目', '里程碑', '进度', '复盘'],
  '学习': ['学习', '课程', '读书', '总结'],
  '支付': ['支付', 'pay', 'billing']
};
```

### 匹配逻辑

1. 将输入文本转为小写
2. 遍历 TAG_KEYWORDS，检查是否包含任一关键词
3. 匹配成功则添加对应标签
4. 最多返回 5 个标签

### 高频标签召回

从历史 Entry 中召回高频标签（补充建议）：

1. 查询最近 100 条 Entry
2. 统计标签出现频率
3. 返回前 3 个高频标签
4. 用于补充关键词匹配结果

---

## 项目建议规则

### 匹配逻辑

1. 查询最近活跃的 20 个项目（status=active，按 lastActivityAt 排序）
2. 检查输入文本是否包含项目名称
3. 匹配成功则返回项目 ID
4. 如果文本包含"项目/project/里程碑/需求/迭代"关键词，返回最近活跃项目
5. 否则不返回项目建议

---

## 任务提取规则

### 模式匹配

从输入文本中提取任务标题：

```typescript
// 匹配模式
const TASK_PATTERNS = /(todo|待办|下周要做|action item)/i;

// 提取逻辑
function extractTaskTitles(rawText: string): string[] {
  // 1. 按换行/句号分割文本
  const chunks = rawText.split(/\r?\n|。|！|!|？|\?/g);
  
  // 2. 检查每个 chunk 是否包含任务关键词
  const taskTitles: string[] = [];
  for (const chunk of chunks) {
    if (TASK_PATTERNS.test(chunk)) {
      // 3. 清理关键词前缀
      const cleaned = chunk
        .replace(/(todo|待办|下周要做|action item)[:：]?\s*/i, '')
        .trim();
      taskTitles.push(cleaned || '待处理事项');
    }
  }
  
  // 4. 最多返回 20 个任务
  return taskTitles.slice(0, 20);
}
```

---

## Week 2 实现建议

### 前端本地实现

Week 2 可在前端本地实现规则引擎：

```typescript
// apps/web/lib/suggestion/rules.ts

export function suggestType(rawText: string): EntryType {
  const normalizedText = rawText.toLowerCase();
  for (const rule of TYPE_RULES) {
    if (rule.keywords.some(kw => normalizedText.includes(kw.toLowerCase()))) {
      return rule.type;
    }
  }
  return 'note';
}

export function suggestTags(rawText: string): string[] {
  const normalizedText = rawText.toLowerCase();
  const tags = new Set<string>();
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(kw => normalizedText.includes(kw.toLowerCase()))) {
      tags.add(tag);
    }
  }
  return Array.from(tags).slice(0, 5);
}
```

### 不依赖后端

- 规则引擎在前端本地运行
- 不调用远程 API
- 不依赖 LLM

---

## 来源

- 原始文件：`apps/server/src/suggestion/suggestion.service.ts`
- 归档时间：2026-04-20
- 归档原因：NestJS service 形态不适合 Week 1，规则思想可复用