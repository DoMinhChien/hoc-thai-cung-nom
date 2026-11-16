import type { Repositories } from '@nom/core';
import { createContext } from 'react';

/** `null` khi trạng thái đăng nhập chưa rõ (chưa biết mở DB nào). */
export const RepositoriesContext = createContext<Repositories | null>(null);
