/**
 * Health 信号类型定义 - Week 3+ 参考
 * 
 * 来源：apps/server/src/health/health.types.ts
 * 归档时间：2026-04-20
 * 
 * 注意：这是参考，Week 1 不需要 Health 功能。
 */

export type HealthSignalType =
  | 'unused_entries'      // 长期未复用内容（30天）
  | 'stalled_projects'    // 停滞项目（14天）
  | 'orphan_entries'      // 孤岛内容（无标签无项目）
  | 'unstructured_dock'; // Dock 未处理（7天）

export interface HealthSignal {
  type: HealthSignalType;
  count: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
  payload?: Record<string, string | number>;
}

/**
 * Health 规则阈值参考：
 * - unused_entries: 30 天未查看
 * - stalled_projects: 14 天无更新
 * - orphan_entries: 无标签且无项目
 * - unstructured_dock: 7 天未处理
 */
