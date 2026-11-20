import { practiceOverview } from '@nom/core';
import { useRepositoryQuery } from '@/data';
import { t } from '@/i18n';

/** Badge số câu đến hạn của mục Bài tập ở sidebar (SCR-00, SCR-06 §A); 0 → ẩn. */
export function DueBadge() {
  const due = useRepositoryQuery(async (r) => {
    const now = new Date();
    const { due } = practiceOverview({
      cards: await r.progress.listCards(),
      attempts: [],
      now,
      dayStart: now,
    });
    return due.words + due.sentences;
  }, []);
  if (!due) return null;
  return (
    <span
      data-testid="nav-practice-due"
      className="ml-auto rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground tabular-nums"
    >
      <span aria-hidden>{due}</span>
      <span className="sr-only">{t('practice.navDue', { n: due })}</span>
    </span>
  );
}
