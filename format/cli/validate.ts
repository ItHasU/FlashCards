import { formatIssue, LEVELS } from '../src';
import { groupById, loadInputs } from './io';

const USAGE = `Usage: validate.mjs [--strict] [--json] <quiz.md | folder | bundle.zip>...

Checks FlashCards quiz files (format v1, see docs/format.md).
  --strict  treat warnings as errors
  --json    print a machine-readable report`;

async function main(argv: string[]) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const inputs = argv.filter((a) => !a.startsWith('--'));
  if (flags.has('--help') || inputs.length === 0) {
    console.log(USAGE);
    return inputs.length === 0 && !flags.has('--help') ? 2 : 0;
  }

  const { quizzes, issues } = await loadInputs(inputs);
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.length - errors;
  const groups = groupById(quizzes.map((q) => q.quiz));

  if (flags.has('--json')) {
    const summary = [...groups].map(([id, files]) => ({
      id,
      languages: files.map((f) => f.meta.language),
      questions: Math.max(...files.map((f) => f.questions.length)),
    }));
    console.log(JSON.stringify({ ok: errors === 0 && (!flags.has('--strict') || warnings === 0), errors, warnings, issues, quizzes: summary }, null, 2));
  } else {
    for (const i of issues) console.log(formatIssue(i));
    if (issues.length && groups.size) console.log('');
    for (const [id, files] of groups) {
      const main = files.reduce((a, b) => (b.questions.length > a.questions.length ? b : a));
      const byLevel = LEVELS.map((l) => `L${l}: ${main.questions.filter((q) => q.level === l).length}`).join(', ');
      const tf = main.questions.filter((q) => q.type === 'true-false').length;
      console.log(
        `✓ ${id} — ${main.questions.length} valid questions (${byLevel}; ${tf} true/false) — languages: ${files.map((f) => f.meta.language).join(', ')}`,
      );
    }
    console.log(`\n${errors} error(s), ${warnings} warning(s).`);
  }
  return errors > 0 || (flags.has('--strict') && warnings > 0) ? 1 : 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e) => {
    console.error(e);
    process.exit(2);
  },
);
