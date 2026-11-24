import { Navigate, type RouteObject } from 'react-router';
import { FirstVisitGate, RequireAuth } from '@/app/guards';
import { AppLayout, BareLayout, DevLayout, FocusLayout } from '@/components/layout/AppLayout';
import { deleteInstructionsVi, privacyVi, termsVi, withSpeakingPrivacy } from '@/i18n/legal.vi';
import { AccountPage } from '@/pages/account/AccountPage';
import { ProgressDemoPage } from '@/pages/dev/ProgressDemoPage';
import { TypingDemoPage } from '@/pages/dev/TypingDemoPage';
import { TypographyPage } from '@/pages/dev/TypographyPage';
import { GamePage } from '@/pages/games/GamePage';
import { GamesPage } from '@/pages/games/GamesPage';
import { PracticePage } from '@/pages/practice/PracticePage';
import { PracticeSessionPage } from '@/pages/practice/PracticeSessionPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { SpeakingPage } from '@/pages/speaking/SpeakingPage';
import { SpeakingSessionPage } from '@/pages/speaking/SpeakingSessionPage';
import { LessonPage } from '@/pages/units/LessonPage';
import { UnitPage } from '@/pages/units/UnitPage';
import { UnitsPage } from '@/pages/units/UnitsPage';
import { LegalPage } from '@/pages/legal/LegalPage';
import { LoginPage } from '@/pages/login/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { HomePage } from '@/pages/home/HomePage';
import { WordsPage } from '@/pages/words/WordsPage';
import { ProgressPage } from '@/pages/progress/ProgressPage';
import { speakingEnabled } from '@/speaking/flag';

/** M12.9 Luyện nói — chỉ có route khi bật cờ (production tắt trong CAT). */
const SPEAKING = speakingEnabled();

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
      {
        path: '/privacy',
        element: (
          <LegalPage doc={SPEAKING ? withSpeakingPrivacy(privacyVi) : privacyVi} testId="privacy" />
        ),
      },
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
    element: <FocusLayout />,
    children: [
      { path: '/games/:id', element: <GamePage /> },
      { path: '/units/:unitId/:lessonId', element: <LessonPage /> },
      { path: '/practice/session', element: <PracticeSessionPage /> },
      ...(SPEAKING
        ? [{ path: '/practice/speaking/session', element: <SpeakingSessionPage /> }]
        : []),
    ],
  },
  {
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <FirstVisitGate>
            <HomePage />
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
      { path: '/units', element: <UnitsPage /> },
      { path: '/units/:unitId', element: <UnitPage /> },
      { path: '/practice', element: <PracticePage /> },
      ...(SPEAKING ? [{ path: '/practice/speaking', element: <SpeakingPage /> }] : []),
      { path: '/words', element: <WordsPage /> },
      { path: '/games', element: <GamesPage /> },
      { path: '/progress', element: <ProgressPage /> },
      { path: '/settings', element: <SettingsPage /> },
      ...Object.entries(LEGACY_REDIRECTS).map(([path, to]) => ({
        path,
        element: <Navigate to={to} replace />,
      })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
