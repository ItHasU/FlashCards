import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';
import JSZip from 'jszip';
import { parseQuiz, type Question } from '../format/src';

export const EXAMPLES = fileURLToPath(new URL('../examples', import.meta.url));

/** Every example question, indexed by its title in each language. */
export const QUESTIONS = new Map<string, Question>();
for (const dir of readdirSync(EXAMPLES)) {
  for (const f of readdirSync(join(EXAMPLES, dir)).filter((n) => n.endsWith('.md'))) {
    for (const q of parseQuiz(readFileSync(join(EXAMPLES, dir, f), 'utf8')).quiz!.questions) QUESTIONS.set(q.title.trim(), q);
  }
}

export async function currentQuestion(page: Page): Promise<Question> {
  const title = (await page.locator('.question-title').innerText()).trim();
  const q = [...QUESTIONS.entries()].find(([t]) => stripMarkdown(t) === title)?.[1];
  if (!q) throw new Error(`Unknown question on screen: ${title}`);
  return q;
}

function stripMarkdown(text: string): string {
  return text.replace(/[`*_]/g, '').trim();
}

/** Clicks the answers of the current question, correctly or not. */
export async function answer(page: Page, correctly: boolean): Promise<void> {
  const q = await currentQuestion(page);
  if (q.type === 'true-false') {
    const pickTrue = correctly ? q.answer : !q.answer;
    await page.locator('.answer').nth(pickTrue ? 0 : 1).click();
    return;
  }
  const texts = await page.locator('.answer .answer-text').allInnerTexts();
  const indexOf = (screen: string) => q.answers.findIndex((a) => stripMarkdown(a.text) === screen.trim());
  const picks = texts
    .map((text, pos) => ({ pos, answer: q.answers[indexOf(text)] }))
    .filter(({ answer }) => (correctly ? answer.correct : !answer.correct));
  for (const { pos } of correctly ? picks : picks.slice(0, 1)) await page.locator('.answer').nth(pos).click();
}

export async function loadExample(page: Page, title: string | RegExp): Promise<void> {
  await page.locator('.example', { hasText: title }).click();
  await expect(page.locator('.screen-config')).toBeVisible();
}

export async function setCount(page: Page, n: number): Promise<void> {
  await page.locator('.count-input').fill(String(n));
  await page.locator('.count-input').dispatchEvent('change');
}

/** Builds an in-memory .zip of an example folder, as the package script would. */
export async function exampleZip(dir: string): Promise<Buffer> {
  const zip = new JSZip();
  const add = (rel: string) => {
    const abs = join(EXAMPLES, dir, rel);
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const path = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) add(path);
      else zip.file(path, readFileSync(join(abs, entry.name)));
    }
  };
  add('');
  return zip.generateAsync({ type: 'nodebuffer' });
}

export const md = (text: string) => ({ name: 'custom.md', mimeType: 'text/markdown', buffer: Buffer.from(text) });
