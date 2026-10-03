import type { Level, Question, QuestionType } from '../../format/src';
import type { Library } from './library';

/** When the correction is shown: after each question, or only on the results screen. */
export type Feedback = 'end' | 'immediate';

export interface Config {
  quizIds: string[];
  levels: Level[];
  types: QuestionType[];
  /** Empty = every tag. */
  tags: string[];
  count: number;
  feedback: Feedback;
}

/**
 * Outcome of a question. "revealed": the user asked to see the answer and explanation
 * before answering; "unanswered": the session ended before the question was answered.
 */
export type Outcome = 'correct' | 'wrong' | 'revealed' | 'unanswered';

export const POINTS: Record<Outcome, number> = { correct: 2, wrong: -1, revealed: 0, unanswered: 0 };

export interface Item {
  quizId: string;
  questionId: string;
  /** Display order of the answers, as indices into the authoring order (identical in every translation). */
  order: number[];
  /** Selected answers, as authoring-order indices. For true/false: [1] = true, [0] = false. */
  selected: number[];
  result?: Exclude<Outcome, 'unanswered'>;
}

export interface Session {
  config: Config;
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

/** Questions matching the filters, described by their reference-language version. */
export function candidates(library: Library, config: Pick<Config, 'quizIds' | 'levels' | 'types' | 'tags'>): Candidate[] {
  const out: Candidate[] = [];
  for (const quizId of config.quizIds) {
    const bundle = library.bundles.get(quizId);
    if (!bundle) continue;
    for (const id of bundle.questionIds) {
      const question = library.question(quizId, id, bundle.defaultLang)?.question;
      if (!question) continue;
      if (!config.levels.includes(question.level) || !config.types.includes(question.type)) continue;
      if (config.tags.length && !question.tags.some((t) => config.tags.includes(t))) continue;
      out.push({ quizId, question });
    }
  }
  return out;
}

function itemFor(c: Candidate): Item {
  return {
    quizId: c.quizId,
    questionId: c.question.id,
    order: shuffle(c.question.answers.map((_, i) => i)),
    selected: [],
  };
}

export function newSession(library: Library, config: Config): Session {
  const pool = shuffle(candidates(library, config)).slice(0, config.count);
  return { config, items: pool.map(itemFor), index: 0 };
}

/** New session made of the given items, reshuffled. */
export function retrySession(library: Library, config: Config, items: Item[]): Session {
  const pool = items
    .map((it) => ({ quizId: it.quizId, question: library.question(it.quizId, it.questionId, library.bundles.get(it.quizId)!.defaultLang)?.question }))
    .filter((c): c is Candidate => c.question !== undefined);
  return { config, items: shuffle(pool).map(itemFor), index: 0 };
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
  return item.result ?? 'unanswered';
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

export function score(library: Library, session: Session): Score {
  const byLevel = new Map<Level, LevelScore>();
  const counts: Record<Outcome, number> = { correct: 0, wrong: 0, revealed: 0, unanswered: 0 };
  let points = 0;
  for (const item of session.items) {
    const o = outcome(item);
    counts[o]++;
    points += POINTS[o];
    const bundle = library.bundles.get(item.quizId);
    const q = bundle && library.question(item.quizId, item.questionId, bundle.defaultLang)?.question;
    if (!q) continue;
    const entry = byLevel.get(q.level) ?? { points: 0, maxPoints: 0, questions: 0 };
    entry.points += POINTS[o];
    entry.maxPoints += POINTS.correct;
    entry.questions++;
    byLevel.set(q.level, entry);
  }
  return { points, maxPoints: session.items.length * POINTS.correct, total: session.items.length, counts, byLevel };
}
