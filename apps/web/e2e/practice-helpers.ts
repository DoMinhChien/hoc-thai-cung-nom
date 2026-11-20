import { expect, type Locator, type Page } from '@playwright/test';

/** Phần bundle (`unit-<id>.json`) mà bộ giải cần. */
export interface Bundle {
  words: { thai: string; meaning_vi: string[]; classifier?: string; lesson_id: string }[];
  sentences: { id: string; vi: string; th?: string; tokens: string[]; lesson_id: string }[];
  dialogues: { lines: { th: string }[] }[];
}

export async function loadBundle(page: Page, unitId: string): Promise<Bundle> {
  return (await (await page.request.get(`/content/unit-${unitId}.json`)).json()) as Bundle;
}

/**
 * Ghi lại chữ được đọc bằng Web Speech (E-08 chỉ nghe) vào `window.__spoken`. Gọi trước `goto`.
 * Máy không có giọng Thái → app tự bỏ E-08 (SCR-06), bộ giải không cần.
 */
export async function recordSpeech(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __spoken: string[] };
    w.__spoken = [];
    const synth = window.speechSynthesis;
    if (!synth) return;
    const speak = synth.speak.bind(synth);
    synth.speak = (u: SpeechSynthesisUtterance) => {
      w.__spoken.push(u.text);
      speak(u);
    };
  });
}

/**
 * Ghi lại tần số mọi nốt âm phản hồi (Web Audio) vào `window.__tones` (Hz, làm tròn).
 * Gọi trước `goto`. Nốt đầu: đúng 784, sai 392, hoàn thành 523 (`FEEDBACK_NOTES`).
 */
export async function recordTones(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __tones: number[] };
    w.__tones = [];
    const Ctor = window.AudioContext;
    if (!Ctor) return;
    const create = Ctor.prototype.createOscillator;
    Ctor.prototype.createOscillator = function (this: AudioContext) {
      const osc = create.call(this);
      const start = osc.start.bind(osc);
      osc.start = (when?: number) => {
        w.__tones.push(Math.round(osc.frequency.value));
        start(when);
      };
      return osc;
    };
  });
}

/** Tần số các nốt đã phát từ lần `clearTones` trước. */
export async function tones(page: Page): Promise<number[]> {
  return page.evaluate(() => [...(window as unknown as { __tones: number[] }).__tones]);
}

export async function clearTones(page: Page) {
  await page.evaluate(() => (window as unknown as { __tones: number[] }).__tones.splice(0));
}

/** Playwright WebKit trên Windows không có Web Audio → app im lặng, bỏ qua kiểm tra âm. */
export async function hasWebAudio(page: Page): Promise<boolean> {
  return page.evaluate(() => 'AudioContext' in window);
}

