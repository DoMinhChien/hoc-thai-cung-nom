import { WifiOff } from 'lucide-react';
import { t } from '@/i18n';
import { useOnline } from '@/lib/useOnline';

/** Badge "Ngoại tuyến" (SCR-00, L-09) — chỉ hiện khi mất mạng. */
export function OfflineBadge() {
  const online = useOnline();
  if (online) return null;
  return (
    <span
      role="status"
      data-testid="offline-badge"
      className="inline-flex items-center gap-1.5 rounded-md bg-caution-subtle px-2.5 py-1 text-xs font-medium text-caution"
    >
      <WifiOff className="size-3.5" aria-hidden />
      {t('app.offline')}
    </span>
  );
}
