import { test, expect, Page } from '@playwright/test';
import { attachment } from 'allure-js-commons';
import {
    clickElementByText,
    search,
    ClickRandomProduct,
    clickElementByTextWithPopUp,
    waitForCheckoutReady,
} from '../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../helpers/Checkout/General_Checkout';

test('Es_Scalapay', async ({ page }) => {
    // 1️⃣ Open Menzzo.de
    await page.goto('https://www.menzzo.es');

    // 2️⃣ Close cookies popup
    await clickElementByText(page, 'Aceptar todo');

    // 3️⃣ Search for "Mesa"
    await search(page, 'Mesa');

    // 4️⃣ Click on a random product
    await ClickRandomProduct(page);

    // 5️⃣ Wait for product page to load
    attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    attachment('Console Log', '✅ Product page loaded.', 'text/plain');

    // 6️⃣ Click "Añadir al carrito"
    await clickElementByText(page, 'Añadir al carrito');

    // 7️⃣ Click "Vai al tuo carrello e ordina"
    await clickElementByTextWithPopUp(page, 'Ver mi cesta y comprar');

    // 8️⃣ Navigate to checkout
    try {
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
            clickElementByText(page, 'Validar', 5000, { debug: true }),
        ]);
    } catch (e) {
        attachment('Console Warn', "⚠️ 'Validar' click failed or timed out.", 'text/plain');
    }

    // Fallback: if not on checkout, try "Zur Kasse" (standard button)
    if (!page.url().includes('onestepcheckout')) {
        attachment('Console Log', "ℹ️ Not on checkout page yet. Trying 'Comprar'...", 'text/plain');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
            clickElementByText(page, 'Comprar', 10000).catch(() => attachment('Console Warn', "⚠️ 'Comprar' also failed.", 'text/plain')),
        ]);
    }
    attachment('Console Log', '✅ Navigation to checkout complete. Waiting for OneStepCheckout...', 'text/plain');

    let checkoutPage = page;

    // 9️⃣ Wait for checkout form readiness
    try {
        await waitForCheckoutReady(page);
    } catch (err) {
        if (String(err).includes('Target page') || String(err).includes('closed')) {
            attachment('Console Warn', '⚠️ Detected checkout reload or new tab — recovering...', 'text/plain');
            const allPages = page.context().pages();
            for (const p of allPages) {
                if (/onestepcheckout/i.test(p.url())) {
                    checkoutPage = p;
                    attachment('Console Log', `🔄 Switched to new checkout page: ${checkoutPage.url()}`, 'text/plain');
                    break;
                }
            }
            await waitForCheckoutReady(checkoutPage);
        } else {
            throw err;
        }
    }

    // 7️⃣ Fill checkout data
    const checkoutData: CheckoutData = {
        firstName: 'Seif',
        lastName: 'Taj',
        email: 'seif@axelites.com',
        phone: '123456',
        address: ['Carrer de la Ciutat de Granada, 53'],
        postalCode: '08005',
        city: 'Barcelona',
        deliveryMethod: 'Home Delivery - Classic',
        paymentMethod: 'Scalapay'
    };

    await performCheckout(checkoutPage, checkoutData);
    attachment('Console Log', '✅ Checkout performed successfully.', 'text/plain');

    // 9️⃣ Confirm navigation to payment method page
    // Refine the locator for the payment method page title
    attachment('Console Log', '⏳ Verifying navigation to payment method page...', 'text/plain');
    await checkoutPage.waitForSelector('h1.page-title', { state: 'visible', timeout: 60000 });
    const pageTitle = await checkoutPage.locator('h1.page-title').innerText();
    expect(pageTitle).toMatch(/Finalizar el pedido/i);
    attachment('Console Log', '✅ Successfully navigated to payment method page.', 'text/plain');

    //Validate Scalapay login page opened
    try {
        attachment('Console Log', "⏳ Waiting for Scalapay popup or redirect...", 'text/plain');

        const popupOrRedirect = await Promise.race([
            page.waitForEvent('popup', { timeout: 60000 }).then(p => ({ type: 'popup', page: p })),
            page.waitForURL(/portal\.scalapay\.com/, { timeout: 60000, waitUntil: 'domcontentloaded' }).then(() => ({ type: 'redirect', page: page }))
        ]);

        if (popupOrRedirect.type === 'popup') {
            const popup = popupOrRedirect.page as Page;
            await popup.waitForLoadState();
            await expect(popup).toHaveURL(/portal\.scalapay\.com/);
            attachment('Console Log', "✅ Scalapay popup detected!", 'text/plain');
        } else {
            attachment('Console Log', "✅ Scalapay redirect successful!", 'text/plain');
        }
    } catch (err) {
        attachment('Console Error', "❌ Scalapay redirect/popup FAILED!", 'text/plain');
        attachment('Console Error', `⚠️ Current URL: ${page.url()}`, 'text/plain');
        attachment('Console Error', `⚠️ Error: ${err}`, 'text/plain');
        throw err;
    }
})