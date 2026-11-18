import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ThaiKeyboard } from './ThaiKeyboard';
import { ThaiTextInput } from './ThaiTextInput';

function Field({ onSubmit }: { onSubmit?: () => void }) {
  const [value, setValue] = useState('');
  return <ThaiTextInput value={value} onChange={setValue} onSubmit={onSubmit} aria-label="Gõ" />;
}

const keyboard = () => screen.getByTestId('thai-keyboard');
const key = (name: string) => within(keyboard()).getByRole('button', { name });
const input = () => screen.getByTestId<HTMLInputElement>('thai-input');

describe('ThaiKeyboard (G-06)', () => {
  it('Kedmanee: phím Thái là <button lang="th">, dấu kết hợp hiện trên ◌', async () => {
    const onKey = vi.fn();
    render(<ThaiKeyboard onKey={onKey} onBackspace={() => {}} />);
    expect(key('ก')).toHaveAttribute('lang', 'th');
    await userEvent.click(key('ก'));
    await userEvent.click(key('◌่'));
    expect(onKey.mock.calls).toEqual([['ก'], ['่']]);
  });

  it('Shift cho một phím; Caps Lock giữ tới khi tắt; Space, Backspace', async () => {
    const onKey = vi.fn();
    const onBackspace = vi.fn();
    render(<ThaiKeyboard onKey={onKey} onBackspace={onBackspace} />);

    const shifts = () => within(keyboard()).getAllByRole('button', { name: 'Shift' });
    expect(shifts()).toHaveLength(2);
    await userEvent.click(shifts()[1]!);
    for (const s of shifts()) expect(s).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(key('ฆ'));
    await userEvent.click(key('ห'));
    for (const s of shifts()) expect(s).not.toHaveAttribute('aria-pressed');

    await userEvent.click(key('Caps Lock'));
    expect(key('Caps Lock')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(key('ฆ'));
    await userEvent.click(key('ฆ'));
    await userEvent.click(key('Caps Lock'));
    await userEvent.click(key('ห'));

    await userEvent.click(key('Dấu cách'));
    await userEvent.click(key('Xoá'));
    expect(onKey.mock.calls.flat()).toEqual(['ฆ', 'ห', 'ฆ', 'ฆ', 'ห', ' ']);
    expect(onBackspace).toHaveBeenCalledOnce();
  });
});

describe('ThaiTextInput (G-06)', () => {
  it('bấm phím ảo: chèn tại con trỏ, ô nhập không mất focus', async () => {
    render(<Field />);
    await userEvent.click(input());
    for (const name of ['ท', '◌่', '◌ี']) await userEvent.click(key(name));
    expect(input()).toHaveValue('ท่ี');
    expect(input()).toHaveFocus();

    input().setSelectionRange(1, 1);
    await userEvent.click(key('ด'));
    expect(input()).toHaveValue('ทด่ี');
    expect(input().selectionStart).toBe(2);

    await userEvent.click(key('Xoá'));
    expect(input()).toHaveValue('ท่ี');
    input().setSelectionRange(0, 3);
    await userEvent.click(key('Xoá'));
    expect(input()).toHaveValue('');
    await userEvent.click(key('Xoá'));
    expect(input()).toHaveValue('');
  });

  it('phím vật lý ra chữ Latin → map Kedmanee (kể cả Shift / Caps Lock)', () => {
    render(<Field />);
    fireEvent.keyDown(input(), { key: 'd', code: 'KeyD' });
    fireEvent.keyDown(input(), { key: 'U', code: 'KeyU', shiftKey: true });
    fireEvent.keyDown(input(), { key: 'S', code: 'KeyS', modifierCapsLock: true });
    expect(input()).toHaveValue('ก๊ฆ');
  });

  it('bàn phím Thái của hệ điều hành, IME, phím tắt, phím ngoài bảng → để trình duyệt xử lý', () => {
    render(<Field />);
    const passes = [
      { key: 'ก', code: 'KeyD' },
      { key: 'd', code: 'KeyD', isComposing: true },
      { key: 'c', code: 'KeyC', ctrlKey: true },
      { key: ' ', code: 'Space' },
      { key: '+', code: 'NumpadAdd' },
    ];
    for (const init of passes) expect(fireEvent.keyDown(input(), init)).toBe(true);
    expect(input()).toHaveValue('');
    // Gõ thẳng (onChange) vẫn nhận.
    fireEvent.change(input(), { target: { value: 'สวัสดี' } });
    expect(input()).toHaveValue('สวัสดี');
  });

  it('Enter → onSubmit', () => {
    const onSubmit = vi.fn();
    render(<Field onSubmit={onSubmit} />);
    fireEvent.keyDown(input(), { key: 'Enter', code: 'Enter' });
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('nút ẩn/hiện bàn phím ảo', async () => {
    render(<Field />);
    const toggle = screen.getByTestId('toggle-keyboard');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-controls', keyboard().id);
    await userEvent.click(toggle);
    expect(screen.queryByTestId('thai-keyboard')).toBeNull();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAccessibleName('Hiện bàn phím ảo');
  });
});
