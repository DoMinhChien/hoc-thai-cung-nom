/** Component tương tác dùng chung cho Trò chơi (M7.5) và Bài tập (M9). */
export { ChoiceButton, type ChoiceStatus } from './ChoiceButton';
export { CountIn } from './CountIn';
export { FeedbackBar } from './FeedbackBar';
export {
  FEEDBACK_SOUND_KEY,
  useFeedbackSound,
  webAudioTone,
  type FeedbackSound,
  type TonePlayer,
} from './feedback-sound';
export { formatClock, itemKey, langOf } from './format';
export { GameTopBar, PausedOverlay, TimeBar } from './GameTopBar';
export { useCountdown, useKeyShortcut, useReducedMotion, type Countdown } from './hooks';
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
