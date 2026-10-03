import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadQuiz, parseQuiz, resolveMediaPath, validateQuiz, validateTranslations, type QuizFile } from '../src';

const FM = (extra = '') => `---\nformat: 1\nid: t\ntitle: Test\nlanguage: en\n${extra}---\n`;
const SRC = '> [!source] link\n> https://example.com\n';

function errors(text: string, mediaExists?: (p: string) => boolean) {
  const { quiz, issues } = parseQuiz(text, { path: 'q.md' });
  const all = quiz ? [...issues, ...validateQuiz(quiz, { mediaExists })] : issues;
  return all.filter((i) => i.severity === 'error').map((i) => i.message);
}

describe('parseQuiz', () => {
  it('parses a complete mcq question', () => {
    const { quiz, issues } = parseQuiz(
      FM() +
        `
# Ignored title

## What is *2+2*?
<!-- id: q1 | level: 2 | tags: math, easy -->

Extra **statement**.

- [ ] 3
- [x] 4
- [ ] multi
  line answer

> [!explanation]
> Because.

${SRC}
> [!source] excerpt
> "Quote"
> — Book
`,
    );
    expect(issues).toEqual([]);
    const q = quiz!.questions[0];
    expect(q).toMatchObject({
      id: 'q1',
      level: 2,
      type: 'mcq',
      tags: ['math', 'easy'],
      title: 'What is *2+2*?',
      body: 'Extra **statement**.',
      explanation: 'Because.',
    });
    expect(q.answers).toEqual([
      { text: '3', correct: false },
      { text: '4', correct: true },
      { text: 'multi\nline answer', correct: false },
    ]);
    expect(q.sources.map((s) => [s.type, s.body])).toEqual([
      ['link', 'https://example.com'],
      ['excerpt', '"Quote"\n— Book'],
    ]);
  });

  it('parses true-false questions', () => {
    const { quiz } = parseQuiz(FM() + `## Sky is green.\n<!-- id: q1 | level: 1 | type: true-false | answer: false -->\n\n${SRC}`);
    expect(quiz!.questions[0]).toMatchObject({ type: 'true-false', answer: false, answers: [] });
  });

  it('ignores headings and task lists inside fenced code', () => {
    const { quiz, issues } = parseQuiz(
      FM() +
        '## Code?\n<!-- id: q1 | level: 1 -->\n\n```md\n## not a question\n- [x] not an answer\n```\n\n- [x] a\n- [ ] b\n\n' +
        '> [!source] code\n> ```md\n> ## still code\n> ```\n',
    );
    expect(issues).toEqual([]);
    expect(quiz!.questions).toHaveLength(1);
    expect(quiz!.questions[0].body).toContain('## not a question');
    expect(quiz!.questions[0].answers).toHaveLength(2);
  });

  it('rejects files without front-matter or language', () => {
    expect(parseQuiz('## Q\n').quiz).toBeNull();
    expect(parseQuiz('---\nid: x\ntitle: T\n---\n').quiz).toBeNull();
  });

  it('derives a missing quiz id from the title', () => {
    const { quiz, issues } = parseQuiz('---\ntitle: Les Bases de Git\nlanguage: fr\nformat: 1\n---\n');
    expect(quiz!.meta.id).toBe('les-bases-de-git');
    expect(issues.map((i) => i.severity)).toEqual(['warning']);
  });

  it('reports structural errors with line numbers', () => {
    const { quiz, issues } = parseQuiz(
      FM() + '## Q1\nno metadata\n\n## Q2\n<!-- id: q2 | level: 4 -->\n\n## Q3\n<!-- id: q3 | level: 1 -->\n- [x] a\nstray text\n',
    );
    expect(quiz!.questions).toEqual([]);
    expect(issues.map((i) => [i.line, i.severity])).toEqual([
      [7, 'error'],
      [11, 'error'],
      [16, 'error'],
    ]);
  });
});

