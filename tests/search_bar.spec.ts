import { test, expect } from '@playwright/test';
import { gotopageAndVerifyTitle, clickElementByText, search } from '../helpers/utils';

test('search_product', async ({ page }) => {
  await test.step('Open homepage and verify title', async () => {
    await gotopageAndVerifyTitle(
      page,
      'https://www.menzzo.fr',
      'Menzzo : Table & Chaise Design, Meubles Mobilier Scandinave pas cher'
    );
  });

  await test.step('Accept cookies', async () => {
    await clickElementByText(page, 'Accepter et continuer');
  });

  await test.step('Search product in search bar', async () => {
    await search(page, 'Chaises');
  });
});
