import { Link, NavLink, Outlet } from 'react-router';
import { AppLogo } from '@/components/AppLogo';
import { t, type MessageKey } from '@/i18n';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { to: string; label: MessageKey; testId: string }[] = [
  { to: '/', label: 'nav.dashboard', testId: 'nav-dashboard' },
  { to: '/alphabet', label: 'nav.alphabet', testId: 'nav-alphabet' },
  { to: '/tones', label: 'nav.tones', testId: 'nav-tones' },
  { to: '/vocab', label: 'nav.vocab', testId: 'nav-vocab' },
  { to: '/review', label: 'nav.review', testId: 'nav-review' },
  { to: '/reading', label: 'nav.reading', testId: 'nav-reading' },
  { to: '/listening', label: 'nav.listening', testId: 'nav-listening' },
  { to: '/games', label: 'nav.games', testId: 'nav-games' },
  { to: '/progress', label: 'nav.progress', testId: 'nav-progress' },
  { to: '/settings', label: 'nav.settings', testId: 'nav-settings' },
  { to: '/account', label: 'nav.account', testId: 'nav-account' },
];

/** Khung desktop: sidebar trái + vùng nội dung. Chi tiết theo SCR-00 (M0.5a). */
export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col gap-6 border-r bg-secondary px-4 py-6">
        <Link to="/" className="px-2">
          <AppLogo />
        </Link>
        <nav aria-label={t('nav.label')}>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  data-testid={item.testId}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-md px-3 py-2 text-sm hover:bg-background',
                      isActive && 'bg-background font-medium text-primary',
                    )
                  }
                >
                  {t(item.label)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-10 py-8">
        <Outlet />
      </main>
    </div>
  );
}

/** Khung tối giản không sidebar (đăng nhập, trang pháp lý). */
export function BareLayout() {
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
