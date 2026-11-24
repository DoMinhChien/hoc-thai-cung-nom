import { MockAuthService } from '@nom/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@/app/AppProviders';
import { ContentContext } from '@/content/content-context';
import { accountData } from '@/data';
import { bundle, fakeContent } from '@/test/content-fixtures';
import { probeChunks } from '@/speaking/shadowing-probe';
import { ShadowingProbePage } from './ShadowingProbePage';

// Content giả (không phải nội dung học): đúng id hội thoại trang thử dùng.
const b09 = {
  ...bundle,
  unit: { ...bundle.unit, unit_id: 'b09' },
  dialogues: [
    {
      id: 'd-b09-l1',
      lesson_id: 'b09-l1',
      lines: [
        { speaker: 'A', th: 'สวัสดีครับ', vi: 'Chào' },
        { speaker: 'B', th: 'สวัสดีค่ะ', vi: 'Chào' },
        { speaker: 'A', th: 'ขอบคุณครับ', vi: 'Cảm ơn' },
      ],
      draft: true,
    },
  ],
};

function renderPage() {
  const { client } = fakeContent({
    'manifest.json': {
      version: '0000000000000001',
      files: { 'unit-b09.json': { hash: 'aaaaaaaaaaaaaaaa', count: 3 } },
    },
    'unit-b09.json': b09,
  });
  render(
    <AppProviders authService={new MockAuthService()}>
      <ContentContext.Provider value={client}>
        <ShadowingProbePage />
      </ContentContext.Provider>
    </AppProviders>,
  );
}

/** `speechSynthesis` giả: đọc xong mỗi cụm ngay (có 1 `boundary`). */
const spoken: string[] = [];
class FakeUtterance {
  lang = '';
  rate = 1;
  voice: unknown = null;
  onstart: (() => void) | null = null;
  onboundary: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  constructor(readonly text: string) {}
}
const synth = {
  getVoices: () => [],
  addEventListener() {},
  removeEventListener() {},
  cancel() {},
  speak(u: FakeUtterance) {
    if (!u.text) return;
    spoken.push(u.text);
    setTimeout(() => {
      u.onstart?.();
      u.onboundary?.();
      u.onend?.();
    });
  },
};

beforeEach(async () => {
  spoken.length = 0;
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  await accountData.setGuestChosen();
});

afterEach(async () => {
  vi.unstubAllGlobals();
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

describe('probeChunks (SCR-11 §2, bản thử)', () => {
  it('lượt / câu ≤ 9 thẻ = 1 cụm; dài hơn → nhóm ≈ 5 thẻ, nghĩa ở cụm đầu', () => {
    const tokens = Array.from({ length: 11 }, (_, i) => `ก${i}`);
    expect(probeChunks([{ th: 'สวัสดีครับ', vi: 'Chào', speaker: 'A' }])).toEqual([
      { th: 'สวัสดีครับ', vi: 'Chào', speaker: 'A' },
    ]);
    const long = probeChunks([{ th: tokens.join(''), vi: 'Dài', tokens }]);
    expect(long.map((c) => c.th)).toEqual([
      tokens.slice(0, 4).join(''),
      tokens.slice(4, 8).join(''),
      tokens.slice(8).join(''),
    ]);
    expect(long.map((c) => c.vi)).toEqual(['Dài', undefined, undefined]);
  });
});

describe('/dev/shadowing (M12.10 bước A)', () => {
  it('phát từng cụm theo thứ tự, tô sáng cụm, ghi log boundary', async () => {
    renderPage();
    const chunks = await screen.findAllByTestId('shadow-chunk');
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toHaveAttribute('data-active', 'true');

    await userEvent.click(screen.getByTestId('shadow-play'));
    await waitFor(() => expect(spoken).toHaveLength(chunks.length));
    expect(spoken[0]).toBe(chunks[0]!.querySelector('[lang="th"]')!.textContent);
    expect(chunks.at(-1)).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('shadow-log')).toHaveTextContent('boundary=1 end');
  });

  it('Aa ẩn chữ Thái', async () => {
    renderPage();
    await screen.findAllByTestId('shadow-chunk');
    await userEvent.click(screen.getByTestId('shadow-text'));
    expect(screen.getByTestId('shadow-chunks').querySelector('[lang="th"]')).toBeNull();
  });
});
