import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** docs/design/tokens.json là nguồn duy nhất; tokens.css phải khớp từng giá trị. */
const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

type Leaf = { value: string | number; [k: string]: unknown };
type Group = Record<string, Leaf>;

const json = JSON.parse(read('../../../../docs/design/tokens.json')) as {
  color: Record<string, Leaf | Record<string, Leaf>>;
  font: { family: Group; size: Group; weight: Group; 'line-height': Group };
  illustration: { size: Group };
  radius: Group;
  shadow: Group;
  layout: Record<string, Leaf | Record<string, string>>;
  motion: Record<string, Leaf | string>;
};

const cssVars = new Map(
  [...read('./tokens.css').matchAll(/(--nom-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]]),
);

/** Tên biến CSS → giá trị mong đợi, suy ra từ tokens.json. */
function expectedVars(): [string, string][] {
  const out: [string, string][] = [];
  const add = (name: string, value: unknown) => out.push([`--nom-${name}`, String(value)]);

  for (const [key, node] of Object.entries(json.color)) {
    if ('value' in node) {
      add(key, node.value);
      continue;
    }
    for (const [sub, leaf] of Object.entries(node as Record<string, Leaf>)) {
      if (sub.startsWith('$')) continue;
      const prefix = key === 'brand-provider' ? sub.replace(/-bg$/, '') : `${key}-${sub}`;
      add(key === 'brand-provider' ? `${prefix}-bg` : prefix, leaf.value);
      for (const [extra, value] of Object.entries(leaf)) {
        if (extra !== 'value' && extra !== 'note' && typeof value === 'string') {
          add(`${prefix}-${extra}`, value);
        }
      }
    }
  }
  add('font-vi', json.font.family.vi!.value);
  add('font-th', json.font.family.th!.value);
  for (const [k, v] of Object.entries(json.font.size)) {
    if (k.startsWith('th-')) add(`text-${k}`, v.value);
  }
  for (const [k, v] of Object.entries(json.font['line-height'])) add(`leading-${k}`, v.value);
  add('text-4xl', json.font.size['4xl']!.value);
  add('weight-bold', json.font.weight.bold!.value);
  for (const [k, v] of Object.entries(json.radius)) if (k !== 'full') add(`radius-${k}`, v.value);
  for (const [k, v] of Object.entries(json.shadow)) if (k !== 'none') add(`shadow-${k}`, v.value);
  for (const [k, v] of Object.entries(json.layout)) {
    if ('value' in v) add(`layout-${k}`, v.value);
  }
  for (const [k, v] of Object.entries(json.illustration.size)) add(`illustration-${k}`, v.value);
  for (const [k, v] of Object.entries(json.motion)) {
    if (typeof v !== 'string') add(`motion-${k}`, v.value);
  }
  return out;
}

const normalize = (v: string) =>
  v
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/(\.\d*?)0+\b/g, '$1')
    .replace(/\.(?=[,)])/g, '');

describe('tokens.css ↔ docs/design/tokens.json', () => {
  it.each(expectedVars())('%s = %s', (name, value) => {
    expect(cssVars.get(name), `thiếu ${name} trong tokens.css`).toBeDefined();
    expect(normalize(cssVars.get(name)!)).toBe(normalize(value));
  });

  it('accent là chàm #3F4AA8', () => {
    expect(cssVars.get('--nom-accent')).toBe('#3f4aa8');
  });
});
