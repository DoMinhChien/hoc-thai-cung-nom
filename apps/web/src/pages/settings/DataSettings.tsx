import { parseBackup, summarizeBackup, type BackupError, type ProgressBackup } from '@nom/core';
import { Download, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/auth/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { accountData, GUEST_KEY } from '@/data';
import { PROGRESS_TABLES, SCHEMA_VERSION } from '@/data/db';
import { t } from '@/i18n';
import { Card } from './SettingsCard';

const ERROR_KEY: Record<
  BackupError,
  'settings.importJson' | 'settings.importFormat' | 'settings.importNewer'
> = {
  json: 'settings.importJson',
  format: 'settings.importFormat',
  tables: 'settings.importFormat',
  newer: 'settings.importNewer',
};

const fileDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

/**
 * Dữ liệu tiến độ (G-02): xuất ra tệp JSON, nhập lại (thay toàn bộ tiến độ trên máy, có hỏi lại),
 * xoá tiến độ trên máy. Dữ liệu theo người dùng hiện tại (Guest hoặc tài khoản, L-07).
 */
export function DataSettings() {
  const auth = useAuth();
  const userKey = auth.status === 'signed-in' ? auth.user.uid : GUEST_KEY;
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ProgressBackup | null>(null);
  const [clearing, setClearing] = useState(false);
  const [busy, setBusy] = useState(false);

  const exportFile = async () => {
    setBusy(true);
    try {
      const now = new Date();
      const backup = await accountData.exportProgress(userKey, now);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `hoc-thai-cung-nom-${fileDate(now)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast(t('settings.exported'));
    } finally {
      setBusy(false);
    }
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const result = parseBackup(await file.text(), PROGRESS_TABLES, SCHEMA_VERSION);
    if (fileRef.current) fileRef.current.value = '';
    if (!result.ok) {
      toast.error(t(ERROR_KEY[result.error]));
      return;
    }
    setPending(result.backup);
  };

  const confirmImport = async () => {
    if (!pending) return;
    await accountData.importProgress(userKey, pending);
    setPending(null);
    toast(t('settings.imported'));
  };

  const summary = pending && summarizeBackup(pending);
  return (
    <Card title={t('settings.dataTitle')} testId="settings-data" id="du-lieu">
      <p className="text-sm text-muted-foreground">{t('settings.dataIntro')}</p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          data-testid="settings-export"
          disabled={busy}
          onClick={exportFile}
        >
          <Download aria-hidden />
          {t('settings.export')}
        </Button>
        <Button
          variant="outline"
          data-testid="settings-import"
          onClick={() => fileRef.current?.click()}
        >
          <Upload aria-hidden />
          {t('settings.import')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          data-testid="settings-import-file"
          aria-label={t('settings.import')}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => void pick(e.target.files?.[0])}
        />
        <Button
          variant="ghost"
          data-testid="settings-clear"
          className="text-destructive"
          onClick={() => setClearing(true)}
        >
          <Trash2 aria-hidden />
          {t('settings.clear')}
        </Button>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent data-testid="import-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.importTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending &&
                summary &&
                t('settings.importBody', {
                  date: dateTime.format(new Date(pending.exportedAt)),
                  words: summary.words,
                  sentences: summary.sentences,
                  lessons: summary.lessonsDone,
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('words.cancel')}</AlertDialogCancel>
            <AlertDialogAction data-testid="import-confirm" onClick={() => void confirmImport()}>
              {t('settings.importConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearing} onOpenChange={setClearing}>
        <AlertDialogContent data-testid="clear-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.clearTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.clearBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('words.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="clear-confirm"
              onClick={() =>
                void accountData.clearProgress(userKey).then(() => toast(t('settings.cleared')))
              }
            >
              {t('settings.clearConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
