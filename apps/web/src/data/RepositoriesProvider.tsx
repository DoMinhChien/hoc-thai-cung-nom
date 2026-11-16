import type { Repositories } from '@nom/core';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/auth/useAuth';
import { GUEST_KEY, NomDatabase } from './db';
import { createDexieRepositories } from './dexie-repositories';
import { RepositoriesContext } from './repositories-context';

/**
 * Repository của người dùng hiện tại (L-07): DB `hoc-thai-nom-<uid>` khi đăng nhập, `guest` khi chưa.
 * Mỗi DB mở một lần cho cả vòng đời provider; xoá DB (L-08) không bị chặn vì Dexie tự đóng
 * kết nối khi có `versionchange`.
 */
export function RepositoriesProvider({
  children,
  override,
}: {
  children: ReactNode;
  /** Test: dùng repository có sẵn (vd. bộ nhớ) thay cho Dexie. */
  override?: Repositories;
}) {
  const auth = useAuth();
  const [opened] = useState(() => new Map<string, Repositories>());

  let repos: Repositories | null = override ?? null;
  if (!override && auth.status !== 'loading') {
    const key = auth.status === 'signed-in' ? auth.user.uid : GUEST_KEY;
    repos = opened.get(key) ?? createDexieRepositories(new NomDatabase(key));
    opened.set(key, repos);
  }
  return <RepositoriesContext.Provider value={repos}>{children}</RepositoriesContext.Provider>;
}
