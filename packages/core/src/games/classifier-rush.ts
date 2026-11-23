/**
 * F-04' Đoán loại từ (SCR-08 §B, v7.2–v7.3): danh từ → chọn ลักษณนาม trong 4 nút (1 đúng + 3 loại
 * từ khác có trong nguồn). Luật "3 tim" (`rapid.ts`): 5 s/từ, sai / hết giờ mất tim.
 */
import { availability, cycle } from './game';
import { questionTimeMs, rapidGame, type RapidQuestion } from './rapid';
import { type GameSource, sourceRng } from './source';

export const CLASSIFIER_MIN_WORDS = 8;
export const CLASSIFIER_OPTIONS = 4;
const QUESTIONS = 40;

export interface ClassifierQuestion extends RapidQuestion {
  meaning: string;
  /** 2–4 loại từ đã xáo, gồm đáp án. */
  options: string[];
}

const playable = (source: GameSource) => source.words.filter((w) => w.classifier);

export const classifierRush = rapidGame<ClassifierQuestion, string>({
  id: 'classifier-rush',

  availability(source) {
    const words = playable(source);
    // Cần ≥ 2 loại từ khác nhau để có lựa chọn.
    const distinct = new Set(words.map((w) => w.classifier)).size;
    return availability('classifiers', CLASSIFIER_MIN_WORDS, distinct >= 2 ? words.length : 0);
  },

  generate(source, seed) {
    const rng = sourceRng(seed, source);
    const words = playable(source);
    const classifiers = [...new Set(words.map((w) => w.classifier!))];
    return cycle(rng, words, QUESTIONS).map((w) => {
      const others = rng
        .shuffle(classifiers.filter((c) => c !== w.classifier))
        .slice(0, CLASSIFIER_OPTIONS - 1);
      return {
        item: { itemType: 'word' as const, itemId: w.id },
        th: w.thai,
        meaning: w.meanings[0]!,
        expected: w.classifier!,
        timeMs: questionTimeMs(1),
        options: rng.shuffle([w.classifier!, ...others]),
      };
    });
  },

  isCorrect: (q, option) => option === q.expected,
  given: (_, option) => option,
});
