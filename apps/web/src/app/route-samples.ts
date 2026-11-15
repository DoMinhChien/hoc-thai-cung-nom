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
  { path: '/alphabet', testId: 'alphabet' },
  { path: '/alphabet/practice', testId: 'alphabet-practice' },
  { path: '/tones', testId: 'tones' },
  { path: '/vocab', testId: 'vocab' },
  { path: '/vocab/demo', testId: 'vocab-deck' },
  { path: '/review', testId: 'review' },
  { path: '/reading', testId: 'reading' },
  { path: '/reading/demo', testId: 'reading-detail' },
  { path: '/listening', testId: 'listening' },
  { path: '/games', testId: 'games' },
  { path: '/games/demo', testId: 'game' },
  { path: '/progress', testId: 'progress' },
  { path: '/settings', testId: 'settings' },
];
