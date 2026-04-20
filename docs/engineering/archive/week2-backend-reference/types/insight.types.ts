/**
 * Insight 卡片类型定义 - Week 3+ 参考
 * 
 * 来源：apps/server/src/insight/insight.types.ts
 * 归档时间：2026-04-20
 * 
 * 注意：这是参考，Week 1 不需要 Insight 功能。
 */

export type InsightType =
  | 'project_stalled'       // 项目停滞提醒
  | 'topic_cluster'         // 主题汇总建议
  | 'knowledge_activation'; // 知识激活提醒

export interface InsightCard {
  id: string;
  type: InsightType;
  message: string;
  actionLabel?: string;
  actionPayload?: Record<string, string>;
  createdAt: string;
}

/**
 * Insight 规则参考：
 * 
 * project_stalled:
 *   - 触发条件：项目超过 14 天无更新
 *   - 消息示例："支付系统项目 10 天无进展，是否需要回顾卡点？"
 * 
 * topic_cluster:
 *   - 触发条件：某标签最近出现 >= 5 次
 *   - 消息示例："主题「产品」最近出现 6 次，建议汇总成项目页"
 * 
 * knowledge_activation:
 *   - 触发条件：内容超过 30 天未复用
 *   - 消息示例："10 条内容长期未复用，建议安排本周回顾"
 */