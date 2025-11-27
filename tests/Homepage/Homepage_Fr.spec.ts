import {test, expect} from '@playwright/test';

test('Menzzo.fr homepage should load correctly', async ({page})=>{

    //Check that the homepage loads correctly
    await page.goto('https://www.menzzo.fr/');

    //Check that the title contains "Menzzo"
    await expect(page).toHaveTitle(/Menzzo/);

    //Check the main logo
    await expect(page.locator('img[alt="Menzzo.fr"]')).toBeVisible();
})