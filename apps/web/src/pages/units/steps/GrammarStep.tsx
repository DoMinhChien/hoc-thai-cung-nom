import { useKeyShortcut } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { SpeakButton } from '../parts';
import type { StepProps } from './VocabStep';

/** Bước Mẫu câu (SCR-05): mỗi điểm ngữ pháp một khối — mẫu, giải thích, ví dụ có nút nghe. */
export function GrammarStep({ bundle, lesson, nextLabel, onDone }: StepProps) {
  const points = lesson.grammar_ids.flatMap((id) => bundle.grammar.filter((g) => g.id === id));
  useKeyShortcut('Enter', onDone);
  return (
    <div className="flex flex-col gap-10">
      {points.map((g) => (
        <section key={g.id} className="flex flex-col gap-3" data-testid="grammar-point">
          <h2 className="text-xl font-semibold">{g.title_vi}</h2>
          <p className="rounded-md bg-secondary px-4 py-3 text-2xl">
            <span lang="th">{g.pattern}</span>
          </p>
          <p>{g.explain_vi}</p>
          <ul className="flex flex-col gap-2">
            {g.examples.map((ex) => (
              <li key={ex.th} className="flex items-start gap-2">
                <SpeakButton text={ex.th} />
                <span className="flex flex-col">
                  <span lang="th" className="text-th-sm">
                    {ex.th}
                  </span>
                  <span className="text-muted-foreground">{ex.vi}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Button
        className="self-start"
        data-testid="step-next"
        aria-keyshortcuts="Enter"
        onClick={onDone}
      >
        {nextLabel} ↵
      </Button>
    </div>
  );
}
