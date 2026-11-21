/**
 * Xuất / nhập tiến độ ra JSON (G-02, M12). Tệp là ảnh chụp mọi store tiến độ của một người dùng;
 * nhập = **thay toàn bộ** tiến độ trên máy (có hỏi lại ở UI). Hàm thuần — đọc/ghi IndexedDB ở web.
 */
import { z } from 'zod';

export const BACKUP_FORMAT = 'hoc-thai-cung-nom/progress';
export const BACKUP_VERSION = 1;

export interface ProgressBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  /** Phiên bản schema IndexedDB lúc xuất (để nâng cấp khi nhập vào bản mới hơn). */
  schemaVersion: number;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
}

const RowSchema = z
  .record(z.string(), z.unknown())
  .refine(
    (r) => typeof r.id === 'string' || typeof r.key === 'string',
    'mỗi bản ghi cần `id` hoặc `key`',
  );

const BackupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  tables: z.record(z.string(), z.array(RowSchema)),
});

export function createBackup(
  tables: Record<string, Record<string, unknown>[]>,
  schemaVersion: number,
  now: Date,
): ProgressBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    schemaVersion,
    exportedAt: now.toISOString(),
    tables,
  };
}

export type BackupError =
  /** Không phải JSON. */
  | 'json'
  /** JSON nhưng không phải tệp tiến độ của app. */
  | 'format'
  /** Xuất từ bản app mới hơn (schema IndexedDB cao hơn máy này). */
  | 'newer'
  /** Có store lạ. */
  | 'tables';

/**
 * Đọc tệp xuất: kiểm tra định dạng, phiên bản, tên store (`knownTables`). Store thiếu trong tệp
 * coi là rỗng (tệp từ bản cũ hơn).
 */
export function parseBackup(
  text: string,
  knownTables: readonly string[],
  maxSchemaVersion: number,
): { ok: true; backup: ProgressBackup } | { ok: false; error: BackupError } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'json' };
  }
  const parsed = BackupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'format' };
  const backup = parsed.data as ProgressBackup;
  if (backup.schemaVersion > maxSchemaVersion) return { ok: false, error: 'newer' };
  if (Object.keys(backup.tables).some((t) => !knownTables.includes(t))) {
    return { ok: false, error: 'tables' };
  }
  return {
    ok: true,
    backup: {
      ...backup,
      tables: Object.fromEntries(knownTables.map((t) => [t, backup.tables[t] ?? []])),
    },
  };
}

/** Tóm tắt cho hộp thoại xác nhận: số thẻ từ / câu, bài học xong, lượt bài tập. */
export function summarizeBackup(backup: ProgressBackup): {
  words: number;
  sentences: number;
  lessonsDone: number;
  attempts: number;
} {
  const cards = backup.tables.cards ?? [];
  const items = (type: string) =>
    new Set(cards.filter((c) => c.itemType === type).map((c) => String(c.itemId))).size;
  return {
    words: items('word'),
    sentences: items('sentence'),
    lessonsDone: (backup.tables.lessons ?? []).filter((l) => l.completedAt).length,
    attempts: (backup.tables.exerciseAttempts ?? []).length,
  };
}
