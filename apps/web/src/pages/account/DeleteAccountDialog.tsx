import { AuthError, type AuthUser } from '@nom/core';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/auth/useAuth';
import { accountData } from '@/data';
import { t } from '@/i18n';

/**
 * Dialog xoá tài khoản (SCR-02, flows §6, L-08): gõ XOÁ → xoá user Firebase (tự đăng nhập lại
 * nếu phiên cũ) → xoá IndexedDB của user → `/login` + toast.
 */
export function DeleteAccountDialog({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const { service } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const confirmed = confirmText.trim().normalize('NFC') === t('deleteDialog.confirmWord');

  const remove = async () => {
    setDeleting(true);
    setFailed(false);
    try {
      await service.deleteAccount();
    } catch (error) {
      setDeleting(false);
      // Huỷ popup đăng nhập lại: chỉ dừng, không báo lỗi.
      if (!(error instanceof AuthError && error.code === 'cancelled')) setFailed(true);
      return;
    }
    await accountData.deleteUserData(user.uid);
    toast.success(t('deleteDialog.done'));
    void navigate('/login', { replace: true });
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && !deleting && onClose()}>
      <AlertDialogContent data-testid="delete-dialog" className="sm:max-w-[440px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteDialog.body', { name: user.displayName ?? user.email ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="delete-confirm">{t('deleteDialog.confirmLabel')}</Label>
          <Input
            id="delete-confirm"
            data-testid="delete-confirm-input"
            value={confirmText}
            autoComplete="off"
            onChange={(e) => setConfirmText(e.target.value)}
          />
          {failed && (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
              <CircleAlert className="size-4" aria-hidden />
              {t('accountPage.error')}
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <Button variant="outline" disabled={deleting} onClick={onClose}>
            {t('deleteDialog.cancel')}
          </Button>
          <Button
            variant="destructive"
            data-testid="delete-confirm"
            disabled={!confirmed || deleting}
            onClick={() => void remove()}
          >
            {deleting && <LoaderCircle className="animate-spin" aria-hidden />}
            {t('deleteDialog.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
