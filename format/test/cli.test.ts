import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Tests the bundled script exactly as the skill runs it (run `npm run build:skill` first).
const SCRIPT = join(__dirname, '..', '..', 'skill', 'quiz-generator', 'scripts', 'validate.mjs');
const ROOT = join(__dirname, '..', '..');

function run(...args: string[]): { code: number; out: string } {
  try {
    return { code: 0, out: execFileSync('node', [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8' }) };
  } catch (e) {
    const err = e as { status: number; stdout: string };
    return { code: err.status, out: err.stdout };
  }
}

describe('validate.mjs', () => {
  it('accepts the examples', () => {
    const { code, out } = run('--strict', 'examples');
    expect(code).toBe(0);
    expect(out).toContain('✓ tcp-handshake — 6 valid questions');
  });

  it('checks excerpts against --sources', () => {
    expect(run('--strict', 'examples/flashcards-format', '--sources', 'docs/format.md').code).toBe(0);
    const { code, out } = run('--strict', 'examples/flashcards-format', '--sources', 'README.md');
    expect(code).toBe(1);
    expect(out).toContain('Excerpt not found verbatim');
  });

  it('prints a JSON report with stats and advice', () => {
    const report = JSON.parse(run('--json', 'examples/js-closures').out);
    expect(report).toMatchObject({ ok: true, errors: 0, quizzes: [{ id: 'js-closures', languages: ['en'], stats: { questions: 4 } }] });
    expect(report.quizzes[0].advice[0]).toMatch(/Only 4 questions/);
  });

  it('fails with located errors', () => {
    const dir = mkdtempSync(join(tmpdir(), 'quiz-'));
    writeFileSync(join(dir, 'quiz.en.md'), '---\nformat: 1\nid: x\ntitle: X\nlanguage: en\n---\n## Q\n<!-- id: a | level: 5 -->\n');
    const { code, out } = run(dir);
    expect(code).toBe(1);
    expect(out).toMatch(/ERROR .*quiz\.en\.md:8 \[a\]: Invalid or missing level "5"/);
    expect(run('--json', dir).out).toContain('"ok": false');
  });

  it('prints usage without inputs', () => {
    expect(run().code).toBe(2);
    expect(run('--help').out).toContain('--sources <path>');
  });
});
