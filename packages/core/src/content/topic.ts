/**
 * Màu + minh họa chuyên đề (M0.5c hướng B, owner chọn 2026-11-21). 8 sắc `color.topic.1..8`.
 * Q1: gán theo **vị trí trong lộ trình đầy đủ** (Giáo trình → Chuyên đề, `compareUnits`) — hai
 * dòng liền nhau không bao giờ trùng màu; không đổi khi lọc theo nhánh.
 */
import { compareUnits } from './bundle';

export const TOPIC_COLORS = 8;
export type TopicColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type UnitKey = Parameters<typeof compareUnits>[0];

/** `unit_id` → số màu chuyên đề (1–8) theo vị trí trong lộ trình đầy đủ. */
export function topicColors(units: readonly UnitKey[]): Map<string, TopicColor> {
  return new Map(
    [...units]
      .sort(compareUnits)
      .map((u, i) => [u.unit_id, ((i % TOPIC_COLORS) + 1) as TopicColor]),
  );
}

/** Emoji mặc định khi unit chưa có cột `emoji` (Q3): Giáo trình 📘, Chuyên đề 🧩. */
export const DEFAULT_UNIT_EMOJI = { theme: '📘', grammar: '🧩' } as const;

export const unitEmoji = (unit: { kind: 'theme' | 'grammar'; emoji?: string | undefined }) =>
  unit.emoji ?? DEFAULT_UNIT_EMOJI[unit.kind];