/** Mọi bản ghi của một store IndexedDB (DB phải đã có). */
export async function readStore<T>(page: Page, dbName: string, store: string): Promise<T[]> {
  return page.evaluate(
    async ({ dbName, store }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(dbName);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const rows = await new Promise<unknown[]>((resolve, reject) => {
        const req = db.transaction(store).objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return rows;
    },
    { dbName, store },
  ) as Promise<T[]>;
}

const stripKey = (text: string | null) => (text ?? '').replace(/^\d/, '');

/** Bấm lựa chọn có nội dung là một trong `texts` (nội dung thật có từ cùng nghĩa / cùng chữ). */
async function clickByText(group: Locator, ...texts: string[]) {
  const buttons = group.getByRole('button');
  const shown = (await buttons.allTextContents()).map(stripKey);
  const i = shown.findIndex((t) => texts.includes(t));
  expect(i, `không có [${texts.join(' | ')}] trong [${shown.join(' | ')}]`).toBeGreaterThanOrEqual(
    0,
  );
  await buttons.nth(i).click();
}

/** Trả lời ĐÚNG câu hỏi Bài tập đang hiện (đáp án đọc từ bundle) — mọi loại E-01..E-09, E-14. */
export async function answerQuestion(page: Page, bundles: readonly Bundle[]) {
  const words = bundles.flatMap((b) => b.words);
  const sentences = bundles.flatMap((b) => b.sentences.filter((s) => s.th !== undefined));
  const meaning = (w: Bundle['words'][number]) => w.meaning_vi.join('; ');
  const qa = new Map(
    bundles.flatMap((b) =>
      b.dialogues.flatMap((d) => d.lines.slice(0, -1).map((l, i) => [l.th, d.lines[i + 1]!.th])),
    ),
  );
  const question = page.getByTestId('question');
  await expect(question).toBeVisible();
  const type = (await question.getAttribute('data-type'))!;
  const text = async (id: string) => {
    const el = question.getByTestId(id);
    return (await el.count()) ? ((await el.textContent()) ?? '') : '';
  };
  const options = page.getByTestId('question-options');
  const arrange = async (tokens: readonly string[]) => {
    for (const token of tokens) await clickByText(page.getByTestId('token-bank'), token);
    await page.getByTestId('question-check').click();
  };
  const type_ = async (value: string) => {
    await question.getByRole('textbox').fill(value);
    await page.getByTestId('question-check').click();
  };
  const th = await text('question-th');
  const vi = await text('question-vi');

  switch (type) {
    case 'E-01':
      return clickByText(options, ...words.filter((w) => w.thai === th).map(meaning));
    case 'E-02':
      return clickByText(options, ...words.filter((w) => meaning(w) === vi).map((w) => w.thai));
    case 'E-05':
      return clickByText(options, ...sentences.filter((s) => s.th === th).map((s) => s.vi));
    case 'E-14': {
      const classifier = words.find((w) => w.thai === th.split(' ')[0])!.classifier!;
      return (await question.getByRole('textbox').count())
        ? type_(classifier)
        : clickByText(options, classifier);
    }
    case 'E-04': {
      for (const s of sentences) {
        const i = s.tokens.findIndex(
          (_, j) => s.tokens.map((t, k) => (k === j ? '____' : t)).join('') === th,
        );
        if (i >= 0) return clickByText(options, s.tokens[i]!);
      }
      throw new Error(`E-04: không tìm thấy câu cho ${th}`);
    }
    case 'E-06':
      return arrange(sentences.find((s) => s.vi === vi)!.tokens);
    case 'E-07':
      return type_(sentences.find((s) => s.vi === vi)!.th!);
    case 'E-08': {
      const spoken = await page.evaluate(() =>
        (window as unknown as { __spoken: string[] }).__spoken.at(-1)!,
      );
      const s = sentences.find((x) => x.th === spoken)!;
      return (await options.count()) ? clickByText(options, s.vi) : arrange(s.tokens);
    }
    case 'E-03':
    case 'E-09': {
      const lefts = question.getByTestId('match-left');
      for (let i = 0; i < (await lefts.count()); i++) {
        const left = (await lefts.nth(i).textContent())!;
        const right =
          type === 'E-03' ? words.filter((w) => w.thai === left).map(meaning) : [qa.get(left)!];
        await lefts.nth(i).click();
        const rights = question.getByTestId('match-right');
        const texts = await rights.allTextContents();
        await rights.nth(texts.findIndex((r) => right.includes(r))).click();
      }
      return;
    }
    default:
      throw new Error(`Loại câu hỏi chưa hỗ trợ: ${type}`);
  }
}

/** Trả lời đúng tới khi thấy `done` (màn kết quả / hoàn thành bài). */
export async function answerAll(page: Page, bundles: readonly Bundle[], done: Locator) {
  while (!(await done.isVisible())) {
    await answerQuestion(page, bundles);
    await expect(page.getByTestId('feedback-bar')).toHaveAttribute('data-correct', 'true');
    await page.getByTestId('practice-next').click();
    // Câu cuối: câu cũ còn hiện (đã khóa) tới khi ghi xong → chờ màn kết quả hoặc câu mới chưa trả lời.
    await expect
      .poll(
        async () =>
          (await done.isVisible()) ||
          ((await page.getByTestId('question').isVisible()) &&
            !(await page.getByTestId('feedback-bar').isVisible())),
      )
      .toBe(true);
  }
}
