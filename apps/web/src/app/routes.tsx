import { Navigate, type RouteObject } from 'react-router';
import { FirstVisitGate, RequireAuth } from '@/app/guards';
import { AppLayout, BareLayout, DevLayout } from '@/components/layout/AppLayout';
import type { MessageKey } from '@/i18n';
import { deleteInstructionsVi, privacyVi, termsVi } from '@/i18n/legal.vi';
import { AccountPage } from '@/pages/account/AccountPage';
import { ProgressDemoPage } from '@/pages/dev/ProgressDemoPage';
import { TypingDemoPage } from '@/pages/dev/TypingDemoPage';
import { TypographyPage } from '@/pages/dev/TypographyPage';
import { LegalPage } from '@/pages/legal/LegalPage';
import { LoginPage } from '@/pages/login/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

const page = (path: string, title: MessageKey, testId: string): RouteObject => ({
  path,
  element: <PlaceholderPage title={title} testId={testId} />,
});

/** URL cũ trước v7 (plan mục 0.2, 0.7) → màn mới tương ứng, để link/bookmark cũ không 404. */
export const LEGACY_REDIRECTS: Record<string, string> = {
  '/alphabet': '/units',
  '/alphabet/practice': '/units',
  '/tones': '/units',
  '/vocab': '/units',
  '/vocab/:deckId': '/units',
  '/reading': '/units',
  '/reading/:id': '/units',
  '/listening': '/practice',
  '/review': '/practice',
};

/** Route Phase 1 — plan mục 0.7 (v7), quy tắc truy cập theo flows §1. */
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
    children: [
      { path: '/dev/typography', element: <TypographyPage /> },
      { path: '/dev/progress', element: <ProgressDemoPage /> },
      { path: '/dev/typing', element: <TypingDemoPage /> },
    ],
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
      page('/units', 'pages.units', 'units'),
      page('/practice', 'pages.practice', 'practice'),
      page('/words', 'pages.words', 'words'),
      page('/games', 'pages.games', 'games'),
      page('/games/:id', 'pages.game', 'game'),
      page('/progress', 'pages.progress', 'progress'),
      page('/settings', 'pages.settings', 'settings'),
      ...Object.entries(LEGACY_REDIRECTS).map(([path, to]) => ({
        path,
        element: <Navigate to={to} replace />,
      })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
