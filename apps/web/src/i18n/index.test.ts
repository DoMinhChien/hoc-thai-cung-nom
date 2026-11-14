import { describe, expect, it } from 'vitest';
import { t } from './index';

describe('t()', () => {
  it('lấy chuỗi theo khóa', () => {
    expect(t('nav.dashboard')).toBe('Tổng quan');
  });

  it('thay tham số', () => {
    expect(t('typography.sizeLabel', { size: 24 })).toBe('Cỡ 24px');
  });

  it('giữ nguyên placeholder thiếu tham số', () => {
    expect(t('typography.sizeLabel', {})).toBe('Cỡ {size}px');
  });
});
