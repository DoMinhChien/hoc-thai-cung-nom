import {
  BookOpen,
  ChartLine,
  Ellipsis,
  Gamepad2,
  LayoutDashboard,
  NotebookText,
  PencilLine,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { AccountBlock } from '@/components/account/AccountBlock';
import { UserAvatar } from '@/components/account/UserAvatar';
import { AppLogo } from '@/components/AppLogo';
import { BottomSheet } from '@/components/layout/BottomSheet';
import { StreakBadge } from '@/components/fun';
import { DueBadge } from '@/components/layout/DueBadge';
import { OfflineBadge } from '@/components/layout/OfflineBadge';
import { useAuth } from '@/auth/useAuth';
import { t, type MessageKey } from '@/i18n';
import { useBreakpoint } from '@/lib/useBreakpoint';
import { cn } from '@/lib/utils';

type NavItem = { to: string; label: MessageKey; testId: string; icon: LucideIcon };

const NAV_GROUPS: { label: MessageKey; items: NavItem[] }[] = [
  {
    label: 'nav.groupLearn',
    items: [
      { to: '/', label: 'nav.dashboard', testId: 'nav-dashboard', icon: LayoutDashboard },
      { to: '/units', label: 'nav.units', testId: 'nav-units', icon: BookOpen },
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

const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
/** 4 tab chính của thanh tab dưới (SCR-00 v2 §2); còn lại vào sheet "Thêm". */
const TAB_PATHS = ['/', '/units', '/practice', '/games'];
const TAB_ITEMS = NAV_ITEMS.filter((i) => TAB_PATHS.includes(i.to));
const MORE_ITEMS = NAV_ITEMS.filter((i) => !TAB_PATHS.includes(i.to));
const MORE_PATHS = [...MORE_ITEMS.map((i) => i.to), '/account'];

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

/**
 * Khung trang có điều hướng (SCR-00 v2 §1): phone < 744px thanh trên + thanh tab dưới, tablet
 * 744–1023px rail 72px, desktop ≥ 1024px sidebar 240px (SCR-00 v1).
 */
export function AppLayout() {
  const breakpoint = useBreakpoint();
  if (breakpoint === 'phone') return <PhoneLayout />;
  if (breakpoint === 'tablet') return <TabletLayout />;
  return <DesktopLayout />;
}

/** Khung desktop: sidebar 240px + vùng nội dung (SCR-00 §1). */
function DesktopLayout() {
  return (
    <div className="flex min-h-dvh">
      <SkipLink />
      <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r bg-secondary px-3 py-6">
        <Link to="/" className="self-start rounded-md px-2">
          <AppLogo />
        </Link>
        <StreakBadge />
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
                      {to === '/practice' && <DueBadge />}
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

/** Avatar → `/account` (Guest → trang đăng nhập qua `RequireAuth`). */
function AccountLink() {
  const auth = useAuth();
  return (
    <Link
      to="/account"
      data-testid="nav-account"
      aria-label={t('nav.account')}
      className="flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <UserAvatar user={auth.user} className="size-8" />
    </Link>
  );
}

/** Ô điều hướng icon trên + nhãn nhỏ dưới (thanh tab phone, rail tablet). */
function navTileClass(isActive: boolean) {
  return cn(
    'relative flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] leading-tight font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isActive && 'bg-accent text-accent-foreground',
  );
}

/** Nhãn ô điều hướng; iPhone xoay ngang (cao < 500px) chỉ còn icon (SCR-00 v2 §6). */
const TILE_LABEL = '[@media(max-height:499px)]:sr-only';

function NavTile({ item }: { item: NavItem }) {
  const { to, label, testId, icon: Icon } = item;
  return (
    <NavLink
      to={to}
      end={to === '/'}
      data-testid={testId}
      className={({ isActive }) => navTileClass(isActive)}
    >
      <Icon className="size-6" aria-hidden />
      <span className={TILE_LABEL}>{t(label)}</span>
      {to === '/practice' && (
        <span className="absolute top-0 right-0.5">
          <DueBadge />
        </span>
      )}
    </NavLink>
  );
}

/** Khung phone (SCR-00 v2 §2): thanh trên dính + thanh tab dưới cố định + sheet "Thêm". */
function PhoneLayout() {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <header
        data-testid="phone-topbar"
        className="sticky top-0 z-40 flex items-center gap-2 border-b bg-background pt-[env(safe-area-inset-top)] pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]"
      >
        <Link
          to="/"
          aria-label={t('nav.home')}
          className="flex h-14 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AppLogo className="h-8" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <OfflineBadge compact />
          <StreakBadge compact />
          <AccountLink />
        </div>
      </header>
      <main
        id={MAIN_ID}
        tabIndex={-1}
        className="min-w-0 flex-1 pt-5 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(56px+env(safe-area-inset-bottom)+2rem)] pl-[max(1rem,env(safe-area-inset-left))] outline-none"
      >
        <Outlet />
      </main>
      <nav
        aria-label={t('nav.label')}
        data-testid="tab-bar"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
      >
        <ul className="grid h-14 grid-cols-5 items-center gap-1 px-1">
          {TAB_ITEMS.map((item) => (
            <li key={item.to}>
              <NavTile item={item} />
            </li>
          ))}
          <li>
            <button
              type="button"
              data-testid="nav-more"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-current={moreActive ? 'page' : undefined}
              onClick={() => setMoreOpen(true)}
              className={navTileClass(moreActive)}
            >
              <Ellipsis className="size-6" aria-hidden />
              <span className={TILE_LABEL}>{t('nav.more')}</span>
            </button>
          </li>
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </div>
  );
}

/** Sheet "Thêm" (phone): Sổ từ, Tiến độ, Cài đặt + khối tài khoản. */
function MoreSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const close = () => onOpenChange(false);
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('nav.moreTitle')}
      testId="more-sheet"
    >
      <ul className="flex flex-col gap-1">
        {MORE_ITEMS.map(({ to, label, testId, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              data-testid={testId}
              onClick={close}
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 items-center gap-3 rounded-lg px-3 text-base outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring',
                  isActive && 'bg-accent font-medium text-accent-foreground hover:bg-accent',
                )
              }
            >
              <Icon className="size-5" aria-hidden />
              {t(label)}
            </NavLink>
          </li>
        ))}
      </ul>
      {/* Link trong khối tài khoản (Đăng nhập, Tài khoản) cũng đóng sheet. */}
      <div
        className="border-t pt-3"
        onClickCapture={(e) => {
          if ((e.target as Element).closest('a')) close();
        }}
      >
        <AccountBlock />
      </div>
    </BottomSheet>
  );
}

/** Khung tablet (SCR-00 v2 §3): rail icon 72px; streak / offline / avatar dồn xuống đáy rail. */
function TabletLayout() {
  return (
    <div className="flex min-h-dvh">
      <SkipLink />
      <aside className="sticky top-0 flex h-dvh w-[calc(72px+env(safe-area-inset-left))] shrink-0 flex-col items-center gap-4 overflow-y-auto border-r bg-secondary pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)]">
        <Link
          to="/"
          aria-label={t('nav.home')}
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AppLogo variant="mark" />
        </Link>
        <nav aria-label={t('nav.label')} data-testid="nav-rail">
          <ul className="flex w-16 flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavTile item={item} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col items-center gap-3">
          <OfflineBadge compact />
          <StreakBadge compact />
          <AccountLink />
        </div>
      </aside>
      <main
        id={MAIN_ID}
        tabIndex={-1}
        className="min-w-0 flex-1 pt-8 pr-[max(1.5rem,env(safe-area-inset-right))] pb-[max(2rem,env(safe-area-inset-bottom))] pl-6 outline-none"
      >
        <div className="mx-auto max-w-[1040px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/** Chân trang Bare layout: link pháp lý (SCR-00 §2). */
function LegalFooter() {
  return (
    <footer className="pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <header className="px-4 pt-[max(1.5rem,env(safe-area-inset-top))] tablet:px-6 xl:px-10">
        <Link to="/" className="inline-block rounded-md">
          <AppLogo />
        </Link>
      </header>
      <main
        id={MAIN_ID}
        tabIndex={-1}
        className={cn(
          'mx-auto w-full flex-1 px-4 py-8 outline-none tablet:px-6 tablet:py-10',
          wide ? 'max-w-6xl' : 'max-w-[720px]',
        )}
      >
        <Outlet />
      </main>
      <LegalFooter />
    </div>
  );
}

/**
 * Focus layout (SCR-00 §3, v2 §2): ẩn điều hướng khi học / chơi ở mọi bề rộng — màn tự vẽ thanh
 * trên (Thoát · Esc). Dùng cho `/games/:id`, `/units/:unitId/:lessonId`, `/practice/session`.
 */
export function FocusLayout() {
  return (
    <div className="min-h-dvh">
      <SkipLink />
      <main
        id={MAIN_ID}
        tabIndex={-1}
        className="mx-auto w-full max-w-[1040px] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none tablet:px-6 tablet:pt-6 xl:px-10"
      >
        <Outlet />
      </main>
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
