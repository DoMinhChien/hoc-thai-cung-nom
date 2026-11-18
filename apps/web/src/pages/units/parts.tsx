import type { ReactNode } from 'react';
import { Volume2 } from 'lucide-react';
import { useAudio } from '@/audio/useAudio';
import { useVoiceStatus } from '@/audio/useVoiceStatus';
import { Button } from '@/components/ui/button';
import type { ContentErrorKind } from '@/content/content-client';
import { t } from '@/i18n';
import { useOnline } from '@/lib/useOnline';
import { cn } from '@/lib/utils';

/** Nhãn nhỏ viền (level, "Ngữ pháp", "Bản nháp"). */
export function Badge({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <span
      className={cn(
        'rounded border px-1.5 py-0.5 text-xs leading-none',
        muted ? 'text-muted-foreground' : 'text-foreground',
      )}
    >
      {children}
    </span>
  );
}

/** Lỗi tải content (SCR-04): offline chưa cache → nhắc cần mạng; khác → "Thử lại". */
export function LoadError({ kind }: { kind: ContentErrorKind }) {
  const online = useOnline();
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 rounded-lg bg-destructive-subtle p-4"
    >
      <p>{!online && kind === 'network' ? t('units.offline') : t('units.loadError')}</p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        {t('common.retry')}
      </Button>
    </div>
  );
}

/** Nút nghe chữ Thái qua `AudioProvider`; vô hiệu khi máy không có giọng Thái. */
export function SpeakButton({
  text,
  audio: file,
  className,
}: {
  text: string;
  audio?: string;
  className?: string;
}) {
  const audio = useAudio();
  const status = useVoiceStatus();
  const unavailable = status === 'missing' || status === 'unsupported';
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={unavailable && !file}
      aria-label={t('units.listen', { text })}
      title={unavailable && !file ? t('lesson.noVoice') : t('units.listen', { text })}
      className={className}
      onClick={() => void audio.speak(text, file ? { audio: file } : undefined).catch(() => {})}
    >
      <Volume2 aria-hidden />
    </Button>
  );
}
