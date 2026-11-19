import type { Manifest, UnitBundle, UnitSummary } from '@nom/core';
import { vi } from 'vitest';
import { createContentClient } from '@/content/content-client';

// Content giả chỉ để test client — không phải nội dung học.
export const unit = {
  unit_id: 'u01',
  level: 'A1' as const,
  kind: 'theme' as const,
  order: 1,
  title_vi: 'Chào hỏi',
  can_do: ['Chào hỏi'],
  draft: true,
};

const lesson = {
  lesson_id: 'u01-l1',
  unit_id: 'u01',
  order: 1,
  title_vi: 'Bài 1',
  grammar_ids: [],
  draft: true,
  steps: ['vocab' as const],
};

export const units: UnitSummary[] = [
  { ...unit, lessons: [{ ...lesson, words: 1, sentences: 0 }], words: 1, sentences: 0 },
];

export const bundle: UnitBundle = {
  unit,
  lessons: [lesson],
  words: [
    {
      id: 'di',
      unit_id: 'u01',
      lesson_id: 'u01-l1',
      thai: 'ดี',
      thai_alt: [],
      meaning_vi: ['tốt'],
      tags: [],
      draft: true,
    },
  ],
  sentences: [],
  grammar: [],
  dialogues: [],
};

export const manifest = (
  version = '0000000000000001',
  unitHash = 'aaaaaaaaaaaaaaaa',
): Manifest => ({
  version,
  files: {
    'units.json': { hash: 'bbbbbbbbbbbbbbbb', count: 1 },
    'unit-u01.json': { hash: unitHash, count: 3 },
  },
});

/** `fetch` giả: trả JSON theo đường dẫn (bỏ query), ghi lại URL đã gọi. */
export function fakeContent(files: Record<string, unknown>) {
  const fetch = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    const name = url.replace(/^\/content\//, '').replace(/\?.*$/, '');
    if (!(name in files)) return new Response('not found', { status: 404 });
    return Response.json(files[name]);
  });
  const client = createContentClient({ baseUrl: '/content/', fetch });
  const urls = () => fetch.mock.calls.map(([input]) => String(input));
  return { fetch, client, files, urls };
}
