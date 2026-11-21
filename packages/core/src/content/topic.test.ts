import { describe, expect, it } from 'vitest';
import { UnitSchema } from '../schema/course';
import { topicColors, unitEmoji } from './topic';

const unit = (unit_id: string, kind: 'theme' | 'grammar', order: number) => ({
  unit_id,
  kind,
  order,
});

describe('màu chuyên đề (M0.5c Q1)', () => {
  it('theo vị trí trong lộ trình đầy đủ: Giáo trình trước, quay vòng 8 màu', () => {
    const units = [
      unit('c02', 'grammar', 2),
      ...Array.from({ length: 9 }, (_, i) => unit(`b${String(i + 1).padStart(2, '0')}`, 'theme', i + 1)),
      unit('c01', 'grammar', 1),
    ];
    const colors = topicColors(units);
    expect(colors.get('b01')).toBe(1);
    expect(colors.get('b08')).toBe(8);
    expect(colors.get('b09')).toBe(1);
    expect(colors.get('c01')).toBe(2);
    expect(colors.get('c02')).toBe(3);
  });

  it('hai unit liền nhau trong lộ trình không trùng màu (kể cả CĐ 3 / CĐ 11)', () => {
    const units = [unit('c03', 'grammar', 3), unit('c11', 'grammar', 11), unit('b01', 'theme', 1)];
    const colors = topicColors(units);
    expect(colors.get('c03')).not.toBe(colors.get('c11'));
  });
});

describe('emoji unit (M0.5c Q3)', () => {
  const row = { unit_id: 'b05', kind: 'theme', order: '5', title_vi: 'Ngày tháng', can_do: 'Nói ngày' };

  it('cột vắng / trống → mặc định theo nhánh', () => {
    expect(unitEmoji(UnitSchema.parse(row))).toBe('📘');
    expect(unitEmoji(UnitSchema.parse({ ...row, kind: 'grammar', emoji: '' }))).toBe('🧩');
  });

  it('nhận 1 emoji (kể cả ghép ZWJ / biến thể), từ chối chữ hoặc 2 emoji', () => {
    expect(unitEmoji(UnitSchema.parse({ ...row, emoji: '📅' }))).toBe('📅');
    expect(UnitSchema.parse({ ...row, emoji: '🧑‍🍳' }).emoji).toBe('🧑‍🍳');
    expect(UnitSchema.parse({ ...row, emoji: '☀️' }).emoji).toBe('☀️');
    expect(UnitSchema.safeParse({ ...row, emoji: 'A' }).success).toBe(false);
    expect(UnitSchema.safeParse({ ...row, emoji: '📅📆' }).success).toBe(false);
  });
});
