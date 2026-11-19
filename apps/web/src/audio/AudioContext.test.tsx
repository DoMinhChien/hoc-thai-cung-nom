import { MockAudioProvider } from '@nom/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AudioProviderBoundary } from './AudioContext';
import { useAudio } from './useAudio';
import { useVoiceStatus } from './useVoiceStatus';

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

function VoiceStatusProbe() {
  return <p data-testid="voice">{useVoiceStatus()}</p>;
}

describe('useVoiceStatus', () => {
  it('checking → trạng thái giọng Thái của provider', async () => {
    render(
      <AudioProviderBoundary provider={new MockAudioProvider('missing')}>
        <VoiceStatusProbe />
      </AudioProviderBoundary>,
    );
    expect(screen.getByTestId('voice')).toHaveTextContent('checking');
    expect(await screen.findByText('missing')).toBeInTheDocument();
  });

  it('provider không có voiceStatus → available', async () => {
    render(
      <AudioProviderBoundary provider={{ speak: async () => {} }}>
        <VoiceStatusProbe />
      </AudioProviderBoundary>,
    );
    expect(await screen.findByText('available')).toBeInTheDocument();
  });
});
