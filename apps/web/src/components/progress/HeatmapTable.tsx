import type { Accuracy, Tone } from '@nom/core';
import { TriangleAlert } from 'lucide-react';
import { ToneTag } from '@/components/tone';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

/** Dưới ngưỡng này (và đã có lượt) → ô "Cần luyện". */
export const WEAK_THRESHOLD = 0.6;

export interface HeatmapCell {
  /** Ô quy tắc của Tone Engine, vd. `low:dead-long`. */
  rule: string;
  accuracy: Accuracy;
  /** Thanh kết quả của quy tắc — hiện contour + tên trong ô. */
  tone?: Tone;
  /** Ô chiếm nhiều cột liền nhau (vd. Trung × Chết phủ cả "ngắn" và "dài"). */
  colSpan?: number;
}

export interface HeatmapColumn {
  key: string;
  label: string;
  /** Các cột liền nhau cùng `group` có chung một tiêu đề cấp trên (vd. "Chết" → ngắn / dài). */
  group?: string;
}

/** Nền theo tỉ lệ đúng — 3 sắc độ chàm như mức thuộc (brief §9), ô yếu dùng nền cảnh báo. */
function cellTone(a: Accuracy) {
  if (a.ratio === null) return 'bg-mastery-none text-muted-foreground';
  if (a.ratio < WEAK_THRESHOLD) return 'bg-destructive-subtle text-foreground';
  if (a.ratio < 0.8) return 'bg-mastery-learning text-foreground';
  if (a.ratio < 0.95) return 'bg-mastery-known text-foreground';
  return 'bg-mastery-mastered text-primary-foreground';
}

/** Gộp cột liền nhau cùng `group` để vẽ hàng tiêu đề cấp trên. */
function headerGroups(columns: readonly HeatmapColumn[]) {
  const groups: { label: string; columns: HeatmapColumn[]; grouped: boolean }[] = [];
  for (const c of columns) {
    const last = groups.at(-1);
    if (c.group && last?.grouped && last.label === c.group) last.columns.push(c);
    else groups.push({ label: c.group ?? c.label, columns: [c], grouped: !!c.group });
  }
  return groups;
}

/**
 * P-03: bảng quy tắc thanh điệu (mục 6.3) dạng heatmap. Mỗi ô ghi % + số lượt (không chỉ màu);
 * ô yếu có nút "Luyện quy tắc này". `getCell` trả `null` = ô "—" của bảng (không hợp lệ).
 */
export function HeatmapTable({
  caption,
  rows,
  columns,
  getCell,
  onPractice,
  className,
}: {
  caption: string;
  rows: readonly { key: string; label: string }[];
  columns: readonly HeatmapColumn[];
  getCell: (row: string, column: string) => HeatmapCell | null;
  onPractice?: (rule: string) => void;
  className?: string;
}) {
  const groups = headerGroups(columns);
  const twoLevels = groups.some((g) => g.grouped);

  return (
    <table
      className={cn('w-full border-separate border-spacing-1 text-sm', className)}
      data-testid="heatmap-table"
    >
      <caption className="pb-2 text-left text-sm text-muted-foreground">{caption}</caption>
      <thead>
        <tr>
          <td rowSpan={twoLevels ? 2 : undefined} />
          {groups.map((g) =>
            g.grouped ? (
              <th
                key={`group-${g.label}`}
                scope="colgroup"
                colSpan={g.columns.length}
                className="border-b px-2 py-1 text-center font-medium"
              >
                {g.label}
              </th>
            ) : (
              <th
                key={g.columns[0]!.key}
                scope="col"
                rowSpan={twoLevels ? 2 : undefined}
                className="px-2 py-1 text-center align-bottom font-medium"
              >
                {g.label}
              </th>
            ),
          )}
        </tr>
        {twoLevels && (
          <tr>
            {groups
              .filter((g) => g.grouped)
              .flatMap((g) => g.columns)
              .map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className="px-2 py-1 text-center text-xs font-medium text-muted-foreground"
                >
                  {c.label}
                </th>
              ))}
          </tr>
        )}
      </thead>
      <tbody>
        {rows.map((r) => {
          const cells = [];
          for (let i = 0; i < columns.length; i++) {
            const c = columns[i]!;
            const cell = getCell(r.key, c.key);
            const testId = `heatmap-cell-${r.key}-${c.key}`;
            if (!cell) {
              cells.push(
                <td
                  key={c.key}
                  className="rounded-md px-2 py-2 text-center text-subtle-foreground"
                  data-testid={testId}
                >
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">{t('progress.invalidCell')}</span>
                </td>,
              );
              continue;
            }
            const span = Math.max(1, Math.min(cell.colSpan ?? 1, columns.length - i));
            i += span - 1;
            const { accuracy: a } = cell;
            const weak = a.ratio !== null && a.ratio < WEAK_THRESHOLD;
            cells.push(
              <td
                key={c.key}
                colSpan={span > 1 ? span : undefined}
                data-testid={testId}
                data-rule={cell.rule}
                data-weak={weak || undefined}
                className={cn('rounded-md px-2 py-2 text-center align-top', cellTone(a))}
              >
                <div className="flex flex-col items-center gap-1">
                  {cell.tone && <ToneTag tone={cell.tone} size={14} className="text-xs" />}
                  <span className="flex items-center gap-1 font-semibold tabular-nums">
                    {weak && (
                      <TriangleAlert className="size-3.5 text-destructive" aria-hidden="true" />
                    )}
                    {a.ratio === null
                      ? t('progress.noData')
                      : t('progress.percent', { percent: Math.round(a.ratio * 100) })}
                  </span>
                  {a.total > 0 && (
                    <span className="text-xs whitespace-nowrap opacity-80">
                      {t('progress.attempts', { correct: a.correct, total: a.total })}
                    </span>
                  )}
                  {weak && <span className="sr-only">{t('progress.weak')}</span>}
                  {weak && onPractice && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 bg-card px-2 text-xs"
                      data-testid={`practice-${cell.rule}`}
                      onClick={() => onPractice(cell.rule)}
                    >
                      {t('progress.practiceRule')}
                    </Button>
                  )}
                </div>
              </td>,
            );
          }
          return (
            <tr key={r.key}>
              <th scope="row" className="px-2 py-1 text-left font-medium whitespace-nowrap">
                {r.label}
              </th>
              {cells}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
