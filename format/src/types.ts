/** Version of the quiz file format described in docs/format.md. */
export const FORMAT_VERSION = 1;

export const LEVELS = [1, 2, 3] as const;
export type Level = (typeof LEVELS)[number];

export const QUESTION_TYPES = ['mcq', 'true-false'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SOURCE_TYPES = ['link', 'excerpt', 'image', 'code'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export interface Source {
  type: SourceType;
  /** Markdown content of the source block. */
  body: string;
  line: number;
}

export interface Answer {
  /** Markdown content of the answer. */
  text: string;
  correct: boolean;
}

export interface Question {
  id: string;
  level: Level;
  type: QuestionType;
  tags: string[];
  /** Heading text (inline markdown). */
  title: string;
  /** Optional extra statement below the heading (block markdown). */
  body: string;
  /** Answers in authoring order. Empty for true/false questions. */
  answers: Answer[];
  /** Expected answer of a true/false question. */
  answer?: boolean;
  /** Optional explanation (block markdown). */
  explanation: string;
  sources: Source[];
  /** 1-based line of the heading in the file. */
  line: number;
}

export interface QuizMeta {
  format: number;
  /** Identifier shared by all translations of the same quiz. */
  id: string;
  title: string;
  description?: string;
  /** BCP 47 language tag of this file, e.g. "fr" or "en". */
  language: string;
  generated_at?: string;
  generator?: string;
  sources?: string[];
  [key: string]: unknown;
}

export interface QuizFile {
  meta: QuizMeta;
  questions: Question[];
  /** Path of the file (inside a zip or on disk), used in messages and to resolve media. */
  path?: string;
}

export type Severity = 'error' | 'warning';

export interface Issue {
  severity: Severity;
  message: string;
  file?: string;
  line?: number;
  questionId?: string;
}
