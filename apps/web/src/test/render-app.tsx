import { MockAuthService } from '@nom/core';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '@/app/AppProviders';
import { routes } from '@/app/routes';

/** Render cả app (router + provider) tại `path` với `MockAuthService`. */
export function renderApp(path: string, auth = new MockAuthService()) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders authService={auth}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router, auth };
}

/** Giả lập mất mạng / có mạng lại cho `useOnline`. */
export function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
  window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}
