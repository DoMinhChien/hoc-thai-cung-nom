import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * Sheet trượt lên từ đáy (SCR-00 v2 §2, §4) cho phone / tablet: "Thêm", bộ lọc và chi tiết từ ở Sổ
 * từ. Dựng trên Dialog (focus trap, Esc, nút đóng), chừa safe area đáy.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  srTitle = false,
  testId,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Tiêu đề chỉ cho trình đọc màn hình (nội dung đã có tiêu đề riêng). */
  srTitle?: boolean;
  testId?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid={testId}
        aria-describedby={undefined}
        className={cn(
          'top-auto bottom-0 left-0 max-h-[85dvh] max-w-none translate-x-0 translate-y-0 content-start gap-3 overflow-y-auto rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] data-[state=closed]:zoom-out-100 data-[state=closed]:slide-out-to-bottom-10 data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-bottom-10 sm:max-w-none',
          className,
        )}
      >
        <DialogTitle className={srTitle ? 'sr-only' : 'pr-8 pl-2 text-base'}>{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
