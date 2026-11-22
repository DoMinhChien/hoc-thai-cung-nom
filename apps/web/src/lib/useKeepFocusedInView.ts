import { useEffect } from 'react';

/**
 * iOS Safari: bàn phím hệ thống mở làm vùng nhìn thấy (`visualViewport`) co lại nhưng không cuộn tới
 * ô đang nhập → cuộn ô nhập vào giữa vùng còn lại (SCR-00 v2 §6).
 */
export function useKeepFocusedInView() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const onResize = () => {
      const el = document.activeElement;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
      const box = el.getBoundingClientRect();
      if (box.top >= 0 && box.bottom <= viewport.height) return;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    viewport.addEventListener('resize', onResize);
    return () => viewport.removeEventListener('resize', onResize);
  }, []);
}
