import { validateDisplayName, type AuthUser } from '@nom/core';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { ProviderIcon } from '@/components/account/ProviderIcon';
import { SignOutDialog } from '@/components/account/SignOutDialog';
import { UserAvatar } from '@/components/account/UserAvatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/auth/useAuth';
import { t } from '@/i18n';
import { useOnline } from '@/lib/useOnline';
import { cn } from '@/lib/utils';
import { DeleteAccountDialog } from './DeleteAccountDialog';

/** SCR-02 A — `/account` (L-05, L-06, L-08, L-10). Route được bảo vệ bởi `RequireAuth`. */
export function AccountPage() {
  const auth = useAuth();
  const online = useOnline();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (auth.status !== 'signed-in') return null;
  const { user } = auth;

  return (
    <section data-testid="page-account" className="flex max-w-[720px] flex-col gap-8">
      <PageHeader title={t('accountPage.title')} description={t('accountPage.description')} />

      <Block title={t('accountPage.profile')}>
        <ProfileForm user={user} online={online} />
      </Block>

      <Block title={t('accountPage.providers')}>
        {/* Phase 1: chỉ đọc, không có nút liên kết / huỷ liên kết (M12.5). */}
        <ul className="flex flex-col gap-3">
          {user.providers.map((provider) => (
            <li
              key={provider}
              data-testid={`provider-row-${provider}`}
              className="flex items-center gap-3"
            >
              <ProviderIcon provider={provider} />
              <span className="w-24 font-medium">{t(`provider.${provider}`)}</span>
              <span className="truncate text-sm text-muted-foreground">
                {t('accountPage.linked')}
                {user.email && ` · ${user.email}`}
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title={t('accountPage.learningData')}>
        <p className="text-muted-foreground">{t('accountPage.learningDataBody')}</p>
        <p className="mt-2 text-sm">
          {t('accountPage.backupHint')}{' '}
          <Link to="/settings" className="text-primary underline-offset-4 hover:underline">
            {t('accountPage.backupLink')}
          </Link>
        </p>
      </Block>

      <Block title={t('accountPage.session')}>
        <Button
          variant="outline"
          data-testid="account-sign-out"
          onClick={() => setSignOutOpen(true)}
        >
          {t('accountPage.signOut')}
        </Button>
      </Block>

      <Block title={t('accountPage.danger')} danger>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-medium">{t('accountPage.deleteTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('accountPage.deleteBody')}</p>
          </div>
          <Button
            variant="destructive"
            data-testid="account-delete"
            disabled={!online}
            onClick={() => setDeleteOpen(true)}
          >
            {t('accountPage.deleteButton')}
          </Button>
        </div>
        {!online && <NeedsNetwork />}
      </Block>

      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
      {deleteOpen && <DeleteAccountDialog user={user} onClose={() => setDeleteOpen(false)} />}
    </section>
  );
}

function Block({
  title,
  danger = false,
  children,
}: {
  title: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn('rounded-lg border bg-card p-6', danger && 'border-destructive')}
      aria-label={title}
    >
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function NeedsNetwork() {
  return <p className="mt-3 text-sm text-muted-foreground">{t('app.needsNetwork')}</p>;
}

function ProfileForm({ user, online }: { user: AuthUser; online: boolean }) {
  const { service } = useAuth();
  const saved = user.displayName ?? '';
  const [name, setName] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const changed = name.trim() !== saved;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!changed || saving || !online) return;
    const check = validateDisplayName(name);
    if (!check.ok) {
      setError(
        t(check.error === 'too-short' ? 'displayNameDialog.tooShort' : 'displayNameDialog.tooLong'),
      );
      return;
    }
    setSaving(true);
    try {
      await service.updateDisplayName(check.value);
      setName(check.value);
      toast.success(t('accountPage.saved'));
    } catch {
      setError(t('accountPage.error'));
    } finally {
      setSaving(false);
    }
  };

  const joined = user.createdAt
    ? new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(user.createdAt))
    : '—';

  return (
    <div className="flex gap-6">
      <UserAvatar user={user} className="size-16 text-xl" />
      <form
        onSubmit={(e) => void submit(e)}
        noValidate
        className="grid flex-1 grid-cols-[120px_1fr] items-center gap-x-4 gap-y-3"
      >
        <Label htmlFor="account-name">{t('accountPage.displayName')}</Label>
        <div className="flex gap-2">
          <Input
            id="account-name"
            data-testid="account-name-input"
            value={name}
            maxLength={60}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'account-name-error' : undefined}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
          <Button
            type="submit"
            data-testid="account-name-save"
            disabled={!changed || saving || !online}
          >
            {saving && <LoaderCircle className="animate-spin" aria-hidden />}
            {t('accountPage.save')}
          </Button>
        </div>
        {error && (
          <p
            id="account-name-error"
            role="alert"
            className="col-start-2 flex items-center gap-1.5 text-sm text-destructive"
          >
            <CircleAlert className="size-4" aria-hidden />
            {error}
          </p>
        )}
        {!online && (
          <p className="col-start-2 text-sm text-muted-foreground">{t('app.needsNetwork')}</p>
        )}

        <span className="text-sm text-muted-foreground">{t('accountPage.email')}</span>
        <span data-testid="account-email" className="truncate">
          {user.email ?? t('accountPage.noEmail')}
        </span>

        <span className="text-sm text-muted-foreground">{t('accountPage.joined')}</span>
        <span data-testid="account-joined">{joined}</span>
      </form>
    </div>
  );
}
