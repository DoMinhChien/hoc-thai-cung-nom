import {
  DEFAULT_PRACTICE_SESSION_SIZE,
  PRACTICE_SESSION_SIZE_KEY,
  voiceQuality,
  type VoiceInfo,
} from '@nom/core';
import { Play, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useAudio } from '@/audio/useAudio';
import { useVoiceStatus } from '@/audio/useVoiceStatus';
import {
  AUTO_VOICE,
  SPEECH_RATE_MAX,
  SPEECH_RATE_MIN,
  SPEECH_SAMPLE,
  useVoicePreferences,
} from '@/audio/voice-preferences';
import { DEFAULT_SPEECH_RATE } from '@/audio/web-speech-provider';
import { useFeedbackSound, webAudioTone, type FeedbackSoundKind } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRepositories, useRepositoryQuery } from '@/data';
import { SHOW_PHONETIC_KEY, useShowPhonetic } from '@/data/preferences';
import { t } from '@/i18n';
import { DataSettings } from './DataSettings';
import { Card } from './SettingsCard';

const rateFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

const field =
  'h-10 rounded-md border border-border-strong bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
const range = 'w-full max-w-xs accent-primary';

/**
 * Cài đặt (M9.5 T9.5.1–T9.5.2, plan 0.13 — owner cho agent làm khi chưa có SCR): âm phản hồi
 * (bật/tắt, âm lượng, nghe thử) và giọng đọc (chọn giọng Thái, tốc độ, nghe thử). Phần còn lại ở M12.
 */
export function SettingsPage() {
  return (
    <section data-testid="page-settings" className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tablet:text-[28px] lg:text-4xl">{t('pages.settings')}</h1>
        <p className="text-muted-foreground">{t('settings.intro')}</p>
      </header>
      <SoundSettings />
      <VoiceSettings />
      <PracticeSettings />
      <DisplaySettings />
      <DataSettings />
      <p className="text-sm text-muted-foreground">{t('settings.later')}</p>
    </section>
  );
}

function SoundSettings() {
  const sound = useFeedbackSound();
  const volumeId = useId();
  // Cập nhật ngay khi kéo (ghi cài đặt là bất đồng bộ).
  const [volume, setVolume] = useState<number>();
  const [enabled, setEnabled] = useState<boolean>();
  if (sound.enabled === undefined || sound.volume === undefined) {
    return <Skeleton className="h-40" role="status" aria-label={t('settings.soundTitle')} />;
  }
  const currentVolume = volume ?? sound.volume;
  const currentEnabled = enabled ?? sound.enabled;
  const percent = Math.round(currentVolume * 100);
  const test = (kind: FeedbackSoundKind) => webAudioTone(kind, currentVolume);

  return (
    <Card title={t('settings.soundTitle')} testId="settings-sound">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          data-testid="settings-sound-enabled"
          checked={currentEnabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            void sound.setEnabled(e.target.checked);
          }}
          className="size-4 accent-primary"
        />
        {t('settings.soundEnabled')}
      </label>
      <div className="flex flex-col gap-2">
        <label htmlFor={volumeId} className="text-sm text-muted-foreground">
          {t('settings.volume')}
        </label>
        <div className="flex items-center gap-3">
          <input
            id={volumeId}
            type="range"
            data-testid="settings-volume"
            min={0}
            max={100}
            step={5}
            value={percent}
            disabled={!currentEnabled}
            aria-valuetext={t('settings.percent', { n: percent })}
            onChange={(e) => {
              const value = Number(e.target.value) / 100;
              setVolume(value);
              void sound.setVolume(value);
            }}
            className={range}
          />
          <span className="w-12 text-sm tabular-nums">{t('settings.percent', { n: percent })}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          data-testid="settings-test-correct"
          disabled={!currentEnabled || percent === 0}
          onClick={() => test('correct')}
        >
          <Play aria-hidden />
          {t('settings.testCorrect')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          data-testid="settings-test-wrong"
          disabled={!currentEnabled || percent === 0}
          onClick={() => test('wrong')}
        >
          <Play aria-hidden />
          {t('settings.testWrong')}
        </Button>
      </div>
    </Card>
  );
}

