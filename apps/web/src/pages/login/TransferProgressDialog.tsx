import type { AuthUser } from '@nom/core';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { accountData } from '@/data';
import { t } from '@/i18n';

/** D2 — Chuyển tiến độ Guest vào tài khoản (L-07). */
export function TransferProgressDialog({ user, onDone }: { user: AuthUser; onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  const transfer = async () => {
    setBusy(true);
    await accountData.transferGuestProgress(user.uid);
    toast.success(t('transferDialog.done'));
    onDone();
  };

  return (
    <AlertDialog open>
      <AlertDialogContent data-testid="transfer-dialog" className="sm:max-w-[440px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('transferDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('transferDialog.body', { name: user.displayName ?? user.email ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" data-testid="transfer-skip" disabled={busy} onClick={onDone}>
            {t('transferDialog.startFresh')}
          </Button>
          <Button data-testid="transfer-confirm" disabled={busy} onClick={() => void transfer()}>
            {busy && <LoaderCircle className="animate-spin" aria-hidden />}
            {t('transferDialog.transfer')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
