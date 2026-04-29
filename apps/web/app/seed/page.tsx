'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Database, Trash2, ArrowRight } from 'lucide-react'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { backfillStructureData, createEntryRelation, upsertMindNode, upsertMindEdge } from '@/lib/repository'

interface SeedResult {
  dockItemsCreated: number
  entriesCreated: number
  tagsCreated: number
  chatSessionsCreated: number
  collectionsCreated: number
  tagRelationsCreated: number
  entryRelationsCreated: number
  mindNodesCreated: number
  mindEdgesCreated: number
}

interface SeedEntry {
  title: string
  content: string
  type: 'note' | 'meeting' | 'idea' | 'task' | 'reading'
  tags: string[]
  project: string | null
  actions: string[]
}

interface SeedItem {
  rawText: string
  dockStatus: 'pending' | 'suggested' | 'archived' | 'ignored' | 'reopened'
  sourceType: 'text' | 'voice' | 'import' | 'chat'
  topic: string | null
  dayOffset: number
  hourOffset: number
  entry: SeedEntry | null
}

const SEED_ITEMS: SeedItem[] = [
  {
    rawText: '下周产品评审会议，需要准备 Q2 路线图和用户反馈数据',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '产品规划',
    dayOffset: 28,
    hourOffset: 10,
    entry: {
      title: '产品评审会议准备',
      content: '下周产品评审会议，需要准备 Q2 路线图和用户反馈数据\n\n需要整理的内容：\n- Q1 用户调研结果\n- 竞品分析更新\n- 技术债务清单',
      type: 'meeting', tags: ['产品', '项目管理'], project: 'MindDock', actions: ['加入日程', '待办提取'],
    },
  },
  {
    rawText: '读到了一篇关于 RAG 架构优化的文章，核心观点是 chunk 策略比 embedding 模型更重要',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '技术学习',
    dayOffset: 27,
    hourOffset: 14,
    entry: {
      title: 'RAG 架构优化阅读笔记',
      content: '读到了一篇关于 RAG 架构优化的文章，核心观点是 chunk 策略比 embedding 模型更重要\n\n关键要点：\n1. 语义分块优于固定长度分块\n2. 重叠窗口可以减少信息丢失\n3. 元数据增强检索精度',
      type: 'reading', tags: ['技术', '学习'], project: null, actions: ['待解答'],
    },
  },
  {
    rawText: '灵感：假如把知识图谱和本地优先结合，用户可以拥有自己的语义网络',
    dockStatus: 'archived',
    sourceType: 'chat',
    topic: '产品灵感',
    dayOffset: 26,
    hourOffset: 9,
    entry: {
      title: '知识图谱 + 本地优先的灵感',
      content: '灵感：假如把知识图谱和本地优先结合，用户可以拥有自己的语义网络\n\n每个用户的笔记、想法、阅读记录都可以自动建立关联，形成个人知识图谱。不需要云端，所有数据在本地。',
      type: 'idea', tags: ['产品', '技术'], project: 'MindDock', actions: [],
    },
  },
  {
    rawText: '待办：修复 Dock 页面刷新后的状态丢失问题',
    dockStatus: 'reopened',
    sourceType: 'text',
    topic: 'Bug 修复',
    dayOffset: 25,
    hourOffset: 16,
    entry: {
      title: '修复 Dock 状态丢失问题',
      content: '待办：修复 Dock 页面刷新后的状态丢失问题\n\n问题：用户在 Dock 中操作后刷新页面，条目状态会回退\n原因：可能是 useEffect 依赖不完整导致\n解决方案：确保 useCallback 包裹所有异步函数',
      type: 'task', tags: ['技术'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '今天和团队讨论了技术选型，决定用 Dexie + Next.js 做本地优先方案',
    dockStatus: 'ignored',
    sourceType: 'text',
    topic: null,
    dayOffset: 25,
    hourOffset: 11,
    entry: null,
  },
  {
    rawText: '读书笔记：《系统之美》第 3 章，关于反馈回路和延迟的概念',
    dockStatus: 'suggested',
    sourceType: 'text',
    topic: null,
    dayOffset: 24,
    hourOffset: 20,
    entry: null,
  },
  {
    rawText: '产品需求：用户希望能在 Entries 中按状态筛选',
    dockStatus: 'pending',
    sourceType: 'text',
    topic: null,
    dayOffset: 1,
    hourOffset: 8,
    entry: null,
  },
  {
    rawText: '周末去爬山，回来整理一下照片和路线记录',
    dockStatus: 'pending',
    sourceType: 'chat',
    topic: null,
    dayOffset: 0,
    hourOffset: 7,
    entry: null,
  },
  {
    rawText: '和设计师对齐了 Dock 卡片的交互细节，决定用滑动手势替代长按菜单',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '设计评审',
    dayOffset: 24,
    hourOffset: 15,
    entry: {
      title: 'Dock 卡片交互对齐',
      content: '和设计师对齐了 Dock 卡片的交互细节，决定用滑动手势替代长按菜单\n\n交互方案：\n- 左滑：归档\n- 右滑：忽略\n- 点击：展开详情\n- 长按：多选模式',
      type: 'meeting', tags: ['产品', '设计'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '待办：完成 Entry 详情页的 Markdown 渲染支持',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '功能开发',
    dayOffset: 23,
    hourOffset: 10,
    entry: {
      title: 'Entry 详情页 Markdown 渲染',
      content: '待办：完成 Entry 详情页的 Markdown 渲染支持\n\n需要支持：\n- 标题、列表、代码块\n- 表格渲染\n- 任务列表（checkbox）\n- 代码高亮',
      type: 'task', tags: ['技术', '前端'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '读到一篇关于本地优先软件架构的文章，提到了 CRDT 和 SQLite 的结合方案',
    dockStatus: 'archived',
    sourceType: 'import',
    topic: '技术调研',
    dayOffset: 22,
    hourOffset: 21,
    entry: {
      title: '本地优先架构调研笔记',
      content: '读到一篇关于本地优先软件架构的文章，提到了 CRDT 和 SQLite 的结合方案\n\n核心观点：\n1. CRDT 解决多端冲突，但性能开销大\n2. SQLite WASM 可以在浏览器中运行完整数据库\n3. 推荐用 event sourcing + snapshot 做同步',
      type: 'reading', tags: ['技术', '学习'], project: 'MindDock', actions: ['待解答'],
    },
  },
  {
    rawText: '想法：给 Dock 加一个「智能分组」功能，按主题自动聚类',
    dockStatus: 'archived',
    sourceType: 'chat',
    topic: '产品灵感',
    dayOffset: 21,
    hourOffset: 13,
    entry: {
      title: 'Dock 智能分组功能构想',
      content: '想法：给 Dock 加一个「智能分组」功能，按主题自动聚类\n\n实现思路：\n- 使用 embedding 计算条目间相似度\n- 用聚类算法自动分组\n- 用户可手动调整分组\n- 分组结果可折叠/展开',
      type: 'idea', tags: ['产品', '技术'], project: 'MindDock', actions: [],
    },
  },
  {
    rawText: '下午 3 点和后端对 API 接口，需要确认 Entry 的分页参数',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '接口对接',
    dayOffset: 20,
    hourOffset: 9,
    entry: {
      title: 'API 接口对齐会议',
      content: '下午 3 点和后端对 API 接口，需要确认 Entry 的分页参数\n\n需要确认的接口：\n- GET /entries 分页参数\n- POST /entries 批量创建\n- PUT /entries/:id 更新逻辑\n- DELETE /entries/:id 软删除策略',
      type: 'meeting', tags: ['技术', '项目管理'], project: 'MindDock', actions: ['加入日程'],
    },
  },
  {
    rawText: '用户反馈：搜索功能太慢了，输入后要等 2 秒才有结果',
    dockStatus: 'reopened',
    sourceType: 'import',
    topic: '性能优化',
    dayOffset: 19,
    hourOffset: 14,
    entry: {
      title: '搜索性能优化',
      content: '用户反馈：搜索功能太慢了，输入后要等 2 秒才有结果\n\n优化方案：\n1. 添加 debounce（300ms）\n2. 使用 Web Worker 做索引\n3. 预构建搜索索引\n4. 考虑用 Fuse.js 替代全表扫描',
      type: 'task', tags: ['技术', '性能'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '今天跑步 5 公里，配速 5 分 30 秒，比上周快了 15 秒',
    dockStatus: 'ignored',
    sourceType: 'voice',
    topic: null,
    dayOffset: 19,
    hourOffset: 7,
    entry: null,
  },
  {
    rawText: '笔记：Dexie 的 where().equals() 只能用索引字段，非索引字段需要用 filter',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '技术笔记',
    dayOffset: 18,
    hourOffset: 16,
    entry: {
      title: 'Dexie 查询注意事项',
      content: '笔记：Dexie 的 where().equals() 只能用索引字段，非索引字段需要用 filter\n\n关键点：\n- 索引字段：where("userId").equals(id)\n- 非索引字段：collection.filter(item => item.name === "xxx")\n- 复合索引：[userId+status] 可以组合查询\n- 性能：filter 是全表扫描，大数据量时慎用',
      type: 'note', tags: ['技术', '学习'], project: 'MindDock', actions: [],
    },
  },
  {
    rawText: '读完了《设计心理学》第 2 章，关于可供性和映射的概念很有启发',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '读书笔记',
    dayOffset: 17,
    hourOffset: 22,
    entry: {
      title: '《设计心理学》第 2 章笔记',
      content: '读完了《设计心理学》第 2 章，关于可供性和映射的概念很有启发\n\n核心概念：\n1. 可供性（Affordance）：物品本身暗示的使用方式\n2. 映射（Mapping）：控制与结果之间的对应关系\n3. 反馈（Feedback）：操作后的即时响应\n\n应用到 MindDock：Dock 卡片的状态圆点就是一种可供性暗示',
      type: 'reading', tags: ['学习', '设计'], project: null, actions: [],
    },
  },
  {
    rawText: '待办：给 Entries 页面加上按日期分组的视图',
    dockStatus: 'suggested',
    sourceType: 'text',
    topic: null,
    dayOffset: 16,
    hourOffset: 11,
    entry: null,
  },
  {
    rawText: '产品想法：支持从微信读书导入笔记和标注',
    dockStatus: 'suggested',
    sourceType: 'chat',
    topic: null,
    dayOffset: 15,
    hourOffset: 20,
    entry: null,
  },
  {
    rawText: '下周要准备季度复盘 PPT，需要汇总各项目进度',
    dockStatus: 'suggested',
    sourceType: 'text',
    topic: null,
    dayOffset: 14,
    hourOffset: 9,
    entry: null,
  },
  {
    rawText: '读到一篇关于 React Server Components 性能优化的深度分析',
    dockStatus: 'suggested',
    sourceType: 'import',
    topic: null,
    dayOffset: 13,
    hourOffset: 15,
    entry: null,
  },
  {
    rawText: '待办：优化 Entry 列表的虚拟滚动，当前 100 条以上会卡顿',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '性能优化',
    dayOffset: 16,
    hourOffset: 14,
    entry: {
      title: 'Entry 列表虚拟滚动优化',
      content: '待办：优化 Entry 列表的虚拟滚动，当前 100 条以上会卡顿\n\n方案：\n1. 引入 @tanstack/react-virtual\n2. 动态计算行高\n3. 预渲染缓冲区 5 条\n4. 滚动时延迟加载详情',
      type: 'task', tags: ['技术', '性能'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '和 PM 讨论了 v2 版本的功能优先级，决定先做搜索增强',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '产品规划',
    dayOffset: 15,
    hourOffset: 10,
    entry: {
      title: 'v2 功能优先级讨论',
      content: '和 PM 讨论了 v2 版本的功能优先级，决定先做搜索增强\n\n优先级排序：\n1. 搜索增强（全文检索 + 语义搜索）\n2. 标签体系优化\n3. 导入功能（微信读书、Notion）\n4. 协作功能（分享、评论）\n5. 移动端适配',
      type: 'meeting', tags: ['产品', '项目管理'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '想法：Entry 可以支持双向链接，用 [[语法自动关联相关条目',
    dockStatus: 'archived',
    sourceType: 'chat',
    topic: '产品灵感',
    dayOffset: 14,
    hourOffset: 21,
    entry: {
      title: '双向链接功能构想',
      content: '想法：Entry 可以支持双向链接，用 [[语法自动关联相关条目\n\n设计思路：\n- 输入 [[ 触发搜索已有条目\n- 选中后自动创建双向引用\n- Entry 详情页底部显示反向链接\n- 链接图谱可视化',
      type: 'idea', tags: ['产品', '技术'], project: 'MindDock', actions: [],
    },
  },
  {
    rawText: '笔记：Next.js App Router 的 cache 机制和 revalidation 策略',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '技术笔记',
    dayOffset: 13,
    hourOffset: 17,
    entry: {
      title: 'Next.js 缓存机制笔记',
      content: '笔记：Next.js App Router 的 cache 机制和 revalidation 策略\n\n关键概念：\n1. 默认缓存所有 fetch 请求\n2. revalidate = 0 禁用缓存\n3. revalidatePath() 按路径刷新\n4. revalidateTag() 按标签刷新\n5. use server action 后自动刷新',
      type: 'note', tags: ['技术', '学习'], project: null, actions: [],
    },
  },
  {
    rawText: '买了本《重构》准备重读，上次读还是 3 年前',
    dockStatus: 'ignored',
    sourceType: 'text',
    topic: null,
    dayOffset: 12,
    hourOffset: 19,
    entry: null,
  },
  {
    rawText: '今天测试了语音输入功能，识别准确率还不错，但标点符号需要优化',
    dockStatus: 'archived',
    sourceType: 'voice',
    topic: '功能测试',
    dayOffset: 12,
    hourOffset: 11,
    entry: {
      title: '语音输入功能测试报告',
      content: '今天测试了语音输入功能，识别准确率还不错，但标点符号需要优化\n\n测试结果：\n- 中文识别准确率：92%\n- 英文识别准确率：88%\n- 标点符号问题：逗号和句号经常缺失\n- 长句识别：超过 30 秒的语音容易中断\n\n改进建议：\n1. 后处理添加标点预测\n2. 增加语音分段逻辑',
      type: 'note', tags: ['技术', '产品'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '待办：实现 Tag 编辑器的拖拽排序功能',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '功能开发',
    dayOffset: 11,
    hourOffset: 10,
    entry: {
      title: 'Tag 编辑器拖拽排序',
      content: '待办：实现 Tag 编辑器的拖拽排序功能\n\n技术方案：\n1. 使用 @dnd-kit/core 做拖拽\n2. 支持水平排列的标签拖拽\n3. 拖拽时显示插入指示器\n4. 排序结果持久化到 IndexedDB',
      type: 'task', tags: ['技术', '前端'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '读到一篇关于 LLM Agent 架构的文章，提到了 ReAct 框架和工具调用',
    dockStatus: 'archived',
    sourceType: 'import',
    topic: '技术学习',
    dayOffset: 10,
    hourOffset: 22,
    entry: {
      title: 'LLM Agent 架构阅读笔记',
      content: '读到一篇关于 LLM Agent 架构的文章，提到了 ReAct 框架和工具调用\n\n核心架构：\n1. ReAct：Reasoning + Acting 交替进行\n2. 工具调用：LLM 输出结构化 JSON 触发外部 API\n3. 记忆系统：短期（对话上下文）+ 长期（向量数据库）\n4. 规划：将复杂任务分解为子步骤\n\n启发：MindDock 的建议引擎可以用类似思路',
      type: 'reading', tags: ['技术', '学习'], project: 'MindDock', actions: ['待解答'],
    },
  },
  {
    rawText: '想法：做一个「每日回顾」功能，每天早上推送昨天的待办和灵感',
    dockStatus: 'archived',
    sourceType: 'chat',
    topic: '产品灵感',
    dayOffset: 9,
    hourOffset: 8,
    entry: {
      title: '每日回顾功能构想',
      content: '想法：做一个「每日回顾」功能，每天早上推送昨天的待办和灵感\n\n功能设计：\n- 每天早上 9 点自动生成回顾\n- 汇总昨天的待办、灵感、阅读笔记\n- 支持一键转为今日任务\n- 周报模式：汇总一周数据\n- 通知方式：浏览器通知 / 邮件',
      type: 'idea', tags: ['产品'], project: 'MindDock', actions: ['加入日程'],
    },
  },
  {
    rawText: '下午和客户做了产品演示，反馈整体不错，但希望有数据导出功能',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '客户反馈',
    dayOffset: 8,
    hourOffset: 16,
    entry: {
      title: '客户产品演示反馈',
      content: '下午和客户做了产品演示，反馈整体不错，但希望有数据导出功能\n\n客户反馈要点：\n1. Dock 的整理流程很顺畅\n2. 希望支持导出为 Markdown / PDF\n3. 标签管理需要更灵活\n4. 期望有团队协作功能\n5. 移动端体验需要优化',
      type: 'meeting', tags: ['产品', '项目管理'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '待办：修复暗色模式下 Dock 卡片边框颜色不一致的问题',
    dockStatus: 'reopened',
    sourceType: 'text',
    topic: 'Bug 修复',
    dayOffset: 7,
    hourOffset: 14,
    entry: {
      title: '暗色模式边框颜色修复',
      content: '待办：修复暗色模式下 Dock 卡片边框颜色不一致的问题\n\n问题描述：\n- pending 状态卡片边框是灰色，应该是黄色\n- ignored 状态卡片边框太亮\n- 建议标签在暗色模式下对比度不够\n\n修复方案：\n1. 统一使用 dark: 前缀的 Tailwind 类\n2. 添加 CSS 变量做主题色映射',
      type: 'task', tags: ['技术', '前端'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '笔记：Tailwind CSS v4 的新特性，支持容器查询和原生 CSS 嵌套',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '技术笔记',
    dayOffset: 7,
    hourOffset: 20,
    entry: {
      title: 'Tailwind CSS v4 新特性笔记',
      content: '笔记：Tailwind CSS v4 的新特性，支持容器查询和原生 CSS 嵌套\n\n主要变化：\n1. 基于 Rust 的新引擎，构建速度 10x 提升\n2. 容器查询：@container 语法\n3. 原生 CSS 嵌套\n4. 零配置内容检测\n5. 新的颜色空间：oklch',
      type: 'note', tags: ['技术', '学习'], project: null, actions: [],
    },
  },
  {
    rawText: '今天做了 Code Review，发现几个组件的 useEffect 有内存泄漏风险',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '代码质量',
    dayOffset: 6,
    hourOffset: 15,
    entry: {
      title: 'Code Review 问题汇总',
      content: '今天做了 Code Review，发现几个组件的 useEffect 有内存泄漏风险\n\n问题列表：\n1. DockList 组件：未清理 IntersectionObserver\n2. DetailPanel 组件：事件监听器未移除\n3. ChatPanel 组件：WebSocket 连接未关闭\n4. 建议引擎：setTimeout 未清理\n\n修复原则：\n- useEffect 返回清理函数\n- 使用 useRef 持有可变引用\n- AbortController 取消 fetch',
      type: 'note', tags: ['技术'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '读了一篇关于渐进式 Web 应用的文章，PWA 在离线场景下很有优势',
    dockStatus: 'archived',
    sourceType: 'import',
    topic: '技术调研',
    dayOffset: 5,
    hourOffset: 21,
    entry: {
      title: 'PWA 离线场景调研',
      content: '读了一篇关于渐进式 Web 应用的文章，PWA 在离线场景下很有优势\n\n关键能力：\n1. Service Worker 缓存策略\n2. Background Sync 离线写入\n3. Web Push 通知\n4. Add to Home Screen\n\n与 MindDock 的结合：\n- 离线时所有操作照常\n- 联网后自动同步\n- 本地优先 + PWA = 完美组合',
      type: 'reading', tags: ['技术', '学习'], project: 'MindDock', actions: [],
    },
  },
  {
    rawText: '想法：给每个 Entry 加一个「相关推荐」模块，基于标签和内容相似度',
    dockStatus: 'suggested',
    sourceType: 'chat',
    topic: null,
    dayOffset: 5,
    hourOffset: 10,
    entry: null,
  },
  {
    rawText: '明天要参加一个关于 AI Native 产品的线上分享会',
    dockStatus: 'suggested',
    sourceType: 'text',
    topic: null,
    dayOffset: 4,
    hourOffset: 18,
    entry: null,
  },
  {
    rawText: '待办：给 Dock 的 suggested 状态添加批量接受/忽略的操作',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '功能开发',
    dayOffset: 4,
    hourOffset: 11,
    entry: {
      title: 'Dock 批量操作功能',
      content: '待办：给 Dock 的 suggested 状态添加批量接受/忽略的操作\n\n交互设计：\n1. 长按进入多选模式\n2. 全选/反选按钮\n3. 底部操作栏：批量接受、批量忽略\n4. 批量接受时使用默认建议值\n5. 支持滑动选择区间',
      type: 'task', tags: ['技术', '产品'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '和运营讨论了用户增长策略，决定先做内容营销',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '运营策略',
    dayOffset: 3,
    hourOffset: 14,
    entry: {
      title: '用户增长策略讨论',
      content: '和运营讨论了用户增长策略，决定先做内容营销\n\n策略方向：\n1. 技术博客：本地优先架构系列\n2. 产品更新日志：每周发布\n3. 社区运营：Twitter / 即刻 / V2EX\n4. 用户案例：邀请早期用户写使用体验\n5. SEO 优化：关键词布局',
      type: 'meeting', tags: ['产品', '工作'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '笔记：IndexedDB 的事务机制和 Dexie 的封装方式',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '技术笔记',
    dayOffset: 3,
    hourOffset: 20,
    entry: {
      title: 'IndexedDB 事务机制笔记',
      content: '笔记：IndexedDB 的事务机制和 Dexie 的封装方式\n\n关键点：\n1. IndexedDB 事务自动提交，不能手动控制\n2. Dexie 用 Promise 封装了事务 API\n3. db.transaction() 可以指定读写模式\n4. 跨表操作需要在同一事务中\n5. 事务失败自动回滚',
      type: 'note', tags: ['技术', '学习'], project: null, actions: [],
    },
  },
  {
    rawText: '今天去超市买了菜，晚上做了红烧排骨',
    dockStatus: 'ignored',
    sourceType: 'voice',
    topic: null,
    dayOffset: 2,
    hourOffset: 19,
    entry: null,
  },
  {
    rawText: '待办：给 Chat 模式添加上下文记忆，能引用之前的对话内容',
    dockStatus: 'pending',
    sourceType: 'text',
    topic: null,
    dayOffset: 2,
    hourOffset: 10,
    entry: null,
  },
  {
    rawText: '读到一篇关于 Prompt Engineering 最佳实践的文章',
    dockStatus: 'archived',
    sourceType: 'import',
    topic: '技术学习',
    dayOffset: 2,
    hourOffset: 22,
    entry: {
      title: 'Prompt Engineering 最佳实践',
      content: '读到一篇关于 Prompt Engineering 最佳实践的文章\n\n核心技巧：\n1. 明确角色设定（System Prompt）\n2. 提供少量示例（Few-shot）\n3. 分步骤思考（Chain of Thought）\n4. 结构化输出（JSON Mode）\n5. 迭代优化（评估 + 改进）\n\n应用到 MindDock：建议引擎的 prompt 可以用 CoT 提升准确率',
      type: 'reading', tags: ['技术', '学习'], project: 'MindDock', actions: ['待解答'],
    },
  },
  {
    rawText: '想法：支持用自然语言查询 Entry，比如「上周关于产品的所有会议」',
    dockStatus: 'archived',
    sourceType: 'chat',
    topic: '产品灵感',
    dayOffset: 1,
    hourOffset: 9,
    entry: {
      title: '自然语言查询功能构想',
      content: '想法：支持用自然语言查询 Entry，比如「上周关于产品的所有会议」\n\n实现路径：\n1. 解析时间范围（上周、最近 7 天）\n2. 解析类型过滤（会议、任务）\n3. 解析标签过滤（产品、技术）\n4. 语义匹配内容关键词\n5. 结果排序：相关度 + 时间',
      type: 'idea', tags: ['产品', '技术'], project: 'MindDock', actions: [],
    },
  },
  {
    rawText: '下午 2 点团队周会，需要汇报本周开发进度',
    dockStatus: 'pending',
    sourceType: 'text',
    topic: null,
    dayOffset: 1,
    hourOffset: 8,
    entry: null,
  },
  {
    rawText: '待办：优化首次加载速度，当前 LCP 超过 3 秒',
    dockStatus: 'pending',
    sourceType: 'text',
    topic: null,
    dayOffset: 1,
    hourOffset: 11,
    entry: null,
  },
  {
    rawText: '笔记：Zustand 和 Jotai 的对比，Jotai 更适合原子化状态',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '技术笔记',
    dayOffset: 1,
    hourOffset: 16,
    entry: {
      title: 'Zustand vs Jotai 状态管理对比',
      content: '笔记：Zustand 和 Jotai 的对比，Jotai 更适合原子化状态\n\nZustand：\n- 集中式 store\n- 适合全局共享状态\n- API 简洁，学习成本低\n\nJotai：\n- 原子化状态\n- 按需组合，避免不必要渲染\n- 适合细粒度更新\n\nMindDock 选择：当前用 Zustand 做全局状态，局部状态考虑 Jotai',
      type: 'note', tags: ['技术', '学习'], project: null, actions: [],
    },
  },
  {
    rawText: '用户反馈：希望 Dock 能支持拖拽排序，把重要的放前面',
    dockStatus: 'pending',
    sourceType: 'import',
    topic: null,
    dayOffset: 0,
    hourOffset: 9,
    entry: null,
  },
  {
    rawText: '待办：给 Entry 添加收藏/置顶功能',
    dockStatus: 'pending',
    sourceType: 'text',
    topic: null,
    dayOffset: 0,
    hourOffset: 10,
    entry: null,
  },
  {
    rawText: '今天研究了 Web Audio API，可以做语音波形的实时可视化',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '技术调研',
    dayOffset: 0,
    hourOffset: 14,
    entry: {
      title: 'Web Audio API 调研笔记',
      content: '今天研究了 Web Audio API，可以做语音波形的实时可视化\n\n关键 API：\n1. AudioContext：音频上下文\n2. AnalyserNode：频谱分析\n3. MediaStream：麦克风输入\n4. AudioWorklet：自定义音频处理\n\n应用场景：\n- 语音输入时的波形动画\n- 音量指示器\n- 语音识别状态反馈',
      type: 'note', tags: ['技术', '前端'], project: 'MindDock', actions: [],
    },
  },
  {
    rawText: '读到《思考快与慢》第 5 章，关于认知放松和直觉判断',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '读书笔记',
    dayOffset: 0,
    hourOffset: 21,
    entry: {
      title: '《思考快与慢》第 5 章笔记',
      content: '读到《思考快与慢》第 5 章，关于认知放松和直觉判断\n\n核心概念：\n1. 系统 1（快思考）：自动、直觉、省力\n2. 系统 2（慢思考）：需要注意力、逻辑推理\n3. 认知放松：重复暴露、清晰表达带来信任感\n4. 直觉陷阱：熟悉感 ≠ 正确性\n\n产品启发：UI 设计要减少认知负荷，让用户「快思考」就能完成操作',
      type: 'reading', tags: ['学习', '产品'], project: null, actions: [],
    },
  },
  {
    rawText: '想法：做一个「知识地图」视图，用图形化方式展示 Entry 之间的关联',
    dockStatus: 'suggested',
    sourceType: 'chat',
    topic: null,
    dayOffset: 0,
    hourOffset: 15,
    entry: null,
  },
  {
    rawText: '周末约了朋友去打羽毛球，顺便聊聊各自的创业项目',
    dockStatus: 'ignored',
    sourceType: 'text',
    topic: null,
    dayOffset: 0,
    hourOffset: 12,
    entry: null,
  },
  {
    rawText: '待办：完善单元测试覆盖率，当前只有 45%',
    dockStatus: 'reopened',
    sourceType: 'text',
    topic: '代码质量',
    dayOffset: 10,
    hourOffset: 9,
    entry: {
      title: '提升单元测试覆盖率',
      content: '待办：完善单元测试覆盖率，当前只有 45%\n\n优先补充测试：\n1. 建议引擎的规则匹配逻辑\n2. 状态机的转换规则\n3. Dexie 数据库 CRUD 操作\n4. Entry 的标签和项目关联\n5. Chat 模式的会话流程\n\n目标：覆盖率提升到 80%',
      type: 'task', tags: ['技术'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '笔记：CSS Container Queries 终于可以在生产环境使用了',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '技术笔记',
    dayOffset: 11,
    hourOffset: 19,
    entry: {
      title: 'CSS Container Queries 笔记',
      content: '笔记：CSS Container Queries 终于可以在生产环境使用了\n\n语法：\n- container-type: inline-size\n- @container (min-width: 400px) { ... }\n- container-name 命名容器\n\n优势：\n1. 组件级响应式，不依赖视口宽度\n2. 更适合组件库开发\n3. 与 Tailwind v4 结合使用\n\n应用：Dock 卡片可以根据容器宽度自适应布局',
      type: 'note', tags: ['技术', '前端'], project: null, actions: [],
    },
  },
  {
    rawText: '和投资人的沟通会议，需要准备产品数据和市场分析',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '融资',
    dayOffset: 22,
    hourOffset: 9,
    entry: {
      title: '投资人沟通会议准备',
      content: '和投资人的沟通会议，需要准备产品数据和市场分析\n\n准备材料：\n1. 产品 Demo 演示\n2. 用户增长数据（DAU/MAU）\n3. 竞品分析矩阵\n4. 商业模式说明\n5. 融资需求和使用计划',
      type: 'meeting', tags: ['产品', '工作'], project: 'MindDock', actions: ['加入日程', '待办提取'],
    },
  },
  {
    rawText: '读到一篇关于 Edge Computing 和本地优先结合的技术文章',
    dockStatus: 'archived',
    sourceType: 'import',
    topic: '技术调研',
    dayOffset: 6,
    hourOffset: 22,
    entry: {
      title: 'Edge Computing + 本地优先调研',
      content: '读到一篇关于 Edge Computing 和本地优先结合的技术文章\n\n核心观点：\n1. 边缘节点做数据中转和冲突解决\n2. 本地优先保证离线可用\n3. CRDT 在边缘节点做合并\n4. 减少中心化依赖，提升隐私保护\n\n与 MindDock 的关系：\n- 当前纯本地方案已满足 MVP\n- 未来可加边缘节点做跨设备同步',
      type: 'reading', tags: ['技术', '学习'], project: 'MindDock', actions: ['待解答'],
    },
  },
  {
    rawText: '想法：支持用 emoji 作为标签图标，让标签更直观',
    dockStatus: 'ignored',
    sourceType: 'chat',
    topic: null,
    dayOffset: 8,
    hourOffset: 20,
    entry: null,
  },
  {
    rawText: '待办：给 Chat 模式的消息添加打字机效果',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '功能开发',
    dayOffset: 9,
    hourOffset: 11,
    entry: {
      title: 'Chat 消息打字机效果',
      content: '待办：给 Chat 模式的消息添加打字机效果\n\n实现方案：\n1. 使用 requestAnimationFrame 逐字显示\n2. 显示速度：每 30ms 一个字符\n3. 代码块整体显示，不逐字\n4. 支持中途停止（用户点击跳过）\n5. 添加光标闪烁动画',
      type: 'task', tags: ['技术', '前端'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '笔记：关于产品定价策略的思考，免费 + Pro 模式可能更适合',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '产品策略',
    dayOffset: 18,
    hourOffset: 10,
    entry: {
      title: '产品定价策略思考',
      content: '笔记：关于产品定价策略的思考，免费 + Pro 模式可能更适合\n\n定价方案：\n1. 免费版：基础功能，本地存储，无限条目\n2. Pro 版：AI 建议、跨设备同步、高级搜索\n3. Team 版：协作、分享、管理后台\n\n定价参考：\n- Notion：$8/月\n- Obsidian：免费 + 同步 $4/月\n- Reflect：$10/月\n\nMindDock 定价：Pro $6/月，Team $12/月/人',
      type: 'note', tags: ['产品', '工作'], project: 'MindDock', actions: [],
    },
  },
  {
    rawText: '今天参加了线上 Meetup，主题是 AI 时代的个人知识管理',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '行业活动',
    dayOffset: 4,
    hourOffset: 20,
    entry: {
      title: 'AI 时代知识管理 Meetup 笔记',
      content: '今天参加了线上 Meetup，主题是 AI 时代的个人知识管理\n\n嘉宾观点：\n1. 知识管理核心是「连接」而非「存储」\n2. AI 应该辅助整理而非替代思考\n3. 隐私优先是未来趋势\n4. 本地优先 + AI 是最佳组合\n5. 知识图谱的可视化有助于发现隐藏关联\n\n启发：MindDock 的方向是对的，继续深耕本地优先 + AI 辅助',
      type: 'note', tags: ['学习', '产品'], project: 'MindDock', actions: [],
    },
  },
  {
    rawText: '待办：调研 Notion API 看看能不能做数据导入',
    dockStatus: 'pending',
    sourceType: 'text',
    topic: null,
    dayOffset: 0,
    hourOffset: 16,
    entry: null,
  },
  {
    rawText: '用户反馈：建议添加快捷键支持，比如 Ctrl+N 新建条目',
    dockStatus: 'pending',
    sourceType: 'import',
    topic: null,
    dayOffset: 0,
    hourOffset: 11,
    entry: null,
  },
  {
    rawText: '读到一篇关于 Design System 构建的文章，提到了 Token 化的设计规范',
    dockStatus: 'suggested',
    sourceType: 'import',
    topic: null,
    dayOffset: 3,
    hourOffset: 17,
    entry: null,
  },
  {
    rawText: '想法：让用户自定义建议引擎的规则，比如添加自己的关键词映射',
    dockStatus: 'suggested',
    sourceType: 'chat',
    topic: null,
    dayOffset: 2,
    hourOffset: 14,
    entry: null,
  },
  {
    rawText: '今天做了性能测试，1000 条 Entry 的列表渲染耗时 800ms，需要优化',
    dockStatus: 'reopened',
    sourceType: 'text',
    topic: '性能优化',
    dayOffset: 3,
    hourOffset: 11,
    entry: {
      title: 'Entry 列表性能优化',
      content: '今天做了性能测试，1000 条 Entry 的列表渲染耗时 800ms，需要优化\n\n性能数据：\n- 100 条：120ms\n- 500 条：450ms\n- 1000 条：800ms\n- 2000 条：1500ms\n\n瓶颈分析：\n1. EntryListItem 组件渲染过重\n2. 日期格式化计算重复\n3. 标签组件未做 memo\n\n优化方案：\n1. 虚拟列表\n2. useMemo 缓存计算结果\n3. React.memo 包裹子组件',
      type: 'task', tags: ['技术', '性能'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '笔记：关于开源策略的思考，核心引擎开源，云服务收费',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '产品策略',
    dayOffset: 20,
    hourOffset: 15,
    entry: {
      title: '开源策略思考',
      content: '笔记：关于开源策略的思考，核心引擎开源，云服务收费\n\n开源部分：\n1. 建议引擎核心逻辑\n2. 状态机实现\n3. 数据模型定义\n4. 基础 UI 组件\n\n收费部分：\n1. 云端同步服务\n2. AI 增强建议\n3. 团队协作功能\n4. 高级搜索\n\n参考案例：Obsidian、GitLab、Supabase',
      type: 'note', tags: ['产品', '工作'], project: 'MindDock', actions: [],
    },
  },
  {
    rawText: '今天整理了书架，发现好几本买了没读的书',
    dockStatus: 'ignored',
    sourceType: 'voice',
    topic: null,
    dayOffset: 15,
    hourOffset: 16,
    entry: null,
  },
  {
    rawText: '待办：给 Dock 添加键盘导航支持（上下箭头切换条目）',
    dockStatus: 'pending',
    sourceType: 'text',
    topic: null,
    dayOffset: 0,
    hourOffset: 13,
    entry: null,
  },
  {
    rawText: '和联创讨论了 MVP 的功能边界，决定砍掉协作功能放到 v2',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '产品规划',
    dayOffset: 23,
    hourOffset: 11,
    entry: {
      title: 'MVP 功能边界讨论',
      content: '和联创讨论了 MVP 的功能边界，决定砍掉协作功能放到 v2\n\nMVP 包含：\n1. 文本/语音/Chat 输入\n2. Dock 整理流程\n3. 建议引擎\n4. Entry 归档和检索\n5. 标签管理\n\nv2 规划：\n1. 跨设备同步\n2. 团队协作\n3. 数据导入/导出\n4. 高级搜索\n5. 插件系统',
      type: 'meeting', tags: ['产品', '项目管理'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '读到《黑客与画家》第 8 章，关于创造财富和创业的关系',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '读书笔记',
    dayOffset: 19,
    hourOffset: 22,
    entry: {
      title: '《黑客与画家》第 8 章笔记',
      content: '读到《黑客与画家》第 8 章，关于创造财富和创业的关系\n\n核心观点：\n1. 财富 ≠ 金钱，财富是人们想要的东西\n2. 创业 = 把创造财富的速度最大化\n3. 技术创业的优势：可扩展性\n4. 小团队效率 > 大团队\n5. 做用户需要的东西，而不是自己觉得酷的东西\n\n启发：MindDock 要聚焦用户真正的痛点——信息整理的效率',
      type: 'reading', tags: ['学习'], project: null, actions: [],
    },
  },
  {
    rawText: '想法：支持从浏览器书签和阅读列表自动导入文章',
    dockStatus: 'suggested',
    sourceType: 'chat',
    topic: null,
    dayOffset: 6,
    hourOffset: 13,
    entry: null,
  },
  {
    rawText: '待办：给暗色模式添加过渡动画，避免切换时闪烁',
    dockStatus: 'ignored',
    sourceType: 'text',
    topic: null,
    dayOffset: 17,
    hourOffset: 14,
    entry: null,
  },
  {
    rawText: '今天测试了 Import 功能，从 Markdown 文件导入效果不错',
    dockStatus: 'archived',
    sourceType: 'import',
    topic: '功能测试',
    dayOffset: 8,
    hourOffset: 11,
    entry: {
      title: 'Import 功能测试报告',
      content: '今天测试了 Import 功能，从 Markdown 文件导入效果不错\n\n测试结果：\n- 标题解析：100% 准确\n- 列表解析：支持有序和无序列表\n- 代码块：保留语言标记\n- 标签提取：从 #tag 语法提取\n- 问题：嵌套列表缩进丢失\n\n待修复：\n1. 嵌套列表的缩进处理\n2. 表格渲染兼容性\n3. 图片链接的本地化',
      type: 'note', tags: ['技术'], project: 'MindDock', actions: ['待办提取'],
    },
  },
  {
    rawText: '笔记：关于用户 Onboarding 流程的设计，3 步引导比 5 步完成率高',
    dockStatus: 'archived',
    sourceType: 'text',
    topic: '产品设计',
    dayOffset: 5,
    hourOffset: 16,
    entry: {
      title: '用户 Onboarding 流程设计',
      content: '笔记：关于用户 Onboarding 流程的设计，3 步引导比 5 步完成率高\n\n设计方案：\n1. 第 1 步：输入第一条想法（体验核心功能）\n2. 第 2 步：查看 Dock 整理结果（理解价值）\n3. 第 3 步：浏览 Entry 归档（发现更多可能）\n\n数据支撑：\n- 3 步引导完成率 78%\n- 5 步引导完成率 52%\n- 无引导完成率 31%',
      type: 'note', tags: ['产品', '设计'], project: 'MindDock', actions: [],
    },
  },
]

const SEED_TAGS = ['产品', '技术', '学习', '项目管理', '生活', '性能', '工作', '前端', '设计', '支付']

interface SeedChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface SeedChatSession {
  seedItemIndex: number
  topic: string | null
  selectedType: string | null
  content: string
  pinned: boolean
  messages: SeedChatMessage[]
}

const SEED_CHAT_SESSIONS: SeedChatSession[] = [
  {
    seedItemIndex: 2,
    topic: '产品灵感',
    selectedType: 'idea',
    content: '灵感：假如把知识图谱和本地优先结合，用户可以拥有自己的语义网络',
    pinned: true,
    messages: [
      { role: 'assistant', content: '你好！今天有什么奇思妙想？' },
      { role: 'user', content: '产品灵感' },
      { role: 'assistant', content: '这次记录是什么类型呢' },
      { role: 'user', content: 'idea' },
      { role: 'assistant', content: '你想记录些什么呢' },
      { role: 'user', content: '灵感：假如把知识图谱和本地优先结合，用户可以拥有自己的语义网络' },
      { role: 'assistant', content: '灵感已记录，是否落库？' },
      { role: 'assistant', content: '✨ 已成功入 Dock！' },
    ],
  },
  {
    seedItemIndex: 7,
    topic: '周末计划',
    selectedType: 'note',
    content: '周末去爬山，回来整理一下照片和路线记录',
    pinned: false,
    messages: [
      { role: 'assistant', content: '嗨！想记录点什么？' },
      { role: 'user', content: '周末计划' },
      { role: 'assistant', content: '这次记录是什么类型呢' },
      { role: 'user', content: 'note' },
      { role: 'assistant', content: '你想记录些什么呢' },
      { role: 'user', content: '周末去爬山，回来整理一下照片和路线记录' },
      { role: 'assistant', content: '灵感已记录，是否落库？' },
      { role: 'assistant', content: '✨ 已成功入 Dock！' },
    ],
  },
  {
    seedItemIndex: 11,
    topic: '产品灵感',
    selectedType: 'idea',
    content: '想法：给 Dock 加一个「智能分组」功能，按主题自动聚类',
    pinned: false,
    messages: [
      { role: 'assistant', content: '你好！有什么新鲜想法？' },
      { role: 'user', content: '产品灵感' },
      { role: 'assistant', content: '这次记录是什么类型呢' },
      { role: 'user', content: 'idea' },
      { role: 'assistant', content: '你想记录些什么呢' },
      { role: 'user', content: '想法：给 Dock 加一个「智能分组」功能，按主题自动聚类' },
      { role: 'assistant', content: '灵感已记录，是否落库？' },
      { role: 'assistant', content: '✨ 已成功入 Dock！' },
    ],
  },
  {
    seedItemIndex: 19,
    topic: '产品想法',
    selectedType: 'idea',
    content: '产品想法：支持从微信读书导入笔记和标注',
    pinned: false,
    messages: [
      { role: 'assistant', content: '嗨！来聊聊你的想法吧' },
      { role: 'user', content: '产品想法' },
      { role: 'assistant', content: '这次记录是什么类型呢' },
      { role: 'user', content: 'idea' },
      { role: 'assistant', content: '你想记录些什么呢' },
      { role: 'user', content: '产品想法：支持从微信读书导入笔记和标注' },
      { role: 'assistant', content: '灵感已记录，是否落库？' },
      { role: 'assistant', content: '✨ 已成功入 Dock！' },
    ],
  },
  {
    seedItemIndex: 23,
    topic: '产品灵感',
    selectedType: 'idea',
    content: '想法：Entry 可以支持双向链接，用 [[语法自动关联相关条目',
    pinned: true,
    messages: [
      { role: 'assistant', content: '你好！今天有什么奇思妙想？' },
      { role: 'user', content: '产品灵感' },
      { role: 'assistant', content: '这次记录是什么类型呢' },
      { role: 'user', content: 'idea' },
      { role: 'assistant', content: '你想记录些什么呢' },
      { role: 'user', content: '想法：Entry 可以支持双向链接，用 [[语法自动关联相关条目' },
      { role: 'assistant', content: '灵感已记录，是否落库？' },
      { role: 'assistant', content: '✨ 已成功入 Dock！' },
    ],
  },
  {
    seedItemIndex: 27,
    topic: '产品灵感',
    selectedType: 'idea',
    content: '想法：做一个「每日回顾」功能，每天早上推送昨天的待办和灵感',
    pinned: false,
    messages: [
      { role: 'assistant', content: '嗨！想记录点什么？' },
      { role: 'user', content: '产品灵感' },
      { role: 'assistant', content: '这次记录是什么类型呢' },
      { role: 'user', content: 'idea' },
      { role: 'assistant', content: '你想记录些什么呢' },
      { role: 'user', content: '想法：做一个「每日回顾」功能，每天早上推送昨天的待办和灵感' },
      { role: 'assistant', content: '灵感已记录，是否落库？' },
      { role: 'assistant', content: '✨ 已成功入 Dock！' },
    ],
  },
  {
    seedItemIndex: 34,
    topic: '功能想法',
    selectedType: 'idea',
    content: '想法：给每个 Entry 加一个「相关推荐」模块，基于标签和内容相似度',
    pinned: false,
    messages: [
      { role: 'assistant', content: '你好！有什么新鲜想法？' },
      { role: 'user', content: '功能想法' },
      { role: 'assistant', content: '这次记录是什么类型呢' },
      { role: 'user', content: 'idea' },
      { role: 'assistant', content: '你想记录些什么呢' },
      { role: 'user', content: '想法：给每个 Entry 加一个「相关推荐」模块，基于标签和内容相似度' },
      { role: 'assistant', content: '灵感已记录，是否落库？' },
      { role: 'assistant', content: '✨ 已成功入 Dock！' },
    ],
  },
  {
    seedItemIndex: 40,
    topic: '产品灵感',
    selectedType: 'idea',
    content: '想法：支持用自然语言查询 Entry，比如「上周关于产品的所有会议」',
    pinned: false,
    messages: [
      { role: 'assistant', content: '嗨！来聊聊你的想法吧' },
      { role: 'user', content: '产品灵感' },
      { role: 'assistant', content: '这次记录是什么类型呢' },
      { role: 'user', content: 'idea' },
      { role: 'assistant', content: '你想记录些什么呢' },
      { role: 'user', content: '想法：支持用自然语言查询 Entry，比如「上周关于产品的所有会议」' },
      { role: 'assistant', content: '灵感已记录，是否落库？' },
      { role: 'assistant', content: '✨ 已成功入 Dock！' },
    ],
  },
  {
    seedItemIndex: 46,
    topic: '功能构想',
    selectedType: 'idea',
    content: '想法：做一个「知识地图」视图，用图形化方式展示 Entry 之间的关联',
    pinned: false,
    messages: [
      { role: 'assistant', content: '你好！今天有什么奇思妙想？' },
      { role: 'user', content: '功能构想' },
      { role: 'assistant', content: '这次记录是什么类型呢' },
      { role: 'user', content: 'idea' },
      { role: 'assistant', content: '你想记录些什么呢' },
      { role: 'user', content: '想法：做一个「知识地图」视图，用图形化方式展示 Entry 之间的关联' },
      { role: 'assistant', content: '灵感已记录，是否落库？' },
      { role: 'assistant', content: '✨ 已成功入 Dock！' },
    ],
  },
  {
    seedItemIndex: 53,
    topic: 'UI 优化',
    selectedType: 'idea',
    content: '想法：支持用 emoji 作为标签图标，让标签更直观',
    pinned: false,
    messages: [
      { role: 'assistant', content: '嗨！想记录点什么？' },
      { role: 'user', content: 'UI 优化' },
      { role: 'assistant', content: '这次记录是什么类型呢' },
      { role: 'user', content: 'idea' },
      { role: 'assistant', content: '你想记录些什么呢' },
      { role: 'user', content: '想法：支持用 emoji 作为标签图标，让标签更直观' },
      { role: 'assistant', content: '灵感已记录，是否落库？' },
      { role: 'assistant', content: '✨ 已成功入 Dock！' },
    ],
  },
  {
    seedItemIndex: 57,
    topic: '功能定制',
    selectedType: 'idea',
    content: '想法：让用户自定义建议引擎的规则，比如添加自己的关键词映射',
    pinned: false,
    messages: [
      { role: 'assistant', content: '你好！有什么新鲜想法？' },
      { role: 'user', content: '功能定制' },
      { role: 'assistant', content: '这次记录是什么类型呢' },
      { role: 'user', content: 'idea' },
      { role: 'assistant', content: '你想记录些什么呢' },
      { role: 'user', content: '想法：让用户自定义建议引擎的规则，比如添加自己的关键词映射' },
      { role: 'assistant', content: '灵感已记录，是否落库？' },
      { role: 'assistant', content: '✨ 已成功入 Dock！' },
    ],
  },
  {
    seedItemIndex: 60,
    topic: '导入功能',
    selectedType: 'idea',
    content: '想法：支持从浏览器书签和阅读列表自动导入文章',
    pinned: false,
    messages: [
      { role: 'assistant', content: '嗨！来聊聊你的想法吧' },
      { role: 'user', content: '导入功能' },
      { role: 'assistant', content: '这次记录是什么类型呢' },
      { role: 'user', content: 'idea' },
      { role: 'assistant', content: '你想记录些什么呢' },
      { role: 'user', content: '想法：支持从浏览器书签和阅读列表自动导入文章' },
      { role: 'assistant', content: '灵感已记录，是否落库？' },
      { role: 'assistant', content: '✨ 已成功入 Dock！' },
    ],
  },
]

interface SeedMindNode {
  nodeType: 'root' | 'domain' | 'project' | 'topic' | 'document' | 'fragment' | 'source' | 'tag' | 'question' | 'insight' | 'time'
  label: string
  state: 'drifting' | 'suggested' | 'anchored' | 'archived' | 'dormant' | 'active' | 'conflicted' | 'isolated'
  documentId: number | null
  degreeScore: number
}

interface SeedMindEdge {
  sourceLabel: string
  sourceType: string
  targetLabel: string
  targetType: string
  edgeType: 'parent_child' | 'semantic' | 'reference' | 'source' | 'temporal' | 'confirmed' | 'suggested'
  strength: number
}

const SEED_MIND_NODES: SeedMindNode[] = [
  { nodeType: 'root', label: 'World Tree', state: 'anchored', documentId: null, degreeScore: 10 },
  { nodeType: 'domain', label: 'Core Architecture', state: 'active', documentId: null, degreeScore: 8 },
  { nodeType: 'domain', label: 'Personal Growth', state: 'active', documentId: null, degreeScore: 6 },
  { nodeType: 'domain', label: 'Product Strategy', state: 'active', documentId: null, degreeScore: 7 },
  { nodeType: 'domain', label: 'Data Intelligence', state: 'active', documentId: null, degreeScore: 7 },
  { nodeType: 'domain', label: 'Design System', state: 'active', documentId: null, degreeScore: 5 },
  { nodeType: 'domain', label: 'DevOps & Infrastructure', state: 'active', documentId: null, degreeScore: 5 },
  { nodeType: 'domain', label: 'User Research', state: 'active', documentId: null, degreeScore: 4 },
  { nodeType: 'domain', label: 'Business & Growth', state: 'active', documentId: null, degreeScore: 4 },
  { nodeType: 'project', label: 'MindDock', state: 'anchored', documentId: null, degreeScore: 9 },
  { nodeType: 'project', label: 'System Rebuild', state: 'anchored', documentId: null, degreeScore: 5 },
  { nodeType: 'project', label: 'Graph Algorithm', state: 'suggested', documentId: null, degreeScore: 4 },
  { nodeType: 'project', label: 'Search Engine', state: 'suggested', documentId: null, degreeScore: 4 },
  { nodeType: 'project', label: 'Sync Service', state: 'drifting', documentId: null, degreeScore: 3 },
  { nodeType: 'topic', label: 'Physics Engine', state: 'active', documentId: null, degreeScore: 6 },
  { nodeType: 'topic', label: 'UX Guidelines', state: 'active', documentId: null, degreeScore: 5 },
  { nodeType: 'topic', label: 'API Reference', state: 'active', documentId: null, degreeScore: 4 },
  { nodeType: 'topic', label: 'Reading Notes', state: 'dormant', documentId: null, degreeScore: 3 },
  { nodeType: 'topic', label: 'Embedding & Vector', state: 'active', documentId: null, degreeScore: 5 },
  { nodeType: 'topic', label: 'Prompt Engineering', state: 'active', documentId: null, degreeScore: 4 },
  { nodeType: 'topic', label: 'CI/CD Pipeline', state: 'active', documentId: null, degreeScore: 3 },
  { nodeType: 'topic', label: 'Monitoring & Alerting', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'topic', label: 'User Interview', state: 'active', documentId: null, degreeScore: 3 },
  { nodeType: 'topic', label: 'A/B Testing', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Graph Engine Physics', state: 'anchored', documentId: null, degreeScore: 5 },
  { nodeType: 'document', label: 'Algorithm Design', state: 'anchored', documentId: null, degreeScore: 4 },
  { nodeType: 'document', label: 'RAG Architecture', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Local-first Architecture', state: 'anchored', documentId: null, degreeScore: 4 },
  { nodeType: 'document', label: 'Prompt Engineering', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Design Psychology Notes', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Thinking Fast and Slow', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Hackers and Painters', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Edge Computing Research', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'PWA Offline Research', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Dexie Query Notes', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Next.js Cache Notes', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Tailwind v4 Notes', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Container Queries Notes', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Web Audio API Research', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'LLM Agent Architecture', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Code Review Summary', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Pricing Strategy', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Open Source Strategy', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Onboarding Design', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Import Test Report', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Voice Input Test Report', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Search Performance Optimization', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Entry List Performance', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Dock Batch Operations', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Chat Typewriter Effect', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Markdown Rendering', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Dark Mode Border Fix', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Unit Test Coverage', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Investor Meeting Prep', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'User Growth Strategy', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'MVP Scope Discussion', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'API Alignment Meeting', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Dock Card Interaction', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'v2 Priority Discussion', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Product Review Meeting', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Client Demo Feedback', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'AI Meetup Notes', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Tag Editor Drag Sort', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Bidirectional Link Concept', state: 'suggested', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Smart Grouping Concept', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Daily Review Concept', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'NL Query Concept', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Knowledge Map Concept', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Related Recommendations Concept', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Browser Import Concept', state: 'suggested', documentId: null, degreeScore: 1 },
  { nodeType: 'document', label: 'Custom Rules Concept', state: 'suggested', documentId: null, degreeScore: 1 },
  { nodeType: 'document', label: 'Emoji Tag Concept', state: 'drifting', documentId: null, degreeScore: 1 },
  { nodeType: 'document', label: 'WeChat Import Concept', state: 'suggested', documentId: null, degreeScore: 1 },
  { nodeType: 'document', label: 'Vector Database Comparison', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Embedding Model Evaluation', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Semantic Chunking Strategy', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Hybrid Search Design', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Re-ranking Algorithm', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Fine-tuning vs RAG', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Multi-modal Retrieval', state: 'drifting', documentId: null, degreeScore: 1 },
  { nodeType: 'document', label: 'Design Token System', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Component Library Spec', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Color System Guide', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Typography Scale', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Motion Design Principles', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Accessibility Checklist', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Dark Mode Design Guide', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Responsive Breakpoints', state: 'dormant', documentId: null, degreeScore: 1 },
  { nodeType: 'document', label: 'GitHub Actions Workflow', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Docker Compose Setup', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Vercel Deploy Config', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Error Tracking Setup', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Performance Budget', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Log Aggregation Design', state: 'drifting', documentId: null, degreeScore: 1 },
  { nodeType: 'document', label: 'User Interview Script', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Survey Results Analysis', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Persona Definition', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Journey Map v1', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Usability Test Report', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Feature Request Tracker', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'NPS Score Analysis', state: 'drifting', documentId: null, degreeScore: 1 },
  { nodeType: 'document', label: 'Competitive Landscape', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'Go-to-Market Plan', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Revenue Model Design', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Partnership Strategy', state: 'drifting', documentId: null, degreeScore: 1 },
  { nodeType: 'document', label: 'Content Marketing Plan', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Community Building Guide', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'CRDT Conflict Resolution', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'document', label: 'IndexedDB Performance Tuning', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'WebWorker Architecture', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Service Worker Caching', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Zustand vs Jotai Comparison', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'React Server Components Notes', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Virtual List Implementation', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'document', label: 'Keyboard Navigation Spec', state: 'suggested', documentId: null, degreeScore: 1 },
  { nodeType: 'document', label: 'Data Export Format Design', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'source', label: 'text', state: 'anchored', documentId: null, degreeScore: 8 },
  { nodeType: 'source', label: 'chat', state: 'anchored', documentId: null, degreeScore: 5 },
  { nodeType: 'source', label: 'import', state: 'anchored', documentId: null, degreeScore: 4 },
  { nodeType: 'source', label: 'voice', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'tag', label: '技术', state: 'active', documentId: null, degreeScore: 9 },
  { nodeType: 'tag', label: '产品', state: 'active', documentId: null, degreeScore: 8 },
  { nodeType: 'tag', label: '学习', state: 'active', documentId: null, degreeScore: 6 },
  { nodeType: 'tag', label: '前端', state: 'active', documentId: null, degreeScore: 5 },
  { nodeType: 'tag', label: '性能', state: 'active', documentId: null, degreeScore: 4 },
  { nodeType: 'tag', label: '设计', state: 'dormant', documentId: null, degreeScore: 3 },
  { nodeType: 'tag', label: '项目管理', state: 'dormant', documentId: null, degreeScore: 3 },
  { nodeType: 'tag', label: '工作', state: 'dormant', documentId: null, degreeScore: 2 },
  { nodeType: 'tag', label: 'AI', state: 'active', documentId: null, degreeScore: 5 },
  { nodeType: 'tag', label: '架构', state: 'active', documentId: null, degreeScore: 4 },
  { nodeType: 'tag', label: '支付', state: 'isolated', documentId: null, degreeScore: 1 },
  { nodeType: 'tag', label: '生活', state: 'isolated', documentId: null, degreeScore: 1 },
  { nodeType: 'insight', label: 'Local-first + AI is the best combo', state: 'anchored', documentId: null, degreeScore: 4 },
  { nodeType: 'insight', label: 'Chunk strategy matters more than embedding model', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'insight', label: 'Knowledge management is about connections not storage', state: 'suggested', documentId: null, degreeScore: 3 },
  { nodeType: 'insight', label: 'UI should reduce cognitive load for fast thinking', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'insight', label: 'Design tokens enable consistent theming across platforms', state: 'anchored', documentId: null, degreeScore: 2 },
  { nodeType: 'insight', label: 'Hybrid search outperforms pure vector search', state: 'anchored', documentId: null, degreeScore: 3 },
  { nodeType: 'insight', label: 'Observability is a feature not an afterthought', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'insight', label: 'User research should drive product decisions not assumptions', state: 'suggested', documentId: null, degreeScore: 2 },
  { nodeType: 'question', label: 'How to handle cross-device sync?', state: 'drifting', documentId: null, degreeScore: 2 },
  { nodeType: 'question', label: 'Should we use CRDT or event sourcing?', state: 'drifting', documentId: null, degreeScore: 2 },
  { nodeType: 'question', label: 'What is the optimal pricing model?', state: 'drifting', documentId: null, degreeScore: 1 },
  { nodeType: 'question', label: 'How to balance AI automation with user control?', state: 'drifting', documentId: null, degreeScore: 2 },
  { nodeType: 'question', label: 'When to introduce collaboration features?', state: 'drifting', documentId: null, degreeScore: 1 },
  { nodeType: 'question', label: 'Should we build a plugin system?', state: 'drifting', documentId: null, degreeScore: 1 },
  { nodeType: 'time', label: '2026-Q2', state: 'active', documentId: null, degreeScore: 3 },
  { nodeType: 'time', label: '2026-April', state: 'active', documentId: null, degreeScore: 4 },
  { nodeType: 'time', label: '2026-May', state: 'active', documentId: null, degreeScore: 3 },
  { nodeType: 'time', label: '2026-Q3', state: 'suggested', documentId: null, degreeScore: 2 },
]

const SEED_MIND_EDGES: SeedMindEdge[] = [
  { sourceLabel: 'World Tree', sourceType: 'root', targetLabel: 'Core Architecture', targetType: 'domain', edgeType: 'parent_child', strength: 0.9 },
  { sourceLabel: 'World Tree', sourceType: 'root', targetLabel: 'Personal Growth', targetType: 'domain', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'World Tree', sourceType: 'root', targetLabel: 'Product Strategy', targetType: 'domain', edgeType: 'parent_child', strength: 0.85 },
  { sourceLabel: 'World Tree', sourceType: 'root', targetLabel: 'Data Intelligence', targetType: 'domain', edgeType: 'parent_child', strength: 0.85 },
  { sourceLabel: 'World Tree', sourceType: 'root', targetLabel: 'Design System', targetType: 'domain', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'World Tree', sourceType: 'root', targetLabel: 'DevOps & Infrastructure', targetType: 'domain', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'World Tree', sourceType: 'root', targetLabel: 'User Research', targetType: 'domain', edgeType: 'parent_child', strength: 0.65 },
  { sourceLabel: 'World Tree', sourceType: 'root', targetLabel: 'Business & Growth', targetType: 'domain', edgeType: 'parent_child', strength: 0.65 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'MindDock', targetType: 'project', edgeType: 'parent_child', strength: 0.9 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'System Rebuild', targetType: 'project', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'Graph Algorithm', targetType: 'project', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Data Intelligence', sourceType: 'domain', targetLabel: 'Search Engine', targetType: 'project', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'Sync Service', targetType: 'project', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'MindDock', sourceType: 'project', targetLabel: 'Physics Engine', targetType: 'topic', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'MindDock', sourceType: 'project', targetLabel: 'UX Guidelines', targetType: 'topic', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'MindDock', sourceType: 'project', targetLabel: 'API Reference', targetType: 'topic', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Personal Growth', sourceType: 'domain', targetLabel: 'Reading Notes', targetType: 'topic', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'Data Intelligence', sourceType: 'domain', targetLabel: 'Embedding & Vector', targetType: 'topic', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'Data Intelligence', sourceType: 'domain', targetLabel: 'Prompt Engineering', targetType: 'topic', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'DevOps & Infrastructure', sourceType: 'domain', targetLabel: 'CI/CD Pipeline', targetType: 'topic', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'DevOps & Infrastructure', sourceType: 'domain', targetLabel: 'Monitoring & Alerting', targetType: 'topic', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'User Research', sourceType: 'domain', targetLabel: 'User Interview', targetType: 'topic', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'User Research', sourceType: 'domain', targetLabel: 'A/B Testing', targetType: 'topic', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'Physics Engine', sourceType: 'topic', targetLabel: 'Graph Engine Physics', targetType: 'document', edgeType: 'parent_child', strength: 0.9 },
  { sourceLabel: 'Physics Engine', sourceType: 'topic', targetLabel: 'Algorithm Design', targetType: 'document', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'Physics Engine', sourceType: 'topic', targetLabel: 'RAG Architecture', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Physics Engine', sourceType: 'topic', targetLabel: 'Local-first Architecture', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'UX Guidelines', sourceType: 'topic', targetLabel: 'Design Psychology Notes', targetType: 'document', edgeType: 'reference', strength: 0.7 },
  { sourceLabel: 'UX Guidelines', sourceType: 'topic', targetLabel: 'Onboarding Design', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'UX Guidelines', sourceType: 'topic', targetLabel: 'Dock Card Interaction', targetType: 'document', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'API Reference', sourceType: 'topic', targetLabel: 'API Alignment Meeting', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Reading Notes', sourceType: 'topic', targetLabel: 'Thinking Fast and Slow', targetType: 'document', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'Reading Notes', sourceType: 'topic', targetLabel: 'Hackers and Painters', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Reading Notes', sourceType: 'topic', targetLabel: 'Design Psychology Notes', targetType: 'document', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'Product Strategy', sourceType: 'domain', targetLabel: 'Pricing Strategy', targetType: 'document', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'Product Strategy', sourceType: 'domain', targetLabel: 'Open Source Strategy', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Product Strategy', sourceType: 'domain', targetLabel: 'MVP Scope Discussion', targetType: 'document', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'Product Strategy', sourceType: 'domain', targetLabel: 'v2 Priority Discussion', targetType: 'document', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'Product Strategy', sourceType: 'domain', targetLabel: 'User Growth Strategy', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Product Strategy', sourceType: 'domain', targetLabel: 'Investor Meeting Prep', targetType: 'document', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'Embedding & Vector', sourceType: 'topic', targetLabel: 'Vector Database Comparison', targetType: 'document', edgeType: 'parent_child', strength: 0.9 },
  { sourceLabel: 'Embedding & Vector', sourceType: 'topic', targetLabel: 'Embedding Model Evaluation', targetType: 'document', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'Embedding & Vector', sourceType: 'topic', targetLabel: 'Semantic Chunking Strategy', targetType: 'document', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'Embedding & Vector', sourceType: 'topic', targetLabel: 'Hybrid Search Design', targetType: 'document', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'Embedding & Vector', sourceType: 'topic', targetLabel: 'Re-ranking Algorithm', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Prompt Engineering', sourceType: 'topic', targetLabel: 'Fine-tuning vs RAG', targetType: 'document', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'Prompt Engineering', sourceType: 'topic', targetLabel: 'Multi-modal Retrieval', targetType: 'document', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'Design System', sourceType: 'domain', targetLabel: 'Design Token System', targetType: 'document', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'Design System', sourceType: 'domain', targetLabel: 'Component Library Spec', targetType: 'document', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'Design System', sourceType: 'domain', targetLabel: 'Color System Guide', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Design System', sourceType: 'domain', targetLabel: 'Typography Scale', targetType: 'document', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'Design System', sourceType: 'domain', targetLabel: 'Motion Design Principles', targetType: 'document', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'Design System', sourceType: 'domain', targetLabel: 'Accessibility Checklist', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Design System', sourceType: 'domain', targetLabel: 'Dark Mode Design Guide', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Design System', sourceType: 'domain', targetLabel: 'Responsive Breakpoints', targetType: 'document', edgeType: 'parent_child', strength: 0.4 },
  { sourceLabel: 'DevOps & Infrastructure', sourceType: 'domain', targetLabel: 'GitHub Actions Workflow', targetType: 'document', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'DevOps & Infrastructure', sourceType: 'domain', targetLabel: 'Docker Compose Setup', targetType: 'document', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'DevOps & Infrastructure', sourceType: 'domain', targetLabel: 'Vercel Deploy Config', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'DevOps & Infrastructure', sourceType: 'domain', targetLabel: 'Error Tracking Setup', targetType: 'document', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'DevOps & Infrastructure', sourceType: 'domain', targetLabel: 'Performance Budget', targetType: 'document', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'DevOps & Infrastructure', sourceType: 'domain', targetLabel: 'Log Aggregation Design', targetType: 'document', edgeType: 'parent_child', strength: 0.4 },
  { sourceLabel: 'User Research', sourceType: 'domain', targetLabel: 'User Interview Script', targetType: 'document', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'User Research', sourceType: 'domain', targetLabel: 'Survey Results Analysis', targetType: 'document', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'User Research', sourceType: 'domain', targetLabel: 'Persona Definition', targetType: 'document', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'User Research', sourceType: 'domain', targetLabel: 'Journey Map v1', targetType: 'document', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'User Research', sourceType: 'domain', targetLabel: 'Usability Test Report', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'User Research', sourceType: 'domain', targetLabel: 'Feature Request Tracker', targetType: 'document', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'User Research', sourceType: 'domain', targetLabel: 'NPS Score Analysis', targetType: 'document', edgeType: 'parent_child', strength: 0.4 },
  { sourceLabel: 'Business & Growth', sourceType: 'domain', targetLabel: 'Competitive Landscape', targetType: 'document', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: 'Business & Growth', sourceType: 'domain', targetLabel: 'Go-to-Market Plan', targetType: 'document', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'Business & Growth', sourceType: 'domain', targetLabel: 'Revenue Model Design', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Business & Growth', sourceType: 'domain', targetLabel: 'Partnership Strategy', targetType: 'document', edgeType: 'parent_child', strength: 0.4 },
  { sourceLabel: 'Business & Growth', sourceType: 'domain', targetLabel: 'Content Marketing Plan', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Business & Growth', sourceType: 'domain', targetLabel: 'Community Building Guide', targetType: 'document', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'CRDT Conflict Resolution', targetType: 'document', edgeType: 'parent_child', strength: 0.7 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'IndexedDB Performance Tuning', targetType: 'document', edgeType: 'parent_child', strength: 0.6 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'WebWorker Architecture', targetType: 'document', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'Service Worker Caching', targetType: 'document', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'Zustand vs Jotai Comparison', targetType: 'document', edgeType: 'parent_child', strength: 0.4 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'React Server Components Notes', targetType: 'document', edgeType: 'parent_child', strength: 0.4 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'Virtual List Implementation', targetType: 'document', edgeType: 'parent_child', strength: 0.5 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'Keyboard Navigation Spec', targetType: 'document', edgeType: 'parent_child', strength: 0.3 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'Data Export Format Design', targetType: 'document', edgeType: 'parent_child', strength: 0.4 },
  { sourceLabel: 'RAG Architecture', sourceType: 'document', targetLabel: 'LLM Agent Architecture', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'RAG Architecture', sourceType: 'document', targetLabel: 'Prompt Engineering', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'RAG Architecture', sourceType: 'document', targetLabel: 'Vector Database Comparison', targetType: 'document', edgeType: 'semantic', strength: 0.8 },
  { sourceLabel: 'RAG Architecture', sourceType: 'document', targetLabel: 'Embedding Model Evaluation', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'RAG Architecture', sourceType: 'document', targetLabel: 'Semantic Chunking Strategy', targetType: 'document', edgeType: 'semantic', strength: 0.8 },
  { sourceLabel: 'RAG Architecture', sourceType: 'document', targetLabel: 'Hybrid Search Design', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'RAG Architecture', sourceType: 'document', targetLabel: 'Re-ranking Algorithm', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'RAG Architecture', sourceType: 'document', targetLabel: 'Fine-tuning vs RAG', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Local-first Architecture', sourceType: 'document', targetLabel: 'Edge Computing Research', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Local-first Architecture', sourceType: 'document', targetLabel: 'PWA Offline Research', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Local-first Architecture', sourceType: 'document', targetLabel: 'CRDT Conflict Resolution', targetType: 'document', edgeType: 'semantic', strength: 0.8 },
  { sourceLabel: 'Local-first Architecture', sourceType: 'document', targetLabel: 'IndexedDB Performance Tuning', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Local-first Architecture', sourceType: 'document', targetLabel: 'Service Worker Caching', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Local-first Architecture', sourceType: 'document', targetLabel: 'Sync Service', targetType: 'project', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Dexie Query Notes', sourceType: 'document', targetLabel: 'Next.js Cache Notes', targetType: 'document', edgeType: 'temporal', strength: 0.4 },
  { sourceLabel: 'Dexie Query Notes', sourceType: 'document', targetLabel: 'IndexedDB Performance Tuning', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Search Performance Optimization', sourceType: 'document', targetLabel: 'Entry List Performance', targetType: 'document', edgeType: 'semantic', strength: 0.8 },
  { sourceLabel: 'Search Performance Optimization', sourceType: 'document', targetLabel: 'Virtual List Implementation', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Search Performance Optimization', sourceType: 'document', targetLabel: 'Hybrid Search Design', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Search Performance Optimization', sourceType: 'document', targetLabel: 'Vector Database Comparison', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Dock Batch Operations', sourceType: 'document', targetLabel: 'Dock Card Interaction', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Chat Typewriter Effect', sourceType: 'document', targetLabel: 'Voice Input Test Report', targetType: 'document', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Markdown Rendering', sourceType: 'document', targetLabel: 'Import Test Report', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Markdown Rendering', sourceType: 'document', targetLabel: 'Data Export Format Design', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Dark Mode Border Fix', sourceType: 'document', targetLabel: 'Tailwind v4 Notes', targetType: 'document', edgeType: 'reference', strength: 0.4 },
  { sourceLabel: 'Dark Mode Border Fix', sourceType: 'document', targetLabel: 'Container Queries Notes', targetType: 'document', edgeType: 'reference', strength: 0.3 },
  { sourceLabel: 'Dark Mode Border Fix', sourceType: 'document', targetLabel: 'Dark Mode Design Guide', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Bidirectional Link Concept', sourceType: 'document', targetLabel: 'Smart Grouping Concept', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Daily Review Concept', sourceType: 'document', targetLabel: 'NL Query Concept', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Knowledge Map Concept', sourceType: 'document', targetLabel: 'Related Recommendations Concept', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Bidirectional Link Concept', sourceType: 'document', targetLabel: 'Knowledge Map Concept', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Client Demo Feedback', sourceType: 'document', targetLabel: 'Product Review Meeting', targetType: 'document', edgeType: 'temporal', strength: 0.5 },
  { sourceLabel: 'AI Meetup Notes', sourceType: 'document', targetLabel: 'LLM Agent Architecture', targetType: 'document', edgeType: 'reference', strength: 0.4 },
  { sourceLabel: 'AI Meetup Notes', sourceType: 'document', targetLabel: 'RAG Architecture', targetType: 'document', edgeType: 'reference', strength: 0.5 },
  { sourceLabel: 'Code Review Summary', sourceType: 'document', targetLabel: 'Unit Test Coverage', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Code Review Summary', sourceType: 'document', targetLabel: 'Error Tracking Setup', targetType: 'document', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Graph Engine Physics', sourceType: 'document', targetLabel: 'text', targetType: 'source', edgeType: 'source', strength: 0.9 },
  { sourceLabel: 'Algorithm Design', sourceType: 'document', targetLabel: 'text', targetType: 'source', edgeType: 'source', strength: 0.9 },
  { sourceLabel: 'RAG Architecture', sourceType: 'document', targetLabel: 'text', targetType: 'source', edgeType: 'source', strength: 0.8 },
  { sourceLabel: 'Local-first Architecture', sourceType: 'document', targetLabel: 'import', targetType: 'source', edgeType: 'source', strength: 0.7 },
  { sourceLabel: 'Prompt Engineering', sourceType: 'document', targetLabel: 'import', targetType: 'source', edgeType: 'source', strength: 0.7 },
  { sourceLabel: 'Voice Input Test Report', sourceType: 'document', targetLabel: 'voice', targetType: 'source', edgeType: 'source', strength: 0.8 },
  { sourceLabel: 'Smart Grouping Concept', sourceType: 'document', targetLabel: 'chat', targetType: 'source', edgeType: 'source', strength: 0.7 },
  { sourceLabel: 'Bidirectional Link Concept', sourceType: 'document', targetLabel: 'chat', targetType: 'source', edgeType: 'source', strength: 0.7 },
  { sourceLabel: 'Daily Review Concept', sourceType: 'document', targetLabel: 'chat', targetType: 'source', edgeType: 'source', strength: 0.6 },
  { sourceLabel: 'NL Query Concept', sourceType: 'document', targetLabel: 'chat', targetType: 'source', edgeType: 'source', strength: 0.6 },
  { sourceLabel: 'Vector Database Comparison', sourceType: 'document', targetLabel: 'import', targetType: 'source', edgeType: 'source', strength: 0.8 },
  { sourceLabel: 'Embedding Model Evaluation', sourceType: 'document', targetLabel: 'import', targetType: 'source', edgeType: 'source', strength: 0.7 },
  { sourceLabel: 'User Interview Script', sourceType: 'document', targetLabel: 'voice', targetType: 'source', edgeType: 'source', strength: 0.6 },
  { sourceLabel: 'Design Token System', sourceType: 'document', targetLabel: 'text', targetType: 'source', edgeType: 'source', strength: 0.7 },
  { sourceLabel: 'GitHub Actions Workflow', sourceType: 'document', targetLabel: 'text', targetType: 'source', edgeType: 'source', strength: 0.8 },
  { sourceLabel: 'Competitive Landscape', sourceType: 'document', targetLabel: 'import', targetType: 'source', edgeType: 'source', strength: 0.6 },
  { sourceLabel: '技术', sourceType: 'tag', targetLabel: 'Graph Engine Physics', targetType: 'document', edgeType: 'confirmed', strength: 0.9 },
  { sourceLabel: '技术', sourceType: 'tag', targetLabel: 'Algorithm Design', targetType: 'document', edgeType: 'confirmed', strength: 0.9 },
  { sourceLabel: '技术', sourceType: 'tag', targetLabel: 'RAG Architecture', targetType: 'document', edgeType: 'confirmed', strength: 0.8 },
  { sourceLabel: '技术', sourceType: 'tag', targetLabel: 'Search Performance Optimization', targetType: 'document', edgeType: 'confirmed', strength: 0.8 },
  { sourceLabel: '技术', sourceType: 'tag', targetLabel: 'Entry List Performance', targetType: 'document', edgeType: 'confirmed', strength: 0.8 },
  { sourceLabel: '技术', sourceType: 'tag', targetLabel: 'Dexie Query Notes', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '技术', sourceType: 'tag', targetLabel: 'Next.js Cache Notes', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '技术', sourceType: 'tag', targetLabel: 'LLM Agent Architecture', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '技术', sourceType: 'tag', targetLabel: 'Vector Database Comparison', targetType: 'document', edgeType: 'confirmed', strength: 0.8 },
  { sourceLabel: '技术', sourceType: 'tag', targetLabel: 'Embedding Model Evaluation', targetType: 'document', edgeType: 'confirmed', strength: 0.8 },
  { sourceLabel: '技术', sourceType: 'tag', targetLabel: 'CRDT Conflict Resolution', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '技术', sourceType: 'tag', targetLabel: 'GitHub Actions Workflow', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '产品', sourceType: 'tag', targetLabel: 'MVP Scope Discussion', targetType: 'document', edgeType: 'confirmed', strength: 0.9 },
  { sourceLabel: '产品', sourceType: 'tag', targetLabel: 'v2 Priority Discussion', targetType: 'document', edgeType: 'confirmed', strength: 0.8 },
  { sourceLabel: '产品', sourceType: 'tag', targetLabel: 'Dock Card Interaction', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '产品', sourceType: 'tag', targetLabel: 'Pricing Strategy', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: '产品', sourceType: 'tag', targetLabel: 'Bidirectional Link Concept', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '产品', sourceType: 'tag', targetLabel: 'Smart Grouping Concept', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: '产品', sourceType: 'tag', targetLabel: 'Competitive Landscape', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '产品', sourceType: 'tag', targetLabel: 'Go-to-Market Plan', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: '学习', sourceType: 'tag', targetLabel: 'Thinking Fast and Slow', targetType: 'document', edgeType: 'confirmed', strength: 0.8 },
  { sourceLabel: '学习', sourceType: 'tag', targetLabel: 'Hackers and Painters', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '学习', sourceType: 'tag', targetLabel: 'Design Psychology Notes', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '学习', sourceType: 'tag', targetLabel: 'RAG Architecture', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: '学习', sourceType: 'tag', targetLabel: 'Semantic Chunking Strategy', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: '前端', sourceType: 'tag', targetLabel: 'Tailwind v4 Notes', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '前端', sourceType: 'tag', targetLabel: 'Container Queries Notes', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: '前端', sourceType: 'tag', targetLabel: 'Web Audio API Research', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: '前端', sourceType: 'tag', targetLabel: 'Dark Mode Border Fix', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '前端', sourceType: 'tag', targetLabel: 'Design Token System', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: '前端', sourceType: 'tag', targetLabel: 'Component Library Spec', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: '前端', sourceType: 'tag', targetLabel: 'Virtual List Implementation', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '前端', sourceType: 'tag', targetLabel: 'React Server Components Notes', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: '性能', sourceType: 'tag', targetLabel: 'Search Performance Optimization', targetType: 'document', edgeType: 'confirmed', strength: 0.9 },
  { sourceLabel: '性能', sourceType: 'tag', targetLabel: 'Entry List Performance', targetType: 'document', edgeType: 'confirmed', strength: 0.9 },
  { sourceLabel: '性能', sourceType: 'tag', targetLabel: 'IndexedDB Performance Tuning', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '性能', sourceType: 'tag', targetLabel: 'Performance Budget', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '设计', sourceType: 'tag', targetLabel: 'Design Psychology Notes', targetType: 'document', edgeType: 'confirmed', strength: 0.8 },
  { sourceLabel: '设计', sourceType: 'tag', targetLabel: 'Onboarding Design', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '设计', sourceType: 'tag', targetLabel: 'Design Token System', targetType: 'document', edgeType: 'confirmed', strength: 0.8 },
  { sourceLabel: '设计', sourceType: 'tag', targetLabel: 'Color System Guide', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '设计', sourceType: 'tag', targetLabel: 'Motion Design Principles', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '设计', sourceType: 'tag', targetLabel: 'Dark Mode Design Guide', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: 'AI', sourceType: 'tag', targetLabel: 'RAG Architecture', targetType: 'document', edgeType: 'confirmed', strength: 0.9 },
  { sourceLabel: 'AI', sourceType: 'tag', targetLabel: 'LLM Agent Architecture', targetType: 'document', edgeType: 'confirmed', strength: 0.8 },
  { sourceLabel: 'AI', sourceType: 'tag', targetLabel: 'Prompt Engineering', targetType: 'document', edgeType: 'confirmed', strength: 0.8 },
  { sourceLabel: 'AI', sourceType: 'tag', targetLabel: 'Vector Database Comparison', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: 'AI', sourceType: 'tag', targetLabel: 'Embedding Model Evaluation', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: 'AI', sourceType: 'tag', targetLabel: 'Semantic Chunking Strategy', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: 'AI', sourceType: 'tag', targetLabel: 'Hybrid Search Design', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: 'AI', sourceType: 'tag', targetLabel: 'Fine-tuning vs RAG', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: '架构', sourceType: 'tag', targetLabel: 'Local-first Architecture', targetType: 'document', edgeType: 'confirmed', strength: 0.9 },
  { sourceLabel: '架构', sourceType: 'tag', targetLabel: 'CRDT Conflict Resolution', targetType: 'document', edgeType: 'confirmed', strength: 0.8 },
  { sourceLabel: '架构', sourceType: 'tag', targetLabel: 'WebWorker Architecture', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '架构', sourceType: 'tag', targetLabel: 'Service Worker Caching', targetType: 'document', edgeType: 'confirmed', strength: 0.7 },
  { sourceLabel: '架构', sourceType: 'tag', targetLabel: 'Zustand vs Jotai Comparison', targetType: 'document', edgeType: 'confirmed', strength: 0.6 },
  { sourceLabel: 'Local-first + AI is the best combo', sourceType: 'insight', targetLabel: 'Local-first Architecture', targetType: 'document', edgeType: 'semantic', strength: 0.8 },
  { sourceLabel: 'Local-first + AI is the best combo', sourceType: 'insight', targetLabel: 'PWA Offline Research', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Local-first + AI is the best combo', sourceType: 'insight', targetLabel: 'LLM Agent Architecture', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Local-first + AI is the best combo', sourceType: 'insight', targetLabel: 'RAG Architecture', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Chunk strategy matters more than embedding model', sourceType: 'insight', targetLabel: 'RAG Architecture', targetType: 'document', edgeType: 'semantic', strength: 0.9 },
  { sourceLabel: 'Chunk strategy matters more than embedding model', sourceType: 'insight', targetLabel: 'Semantic Chunking Strategy', targetType: 'document', edgeType: 'semantic', strength: 0.8 },
  { sourceLabel: 'Chunk strategy matters more than embedding model', sourceType: 'insight', targetLabel: 'Embedding Model Evaluation', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Knowledge management is about connections not storage', sourceType: 'insight', targetLabel: 'Knowledge Map Concept', targetType: 'document', edgeType: 'semantic', strength: 0.8 },
  { sourceLabel: 'Knowledge management is about connections not storage', sourceType: 'insight', targetLabel: 'Bidirectional Link Concept', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Knowledge management is about connections not storage', sourceType: 'insight', targetLabel: 'Related Recommendations Concept', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'UI should reduce cognitive load for fast thinking', sourceType: 'insight', targetLabel: 'Design Psychology Notes', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'UI should reduce cognitive load for fast thinking', sourceType: 'insight', targetLabel: 'Onboarding Design', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'UI should reduce cognitive load for fast thinking', sourceType: 'insight', targetLabel: 'Motion Design Principles', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Design tokens enable consistent theming across platforms', sourceType: 'insight', targetLabel: 'Design Token System', targetType: 'document', edgeType: 'semantic', strength: 0.9 },
  { sourceLabel: 'Design tokens enable consistent theming across platforms', sourceType: 'insight', targetLabel: 'Component Library Spec', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Design tokens enable consistent theming across platforms', sourceType: 'insight', targetLabel: 'Color System Guide', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Hybrid search outperforms pure vector search', sourceType: 'insight', targetLabel: 'Hybrid Search Design', targetType: 'document', edgeType: 'semantic', strength: 0.9 },
  { sourceLabel: 'Hybrid search outperforms pure vector search', sourceType: 'insight', targetLabel: 'Vector Database Comparison', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Hybrid search outperforms pure vector search', sourceType: 'insight', targetLabel: 'Re-ranking Algorithm', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Observability is a feature not an afterthought', sourceType: 'insight', targetLabel: 'Error Tracking Setup', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Observability is a feature not an afterthought', sourceType: 'insight', targetLabel: 'Log Aggregation Design', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Observability is a feature not an afterthought', sourceType: 'insight', targetLabel: 'Performance Budget', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'User research should drive product decisions not assumptions', sourceType: 'insight', targetLabel: 'User Interview Script', targetType: 'document', edgeType: 'semantic', strength: 0.8 },
  { sourceLabel: 'User research should drive product decisions not assumptions', sourceType: 'insight', targetLabel: 'Persona Definition', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'User research should drive product decisions not assumptions', sourceType: 'insight', targetLabel: 'Survey Results Analysis', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'How to handle cross-device sync?', sourceType: 'question', targetLabel: 'Local-first Architecture', targetType: 'document', edgeType: 'reference', strength: 0.6 },
  { sourceLabel: 'How to handle cross-device sync?', sourceType: 'question', targetLabel: 'Edge Computing Research', targetType: 'document', edgeType: 'reference', strength: 0.5 },
  { sourceLabel: 'How to handle cross-device sync?', sourceType: 'question', targetLabel: 'Sync Service', targetType: 'project', edgeType: 'reference', strength: 0.7 },
  { sourceLabel: 'Should we use CRDT or event sourcing?', sourceType: 'question', targetLabel: 'Local-first Architecture', targetType: 'document', edgeType: 'reference', strength: 0.7 },
  { sourceLabel: 'Should we use CRDT or event sourcing?', sourceType: 'question', targetLabel: 'CRDT Conflict Resolution', targetType: 'document', edgeType: 'reference', strength: 0.8 },
  { sourceLabel: 'What is the optimal pricing model?', sourceType: 'question', targetLabel: 'Pricing Strategy', targetType: 'document', edgeType: 'reference', strength: 0.7 },
  { sourceLabel: 'What is the optimal pricing model?', sourceType: 'question', targetLabel: 'Revenue Model Design', targetType: 'document', edgeType: 'reference', strength: 0.6 },
  { sourceLabel: 'How to balance AI automation with user control?', sourceType: 'question', targetLabel: 'LLM Agent Architecture', targetType: 'document', edgeType: 'reference', strength: 0.6 },
  { sourceLabel: 'How to balance AI automation with user control?', sourceType: 'question', targetLabel: 'Prompt Engineering', targetType: 'document', edgeType: 'reference', strength: 0.5 },
  { sourceLabel: 'When to introduce collaboration features?', sourceType: 'question', targetLabel: 'v2 Priority Discussion', targetType: 'document', edgeType: 'reference', strength: 0.6 },
  { sourceLabel: 'When to introduce collaboration features?', sourceType: 'question', targetLabel: 'MVP Scope Discussion', targetType: 'document', edgeType: 'reference', strength: 0.5 },
  { sourceLabel: 'Should we build a plugin system?', sourceType: 'question', targetLabel: 'Open Source Strategy', targetType: 'document', edgeType: 'reference', strength: 0.5 },
  { sourceLabel: 'Should we build a plugin system?', sourceType: 'question', targetLabel: 'Custom Rules Concept', targetType: 'document', edgeType: 'reference', strength: 0.6 },
  { sourceLabel: '2026-Q2', sourceType: 'time', targetLabel: '2026-April', targetType: 'time', edgeType: 'parent_child', strength: 0.9 },
  { sourceLabel: '2026-Q2', sourceType: 'time', targetLabel: '2026-May', targetType: 'time', edgeType: 'parent_child', strength: 0.9 },
  { sourceLabel: '2026-Q3', sourceType: 'time', targetLabel: '2026-Q2', targetType: 'time', edgeType: 'parent_child', strength: 0.8 },
  { sourceLabel: '2026-April', sourceType: 'time', targetLabel: 'Product Review Meeting', targetType: 'document', edgeType: 'temporal', strength: 0.5 },
  { sourceLabel: '2026-April', sourceType: 'time', targetLabel: 'MVP Scope Discussion', targetType: 'document', edgeType: 'temporal', strength: 0.4 },
  { sourceLabel: '2026-May', sourceType: 'time', targetLabel: 'v2 Priority Discussion', targetType: 'document', edgeType: 'temporal', strength: 0.4 },
  { sourceLabel: '2026-May', sourceType: 'time', targetLabel: 'Go-to-Market Plan', targetType: 'document', edgeType: 'temporal', strength: 0.3 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'Personal Growth', targetType: 'domain', edgeType: 'semantic', strength: 0.3 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'Product Strategy', targetType: 'domain', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'Data Intelligence', targetType: 'domain', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Core Architecture', sourceType: 'domain', targetLabel: 'DevOps & Infrastructure', targetType: 'domain', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Personal Growth', sourceType: 'domain', targetLabel: 'Product Strategy', targetType: 'domain', edgeType: 'semantic', strength: 0.3 },
  { sourceLabel: 'Personal Growth', sourceType: 'domain', targetLabel: 'User Research', targetType: 'domain', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Product Strategy', sourceType: 'domain', targetLabel: 'Business & Growth', targetType: 'domain', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Product Strategy', sourceType: 'domain', targetLabel: 'User Research', targetType: 'domain', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Data Intelligence', sourceType: 'domain', targetLabel: 'Product Strategy', targetType: 'domain', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Data Intelligence', sourceType: 'domain', targetLabel: 'Design System', targetType: 'domain', edgeType: 'semantic', strength: 0.3 },
  { sourceLabel: 'Design System', sourceType: 'domain', targetLabel: 'User Research', targetType: 'domain', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'DevOps & Infrastructure', sourceType: 'domain', targetLabel: 'Core Architecture', targetType: 'domain', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Algorithm Design', sourceType: 'document', targetLabel: 'Graph Engine Physics', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Algorithm Design', sourceType: 'document', targetLabel: 'Vector Database Comparison', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'LLM Agent Architecture', sourceType: 'document', targetLabel: 'Prompt Engineering', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'LLM Agent Architecture', sourceType: 'document', targetLabel: 'Fine-tuning vs RAG', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'LLM Agent Architecture', sourceType: 'document', targetLabel: 'Multi-modal Retrieval', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Embedding Model Evaluation', sourceType: 'document', targetLabel: 'Semantic Chunking Strategy', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Hybrid Search Design', sourceType: 'document', targetLabel: 'Re-ranking Algorithm', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Hybrid Search Design', sourceType: 'document', targetLabel: 'Vector Database Comparison', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Design Token System', sourceType: 'document', targetLabel: 'Component Library Spec', targetType: 'document', edgeType: 'semantic', strength: 0.8 },
  { sourceLabel: 'Design Token System', sourceType: 'document', targetLabel: 'Color System Guide', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Design Token System', sourceType: 'document', targetLabel: 'Dark Mode Design Guide', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Motion Design Principles', sourceType: 'document', targetLabel: 'Dark Mode Design Guide', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Motion Design Principles', sourceType: 'document', targetLabel: 'Chat Typewriter Effect', targetType: 'document', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'GitHub Actions Workflow', sourceType: 'document', targetLabel: 'Docker Compose Setup', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'GitHub Actions Workflow', sourceType: 'document', targetLabel: 'Vercel Deploy Config', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Error Tracking Setup', sourceType: 'document', targetLabel: 'Performance Budget', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Error Tracking Setup', sourceType: 'document', targetLabel: 'Log Aggregation Design', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'User Interview Script', sourceType: 'document', targetLabel: 'Persona Definition', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'User Interview Script', sourceType: 'document', targetLabel: 'Survey Results Analysis', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Persona Definition', sourceType: 'document', targetLabel: 'Journey Map v1', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Usability Test Report', sourceType: 'document', targetLabel: 'Feature Request Tracker', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Usability Test Report', sourceType: 'document', targetLabel: 'Dock Card Interaction', targetType: 'document', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Competitive Landscape', sourceType: 'document', targetLabel: 'Pricing Strategy', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Competitive Landscape', sourceType: 'document', targetLabel: 'Open Source Strategy', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Go-to-Market Plan', sourceType: 'document', targetLabel: 'Content Marketing Plan', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Go-to-Market Plan', sourceType: 'document', targetLabel: 'Community Building Guide', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Revenue Model Design', sourceType: 'document', targetLabel: 'Pricing Strategy', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'CRDT Conflict Resolution', sourceType: 'document', targetLabel: 'Sync Service', targetType: 'project', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'CRDT Conflict Resolution', sourceType: 'document', targetLabel: 'Edge Computing Research', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'WebWorker Architecture', sourceType: 'document', targetLabel: 'Virtual List Implementation', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'WebWorker Architecture', sourceType: 'document', targetLabel: 'Search Performance Optimization', targetType: 'document', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Service Worker Caching', sourceType: 'document', targetLabel: 'PWA Offline Research', targetType: 'document', edgeType: 'semantic', strength: 0.7 },
  { sourceLabel: 'Zustand vs Jotai Comparison', sourceType: 'document', targetLabel: 'React Server Components Notes', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Client Demo Feedback', sourceType: 'document', targetLabel: 'Feature Request Tracker', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Client Demo Feedback', sourceType: 'document', targetLabel: 'Competitive Landscape', targetType: 'document', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Product Review Meeting', sourceType: 'document', targetLabel: 'v2 Priority Discussion', targetType: 'document', edgeType: 'temporal', strength: 0.6 },
  { sourceLabel: 'MVP Scope Discussion', sourceType: 'document', targetLabel: 'v2 Priority Discussion', targetType: 'document', edgeType: 'temporal', strength: 0.7 },
  { sourceLabel: 'MVP Scope Discussion', sourceType: 'document', targetLabel: 'Open Source Strategy', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'API Alignment Meeting', sourceType: 'document', targetLabel: 'API Reference', targetType: 'topic', edgeType: 'reference', strength: 0.5 },
  { sourceLabel: 'Dock Card Interaction', sourceType: 'document', targetLabel: 'Onboarding Design', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Tag Editor Drag Sort', sourceType: 'document', targetLabel: 'Dock Batch Operations', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Tag Editor Drag Sort', sourceType: 'document', targetLabel: 'Keyboard Navigation Spec', targetType: 'document', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Data Export Format Design', sourceType: 'document', targetLabel: 'Import Test Report', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Data Export Format Design', sourceType: 'document', targetLabel: 'WeChat Import Concept', targetType: 'document', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Data Export Format Design', sourceType: 'document', targetLabel: 'Browser Import Concept', targetType: 'document', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Accessibility Checklist', sourceType: 'document', targetLabel: 'Dark Mode Design Guide', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Accessibility Checklist', sourceType: 'document', targetLabel: 'Keyboard Navigation Spec', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'NPS Score Analysis', sourceType: 'document', targetLabel: 'Survey Results Analysis', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'NPS Score Analysis', sourceType: 'document', targetLabel: 'Client Demo Feedback', targetType: 'document', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Partnership Strategy', sourceType: 'document', targetLabel: 'Open Source Strategy', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Partnership Strategy', sourceType: 'document', targetLabel: 'Community Building Guide', targetType: 'document', edgeType: 'semantic', strength: 0.4 },
  { sourceLabel: 'Content Marketing Plan', sourceType: 'document', targetLabel: 'Open Source Strategy', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Journey Map v1', sourceType: 'document', targetLabel: 'Onboarding Design', targetType: 'document', edgeType: 'semantic', strength: 0.5 },
  { sourceLabel: 'Graph Engine Physics', sourceType: 'document', targetLabel: 'Algorithm Design', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Thinking Fast and Slow', sourceType: 'document', targetLabel: 'Design Psychology Notes', targetType: 'document', edgeType: 'semantic', strength: 0.6 },
  { sourceLabel: 'Hackers and Painters', sourceType: 'document', targetLabel: 'Open Source Strategy', targetType: 'document', edgeType: 'reference', strength: 0.4 },
  { sourceLabel: 'Hackers and Painters', sourceType: 'document', targetLabel: 'Pricing Strategy', targetType: 'document', edgeType: 'reference', strength: 0.3 },
]

const SEED_DOCUMENT_TO_ENTRY: Record<string, string> = {
  'Product Review Meeting': '产品评审会议准备',
  'RAG Architecture': 'RAG 架构优化阅读笔记',
  'Dock Card Interaction': 'Dock 卡片交互对齐',
  'Markdown Rendering': 'Entry 详情页 Markdown 渲染',
  'Local-first Architecture': '本地优先架构调研笔记',
  'Smart Grouping Concept': 'Dock 智能分组功能构想',
  'API Alignment Meeting': 'API 接口对齐会议',
  'Search Performance Optimization': '搜索性能优化',
  'Dexie Query Notes': 'Dexie 查询注意事项',
  'Design Psychology Notes': '《设计心理学》第 2 章笔记',
  'Entry List Performance': 'Entry 列表虚拟滚动优化',
  'v2 Priority Discussion': 'v2 功能优先级讨论',
  'Bidirectional Link Concept': '双向链接功能构想',
  'Next.js Cache Notes': 'Next.js 缓存机制笔记',
  'Voice Input Test Report': '语音输入功能测试报告',
  'Tag Editor Drag Sort': 'Tag 编辑器拖拽排序',
  'LLM Agent Architecture': 'LLM Agent 架构阅读笔记',
  'Daily Review Concept': '每日回顾功能构想',
  'Client Demo Feedback': '客户产品演示反馈',
  'Dark Mode Border Fix': '暗色模式边框颜色修复',
  'Tailwind v4 Notes': 'Tailwind CSS v4 新特性笔记',
  'Code Review Summary': 'Code Review 问题汇总',
  'PWA Offline Research': 'PWA 离线场景调研',
  'Dock Batch Operations': 'Dock 批量操作功能',
  'Chat Typewriter Effect': 'Chat 消息打字机效果',
  'Pricing Strategy': '产品定价策略思考',
  'AI Meetup Notes': 'AI 时代知识管理 Meetup 笔记',
  'Thinking Fast and Slow': '《思考快与慢》第 5 章笔记',
  'Hackers and Painters': '《黑客与画家》第 8 章笔记',
  'Edge Computing Research': 'Edge Computing + 本地优先调研',
  'Open Source Strategy': '开源策略思考',
  'MVP Scope Discussion': 'MVP 功能边界讨论',
  'Investor Meeting Prep': '投资人沟通会议准备',
  'User Growth Strategy': '用户增长策略讨论',
  'Prompt Engineering': 'Prompt Engineering 最佳实践',
  'NL Query Concept': '自然语言查询功能构想',
  'Web Audio API Research': 'Web Audio API 调研笔记',
  'Container Queries Notes': 'CSS Container Queries 笔记',
  'Zustand vs Jotai Comparison': 'Zustand vs Jotai 状态管理对比',
  'Import Test Report': 'Import 功能测试报告',
  'Onboarding Design': '用户 Onboarding 流程设计',
  'Unit Test Coverage': '提升单元测试覆盖率',
  'Graph Engine Physics': '',
  'Algorithm Design': '',
  'Design Token System': '',
  'Component Library Spec': '',
  'Color System Guide': '',
  'Typography Scale': '',
  'Motion Design Principles': '',
  'Accessibility Checklist': '',
  'Dark Mode Design Guide': '',
  'Responsive Breakpoints': '',
  'GitHub Actions Workflow': '',
  'Docker Compose Setup': '',
  'Vercel Deploy Config': '',
  'Error Tracking Setup': '',
  'Performance Budget': '',
  'Log Aggregation Design': '',
  'User Interview Script': '',
  'Survey Results Analysis': '',
  'Persona Definition': '',
  'Journey Map v1': '',
  'Usability Test Report': '',
  'Feature Request Tracker': '',
  'NPS Score Analysis': '',
  'Competitive Landscape': '',
  'Go-to-Market Plan': '',
  'Revenue Model Design': '',
  'Partnership Strategy': '',
  'Content Marketing Plan': '',
  'Community Building Guide': '',
  'CRDT Conflict Resolution': '',
  'IndexedDB Performance Tuning': '',
  'WebWorker Architecture': '',
  'Service Worker Caching': '',
  'React Server Components Notes': '',
  'Virtual List Implementation': '',
  'Keyboard Navigation Spec': '',
  'Data Export Format Design': '',
  'Knowledge Map Concept': '',
  'Related Recommendations Concept': '',
  'Browser Import Concept': '',
  'Custom Rules Concept': '',
  'Emoji Tag Concept': '',
  'WeChat Import Concept': '',
  'Vector Database Comparison': '',
  'Embedding Model Evaluation': '',
  'Semantic Chunking Strategy': '',
  'Hybrid Search Design': '',
  'Re-ranking Algorithm': '',
  'Fine-tuning vs RAG': '',
  'Multi-modal Retrieval': '',
}

export default function SeedPage() {
  const [result, setResult] = useState<SeedResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  const handleSeed = async () => {
    const user = getCurrentUser()
    if (!user) {
      setError('请先登录（在 /workspace 页面注册或登录）')
      return
    }

    setSeeding(true)
    setError(null)

    try {
      const userId = user.id
      const now = new Date()
      const total = SEED_ITEMS.length

      let dockItemsCreated = 0
      const dockItemIds: number[] = []

      for (let i = 0; i < total; i++) {
        const item = SEED_ITEMS[i]
        const createdAt = new Date(now.getTime() - item.dayOffset * 86400000 - (24 - item.hourOffset) * 3600000)
        const id = await db.table('dockItems').add({
          userId,
          rawText: item.rawText,
          topic: item.topic,
          sourceType: item.sourceType,
          status: item.dockStatus,
          suggestions: item.dockStatus === 'suggested'
            ? [{ id: `seed_${i}:category:reading`, type: 'category' as const, label: 'reading', confidence: 0.8, reason: '包含阅读/摘录关键词' },
               { id: `seed_${i}:tag:learn`, type: 'tag' as const, label: '学习', confidence: 0.7, reason: '包含学习相关关键词' }]
            : item.dockStatus === 'archived' && item.entry
            ? [{ id: `seed_${i}:category:${item.entry.type}`, type: 'category' as const, label: item.entry.type, confidence: 0.85, reason: '包含相关关键词' }]
            : [],
          userTags: [],
          selectedActions: item.dockStatus === 'archived' && item.entry ? item.entry.actions : [],
          selectedProject: item.dockStatus === 'archived' && item.entry ? item.entry.project : null,
          sourceId: null,
          parentId: null,
          processedAt: item.dockStatus !== 'pending' ? new Date(createdAt.getTime() + 60000) : null,
          createdAt,
        }) as number
        dockItemIds.push(id)
        dockItemsCreated++
      }

      let entriesCreated = 0
      for (let i = 0; i < total; i++) {
        const item = SEED_ITEMS[i]
        if (!item.entry) continue

        const createdAt = new Date(now.getTime() - item.dayOffset * 86400000 - (24 - item.hourOffset) * 3600000)
        await db.table('entries').add({
          userId,
          sourceDockItemId: dockItemIds[i],
          title: item.entry.title,
          content: item.entry.content,
          type: item.entry.type,
          tags: item.entry.tags,
          project: item.entry.project,
          actions: item.entry.actions,
          createdAt,
          archivedAt: new Date(createdAt.getTime() + 3600000),
        })
        entriesCreated++
      }

      let tagsCreated = 0
      for (const tagName of SEED_TAGS) {
        const existing = await db.table('tags').where('userId').equals(userId)
          .and((t: Record<string, unknown>) => String(t.name) === tagName).first()
        if (!existing) {
          await db.table('tags').add({
            id: `${userId}_${tagName.toLowerCase()}`,
            userId,
            name: tagName,
            createdAt: now,
          })
          tagsCreated++
        }
      }

      let chatSessionsCreated = 0
      for (const chatSession of SEED_CHAT_SESSIONS) {
        const item = SEED_ITEMS[chatSession.seedItemIndex]
        const sessionCreatedAt = new Date(now.getTime() - item.dayOffset * 86400000 - (24 - item.hourOffset) * 3600000)
        const baseTs = sessionCreatedAt.getTime()
        const messages = chatSession.messages.map((m, idx) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(baseTs + idx * 3000),
        }))

        await db.table('chatSessions').add({
          userId,
          title: chatSession.topic ? `${chatSession.topic} - ${chatSession.selectedType}` : null,
          topic: chatSession.topic,
          selectedType: chatSession.selectedType,
          content: chatSession.content,
          status: 'confirmed' as const,
          pinned: chatSession.pinned,
          messages,
          dockItemId: dockItemIds[chatSession.seedItemIndex],
          createdAt: sessionCreatedAt,
          updatedAt: new Date(baseTs + chatSession.messages.length * 3000),
        })
        chatSessionsCreated++
      }

      const backfillResult = await backfillStructureData(userId)

      let entryRelationsCreated = 0
      const allEntries = await db.table('entries').where('userId').equals(userId).toArray()
      const projectEntries: Record<string, number[]> = {}
      for (const e of allEntries) {
        if (e.project) {
          if (!projectEntries[e.project]) projectEntries[e.project] = []
          projectEntries[e.project].push(e.id as number)
        }
      }
      for (const [, ids] of Object.entries(projectEntries)) {
        for (let i = 0; i < ids.length - 1; i++) {
          const rel = await createEntryRelation({
            userId,
            sourceEntryId: ids[i],
            targetEntryId: ids[i + 1],
            relationType: 'same_project',
            source: 'system',
          })
          if (rel) entryRelationsCreated++
        }
      }

      const tagGroupEntries: Record<string, number[]> = {}
      for (const e of allEntries) {
        for (const tag of (e.tags as string[])) {
          if (!tagGroupEntries[tag]) tagGroupEntries[tag] = []
          tagGroupEntries[tag].push(e.id as number)
        }
      }
      for (const [, ids] of Object.entries(tagGroupEntries)) {
        if (ids.length >= 2) {
          const rel = await createEntryRelation({
            userId,
            sourceEntryId: ids[0],
            targetEntryId: ids[1],
            relationType: 'same_topic',
            source: 'system',
          })
          if (rel) entryRelationsCreated++
        }
      }

      let mindNodesCreated = 0
      const allDockItems = await db.table('dockItems').where('userId').equals(userId).toArray()
      const dockLabelToId = new Map<string, number>()
      for (const di of allDockItems) {
        const label = ((di.topic || (di.rawText as string || '').slice(0, 50)) as string).trim().toLowerCase()
        dockLabelToId.set(label, di.id as number)
      }
      const mindEntries = await db.table('entries').where('userId').equals(userId).toArray()
      const entryTitleToDockId = new Map<string, number>()
      for (const entry of mindEntries) {
        const title = (entry.title as string || '').trim().toLowerCase()
        if (title && entry.sourceDockItemId != null) {
          entryTitleToDockId.set(title, entry.sourceDockItemId as number)
        }
      }

      for (const mn of SEED_MIND_NODES) {
        let docId: number | null = mn.documentId
        if (docId === null && mn.nodeType === 'document') {
          const entryTitle = SEED_DOCUMENT_TO_ENTRY[mn.label]
          if (entryTitle) {
            const match = entryTitleToDockId.get(entryTitle.trim().toLowerCase())
            if (match !== undefined) {
              docId = match
            }
          }
          if (docId === null) {
            const directMatch = dockLabelToId.get(mn.label.trim().toLowerCase())
            if (directMatch !== undefined) {
              docId = directMatch
            }
          }
        }
        await upsertMindNode({
          userId,
          nodeType: mn.nodeType,
          label: mn.label,
          state: mn.state,
          documentId: docId,
          degreeScore: mn.degreeScore,
        })
        mindNodesCreated++
      }

      let mindEdgesCreated = 0
      for (const me of SEED_MIND_EDGES) {
        const sourceNodeId = `${userId}_mn_${me.sourceType}_${me.sourceLabel.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 40)}`
        const targetNodeId = `${userId}_mn_${me.targetType}_${me.targetLabel.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 40)}`
        await upsertMindEdge({
          userId,
          sourceNodeId,
          targetNodeId,
          edgeType: me.edgeType,
          strength: me.strength,
          source: 'system',
        })
        mindEdgesCreated++
      }

      setResult({
        dockItemsCreated,
        entriesCreated,
        tagsCreated,
        chatSessionsCreated,
        collectionsCreated: backfillResult.collectionsCreated,
        tagRelationsCreated: backfillResult.tagRelationsCreated,
        entryRelationsCreated,
        mindNodesCreated,
        mindEdgesCreated,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误')
    } finally {
      setSeeding(false)
    }
  }

  const handleClear = async () => {
    const user = getCurrentUser()
    if (!user) {
      setError('请先登录')
      return
    }

    if (!confirm('确定要清除当前用户的所有数据吗？此操作不可恢复。')) return
    setSeeding(true)
    setError(null)
    try {
      const userId = user.id

      const dockItemIds = await db.table('dockItems').where('userId').equals(userId).primaryKeys()
      if (dockItemIds.length > 0) {
        await db.table('dockItems').bulkDelete(dockItemIds)
      }

      const entryIds = await db.table('entries').where('userId').equals(userId).primaryKeys()
      if (entryIds.length > 0) {
        await db.table('entries').bulkDelete(entryIds)
      }

      const tagIds = await db.table('tags').where('userId').equals(userId).primaryKeys()
      if (tagIds.length > 0) {
        await db.table('tags').bulkDelete(tagIds)
      }

      const chatSessionIds = await db.table('chatSessions').where('userId').equals(userId).primaryKeys()
      if (chatSessionIds.length > 0) {
        await db.table('chatSessions').bulkDelete(chatSessionIds)
      }

      const collectionIds = await db.table('collections').where('userId').equals(userId).primaryKeys()
      if (collectionIds.length > 0) {
        await db.table('collections').bulkDelete(collectionIds)
      }

      const etrIds = await db.table('entryTagRelations').where('userId').equals(userId).primaryKeys()
      if (etrIds.length > 0) {
        await db.table('entryTagRelations').bulkDelete(etrIds)
      }

      const erIds = await db.table('entryRelations').where('userId').equals(userId).primaryKeys()
      if (erIds.length > 0) {
        await db.table('entryRelations').bulkDelete(erIds)
      }

      const keIds = await db.table('knowledgeEvents').where('userId').equals(userId).primaryKeys()
      if (keIds.length > 0) {
        await db.table('knowledgeEvents').bulkDelete(keIds)
      }

      const taIds = await db.table('temporalActivities').where('userId').equals(userId).primaryKeys()
      if (taIds.length > 0) {
        await db.table('temporalActivities').bulkDelete(taIds)
      }

      const widgetIds = await db.table('widgets').where('userId').equals(userId).primaryKeys()
      if (widgetIds.length > 0) {
        await db.table('widgets').bulkDelete(widgetIds)
      }

      const mindNodeIds = await db.table('mindNodes').where('userId').equals(userId).primaryKeys()
      if (mindNodeIds.length > 0) {
        await db.table('mindNodes').bulkDelete(mindNodeIds)
      }

      const mindEdgeIds = await db.table('mindEdges').where('userId').equals(userId).primaryKeys()
      if (mindEdgeIds.length > 0) {
        await db.table('mindEdges').bulkDelete(mindEdgeIds)
      }

      setResult(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误')
    } finally {
      setSeeding(false)
    }
  }

  const archivedCount = SEED_ITEMS.filter((s) => s.dockStatus === 'archived').length
  const suggestedCount = SEED_ITEMS.filter((s) => s.dockStatus === 'suggested').length
  const pendingCount = SEED_ITEMS.filter((s) => s.dockStatus === 'pending').length
  const ignoredCount = SEED_ITEMS.filter((s) => s.dockStatus === 'ignored').length
  const reopenedCount = SEED_ITEMS.filter((s) => s.dockStatus === 'reopened').length
  const entryCount = SEED_ITEMS.filter((s) => s.entry).length
  const entryTypes = Array.from(new Set(SEED_ITEMS.filter((s) => s.entry).map((s) => s.entry?.type ?? '')))
  const sourceTypes = Array.from(new Set(SEED_ITEMS.map((s) => s.sourceType)))
  const daySpan = Math.max(...SEED_ITEMS.map((s) => s.dayOffset)) - Math.min(...SEED_ITEMS.map((s) => s.dayOffset))
  const mindNodeTypes = Array.from(new Set(SEED_MIND_NODES.map(n => n.nodeType)))
  const mindEdgeTypes = Array.from(new Set(SEED_MIND_EDGES.map(e => e.edgeType)))

  return (
    <div className="flex min-h-screen atlax-page-bg items-center justify-center p-8 selection:bg-blue-200 dark:selection:bg-blue-900">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-400 flex items-center justify-center shadow-sm">
            <Database size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Demo 数据填充</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">为当前用户生成演示数据，覆盖多种类型、标签、项目和状态，时间跨度 {daySpan + 1} 天</p>

        <div className="atlax-card p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">将创建的数据</h2>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Dock 条目总数</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{SEED_ITEMS.length} 条</span>
            </div>
            <div className="pl-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>archived（已归档）</span>
                <span>{archivedCount} 条</span>
              </div>
              <div className="flex justify-between">
                <span>suggested（已建议）</span>
                <span>{suggestedCount} 条</span>
              </div>
              <div className="flex justify-between">
                <span>pending（待处理）</span>
                <span>{pendingCount} 条</span>
              </div>
              <div className="flex justify-between">
                <span>ignored（已忽略）</span>
                <span>{ignoredCount} 条</span>
              </div>
              <div className="flex justify-between">
                <span>reopened（重新整理）</span>
                <span>{reopenedCount} 条</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>归档条目（类型：{entryTypes.join('/')}）</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{entryCount} 条</span>
            </div>
            <div className="flex justify-between">
              <span>来源类型（{sourceTypes.join('/')}）</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{sourceTypes.length} 种</span>
            </div>
            <div className="flex justify-between">
              <span>标签（{SEED_TAGS.join('/')}）</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{SEED_TAGS.length} 个</span>
            </div>
            <div className="flex justify-between">
              <span>Chat 会话（对应 chat 来源条目）</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{SEED_CHAT_SESSIONS.length} 条</span>
            </div>
            <div className="flex justify-between">
              <span>知识结构（自动 backfill）</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">集合 + 标签关系 + 条目关系</span>
            </div>
            <div className="flex justify-between">
              <span>Mind 节点（{mindNodeTypes.join('/')}）</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{SEED_MIND_NODES.length} 个</span>
            </div>
            <div className="flex justify-between">
              <span>Mind 边（{mindEdgeTypes.join('/')}）</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{SEED_MIND_EDGES.length} 条</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">归档条目与 Dock 一一对应，点击&ldquo;重新整理&rdquo;可回到 Dock</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="atlax-btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {seeding ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
            {seeding ? '填充中…' : '填充 Demo 数据'}
          </button>
          <button
            onClick={handleClear}
            disabled={seeding}
            className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-40 transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            清除数据
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">数据填充成功</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              创建了 {result.dockItemsCreated} 条 Dock 条目、{result.entriesCreated} 条归档条目、{result.tagsCreated} 个标签、{result.chatSessionsCreated} 条 Chat 会话、{result.collectionsCreated} 个集合、{result.tagRelationsCreated} 条标签关系、{result.entryRelationsCreated} 条条目关系、{result.mindNodesCreated} 个 Mind 节点、{result.mindEdgesCreated} 条 Mind 边
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/workspace" className="text-sm text-blue-500 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
            返回工作区 <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
