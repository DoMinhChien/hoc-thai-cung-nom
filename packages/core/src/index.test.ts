import { describe, expect, it } from 'vitest';
import { APP_NAME } from './index';

describe('@nom/core', () => {
  it('xuất tên app', () => {
    expect(APP_NAME).toBe('Học Thai cùng Nôm');
  });
});
