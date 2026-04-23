/**
 * 日期工具函数 - Week 2+ 参考
 * 
 * 来源：apps/server/src/shared/date.utils.ts
 * 归档时间：2026-04-20
 * 
 * 注意：这是参考文档，Week 1 不需要周范围计算。
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 获取 UTC 周范围（周一到周日）
 * 用于 Weekly Review 统计
 */
export function getUtcWeekRange(date: Date): { weekStart: Date; weekEnd: Date } {
  const utcDate = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  const day = utcDate.getUTCDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(utcDate.getTime() + offsetToMonday * DAY_MS);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);
  return { weekStart, weekEnd };
}

/**
 * 日期减法
 * 用于 Health 规则计算（如 30 天未复用）
 */
export function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * DAY_MS);
}