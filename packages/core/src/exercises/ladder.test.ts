import { describe, expect, it } from 'vitest';
import { LEVEL_EXERCISES, LEVEL_UP_STREAK, nextLevel, START_LEVEL } from './ladder';

describe('bậc dịch E-11', () => {
  it('câu mới ở bậc 2; đúng 2 lần liên tiếp → lên bậc, chuỗi về 0', () => {
    expect(START_LEVEL).toBe(2);
    expect(LEVEL_UP_STREAK).toBe(2);
    const once = nextLevel(undefined, true);
    expect(once).toEqual({ level: 2, streak: 1 });
    expect(nextLevel(once, true)).toEqual({ level: 3, streak: 0 });
    expect(nextLevel({ level: 3, streak: 1 }, true)).toEqual({ level: 4, streak: 0 });
  });

  it('sai → lùi 1 bậc (không dưới 2), chuỗi về 0', () => {
    expect(nextLevel({ level: 4, streak: 1 }, false)).toEqual({ level: 3, streak: 0 });
    expect(nextLevel({ level: 2, streak: 1 }, false)).toEqual({ level: 2, streak: 0 });
    expect(nextLevel(undefined, false)).toEqual({ level: 2, streak: 0 });
  });

  it('bậc 4 là cao nhất: đúng tiếp giữ bậc', () => {
    expect(nextLevel({ level: 4, streak: 0 }, true)).toEqual({ level: 4, streak: 1 });
    expect(nextLevel({ level: 4, streak: 2 }, true)).toEqual({ level: 4, streak: 2 });
  });

  it('loại câu hỏi theo bậc', () => {
    expect(LEVEL_EXERCISES).toEqual({ 2: ['E-05', 'E-04'], 3: ['E-06'], 4: ['E-07'] });
  });
});
