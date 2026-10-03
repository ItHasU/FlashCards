import { describe, expect, it } from 'vitest';
import { parseQuiz } from '../../format/src';
import { Library } from '../src/library';
import { candidates, isCorrect, newSession, POINTS, score, shuffle } from '../src/session';

const quiz = (lang: string, mcq: string, tf = 'true') =>
  parseQuiz(
    `---\nformat: 1\nid: demo\ntitle: Demo ${lang}\nlanguage: ${lang}\n---\n` +
      `## Q1 ${lang}\n<!-- id: q1 | level: 1 | tags: a -->\n${mcq}\n> [!source] link\n> https://x.y\n\n` +
      `## Q2 ${lang}\n<!-- id: q2 | level: 3 | type: true-false | answer: ${tf} | tags: b -->\n> [!source] link\n> https://x.y\n`,
    { path: `quiz.${lang}.md` },
  ).quiz!;

const noMedia = () => undefined;

describe('session', () => {
  it('shuffles without losing items', () => {
    const items = [1, 2, 3, 4, 5];
    expect(shuffle(items).sort()).toEqual(items);
  });

  it('scores mcq and true/false answers', () => {
    const q = quiz('en', '- [x] a\n- [ ] b\n- [x] c');
    expect(isCorrect(q.questions[0], [2, 0])).toBe(true);
    expect(isCorrect(q.questions[0], [0])).toBe(false);
    expect(isCorrect(q.questions[0], [0, 1, 2])).toBe(false);
    expect(isCorrect(q.questions[1], [1])).toBe(true);
    expect(isCorrect(q.questions[1], [0])).toBe(false);
  });

  it('filters by level, type and tag', () => {
    const lib = new Library();
    lib.add(quiz('en', '- [x] a\n- [ ] b'), noMedia);
    const base = { quizIds: ['demo'], levels: [1, 2, 3] as const, types: ['mcq', 'true-false'] as const, tags: [] };
    expect(candidates(lib, { ...base, levels: [...base.levels], types: [...base.types] })).toHaveLength(2);
    expect(candidates(lib, { ...base, levels: [3], types: [...base.types] }).map((c) => c.question.id)).toEqual(['q2']);
    expect(candidates(lib, { ...base, levels: [...base.levels], types: ['mcq'] }).map((c) => c.question.id)).toEqual(['q1']);
    expect(candidates(lib, { ...base, levels: [...base.levels], types: [...base.types], tags: ['b'] }).map((c) => c.question.id)).toEqual(['q2']);
  });

  it('serves translations and falls back on inconsistent ones', () => {
    const lib = new Library();
    lib.add(quiz('en', '- [x] a\n- [ ] b'), noMedia);
    lib.add(quiz('fr', '- [x] a\n- [ ] b', 'false'), noMedia);
    expect(lib.question('demo', 'q1', 'fr')!.question.title).toBe('Q1 fr');
    // The French q2 contradicts the English one: it is excluded and English is shown.
    expect(lib.question('demo', 'q2', 'fr')!.lang).toBe('en');
    expect(lib.issues.some((i) => i.severity === 'error' && i.questionId === 'q2')).toBe(true);
    expect(lib.languages().sort()).toEqual(['en', 'fr']);
  });

  it('draws the requested number of questions', () => {
    const lib = new Library();
    lib.add(quiz('en', '- [x] a\n- [ ] b\n- [ ] c'), noMedia);
    const s = newSession(lib, { quizIds: ['demo'], levels: [1, 2, 3], types: ['mcq', 'true-false'], tags: [], count: 1, feedback: 'end' });
    expect(s.items).toHaveLength(1);
    const all = newSession(lib, { quizIds: ['demo'], levels: [1, 2, 3], types: ['mcq', 'true-false'], tags: [], count: 10, feedback: 'end' });
    const mcq = all.items.find((i) => i.questionId === 'q1')!;
    expect([...mcq.order].sort()).toEqual([0, 1, 2]);
  });

  it('scores points: +2 correct, -1 wrong, 0 revealed or unanswered', () => {
    expect(POINTS).toEqual({ correct: 2, wrong: -1, revealed: 0, unanswered: 0 });
    const lib = new Library();
    lib.add(quiz('en', '- [x] a\n- [ ] b'), noMedia);
    const session = newSession(lib, { quizIds: ['demo'], levels: [1, 2, 3], types: ['mcq', 'true-false'], tags: [], count: 10, feedback: 'end' });
    const [first, second] = session.items;
    first.result = 'correct';
    second.result = 'wrong';
    expect(score(lib, session)).toMatchObject({ points: 1, maxPoints: 4, counts: { correct: 1, wrong: 1, revealed: 0, unanswered: 0 } });
    second.result = 'revealed';
    expect(score(lib, session).points).toBe(2);
    second.result = undefined;
    expect(score(lib, session)).toMatchObject({ points: 2, counts: { unanswered: 1 } });
    const levels = score(lib, session).byLevel;
    expect([...levels.values()].reduce((n, l) => n + l.maxPoints, 0)).toBe(4);
  });
});
