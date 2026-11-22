import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppProviders } from '@/app/AppProviders';
import { routes } from '@/app/routes';
import { WebSpeechProvider } from '@/audio/web-speech-provider';
import { readAuthConfig } from '@/auth/config';
import { createFirebaseAuthService } from '@/auth/firebase-auth-service';
import { useKeepFocusedInView } from '@/lib/useKeepFocusedInView';

const router = createBrowserRouter(routes);
const authService = createFirebaseAuthService(readAuthConfig(import.meta.env));
const audio = new WebSpeechProvider({ baseUrl: `${import.meta.env.BASE_URL}content/` });

export function App() {
  useKeepFocusedInView();
  return (
    <AppProviders authService={authService} audio={audio}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
