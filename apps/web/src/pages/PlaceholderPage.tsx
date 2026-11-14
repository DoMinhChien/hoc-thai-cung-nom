import { t, type MessageKey } from '@/i18n';

type PlaceholderPageProps = {
  title: MessageKey;
  testId: string;
};

/** Trang rỗng M0 — thay bằng màn hình thật ở milestone tương ứng. */
export function PlaceholderPage({ title, testId }: PlaceholderPageProps) {
  return (
    <section data-testid={`page-${testId}`} className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{t(title)}</h1>
      <p className="text-muted-foreground">{t('common.comingSoon')}</p>
    </section>
  );
}
