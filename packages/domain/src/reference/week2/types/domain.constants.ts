/**
 * 领域常量定义 - Week 2+ 参考
 * 
 * 来源：apps/server/src/shared/domain.constants.ts
 * 归档时间：2026-04-20
 * 
 * 注意：这是参考文档，Week 1 不需要完整实现。
 */

// 输入来源类型
export const SOURCE_TYPES = ['text', 'voice'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

// Dock 状态流转
export const DOCK_STATUSES = ['pending', 'suggested', 'archived'] as const;
export type DockStatus = (typeof DOCK_STATUSES)[number];

// Entry 类型
export const ENTRY_TYPES = ['note', 'meeting', 'idea', 'task', 'reading'] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

// Entry 状态
export const ENTRY_STATUSES = ['active', 'archived'] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

// Project 状态
export const PROJECT_STATUSES = ['active', 'paused', 'completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// Task 状态
export const TASK_STATUSES = ['todo', 'doing', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// 类型校验工具函数
export function isValidLiteral<T extends readonly string[]>(
  values: T,
  value: string
): value is T[number] {
  return (values as readonly string[]).includes(value);
}
