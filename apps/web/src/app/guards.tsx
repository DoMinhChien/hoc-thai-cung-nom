import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/auth/useAuth';
import { accountData } from '@/data';

/** `/account` cần đăng nhập → Guest chuyển `/login?next=…` (flows §1). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return null;
  if (status === 'guest') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}

/**
 * Lần đầu mở app (flows §2): chưa đăng nhập và chưa từng chọn Guest → màn Chào mừng `/login`.
 * Chỉ áp dụng ở `/` để deep link vào các màn học vẫn mở được.
 */
export function FirstVisitGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [guestChosen, setGuestChosen] = useState<boolean | null>(null);

  useEffect(() => {
    if (status !== 'guest') return;
    let active = true;
    void accountData.isGuestChosen().then((chosen) => active && setGuestChosen(chosen));
    return () => {
      active = false;
    };
  }, [status]);

  if (status === 'loading') return null;
  if (status === 'guest') {
    if (guestChosen === null) return null;
    if (!guestChosen) return <Navigate to="/login" replace />;
  }
  return children;
}
