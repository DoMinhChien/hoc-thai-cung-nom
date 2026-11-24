import { ChevronRight, Mic } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useKeyShortcut } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/i18n';
import { sourceLabel } from '@/pages/games/source-label';
import { SourcePicker } from '@/pages/games/SourcePicker';
import { useSpeakingSource } from './useSpeakingSource';

/** `/practice/speaking` — chọn nội dung (bộ chọn của M12.8) rồi vào phiên luyện nói (SCR-10 §2). */
export function SpeakingPage() {
  const { state, choose, pool } = useSpeakingSource();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false);
  const ready = state.status === 'ready' ? state : null;
  const canStart = pool.length > 0;
  const start = () => navigate('/practice/speaking/session');
  useKeyShortcut('Enter', start, !!ready && canStart && !picking);

  return (
    <section data-testid="page-speaking" className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm">
          <Link to="/practice" className="text-primary underline-offset-4 hover:underline">
            {t('pages.practice')}
          </Link>
        </p>
        <h1 className="text-2xl font-bold tablet:text-[28px] lg:text-4xl">{t('speaking.title')}</h1>
        <p className="text-muted-foreground">{t('speaking.intro')}</p>
      </header>
      {state.status === 'error' ? (
        <p>{t('speaking.loadError')}</p>
      ) : !ready ? (
        <Skeleton className="h-32" role="status" aria-label={t('speaking.loading')} />
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-sm text-muted-foreground" id="speaking-source-label">
              {t('speaking.source')}
            </span>
            <button
              type="button"
              data-testid="speaking-source"
              data-source={ready.source.key}
              aria-describedby="speaking-source-label"
              aria-haspopup="dialog"
              onClick={() => setPicking(true)}
              className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-left text-base font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 flex-1 truncate">
                {sourceLabel(ready.spec, ready.bundles)}
                <span data-testid="speaking-source-count">
                  {t('games.sourceCountSuffix', {
                    count: t('games.sourceCount', {
                      words: pool.filter((i) => i.itemType === 'word').length,
                      sentences: pool.filter((i) => i.itemType === 'sentence').length,
                    }),
                  })}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </div>
          {!canStart && (
            <p data-testid="speaking-source-short" role="status" className="text-sm">
              {t('speaking.sourceShort')}
            </p>
          )}
          <SourcePicker
            open={picking}
            onOpenChange={setPicking}
            spec={ready.spec}
            bundles={ready.bundles}
            learner={ready.learner}
            counts={ready.counts}
            onApply={(spec) => void choose(spec)}
          />
          <Button
            className="self-start"
            size="lg"
            data-testid="speaking-start"
            aria-keyshortcuts="Enter"
            disabled={!canStart}
            onClick={start}
          >
            <Mic aria-hidden />
            {t('speaking.start')} ↵
          </Button>
        </>
      )}
    </section>
  );
}
