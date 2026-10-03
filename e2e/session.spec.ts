import { expect, test, type Page } from '@playwright/test';
import { answer, currentQuestion, loadExample, setCount } from './helpers';

async function startWith(page: Page, example: string | RegExp, setup?: () => Promise<void>) {
  await page.goto('./');
  await loadExample(page, example);
  await setup?.();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.question')).toBeVisible();
}

test.describe('configuration', () => {
  test('filters by level, type and topic', async ({ page }) => {
    await page.goto('./');
    await loadExample(page, 'The TCP three-way handshake');
    const available = page.locator('.available');
    await page.locator('.chip', { hasText: 'Discovery' }).click();
    await page.locator('.chip', { hasText: 'Understanding' }).click();
    await expect(available).toHaveText('1 matching questions'); // level 3 only
    await page.locator('.chip', { hasText: 'Discovery' }).click();
    await page.locator('.chip', { hasText: 'Multiple choice' }).click();
    await expect(available).toHaveText('1 matching questions'); // levels 1+3, true/false only
    await page.locator('.chip', { hasText: 'Multiple choice' }).click();
    await page.locator('.chip', { hasText: 'standards' }).click();
    await expect(available).toHaveText('No question matches these filters.');
    await expect(page.getByRole('button', { name: 'Start' })).toBeDisabled();
  });

  test('draws the requested number of questions', async ({ page }) => {
    await startWith(page, 'The TCP three-way handshake', () => setCount(page, 3));
    await expect(page.getByText('Question 1 of 3')).toBeVisible();
  });

  test('caps the number of questions to what is available', async ({ page }) => {
    await page.goto('./');
    await loadExample(page, 'JavaScript closures');
    await setCount(page, 50);
    await expect(page.locator('.count-input')).toHaveValue('4');
  });
});

test.describe('playing', () => {
  test('a perfect run, from first question to results', async ({ page }) => {
    await startWith(page, 'The TCP three-way handshake');
    for (let i = 1; i <= 6; i++) {
      await expect(page.getByText(`Question ${i} of 6`)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Check' })).toBeDisabled();
      await answer(page, true);
      await page.getByRole('button', { name: 'Check' }).click();
      await expect(page.locator('.feedback .verdict')).toHaveText('Correct!');
      await expect(page.locator('.sources .source').first()).toBeVisible();
      await page.getByRole('button', { name: i < 6 ? 'Next question' : 'See results' }).click();
    }
    await expect(page.locator('.score-ring')).toHaveText('100%');
    await expect(page.locator('.score-text')).toHaveText('6 correct answers out of 6');
    await expect(page.locator('.perfect')).toBeVisible();
  });

  test('wrong answers are corrected, listed and can be retried', async ({ page }) => {
    await startWith(page, 'JavaScript closures');
    for (let i = 1; i <= 4; i++) {
      const wrong = i <= 2;
      await answer(page, !wrong);
      await page.getByRole('button', { name: 'Check' }).click();
      await expect(page.locator('.feedback .verdict')).toHaveText(wrong ? 'Not quite.' : 'Correct!');
      if (wrong) {
        await expect(page.locator('.answer.wrong')).toHaveCount(1);
        expect(await page.locator('.answer.missed, .answer.correct').count()).toBeGreaterThan(0);
      }
      await page.getByRole('button', { name: i < 4 ? 'Next question' : 'See results' }).click();
    }
    await expect(page.locator('.score-text')).toHaveText('2 correct answers out of 4');
    await expect(page.locator('.mistake')).toHaveCount(2);
    await page.locator('.mistake summary').first().click();
    await expect(page.locator('.mistake dd.correct').first()).toBeVisible();

    await page.getByRole('button', { name: 'Retry my mistakes' }).click();
    await expect(page.getByText('Question 1 of 2')).toBeVisible();
  });

  test('multiple-answer questions require every correct answer', async ({ page }) => {
    await startWith(page, 'JavaScript closures', async () => {
      await page.locator('.chip', { hasText: 'scope' }).click(); // only js-004 (let, const)
    });
    await expect(page.locator('.hint')).toHaveText('Several answers are correct: select all of them.');
    await expect(page.locator('.answer').first()).toHaveAttribute('role', 'checkbox');
    const q = await currentQuestion(page);
    const texts = await page.locator('.answer-text').allInnerTexts();
    const firstCorrect = texts.findIndex((t) => q.answers.some((a) => a.correct && a.text.replace(/`/g, '') === t.trim()));
    await page.locator('.answer').nth(firstCorrect).click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('.feedback .verdict')).toHaveText('Not quite.');
    await expect(page.locator('.answer.missed')).toHaveCount(1);
  });

  test('true/false questions show True and False buttons', async ({ page }) => {
    await startWith(page, 'The TCP three-way handshake', async () => {
      await page.locator('.chip', { hasText: 'udp' }).click();
    });
    await expect(page.locator('.answer-text')).toHaveText(['True', 'False']);
    await page.getByRole('radio', { name: 'False' }).click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('.feedback .verdict')).toHaveText('Correct!');
  });

  test('answers are shuffled between draws', async ({ page }) => {
    const orders = new Set<string>();
    await page.goto('./');
    await loadExample(page, 'The TCP three-way handshake');
    await page.locator('.chip', { hasText: 'udp' }).click();
    await page.locator('.chip', { hasText: 'udp' }).click(); // reset
    await page.locator('.chip', { hasText: 'standards' }).click(); // tcp-006, 4 answers
    for (let i = 0; i < 8 && orders.size < 2; i++) {
      await page.getByRole('button', { name: i === 0 ? 'Start' : 'New draw, same settings' }).click();
      orders.add((await page.locator('.answer-text').allInnerTexts()).join('|'));
      await page.getByRole('button', { name: 'End session' }).click();
    }
    expect(orders.size).toBeGreaterThan(1);
  });

  test('keyboard: digits select, Enter checks and moves on', async ({ page }) => {
    await startWith(page, 'The TCP three-way handshake', () => setCount(page, 2));
    await page.keyboard.press('1');
    await expect(page.locator('.answer.selected')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(page.locator('.feedback')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Question 2 of 2')).toBeVisible();
  });

  test('sources: external links open in a new tab, excerpts are quoted', async ({ page }) => {
    await startWith(page, 'The FlashCards quiz format', async () => {
      await page.locator('.chip', { hasText: 'levels' }).click(); // fmt-006: excerpt source
    });
    await page.locator('.answer').first().click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('.source-excerpt blockquote')).toBeVisible();
    await expect(page.locator('.source-excerpt')).toContainText('— docs/format.md');
    await page.getByRole('button', { name: 'Next question' }).or(page.getByRole('button', { name: 'See results' })).click();

    await page.getByRole('button', { name: 'Change settings' }).click();
    await page.getByRole('button', { name: 'Add quizzes' }).click();
    await loadExample(page, 'JavaScript closures');
    await page.locator('.chip', { hasText: 'levels' }).click();
    await page.locator('.quiz-choice input').first().uncheck();
    await page.locator('.chip', { hasText: 'scope' }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await page.locator('.answer').first().click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('.source-link a').first()).toHaveAttribute('target', '_blank');
    await expect(page.locator('.source-link a').first()).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('ending a session early counts unanswered questions as mistakes', async ({ page }) => {
    await startWith(page, 'The TCP three-way handshake', () => setCount(page, 3));
    await page.getByRole('button', { name: 'End session' }).click();
    await expect(page.locator('.score-text')).toHaveText('0 correct answers out of 3');
    await expect(page.locator('.mistake')).toHaveCount(3);
  });
});
