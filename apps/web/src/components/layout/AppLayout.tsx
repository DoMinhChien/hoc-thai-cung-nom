import {
  BookOpen,
  ChartLine,
  Gamepad2,
  LayoutDashboard,
  NotebookText,
  PencilLine,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { AccountBlock } from '@/components/account/AccountBlock';
import { AppLogo } from '@/components/AppLogo';
import { OfflineBadge } from '@/components/layout/OfflineBadge';
import { t, type MessageKey } from '@/i18n';
import { cn } from '@/lib/utils';

type NavItem = { to: string; label: MessageKey; testId: string; icon: LucideIcon };

const NAV_GROUPS: { label: MessageKey; items: NavItem[] }[] = [
  {
    label: 'nav.groupLearn',
    items: [
      { to: '/', label: 'nav.dashboard', testId: 'nav-dashboard', icon: LayoutDashboard },
      { to: '/units', label: 'nav.units', testId: 'nav-units', icon: BookOpen },
      // Badge số câu đến hạn có từ M9 (SCR-00).
      { to: '/practice', label: 'nav.practice', testId: 'nav-practice', icon: PencilLine },
      { to: '/words', label: 'nav.words', testId: 'nav-words', icon: NotebookText },
      { to: '/games', label: 'nav.games', testId: 'nav-games', icon: Gamepad2 },
    ],
  },
  {
    label: 'nav.groupYours',
    items: [
      { to: '/progress', label: 'nav.progress', testId: 'nav-progress', icon: ChartLine },
      { to: '/settings', label: 'nav.settings', testId: 'nav-settings', icon: Settings },
    ],
  },
];

const MAIN_ID = 'main-content';

/** "Bỏ qua tới nội dung chính" — chỉ hiện khi focus bằng Tab (SCR-00). */
function SkipLink() {
  return (
    <a
      href={`#${MAIN_ID}`}
      className="sr-only rounded-md bg-background px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:ring-2 focus:ring-ring"
    >
      {t('app.skipToContent')}
    </a>
  );
}

/** Khung desktop: sidebar 240px + vùng nội dung (SCR-00 §1). */
export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <SkipLink />
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r bg-secondary px-3 py-6">
        <Link to="/" className="self-start rounded-md px-2">
          <AppLogo />
        </Link>
        <nav aria-label={t('nav.label')} className="flex flex-col gap-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <h2 className="px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t(group.label)}
              </h2>
              <ul className="flex flex-col gap-0.5">
                {group.items.map(({ to, label, testId, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/'}
                      data-testid={testId}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring',
                          isActive &&
                            'bg-accent font-medium text-accent-foreground hover:bg-accent',
                        )
                      }
                    >
                      <Icon className="size-[18px]" aria-hidden />
                      {t(label)}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-auto border-t pt-4">
          <AccountBlock />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-end px-6 pt-4 empty:hidden xl:px-10">
          <OfflineBadge />
        </div>
        <main id={MAIN_ID} tabIndex={-1} className="flex-1 px-6 py-8 outline-none xl:px-10">
          <div className="mx-auto max-w-[1040px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

/** Chân trang Bare layout: link pháp lý (SCR-00 §2). */
function LegalFooter() {
  return (
    <footer className="py-6">
      <nav aria-label={t('legal.footerLabel')}>
        <ul className="flex justify-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link to="/privacy" className="hover:text-foreground hover:underline">
              {t('pages.privacy')}
            </Link>
          </li>
          <li aria-hidden>·</li>
          <li>
            <Link to="/terms" className="hover:text-foreground hover:underline">
              {t('pages.terms')}
            </Link>
          </li>
        </ul>
      </nav>
    </footer>
  );
}

/** Khung không sidebar (`/login`, trang pháp lý): logo trái trên, chân trang pháp lý. */
export function BareLayout({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <header className="px-6 pt-6 xl:px-10">
        <Link to="/" className="inline-block rounded-md">
          <AppLogo />
        </Link>
      </header>
      <main
        id={MAIN_ID}
        tabIndex={-1}
        className={cn(
          'mx-auto w-full flex-1 px-6 py-10 outline-none',
          wide ? 'max-w-6xl' : 'max-w-[720px]',
        )}
      >
        <Outlet />
      </main>
      <LegalFooter />
    </div>
  );
}

/** Khung cho trang `/dev/*` (giữ nguyên bố cục M0 để baseline typography không đổi). */
export function DevLayout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-8">
      <Link to="/" className="self-start">
        <AppLogo />
      </Link>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
