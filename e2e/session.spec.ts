import { expect, test, type Page } from '@playwright/test';
import { answer, currentQuestion, exampleFiles, loadExample, setMode } from './helpers';

async function startWith(page: Page, example: string, mode: 'quiz' | 'training', setup?: () => Promise<void>) {
  await loadExample(page, example);
  await setMode(page, mode);
  await setup?.();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.question')).toBeVisible();
}

/** Answers the current training question and moves on; returns whether it was a comeback. */
async function trainCorrectly(page: Page): Promise<boolean> {
  const comeback = (await page.locator('.badge.comeback').count()) > 0;
  await answer(page, true);
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.locator('.feedback .verdict')).toContainText('Correct!');
  await page.locator('.actions .button.primary').click();
  return comeback;
}

test.describe('configuration', () => {
  test('filters by level, type and topic', async ({ page }) => {
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

  test('three modes, quiz by default', async ({ page }) => {
    await loadExample(page, 'The TCP three-way handshake');
    await expect(page.locator('.mode-choice')).toHaveText([/^Quiz/, /^Training/, /^Reading/]);
    await expect(page.getByRole('radio', { name: /Quiz/ })).toBeChecked();
    await expect(page.locator('.mode-choice', { hasText: 'Quiz' })).toContainText('10 random questions, scored. Answers at the end.');
  });
});

test.describe('reading mode', () => {
  test('shows every matching question with its answer, in file order', async ({ page }) => {
    await loadExample(page, 'The TCP three-way handshake');
    await setMode(page, 'read');
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.locator('h1')).toHaveText('Reading — 6 questions');
    await expect(page.locator('article.reading')).toHaveCount(6);
    await expect(page.locator('article.reading .question-title').first()).toHaveText('How many segments are exchanged during the TCP connection handshake?');
    await expect(page.locator('article.reading').first().locator('.reading-answers li.correct')).toHaveText('✓3');
    await expect(page.locator('article.reading').first().locator('.explanation')).toBeVisible();
    await expect(page.locator('article.reading').nth(3).locator('.reading-tf')).toContainText('False'); // tcp-004, true/false

    await page.locator('.lang select').selectOption('fr');
    await expect(page.locator('h1')).toHaveText('Lecture — 6 questions');
    await expect(page.locator('article.reading .question-title').first()).toHaveText("Combien de segments sont échangés pendant l'établissement d'une connexion TCP ?");

    await page.getByRole('button', { name: 'Modifier les réglages' }).click();
    await page.locator('.chip', { hasText: 'Découverte' }).click();
    await page.locator('.chip', { hasText: 'Compréhension' }).click();
    await page.getByRole('button', { name: 'Commencer' }).click();
    await expect(page.locator('article.reading')).toHaveCount(1);
  });
});

test.describe('training mode', () => {
  test('a perfect run: corrected right away, no points, ends when every question is mastered', async ({ page }) => {
    await startWith(page, 'The TCP three-way handshake', 'training');
    for (let i = 0; i < 6; i++) {
      await expect(page.locator('.progress-label')).toHaveText(`Mastered: ${i} / 6`);
      await expect(page.getByRole('button', { name: 'Check' })).toBeDisabled();
      await answer(page, true);
      await page.getByRole('button', { name: 'Check' }).click();
      await expect(page.locator('.feedback .verdict')).toHaveText('Correct!'); // no points
      await expect(page.locator('.feedback .sources .source').first()).toBeVisible();
      await page.getByRole('button', { name: i < 5 ? 'Next question' : 'See results' }).click();
    }
    await expect(page.locator('h1')).toHaveText('Training complete');
    await expect(page.locator('.score-ring')).toHaveText('6/6');
    await expect(page.locator('.points')).toHaveCount(0);
  });

  test('a missed question comes back until it is answered correctly', async ({ page }) => {
    await startWith(page, 'JavaScript closures', 'training');
    const missed = (await currentQuestion(page)).id;
    await answer(page, false);
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('.feedback .verdict')).toHaveText('Not quite.');
    await expect(page.locator('.answer.wrong')).toHaveCount(1);
    await page.getByRole('button', { name: 'Next question' }).click();

    let comebacks = 0;
    for (let i = 0; i < 10 && (await page.locator('.question').count()); i++) {
      if (await page.locator('.badge.comeback').count()) expect((await currentQuestion(page)).id).toBe(missed);
      if (await trainCorrectly(page)) comebacks++;
    }
    expect(comebacks).toBe(1);
    await expect(page.locator('h1')).toHaveText('Training complete');
    await expect(page.locator('.outcomes')).toContainText('Missed or skipped at least once1');
    await expect(page.getByRole('heading', { name: 'Questions to review' })).toBeVisible();
    await expect(page.locator('.mistake')).toHaveCount(1);
  });

  test('skipping shows the answer; the question comes back; the user can stop', async ({ page }) => {
    await startWith(page, 'The TCP three-way handshake', 'training');
    await page.getByRole('button', { name: 'Skip and show the answer' }).click();
    await expect(page.locator('.feedback.skipped .verdict')).toHaveText('Skipped: here is the answer.');
    await expect(page.locator('.answer.missed').first()).toBeVisible();
    await expect(page.locator('.feedback .sources')).toBeVisible();
    await expect(page.locator('.answer').first()).toBeDisabled();
    await page.getByRole('button', { name: 'Next question' }).click();
    await expect(page.locator('.progress-label')).toHaveText('Mastered: 0 / 6');

    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(page.locator('h1')).toHaveText('Training stopped');
    await expect(page.locator('.score-ring')).toHaveText('0/6');
  });

  test('multiple-answer questions require every correct answer', async ({ page }) => {
    await startWith(page, 'JavaScript closures', 'training', async () => {
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
    await startWith(page, 'The TCP three-way handshake', 'training', async () => {
      await page.locator('.chip', { hasText: 'udp' }).click();
    });
    await expect(page.locator('.answer-text')).toHaveText(['True', 'False']);
    await page.getByRole('radio', { name: 'False' }).click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('.feedback .verdict')).toHaveText('Correct!');
  });

  test('keyboard: digits select, Enter checks and moves on', async ({ page }) => {
    await startWith(page, 'The TCP three-way handshake', 'training');
    await page.keyboard.press('1');
    await expect(page.locator('.answer.selected')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(page.locator('.feedback')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('.feedback')).toHaveCount(0);
  });

  test('sources: external links open in a new tab, excerpts are quoted', async ({ page }) => {
    await startWith(page, 'The FlashCards quiz format', 'training', async () => {
      await page.locator('.chip', { hasText: 'levels' }).click(); // fmt-006: excerpt source
    });
    await page.getByRole('button', { name: 'Skip and show the answer' }).click();
    await expect(page.locator('.source-excerpt blockquote')).toBeVisible();
    await expect(page.locator('.source-excerpt')).toContainText('— docs/format.md');
    await page.getByRole('button', { name: 'Stop' }).click();

    await page.getByRole('button', { name: 'Change settings' }).click();
    await page.getByRole('button', { name: 'Add quizzes' }).click();
    await page.locator('input[type=file]').setInputFiles(exampleFiles('JavaScript closures'));
    await page.locator('.chip', { hasText: 'levels' }).click();
    await page.locator('.quiz-choice input').first().uncheck();
    await page.locator('.chip', { hasText: 'scope' }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'Skip and show the answer' }).click();
    await expect(page.locator('.source-link a').first()).toHaveAttribute('target', '_blank');
    await expect(page.locator('.source-link a').first()).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

test.describe('quiz mode', () => {
  test('draws 10 random questions, or fewer if not enough match', async ({ page }) => {
    await startWith(page, 'La programmation asynchrone en TypeScript', 'quiz');
    await expect(page.getByText('Question 1 of 10')).toBeVisible();
    await startWith(page, 'The TCP three-way handshake', 'quiz');
    await expect(page.getByText('Question 1 of 6')).toBeVisible();
  });

  test('answers are corrected at the end only, and questions cannot be skipped', async ({ page }) => {
    await startWith(page, 'The TCP three-way handshake', 'quiz');
    await expect(page.locator('.skip-button')).toHaveCount(0);
    await answer(page, true);
    await expect(page.getByRole('button', { name: 'Check' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Next question' }).click();
    await expect(page.getByText('Question 2 of 6')).toBeVisible();
    await expect(page.locator('.feedback')).toHaveCount(0);
    await answer(page, false);
    await page.keyboard.press('Enter'); // Enter records the answer and moves on
    await page.getByRole('button', { name: 'End session' }).click();

    await expect(page.locator('.score-text')).toHaveText('2 points out of 12'); // +2 + 0, 4 unanswered
    await expect(page.getByRole('heading', { name: 'Answers' })).toBeVisible();
    await expect(page.locator('.mistake')).toHaveCount(6);
    await expect(page.locator('.mistake.outcome-correct .points')).toHaveText('+2');
    await expect(page.locator('.mistake.outcome-wrong .points')).toHaveText('0');
    await expect(page.locator('.mistake.outcome-unanswered')).toHaveCount(4);
  });

  test('the hint only shows the sources; answering with it is worth +1 or −1', async ({ page }) => {
    await startWith(page, 'The TCP three-way handshake', 'quiz');
    await page.getByRole('button', { name: 'Hint: show the source' }).click();
    await expect(page.locator('.hint-box .sources .source').first()).toBeVisible();
    await expect(page.locator('.hint-box')).toContainText('With the hint, a correct answer is worth +1 and a wrong one −1.');
    await expect(page.locator('.feedback, .explanation, .answer.missed, .answer.correct')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Hint: show the source' })).toHaveCount(0);
    await answer(page, true);
    await page.getByRole('button', { name: 'Next question' }).click();

    await expect(page.locator('.hint-box')).toHaveCount(0);
    await page.getByRole('button', { name: 'Hint: show the source' }).click();
    await answer(page, false);
    await page.getByRole('button', { name: 'Next question' }).click();
    await page.getByRole('button', { name: 'End session' }).click();

    await expect(page.locator('.score-text')).toHaveText('0 points out of 12'); // +1 − 1
    await expect(page.locator('.outcomes .outcome-correctWithHint')).toContainText('Correct with hint1+1 pts');
    await expect(page.locator('.outcomes .outcome-wrongWithHint')).toContainText('Wrong with hint1−1 pts');
    await expect(page.locator('.mistake dd em').first()).toHaveText('(with hint)');
  });

  test('a perfect quiz, then a new draw', async ({ page }) => {
    await startWith(page, 'JavaScript closures', 'quiz');
    for (let i = 1; i <= 4; i++) {
      await answer(page, true);
      await page.locator('.actions .button.primary').click();
    }
    await expect(page.locator('.score-ring')).toHaveText('8');
    await expect(page.locator('.score-text')).toHaveText('8 points out of 8');
    await expect(page.locator('.perfect')).toBeVisible();
    await page.getByRole('button', { name: 'New draw, same settings' }).click();
    await expect(page.getByText('Question 1 of 4')).toBeVisible();
  });

  test('mistakes can be retried', async ({ page }) => {
    await startWith(page, 'JavaScript closures', 'quiz');
    for (let i = 1; i <= 4; i++) {
      await answer(page, i > 2);
      await page.locator('.actions .button.primary').click();
    }
    await expect(page.locator('.score-text')).toHaveText('4 points out of 8'); // 2 × (+2) + 2 × 0
    await page.locator('.mistake.outcome-wrong summary').first().click();
    await expect(page.locator('.mistake.outcome-wrong dd.correct').first()).toBeVisible();
    await page.getByRole('button', { name: 'Retry my mistakes' }).click();
    await expect(page.getByText('Question 1 of 2')).toBeVisible();
  });

  test('answers are shuffled between draws', async ({ page }) => {
    const orders = new Set<string>();
    await loadExample(page, 'The TCP three-way handshake');
    await page.locator('.chip', { hasText: 'standards' }).click(); // tcp-006, 4 answers
    for (let i = 0; i < 8 && orders.size < 2; i++) {
      await page.getByRole('button', { name: i === 0 ? 'Start' : 'New draw, same settings' }).click();
      orders.add((await page.locator('.answer-text').allInnerTexts()).join('|'));
      await page.getByRole('button', { name: 'End session' }).click();
    }
    expect(orders.size).toBeGreaterThan(1);
  });
});
