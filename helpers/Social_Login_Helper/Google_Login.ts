import { Page, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';

export async function Check_Google_Login(page: Page) {

    // Only visible buttons, pick the first
    const Google_Login_Button = page.locator('a.amsl-button.-google:visible').first();

    try {
        await expect(Google_Login_Button).toBeVisible({ timeout: 8000 });

        const [googlePopup] = await Promise.all([
            page.waitForEvent('popup'),
            Google_Login_Button.click(),
        ]);

        await googlePopup.waitForLoadState('domcontentloaded');

        await expect(googlePopup).toHaveURL(/accounts\.google\.com/)
    } catch {
        const count = await page.locator('a.amsl-button.-google').count();
        attachment(
            'Google login button not visible',
            `❌ Google login button was not visible. Found total: ${count}`,
            'text/plain'
        );
        throw new Error(`❌ Google login button was not visible. Found total: ${count}`);
    }
}
