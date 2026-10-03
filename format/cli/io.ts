import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import JSZip from 'jszip';
import { loadQuiz, validateTranslations, type Issue, type QuizFile } from '../src';

export interface LoadedQuiz {
  quiz: QuizFile;
  /** Absolute path of the source on disk (the zip for zipped files). */
  origin: string;
  /** Absolute directory used to resolve media on disk (undefined for zip entries). */
  baseDir?: string;
}

export interface LoadReport {
  quizzes: LoadedQuiz[];
  issues: Issue[];
}

const toPosix = (p: string) => p.split(sep).join('/');
const hasFrontMatter = (text: string) => /^﻿?---\r?\n/.test(text);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.') || e.name === 'node_modules') return [];
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

/** Loads quiz files from .md files, folders (recursively) and .zip bundles. */
export async function loadInputs(inputs: string[], cwd = process.cwd()): Promise<LoadReport> {
  const report: LoadReport = { quizzes: [], issues: [] };

  const addText = (text: string, display: string, origin: string, mediaExists: (p: string) => boolean, baseDir?: string) => {
    const { quiz, issues } = loadQuiz(text, { path: display, mediaExists });
    report.issues.push(...issues);
    if (quiz) report.quizzes.push({ quiz, origin, baseDir });
  };

  // Media paths are resolved against the display path (relative to cwd, or absolute outside of it).
  const addDiskFile = (text: string, abs: string) => {
    const rel = relative(cwd, abs);
    const display = rel.startsWith('..') ? toPosix(abs) : toPosix(rel);
    addText(text, display, abs, (p) => existsSync(display.startsWith('/') ? `/${p}` : join(cwd, p)), dirname(abs));
  };

  for (const input of inputs) {
    const abs = resolve(cwd, input);
    if (!existsSync(abs)) {
      report.issues.push({ severity: 'error', message: `No such file or directory: ${input}` });
      continue;
    }
    if (statSync(abs).isDirectory()) {
      const files = walk(abs).filter((f) => f.endsWith('.md'));
      let found = 0;
      for (const f of files) {
        const text = readFileSync(f, 'utf8');
        if (!hasFrontMatter(text)) continue;
        found++;
        addDiskFile(text, f);
      }
      for (const z of walk(abs).filter((f) => f.endsWith('.zip'))) await addZip(z);
      if (!found && !walk(abs).some((f) => f.endsWith('.zip')))
        report.issues.push({ severity: 'error', message: `No quiz file found in ${input}` });
    } else if (abs.endsWith('.zip')) {
      await addZip(abs);
    } else {
      addDiskFile(readFileSync(abs, 'utf8'), abs);
    }
  }

  async function addZip(abs: string) {
    const zip = await JSZip.loadAsync(readFileSync(abs));
    const entries = new Set(Object.values(zip.files).filter((f) => !f.dir).map((f) => f.name));
    let found = 0;
    for (const name of entries) {
      if (!name.endsWith('.md') || name.startsWith('__MACOSX/')) continue;
      const text = await zip.file(name)!.async('string');
      if (!hasFrontMatter(text)) continue;
      found++;
      // Display "bundle.zip:dir/quiz.md"; media paths resolve to "bundle.zip:dir/media/x.png".
      const prefix = `${basename(abs)}:`;
      addText(text, prefix + name, abs, (p) => entries.has(p.startsWith(prefix) ? p.slice(prefix.length) : p));
    }
    if (!found) report.issues.push({ severity: 'error', message: `No quiz file found in ${basename(abs)}` });
  }

  report.issues.push(...checkTranslations(report.quizzes.map((q) => q.quiz)));
  return report;
}

export function groupById(quizzes: QuizFile[]): Map<string, QuizFile[]> {
  const groups = new Map<string, QuizFile[]>();
  for (const q of quizzes) groups.set(q.meta.id, [...(groups.get(q.meta.id) ?? []), q]);
  return groups;
}

function checkTranslations(quizzes: QuizFile[]): Issue[] {
  return [...groupById(quizzes).values()].flatMap((files) => validateTranslations(files));
}
