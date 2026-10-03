import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { checkExcerpts, formatIssue, htmlToText, normalizeForMatch, quizAdvice, quizStats, type Issue, type QuizFile } from '../src';
import { groupById, loadInputs } from './io';

const USAGE = `Usage: validate.mjs [options] <quiz.md | folder | bundle.zip>...

Checks FlashCards quiz files (format v1, see docs/format.md or references/format.md).

Options:
  --sources <path>  text material the quiz was built from (file or folder, repeatable).
                    Every "excerpt" source is then checked to appear word for word in it.
                    Supported: Markdown, text, HTML, code, JSON/YAML… (convert PDF/DOCX to text first).
  --strict          treat warnings as errors (exit code 1)
  --json            print a machine-readable report (issues, statistics, advice)
  --help            show this help

Exit code: 0 = valid, 1 = errors (or warnings with --strict), 2 = usage error.`;

const TEXT_EXTENSIONS = new Set(
  'md markdown mdx txt text rst adoc asciidoc org tex html htm xhtml xml json yaml yml toml csv tsv ini cfg conf ts tsx js jsx mjs cjs py java kt kts go rs c h cc cpp hpp cs rb php swift scala sh bash zsh ps1 sql css scss less vue svelte dart lua r m pl ex exs erl hs clj'.split(' '),
);
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

interface SourceCorpus {
  text: string;
  files: number;
  skipped: string[];
}

function readSources(paths: string[]): SourceCorpus {
  const corpus: SourceCorpus = { text: '', files: 0, skipped: [] };
  const parts: string[] = [];
  const visit = (p: string) => {
    if (!existsSync(p)) {
      corpus.skipped.push(`${p} (not found)`);
      return;
    }
    if (statSync(p).isDirectory()) {
      for (const e of readdirSync(p)) if (!e.startsWith('.') && e !== 'node_modules') visit(join(p, e));
      return;
    }
    const ext = extname(p).slice(1).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) {
      corpus.skipped.push(`${p} (unsupported type${ext ? ` .${ext}` : ''}: convert it to text)`);
      return;
    }
    if (statSync(p).size > MAX_SOURCE_BYTES) {
      corpus.skipped.push(`${p} (too large)`);
      return;
    }
    const raw = readFileSync(p, 'utf8');
    parts.push(/^x?html?$/.test(ext) ? htmlToText(raw) : raw);
    corpus.files++;
  };
  for (const p of paths) visit(resolve(p));
  corpus.text = normalizeForMatch(parts.join('\n'));
  return corpus;
}

function parseArgs(argv: string[]) {
  const flags = new Set<string>();
  const inputs: string[] = [];
  const sources: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--sources' || a === '--source') {
      if (!argv[i + 1]) throw new Error(`${a} needs a path`);
      sources.push(argv[++i]);
    } else if (a.startsWith('--sources=')) sources.push(a.slice('--sources='.length));
    else if (a.startsWith('--')) flags.add(a);
    else inputs.push(a);
  }
  return { flags, inputs, sources };
}

function summarize(id: string, files: QuizFile[]) {
  const main = files.reduce((a, b) => (b.questions.length > a.questions.length ? b : a));
  const stats = quizStats(main);
  return { id, title: main.meta.title, languages: files.map((f) => f.meta.language), stats, advice: quizAdvice(stats) };
}

async function main(argv: string[]) {
  let args: ReturnType<typeof parseArgs>;
  try {
    args = parseArgs(argv);
  } catch (e) {
    console.error((e as Error).message);
    return 2;
  }
  const { flags, inputs, sources } = args;
  if (flags.has('--help') || inputs.length === 0) {
    console.log(USAGE);
    return flags.has('--help') ? 0 : 2;
  }

  const { quizzes, issues } = await loadInputs(inputs);
  let corpus: SourceCorpus | undefined;
  if (sources.length) {
    corpus = readSources(sources);
    if (corpus.files === 0) issues.push({ severity: 'error', message: `No readable text in --sources (${sources.join(', ')}).` });
    else for (const { quiz } of quizzes) issues.push(...checkExcerpts(quiz, corpus.text));
  }

  const errors = issues.filter((i: Issue) => i.severity === 'error').length;
  const warnings = issues.length - errors;
  const ok = errors === 0 && (!flags.has('--strict') || warnings === 0);
  const summaries = [...groupById(quizzes.map((q) => q.quiz))].map(([id, files]) => summarize(id, files));

  if (flags.has('--json')) {
    console.log(
      JSON.stringify(
        {
          ok,
          errors,
          warnings,
          issues,
          quizzes: summaries,
          sources: corpus ? { files: corpus.files, skipped: corpus.skipped } : undefined,
        },
        null,
        2,
      ),
    );
    return ok ? 0 : 1;
  }

  for (const i of issues) console.log(formatIssue(i));
  if (corpus?.skipped.length) console.log(`\nSources skipped:\n${corpus.skipped.map((s) => `  - ${s}`).join('\n')}`);
  for (const s of summaries) {
    const { stats } = s;
    const levels = `L1: ${stats.byLevel[1]}, L2: ${stats.byLevel[2]}, L3: ${stats.byLevel[3]}`;
    console.log(
      `\n✓ ${s.id} — ${stats.questions} valid questions (${levels}; ${stats.byType['true-false']} true/false, ${stats.multiAnswer} multi-answer) — languages: ${s.languages.join(', ')}`,
    );
    if (corpus) console.log(`  excerpts checked against ${corpus.files} source file(s)`);
    for (const a of s.advice) console.log(`  ADVICE: ${a}`);
  }
  console.log(`\n${errors} error(s), ${warnings} warning(s).`);
  return ok ? 0 : 1;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e) => {
    console.error(e);
    process.exit(2);
  },
);
