import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Nền bắt đầu ngả đỏ sau khi dùng hết chừng này thời gian của câu. */
const URGENCY_START = 0.3;

export interface UrgencyCardProps {
  /** Phần thời gian câu đã dùng, 0–1. */
  elapsed: number;
  /** Sau khi trả lời: nền xanh (đúng) / đỏ + rung (sai) thay cho nền theo giờ. */
  feedback?: 'correct' | 'wrong' | null;
  className?: string;
  children: ReactNode;
}

/**
 * Thẻ câu hỏi có giờ (v7.3, tham khảo Memrise Speed Review): nền chuyển dần từ màu của trò sang
 * đỏ nhạt khi sắp hết giờ. Đổi màu không phải chuyển động nên vẫn giữ khi giảm chuyển động.
 */
export function UrgencyCard({ elapsed, feedback = null, className, children }: UrgencyCardProps) {
  const level = Math.round(
    Math.max(0, Math.min(1, (elapsed - URGENCY_START) / (1 - URGENCY_START))) * 100,
  );
  const style: CSSProperties | undefined = feedback
    ? undefined
    : {
        backgroundColor: `color-mix(in oklab, var(--nom-danger-subtle) ${level}%, var(--game-subtle, var(--nom-accent-subtle)))`,
        borderColor: `color-mix(in oklab, var(--nom-danger) ${level}%, transparent)`,
      };
  return (
    <div
      data-testid="urgency-card"
      data-urgency={level}
      data-feedback={feedback ?? undefined}
      style={style}
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border-2 p-8 motion-safe:animate-enter',
        feedback === 'correct' && 'border-positive bg-positive-subtle',
        feedback === 'wrong' &&
          'border-destructive bg-destructive-subtle motion-safe:animate-shake',
        className,
      )}
    >
      {children}
    </div>
  );
}
