import { t } from '@/i18n';
import { LEGAL_UPDATED, type LegalDocument } from '@/i18n/legal.vi';

/** Mẫu chung 3 trang pháp lý (SCR-02 B): H1, ngày cập nhật, mục lục neo nếu > 4 mục. */
export function LegalPage({ doc, testId }: { doc: LegalDocument; testId: string }) {
  const withToc = doc.sections.length > 4;
  return (
    <article data-testid={`page-${testId}`} className="flex flex-col gap-8 leading-[1.6]">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tablet:text-[28px] lg:text-4xl tracking-tight">
          {doc.title}
        </h1>
        <p className="text-muted-foreground">{t('legal.updated', { date: LEGAL_UPDATED })}</p>
      </header>

      {withToc && (
        <nav aria-label={t('legal.toc')} className="rounded-lg border bg-secondary p-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-primary underline-offset-4 hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {doc.sections.map((s) => (
        <section key={s.id} id={s.id} className="flex scroll-mt-6 flex-col gap-3">
          <h2 className="text-xl font-semibold">{s.title}</h2>
          {s.steps && (
            <ol className="list-decimal space-y-1 pl-6">
              {s.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
          {s.paragraphs?.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {s.items && (
            <ul className="list-disc space-y-1 pl-6">
              {s.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
