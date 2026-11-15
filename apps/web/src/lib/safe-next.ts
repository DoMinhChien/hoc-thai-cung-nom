/** `?next=` chỉ nhận đường dẫn nội bộ (chặn open redirect `//evil.com`). */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}