function VoiceSettings() {
  const audio = useAudio();
  const status = useVoiceStatus();
  const prefs = useVoicePreferences();
  const voiceId = useId();
  const rateId = useId();
  const [voices, setVoices] = useState<VoiceInfo[]>();
  const [voice, setVoice] = useState<string>();
  const [rate, setRate] = useState<number>();

  useEffect(() => {
    let active = true;
    void (audio.thaiVoices?.() ?? Promise.resolve([])).then((list) => {
      if (active) setVoices(list);
    });
    return () => {
      active = false;
    };
  }, [audio]);

  if (voices === undefined || prefs.voice === undefined || prefs.rate === undefined) {
    return <Skeleton className="h-48" role="status" aria-label={t('settings.voiceTitle')} />;
  }
  const noVoice = status === 'missing' || status === 'unsupported' || voices.length === 0;
  const currentVoice = voice ?? (voices.some((v) => v.name === prefs.voice) ? prefs.voice : '');
  const currentRate = rate ?? prefs.rate ?? DEFAULT_SPEECH_RATE;
  const onlySystem = !noVoice && voices.every((v) => voiceQuality(v.name) === 'system');
  const label = (v: VoiceInfo) =>
    voiceQuality(v.name) === 'natural' ? t('settings.natural', { name: v.name }) : v.name;

  return (
    <Card title={t('settings.voiceTitle')} testId="settings-voice">
      {noVoice ? (
        <p
          role="status"
          className="flex items-center gap-3 rounded-lg bg-caution-subtle px-4 py-2 text-sm"
        >
          <TriangleAlert className="size-4 shrink-0 text-caution" aria-hidden />
          <span>
            {t('lesson.noVoice')} {t('lesson.howToBody')}
          </span>
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor={voiceId} className="text-sm text-muted-foreground">
              {t('settings.voice')}
            </label>
            <select
              id={voiceId}
              data-testid="settings-voice-select"
              value={currentVoice}
              onChange={(e) => {
                setVoice(e.target.value);
                void prefs.setVoice(e.target.value);
              }}
              className={field}
            >
              <option value={AUTO_VOICE}>
                {voices[0]
                  ? t('settings.autoVoice', { name: voices[0].name })
                  : t('settings.autoVoiceNone')}
              </option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {label(v)}
                </option>
              ))}
            </select>
          </div>
          {onlySystem && (
            <p data-testid="settings-edge-hint" className="text-sm text-muted-foreground">
              {t('settings.edgeHint')}
            </p>
          )}
        </>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor={rateId} className="text-sm text-muted-foreground">
          {t('settings.rate')}
        </label>
        <div className="flex items-center gap-3">
          <input
            id={rateId}
            type="range"
            data-testid="settings-rate"
            min={SPEECH_RATE_MIN}
            max={SPEECH_RATE_MAX}
            step={0.05}
            value={currentRate}
            aria-valuetext={t('settings.rateValue', { n: rateFormat.format(currentRate) })}
            onChange={(e) => {
              const value = Number(e.target.value);
              setRate(value);
              void prefs.setRate(value);
            }}
            className={range}
          />
          <span className="w-12 text-sm tabular-nums">
            {t('settings.rateValue', { n: rateFormat.format(currentRate) })}
          </span>
        </div>
      </div>
      <div>
        <Button
          variant="outline"
          size="sm"
          data-testid="settings-voice-test"
          disabled={noVoice}
          onClick={() =>
            void audio
              .speak(SPEECH_SAMPLE, {
                ...(currentVoice ? { voice: currentVoice } : {}),
                rate: currentRate,
              })
              .catch(() => {})
          }
        >
          <Play aria-hidden />
          {t('settings.test')} <span lang="th">{SPEECH_SAMPLE}</span>
        </Button>
      </div>
    </Card>
  );
}

/** Lựa chọn số câu mỗi phiên = mục tiêu ngày (SCR-03 §B, M10). */
const SESSION_SIZES = [10, 20, 30, 50] as const;

/** Bài tập: số câu mỗi phiên, cũng là mục tiêu ngày ở Tổng quan / Bài tập (SCR-03 Q3 a). */
function PracticeSettings() {
  const repos = useRepositories();
  const id = useId();
  const size = useRepositoryQuery(
    (r) => r.settings.get(PRACTICE_SESSION_SIZE_KEY, DEFAULT_PRACTICE_SESSION_SIZE),
    [],
  );
  if (size === undefined) {
    return <Skeleton className="h-28" role="status" aria-label={t('settings.practiceTitle')} />;
  }
  return (
    <Card title={t('settings.practiceTitle')} testId="settings-practice" id="bai-tap">
      <label htmlFor={id} className="text-sm font-medium">
        {t('settings.sessionSize')}
      </label>
      <select
        id={id}
        data-testid="settings-session-size"
        value={size}
        onChange={(e) =>
          void repos?.settings.set(PRACTICE_SESSION_SIZE_KEY, Number(e.target.value))
        }
        className={`${field} w-40`}
      >
        {SESSION_SIZES.map((n) => (
          <option key={n} value={n}>
            {t('settings.sessionSizeOption', { n })}
          </option>
        ))}
      </select>
      <p className="text-sm text-muted-foreground">{t('settings.sessionSizeHint')}</p>
    </Card>
  );
}

/** Hiển thị (G-01): phiên âm Latin — mặc định ẩn (plan 0.2), bật/tắt riêng từng thẻ bằng `P`. */
function DisplaySettings() {
  const repos = useRepositories();
  const show = useShowPhonetic();
  if (show === undefined) {
    return <Skeleton className="h-24" role="status" aria-label={t('settings.displayTitle')} />;
  }
  return (
    <Card title={t('settings.displayTitle')} testId="settings-display">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          data-testid="settings-phonetic"
          checked={show}
          onChange={(e) => void repos?.settings.set(SHOW_PHONETIC_KEY, e.target.checked)}
          className="size-4 accent-primary"
        />
        {t('settings.phonetic')}
      </label>
      <p className="text-sm text-muted-foreground">{t('settings.phoneticHint')}</p>
    </Card>
  );
}
