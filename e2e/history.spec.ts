import { expect, test } from '@playwright/test';
import { exampleFiles, exampleUrl, loadExample, md } from './helpers';

const history = '.history .history-entry';

test.describe('history of loaded quizzes', () => {
  test('a quiz loaded from a URL is remembered and can be reopened after a reload', async ({ page }) => {
    await loadExample(page, 'The TCP three-way handshake');
    await page.goto('./');
    await expect(page.locator(history)).toHaveCount(1);
    await expect(page.locator(history)).toContainText('The TCP three-way handshake');
    await expect(page.locator(history)).toContainText('6 questions · EN, FR · URL');
    await expect(page.locator('.history')).toContainText('Kept in this browser only.');

    await page.locator('.history-open').click();
    await expect(page.locator('.screen-config')).toBeVisible();
    await expect(page.locator('.quiz-choice')).toContainText('The TCP three-way handshake');
  });

  test('dropped files are stored and reopened without the original files', async ({ page }) => {
    await page.goto('./');
    await page.locator('input[type=file]').setInputFiles(exampleFiles('JavaScript closures'));
    await expect(page.locator('.screen-config')).toBeVisible();

    await page.goto('./');
    await expect(page.locator(history)).toContainText('JavaScript closures');
    await expect(page.locator(history)).toContainText('file: quiz.en.md');
    await page.locator('.history-open').click();
    await expect(page.locator('.quiz-choice')).toContainText('4 questions');
  });

  test('reloading the same quizzes moves them to the top; entries can be removed or cleared', async ({ page }) => {
    await page.goto(exampleUrl('The TCP three-way handshake'));
    await expect(page.locator('.screen-config')).toBeVisible();
    await page.goto(exampleUrl('JavaScript closures'));
    await expect(page.locator('.screen-config')).toBeVisible();
    await page.goto(exampleUrl('The TCP three-way handshake'));
    await expect(page.locator('.screen-config')).toBeVisible();

    await page.goto('./');
    await expect(page.locator(history)).toHaveCount(2);
    await expect(page.locator('.history-open strong')).toHaveText(['The TCP three-way handshake', 'JavaScript closures']);

    await page.getByRole('button', { name: 'Remove from history' }).first().click();
    await expect(page.locator('.history-open strong')).toHaveText(['JavaScript closures']);
    await page.reload();
    await expect(page.locator(history)).toHaveCount(1);

    await page.getByRole('button', { name: 'Clear history' }).click();
    await expect(page.locator('.history')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('.history')).toHaveCount(0);
  });

  test('files too large to be kept stay listed, but must be dropped again', async ({ page }) => {
    const big = `---\nformat: 1\nid: big\ntitle: Big quiz\nlanguage: en\n---\n\n## Big?\n<!-- id: b1 | level: 1 | type: true-false | answer: true -->\n\n${'x'.repeat(1_600_000)}\n\n> [!source] link\n> https://example.com\n`;
    await page.goto('./');
    await page.locator('input[type=file]').setInputFiles({ ...md(big), name: 'big.md' });
    await expect(page.locator('.screen-config')).toBeVisible();

    await page.goto('./');
    await expect(page.locator(history)).toContainText('Big quiz');
    await expect(page.locator('.history-open')).toBeDisabled();
    await expect(page.locator(history)).toContainText('Too large to be kept: drop the file again.');
  });

  test('the history follows the selected language', async ({ page }) => {
    await loadExample(page, 'The TCP three-way handshake');
    await page.goto('./');
    await page.locator('.lang select').selectOption('fr');
    await expect(page.locator('.history h2')).toHaveText('Chargés récemment');
    await expect(page.locator('.history-open strong')).toHaveText('La poignée de main TCP en trois temps');
  });
});
