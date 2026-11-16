import type { Tone } from '@nom/core';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { contourPath } from './tones';

/**
 * D10: ký hiệu đường cao độ (mini contour) của một thanh — SVG theo số Chao, vạch dọc bên phải
 * là thang cao độ. Màu theo `currentColor`; mặc định ẩn với trình đọc màn hình vì luôn đi kèm
 * tên thanh (dùng `ToneTag`).
 */
export function ToneContour({
  tone,
  size = 16,
  className,
}: {
  tone: Tone;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      className={cn('shrink-0', className)}
      aria-hidden="true"
      data-testid={`tone-contour-${tone}`}
    >
      <path d="M18 2 V18" strokeWidth={1} opacity={0.35} />
      <path d={contourPath(tone)} strokeWidth={2.25} />
    </svg>
  );
}

/** Contour + tên thanh — cách hiển thị một thanh ở mọi nơi (D10: không chỉ màu). */
export function ToneTag({
  tone,
  size,
  className,
}: {
  tone: Tone;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} data-tone={tone}>
      <ToneContour tone={tone} size={size} />
      {t(`toneName.${tone}`)}
    </span>
  );
}
