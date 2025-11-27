import { test, expect, Page } from '@playwright/test';
import {
    clickElementByText,
    search_nl,
    ClickRandomProduct,
    clickElementByTextWithPopUp,
    waitForCheckoutReady,
    clickAndWaitForCheckout_NL,
} from '../../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../../helpers/Checkout/General_Checkout';

test('Nl_Klarna', async ({ page }) => {
    test.setTimeout(180000);
    try {
        // 1️⃣ Open Menzzo.nl
        await page.goto('https://www.menzzo.nl');

        // 2️⃣ Close cookies popup
        await clickElementByText(page, 'Accepteer alles');

        // 3️⃣ Search for "Roger"
        await search_nl(page, 'Roger');

        // 4️⃣ Click on a random product
        await ClickRandomProduct(page);

        // 5️⃣ Wait for product page to load
        console.log('⏳ Waiting for product page to load...');
        await page.waitForLoadState('networkidle', { timeout: 60000 });
        console.log('✅ Product page loaded.');

        // 6️⃣ Click "In Winkelwagen"
        await clickElementByText(page, 'In Winkelwagen');

        // 7️⃣ Click "Zie winkelwagen"
        await clickElementByTextWithPopUp(page, 'Zie winkelwagen');

        // 8️⃣ Navigate to checkout using robust helper
        await clickAndWaitForCheckout_NL(page, "Bevestig mijn winkelwagen");

        console.log('✅ Navigation to checkout complete. Waiting for OneStepCheckout...');

        let checkoutPage = page;

        // 9️⃣ Wait for checkout form readiness
        try {
            await waitForCheckoutReady(page);
        } catch (err) {
            if (String(err).includes('Target page') || String(err).includes('closed')) {
                console.warn('⚠️ Detected checkout reload or new tab — recovering...');
                const allPages = page.context().pages();
                for (const p of allPages) {
                    if (/onestepcheckout/i.test(p.url())) {
                        checkoutPage = p;
                        console.log(`🔄 Switched to new checkout page: ${checkoutPage.url()}`);
                        break;
                    }
                }
                await waitForCheckoutReady(checkoutPage);
            } else {
                throw err;
            }
        }

        // 🔟 Fill checkout data
        const checkoutData: CheckoutData = {
            firstName: 'Seif',
            lastName: 'Taj',
            email: 'seif@axelites.com',
            phone: '123456',
            address: ['Pina Bauschplein 4'],
            postalCode: '1095 PN',
            city: 'Amsterdam',
            //deliveryMethod: 'Home Delivery - At Room',
            paymentMethod: 'Klarna'
        };

        // 1️⃣ Retry filling checkout 5 times
        for (let attempt = 1; attempt <= 5; attempt++) {
            try {
                await performCheckout(checkoutPage, checkoutData);
                console.log(`✅ Checkout performed successfully on attempt ${attempt}`);

                // 2️⃣ Wait for Klarna popup or redirect INSIDE the loop
                console.log('⏳ Waiting for Klarna popup or redirect...');

                const popupOrRedirect = await Promise.race([
                    page.waitForEvent('popup', { timeout: 60000 }).then(p => ({ type: 'popup', page: p })),
                    page.waitForURL(/klarna\.com/, { timeout: 60000, waitUntil: 'domcontentloaded' }).then(() => ({ type: 'redirect', page: page }))
                ]);

                if (popupOrRedirect.type === 'popup') {
                    const popup = popupOrRedirect.page as Page;
                    await popup.waitForLoadState();
                    await expect(popup).toHaveURL(/klarna\.com/);
                    console.log("✅ Klarna popup detected!");
                } else {
                    console.log("✅ Klarna redirect detected!");
                }

                // If successful, break the loop
                break;

            } catch (err) {
                console.warn(`⚠️ Attempt ${attempt} failed:`, err);
                console.warn("⚠️ Current URL:", page.url());

                if (attempt === 5) throw err;

                console.log("🔄 Reloading page and retrying...");
                await page.reload();
                await page.waitForLoadState('networkidle');

                // Re-detect checkout page if needed (in case reload redirects elsewhere)
                const allPages = page.context().pages();
                for (const p of allPages) {
                    if (/onestepcheckout/i.test(p.url())) {
                        checkoutPage = p;
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        throw error;
    }
});