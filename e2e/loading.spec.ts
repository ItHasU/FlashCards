import { expect, test } from '@playwright/test';
import { exampleFiles, exampleZip, loadExample, md } from './helpers';

test.describe('loading quizzes', () => {
  test('home page offers loading, without an examples menu', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('.example')).toHaveCount(0);
    await expect(page.locator('.dropzone')).toContainText('Drop .md or .zip quiz files here');
    await expect(page.getByText('Files stay in your browser')).toBeVisible();
  });

  test('loads an example and describes it', async ({ page }) => {
    await page.goto('./');
    await loadExample(page, 'The TCP three-way handshake');
    const choice = page.locator('.quiz-choice');
    await expect(choice).toHaveCount(1);
    await expect(choice).toContainText('6 questions');
    await expect(choice).toContainText('English, French');
    await expect(page.locator('.available')).toHaveText('6 matching questions');
  });

  test('mixes several quizzes', async ({ page }) => {
    await page.goto('./');
    await loadExample(page, 'The TCP three-way handshake');
    await page.getByRole('button', { name: 'Add quizzes' }).click();
    await page.locator('input[type=file]').setInputFiles(exampleFiles('JavaScript closures'));
    await expect(page.locator('.quiz-choice')).toHaveCount(2);
    await expect(page.locator('.available')).toHaveText('10 matching questions');
    await page.locator('.quiz-choice input').first().uncheck();
    await expect(page.locator('.available')).toHaveText('4 matching questions');
  });

  test('loads quizzes from ?quiz= URLs', async ({ page }) => {
    await page.goto('./?quiz=examples/tcp-handshake/quiz.en.md&quiz=examples/tcp-handshake/quiz.fr.md');
    await expect(page.locator('.screen-config')).toBeVisible();
    await expect(page.locator('.quiz-choice')).toContainText('English, French');
  });

  test('loads a zip with media and renders images from it', async ({ page }) => {
    await page.goto('./');
    await page.locator('input[type=file]').setInputFiles({ name: 'tcp.zip', mimeType: 'application/zip', buffer: await exampleZip('tcp-handshake') });
    await expect(page.locator('.quiz-choice')).toContainText('6 questions');
    await page.locator('.chip', { hasText: 'handshake' }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'Show the answer (0 points)' }).click();
    const img = page.locator('.source-image img').first();
    await expect(img).toHaveAttribute('src', /^blob:/);
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  });

  test('keeps valid questions and reports invalid ones', async ({ page }) => {
    await page.goto('./');
    await page.locator('input[type=file]').setInputFiles(
      md(`---
format: 1
id: custom
title: Custom
language: en
---

## Valid question
<!-- id: ok | level: 1 | type: true-false | answer: true -->

> [!source] link
> https://example.com

## No source
<!-- id: broken | level: 1 -->

- [x] a
- [ ] b
`),
    );
    await expect(page.locator('.quiz-choice')).toContainText('1 questions');
    await page.locator('.issues summary').click();
    await expect(page.locator('.issues li.error')).toContainText('[broken]');
  });

  test('explains when nothing usable was loaded', async ({ page }) => {
    await page.goto('./');
    await page.locator('input[type=file]').setInputFiles(md('# Just a title\n'));
    await expect(page.locator('.failures')).toContainText('No usable quiz');
    await expect(page.locator('.issues li.error')).toHaveCount(1);
  });

  test('unloads everything', async ({ page }) => {
    await page.goto('./');
    await loadExample(page, 'JavaScript closures');
    await page.getByRole('button', { name: 'Unload all' }).click();
    await expect(page.locator('.screen-home')).toBeVisible();
    await page.locator('input[type=file]').setInputFiles(exampleFiles('The TCP three-way handshake'));
    await expect(page.locator('.quiz-choice')).toHaveCount(1);
  });
});
