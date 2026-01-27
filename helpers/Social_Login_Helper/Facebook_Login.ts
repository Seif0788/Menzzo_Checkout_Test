import { Page, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';

export async function Check_Facebook_Login(page: Page) {

    // Only visible buttons, pick the first
    const Facebook_Login_Button = page.locator('a.amsl-button.-facebook:visible').first();

    try {
        await expect(Facebook_Login_Button).toBeVisible({ timeout: 8000 });

        const [facebookPopup] = await Promise.all([
            page.waitForEvent('popup'),
            Facebook_Login_Button.click(),
        ]);

        await facebookPopup.waitForLoadState('domcontentloaded');

        await expect(facebookPopup).toHaveURL(/facebook\.com\/login/)
    } catch {
        const count = await page.locator('a.amsl-button.-facebook').count();
        attachment(
            'Facebook login button not visible',
            `❌ Facebook login button was not visible. Found total: ${count}`,
            'text/plain'
        );
        throw new Error(`❌ Facebook login button was not visible. Found total: ${count}`);
    }
}
