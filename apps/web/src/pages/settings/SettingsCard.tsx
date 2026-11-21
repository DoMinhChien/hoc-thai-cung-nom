import type { ReactNode } from 'react';

/** Khối cài đặt (card trắng, tiêu đề h2; `id` để link `/settings#…`). */
export function Card({
  title,
  testId,
  id,
  children,
}: {
  title: string;
  testId: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      data-testid={testId}
      className="flex scroll-mt-6 flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-card"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}
