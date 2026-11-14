import type { RouteObject } from 'react-router';
import { AppLayout, BareLayout } from '@/components/layout/AppLayout';
import type { MessageKey } from '@/i18n';
import { TypographyPage } from '@/pages/dev/TypographyPage';
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
      { path: '/dev/typography', element: <TypographyPage /> },
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
