import { MockAudioProvider } from '@nom/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AudioProviderBoundary } from './AudioContext';
import { useAudio } from './useAudio';

function SpeakButton() {
  const audio = useAudio();
  return (
    <button type="button" data-testid="speak" onClick={() => void audio.speak('กา')}>
      ▶
    </button>
  );
}

describe('AudioProviderBoundary', () => {
  it('component gọi speak qua provider được inject', async () => {
    const audio = new MockAudioProvider();
    render(
      <AudioProviderBoundary provider={audio}>
        <SpeakButton />
      </AudioProviderBoundary>,
    );
    await userEvent.click(screen.getByTestId('speak'));
    expect(audio.spokenTexts).toEqual(['กา']);
  });
});
