import { describe, expect, it } from 'vitest';
import type { LessonStep } from '../content/bundle';
import type { CanDoRecord, LessonProgressRecord } from '../data/records';
import {
  canDoChecklist,
  continueTarget,
  isLessonComplete,
  lessonStatus,
  resumeStep,
  unitLessonProgress,
  unitStatus,
} from './lessons';

const TS = '2026-03-01T08:00:00.000Z';
const lessons = [
  { lesson_id: 'l1', steps: ['vocab', 'exercise'] as LessonStep[] },
  { lesson_id: 'l2', steps: ['grammar', 'vocab'] as LessonStep[] },
];
const record = (
  lessonId: string,
  patch: Partial<LessonProgressRecord> = {},
): LessonProgressRecord => ({
  id: lessonId,
  lessonId,
  unitId: 'u01',
  stepsDone: [],
  bestScore: null,
  completedAt: null,
  updatedAt: TS,
  ...patch,
});
const done = (lessonId: string, stepsDone: LessonStep[]) =>
  record(lessonId, { stepsDone, completedAt: TS });

describe('tiến độ bài học (plan 0.4)', () => {
  it('isLessonComplete: đủ mọi bước; bài không có bước thì không bao giờ xong', () => {
    expect(isLessonComplete(['vocab', 'exercise'], { stepsDone: ['exercise', 'vocab'] })).toBe(
      true,
    );
    expect(isLessonComplete(['vocab', 'exercise'], { stepsDone: ['vocab'] })).toBe(false);
    expect(isLessonComplete(['vocab'], undefined)).toBe(false);
    expect(isLessonComplete([], { stepsDone: [] })).toBe(false);
  });

  it('lessonStatus: chưa học / đang học (bước hoặc điểm) / xong; completedAt giữ xong khi bài thêm bước', () => {
    const l1 = lessons[0]!;
    expect(lessonStatus(l1, undefined)).toBe('not-started');
    expect(lessonStatus(l1, record('l1'))).toBe('not-started');
    expect(lessonStatus(l1, record('l1', { stepsDone: ['vocab'] }))).toBe('in-progress');
    expect(lessonStatus(l1, record('l1', { bestScore: 0.5 }))).toBe('in-progress');
    expect(lessonStatus(l1, record('l1', { stepsDone: ['vocab', 'exercise'] }))).toBe('completed');
    expect(
      lessonStatus({ ...l1, steps: [...l1.steps, 'dialogue'] }, done('l1', ['vocab', 'exercise'])),
    ).toBe('completed');
  });

  it('unitStatus (P-10) + unitLessonProgress (P-04)', () => {
    expect(unitStatus(lessons, [])).toBe('not-started');
    expect(unitLessonProgress(lessons, [])).toEqual({ completed: 0, total: 2, percent: 0 });

    const half = [done('l1', ['vocab', 'exercise']), record('l2')];
    expect(unitStatus(lessons, half)).toBe('in-progress');
    expect(unitLessonProgress(lessons, half)).toEqual({ completed: 1, total: 2, percent: 50 });

    const all = [...half.slice(0, 1), done('l2', ['grammar', 'vocab'])];
    expect(unitStatus(lessons, all)).toBe('completed');
    expect(unitLessonProgress(lessons, all).percent).toBe(100);

    expect(unitStatus([], [])).toBe('not-started');
    expect(unitLessonProgress([], []).percent).toBe(0);
    // Bản ghi của bài không còn trong content (bị bỏ) không tính.
    expect(unitStatus(lessons.slice(0, 1), [record('khac', { stepsDone: ['vocab'] })])).toBe(
      'not-started',
    );
  });

  it('canDoChecklist (P-11): tick tay; unit xong → tự tick hết', () => {
    const unit = { can_do: ['Chào hỏi', 'Giới thiệu tên'], lessons };
    const ticks: CanDoRecord[] = [
      { id: 'c1', unitId: 'u01', canDo: 'Giới thiệu tên', checked: true, updatedAt: TS },
      { id: 'c2', unitId: 'u01', canDo: 'Chào hỏi', checked: false, updatedAt: TS },
    ];
    expect(canDoChecklist(unit, [], ticks)).toEqual([
      { canDo: 'Chào hỏi', checked: false, auto: false },
      { canDo: 'Giới thiệu tên', checked: true, auto: false },
    ]);
    const finished = [done('l1', ['vocab', 'exercise']), done('l2', ['grammar', 'vocab'])];
    expect(canDoChecklist(unit, finished, ticks).every((i) => i.checked && i.auto)).toBe(true);
  });
});

describe('Học tiếp (SCR-04 §A)', () => {
  const units = [
    { unit_id: 'u01', lessons },
    { unit_id: 'u02', lessons: [{ lesson_id: 'l3', steps: ['vocab'] as LessonStep[] }] },
  ];

  it('resumeStep: bước chưa xong đầu tiên; xong hết / chưa có bước', () => {
    expect(resumeStep(['vocab', 'exercise'], undefined)).toBe('vocab');
    expect(resumeStep(['vocab', 'exercise'], { stepsDone: ['vocab'] })).toBe('exercise');
    expect(resumeStep(['vocab'], { stepsDone: ['vocab'] })).toBe('vocab');
    expect(resumeStep([], undefined)).toBeUndefined();
  });

  it('chưa học → start bài đầu; đang dở → bài cập nhật gần nhất; xong bài → next; xong hết → done', () => {
    expect(continueTarget([], [])).toBeNull();
    expect(continueTarget(units, [])).toEqual({ kind: 'start', unitId: 'u01', lessonId: 'l1' });
    const older = record('l1', { stepsDone: ['vocab'], updatedAt: '2026-03-01T08:00:00.000Z' });
    const newer = record('l3', {
      stepsDone: [],
      bestScore: 0.5,
      updatedAt: '2026-03-02T08:00:00.000Z',
    });
    expect(continueTarget(units, [older, newer])).toEqual({
      kind: 'continue',
      unitId: 'u02',
      lessonId: 'l3',
    });
    expect(continueTarget(units, [done('l1', ['vocab', 'exercise'])])).toEqual({
      kind: 'next',
      unitId: 'u01',
      lessonId: 'l2',
    });
    const all = [
      done('l1', ['vocab', 'exercise']),
      done('l2', ['grammar', 'vocab']),
      done('l3', ['vocab']),
    ];
    expect(continueTarget(units, all)).toEqual({ kind: 'done', unitId: 'u01', lessonId: 'l1' });
  });
});
