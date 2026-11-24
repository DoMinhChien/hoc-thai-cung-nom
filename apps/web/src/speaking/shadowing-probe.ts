/**
 * M12.10 bước A — tách cụm cho trang thử `/dev/shadowing` (SCR-11 §2). Bản thử: bước B làm lại trong
 * `packages/core/src/speaking/shadowing.ts`.
 */

/** Cụm dài hơn ngần này thẻ thì tách (SCR-11 §2). */
const MAX_TOKENS = 9;
const CHUNK_TOKENS = 5;

export interface ProbeChunk {
  th: string;
  /** Nghĩa — chỉ ở cụm đầu của lượt / câu. */
  vi?: string;
  speaker?: string;
}

/** Lượt / câu = 1 cụm; > 9 thẻ → nhóm ≈ 5 thẻ (bản thử, bước B làm lại trong core). */
export function probeChunks(
  items: readonly { th: string; vi: string; tokens?: readonly string[]; speaker?: string }[],
): ProbeChunk[] {
  return items.flatMap(({ th, vi, tokens, speaker }) => {
    if (!tokens || tokens.length <= MAX_TOKENS) return [{ th, vi, speaker }];
    const groups = Math.ceil(tokens.length / CHUNK_TOKENS);
    const size = Math.ceil(tokens.length / groups);
    return Array.from({ length: groups }, (_, g) => ({
      th: tokens.slice(g * size, (g + 1) * size).join(''),
      vi: g === 0 ? vi : undefined,
      speaker: g === 0 ? speaker : undefined,
    }));
  });
}
