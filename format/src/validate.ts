import { parseQuiz } from './parse';
import type { Issue, Question, QuizFile } from './types';

export interface ValidateOptions {
  /**
   * Tells whether a local media path (already resolved relative to the quiz file) exists.
   * When omitted, local media references are not checked.
   */
  mediaExists?: (path: string) => boolean;
}

// Options that lose their meaning once answers are shuffled.
const POSITIONAL_ANSWER_RE =
  /^(all|none|both) of (the )?(above|these|them)|^(toutes|aucune|tous|aucun) (les réponses |des réponses )?(ci-dessus|précédentes)|^les deux/i;

// Questions are drawn at random: they must not refer to other questions or to "the text above".
const SELF_REFERENCE_RE =
  /\b(previous|next|last|above|below|following) question\b|\bquestion (précédente|suivante|ci-dessus|ci-dessous)\b|\b(the|this) (text|document|passage|article) (above|below)\b|\b(le|ce) (texte|document|passage) ci-(dessus|dessous)\b/i;

const plain = (md: string) => md.replace(/[`*_]/g, '').trim();

const LOCAL_REF_RE = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

/** Returns true for paths that point inside the quiz bundle (not URLs, anchors or data URIs). */
export function isLocalPath(target: string): boolean {
  return !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target);
}

/** Resolves a relative media path against the directory of the quiz file ("a/quiz.md" + "media/x.png" -> "a/media/x.png"). */
export function resolveMediaPath(filePath: string | undefined, target: string): string {
  const base = filePath && filePath.includes('/') ? filePath.slice(0, filePath.lastIndexOf('/') + 1) : '';
  const parts: string[] = [];
  for (const part of (base + decodeURI(target.split('#')[0].split('?')[0])).split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}

/** Lists the local files referenced by markdown links and images of a question. */
export function localReferences(q: Question): string[] {
  const texts = [q.title, q.body, q.explanation, ...q.answers.map((a) => a.text), ...q.sources.map((s) => s.body)];
  const refs = new Set<string>();
  for (const text of texts) {
    for (const m of text.matchAll(LOCAL_REF_RE)) if (isLocalPath(m[1])) refs.add(m[1]);
  }
  return [...refs];
}

function validateQuestion(q: Question, quiz: QuizFile, options: ValidateOptions, push: (i: Issue) => void) {
  const err = (message: string, line = q.line) =>
    push({ severity: 'error', message, line, questionId: q.id, file: quiz.path });
  const warn = (message: string, line = q.line) =>
    push({ severity: 'warning', message, line, questionId: q.id, file: quiz.path });

  if (q.type === 'mcq') {
    if (q.answer !== undefined) err('"answer" is only allowed on true-false questions; mark correct answers with [x].');
    if (q.answers.length < 2) err('A multiple-choice question needs at least 2 answers.');
    if (q.answers.length > 0 && !q.answers.some((a) => a.correct)) err('No correct answer: mark at least one answer with [x].');
    if (q.answers.length > 1 && q.answers.every((a) => a.correct)) warn('Every answer is marked correct.');
    const seen = new Set<string>();
    for (const a of q.answers) {
      const key = a.text.trim().toLowerCase();
      if (seen.has(key)) err(`Duplicate answer "${a.text}".`);
      seen.add(key);
      if (POSITIONAL_ANSWER_RE.test(a.text.trim()))
        warn(`Answer "${a.text}" refers to other answers; it makes no sense once answers are shuffled.`);
    }
    const correct = q.answers.filter((a) => a.correct);
    const wrong = q.answers.filter((a) => !a.correct);
    if (correct.length === 1 && wrong.length >= 2) {
      const longestWrong = Math.max(...wrong.map((a) => plain(a.text).length));
      const len = plain(correct[0].text).length;
      if (len > longestWrong * 1.6 && len - longestWrong > 15)
        warn('The correct answer is much longer than every distractor, which gives it away: rebalance the lengths.');
    }
  } else {
    if (q.answers.length > 0) err('A true-false question must not have an answer list; use "answer: true|false" in its metadata.');
    if (q.answer === undefined) err('A true-false question needs "answer: true" or "answer: false" in its metadata.');
  }

  if (SELF_REFERENCE_RE.test(`${q.title}\n${q.body}`))
    warn('The question refers to another question or to "the text above"; questions are drawn at random and must be self-contained.');

  if (q.sources.length === 0) err('Every question needs at least one "> [!source] <type>" block.');
  for (const s of q.sources) {
    if (!s.body) {
      err(`Empty "${s.type}" source.`, s.line);
      continue;
    }
    if (s.type === 'link' && !/https?:\/\/\S+/.test(s.body) && !/\]\(\s*<?[^)\s]+/.test(s.body))
      err('A "link" source must contain a URL or a markdown link.', s.line);
    if (s.type === 'image' && !/!\[[^\]]*\]\(/.test(s.body)) err('An "image" source must contain a markdown image "![caption](path)".', s.line);
    if (s.type === 'code' && !/^(`{3,}|~{3,})/m.test(s.body)) err('A "code" source must contain a fenced code block.', s.line);
    if (s.type === 'excerpt' && !/^\s*(—|--|-)\s+\S/m.test(s.body))
      warn('An "excerpt" source should end with an attribution line ("— reference").', s.line);
  }

  if (options.mediaExists) {
    for (const ref of localReferences(q)) {
      const resolved = resolveMediaPath(quiz.path, ref);
      if (!options.mediaExists(resolved)) err(`Referenced file "${ref}" was not found (expected at "${resolved}").`);
    }
  }
}

