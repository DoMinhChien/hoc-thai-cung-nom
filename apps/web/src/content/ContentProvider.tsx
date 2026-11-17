import type { ReactNode } from 'react';
import type { ContentClient } from './content-client';
import { ContentContext } from './content-context';

/** Thay content client cho cây component (test: `fetch` giả). */
export function ContentProvider({ client, children }: { client: ContentClient; children: ReactNode }) {
  return <ContentContext value={client}>{children}</ContentContext>;
}
