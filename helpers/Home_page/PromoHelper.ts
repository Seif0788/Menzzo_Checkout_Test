import { Page, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';

export async function checkPromoBlock(
    page: Page,
    options?: {
        selector?: string;
        stepName?: string;
        assertImage?: boolean;
        assertLink?: boolean;
    }
) {
    const selector = options?.selector ?? '.promo-home-desktop';
    const stepName = options?.stepName ?? 'Check promo home desktop block';
    const assertImage = options?.assertImage ?? true;
    const assertLink = options?.assertLink ?? true;

    console.log(`\n▶ ${stepName}`);

    const promoBlock = page.locator(selector);
    await expect(promoBlock).toBeVisible();
    console.log('✅ Promo block is visible');

    /* ---------------------------
       Image presence
    --------------------------- */
    const imageCount = await promoBlock.locator('img, picture').count();
    const hasImage = imageCount > 0;

    const imagePresenceMsg = hasImage
        ? '✅ Image found inside promo block'
        : '❌ No image found inside promo block';

    console.log(imagePresenceMsg);
    attachment('Promo image presence', imagePresenceMsg, 'text/plain');

    /* ---------------------------
       Image loaded
    --------------------------- */
    if (hasImage) {
        const img = promoBlock.locator('img').first();

        const isLoaded = await img.evaluate((el: HTMLImageElement) => {
            return el.complete && el.naturalWidth > 0;
        });

        const imageLoadedMsg = isLoaded
            ? '✅ Image loaded correctly'
            : '⚠️ Image exists but not loaded';

        console.log(imageLoadedMsg);
        attachment('Promo image loaded', imageLoadedMsg, 'text/plain');
    }

    /* ---------------------------
       Promo link URL
    --------------------------- */
    const link = promoBlock.locator('a').first();
    const href = await link.getAttribute('href');

    const linkMsg = href
        ? `🔗 Promo link URL: ${href}`
        : '❌ No href attribute found on promo link';

    console.log(linkMsg);
    attachment('Promo link URL', linkMsg, 'text/plain');

    if (assertLink) {
        expect(href, 'Promo link href should exist').toBeTruthy();
        expect(href).not.toBe('#');
    }

    /* ---------------------------
       Screenshot (always)
    --------------------------- */
    console.log('📸 Taking promo block screenshot');
    const screenshot = await promoBlock.screenshot();
    attachment('Promo block screenshot', screenshot, 'image/png');

    /* ---------------------------
       Final assertion
    --------------------------- */
    if (assertImage) {
        console.log('🔍 Asserting promo image presence');
        expect(hasImage).toBeTruthy();
    }

    console.log('✅ Promo block check completed\n');
    return href;
}
