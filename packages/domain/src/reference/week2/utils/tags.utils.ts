/**
 * 标签工具函数 - Week 2+ 参考
 * 
 * 来源：apps/server/src/shared/tags.utils.ts
 * 归档时间：2026-04-20
 * 
 * 注意：这是参考文档，Week 1 不需要标签处理逻辑。
 */

/**
 * 解析标签 JSON 字符串
 * Prisma 存储格式：JSON.stringify(tags)
 */
export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * 序列化标签为 JSON 字符串
 */
export function serializeTags(tags: string[]): string {
  return JSON.stringify(tags);
}