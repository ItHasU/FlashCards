import { expect, test, type Page } from '@playwright/test';
import { answer, currentQuestion, exampleFiles, loadExample, setCount, setFeedback } from './helpers';

async function startWith(page: Page, example: string, setup?: () => Promise<void>, feedback: 'end' | 'immediate' = 'immediate') {
  await loadExample(page, example);
  await setFeedback(page, feedback);
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
      await expect(page.locator('.feedback .verdict')).toContainText('Correct!');
      await expect(page.locator('.sources .source').first()).toBeVisible();
      await page.getByRole('button', { name: i < 6 ? 'Next question' : 'See results' }).click();
    }
    await expect(page.locator('.score-ring')).toHaveText('12');
    await expect(page.locator('.score-text')).toHaveText('12 points out of 12');
    await expect(page.locator('.perfect')).toBeVisible();
  });

  test('wrong answers are corrected, listed and can be retried', async ({ page }) => {
    await startWith(page, 'JavaScript closures');
    for (let i = 1; i <= 4; i++) {
      const wrong = i <= 2;
      await answer(page, !wrong);
      await page.getByRole('button', { name: 'Check' }).click();
      await expect(page.locator('.feedback .verdict')).toContainText(wrong ? 'Not quite.' : 'Correct!');
      if (wrong) {
        await expect(page.locator('.answer.wrong')).toHaveCount(1);
        expect(await page.locator('.answer.missed, .answer.correct').count()).toBeGreaterThan(0);
      }
      await page.getByRole('button', { name: i < 4 ? 'Next question' : 'See results' }).click();
    }
    await expect(page.locator('.score-text')).toHaveText('4 points out of 8'); // 2 × (+2) + 2 × 0
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
    await expect(page.locator('.feedback .verdict')).toContainText('Not quite.');
    await expect(page.locator('.answer.missed')).toHaveCount(1);
  });

  test('true/false questions show True and False buttons', async ({ page }) => {
    await startWith(page, 'The TCP three-way handshake', async () => {
      await page.locator('.chip', { hasText: 'udp' }).click();
    });
    await expect(page.locator('.answer-text')).toHaveText(['True', 'False']);
    await page.getByRole('radio', { name: 'False' }).click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('.feedback .verdict')).toContainText('Correct!');
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
    await page.locator('input[type=file]').setInputFiles(exampleFiles('JavaScript closures'));
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
    await expect(page.locator('.score-text')).toHaveText('0 points out of 6');
    await expect(page.locator('.mistake')).toHaveCount(3);
  });
});

test.describe('feedback modes, hints and points', () => {
  test('by default, answers are only shown at the end, with every question corrected', async ({ page }) => {
    await loadExample(page, 'The TCP three-way handshake');
    await expect(page.getByRole('radio', { name: 'At the end of the quiz' })).toBeChecked();
    await setCount(page, 2);
    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.locator('.running-score')).toHaveCount(0);
    await answer(page, true);
    await expect(page.getByRole('button', { name: 'Check' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Next question' }).click();
    await expect(page.getByText('Question 2 of 2')).toBeVisible();
    await expect(page.locator('.feedback')).toHaveCount(0);
    await answer(page, false);
    await page.keyboard.press('Enter'); // Enter records the answer and moves on

    await expect(page.locator('.score-text')).toHaveText('2 points out of 4'); // +2 + 0
    await expect(page.getByRole('heading', { name: 'Answers' })).toBeVisible();
    await expect(page.locator('.mistake')).toHaveCount(2);
    await expect(page.locator('.mistake.outcome-correct .points')).toHaveText('+2');
    await expect(page.locator('.mistake.outcome-wrong .points')).toHaveText('0');
  });

  test('the hint only shows the sources; answering with it is worth +1 or −1', async ({ page }) => {
    await loadExample(page, 'The TCP three-way handshake');
    await setCount(page, 2);
    await page.getByRole('button', { name: 'Start' }).click(); // "end" mode

    await page.getByRole('button', { name: 'Hint: show the source' }).click();
    await expect(page.locator('.hint-box .sources .source').first()).toBeVisible();
    await expect(page.locator('.hint-box')).toContainText('With the hint, a correct answer is worth +1 and a wrong one −1.');
    await expect(page.locator('.feedback, .explanation, .answer.missed, .answer.correct')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Hint: show the source' })).toHaveCount(0);
    await expect(page.locator('.answer').first()).toBeEnabled();
    await answer(page, true);
    await page.getByRole('button', { name: 'Next question' }).click();

    await expect(page.locator('.hint-box')).toHaveCount(0);
    await page.getByRole('button', { name: 'Hint: show the source' }).click();
    await answer(page, false);
    await page.getByRole('button', { name: 'See results' }).click();

    await expect(page.locator('.score-text')).toHaveText('0 points out of 4'); // +1 − 1
    await expect(page.locator('.outcomes .outcome-correctWithHint')).toContainText('Correct with hint1+1 pts');
    await expect(page.locator('.outcomes .outcome-wrongWithHint')).toContainText('Wrong with hint1−1 pts');
    await expect(page.locator('.mistake dd.correct em, .mistake dd.wrong em').first()).toHaveText('(with hint)');
  });

  test('immediate mode shows the points and the running score', async ({ page }) => {
    await startWith(page, 'JavaScript closures');
    await answer(page, true);
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('.feedback .verdict')).toContainText('Correct! +2 pts');
    await page.getByRole('button', { name: 'Next question' }).click();
    await expect(page.locator('.running-score')).toHaveText('Score: 2 pts');

    await answer(page, false);
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('.feedback .verdict')).toContainText('Not quite. 0 pts');
    await page.getByRole('button', { name: 'Next question' }).click();
    await expect(page.locator('.running-score')).toHaveText('Score: 2 pts');

    await page.getByRole('button', { name: 'Hint: show the source' }).click();
    await answer(page, true);
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('.feedback .verdict')).toContainText('Correct! (with hint) +1 pts');
    await expect(page.locator('.feedback .explanation, .feedback .sources').first()).toBeVisible();
    await page.getByRole('button', { name: 'Next question' }).click();
    await expect(page.locator('.running-score')).toHaveText('Score: 3 pts');

    await page.getByRole('button', { name: 'End session' }).click();
    await expect(page.locator('.score-ring')).toHaveText('3');
    await expect(page.locator('.score-text')).toHaveText('3 points out of 8');
    await expect(page.getByRole('heading', { name: 'Questions to review' })).toBeVisible();
    await expect(page.locator('.mistake')).toHaveCount(3); // wrong, correct with hint, unanswered
  });
});
