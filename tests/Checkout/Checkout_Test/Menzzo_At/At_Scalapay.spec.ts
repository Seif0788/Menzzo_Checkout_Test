import { test, expect, Page } from '@playwright/test';
import { clickElementByText, search, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady } from '../../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../../helpers/Checkout/General_Checkout';

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
    console.log('⏳ Waiting for product page to load...');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    console.log('✅ Product page loaded.');

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
        console.log("⚠️ 'Warenkorb bestätigen' click failed or timed out.");
    }

    // Fallback: if not on checkout, try "Zur Kasse" (standard button)
    if (!page.url().includes('onestepcheckout')) {
        console.log("ℹ️ Not on checkout page yet. Trying 'Zur Kasse'...");
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
            clickElementByText(page, 'Zur Kasse', 10000).catch(() => console.log("⚠️ 'Zur Kasse' also failed.")),
        ]);
    }
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
    console.log('✅ Checkout performed successfully.');

    // 9️⃣ Confirm navigation to payment method page
    // Refine the locator for the payment method page title
    console.log('⏳ Verifying navigation to payment method page...');
    await checkoutPage.waitForSelector('h1.page-title', { state: 'visible', timeout: 60000 });
    const pageTitle = await checkoutPage.locator('h1.page-title').innerText();
    expect(pageTitle).toMatch(/Bestellung abschließen/i);
    console.log('✅ Successfully navigated to payment method page.');

    console.log("⏳ Waiting for Scalapay redirect...");

    // Use checkoutPage reference
    const timeout = 60000;
    let redirected = false;

    // 1️⃣ Check for URL change to Scalapay
    try {
        await checkoutPage.waitForURL(/portal\.integration\.scalapay\.com\/login/, { timeout });
        console.log("✅ Scalapay redirect detected in same tab!");
        redirected = true;
    } catch (err) {
        console.log("⚠️ No redirect in same tab detected within timeout.");
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
            console.log("✅ Scalapay popup detected!");
            redirected = true;
        }
    }

    // 3️⃣ Fail if neither detected
    if (!redirected) {
        throw new Error("❌ Scalapay redirect/popup FAILED!");
    }

});
