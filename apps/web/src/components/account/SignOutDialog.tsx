import { useNavigate } from 'react-router';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/auth/useAuth';
import { t } from '@/i18n';

/** SCR-00 / flows §5: xác nhận → sign out → `/login`. Dữ liệu của user vẫn giữ trên máy. */
export function SignOutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { service } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await service.signOut();
    void navigate('/login');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="sign-out-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('signOutDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('signOutDialog.body')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('signOutDialog.cancel')}</AlertDialogCancel>
          <AlertDialogAction data-testid="sign-out-confirm" onClick={() => void signOut()}>
            {t('signOutDialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
