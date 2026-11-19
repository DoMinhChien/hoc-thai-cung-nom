import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bundle, fakeContent, manifest, units } from '@/test/content-fixtures';
import { ContentProvider } from './ContentProvider';
import { useAllUnits, useUnit, useUnits, type ContentState } from './hooks';

const show = (state: ContentState<unknown>, ready: (data: never) => string) =>
  state.status === 'ready'
    ? ready(state.data as never)
    : state.status === 'error'
      ? `error:${state.error.kind}`
      : 'loading';

function Units() {
  const state = useUnits();
  return (
    <p data-testid="units">
      {show(state, (data: typeof units) => data.map((u) => u.unit_id).join(','))}
    </p>
  );
}

function Unit({ id }: { id: string }) {
  const state = useUnit(id);
  return (
    <p data-testid="unit">
      {show(state, (data: typeof bundle) => `${data.unit.unit_id}:${data.words.length}`)}
    </p>
  );
}

const files = () => ({
  'manifest.json': manifest(),
  'units.json': units,
  'unit-u01.json': bundle,
});

describe('useUnits / useUnit (T7.1)', () => {
  it('loading → dữ liệu', async () => {
    const { client } = fakeContent(files());
    render(
      <ContentProvider client={client}>
        <Units />
        <Unit id="u01" />
      </ContentProvider>,
    );
    expect(screen.getByTestId('units')).toHaveTextContent('loading');
    expect(await screen.findByText('u01:1')).toBeInTheDocument();
    expect(screen.getByTestId('units')).toHaveTextContent('u01');
  });

  it('lỗi tải → status error kèm loại lỗi', async () => {
    const { client } = fakeContent(files());
    render(
      <ContentProvider client={client}>
        <Unit id="u99" />
      </ContentProvider>,
    );
    expect(await screen.findByText('error:not-found')).toBeInTheDocument();
  });

  it('đổi unitId → về loading rồi tải unit mới', async () => {
    const { client } = fakeContent({
      ...files(),
      'manifest.json': {
        ...manifest(),
        files: { ...manifest().files, 'unit-u02.json': { hash: 'dddddddddddddddd', count: 1 } },
      },
      'unit-u02.json': { ...bundle, unit: { ...bundle.unit, unit_id: 'u02' }, words: [] },
    });
    const { rerender } = render(
      <ContentProvider client={client}>
        <Unit id="u01" />
      </ContentProvider>,
    );
    expect(await screen.findByText('u01:1')).toBeInTheDocument();
    rerender(
      <ContentProvider client={client}>
        <Unit id="u02" />
      </ContentProvider>,
    );
    expect(screen.getByTestId('unit')).toHaveTextContent('loading');
    expect(await screen.findByText('u02:0')).toBeInTheDocument();
  });

  it('useAllUnits: units.json rồi từng unit', async () => {
    const { client } = fakeContent(files());
    function All() {
      const state = useAllUnits();
      return (
        <p data-testid="all">
          {show(state, (data: (typeof bundle)[]) => data.map((b) => b.unit.unit_id).join(','))}
        </p>
      );
    }
    render(
      <ContentProvider client={client}>
        <All />
      </ContentProvider>,
    );
    expect(await screen.findByText('u01')).toBeInTheDocument();
  });
});
