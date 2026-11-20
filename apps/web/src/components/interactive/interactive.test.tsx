import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NomDatabase } from '@/data/db';
import { createDexieRepositories } from '@/data/dexie-repositories';
import { RepositoriesContext } from '@/data/repositories-context';
import {
  ChoiceButton,
  CountIn,
  DEFAULT_FEEDBACK_VOLUME,
  DEFAULT_GAME_THEME,
  FEEDBACK_NOTES,
  FEEDBACK_SOUND_KEY,
  FEEDBACK_VOLUME_KEY,
  FeedbackBar,
  GAME_THEME_KEY,
  GAME_THEMES,
  MAX_FRAME_MS,
  formatClock,
  GameTopBar,
  PausedOverlay,
  TimeBar,
  TokenBank,
  useCompletionSound,
  useCountdown,
  useFeedbackSound,
  useGameLoop,
  useGameTheme,
  useKeyShortcut,
  useReducedMotion,
  webAudioTone,
} from './index';

afterEach(async () => {
  vi.useRealTimers();
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

const press = (key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(window, { key, ...init });

describe('useKeyShortcut', () => {
  it('bắt phím (không phân biệt hoa thường); bỏ qua khi có Ctrl, khi gõ trong ô nhập, khi tắt', () => {
    const handler = vi.fn();
    const { rerender } = render(<Probe keys={['f', 'ArrowLeft']} handler={handler} />);
    press('F');
    press('ArrowLeft');
    press('f', { ctrlKey: true });
    press('x');
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'f' });
    expect(handler).toHaveBeenCalledTimes(2);
    rerender(<Probe keys={['f']} handler={handler} enabled={false} />);
    press('f');
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('Enter / Space trên nút đang focus: để nút tự kích hoạt', () => {
    const handler = vi.fn();
    render(<Probe keys={['Enter', ' ']} handler={handler} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(handler).not.toHaveBeenCalled();
    press('Enter');
    expect(handler).toHaveBeenCalledOnce();
  });
});

function Probe(props: { keys: string[]; handler: () => void; enabled?: boolean }) {
  useKeyShortcut(props.keys, props.handler, props.enabled);
  return (
    <>
      <input aria-label="ô" />
      <button type="button">nút</button>
    </>
  );
}

describe('ChoiceButton', () => {
  it('phím số chọn nút; trạng thái đúng/sai có icon + data-status; vô hiệu thì không nhận phím', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <ChoiceButton shortcut="1" extraKeys={['ArrowLeft']} onSelect={onSelect}>
        <span lang="th">ตัว</span>
      </ChoiceButton>,
    );
    const button = screen.getByRole('button', { name: /ตัว/ });
    expect(button).toHaveAttribute('aria-keyshortcuts', '1 ArrowLeft');
    expect(button).toHaveAttribute('data-status', 'idle');
    press('1');
    press('ArrowLeft');
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(3);

    rerender(
      <ChoiceButton shortcut="1" status="wrong" disabled onSelect={onSelect}>
        ตัว
      </ChoiceButton>,
    );
    expect(button).toHaveAttribute('data-status', 'wrong');
    expect(button.querySelector('svg')).not.toBeNull();
    press('1');
    expect(onSelect).toHaveBeenCalledTimes(3);
  });
});

function Bank({ onSubmit }: { onSubmit?: () => void }) {
  const [value, setValue] = useState<number[]>([]);
  return (
    <TokenBank tokens={['ชื่อ', 'ผม', 'นิด']} value={value} onChange={setValue} onSubmit={onSubmit} />
  );
}

describe("TokenBank (E-06, F-03')", () => {
  const answer = () => screen.getByTestId('token-answer');
  const bank = () => screen.getByTestId('token-bank');

  it('bấm / phím số thêm thẻ, giữ chỗ trống; bấm thẻ ở câu trả lời để bỏ; Backspace; Enter gửi', async () => {
    const onSubmit = vi.fn();
    render(<Bank onSubmit={onSubmit} />);
    press('Enter');
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.click(within(bank()).getByRole('button', { name: /ผม/ }));
    press('3');
    press('2'); // đã dùng → bỏ qua
    expect(answer()).toHaveTextContent('ผมนิด');
    // Thẻ còn lại giữ phím số theo vị trí.
    expect(within(bank()).getByRole('button')).toHaveAttribute('aria-keyshortcuts', '1');
    expect(within(bank()).getByRole('button')).toHaveAttribute('lang', 'th');

    await userEvent.click(within(answer()).getByRole('button', { name: 'Bỏ thẻ ผม' }));
    expect(answer()).toHaveTextContent(/^นิด$/);
    press('1');
    press('Backspace');
    expect(answer()).toHaveTextContent(/^นิด$/);
    press('Enter');
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('vô hiệu: không nhận bấm / phím', async () => {
    const onChange = vi.fn();
    render(<TokenBank tokens={['ก', 'ข']} value={[0]} onChange={onChange} disabled />);
    press('2');
    press('Backspace');
    fireEvent.click(within(answer()).getByRole('button'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('FeedbackBar', () => {
  it('đúng / sai — đáp án tiếng Thái, role status', () => {
    const { rerender } = render(<FeedbackBar correct>+150</FeedbackBar>);
    expect(screen.getByRole('status')).toHaveAttribute('data-correct', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Đúng+150');
    rerender(<FeedbackBar correct={false} answer="คู่" />);
    expect(screen.getByRole('status')).toHaveTextContent('Sai — คู่');
    expect(screen.getByText('คู่')).toHaveAttribute('lang', 'th');
  });
});

describe('GameTopBar, TimeBar, PausedOverlay', () => {
  it('formatClock: đếm ngược làm tròn lên, đếm lên làm tròn xuống', () => {
    expect(formatClock(60_000)).toBe('1:00');
    expect(formatClock(400)).toBe('0:01');
    expect(formatClock(-5)).toBe('0:00');
    expect(formatClock(42_900, 'up')).toBe('0:42');
  });

  it('đồng hồ, điểm, combo ≥ 2, Esc để thoát, nút âm phản hồi', async () => {
    const onExit = vi.fn();
    const onToggle = vi.fn();
    const { rerender } = render(
      <GameTopBar title="Đoán loại từ" timeMs={42_000} score={1240} combo={1} onExit={onExit} />,
    );
    expect(screen.getByRole('timer')).toHaveTextContent('0:42');
    expect(screen.getByTestId('game-score')).toHaveTextContent(/1\.240/);
    expect(screen.queryByTestId('game-combo')).toBeNull();
    press('Escape');
    expect(onExit).toHaveBeenCalledOnce();

    rerender(
      <GameTopBar
        title="Ghép cặp"
        timeMs={65_000}
        clock="up"
        score={0}
        combo={3}
        onExit={onExit}
        sound={{ enabled: true, onToggle }}
      />,
    );
    expect(screen.getByRole('timer')).toHaveTextContent('1:05');
    expect(screen.getByTestId('game-combo')).toHaveTextContent('Combo ×3');
    const soundButton = screen.getByRole('button', { name: 'Tắt âm phản hồi' });
    expect(soundButton).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(soundButton);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('TimeBar: phần trăm, giá trị giây, báo sắp hết giờ', () => {
    const { rerender } = render(<TimeBar totalMs={5000} remainingMs={2500} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar.firstElementChild).toHaveStyle({ width: '50%' });
    rerender(<TimeBar totalMs={5000} remainingMs={-1} />);
    expect(bar.firstElementChild).toHaveStyle({ width: '0%' });
    expect(bar.firstElementChild).toHaveClass('bg-caution');
    rerender(<TimeBar totalMs={0} remainingMs={0} />);
    expect(bar.firstElementChild).toHaveStyle({ width: '0%' });
  });

  it('PausedOverlay: Space hoặc bấm để tiếp tục', async () => {
    const onResume = vi.fn();
    render(<PausedOverlay onResume={onResume} />);
    expect(screen.getByRole('dialog')).toHaveTextContent('Đã tạm dừng — Space để tiếp tục');
    press(' ', { target: document.body } as KeyboardEventInit);
    await userEvent.click(screen.getByRole('button'));
    expect(onResume).toHaveBeenCalled();
  });
});

describe('CountIn', () => {
  it('3 · 2 · 1 rồi bắt đầu; Space bắt đầu ngay', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<CountIn onDone={onDone} />);
    expect(screen.getByTestId('count-in')).toHaveTextContent('3');
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByTestId('count-in')).toHaveTextContent('2');
    for (let i = 0; i < 2; i++) {
      act(() => {
        vi.advanceTimersByTime(700);
      });
    }
    expect(onDone).toHaveBeenCalledOnce();
    press(' ');
    expect(onDone).toHaveBeenCalledTimes(2);
  });

  it('giảm chuyển động → bỏ qua đếm', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const onDone = vi.fn();
    render(<CountIn onDone={onDone} />);
    expect(onDone).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('GameTopBar — chuyển động', () => {
  it('điểm tăng → hiện "+n"; còn ≤ 10 s → đồng hồ cảnh báo', () => {
    const { rerender } = render(
      <GameTopBar title="x" timeMs={30_000} score={100} onExit={() => {}} />,
    );
    expect(screen.queryByTestId('game-gain')).toBeNull();
    expect(screen.getByRole('timer')).toHaveAttribute('data-urgent', 'false');
    rerender(<GameTopBar title="x" timeMs={9_000} score={300} onExit={() => {}} />);
    expect(screen.getByTestId('game-gain')).toHaveTextContent('+200');
    expect(screen.getByRole('timer')).toHaveAttribute('data-urgent', 'true');
  });
});

describe('useGameTheme (M9.6)', () => {
  it('mặc định Biển; đổi → lưu; giá trị lạ → mặc định', async () => {
    const db = new NomDatabase('theme');
    const repos = createDexieRepositories(db);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RepositoriesContext.Provider value={repos}>{children}</RepositoriesContext.Provider>
    );
    const { result } = renderHook(() => useGameTheme(), { wrapper });
    await waitFor(() => expect(result.current.theme).toBe(DEFAULT_GAME_THEME));
    await act(() => result.current.setTheme('space'));
    await waitFor(() => expect(result.current.theme).toBe('space'));
    expect(await repos.settings.get(GAME_THEME_KEY, '')).toBe('space');
    await act(() => repos.settings.set(GAME_THEME_KEY, 'volcano'));
    await waitFor(() => expect(result.current.theme).toBe(DEFAULT_GAME_THEME));
    expect(GAME_THEMES).toHaveLength(3);
    db.close();
  });

  it('chưa có repository: đang tải, ghi không lỗi', async () => {
    const { result } = renderHook(() => useGameTheme());
    expect(result.current.theme).toBeUndefined();
    await act(() => result.current.setTheme('garden'));
  });
});

describe('useGameLoop (M9.6)', () => {
  /** Bộ lập lịch khung hình giả: `frame(t)` chạy callback đang chờ ở thời điểm `t`. */
  function fakeFrames() {
    let pending: ((time: number) => void) | null = null;
    let next = 1;
    const cancelled: number[] = [];
    return {
      cancelled,
      scheduler: {
        request: (cb: (time: number) => void) => {
          pending = cb;
          return next++;
        },
        cancel: (id: number) => {
          cancelled.push(id);
          pending = null;
        },
      },
      frame(time: number) {
        const cb = pending;
        pending = null;
        act(() => cb?.(time));
      },
      get waiting() {
        return pending !== null;
      },
    };
  }

  it('gọi onFrame với dt giữa hai khung, cắt khung dài; dừng khi running=false', () => {
    const frames = fakeFrames();
    const onFrame = vi.fn();
    const { rerender } = renderHook(
      ({ running }) => useGameLoop({ running, onFrame, frames: frames.scheduler }),
      { initialProps: { running: true } },
    );
    frames.frame(1000);
    expect(onFrame).not.toHaveBeenCalled();
    frames.frame(1016);
    frames.frame(5000);
    frames.frame(4990);
    expect(onFrame.mock.calls.map((c) => c[0])).toEqual([16, MAX_FRAME_MS, 0]);
    rerender({ running: false });
    expect(frames.cancelled).toHaveLength(1);
    expect(frames.waiting).toBe(false);
  });

  it('tab ẩn / mất focus → tạm dừng; tiếp tục không tính thời gian dừng', () => {
    const frames = fakeFrames();
    const onFrame = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onFrame, frames: frames.scheduler }));
    frames.frame(0);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    expect(result.current.paused).toBe(true);
    expect(frames.waiting).toBe(false);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current.paused).toBe(true);
    act(() => result.current.resume());
    frames.frame(60_000);
    frames.frame(60_020);
    expect(onFrame.mock.calls.map((c) => c[0])).toEqual([20]);
    act(() => window.dispatchEvent(new Event('blur')));
    expect(result.current.paused).toBe(true);
  });

  it('mặc định dùng requestAnimationFrame', () => {
    const request = vi.fn(() => 7);
    const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', request);
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const { unmount } = renderHook(() => useGameLoop({ onFrame: () => {}, autoPause: false }));
    expect(request).toHaveBeenCalled();
    unmount();
    expect(cancel).toHaveBeenCalledWith(7);
    vi.unstubAllGlobals();
  });
});

describe('useCountdown', () => {
  const fakeClock = () => {
    let t = 0;
    return { clock: () => t, advance: (ms: number) => (t += ms) };
  };

  it('đếm thời gian chạy, không tính lúc tạm dừng; tab ẩn / mất focus → tạm dừng', () => {
    vi.useFakeTimers();
    const c = fakeClock();
    const onTick = vi.fn();
    const { result } = renderHook(() =>
      useCountdown({ durationMs: 60_000, clock: c.clock, onTick }),
    );
    act(() => {
      c.advance(1000);
      vi.advanceTimersByTime(100);
    });
    expect(result.current.elapsedMs).toBe(1000);
    expect(onTick).toHaveBeenLastCalledWith(1000);
    expect(result.current.remainingMs).toBe(59_000);

    act(() => {
      fireEvent.blur(window);
    });
    expect(result.current.paused).toBe(true);
    act(() => {
      c.advance(30_000);
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.now()).toBe(1000);

    act(() => result.current.resume());
    act(() => {
      c.advance(500);
      vi.advanceTimersByTime(100);
    });
    expect(result.current.now()).toBe(1500);
    expect(result.current.elapsedMs).toBe(1500);

    const hidden = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current.paused).toBe(true);
    hidden.mockReturnValue('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      result.current.pause();
    });
    expect(result.current.paused).toBe(true);
    hidden.mockRestore();
  });

  it('đếm lên: remainingMs null; running=false thì đứng yên, không tự tạm dừng', () => {
    vi.useFakeTimers();
    const c = fakeClock();
    const { result, rerender } = renderHook(
      ({ running }) => useCountdown({ durationMs: null, running, clock: c.clock }),
      { initialProps: { running: false } },
    );
    act(() => {
      c.advance(5000);
      vi.advanceTimersByTime(1000);
      fireEvent.blur(window);
    });
    expect(result.current).toMatchObject({ elapsedMs: 0, remainingMs: null, paused: false });
    rerender({ running: true });
    act(() => {
      c.advance(2000);
      vi.advanceTimersByTime(100);
    });
    expect(result.current.elapsedMs).toBe(2000);
  });

  it('đồng hồ mặc định: performance.now()', () => {
    const { result } = renderHook(() => useCountdown({ durationMs: 1000 }));
    expect(result.current.now()).toBeGreaterThanOrEqual(0);
  });
});

describe('useReducedMotion', () => {
  it('đọc prefers-reduced-motion; không có matchMedia → false', () => {
    const listeners: Array<() => void> = [];
    let matches = false;
    vi.stubGlobal('matchMedia', (q: string) => ({
      media: q,
      get matches() {
        return matches;
      },
      addEventListener: (_: string, l: () => void) => listeners.push(l),
      removeEventListener: () => {},
    }));
    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => {
      matches = true;
      listeners.forEach((l) => l());
    });
    expect(result.current).toBe(true);
    unmount();
    vi.unstubAllGlobals();
    vi.stubGlobal('matchMedia', undefined);
    expect(renderHook(() => useReducedMotion()).result.current).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe('webAudioTone', () => {
  it('đúng = 3 nốt đi lên, sai = 2 nốt đi xuống, hoàn thành = 4 nốt; âm lượng; đánh thức context bị treo', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => webAudioTone('correct', 0.4)).not.toThrow();
    const notes: { freq: number; type: string }[] = [];
    const peaks: number[] = [];
    const resume = vi.fn(async () => {});
    const param = () => ({
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: (v: number) => peaks.push(v),
      exponentialRampToValueAtTime: vi.fn(),
    });
    class FakeContext {
      state = 'suspended';
      resume = resume;
      currentTime = 0;
      destination = {};
      createGain = () => ({ gain: param(), connect: (d: unknown) => d });
      createOscillator = () => {
        const osc = {
          type: '',
          frequency: param(),
          connect: (node: unknown) => node,
          start: () => notes.push({ freq: osc.frequency.value, type: osc.type }),
          stop: vi.fn(),
        };
        return osc;
      };
    }
    vi.stubGlobal('AudioContext', FakeContext);
    webAudioTone('correct', 0.4);
    expect(resume).toHaveBeenCalled();
    const correct = notes.splice(0).map((n) => n.freq);
    expect(correct).toEqual(FEEDBACK_NOTES.correct.notes.map((n) => n.freq));
    expect(correct).toEqual([...correct].sort((a, b) => a - b));
    expect(peaks.every((p) => p === 0.2)).toBe(true);

    webAudioTone('wrong', 1);
    const wrong = notes.splice(0);
    expect(wrong.map((n) => n.freq)).toEqual([...wrong.map((n) => n.freq)].sort((a, b) => b - a));
    expect(wrong.every((n) => n.type === 'triangle')).toBe(true);

    webAudioTone('complete', 1);
    expect(notes).toHaveLength(4);
    const { notes: done } = FEEDBACK_NOTES.complete;
    expect(done.at(-1)!.at + done.at(-1)!.dur).toBeCloseTo(0.8);
    vi.unstubAllGlobals();
  });
});

describe('useFeedbackSound (F-13, T9.5.1)', () => {
  const setup = (name: string) => {
    const db = new NomDatabase(name);
    const repos = createDexieRepositories(db);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RepositoriesContext.Provider value={repos}>{children}</RepositoriesContext.Provider>
    );
    return { db, repos, wrapper };
  };

  it('mặc định bật, âm lượng 0,4; tắt hoặc âm lượng 0 → không phát; lưu qua SettingsRepository', async () => {
    const { db, repos, wrapper } = setup('sound');
    const player = vi.fn();
    const { result } = renderHook(() => useFeedbackSound(player), { wrapper });
    await waitFor(() => expect(result.current.volume).toBe(DEFAULT_FEEDBACK_VOLUME));
    expect(result.current.enabled).toBe(true);
    act(() => result.current.play('wrong'));
    expect(player).toHaveBeenCalledWith('wrong', 0.4);

    await act(() => result.current.setVolume(0));
    await waitFor(() => expect(result.current.volume).toBe(0));
    expect(await repos.settings.get(FEEDBACK_VOLUME_KEY, 1)).toBe(0);
    act(() => result.current.play('correct'));
    expect(player).toHaveBeenCalledOnce();

    await act(() => result.current.setVolume(0.8));
    await act(() => result.current.setEnabled(false));
    await waitFor(() => expect(result.current.enabled).toBe(false));
    expect(await repos.settings.get(FEEDBACK_SOUND_KEY, true)).toBe(false);
    act(() => result.current.play('correct'));
    expect(player).toHaveBeenCalledOnce();
    db.close();
  });

  it('useCompletionSound: phát "complete" đúng một lần khi cài đặt đã tải', async () => {
    const { db, wrapper } = setup('sound-complete');
    const player = vi.fn();
    const { rerender } = renderHook(() => useCompletionSound(true, player), { wrapper });
    await waitFor(() => expect(player).toHaveBeenCalledWith('complete', 0.4));
    rerender();
    expect(player).toHaveBeenCalledOnce();
    db.close();
  });

  it('chưa có repository (đang xác định đăng nhập): không phát, ghi không lỗi', async () => {
    const player = vi.fn();
    const { result } = renderHook(() => useFeedbackSound(player));
    expect(result.current.enabled).toBeUndefined();
    await act(() => result.current.setEnabled(true));
    await act(() => result.current.setVolume(1));
    act(() => result.current.play('correct'));
    expect(player).not.toHaveBeenCalled();
  });
});
