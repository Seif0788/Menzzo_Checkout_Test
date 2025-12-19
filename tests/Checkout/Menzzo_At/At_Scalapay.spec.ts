import { test, expect, Page } from '@playwright/test';
import { allure } from "allure-playwright";
import { clickElementByText, search, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady } from '../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../helpers/Checkout/General_Checkout';

test('At_Scalapay', async ({ page }) => {
    // 1️⃣ Open Menzzo.at
    await page.goto('https://www.menzzo.at');

    // 2️⃣ Close cookies popup
    await clickElementByText(page, 'Alle akzeptieren');

    // 3️⃣ Search for "Sofa"
    await search(page, 'Sofa');

    // 4️⃣ Click on a random product
    await ClickRandomProduct(page);

    // 5️⃣ Wait for product page to load
    allure.attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    allure.attachment('Console Log', '✅ Product page loaded.', 'text/plain');

    // 6️⃣ Click "In den Warenkorb"
    await clickElementByText(page, 'In den Warenkorb');

    // 7️⃣ Click "Warenkorb anzeigen und bestellen"
    await clickElementByTextWithPopUp(page, 'Warenkorb anzeigen und bestellen');

    // 8️⃣ Navigate to checkout
    try {
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
            clickElementByText(page, 'Warenkorb bestätigen', 5000, { debug: true }),
        ]);
    } catch (e) {
        allure.attachment('Console Warn', "⚠️ 'Warenkorb bestätigen' click failed or timed out.", 'text/plain');
    }

    // Fallback: if not on checkout, try "Zur Kasse" (standard button)
    if (!page.url().includes('onestepcheckout')) {
        allure.attachment('Console Log', "ℹ️ Not on checkout page yet. Trying 'Zur Kasse'...", 'text/plain');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
            clickElementByText(page, 'Zur Kasse', 10000).catch(() => allure.attachment('Console Warn', "⚠️ 'Zur Kasse' also failed.", 'text/plain')),
        ]);
    }
    allure.attachment('Console Log', '✅ Navigation to checkout complete. Waiting for OneStepCheckout...', 'text/plain');

    let checkoutPage = page;

    // 9️⃣ Wait for checkout form readiness
    try {
        await waitForCheckoutReady(page);
    } catch (err) {
        if (String(err).includes('Target page') || String(err).includes('closed')) {
            allure.attachment('Console Warn', '⚠️ Detected checkout reload or new tab — recovering...', 'text/plain');
            const allPages = page.context().pages();
            for (const p of allPages) {
                if (/onestepcheckout/i.test(p.url())) {
                    checkoutPage = p;
                    allure.attachment('Console Log', `🔄 Switched to new checkout page: ${checkoutPage.url()}`, 'text/plain');
                    break;
                }
            }
            await waitForCheckoutReady(checkoutPage);
        } else {
            throw err;
        }
    }

    // 10️⃣ Fill checkout data
    const checkoutData: CheckoutData = {
        firstName: 'Seif',
        lastName: 'Taj',
        email: 'seif@axelites.com',
        phone: '561695123456789',
        address: ['Mariahilfer Str. 95'],
        postalCode: '8020',
        city: 'Graz',
        //deliveryMethod: 'Home Delivery - At Room',
        paymentMethod: 'Scalapay',
    };

    await performCheckout(checkoutPage, checkoutData);
    allure.attachment('Console Log', '✅ Checkout performed successfully.', 'text/plain');

    // 9️⃣ Confirm navigation to payment method page
    // Refine the locator for the payment method page title
    allure.attachment('Console Log', '⏳ Verifying navigation to payment method page...', 'text/plain');
    await checkoutPage.waitForSelector('h1.page-title', { state: 'visible', timeout: 60000 });
    const pageTitle = await checkoutPage.locator('h1.page-title').innerText();
    expect(pageTitle).toMatch(/Bestellung abschließen/i);
    allure.attachment('Console Log', '✅ Successfully navigated to payment method page.', 'text/plain');

    allure.attachment('Console Log', "⏳ Waiting for Scalapay redirect...", 'text/plain');

    // Use checkoutPage reference
    const timeout = 60000;
    let redirected = false;

    // 1️⃣ Check for URL change to Scalapay
    try {
        await checkoutPage.waitForURL(/portal\.integration\.scalapay\.com\/login/, { timeout });
        allure.attachment('Console Log', "✅ Scalapay redirect detected in same tab!", 'text/plain');
        redirected = true;
    } catch (err) {
        allure.attachment('Console Warn', "⚠️ No redirect in same tab detected within timeout.", 'text/plain');
    }

    // 2️⃣ Check for popup windows
    if (!redirected) {
        const [popup] = await Promise.all([
            checkoutPage.context().waitForEvent('page', { timeout }),
            checkoutPage.waitForTimeout(1000) // give time for popup to open
        ]);

        if (popup) {
            await popup.waitForLoadState();
            await expect(popup).toHaveURL(/portal\.integration\.scalapay\.com\/login/);
            allure.attachment('Console Log', "✅ Scalapay popup detected!", 'text/plain');
            redirected = true;
        }
    }

    // 3️⃣ Fail if neither detected
    if (!redirected) {
        throw new Error("❌ Scalapay redirect/popup FAILED!");
    }

});
