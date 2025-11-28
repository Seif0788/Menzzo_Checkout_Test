import { test, devices } from '@playwright/test';

test.use(devices['iPhone 13']);

test('mobile test example', async ({ page }) => {
  await page.goto('https://www.menzzo.fr');
  });