describe('validateQuiz', () => {
  const q = (meta: string, rest: string) => FM() + `## Q\n<!-- ${meta} -->\n\n${rest}`;

  it('requires a source', () => {
    expect(errors(q('id: a | level: 1', '- [x] a\n- [ ] b\n'))).toEqual([
      'Every question needs at least one "> [!source] <type>" block.',
    ]);
  });

  it('checks mcq answers', () => {
    expect(errors(q('id: a | level: 1', `- [ ] a\n- [ ] b\n\n${SRC}`))).toEqual([
      'No correct answer: mark at least one answer with [x].',
    ]);
    expect(errors(q('id: a | level: 1', `- [x] a\n\n${SRC}`))).toEqual(['A multiple-choice question needs at least 2 answers.']);
    expect(errors(q('id: a | level: 1', `- [x] a\n- [ ] A\n\n${SRC}`))).toEqual(['Duplicate answer "A".']);
  });

  it('checks true-false questions', () => {
    expect(errors(q('id: a | level: 1 | type: true-false', `${SRC}`))).toHaveLength(1);
    expect(errors(q('id: a | level: 1 | type: true-false | answer: true', `- [x] a\n- [ ] b\n\n${SRC}`))).toHaveLength(1);
  });

  it('checks source contents', () => {
    expect(errors(q('id: a | level: 1 | type: true-false | answer: true', '> [!source] link\n> no url here\n'))).toHaveLength(1);
    expect(errors(q('id: a | level: 1 | type: true-false | answer: true', '> [!source] code\n> no fence\n'))).toHaveLength(1);
    expect(errors(q('id: a | level: 1 | type: true-false | answer: true', '> [!source] image\n> nope\n'))).toHaveLength(1);
  });

  it('checks duplicate ids', () => {
    const text = FM() + `## A\n<!-- id: a | level: 1 | type: true-false | answer: true -->\n${SRC}\n## B\n<!-- id: a | level: 1 | type: true-false | answer: true -->\n${SRC}`;
    expect(errors(text)).toEqual(['Duplicate question id "a" (already used line 7).']);
  });

  it('checks referenced media when asked', () => {
    const text = q('id: a | level: 1 | type: true-false | answer: true', '> [!source] image\n> ![x](media/a.png)\n');
    expect(errors(text, (p) => p === 'media/a.png')).toEqual([]);
    expect(errors(text, () => false)).toHaveLength(1);
  });
});

describe('loadQuiz', () => {
  it('drops invalid questions and keeps valid ones', () => {
    const text = FM() + `## A\n<!-- id: a | level: 1 | type: true-false | answer: true -->\n${SRC}\n## B\n<!-- id: b | level: 1 -->\n- [x] a\n`;
    const { quiz, issues } = loadQuiz(text);
    expect(quiz!.questions.map((x) => x.id)).toEqual(['a']);
    expect(issues.some((i) => i.questionId === 'b' && i.severity === 'error')).toBe(true);
  });
});

describe('validateTranslations', () => {
  const file = (lang: string, answers: string, level = 1): QuizFile =>
    parseQuiz(FM().replace('language: en', `language: ${lang}`) + `## Q\n<!-- id: a | level: ${level} -->\n${answers}\n${SRC}`, {
      path: `quiz.${lang}.md`,
    }).quiz!;

  it('accepts consistent translations', () => {
    expect(validateTranslations([file('en', '- [x] yes\n- [ ] no'), file('fr', '- [x] oui\n- [ ] non')])).toEqual([]);
  });

  it('detects answer order and level mismatches', () => {
    const issues = validateTranslations([file('en', '- [x] yes\n- [ ] no'), file('fr', '- [ ] non\n- [x] oui', 2)]);
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(2);
  });

  it('detects duplicated languages', () => {
    expect(validateTranslations([file('en', '- [x] a\n- [ ] b'), file('en', '- [x] a\n- [ ] b')])[0].severity).toBe('error');
  });
});

describe('resolveMediaPath', () => {
  it('resolves relative to the quiz file', () => {
    expect(resolveMediaPath('dir/quiz.md', 'media/a.png')).toBe('dir/media/a.png');
    expect(resolveMediaPath('quiz.md', './media/a%20b.png')).toBe('media/a b.png');
    expect(resolveMediaPath('a/b/quiz.md', '../x.png')).toBe('a/x.png');
  });
});

describe('examples', () => {
  const root = join(__dirname, '..', '..', 'examples');
  const dirs = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const dir of dirs) {
    it(`${dir.name} is valid without errors or warnings`, () => {
      const base = join(root, dir.name);
      const files = readdirSync(base).filter((f) => f.endsWith('.md'));
      const quizzes: QuizFile[] = [];
      for (const f of files) {
        const path = join(base, f);
        const { quiz, issues } = loadQuiz(readFileSync(path, 'utf8'), {
          path: relative(base, path),
          mediaExists: (p) => existsSync(join(base, p)),
        });
        expect(issues).toEqual([]);
        quizzes.push(quiz!);
      }
      expect(validateTranslations(quizzes)).toEqual([]);
    });
  }
});
