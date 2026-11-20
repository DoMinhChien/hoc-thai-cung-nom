import { describe, expect, it } from 'vitest';
import { MockAudioProvider, rankThaiVoices, voiceQuality } from './audio';

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

  it('voiceStatus mặc định available, đổi được để test UI hướng dẫn cài giọng', async () => {
    expect(await new MockAudioProvider().voiceStatus()).toBe('available');
    const audio = new MockAudioProvider('missing');
    expect(await audio.voiceStatus()).toBe('missing');
  });
});

describe('rankThaiVoices', () => {
  const v = (name: string) => ({ name, lang: 'th-TH' });

  it('Natural (nữ trước) → Google → giọng nữ → còn lại; cùng hạng giữ thứ tự máy', () => {
    const voices = [
      v('Microsoft Pattara - Thai (Thailand)'),
      v('Kanya'),
      v('Google ไทย'),
      v('Microsoft Niwat Online (Natural) - Thai (Thailand)'),
      v('Microsoft Premwadee Online (Natural) - Thai (Thailand)'),
      v('Other voice'),
    ];
    expect(rankThaiVoices(voices).map((x) => x.name)).toEqual([
      'Microsoft Premwadee Online (Natural) - Thai (Thailand)',
      'Microsoft Niwat Online (Natural) - Thai (Thailand)',
      'Google ไทย',
      'Kanya',
      'Microsoft Pattara - Thai (Thailand)',
      'Other voice',
    ]);
    expect(rankThaiVoices([])).toEqual([]);
  });

  it('voiceQuality', () => {
    expect(voiceQuality('th-TH-PremwadeeNeural')).toBe('natural');
    expect(voiceQuality('Google ไทย')).toBe('google');
    expect(voiceQuality('Microsoft Pattara')).toBe('system');
  });

  it('MockAudioProvider.thaiVoices trả danh sách đã xếp hạng', async () => {
    const audio = new MockAudioProvider('available', [v('Kanya'), v('Google ไทย')]);
    expect((await audio.thaiVoices()).map((x) => x.name)).toEqual(['Google ไทย', 'Kanya']);
    expect(await new MockAudioProvider().thaiVoices()).toEqual([]);
  });
});