/** Semantic checks on a parsed quiz file. */
export function validateQuiz(quiz: QuizFile, options: ValidateOptions = {}): Issue[] {
  const issues: Issue[] = [];
  const push = (i: Issue) => {
    if (i.file === undefined) delete i.file;
    issues.push(i);
  };
  if (quiz.questions.length === 0)
    push({ severity: 'error', message: 'The quiz contains no valid question.', file: quiz.path });

  const ids = new Map<string, number>();
  const titles = new Map<string, string>();
  for (const q of quiz.questions) {
    const title = `${plain(q.title).toLowerCase()}\n${q.body}`;
    const sameTitle = titles.get(title);
    if (sameTitle !== undefined && sameTitle !== q.id)
      push({ severity: 'warning', message: `Same statement as question "${sameTitle}".`, line: q.line, questionId: q.id, file: quiz.path });
    else titles.set(title, q.id);
    const previous = ids.get(q.id);
    if (previous !== undefined)
      push({
        severity: 'error',
        message: `Duplicate question id "${q.id}" (already used line ${previous}).`,
        line: q.line,
        questionId: q.id,
        file: quiz.path,
      });
    else ids.set(q.id, q.line);
    validateQuestion(q, quiz, options, push);
  }
  return issues;
}

/**
 * Checks that several files sharing the same quiz id are consistent translations:
 * same questions, same types and levels, same correct answers in the same order.
 */
export function validateTranslations(files: QuizFile[]): Issue[] {
  const issues: Issue[] = [];
  if (files.length < 2) return issues;

  const byLang = new Map<string, QuizFile>();
  for (const f of files) {
    if (byLang.has(f.meta.language))
      issues.push({
        severity: 'error',
        message: `Quiz "${f.meta.id}" has two files for language "${f.meta.language}" (${byLang.get(f.meta.language)!.path ?? '?'} and ${f.path ?? '?'}).`,
        file: f.path,
      });
    else byLang.set(f.meta.language, f);
  }

  const [ref, ...others] = [...byLang.values()];
  const refQuestions = new Map(ref.questions.map((q) => [q.id, q]));
  for (const other of others) {
    const otherIds = new Set(other.questions.map((q) => q.id));
    for (const id of refQuestions.keys())
      if (!otherIds.has(id))
        issues.push({
          severity: 'warning',
          message: `Question "${id}" has no "${other.meta.language}" translation.`,
          questionId: id,
          file: other.path,
        });
    for (const q of other.questions) {
      const r = refQuestions.get(q.id);
      const err = (message: string) =>
        issues.push({ severity: 'error', message, line: q.line, questionId: q.id, file: other.path });
      if (!r) {
        issues.push({
          severity: 'warning',
          message: `Question "${q.id}" has no "${ref.meta.language}" version.`,
          line: q.line,
          questionId: q.id,
          file: other.path,
        });
        continue;
      }
      const where = `than in the "${ref.meta.language}" version`;
      if (q.type !== r.type) err(`Question type differs ${where}.`);
      else if (q.type === 'true-false' && q.answer !== r.answer) err(`True/false answer differs ${where}.`);
      else if (q.type === 'mcq') {
        if (q.answers.length !== r.answers.length) err(`Number of answers differs ${where}.`);
        else if (q.answers.some((a, k) => a.correct !== r.answers[k].correct))
          err(`Correct answers are not at the same positions ${where} (answers must be listed in the same order).`);
      }
      if (q.level !== r.level) err(`Level differs ${where}.`);
      if ([...q.tags].sort().join(',') !== [...r.tags].sort().join(','))
        issues.push({
          severity: 'warning',
          message: `Tags differ ${where} (tags are identifiers and should not be translated).`,
          line: q.line,
          questionId: q.id,
          file: other.path,
        });
    }
  }
  return issues;
}

export interface LoadResult {
  /** The quiz with invalid questions removed, or null if the file is unusable. */
  quiz: QuizFile | null;
  issues: Issue[];
}

/** Parses and validates a file, keeping only the questions without errors. */
export function loadQuiz(text: string, options: ValidateOptions & { path?: string } = {}): LoadResult {
  const { quiz, issues } = parseQuiz(text, { path: options.path });
  if (!quiz) return { quiz, issues };
  const semantic = validateQuiz(quiz, options);
  const all = [...issues, ...semantic];
  const broken = new Set(all.filter((i) => i.severity === 'error' && i.questionId).map((i) => i.questionId));
  const seen = new Set<string>();
  const questions = quiz.questions.filter((q) => {
    if (broken.has(q.id) || seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
  return { quiz: questions.length ? { ...quiz, questions } : null, issues: all };
}

export function formatIssue(i: Issue): string {
  const where = [i.file, i.line].filter((x) => x !== undefined).join(':');
  return `${i.severity.toUpperCase()}${where ? ` ${where}` : ''}${i.questionId ? ` [${i.questionId}]` : ''}: ${i.message}`;
}
