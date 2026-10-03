import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..');

describe('README example links', () => {
  const links = [...readFileSync(join(ROOT, 'README.md'), 'utf8').matchAll(/quiz=(examples\/[^&)\s]+)/g)].map((m) => m[1]);

  it('link to every example folder', () => {
    const folders = new Set(links.map((l) => l.split('/')[1]));
    expect([...folders].sort()).toEqual(['flashcards-format', 'js-closures', 'tcp-handshake', 'ts-async']);
  });

  it('point to existing quiz files', () => {
    for (const link of links) expect(existsSync(join(ROOT, link)), link).toBe(true);
  });
});
