import type { UnitBundle, UnitSummary } from '@nom/core';
import { useContext, useEffect, useState } from 'react';
import type { ContentClient, ContentError } from './content-client';
import { ContentContext } from './content-context';

export type ContentState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: ContentError };

export function useContentClient(): ContentClient {
  return useContext(ContentContext);
}

/** Tải một file content; đổi `key` (vd. unit khác) → về `loading` rồi tải lại. */
function useContent<T>(key: string, load: (client: ContentClient) => Promise<T>): ContentState<T> {
  const client = useContentClient();
  const [result, setResult] = useState<{ key: string; client: ContentClient; state: ContentState<T> }>();

  useEffect(() => {
    let active = true;
    load(client).then(
      (data) => active && setResult({ key, client, state: { status: 'ready', data } }),
      (error: ContentError) => active && setResult({ key, client, state: { status: 'error', error } }),
    );
    return () => {
      active = false;
    };
    // `load` là hàm tạo mới mỗi render; `key` đại diện cho nó.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, key]);

  return result?.key === key && result.client === client ? result.state : { status: 'loading' };
}

/** Lộ trình (`units.json`) cho `/units`. */
export function useUnits(): ContentState<UnitSummary[]> {
  return useContent('units', (client) => client.units());
}

/** Toàn bộ content của một unit (`unit-<id>.json`). */
export function useUnit(unitId: string): ContentState<UnitBundle> {
  return useContent(`unit:${unitId}`, (client) => client.unit(unitId));
}
