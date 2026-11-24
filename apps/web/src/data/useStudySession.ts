import type { SessionRecord } from '@nom/core';
import { useCallback, useEffect, useRef } from 'react';
import { useRepositories } from './hooks';

/** Module phiên học (SCR-09 Q2 b, M10; `speaking` — M12.9). */
export type StudyModule = 'lesson' | 'practice' | 'game' | 'speaking';

/**
 * Ghi một `SessionRecord` khi `active` (vào bài học / phiên bài tập / lượt chơi): bắt đầu khi bật,
 * kết thúc khi tắt, rời trang hoặc đóng tab — nguồn thời gian học và chuỗi ngày (SCR-03, SCR-09).
 * Trả về hàm ghi tóm tắt phiên luyện nói — lưu cùng lúc kết thúc phiên (SCR-10 §6).
 */
export function useStudySession(module: StudyModule, active = true) {
  const repos = useRepositories();
  const speaking = useRef<SessionRecord['speaking']>(undefined);
  useEffect(() => {
    if (!repos || !active) return;
    let id: string | null = null;
    let ended = false;
    const end = () => {
      if (ended || !id) return;
      ended = true;
      void repos.sessions.end(id, new Date(), speaking.current);
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
  return useCallback((summary: SessionRecord['speaking']) => {
    speaking.current = summary;
  }, []);
}
