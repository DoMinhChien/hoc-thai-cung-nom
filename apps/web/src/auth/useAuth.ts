import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './auth-context';

/** Trạng thái phiên + `service` để đăng nhập/đăng xuất. Component không import `firebase/auth`. */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth() phải nằm trong <AuthProvider>');
  return value;
}
