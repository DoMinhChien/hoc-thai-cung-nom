import { vi, type Messages } from './vi';

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;

type LeafPaths<T> = {
  [K in keyof T]: T[K] extends string ? K : Join<K, LeafPaths<T[K]>>;
}[keyof T];

/** Mọi đường dẫn tới chuỗi lá, vd. `'nav.dashboard'`. */
export type MessageKey = LeafPaths<Messages> & string;

/**
 * Lấy chuỗi hiển thị theo khóa, thay `{tên}` bằng `params.tên`.
 * Khóa sai → lỗi kiểu khi typecheck.
 */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  let node: unknown = vi;
  for (const part of key.split('.')) {
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== 'string') throw new Error(`Thiếu chuỗi i18n: ${key}`);
  if (!params) return node;
  return node.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export { vi };
