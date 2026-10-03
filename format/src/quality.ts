import { LEVELS, QUESTION_TYPES, SOURCE_TYPES, type Issue, type Level, type QuestionType, type QuizFile, type SourceType } from './types';

export interface QuizStats {
  questions: number;
  byLevel: Record<Level, number>;
  byType: Record<QuestionType, number>;
  /** mcq questions with several correct answers. */
  multiAnswer: number;
  /** true-false questions whose answer is true. */
  trueAnswers: number;
  withExplanation: number;
  bySourceType: Record<SourceType, number>;
  byTag: Record<string, number>;
}

export function quizStats(quiz: QuizFile): QuizStats {
  const stats: QuizStats = {
    questions: quiz.questions.length,
    byLevel: Object.fromEntries(LEVELS.map((l) => [l, 0])) as Record<Level, number>,
    byType: Object.fromEntries(QUESTION_TYPES.map((t) => [t, 0])) as Record<QuestionType, number>,
    multiAnswer: 0,
    trueAnswers: 0,
    withExplanation: 0,
    bySourceType: Object.fromEntries(SOURCE_TYPES.map((t) => [t, 0])) as Record<SourceType, number>,
    byTag: {},
  };
  for (const q of quiz.questions) {
    stats.byLevel[q.level]++;
    stats.byType[q.type]++;
    if (q.type === 'mcq' && q.answers.filter((a) => a.correct).length > 1) stats.multiAnswer++;
    if (q.type === 'true-false' && q.answer) stats.trueAnswers++;
    if (q.explanation) stats.withExplanation++;
    for (const s of q.sources) stats.bySourceType[s.type]++;
    for (const t of q.tags) stats.byTag[t] = (stats.byTag[t] ?? 0) + 1;
  }
  return stats;
}

const pct = (n: number, total: number) => Math.round((n / total) * 100);

/** Quiz-level recommendations (balance of levels and types), following the skill guidelines. */
export function quizAdvice(stats: QuizStats): string[] {
  const out: string[] = [];
  const n = stats.questions;
  if (n === 0) return out;
  if (n < 10) out.push(`Only ${n} questions: aim for at least 10 so that sessions can be drawn at random.`);
  if (n >= 10) {
    for (const l of LEVELS) if (stats.byLevel[l] === 0) out.push(`No level ${l} question (recommended mix: ~40 % level 1, ~40 % level 2, ~20 % level 3).`);
    if (pct(stats.byLevel[1], n) > 60) out.push(`${pct(stats.byLevel[1], n)} % of the questions are level 1: add understanding and mastery questions.`);
  }
  const tf = stats.byType['true-false'];
  if (n >= 5 && pct(tf, n) > 30) out.push(`True/false questions are ${pct(tf, n)} % of the quiz (recommended: at most ~25 %).`);
  if (tf >= 4 && (stats.trueAnswers / tf > 0.75 || stats.trueAnswers / tf < 0.25))
    out.push(`${stats.trueAnswers} of ${tf} true/false questions are true: balance true and false statements.`);
  if (n >= 5 && pct(stats.withExplanation, n) < 50) out.push(`Only ${pct(stats.withExplanation, n)} % of the questions have an explanation.`);
  return out;
}

// ---------------------------------------------------------------------------
// Verbatim check of excerpts against source material

// Inline HTML that may appear in Markdown sources. Limited to known tags so that TypeScript generics (Promise<T>) survive.
const INLINE_TAG_RE = /<\/?(a|abbr|b|bdi|br|cite|code|dfn|em|i|kbd|mark|q|s|samp|small|span|strong|sub|sup|u|var|wbr)\b[^>]*>/gi;
// MDN KumaScript macros such as {{JSxRef("Promise/then", "then()")}}: keep the displayed text (last argument).
const MACRO_RE = /\{\{\s*\w+\(\s*((?:"[^"]*"|'[^']*'|[^)])*?)\s*\)\s*\}\}/g;

function macroText(args: string): string {
  const strings = [...args.matchAll(/"([^"]*)"|'([^']*)'/g)].map((m) => m[1] ?? m[2]);
  return strings.length ? strings[strings.length - 1] : '';
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;|&#160;|&#x[aA]0;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&laquo;|&raquo;|&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;|&ndash;/g, '-')
    .replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');
}

/** Normalizes text so that formatting, typography, inline HTML and whitespace do not affect matching. */
export function normalizeForMatch(text: string): string {
  return decodeEntities(text.replace(MACRO_RE, (_, args: string) => macroText(args)).replace(INLINE_TAG_RE, ''))
    .normalize('NFKC')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // markdown links/images: keep the text
    .replace(/[‘’ʼ′]/g, "'")
    .replace(/[“”«»„]/g, '"')
    .replace(/[‐-―]/g, '-')
    .replace(/[*_`]/g, '') // emphasis and code markers: **word**, => word,
    .replace(/[#>|\\]/g, ' ') // headings, blockquotes, table pipes
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Extracts the HTML text content, roughly, for matching purposes. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|td|th|pre|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');
}

const ATTRIBUTION_RE = /^\s*(—|--|-)\s+\S/;
const ELLIPSIS_RE = /\[(?:…|\.\.\.)\]|\(…\)|…/;

/** The quoted parts of an excerpt source: text before the attribution line, without wrapping quotes, split at […]. */
export function excerptFragments(body: string): string[] {
  const lines = body.split('\n');
  const at = lines.findIndex((l) => ATTRIBUTION_RE.test(l));
  let quote = (at >= 0 ? lines.slice(0, at) : lines).join('\n').trim();
  quote = quote.replace(/^["“«„]\s*/, '').replace(/\s*["”»]$/, '');
  return quote
    .split(ELLIPSIS_RE)
    .map(normalizeForMatch)
    .filter((f) => f.length >= 3);
}

/**
 * Warns about excerpts that cannot be found word for word in the source material.
 * `corpus` must be normalized with normalizeForMatch.
 */
export function checkExcerpts(quiz: QuizFile, corpus: string): Issue[] {
  const issues: Issue[] = [];
  for (const q of quiz.questions) {
    for (const s of q.sources) {
      if (s.type !== 'excerpt') continue;
      const missing = excerptFragments(s.body).filter((f) => !corpus.includes(f));
      if (missing.length)
        issues.push({
          severity: 'warning',
          message: `Excerpt not found verbatim in the provided sources: "${missing[0].length > 80 ? `${missing[0].slice(0, 80)}…` : missing[0]}". Quote the source word for word (use […] to cut).`,
          line: s.line,
          questionId: q.id,
          file: quiz.path,
        });
    }
  }
  return issues;
}
