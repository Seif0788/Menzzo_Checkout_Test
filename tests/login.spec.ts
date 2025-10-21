import { test, expect } from '@playwright/test';
import { gotopageAndVerifyTitle, login, clickElementByText } from '../helpers/utils';

test('Login Test', async ({ page }) => {
  await gotopageAndVerifyTitle(page, 'https://www.menzzo.fr/', 'Menzzo : Table & Chaise Design, Meubles Mobilier Scandinave pas cher');
  await clickElementByText(page, 'Accepter et continuer');
  await login(page, 'alt.du-co0kxq82@yopmail.com', 'Et1saHcXmCOMD1'); // replace with valid credentials
});