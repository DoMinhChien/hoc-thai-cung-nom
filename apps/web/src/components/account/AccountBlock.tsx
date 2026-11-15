import { ChevronsUpDown, LogOut, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { SignOutDialog } from '@/components/account/SignOutDialog';
import { UserAvatar } from '@/components/account/UserAvatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/auth/useAuth';
import { t } from '@/i18n';
import { useOnline } from '@/lib/useOnline';

/** Khối tài khoản ở đáy sidebar (SCR-00, L-06). */
export function AccountBlock() {
  const auth = useAuth();
  const online = useOnline();
  const navigate = useNavigate();
  const [signOutOpen, setSignOutOpen] = useState(false);

  if (auth.status === 'loading') {
    // Không chớp sang Guest khi đang xác định phiên.
    return (
      <div
        data-testid="account-block-loading"
        role="status"
        aria-label={t('account.loading')}
        className="flex items-center gap-3 px-2"
      >
        <Skeleton className="size-8 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (auth.status === 'guest') {
    return (
      <div data-testid="account-block-guest" className="flex flex-col gap-3 px-2">
        <div className="flex items-center gap-3">
          <UserAvatar user={null} />
          <div className="min-w-0">
            <p className="text-sm font-medium">{t('account.guestName')}</p>
            <p className="text-xs text-muted-foreground">{t('account.guestHint')}</p>
          </div>
        </div>
        {online ? (
          <Button asChild variant="outline" size="sm">
            <Link to="/login" data-testid="account-sign-in">
              {t('account.signIn')}
            </Link>
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              {/* span giữ tooltip hoạt động khi nút bị vô hiệu */}
              <span tabIndex={0} className="flex">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="flex-1"
                  data-testid="account-sign-in"
                >
                  {t('account.signIn')}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t('app.needsNetwork')}</TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  const { user } = auth;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-testid="account-menu-trigger"
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserAvatar user={user} />
            <span className="min-w-0 flex-1">
              <span
                data-testid="account-display-name"
                className="block truncate text-sm font-medium"
              >
                {user.displayName ?? user.email}
              </span>
              {user.email && (
                <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
              )}
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuItem data-testid="menu-account" onSelect={() => void navigate('/account')}>
            <UserRound aria-hidden />
            {t('account.menuAccount')}
          </DropdownMenuItem>
          <DropdownMenuItem data-testid="menu-sign-out" onSelect={() => setSignOutOpen(true)}>
            <LogOut aria-hidden />
            {t('account.menuSignOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  );
}
