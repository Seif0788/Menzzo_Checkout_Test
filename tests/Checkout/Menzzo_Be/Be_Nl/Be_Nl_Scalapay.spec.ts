import { test, expect, Page } from '@playwright/test';
import { clickElementByText, search_nl, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady, clickAndWaitForCheckout_NL } from '../../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../../helpers/Checkout/General_Checkout';

test('Be_Nl_Scalapay', async ({ page }) => {
    test.setTimeout(180000);

    //Open Menzzo.fr
    await page.goto('https://nl.menzzo.be');

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

    // 1️⃣ Fill checkout data
    const checkoutData: CheckoutData = {
        firstName: 'Seif',
        lastName: 'Taj',
        email: 'seif@axelites.com',
        phone: '123456',
        address: ['Lippelostraat 44'],
        postalCode: '1840',
        city: 'Londerzeel',
        deliveryMethod: 'Home Delivery - At Room',
        paymentMethod: 'Scalapay'
    };

    await performCheckout(checkoutPage, checkoutData);
    console.log('✅ Checkout performed successfully.');

    // 9️⃣ Confirm navigation to payment method page
    // Refine the locator for the payment method page title
    console.log('⏳ Verifying navigation to payment method page...');
    await checkoutPage.waitForSelector('h1.page-title', { state: 'visible', timeout: 60000 });
    const pageTitle = await checkoutPage.locator('h1.page-title').innerText();
    expect(pageTitle).toMatch(/Rond de bestelling af/i);
    console.log('✅ Successfully navigated to payment method page.');

    //Validate Scalapay login page opened
    try {
        console.log("⏳ Waiting for Scalapay popup or redirect...");

        const popupOrRedirect = await Promise.race([
            page.waitForEvent('popup', { timeout: 60000 }).then(p => ({ type: 'popup', page: p })),
            page.waitForURL(/portal\.scalapay\.com/, { timeout: 60000, waitUntil: 'domcontentloaded' }).then(() => ({ type: 'redirect', page: page }))
        ]);

        if (popupOrRedirect.type === 'popup') {
            const popup = popupOrRedirect.page as Page;
            await popup.waitForLoadState();
            await expect(popup).toHaveURL(/portal\.scalapay\.com/);
            console.log("✅ Scalapay popup detected!");
        } else {
            console.log("✅ Scalapay redirect successful!");
        }
    } catch (err) {
        console.error("❌ Scalapay redirect/popup FAILED!");
        console.error("⚠️ Current URL:", page.url());
        console.error("⚠️ Error:", err);
        throw err;
    }

})