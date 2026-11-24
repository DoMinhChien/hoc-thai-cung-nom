/**
 * Nhận dạng giọng nói của trình duyệt (SCR-10 Mức 2): `SpeechRecognition` / `webkitSpeechRecognition`,
 * `th-TH`. Chỉ cho biết máy nghe ra chữ gì — không chấm thanh điệu. Không có → bỏ qua, không báo lỗi.
 */

/** Phần API dùng tới (TS DOM chưa có kiểu cho Web Speech recognition). */
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionEvent {
  results: ArrayLike<ArrayLike<RecognitionAlternative>>;
}
export interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

export function recognitionCtor(): RecognitionCtor | undefined {
  const w = globalThis as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const recognitionSupported = () => recognitionCtor() !== undefined;

export interface RecognitionSession {
  /**
   * Các cách nghe (≤ 3); rỗng khi không nghe ra chữ nào. `null` khi nhận dạng lỗi — vd. thiết bị không
   * cho chạy song song với ghi âm (một số bản iOS): ưu tiên ghi âm, bỏ nhận dạng lần đó (§4).
   */
  result: Promise<string[] | null>;
  stop(): void;
}

/** Bắt đầu nghe một lượt; `stop()` khi người học dừng ghi âm. */
export function startRecognition(): RecognitionSession | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  let rec: SpeechRecognitionLike;
  try {
    rec = new Ctor();
  } catch {
    return null;
  }
  rec.lang = 'th-TH';
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  rec.continuous = false;
  const result = new Promise<string[] | null>((resolve) => {
    let heard: string[] = [];
    rec.onresult = (e) => {
      const first = e.results[0];
      if (!first) return;
      heard = Array.from({ length: first.length }, (_, i) => first[i]!.transcript).filter(Boolean);
    };
    rec.onerror = (e) => resolve(e.error === 'no-speech' ? [] : null);
    rec.onend = () => resolve(heard);
    try {
      rec.start();
    } catch {
      resolve(null);
    }
  });
  return {
    result,
    stop() {
      try {
        rec.stop();
      } catch {
        // đã dừng
      }
    },
  };
}
