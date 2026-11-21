import {
  buildPracticeSession,
  PRACTICE_CARD_TYPE,
  SHORT_SESSION_SIZE,
  type ExerciseItemRef,
  type PracticeMode,
} from '@nom/core';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useVoiceStatus } from '@/audio/useVoiceStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudySession } from '@/data';
import { t } from '@/i18n';
import { PracticeResult } from './PracticeResult';
import { PracticeRunner, type PracticeSummary } from './PracticeRunner';
import { usePracticeData, type PracticeData } from './usePracticeData';

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

/** `?items=word:chue,sentence:s1` ↔ danh sách mục ("Luyện lại câu sai"). */
const encodeItems = (items: readonly ExerciseItemRef[]) =>
  items.map((i) => `${i.itemType}:${i.itemId}`).join(',');
function decodeItems(value: string): ExerciseItemRef[] {
  return value.split(',').flatMap((part) => {
    const [itemType, ...rest] = part.split(':');
    const itemId = rest.join(':');
    return (itemType === 'word' || itemType === 'sentence' || itemType === 'dialogue') && itemId
      ? [{ itemType, itemId }]
      : [];
  });
}

/** Chế độ phiên theo URL: `?unit=`, `?items=`, `?mode=mistakes|more`, mặc định "hôm nay". */
function modeOf(
  params: URLSearchParams,
  data: PracticeData,
): { mode: PracticeMode; size?: number } {
  const unit = params.get('unit');
  if (unit) return { mode: { kind: 'unit', unitId: unit } };
  const items = params.get('items');
  if (items) return { mode: { kind: 'items', items: decodeItems(items) } };
  switch (params.get('mode')) {
    case 'mistakes':
      return { mode: { kind: 'mistakes' } };
    case 'more': {
      // "Luyện thêm 10 câu": mục đã học, sắp đến hạn trước (không cần đến hạn).
      const items = data.cards
        .filter(
          (c) =>
            (c.itemType === 'word' || c.itemType === 'sentence') &&
            c.cardType === PRACTICE_CARD_TYPE[c.itemType],
        )
        .sort((a, b) => a.fsrs.due.localeCompare(b.fsrs.due))
        .map((c) => ({ itemType: c.itemType as 'word' | 'sentence', itemId: c.itemId }));
      return { mode: { kind: 'items', items }, size: SHORT_SESSION_SIZE };
    }
    default:
      return { mode: { kind: 'today' }, size: data.size };
  }
}

/**
 * `/practice/session` (SCR-06 §B–C, Focus layout): phiên Bài tập theo URL. Câu hỏi dựng một lần lúc
 * vào (dữ liệu đổi trong phiên không xáo lại câu); `?seed=` cố định phiên (E2E).
 */
export function PracticeSessionPage() {
  const state = usePracticeData();
  const voice = useVoiceStatus();
  const [params] = useSearchParams();
  const location = useLocation();

  let body;
  if (state.status === 'error') body = <Message text={t('practice.loadError')} />;
  else if (state.status === 'loading' || voice === 'checking') {
    body = <Skeleton className="h-96" role="status" aria-label={t('practice.loading')} />;
  } else {
    // Mỗi lần điều hướng ("Luyện lại câu sai", "Làm thêm" — kể cả cùng URL) → phiên mới.
    body = (
      <Session key={location.key} data={state.data} params={params} voice={voice === 'available'} />
    );
  }
  return <section data-testid="page-practice-session">{body}</section>;
}

function Session({
  data,
  params,
  voice,
}: {
  data: PracticeData;
  params: URLSearchParams;
  voice: boolean;
}) {
  useStudySession('practice');
  const navigate = useNavigate();
  const [questions] = useState(() => {
    const { mode, size } = modeOf(params, data);
    const seed = params.get('seed');
    return buildPracticeSession({
      ...data,
      mode,
      filter: data.filter,
      voice,
      now: new Date(),
      seed: seed === null ? randomSeed() : Number(seed),
      ...(size === undefined ? {} : { size }),
    });
  });
  const [summary, setSummary] = useState<PracticeSummary | null>(null);
  const back = () => navigate('/practice');

  if (questions.length === 0) return <Message text={t('practice.empty')} />;
  if (summary) {
    return (
      <PracticeResult
        summary={summary}
        onBack={back}
        onMore={() => navigate('/practice/session?mode=more')}
        onRetryWrong={() =>
          navigate(
            `/practice/session?items=${encodeItems(
              summary.wrong.flatMap((w) =>
                w.question.kind === 'match'
                  ? w.question.pairs.map((p) => p.item)
                  : [w.question.item],
              ),
            )}`,
          )
        }
      />
    );
  }
  return <PracticeRunner questions={questions} voice={voice} onExit={back} onFinish={setSummary} />;
}

function Message({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-start gap-3" data-testid="practice-message">
      <p>{text}</p>
      <Link to="/practice" className="text-primary underline-offset-4 hover:underline">
        {t('practice.backPractice')}
      </Link>
    </div>
  );
}
