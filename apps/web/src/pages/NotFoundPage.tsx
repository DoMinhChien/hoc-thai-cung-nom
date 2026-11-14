import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';

export function NotFoundPage() {
  return (
    <section data-testid="page-not-found" className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">{t('pages.notFound')}</h1>
      <Button asChild variant="outline">
        <Link to="/">{t('common.backHome')}</Link>
      </Button>
    </section>
  );
}
