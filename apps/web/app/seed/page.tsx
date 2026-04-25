'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Database, Trash2, ArrowRight } from 'lucide-react'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

interface SeedResult {
  dockItemsCreated: number
  entriesCreated: number
  tagsCreated: number
  chatSessionsCreated: number
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

      setResult({ dockItemsCreated, entriesCreated, tagsCreated, chatSessionsCreated })
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
  const entryTypes = Array.from(new Set(SEED_ITEMS.filter((s) => s.entry).map((s) => s.entry!.type)))
  const sourceTypes = Array.from(new Set(SEED_ITEMS.map((s) => s.sourceType)))
  const daySpan = Math.max(...SEED_ITEMS.map((s) => s.dayOffset)) - Math.min(...SEED_ITEMS.map((s) => s.dayOffset))

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
              创建了 {result.dockItemsCreated} 条 Dock 条目、{result.entriesCreated} 条归档条目、{result.tagsCreated} 个标签、{result.chatSessionsCreated} 条 Chat 会话
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
