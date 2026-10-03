import { expect, test } from '@playwright/test';
import { loadExample, setMode } from './helpers';

test.describe('languages', () => {
  test.describe('with a French browser', () => {
    test.use({ locale: 'fr-FR' });

    test('the interface follows the browser language', async ({ page }) => {
      await page.goto('./');
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
      await expect(page.locator('.dropzone')).toContainText('Déposez ici vos fichiers');
    });

    test('a quiz without French falls back to its language, with a notice', async ({ page }) => {
      await page.goto('./');
      await loadExample(page, 'JavaScript closures');
      await page.getByRole('button', { name: 'Commencer' }).click();
      await expect(page.locator('.fallback')).toHaveText('Non disponible en Français : affichée en Anglais.');
      await expect(page.locator('.hint')).toBeVisible();
    });
  });

  test('switching language mid-question keeps the order and the selection', async ({ page }) => {
    await page.goto('./');
    await loadExample(page, 'The TCP three-way handshake');
    await page.locator('.chip', { hasText: 'standards' }).click();
    await setMode(page, 'training');
    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.locator('.question-title')).toHaveText('Which RFC is the current specification of TCP?');
    const order = await page.locator('.answer-text').allInnerTexts();
    await page.locator('.answer').nth(2).click();

    await page.locator('.lang select').selectOption('fr');
    await expect(page.locator('.question-title')).toHaveText('Quelle RFC est la spécification actuelle de TCP ?');
    expect(await page.locator('.answer-text').allInnerTexts()).toEqual(order); // RFC numbers: same text, same order
    await expect(page.locator('.answer').nth(2)).toHaveClass(/selected/);

    await page.getByRole('button', { name: 'Valider' }).click();
    await expect(page.locator('.feedback .verdict')).toHaveText(/Bonne réponse !|Pas tout à fait\./);
    await expect(page.locator('.explanation')).toContainText('La RFC 9293 (2022)');

    await page.locator('.lang select').selectOption('en');
    await expect(page.locator('.explanation')).toContainText('RFC 9293 (2022) obsoletes');
  });

  test('the chosen language is remembered', async ({ page }) => {
    await page.goto('./');
    await page.locator('.lang select').selectOption('fr');
    await page.reload();
    await expect(page.locator('.dropzone')).toContainText('Déposez ici vos fichiers');
  });

  test('quiz titles follow the selected language on the config screen', async ({ page }) => {
    await page.goto('./');
    await loadExample(page, 'The FlashCards quiz format');
    await page.locator('.lang select').selectOption('fr');
    await expect(page.locator('.quiz-choice strong')).toHaveText('Le format de quiz FlashCards');
    await expect(page.locator('.quiz-choice')).toContainText('Langues : Anglais, Français');
  });
});
