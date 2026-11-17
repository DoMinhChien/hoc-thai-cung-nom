/**
 * Kiểm tra chéo sau khi loader đã parse schema (plan 0.9, 5.6 — ROADMAP T6.4):
 * id duy nhất theo loại, khóa ngoại giữa unit/lesson/word/sentence/grammar/dialogue,
 * `tokens` ghép lại = `th`, `distractors` không trùng `tokens`, `th_alt` khác `th`,
 * ký tự ngoài bảng Thái ở trường Thái. Cảnh báo cấu trúc bài học (plan 0.4) và mục `draft: true`.
 */
import { normalizeThai } from '@nom/core';
import {
  ID_FIELD,
  idOf,
  type ContentIssue, type ContentKind, type ContentSet, type Located } from './load';

/** Tên hiển thị khi báo lỗi theo loại. */
const KIND_LABEL: Record<ContentKind, string> = {
  units: 'unit',
  lessons: 'bài',
  words: 'từ',
  sentences: 'câu',
  grammar: 'mẫu câu',
  dialogues: 'hội thoại',
};

/** Khoảng khuyến nghị của plan 0.4 (ngoài khoảng → cảnh báo). */
export const RANGES = {
  wordsPerLesson: [8, 12],
  lessonsPerUnit: [3, 4],
  linesPerDialogue: [4, 8],
} as const;

export function checkContent(content: ContentSet): ContentIssue[] {
  return [
    ...checkUniqueIds(content),
    ...checkReferences(content),
    ...checkSentences(content),
    ...checkThaiCharacters(content),
    ...checkLessonShape(content),
    ...checkDrafts(content),
  ];
}

const issueAt =
  (severity: ContentIssue['severity']) =>
  (item: Located<unknown>, field: string | undefined, message: string): ContentIssue => ({
    severity,
    file: item.file,
    line: item.line,
    field,
    message,
  });
const error = issueAt('error');
const warning = issueAt('warning');

const KINDS = Object.keys(KIND_LABEL) as ContentKind[];

function checkUniqueIds(content: ContentSet): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const kind of KINDS) {
    const seen = new Map<string, Located<unknown>>();
    for (const item of content[kind] as Located<never>[]) {
      const id = idOf(kind, item.value);
      const first = seen.get(id);
      if (first) {
        issues.push(
          error(
            item,
            ID_FIELD[kind],
            `id "${id}" trùng với ${KIND_LABEL[kind]} ở ${first.file}:${first.line}`,
          ),
        );
      } else {
        seen.set(id, item);
      }
    }
  }
  return issues;
}

function checkReferences(content: ContentSet): ContentIssue[] {
  const units = new Set(content.units.map((u) => u.value.unit_id));
  const lessonUnit = new Map(content.lessons.map((l) => [l.value.lesson_id, l.value.unit_id]));
  const grammar = new Set(content.grammar.map((g) => g.value.id));
  const issues: ContentIssue[] = [];

  const unitRef = (item: Located<unknown>, unitId: string) => {
    if (!units.has(unitId)) {
      issues.push(error(item, 'unit_id', `unit "${unitId}" không có trong units.csv`));
    }
  };
  /** Bài phải tồn tại và thuộc đúng unit của mục. */
  const lessonRef = (item: Located<unknown>, lessonId: string, unitId?: string) => {
    const owner = lessonUnit.get(lessonId);
    if (owner === undefined) {
      issues.push(error(item, 'lesson_id', `bài "${lessonId}" không có trong lessons.csv`));
    } else if (unitId !== undefined && owner !== unitId) {
      issues.push(
        error(item, 'lesson_id', `bài "${lessonId}" thuộc unit "${owner}", không phải "${unitId}"`),
      );
    }
  };
  const grammarRef = (item: Located<unknown>, field: string, id: string) => {
    if (!grammar.has(id)) {
      issues.push(error(item, field, `mẫu câu "${id}" không có trong grammar.yaml`));
    }
  };

  for (const l of content.lessons) {
    unitRef(l, l.value.unit_id);
    l.value.grammar_ids.forEach((id, i) => grammarRef(l, `grammar_ids.${i}`, id));
  }
  for (const item of [...content.words, ...content.sentences]) {
    unitRef(item, item.value.unit_id);
    lessonRef(item, item.value.lesson_id, item.value.unit_id);
  }
  for (const s of content.sentences) {
    if (s.value.grammar_id) grammarRef(s, 'grammar_id', s.value.grammar_id);
  }
  for (const g of content.grammar) unitRef(g, g.value.unit_id);
  for (const d of content.dialogues) lessonRef(d, d.value.lesson_id);
  return issues;
}

/** So sánh chữ Thái: chuẩn hóa + bỏ khoảng trắng (cùng quy tắc chấm E-07, plan 0.5). */
export const compactThai = (text: string) => normalizeThai(text).replace(/\s+/gu, '');

