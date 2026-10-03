import { describe, expect, it } from 'vitest';
import { parseQuiz } from '../../format/src';
import { Library } from '../src/library';
import { candidates, isCorrect, newSession, POINTS, QUIZ_SIZE, scheduleComeback, score, shuffle, trainingProgress } from '../src/session';

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

  it('a quiz draws QUIZ_SIZE random questions, training takes them all', () => {
    const many = parseQuiz(
      `---\nformat: 1\nid: many\ntitle: Many\nlanguage: en\n---\n` +
        Array.from({ length: 15 }, (_, k) => `## Q${k}\n<!-- id: m${k} | level: 1 | type: true-false | answer: true -->\n> [!source] link\n> https://x.y\n`).join('\n'),
    ).quiz!;
    const lib = new Library();
    lib.add(many, noMedia);
    const filters = { quizIds: ['many'], levels: [1, 2, 3] as (1 | 2 | 3)[], types: ['mcq', 'true-false'] as ('mcq' | 'true-false')[], tags: [] };
    expect(QUIZ_SIZE).toBe(10);
    expect(newSession(lib, { ...filters, mode: 'quiz' }).items).toHaveLength(10);
    expect(new Set(newSession(lib, { ...filters, mode: 'training' }).items.map((i) => i.questionId)).size).toBe(15);
  });

  it('training: missed or skipped questions come back 2 to 4 questions later, until mastered', () => {
    const lib = new Library();
    lib.add(quiz('en', '- [x] a\n- [ ] b\n- [ ] c'), noMedia);
    const s = newSession(lib, { quizIds: ['demo'], levels: [1, 2, 3], types: ['mcq', 'true-false'], tags: [], mode: 'training' });
    expect(s.items).toHaveLength(2);
    s.items[0].result = 'wrong';
    scheduleComeback(lib, s, () => 0.99);
    // Only one other question left: the comeback goes after it.
    expect(s.items.map((i) => i.attempt)).toEqual([1, 1, 2]);
    expect(s.items[2].questionId).toBe(s.items[0].questionId);
    expect(s.items[2].selected).toEqual([]);
    expect(trainingProgress(s)).toEqual({ total: 2, mastered: 0, firstTry: 0, retried: 1 });

    s.index = 1;
    s.items[1].result = 'correct';
    scheduleComeback(lib, s); // correct: nothing scheduled
    expect(s.items).toHaveLength(3);
    s.index = 2;
    s.items[2].skipped = true;
    scheduleComeback(lib, s); // skipped: comes back right away, nothing else is left
    expect(s.items.map((i) => i.attempt)).toEqual([1, 1, 2, 3]);
    s.items[3].result = 'correct';
    expect(trainingProgress(s)).toEqual({ total: 2, mastered: 2, firstTry: 1, retried: 1 });
  });

  it('scores points: +2 / +1 with hint when correct, 0 / -1 with hint when wrong, 0 unanswered', () => {
    expect(POINTS).toEqual({ correct: 2, correctWithHint: 1, wrong: 0, wrongWithHint: -1, unanswered: 0 });
    const lib = new Library();
    lib.add(quiz('en', '- [x] a\n- [ ] b'), noMedia);
    const session = newSession(lib, { quizIds: ['demo'], levels: [1, 2, 3], types: ['mcq', 'true-false'], tags: [], mode: 'quiz' });
    const [first, second] = session.items;
    first.result = 'correct';
    second.result = 'wrong';
    expect(score(lib, session)).toMatchObject({ points: 2, maxPoints: 4, counts: { correct: 1, wrong: 1 } });
    first.hinted = true;
    second.hinted = true;
    expect(score(lib, session)).toMatchObject({ points: 0, counts: { correctWithHint: 1, wrongWithHint: 1, correct: 0, wrong: 0 } });
    second.result = undefined;
    expect(score(lib, session)).toMatchObject({ points: 1, counts: { unanswered: 1 } });
    const levels = score(lib, session).byLevel;
    expect([...levels.values()].reduce((n, l) => n + l.maxPoints, 0)).toBe(4);
  });
});
