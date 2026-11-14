import type { RouteObject } from 'react-router';
import { AppLayout, BareLayout } from '@/components/layout/AppLayout';
import type { MessageKey } from '@/i18n';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

const page = (path: string, title: MessageKey, testId: string): RouteObject => ({
  path,
  element: <PlaceholderPage title={title} testId={testId} />,
});

/** Route Phase 1 — plan mục 9. */
export const routes: RouteObject[] = [
  {
    element: <BareLayout />,
    children: [
      page('/login', 'pages.login', 'login'),
      page('/privacy', 'pages.privacy', 'privacy'),
      page('/terms', 'pages.terms', 'terms'),
      page('/account/delete-instructions', 'pages.deleteInstructions', 'delete-instructions'),
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <PlaceholderPage title="pages.dashboard" testId="dashboard" /> },
      page('/account', 'pages.account', 'account'),
      page('/alphabet', 'pages.alphabet', 'alphabet'),
      page('/alphabet/practice', 'pages.alphabetPractice', 'alphabet-practice'),
      page('/tones', 'pages.tones', 'tones'),
      page('/vocab', 'pages.vocab', 'vocab'),
      page('/vocab/:deckId', 'pages.vocabDeck', 'vocab-deck'),
      page('/review', 'pages.review', 'review'),
      page('/reading', 'pages.reading', 'reading'),
      page('/reading/:id', 'pages.readingDetail', 'reading-detail'),
      page('/listening', 'pages.listening', 'listening'),
      page('/games', 'pages.games', 'games'),
      page('/games/:id', 'pages.game', 'game'),
      page('/progress', 'pages.progress', 'progress'),
      page('/settings', 'pages.settings', 'settings'),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

/** Các URL mẫu của mọi route Phase 1 — dùng cho test điều hướng & axe. */
export const ROUTE_SAMPLES: { path: string; testId: string }[] = [
  { path: '/', testId: 'dashboard' },
  { path: '/login', testId: 'login' },
  { path: '/account', testId: 'account' },
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
