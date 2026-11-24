import { Mic, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { SpeakingPanel, type SpeakTarget } from './SpeakingPanel';

/** Nút "🎙 Nói theo" trong bài học (SCR-10 §2.2): mở panel ghi âm gọn ngay tại chỗ. */
export function SayAfter({ target, className }: { target: SpeakTarget; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        data-testid="say-after"
        aria-expanded={open}
        aria-label={open ? t('speaking.sayAfterClose') : undefined}
        onClick={() => setOpen(!open)}
      >
        {open ? <X aria-hidden /> : <Mic aria-hidden />}
        {t('speaking.sayAfter')}
      </Button>
      {open && <SpeakingPanel target={target} size="compact" />}
    </div>
  );
}
