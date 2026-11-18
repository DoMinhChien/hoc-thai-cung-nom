/** `m:ss` — đếm ngược làm tròn lên (còn 0,4 s vẫn hiện 0:01), đếm lên làm tròn xuống. */
export function formatClock(ms: number, mode: 'down' | 'up' = 'down'): string {
  const total = Math.max(0, mode === 'down' ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export const itemKey = (item: { itemType: string; itemId: string }) =>
  `${item.itemType}:${item.itemId}`;

/** `lang="th"` khi chuỗi có chữ Thái (đáp án có thể là nghĩa Việt hoặc loại từ Thái). */
export const langOf = (text: string) => (/[฀-๿]/.test(text) ? 'th' : undefined);
