import { expect, test } from '@playwright/test';
import { loadExample } from './helpers';

test.describe('small screens @mobile', () => {
  test('no horizontal scrolling on any screen', async ({ page }) => {
    const noOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.goto('./');
    await noOverflow();
    await loadExample(page, 'JavaScript closures'); // contains code blocks
    await noOverflow();
    await page.getByRole('button', { name: 'Start' }).click();
    for (let i = 0; i < 4; i++) {
      await page.locator('.answer').first().click();
      await page.getByRole('button', { name: 'Check' }).click();
      await noOverflow();
      await page.locator('.actions .button.primary').click();
    }
    await expect(page.locator('.screen-results')).toBeVisible();
    await noOverflow();
  });
});
