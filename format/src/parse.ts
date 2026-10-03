import { parse as parseYaml } from 'yaml';
import {
  LEVELS,
  QUESTION_TYPES,
  SOURCE_TYPES,
  type Answer,
  type Issue,
  type Level,
  type Question,
  type QuestionType,
  type QuizFile,
  type QuizMeta,
  type Source,
  type SourceType,
} from './types';

export interface ParseResult {
  /** Null when the file cannot be used at all (e.g. no front-matter). */
  quiz: QuizFile | null;
  issues: Issue[];
}

const H2_RE = /^##\s+(.+?)\s*#*\s*$/;
const META_RE = /^<!--(.*)-->\s*$/;
const ANSWER_RE = /^[-*+]\s+\[([ xX])\]\s+(.*)$/;
const CALLOUT_RE = /^>\s*\[!([A-Za-z][\w-]*)\]\s*(.*)$/;
const FENCE_RE = /^\s*(`{3,}|~{3,})/;
const ID_RE = /^[A-Za-z0-9][\w.-]*$/;
const META_KEYS = new Set(['id', 'level', 'type', 'tags', 'answer']);

/** Tracks whether we are inside a fenced code block. */
class FenceTracker {
  private marker: string | null = null;

  get open(): boolean {
    return this.marker !== null;
  }

  /** Feeds a line; returns true when the line belongs to (or delimits) a code block. */
  feed(line: string): boolean {
    const m = FENCE_RE.exec(line);
    if (this.marker === null) {
      if (m) this.marker = m[1];
      return m !== null;
    }
    if (m && m[1][0] === this.marker[0] && m[1].length >= this.marker.length && line.trim() === m[1]) {
      this.marker = null;
    }
    return true;
  }
}

function trimBlankLines(lines: string[]): string {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start++;
  while (end > start && lines[end - 1].trim() === '') end--;
  return lines.slice(start, end).join('\n');
}

function dedent(lines: string[]): string[] {
  const indents = lines.filter((l) => l.trim() !== '').map((l) => /^\s*/.exec(l)![0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(Math.min(min, /^\s*/.exec(l)![0].length)));
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface FrontMatter {
  data: Record<string, unknown>;
  /** Index of the first line after the closing delimiter. */
  bodyStart: number;
}

function readFrontMatter(lines: string[], issue: (i: Omit<Issue, 'file'>) => void): FrontMatter | null {
  if (lines[0]?.trim() !== '---') {
    issue({ severity: 'error', message: 'The file must start with a YAML front-matter block delimited by "---".', line: 1 });
    return null;
  }
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (end < 0) {
    issue({ severity: 'error', message: 'The front-matter block is not closed by a "---" line.', line: 1 });
    return null;
  }
  let data: unknown;
  try {
    data = parseYaml(lines.slice(1, end).join('\n'));
  } catch (e) {
    issue({ severity: 'error', message: `Invalid YAML in front-matter: ${(e as Error).message}`, line: 2 });
    return null;
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    issue({ severity: 'error', message: 'The front-matter must be a YAML mapping (key: value).', line: 2 });
    return null;
  }
  return { data: data as Record<string, unknown>, bodyStart: end + 1 };
}

function readMeta(fm: Record<string, unknown>, issue: (i: Omit<Issue, 'file'>) => void): QuizMeta | null {
  const meta = { ...fm } as QuizMeta;
  let ok = true;

  if (fm.format === undefined) {
    issue({ severity: 'warning', message: 'Missing "format" in front-matter; assuming format 1.', line: 1 });
    meta.format = 1;
  } else if (fm.format !== 1) {
    issue({ severity: 'error', message: `Unsupported format version "${String(fm.format)}" (expected 1).`, line: 1 });
    ok = false;
  }

  if (typeof fm.title !== 'string' || fm.title.trim() === '') {
    issue({ severity: 'error', message: 'Missing "title" in front-matter.', line: 1 });
    ok = false;
  }

  if (typeof fm.language !== 'string' || !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(fm.language)) {
    issue({
      severity: 'error',
      message: 'Missing or invalid "language" in front-matter (expected a BCP 47 tag such as "fr" or "en").',
      line: 1,
    });
    ok = false;
  }

  if (fm.id === undefined) {
    const derived = typeof fm.title === 'string' ? slugify(fm.title) : '';
    if (derived) {
      issue({ severity: 'warning', message: `Missing "id" in front-matter; using "${derived}".`, line: 1 });
      meta.id = derived;
    } else {
      issue({ severity: 'error', message: 'Missing "id" in front-matter.', line: 1 });
      ok = false;
    }
  } else if (typeof fm.id !== 'string' || !ID_RE.test(fm.id)) {
    issue({ severity: 'error', message: `Invalid quiz "id" "${String(fm.id)}" (letters, digits, "-", "_", "." only).`, line: 1 });
    ok = false;
  }

  if (fm.generated_at instanceof Date) meta.generated_at = fm.generated_at.toISOString().slice(0, 10);
  if (fm.sources !== undefined && !(Array.isArray(fm.sources) && fm.sources.every((s) => typeof s === 'string'))) {
    issue({ severity: 'warning', message: '"sources" in front-matter should be a list of strings; ignored.', line: 1 });
    delete meta.sources;
  }
  return ok ? meta : null;
}

function parseMetaComment(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of raw.split('|')) {
    const idx = part.indexOf(':');
    if (idx < 0) {
      if (part.trim()) map.set(part.trim(), '');
      continue;
    }
    map.set(part.slice(0, idx).trim().toLowerCase(), part.slice(idx + 1).trim());
  }
  return map;
}

interface Callout {
  kind: string;
  arg: string;
  lines: string[];
  line: number;
}

/** Parses one "## question" section. `start` is the 0-based index of the heading line. */
function parseQuestion(
  lines: string[],
  start: number,
  end: number,
  issue: (i: Omit<Issue, 'file'>) => void,
): Question | null {
  const title = H2_RE.exec(lines[start])![1];
  const headingLine = start + 1;
  let qid: string | undefined;
  const err = (message: string, line = headingLine) =>
    issue({ severity: 'error', message, line, questionId: qid });
  const warn = (message: string, line = headingLine) =>
    issue({ severity: 'warning', message, line, questionId: qid });

  let i = start + 1;
  while (i < end && lines[i].trim() === '') i++;
  const metaMatch = i < end ? META_RE.exec(lines[i].trim()) : null;
  if (!metaMatch) {
    err(`Question "${title}" has no metadata comment (expected "<!-- id: ... | level: ... -->" right below the heading).`);
    return null;
  }
  const meta = parseMetaComment(metaMatch[1]);
  const metaLine = i + 1;
  i++;

  qid = meta.get('id');
  let valid = true;
  if (!qid) {
    err('Missing "id" in question metadata.', metaLine);
    valid = false;
  } else if (!ID_RE.test(qid)) {
    err(`Invalid question id "${qid}" (letters, digits, "-", "_", "." only).`, metaLine);
    valid = false;
  }

  const levelRaw = meta.get('level');
  const level = Number(levelRaw);
  if (!(LEVELS as readonly number[]).includes(level)) {
    err(`Invalid or missing level "${levelRaw ?? ''}" (expected 1, 2 or 3).`, metaLine);
    valid = false;
  }

  const typeRaw = meta.get('type') ?? 'mcq';
  if (!(QUESTION_TYPES as readonly string[]).includes(typeRaw)) {
    err(`Unknown question type "${typeRaw}" (expected "mcq" or "true-false").`, metaLine);
    valid = false;
  }
  const type = typeRaw as QuestionType;

  let answer: boolean | undefined;
  const answerRaw = meta.get('answer');
  if (answerRaw !== undefined) {
    if (answerRaw === 'true' || answerRaw === 'false') answer = answerRaw === 'true';
    else {
      err(`Invalid "answer" value "${answerRaw}" (expected "true" or "false").`, metaLine);
      valid = false;
    }
  }

  for (const key of meta.keys()) {
    if (!META_KEYS.has(key)) warn(`Unknown metadata key "${key}" ignored.`, metaLine);
  }

  const tags = (meta.get('tags') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // Body, then answers, then callouts.
  const body: string[] = [];
  const answers: { correct: boolean; lines: string[] }[] = [];
  const callouts: Callout[] = [];
  let phase: 'body' | 'answers' | 'callouts' = 'body';
  let callout: Callout | null = null;
  let pendingBlank = 0;
  const fence = new FenceTracker();

  for (; i < end; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (fence.open) {
      fence.feed(line);
      if (phase === 'answers') answers[answers.length - 1].lines.push(line);
      else body.push(line);
      continue;
    }

    const calloutMatch = CALLOUT_RE.exec(line);
    if (calloutMatch) {
      callout = { kind: calloutMatch[1].toLowerCase(), arg: calloutMatch[2].trim(), lines: [], line: lineNo };
      callouts.push(callout);
      phase = 'callouts';
      continue;
    }
    if (callout && line.startsWith('>')) {
      callout.lines.push(line.replace(/^>\s?/, ''));
      continue;
    }
    if (line.trim() === '') {
      callout = null;
      if (phase === 'body') body.push(line);
      else if (phase === 'answers') pendingBlank++;
      continue;
    }

    const answerMatch = phase !== 'callouts' ? ANSWER_RE.exec(line) : null;
    if (answerMatch) {
      answers.push({ correct: answerMatch[1] !== ' ', lines: [answerMatch[2]] });
      phase = 'answers';
      pendingBlank = 0;
      continue;
    }
    if (phase === 'answers' && /^\s{2,}\S/.test(line)) {
      const current = answers[answers.length - 1];
      for (; pendingBlank > 0; pendingBlank--) current.lines.push('');
      current.lines.push(line);
      fence.feed(line);
      continue;
    }
    if (phase === 'body') {
      body.push(line);
      fence.feed(line);
      continue;
    }
    if (callout) {
      err('Lines inside a "> [!...]" block must start with ">".', lineNo);
    } else if (phase === 'answers') {
      err('Unexpected content after the answers (only answers and "> [!...]" blocks are allowed there).', lineNo);
    } else {
      err('Unexpected content after the explanation/source blocks.', lineNo);
    }
    valid = false;
  }

  const parsedAnswers: Answer[] = answers.map((a) => ({
    correct: a.correct,
    text: trimBlankLines([a.lines[0], ...dedent(a.lines.slice(1))]),
  }));

  let explanation = '';
  const sources: Source[] = [];
  for (const c of callouts) {
    const content = trimBlankLines(c.lines);
    if (c.kind === 'explanation') {
      if (explanation) {
        err('Only one "> [!explanation]" block is allowed per question.', c.line);
        valid = false;
      }
      explanation = content;
    } else if (c.kind === 'source') {
      if (!(SOURCE_TYPES as readonly string[]).includes(c.arg)) {
        err(`Unknown source type "${c.arg}" (expected one of: ${SOURCE_TYPES.join(', ')}).`, c.line);
        valid = false;
        continue;
      }
      sources.push({ type: c.arg as SourceType, body: content, line: c.line });
    } else {
      err(`Unknown block "> [!${c.kind}]" (expected "explanation" or "source").`, c.line);
      valid = false;
    }
  }

  if (!valid) return null;
  return {
    id: qid!,
    level: level as Level,
    type,
    tags,
    title,
    body: trimBlankLines(body),
    answers: parsedAnswers,
    answer,
    explanation,
    sources,
    line: headingLine,
  };
}

/** Parses the structure of a quiz markdown file. Semantic checks live in validate.ts. */
export function parseQuiz(text: string, options: { path?: string } = {}): ParseResult {
  const issues: Issue[] = [];
  const issue = (i: Omit<Issue, 'file'>) => issues.push(options.path ? { ...i, file: options.path } : i);
  const lines = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');

  const fm = readFrontMatter(lines, issue);
  if (!fm) return { quiz: null, issues };
  const meta = readMeta(fm.data, issue);
  if (!meta) return { quiz: null, issues };

  const headings: number[] = [];
  const fence = new FenceTracker();
  for (let i = fm.bodyStart; i < lines.length; i++) {
    if (fence.feed(lines[i])) continue;
    if (H2_RE.test(lines[i])) headings.push(i);
  }

  const questions: Question[] = [];
  headings.forEach((start, k) => {
    const q = parseQuestion(lines, start, headings[k + 1] ?? lines.length, issue);
    if (q) questions.push(q);
  });

  return { quiz: { meta, questions, path: options.path }, issues };
}
