import { parse as bestEffortJsonParser } from 'best-effort-json-parser';

/**
 * 解析可能不完整的JSON字符串
 * @param data - 数据，可能是对象或不完整的JSON字符串
 * @returns 解析后的对象（可能是部分对象）
 */
export function parseIncompleteJson<T>(data: T | string): T {
  // 如果已经是对象，直接返回
  if (typeof data !== 'string') {
    return data;
  }

  // 如果是字符串，尝试解析为JSON
  try {
    // 使用best-effort-json-parser解析不完整的JSON
    const parsed = bestEffortJsonParser(data);
    return parsed as T;
  } catch (error) {
    // 解析失败，返回空对象
    return {} as T;
  }
}
