import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppProviders } from '@/app/AppProviders';
import { routes } from '@/app/routes';
import { readAuthConfig } from '@/auth/config';
import { createFirebaseAuthService } from '@/auth/firebase-auth-service';

const router = createBrowserRouter(routes);
const authService = createFirebaseAuthService(readAuthConfig(import.meta.env));

export function App() {
  return (
    <AppProviders authService={authService}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
