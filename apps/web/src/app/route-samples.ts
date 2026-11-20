/**
 * Các URL mẫu của mọi route Phase 1 — dùng cho test điều hướng & axe (với Guest đã chọn "học không
 * cần đăng nhập"). `/account` cần đăng nhập → Guest thấy trang đăng nhập.
 */
export const ROUTE_SAMPLES: { path: string; testId: string }[] = [
  { path: '/', testId: 'dashboard' },
  { path: '/login', testId: 'login' },
  { path: '/account', testId: 'login' },
  { path: '/privacy', testId: 'privacy' },
  { path: '/terms', testId: 'terms' },
  { path: '/account/delete-instructions', testId: 'delete-instructions' },
  { path: '/units', testId: 'units' },
  { path: '/units/u01', testId: 'unit' },
  { path: '/units/u01/u01-l1', testId: 'lesson' },
  { path: '/practice', testId: 'practice' },
  { path: '/practice/session', testId: 'practice-session' },
  { path: '/words', testId: 'words' },
  { path: '/games', testId: 'games' },
  { path: '/games/true-false', testId: 'game' },
  { path: '/progress', testId: 'progress' },
  { path: '/settings', testId: 'settings' },
];