function checkSentences(content: ContentSet): ContentIssue[] {
  return content.sentences.flatMap((s) => {
    const { th, th_alt, tokens, distractors } = s.value;
    const issues: ContentIssue[] = [];
    const joined = tokens.join('');
    if (compactThai(joined) !== compactThai(th)) {
      issues.push(error(s, 'tokens', `tokens ghép lại là "${joined}", không khớp th "${th}"`));
    }
    const tokenSet = new Set(tokens.map(compactThai));
    distractors.forEach((d, i) => {
      if (tokenSet.has(compactThai(d))) {
        issues.push(error(s, `distractors.${i}`, `thẻ nhiễu "${d}" trùng một token của câu`));
      }
    });
    th_alt.forEach((alt, i) => {
      if (compactThai(alt) === compactThai(th)) {
        issues.push(error(s, `th_alt.${i}`, 'bản dịch chấp nhận khác trùng với th'));
      }
    });
    return issues;
  });
}

/**
 * Ngoài bảng Thai Unicode chỉ cho phép khoảng trắng, chữ số và dấu câu thường gặp;
 * chữ Latin/Việt trong trường Thái thường là nhập nhầm cột.
 */
const NON_THAI = /[^฀-๿\s0-9.,!?…"“”'()\-:;/]/gu;

/** Các trường chữ Thái của mỗi loại: [mục, tên trường, giá trị]. */
function thaiFields(content: ContentSet): [Located<unknown>, string, string][] {
  const out: [Located<unknown>, string, string][] = [];
  const add = (item: Located<unknown>, field: string, value: string | undefined) => {
    if (value !== undefined) out.push([item, field, value]);
  };
  const addList = (item: Located<unknown>, field: string, values: string[]) =>
    values.forEach((v, i) => add(item, `${field}.${i}`, v));

  for (const u of content.units) add(u, 'title_th', u.value.title_th);
  for (const w of content.words) {
    add(w, 'thai', w.value.thai);
    add(w, 'example_th', w.value.example_th);
  }
  for (const s of content.sentences) {
    add(s, 'th', s.value.th);
    addList(s, 'th_alt', s.value.th_alt);
    addList(s, 'tokens', s.value.tokens);
    addList(s, 'distractors', s.value.distractors);
  }
  for (const g of content.grammar) {
    g.value.examples.forEach((e, i) => add(g, `examples.${i}.th`, e.th));
  }
  for (const d of content.dialogues) {
    d.value.lines.forEach((l, i) => add(d, `lines.${i}.th`, l.th));
  }
  return out;
}

function checkThaiCharacters(content: ContentSet): ContentIssue[] {
  return thaiFields(content).flatMap(([item, field, value]) => {
    const bad = [...new Set(value.match(NON_THAI) ?? [])];
    if (bad.length === 0) return [];
    const shown = bad.map(
      (c) => `"${c}" (U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')})`,
    );
    return [error(item, field, `ký tự ngoài bảng chữ Thái: ${shown.join(', ')}`)];
  });
}

const outside = (n: number, [min, max]: readonly [number, number]) => n < min || n > max;

/** Plan 0.4: unit 3–4 bài, bài 8–12 từ, hội thoại 4–8 câu — chỉ cảnh báo. */
function checkLessonShape(content: ContentSet): ContentIssue[] {
  const count = (ids: string[]) => {
    const map = new Map<string, number>();
    for (const id of ids) map.set(id, (map.get(id) ?? 0) + 1);
    return map;
  };
  const lessonsPerUnit = count(content.lessons.map((l) => l.value.unit_id));
  const wordsPerLesson = count(content.words.map((w) => w.value.lesson_id));
  const issues: ContentIssue[] = [];

  for (const u of content.units) {
    const n = lessonsPerUnit.get(u.value.unit_id) ?? 0;
    if (outside(n, RANGES.lessonsPerUnit)) {
      issues.push(warning(u, undefined, `unit có ${n} bài (khuyến nghị 3–4, plan 0.4)`));
    }
  }
  for (const l of content.lessons) {
    const n = wordsPerLesson.get(l.value.lesson_id) ?? 0;
    if (outside(n, RANGES.wordsPerLesson)) {
      issues.push(warning(l, undefined, `bài có ${n} từ (khuyến nghị 8–12, plan 0.4)`));
    }
  }
  for (const d of content.dialogues) {
    const n = d.value.lines.length;
    if (outside(n, RANGES.linesPerDialogue)) {
      issues.push(warning(d, 'lines', `hội thoại có ${n} câu (khuyến nghị 4–8, plan 0.4)`));
    }
  }
  return issues;
}

/** Gộp một cảnh báo cho mỗi file để không lấn át lỗi thật. */
function checkDrafts(content: ContentSet): ContentIssue[] {
  const byFile = new Map<string, { first: Located<unknown>; count: number }>();
  for (const kind of KINDS) {
    for (const item of content[kind] as Located<{ draft: boolean }>[]) {
      if (!item.value.draft) continue;
      const entry = byFile.get(item.file);
      if (entry) entry.count += 1;
      else byFile.set(item.file, { first: item, count: 1 });
    }
  }
  return [...byFile.values()].map(({ first, count }) =>
    warning(first, undefined, `${count} mục draft: true — chưa được owner duyệt`),
  );
}
