import { validateDisplayName, type AuthUser } from '@nom/core';
import { LoaderCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/auth/useAuth';
import { t } from '@/i18n';

/**
 * D1 — Tên hiển thị (L-03). Bắt buộc: không có nút huỷ, `Esc` / bấm ra ngoài không đóng.
 */
export function DisplayNameDialog({ user, onDone }: { user: AuthUser; onDone: () => void }) {
  const { service } = useAuth();
  const [name, setName] = useState(user.displayName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
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
      onDone();
    } catch {
      setError(t('accountPage.error'));
      setSaving(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent
        data-testid="display-name-dialog"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[440px]"
      >
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-5" noValidate>
          <DialogHeader>
            <DialogTitle>{t('displayNameDialog.title')}</DialogTitle>
            <DialogDescription>{t('displayNameDialog.body')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="display-name">{t('displayNameDialog.label')}</Label>
            <Input
              id="display-name"
              data-testid="display-name-input"
              value={name}
              maxLength={60}
              autoFocus
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'display-name-error' : undefined}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
            />
            {error && (
              <p id="display-name-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" data-testid="display-name-submit" disabled={saving}>
              {saving && <LoaderCircle className="animate-spin" aria-hidden />}
              {t('displayNameDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
