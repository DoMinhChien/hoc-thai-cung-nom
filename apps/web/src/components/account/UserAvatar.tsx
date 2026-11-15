import type { AuthUser } from '@nom/core';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

/** Ảnh provider, fallback chữ cái đầu (SCR-00, SCR-02). `user = null` → avatar Guest "K". */
export function UserAvatar({ user, className }: { user: AuthUser | null; className?: string }) {
  if (!user) {
    return (
      <Avatar className={className} aria-hidden>
        <AvatarFallback className="bg-border font-medium text-foreground">
          {initial(t('account.guestName'))}
        </AvatarFallback>
      </Avatar>
    );
  }
  return (
    <Avatar className={className} aria-hidden>
      {user.photoURL && <AvatarImage src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className={cn('bg-accent font-medium text-accent-foreground')}>
        {initial(user.displayName ?? user.email ?? '?')}
      </AvatarFallback>
    </Avatar>
  );
}

function initial(name: string): string {
  return ([...name.trim()][0] ?? '?').toLocaleUpperCase('vi');
}
