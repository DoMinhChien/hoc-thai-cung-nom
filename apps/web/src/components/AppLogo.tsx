import { t } from '@/i18n';
import { cn } from '@/lib/utils';

type AppLogoProps = {
  /** `full` = biểu tượng + chữ, `mark` = chỉ biểu tượng. */
  variant?: 'full' | 'mark';
  className?: string;
};

/** Logo duy nhất của app. Thay logo thật = chỉ thay file trong `public/brand/`. */
export function AppLogo({ variant = 'full', className }: AppLogoProps) {
  const src = variant === 'full' ? '/brand/logo.svg' : '/brand/logo-mark.svg';
  return (
    <img
      src={src}
      alt={t('app.logoAlt')}
      data-testid="app-logo"
      className={cn(variant === 'full' ? 'h-10 w-auto' : 'size-10', className)}
    />
  );
}
