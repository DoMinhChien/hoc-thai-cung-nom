import type { Tone } from '@nom/core';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ToneContour, ToneTag } from './ToneContour';
import { chaoY, contourPath, TONE_CHAO, TONES } from './tones';

describe('ToneContour (D10)', () => {
  it('số Chao khớp tokens.json (nguồn duy nhất)', () => {
    const tokens = JSON.parse(
      // Vitest chạy trong apps/web.
      readFileSync(path.resolve('../../docs/design/tokens.json'), 'utf8'),
    ) as { color: { tone: Record<Tone, { chao: string }> } };
    for (const tone of TONES) {
      expect(TONE_CHAO[tone].join('')).toBe(tokens.color.tone[tone].chao);
    }
  });

  it.each([
    ['mid', 3, 3],
    ['falling', 4, 1],
    ['rising', 1, 4],
  ] as const)('%s: đường đi từ mức %i đến mức %i', (tone, from, to) => {
    const ys = contourPath(tone)
      .match(/-?\d+(\.\d+)?/g)!
      .map(Number)
      .filter((_, i) => i % 2 === 1);
    expect(ys[0]).toBe(chaoY(from));
    expect(ys.at(-1)).toBe(chaoY(to));
  });

  it('mức 5 ở trên, mức 1 ở dưới', () => {
    expect(chaoY(5)).toBeLessThan(chaoY(1));
  });

  it('SVG ẩn với trình đọc màn hình, màu theo currentColor', () => {
    render(<ToneContour tone="high" size={20} />);
    const svg = screen.getByTestId('tone-contour-high');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('width', '20');
  });

  it('ToneTag: contour + tên thanh', () => {
    render(<ToneTag tone="low" />);
    const tag = screen.getByText('Thấp');
    expect(tag).toHaveAttribute('data-tone', 'low');
    expect(tag.querySelector('[data-testid="tone-contour-low"]')).not.toBeNull();
  });
});
