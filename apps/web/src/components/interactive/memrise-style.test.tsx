import { MockAudioProvider, type GameMistake } from '@nom/core';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioProviderBoundary } from '@/audio/AudioContext';
import { NomDatabase } from '@/data/db';
import { createDexieRepositories } from '@/data/dexie-repositories';
import { RepositoriesContext } from '@/data/repositories-context';
import {
  AUTO_SPEAK_KEY,
  GameTopBar,
  itemKey,
  langOf,
  ReviewList,
  UrgencyCard,
  useAutoSpeech,
  useFeedbackPause,
  useSpeakOnCue,
} from './index';

afterEach(async () => {
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

/** Luật "3 tim", nền đổi màu, tự đọc, đánh dấu "cần ôn" (v7.3, tham khảo Memrise). */
describe('GameTopBar — tim, tự đọc', () => {
  it('tim còn / mất, không hiện đồng hồ khi không có timeMs; mất tim → rung', () => {
    const { rerender } = render(
      <GameTopBar title="x" score={0} onExit={() => {}} lives={{ count: 3, max: 3 }} />,
    );
    const lives = screen.getByTestId('game-lives');
    expect(lives).toHaveAccessibleName('Còn 3 tim');
    expect(lives.querySelectorAll('svg')).toHaveLength(3);
    expect(screen.queryByRole('timer')).toBeNull();
    rerender(
      <GameTopBar title="x" score={0} onExit={() => {}} lives={{ count: 2, max: 3, delta: -1 }} />,
    );
    expect(lives).toHaveAccessibleName('Còn 2 tim');
    expect(lives).toHaveClass('motion-safe:animate-shake');
    // Được thưởng quá mức ban đầu → hiện thêm tim.
    rerender(
      <GameTopBar title="x" score={0} onExit={() => {}} lives={{ count: 4, max: 3, delta: 1 }} />,
    );
    expect(lives.querySelectorAll('svg')).toHaveLength(4);
  });

  it('nút tự đọc: bật/tắt; không có giọng Thái → vô hiệu', async () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <GameTopBar title="x" score={0} onExit={() => {}} speech={{ enabled: true, onToggle }} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Tắt tự đọc chữ Thái' }));
    expect(onToggle).toHaveBeenCalledOnce();
    rerender(
      <GameTopBar
        title="x"
        score={0}
        onExit={() => {}}
        speech={{ enabled: false, disabled: true, onToggle }}
      />,
    );
    const button = screen.getByRole('button', { name: 'Bật tự đọc chữ Thái' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Máy chưa có giọng đọc tiếng Thái');
  });
});

describe('UrgencyCard', () => {
  it('nền ngả đỏ dần sau 30% thời gian; sau khi trả lời dùng màu đúng/sai', () => {
    const { rerender } = render(<UrgencyCard elapsed={0.2}>x</UrgencyCard>);
    const card = screen.getByTestId('urgency-card');
    expect(card).toHaveAttribute('data-urgency', '0');
    rerender(<UrgencyCard elapsed={0.65}>x</UrgencyCard>);
    expect(card).toHaveAttribute('data-urgency', '50');
    rerender(<UrgencyCard elapsed={2}>x</UrgencyCard>);
    expect(card).toHaveAttribute('data-urgency', '100');
    rerender(
      <UrgencyCard elapsed={0.9} feedback="wrong">
        x
      </UrgencyCard>,
    );
    expect(card).toHaveAttribute('data-feedback', 'wrong');
    expect(card).toHaveClass('motion-safe:animate-shake');
    expect(card.style.backgroundColor).toBe('');
  });
});

describe('ReviewList', () => {
  const mistakes: GameMistake[] = [
    { itemType: 'word', itemId: 'chue', th: 'ชื่อ', expected: 'tên', given: 'bạn' },
    { itemType: 'word', itemId: 'rot', th: 'รถ', expected: 'คัน' },
  ];

  it('mục sai mặc định "cần ôn"; bấm để bỏ / thêm; chữ Thái có lang="th"', async () => {
    const onToggle = vi.fn();
    render(
      <ReviewList
        mistakes={mistakes}
        flagged={new Set([itemKey(mistakes[0]!)])}
        onToggle={onToggle}
      />,
    );
    const first = screen.getByRole('button', { name: 'Đánh dấu "cần ôn": ชื่อ' });
    const second = screen.getByRole('button', { name: 'Đánh dấu "cần ôn": รถ' });
    expect(first).toHaveAttribute('aria-pressed', 'true');
    expect(second).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(first);
    await userEvent.click(second);
    expect(onToggle.mock.calls).toEqual([
      [mistakes[0], false],
      [mistakes[1], true],
    ]);
    expect(screen.getByText('คัน')).toHaveAttribute('lang', 'th');
    expect(screen.getByText('bạn').tagName).toBe('DEL');
    expect(langOf('tên')).toBeUndefined();
  });
});

describe('tự đọc chữ Thái (AudioProvider)', () => {
  const setup = (audio: MockAudioProvider) => {
    const db = new NomDatabase('speech');
    const repos = createDexieRepositories(db);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AudioProviderBoundary provider={audio}>
        <RepositoriesContext.Provider value={repos}>{children}</RepositoriesContext.Provider>
      </AudioProviderBoundary>
    );
    return { db, repos, wrapper };
  };

  it('đọc khi sang câu mới (cue đổi), không đọc lại cùng câu; tắt → không đọc', async () => {
    const audio = new MockAudioProvider();
    const { db, repos, wrapper } = setup(audio);
    const { result, rerender } = renderHook(
      ({ text, cue }: { text: string | null; cue: number }) => {
        const speech = useAutoSpeech();
        useSpeakOnCue(text, cue, speech);
        return speech;
      },
      { wrapper, initialProps: { text: 'ชื่อ' as string | null, cue: 0 } },
    );
    await waitFor(() => expect(audio.spokenTexts).toEqual(['ชื่อ']));
    expect(result.current).toMatchObject({ enabled: true, available: true });
    rerender({ text: 'ชื่อ', cue: 0 });
    rerender({ text: 'รถ', cue: 1 });
    await waitFor(() => expect(audio.spokenTexts).toEqual(['ชื่อ', 'รถ']));

    await result.current.setEnabled(false);
    expect(await repos.settings.get(AUTO_SPEAK_KEY, true)).toBe(false);
    await waitFor(() => expect(result.current.enabled).toBe(false));
    rerender({ text: 'คน', cue: 2 });
    rerender({ text: null, cue: 3 });
    expect(audio.spokenTexts).toEqual(['ชื่อ', 'รถ']);
    db.close();
  });

  it('không có giọng Thái → không đọc; chưa có repository → ghi cài đặt không lỗi', async () => {
    const audio = new MockAudioProvider('missing');
    const { db, wrapper } = setup(audio);
    const { result } = renderHook(
      () => {
        const speech = useAutoSpeech();
        useSpeakOnCue('ชื่อ', 0, speech);
        return speech;
      },
      { wrapper },
    );
    await waitFor(() => expect(result.current.enabled).toBe(true));
    expect(result.current.available).toBe(false);
    expect(audio.spokenTexts).toEqual([]);
    db.close();

    const bare = renderHook(() => useAutoSpeech(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AudioProviderBoundary provider={audio}>{children}</AudioProviderBoundary>
      ),
    });
    await bare.result.current.setEnabled(true);
  });
});

describe('useFeedbackPause — đọc lại câu vừa xếp đúng', () => {
  const wrapperFor = (audio: MockAudioProvider) => {
    const db = new NomDatabase('pause');
    const repos = createDexieRepositories(db);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AudioProviderBoundary provider={audio}>
        <RepositoriesContext.Provider value={repos}>{children}</RepositoriesContext.Provider>
      </AudioProviderBoundary>
    );
    return { db, repos, wrapper };
  };

  it('đúng → đọc lại câu rồi mới sang câu; sai (không có câu) → chỉ chờ; chưa vào phản hồi → không gì', async () => {
    const audio = new MockAudioProvider();
    const { db, wrapper } = wrapperFor(audio);
    const onDone = vi.fn();
    const { rerender, result } = renderHook(
      ({ active, text }: { active: boolean; text: string | null }) => {
        const speech = useAutoSpeech();
        useFeedbackPause({ active, speakText: text, speech, minMs: 10, onDone });
        return speech;
      },
      { wrapper, initialProps: { active: false, text: null as string | null } },
    );
    // Cài đặt "tự đọc" + giọng nạp bất đồng bộ — máy bận có thể lâu hơn vài chục ms.
    await waitFor(() => expect(result.current).toMatchObject({ enabled: true, available: true }));
    await new Promise((r) => setTimeout(r, 30));
    expect(onDone).not.toHaveBeenCalled();

    rerender({ active: true, text: 'ผมชื่อสมชาย' });
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(audio.spokenTexts).toContain('ผมชื่อสมชาย');

    onDone.mockClear();
    rerender({ active: false, text: null });
    rerender({ active: true, text: null });
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(audio.spokenTexts.filter((x) => x === 'ผมชื่อสมชาย')).toHaveLength(1);
    db.close();
  });

  it('tắt tự đọc → không đọc nhưng vẫn sang câu; rời màn phản hồi trước khi xong → không gọi', async () => {
    const audio = new MockAudioProvider();
    const { db, repos, wrapper } = wrapperFor(audio);
    await repos.settings.set(AUTO_SPEAK_KEY, false);
    const onDone = vi.fn();
    const { rerender } = renderHook(
      ({ active, minMs }: { active: boolean; minMs: number }) =>
        useFeedbackPause({ active, speakText: 'คน', speech: useAutoSpeech(), minMs, onDone }),
      { wrapper, initialProps: { active: true, minMs: 10 } },
    );
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(audio.spokenTexts).toEqual([]);

    onDone.mockClear();
    rerender({ active: false, minMs: 10 });
    rerender({ active: true, minMs: 50 });
    rerender({ active: false, minMs: 50 });
    await new Promise((r) => setTimeout(r, 80));
    expect(onDone).not.toHaveBeenCalled();
    db.close();
  });
});
