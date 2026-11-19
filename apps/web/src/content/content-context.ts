import { createContext } from 'react';
import { createContentClient, type ContentClient } from './content-client';

/** Mặc định đọc `public/content/` của bản build; test truyền client với `fetch` giả. */
export const ContentContext = createContext<ContentClient>(
  createContentClient({ baseUrl: `${import.meta.env.BASE_URL}content/` }),
);
