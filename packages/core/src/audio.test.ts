import { describe, expect, it } from 'vitest';
import { MockAudioProvider } from './audio';

describe('MockAudioProvider', () => {
  it('ghi lại các lần speak và playById', async () => {
    const audio = new MockAudioProvider();
    await audio.speak('กา');
    await audio.speak('ขา', { rate: 0.8 });
    await audio.playById('consonant-ko-kai');

    expect(audio.spokenTexts).toEqual(['กา', 'ขา']);
    expect(audio.calls).toEqual([
      { kind: 'speak', text: 'กา' },
      { kind: 'speak', text: 'ขา', opts: { rate: 0.8 } },
      { kind: 'playById', id: 'consonant-ko-kai' },
    ]);
  });

  it('reset xóa lịch sử', async () => {
    const audio = new MockAudioProvider();
    await audio.speak('กา');
    audio.reset();
    expect(audio.calls).toEqual([]);
  });
});
