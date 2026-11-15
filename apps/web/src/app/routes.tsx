import type { RouteObject } from 'react-router';
import { FirstVisitGate, RequireAuth } from '@/app/guards';
import { AppLayout, BareLayout, DevLayout } from '@/components/layout/AppLayout';
import type { MessageKey } from '@/i18n';
import { deleteInstructionsVi, privacyVi, termsVi } from '@/i18n/legal.vi';
import { AccountPage } from '@/pages/account/AccountPage';
import { TypographyPage } from '@/pages/dev/TypographyPage';
import { LegalPage } from '@/pages/legal/LegalPage';
import { LoginPage } from '@/pages/login/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

const page = (path: string, title: MessageKey, testId: string): RouteObject => ({
  path,
  element: <PlaceholderPage title={title} testId={testId} />,
});

/** Route Phase 1 — plan mục 9, quy tắc truy cập theo flows §1. */
export const routes: RouteObject[] = [
  {
    element: <BareLayout wide />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <BareLayout />,
    children: [
      { path: '/privacy', element: <LegalPage doc={privacyVi} testId="privacy" /> },
      { path: '/terms', element: <LegalPage doc={termsVi} testId="terms" /> },
      {
        path: '/account/delete-instructions',
        element: <LegalPage doc={deleteInstructionsVi} testId="delete-instructions" />,
      },
    ],
  },
  {
    element: <DevLayout />,
    children: [{ path: '/dev/typography', element: <TypographyPage /> }],
  },
  {
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <FirstVisitGate>
            <PlaceholderPage title="pages.dashboard" testId="dashboard" />
          </FirstVisitGate>
        ),
      },
      {
        path: '/account',
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },
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
