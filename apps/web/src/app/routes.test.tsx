import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ROUTE_SAMPLES } from './route-samples';
import { routes } from './routes';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('routes', () => {
  it.each(ROUTE_SAMPLES)('$path hiển thị trang $testId', ({ path, testId }) => {
    renderAt(path);
    expect(screen.getByTestId(`page-${testId}`)).toBeInTheDocument();
  });

  it('điều hướng qua sidebar', async () => {
    const router = renderAt('/');
    await userEvent.click(screen.getByTestId('nav-alphabet'));
    expect(router.state.location.pathname).toBe('/alphabet');
    expect(screen.getByTestId('page-alphabet')).toBeInTheDocument();
    expect(screen.getByTestId('nav-alphabet')).toHaveAttribute('aria-current', 'page');
  });

  it('route lạ → trang 404', () => {
    renderAt('/khong-co');
    expect(screen.getByTestId('page-not-found')).toBeInTheDocument();
  });

  it('chữ Thái ở /dev/typography có lang="th"', () => {
    renderAt('/dev/typography');
    for (const el of screen.getAllByTestId('typography-th')) {
      expect(el).toHaveAttribute('lang', 'th');
    }
  });
});
