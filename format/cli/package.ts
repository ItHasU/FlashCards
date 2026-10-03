import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import JSZip from 'jszip';
import { formatIssue, localReferences, resolveMediaPath } from '../src';
import { loadInputs } from './io';

const USAGE = `Usage: package.mjs [--force] -o <bundle.zip> <quiz.md | folder>...

Validates the quiz files, then writes a .zip with the Markdown files and every
local file they reference (images, PDFs…), keeping relative paths.
  --force   package even when the validator reports errors`;

async function main(argv: string[]) {
  const outIdx = argv.findIndex((a) => a === '-o' || a === '--output');
  const out = outIdx >= 0 ? argv[outIdx + 1] : undefined;
  const rest = argv.filter((_, i) => i !== outIdx && i !== outIdx + 1);
  const force = rest.includes('--force');
  const inputs = rest.filter((a) => !a.startsWith('--'));
  if (!out || inputs.length === 0 || rest.includes('--help')) {
    console.log(USAGE);
    return rest.includes('--help') ? 0 : 2;
  }

  const { quizzes, issues } = await loadInputs(inputs);
  for (const i of issues) console.log(formatIssue(i));
  const errors = issues.filter((i) => i.severity === 'error').length;
  if (errors && !force) {
    console.log(`\n${errors} error(s): fix them or use --force. Nothing written.`);
    return 1;
  }
  const onDisk = quizzes.filter((q) => q.baseDir);
  if (onDisk.length === 0) {
    console.log('No quiz file to package.');
    return 1;
  }

  // Common root of all quiz files, so that relative paths are preserved inside the zip.
  const dirs = onDisk.map((q) => q.baseDir!);
  let root = dirs[0];
  while (!dirs.every((d) => d === root || d.startsWith(root + sep))) root = dirname(root);

  const zip = new JSZip();
  const added = new Set<string>();
  const add = (abs: string) => {
    const name = relative(root, abs).split(sep).join('/');
    if (name.startsWith('..')) throw new Error(`${abs} is outside of ${root}; move it next to the quiz file.`);
    if (added.has(name)) return;
    added.add(name);
    zip.file(name, readFileSync(abs));
  };
  for (const { quiz, origin } of onDisk) {
    add(origin);
    for (const q of quiz.questions)
      for (const ref of localReferences(q)) add(resolve(dirname(origin), resolveMediaPath(undefined, ref)));
  }

  const data = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  writeFileSync(out, data);
  console.log(`\nWrote ${out} (${added.size} files, ${(data.length / 1024).toFixed(1)} KiB):`);
  for (const name of [...added].sort()) console.log(`  ${name}`);
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(2);
  },
);

