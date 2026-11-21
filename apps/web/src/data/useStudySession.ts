import { useEffect } from 'react';
import { useRepositories } from './hooks';

/** Module phiên học (SCR-09 Q2 b, M10). */
export type StudyModule = 'lesson' | 'practice' | 'game';

/**
 * Ghi một `SessionRecord` khi `active` (vào bài học / phiên bài tập / lượt chơi): bắt đầu khi bật,
 * kết thúc khi tắt, rời trang hoặc đóng tab — nguồn thời gian học và chuỗi ngày (SCR-03, SCR-09).
 */
export function useStudySession(module: StudyModule, active = true) {
  const repos = useRepositories();
  useEffect(() => {
    if (!repos || !active) return;
    let id: string | null = null;
    let ended = false;
    const end = () => {
      if (ended || !id) return;
      ended = true;
      void repos.sessions.end(id, new Date());
    };
    void repos.sessions.start(module, new Date()).then((s) => {
      id = s.id;
      if (ended) {
        ended = false;
        end();
      }
    });
    window.addEventListener('pagehide', end);
    return () => {
      window.removeEventListener('pagehide', end);
      if (id) end();
      else ended = true;
    };
  }, [repos, module, active]);
}
