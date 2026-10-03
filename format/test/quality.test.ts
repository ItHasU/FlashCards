import { describe, expect, it } from 'vitest';
import { checkExcerpts, excerptFragments, htmlToText, normalizeForMatch, parseQuiz, quizAdvice, quizStats, validateQuiz } from '../src';

const FM = '---\nformat: 1\nid: t\ntitle: T\nlanguage: en\n---\n';
const LINK = '> [!source] link\n> https://example.com\n';
const tf = (id: string, answer: boolean, level = 1, explanation = true) =>
  `## Statement ${id}\n<!-- id: ${id} | level: ${level} | type: true-false | answer: ${answer} -->\n${explanation ? '> [!explanation]\n> Because.\n\n' : ''}${LINK}\n`;
const quiz = (body: string) => parseQuiz(FM + body, { path: 'q.md' }).quiz!;
const warnings = (body: string) => validateQuiz(quiz(body)).filter((i) => i.severity === 'warning').map((i) => i.message);

describe('question quality warnings', () => {
  it('flags a correct answer that is much longer than the distractors', () => {
    expect(warnings(`## Q\n<!-- id: a | level: 1 -->\n- [x] The complete and carefully qualified right answer\n- [ ] Short\n- [ ] Brief\n\n${LINK}`)).toEqual([
      'The correct answer is much longer than every distractor, which gives it away: rebalance the lengths.',
    ]);
    expect(warnings(`## Q\n<!-- id: a | level: 1 -->\n- [x] Right answer\n- [ ] Wrong answer\n- [ ] Other one\n\n${LINK}`)).toEqual([]);
  });

  it('flags questions that are not self-contained', () => {
    expect(warnings(`## As in the previous question, what is X?\n<!-- id: a | level: 1 | type: true-false | answer: true -->\n${LINK}`)).toHaveLength(1);
    expect(warnings(`## D'après le texte ci-dessus, X est vrai.\n<!-- id: a | level: 1 | type: true-false | answer: true -->\n${LINK}`)).toHaveLength(1);
  });

  it('flags duplicated statements', () => {
    expect(warnings(tf('a', true).replace('Statement a', 'Same') + tf('b', false).replace('Statement b', 'Same'))).toEqual([
      'Same statement as question "a".',
    ]);
  });
});

describe('stats and advice', () => {
  it('counts levels, types and sources', () => {
    const s = quizStats(quiz(tf('a', true, 1) + tf('b', false, 3, false)));
    expect(s).toMatchObject({ questions: 2, byLevel: { 1: 1, 2: 0, 3: 1 }, byType: { mcq: 0, 'true-false': 2 }, trueAnswers: 1, withExplanation: 1 });
    expect(s.bySourceType.link).toBe(2);
  });

  it('advises on size, level mix, true/false share and balance', () => {
    const advice = quizAdvice(quizStats(quiz(Array.from({ length: 10 }, (_, i) => tf(`q${i}`, true)).join(''))));
    expect(advice.join('\n')).toMatch(/No level 2 question/);
    expect(advice.join('\n')).toMatch(/100 % of the questions are level 1/);
    expect(advice.join('\n')).toMatch(/True\/false questions are 100 %/);
    expect(advice.join('\n')).toMatch(/10 of 10 true\/false questions are true/);
    expect(quizAdvice(quizStats(quiz(tf('a', true)))).join('\n')).toMatch(/Only 1 questions/);
  });
});

describe('excerpt verification', () => {
  it('normalizes typography, formatting and whitespace', () => {
    expect(normalizeForMatch('It’s  **“bold”**\n— and `code` [link](http://x)')).toBe('it\'s "bold" - and code link');
  });

  it('extracts the quoted fragments', () => {
    expect(excerptFragments('"First part […] second part."\n— Book, p. 3')).toEqual(['first part', 'second part.']);
    expect(excerptFragments('« Une citation »\n— Livre')).toEqual(['une citation']);
  });

  it('warns only about excerpts missing from the corpus', () => {
    const q = quiz(
      `## Q\n<!-- id: a | level: 1 | type: true-false | answer: true -->\n> [!source] excerpt\n> "The *quick* brown fox [...] the lazy dog."\n> — Book\n\n` +
        `## R\n<!-- id: b | level: 1 | type: true-false | answer: true -->\n> [!source] excerpt\n> "An invented quotation."\n> — Book\n`,
    );
    const corpus = normalizeForMatch(htmlToText('<p>The quick   brown fox jumps over<br>the lazy dog.</p>'));
    const issues = checkExcerpts(q, corpus);
    expect(issues.map((i) => i.questionId)).toEqual(['b']);
    expect(issues[0].message).toContain('an invented quotation.');
  });
});
