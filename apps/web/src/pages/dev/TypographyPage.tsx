import { t } from '@/i18n';

/**
 * Mẫu kiểm tra hiển thị font — KHÔNG phải nội dung học.
 * Chọn các cụm có dấu chồng (nguyên âm trên + dấu thanh, nguyên âm dưới, ฎ ฏ ฐ có đuôi dưới).
 */
const THAI_SAMPLES = [
  'ก ข ฃ ค ฅ ฆ ง จ ฉ ช ซ ฌ ญ ฎ ฏ ฐ ฑ ฒ ณ ด ต ถ ท ธ น บ ป ผ ฝ พ ฟ ภ ม ย ร ล ว ศ ษ ส ห ฬ อ ฮ',
  'ปู่ ป้า ปั้น ปี๊ ปั๋ น้ำ ที่ นี่ ก็ กิ๊ก จั๊ก ตุ๊ก ผู้ ฝั่ง',
  'ฎีกา ฏุ ฐู ญู ปฤ ฤๅ ฦๅ ซื้อ ชื่อ เปื้อน เรื่อง',
];

const SIZES = [16, 24, 40, 72] as const;

export function TypographyPage() {
  return (
    <section data-testid="page-typography" className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t('pages.typography')}</h1>
        <p className="text-muted-foreground">{t('typography.intro')}</p>
        <p data-testid="typography-vi">{t('typography.vietnameseSample')}</p>
      </header>
      {SIZES.map((size) => (
        <div key={size} className="flex flex-col gap-1 border-t pt-4">
          <span className="text-sm text-muted-foreground">{t('typography.sizeLabel', { size })}</span>
          {THAI_SAMPLES.map((sample) => (
            <p key={sample} lang="th" data-testid="typography-th" style={{ fontSize: size }}>
              {sample}
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}
