import { test, expect, Page } from '@playwright/test';
import { allure } from "allure-playwright";
import { clickElementByText, search, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady, clickAndWaitForNavigation } from '../../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../../helpers/Checkout/General_Checkout';

test('Klarna_Be_Fr', async ({ page }) => {
    test.setTimeout(180000);
    /*
        // Capture console messages and errors
        page.on('console', msg => {
            const type = msg.type();
            if (type === 'error' || type === 'warning') {
                console.log(`[Browser ${type.toUpperCase()}]:`, msg.text());
            }
        });
    
        page.on('pageerror', err => {
            console.error('[Browser Page Error]:', err.message);
        });
    */
    //Open Menzzo.be
    await page.goto('https://www.menzzo.be');

    //Close cookies popup
    await clickElementByText(page, "Accepter tout");

    //Search for "Table"
    await search(page, "Table");

    //Click a random product
    await ClickRandomProduct(page);

    allure.attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    allure.attachment('Console Log', '✅ Product page loaded.', 'text/plain');

    //Add to cart
    await clickElementByText(page, "Ajouter au panier");

    //Go to cart
    await clickElementByTextWithPopUp(page, "Voir le panier & commander");

    // Retry logic: try navigation + wait for checkout up to 5 times
    const maxRetries = 5;
    let checkoutPage: Page = page;
    let success = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            allure.attachment('Console Log', `⏳ Attempt ${attempt}: Navigating to checkout...`, 'text/plain');
            await clickAndWaitForNavigation(page, "Valider mon panier");

            // Wait for checkout readiness
            await waitForCheckoutReady(checkoutPage);
            allure.attachment('Console Log', '✅ Checkout form ready.', 'text/plain');
            success = true;
            break;
        } catch (err) {
            allure.attachment('Console Warn', `⚠️ Attempt ${attempt} failed: ${err}`, 'text/plain');
            // Check for new tab / reload
            const allPages = page.context().pages();
            for (const p of allPages) {
                const url = p.url();
                if (/onestepcheckout/i.test(url)) {
                    checkoutPage = p;
                    allure.attachment('Console Log', `🔄 Switched to new checkout page: ${url}`, 'text/plain');
                    break;
                }
            }
            if (attempt === maxRetries) {
                throw new Error(`❌ Failed to reach checkout after ${maxRetries} attempts`);
            }
            // Small delay before retry
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // 7️⃣ Fill checkout data
    const checkoutData: CheckoutData = {
        firstName: 'Seif',
        lastName: 'Taj',
        email: 'seif@axelites.com',
        phone: '123456',
        address: ['Lippelostraat 44'],
        postalCode: '1840',
        city: 'Londerzeel',
        deliveryMethod: 'Home Delivery - At Room',
        paymentMethod: 'Klarna'
    };

    // 1️⃣ Retry filling checkout 5 times
    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            await performCheckout(checkoutPage, checkoutData);
            allure.attachment('Console Log', `✅ Checkout performed successfully on attempt ${attempt}`, 'text/plain');

            // 2️⃣ Wait for Klarna popup or redirect INSIDE the loop
            allure.attachment('Console Log', '⏳ Waiting for Klarna popup or redirect...', 'text/plain');

            const popupOrRedirect = await Promise.race([
                page.waitForEvent('popup', { timeout: 60000 }).then(p => ({ type: 'popup', page: p })),
                page.waitForURL(/klarna\.com/, { timeout: 60000, waitUntil: 'domcontentloaded' }).then(() => ({ type: 'redirect', page: page }))
            ]);

            if (popupOrRedirect.type === 'popup') {
                const popup = popupOrRedirect.page as Page;
                await popup.waitForLoadState();
                await expect(popup).toHaveURL(/klarna\.com/);
                allure.attachment('Console Log', "✅ Klarna popup detected!", 'text/plain');
            } else {
                allure.attachment('Console Log', "✅ Klarna redirect detected!", 'text/plain');
            }

            // If successful, break the loop
            break;

        } catch (err) {
            allure.attachment('Console Warn', `⚠️ Attempt ${attempt} failed: ${err}`, 'text/plain');
            allure.attachment('Console Warn', `⚠️ Current URL: ${page.url()}`, 'text/plain');

            if (attempt === 5) throw err;

            allure.attachment('Console Log', "🔄 Reloading page and retrying...", 'text/plain');
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

});
