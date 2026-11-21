import { newId, WORD_NOTE_MAX } from '@nom/core';
import { Lightbulb, Pencil } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useKeyShortcut } from '@/components/interactive';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useRepositories, useRepositoryQuery } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

/** Bọc các đoạn chữ Thái trong văn bản người học gõ bằng `lang="th"` (SCR-07 §D.6). */
function withThai(text: string): ReactNode[] {
  return text.split(/([฀-๿]+(?:\s+[฀-๿]+)*)/).map((part, i) =>
    /[฀-๿]/.test(part) ? (
      <span key={i} lang="th">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/**
 * Khối "Mẹo nhớ" (V-04, SCR-07 §D.6): mẹo của người học ưu tiên hơn mẹo gợi ý của content
 * (`mnemonic_vi`); viết / sửa / xoá mẹo của tôi. Dùng ở Sổ từ và mặt sau thẻ từ (SCR-05).
 * `shortcuts`: bật phím `M` (chỉ một khối trên màn hình được bật).
 */
export function MnemonicBlock({
  wordId,
  suggested,
  shortcuts = false,
  className,
}: {
  wordId: string;
  suggested?: string | undefined;
  shortcuts?: boolean;
  className?: string;
}) {
  const repos = useRepositories();
  // Bọc trong object: `undefined` = đang tải, `{ note: undefined }` = từ chưa có mẹo.
  const loaded = useRepositoryQuery(
    async (r) => ({ note: await r.progress.getWordNote(wordId) }),
    [wordId],
  );
  const note = loaded?.note;
  const [editing, setEditing] = useState<string | null>(null);
  const [showSuggested, setShowSuggested] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const inputId = useId();
  const mine = note?.mnemonic;
  // Đổi từ đang xem → bỏ ô đang soạn (cập nhật state trong render, mẫu React chính thức).
  const [shownFor, setShownFor] = useState(wordId);
  if (shownFor !== wordId) {
    setShownFor(wordId);
    setEditing(null);
    setShowSuggested(false);
  }

  const open = () => setEditing(mine ?? '');
  useKeyShortcut('m', open, shortcuts && editing === null && loaded !== undefined);

  const save = async (value: string) => {
    if (!repos) return;
    const text = value.trim().slice(0, WORD_NOTE_MAX);
    try {
      if (!text) await repos.progress.deleteWordNote(wordId);
      else {
        await repos.progress.putWordNote({
          id: note?.id ?? newId(),
          itemType: 'word',
          itemId: wordId,
          mnemonic: text,
          updatedAt: new Date().toISOString(),
        });
        toast(t('words.noteSaved'));
      }
      setEditing(null);
    } catch {
      toast.error(t('words.noteError'));
    }
  };

  return (
    <div
      data-testid="mnemonic"
      data-source={mine ? 'mine' : suggested ? 'suggested' : 'none'}
      className={cn('flex flex-col gap-2 rounded-lg bg-muted p-4', className)}
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Lightbulb className="size-4 text-star-stroke" aria-hidden />
        {t('words.mnemonic')}
        {editing === null && (mine || suggested) && (
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {mine ? t('words.noteMine') : t('words.noteSuggested')}
          </span>
        )}
      </p>
      {editing !== null ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save(editing);
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            {t('words.noteMineLabel')}
          </label>
          <textarea
            id={inputId}
            data-testid="mnemonic-input"
            autoFocus
            rows={3}
            maxLength={WORD_NOTE_MAX}
            value={editing}
            placeholder={t('words.notePlaceholder')}
            onChange={(e) => setEditing(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void save(editing);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                setEditing(null);
              }
            }}
            className="w-full resize-none rounded-md border border-border-strong bg-surface p-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {t('words.noteCount', { n: editing.length, max: WORD_NOTE_MAX })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setEditing(null)}
            >
              {t('words.cancel')}
              <kbd className="font-sans text-xs text-muted-foreground">Esc</kbd>
            </Button>
            <Button type="submit" size="sm" data-testid="mnemonic-save">
              {t('words.save')}
              <kbd className="font-sans text-xs opacity-80">Ctrl+↵</kbd>
            </Button>
          </div>
        </form>
      ) : (
        <>
          {mine ? (
            <p data-testid="mnemonic-text">{withThai(mine)}</p>
          ) : suggested ? (
            <p data-testid="mnemonic-text">{withThai(suggested)}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{t('words.noNote')}</p>
          )}
          {mine && suggested && (
            <>
              <button
                type="button"
                aria-expanded={showSuggested}
                onClick={() => setShowSuggested((v) => !v)}
                className="self-start text-xs text-primary underline-offset-4 hover:underline"
              >
                {t('words.seeSuggested')}
              </button>
              {showSuggested && (
                <p className="text-sm text-muted-foreground">{withThai(suggested)}</p>
              )}
            </>
          )}
          <div className="flex flex-wrap gap-2">
            {mine ? (
              <>
                <Button variant="outline" size="sm" data-testid="mnemonic-edit" onClick={open}>
                  <Pencil aria-hidden />
                  {t('words.edit')}
                  {shortcuts && <kbd className="font-sans text-xs text-muted-foreground">M</kbd>}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="mnemonic-delete"
                  onClick={() => setConfirm(true)}
                >
                  {t('words.delete')}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" data-testid="mnemonic-write" onClick={open}>
                <Pencil aria-hidden />
                {t('words.writeNote')}
                {shortcuts && <kbd className="font-sans text-xs text-muted-foreground">M</kbd>}
              </Button>
            )}
          </div>
        </>
      )}
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent data-testid="mnemonic-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('words.deleteConfirm')}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('words.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="mnemonic-delete-confirm"
              onClick={() => void repos?.progress.deleteWordNote(wordId)}
            >
              {t('words.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
