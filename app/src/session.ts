import type { Level, Question, QuestionType } from '../../format/src';
import type { Library } from './library';

/**
 * - read: every matching question with its answer, in file order;
 * - training: one question at a time, corrected immediately, no points; missed or skipped
 *   questions come back later, until every question has been answered correctly;
 * - quiz: QUIZ_SIZE random questions, scored, corrected at the end.
 */
export type Mode = 'read' | 'training' | 'quiz';
export const MODES: readonly Mode[] = ['quiz', 'training', 'read'];

export const QUIZ_SIZE = 10;

export interface Config {
  quizIds: string[];
  levels: Level[];
  types: QuestionType[];
  /** Empty = every tag. */
  tags: string[];
  mode: Mode;
}

export type Filters = Pick<Config, 'quizIds' | 'levels' | 'types' | 'tags'>;

/**
 * Outcome of a quiz question. The hint shows the sources of the question (not the answer)
 * before answering, and changes the points; "unanswered": the quiz ended before the question was answered.
 */
export type Outcome = 'correct' | 'correctWithHint' | 'wrong' | 'wrongWithHint' | 'unanswered';

export const POINTS: Record<Outcome, number> = { correct: 2, correctWithHint: 1, wrong: 0, wrongWithHint: -1, unanswered: 0 };

export interface Item {
  quizId: string;
  questionId: string;
  /** Display order of the answers, as indices into the authoring order (identical in every translation). */
  order: number[];
  /** Selected answers, as authoring-order indices. For true/false: [1] = true, [0] = false. */
  selected: number[];
  result?: 'correct' | 'wrong';
  /** Quiz: the user looked at the hint (the sources) before answering. */
  hinted?: boolean;
  /** Training: the user skipped the question and was shown the answer. */
  skipped?: boolean;
  /** Training: 1 for the first time the question is asked, 2 for its first comeback… */
  attempt: number;
}

export interface Session {
  config: Config;
  /** Quiz: the drawn questions. Training: the questions asked so far and still to come (comebacks are inserted). */
  items: Item[];
  index: number;
}

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface Candidate {
  quizId: string;
  question: Question;
}

/** Questions matching the filters, in file order, described by their reference-language version. */
export function candidates(library: Library, filters: Filters): Candidate[] {
  const out: Candidate[] = [];
  for (const quizId of filters.quizIds) {
    const bundle = library.bundles.get(quizId);
    if (!bundle) continue;
    for (const id of bundle.questionIds) {
      const question = library.question(quizId, id, bundle.defaultLang)?.question;
      if (!question) continue;
      if (!filters.levels.includes(question.level) || !filters.types.includes(question.type)) continue;
      if (filters.tags.length && !question.tags.some((t) => filters.tags.includes(t))) continue;
      out.push({ quizId, question });
    }
  }
  return out;
}

function itemFor(c: Candidate, attempt = 1): Item {
  return {
    quizId: c.quizId,
    questionId: c.question.id,
    order: shuffle(c.question.answers.map((_, i) => i)),
    selected: [],
    attempt,
  };
}

/** Starts a quiz or a training session (the reading mode needs no session). */
export function newSession(library: Library, config: Config): Session {
  const pool = shuffle(candidates(library, config));
  const drawn = config.mode === 'quiz' ? pool.slice(0, QUIZ_SIZE) : pool;
  return { config, items: drawn.map((c) => itemFor(c)), index: 0 };
}

/** New quiz made of the given items, reshuffled. */
export function retrySession(library: Library, config: Config, items: Item[]): Session {
  const pool = items
    .map((it) => ({ quizId: it.quizId, question: questionOf(library, it) }))
    .filter((c): c is Candidate => c.question !== undefined);
  return { config, items: shuffle(pool).map((c) => itemFor(c)), index: 0 };
}

function questionOf(library: Library, item: Item): Question | undefined {
  const bundle = library.bundles.get(item.quizId);
  return bundle && library.question(item.quizId, item.questionId, bundle.defaultLang)?.question;
}

/**
 * Training: when the current question was missed or skipped, schedules it again a few
 * questions later (right away if nothing else is left), with its answers reshuffled.
 */
export function scheduleComeback(library: Library, session: Session, random = Math.random): void {
  const item = session.items[session.index];
  if (item.result === 'correct') return;
  const question = questionOf(library, item);
  if (!question) return;
  const remaining = session.items.length - session.index - 1;
  const gap = Math.min(remaining, 2 + Math.floor(random() * 3)); // 2 to 4 other questions in between
  session.items.splice(session.index + 1 + gap, 0, itemFor({ quizId: item.quizId, question }, item.attempt + 1));
}

export interface TrainingProgress {
  /** Distinct questions in the session. */
  total: number;
  /** Distinct questions answered correctly. */
  mastered: number;
  /** Questions answered correctly at the first attempt. */
  firstTry: number;
  /** Questions missed or skipped at least once. */
  retried: number;
}

export function trainingProgress(session: Session): TrainingProgress {
  const key = (i: Item) => `${i.quizId}/${i.questionId}`;
  const all = new Set(session.items.map(key));
  const mastered = new Set(session.items.filter((i) => i.result === 'correct').map(key));
  const firstTry = session.items.filter((i) => i.result === 'correct' && i.attempt === 1).length;
  const retried = new Set(session.items.filter((i) => i.attempt > 1).map(key));
  return { total: all.size, mastered: mastered.size, firstTry, retried: retried.size };
}

export function isCorrect(question: Question, selected: number[]): boolean {
  if (question.type === 'true-false') return selected.length === 1 && (selected[0] === 1) === question.answer;
  const expected = question.answers.flatMap((a, i) => (a.correct ? [i] : []));
  return expected.length === selected.length && expected.every((i) => selected.includes(i));
}

/** Indices (authoring order) of the correct answers; for true/false, [1] or [0]. */
export function expectedAnswers(question: Question): number[] {
  if (question.type === 'true-false') return [question.answer ? 1 : 0];
  return question.answers.flatMap((a, i) => (a.correct ? [i] : []));
}

export function outcome(item: Item): Outcome {
  if (!item.result) return 'unanswered';
  return item.hinted ? (item.result === 'correct' ? 'correctWithHint' : 'wrongWithHint') : item.result;
}

export interface LevelScore {
  points: number;
  maxPoints: number;
  questions: number;
}

export interface Score {
  points: number;
  /** Points if every question were answered correctly. */
  maxPoints: number;
  total: number;
  counts: Record<Outcome, number>;
  byLevel: Map<Level, LevelScore>;
}

/** Quiz score. */
export function score(library: Library, session: Session): Score {
  const byLevel = new Map<Level, LevelScore>();
  const counts: Record<Outcome, number> = { correct: 0, correctWithHint: 0, wrong: 0, wrongWithHint: 0, unanswered: 0 };
  let points = 0;
  for (const item of session.items) {
    const o = outcome(item);
    counts[o]++;
    points += POINTS[o];
    const q = questionOf(library, item);
    if (!q) continue;
    const entry = byLevel.get(q.level) ?? { points: 0, maxPoints: 0, questions: 0 };
    entry.points += POINTS[o];
    entry.maxPoints += POINTS.correct;
    entry.questions++;
    byLevel.set(q.level, entry);
  }
  return { points, maxPoints: session.items.length * POINTS.correct, total: session.items.length, counts, byLevel };
}
