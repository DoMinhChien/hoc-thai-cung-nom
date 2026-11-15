import type { AuthProviderId, AuthUser } from '@nom/core';
import { AuthError } from '@nom/core';
import { CircleAlert, LoaderCircle, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ProviderIcon } from '@/components/account/ProviderIcon';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/auth/useAuth';
import { accountData, GUEST_KEY } from '@/data';
import { t } from '@/i18n';
import { safeNext } from '@/lib/safe-next';
import { useOnline } from '@/lib/useOnline';
import { cn } from '@/lib/utils';
import { DisplayNameDialog } from './DisplayNameDialog';
import { TransferProgressDialog } from './TransferProgressDialog';

type Step =
  | { kind: 'idle' }
  | { kind: 'signing-in'; provider: AuthProviderId }
  | { kind: 'display-name'; user: AuthUser }
  | { kind: 'transfer'; user: AuthUser };

type Notice = { tone: 'warning' | 'danger'; code?: string };

const PROVIDER_STYLE: Record<AuthProviderId, string> = {
  google: 'border border-google-border bg-google-bg text-google-fg hover:bg-google-bg/90',
  facebook: 'bg-facebook-bg text-facebook-fg hover:bg-facebook-bg/90',
};

/** SCR-01 Chào mừng & Đăng nhập (L-01, L-02, L-03, L-07, L-09). */
export function LoginPage() {
  const auth = useAuth();
  const online = useOnline();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [notice, setNotice] = useState<Notice | null>(null);

  // Đã đăng nhập từ trước → không hiện màn này. Trong lúc chạy luồng đăng nhập thì giữ lại để hiện dialog.
  if (auth.status === 'signed-in' && step.kind === 'idle') return <Navigate to={next} replace />;

  const finish = () => void navigate(next, { replace: true });

  const afterDisplayName = async (user: AuthUser) => {
    if (await accountData.hasProgress(GUEST_KEY)) setStep({ kind: 'transfer', user });
    else finish();
  };

  const signIn = async (provider: AuthProviderId) => {
    setNotice(null);
    setStep({ kind: 'signing-in', provider });
    try {
      const { user, isNewUser } = await auth.service.signIn(provider);
      if (isNewUser) setStep({ kind: 'display-name', user });
      else await afterDisplayName(user);
    } catch (error) {
      setStep({ kind: 'idle' });
      const code = error instanceof AuthError ? error.code : 'unknown';
      if (code === 'cancelled') toast.info(t('login.cancelled'));
      else if (code === 'popup-blocked') setNotice({ tone: 'warning' });
      else
        setNotice({ tone: 'danger', code: error instanceof AuthError ? error.detail : undefined });
    }
  };

  const continueAsGuest = async () => {
    await accountData.setGuestChosen();
    void navigate(next);
  };

  const busy = step.kind !== 'idle';

  return (
    <section data-testid="page-login" className="grid items-center gap-12 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-6">
        <h1 className="max-w-md text-[40px] leading-tight font-semibold tracking-tight">
          {t('login.heading')}
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">{t('login.intro')}</p>
        <ExampleCard />
      </div>

      <div className="rounded-lg border bg-card p-8">
        <h2 className="mb-6 text-xl font-semibold">{t('login.cardTitle')}</h2>
        {auth.status === 'loading' ? (
          <div data-testid="login-loading" className="flex flex-col gap-3">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="mx-auto h-4 w-16" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notice && <LoginNotice notice={notice} />}
            {auth.service.providers.map((provider) => {
              const pending = step.kind === 'signing-in' && step.provider === provider;
              return (
                <Button
                  key={provider}
                  data-testid={`sign-in-${provider}`}
                  className={cn('h-11 w-full', PROVIDER_STYLE[provider])}
                  disabled={!online || busy}
                  onClick={() => void signIn(provider)}
                >
                  {pending ? (
                    <LoaderCircle className="animate-spin" aria-hidden />
                  ) : (
                    <ProviderIcon provider={provider} />
                  )}
                  {pending
                    ? t('login.opening')
                    : t('login.continueWith', { provider: t(`provider.${provider}`) })}
                </Button>
              );
            })}
            {!online && (
              <p data-testid="login-offline" className="text-sm text-muted-foreground">
                {t('login.needsNetwork')}
              </p>
            )}

            <div className="my-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t('login.or')}
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              variant="outline"
              data-testid="continue-as-guest"
              className="h-11 w-full"
              disabled={busy}
              onClick={() => void continueAsGuest()}
            >
              {t('login.guest')}
            </Button>
            <p className="text-sm text-muted-foreground">{t('login.guestHint')}</p>
          </div>
        )}
      </div>

      {step.kind === 'display-name' && (
        <DisplayNameDialog user={step.user} onDone={() => void afterDisplayName(step.user)} />
      )}
      {step.kind === 'transfer' && <TransferProgressDialog user={step.user} onDone={finish} />}
    </section>
  );
}

function LoginNotice({ notice }: { notice: Notice }) {
  const warning = notice.tone === 'warning';
  const Icon = warning ? TriangleAlert : CircleAlert;
  return (
    <div
      role="alert"
      data-testid={warning ? 'login-popup-blocked' : 'login-error'}
      className={cn(
        'flex gap-2 rounded-md p-3 text-sm',
        warning ? 'bg-caution-subtle text-caution' : 'bg-destructive-subtle text-destructive',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <p>{t(warning ? 'login.popupBlocked' : 'login.failed')}</p>
        {notice.code && (
          <p className="mt-1 text-xs opacity-80">{t('login.errorCode', { code: notice.code })}</p>
        )}
      </div>
    </div>
  );
}

/** Thẻ ví dụ tĩnh (SCR-01) — minh họa, không tương tác. */
function ExampleCard() {
  return (
    <figure
      aria-label={t('login.exampleCardLabel')}
      className="flex w-56 flex-col items-center gap-1 rounded-lg border bg-card p-6 shadow-sm"
    >
      <span className="text-5xl" aria-hidden>
        🐔
      </span>
      <span lang="th" className="font-thai text-th-lg leading-[1.75]">
        ก
      </span>
      <span className="text-sm">{t('login.examplePhonetic')}</span>
      <span className="text-sm font-medium text-tone-mid">{t('login.exampleTone')}</span>
    </figure>
  );
}
