import { test, expect } from '@playwright/test';

test.describe('Menzzo Android BrowserStack Test', () => {
    test('Open www.menzzo.fr on Android phone via BrowserStack', async ({ page }) => {
        // Set a longer timeout for BrowserStack
        test.setTimeout(180000); // 3 minutes

        console.log('🚀 Starting test: Opening www.menzzo.fr on Android device');

        // Navigate to Menzzo website
        await page.goto('https://www.menzzo.fr', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        console.log('✅ Page loaded successfully');

        // Wait a bit for the page to stabilize
        await page.waitForTimeout(3000);

        // Verify the page URL
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        expect(currentUrl).toContain('menzzo.fr');

        // Verify the page title
        const title = await page.title();
        console.log(`Page title: ${title}`);
        expect(title.length).toBeGreaterThan(0);

        // Take a screenshot for verification
        await page.screenshot({
            path: 'test-results/menzzo-android-screenshot.png',
            fullPage: false // Just viewport screenshot for faster execution
        });

        console.log('✅ Screenshot captured successfully');

        // Verify page body is visible
        await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

        console.log('✅ Successfully opened www.menzzo.fr on Android device via BrowserStack');
    });
});
