/** Component tương tác dùng chung cho Trò chơi (M7.5) và Bài tập (M9). */
export { ChoiceButton, type ChoiceStatus } from './ChoiceButton';
export { CountIn } from './CountIn';
export { FeedbackBar } from './FeedbackBar';
export {
  DEFAULT_FEEDBACK_VOLUME,
  FEEDBACK_NOTES,
  FEEDBACK_SOUND_KEY,
  FEEDBACK_SPEECH_DELAY_MS,
  FEEDBACK_VOLUME_KEY,
  useCompletionSound,
  useFeedbackSound,
  webAudioTone,
  type FeedbackSound,
  type FeedbackSoundKind,
  type TonePlayer,
} from './feedback-sound';
export { formatClock, itemKey, langOf } from './format';
export {
  DEFAULT_GAME_THEME,
  GAME_THEME_KEY,
  GAME_THEMES,
  useGameTheme,
  type GameTheme,
  type GameThemeSetting,
} from './game-theme';
export { GameTopBar, PausedOverlay, TimeBar } from './GameTopBar';
export {
  MAX_FRAME_MS,
  useCountdown,
  useGameLoop,
  useKeyShortcut,
  useReducedMotion,
  type Countdown,
  type FrameScheduler,
  type GameLoop,
} from './hooks';
export {
  GAME_MUSIC_KEY,
  MUSIC_LOOPS,
  MUSIC_VOLUME_RATIO,
  useBackgroundMusic,
  webAudioMusic,
  type BackgroundMusic,
  type MusicPlayer,
} from './music';
export { TokenBank, TokenChip } from './TokenBank';
export { ReviewList } from './ReviewList';
export {
  AUTO_SPEAK_KEY,
  useAutoSpeech,
  useFeedbackPause,
  useSpeakOnCue,
  type AutoSpeech,
} from './speech';
export { UrgencyCard } from './UrgencyCard';
