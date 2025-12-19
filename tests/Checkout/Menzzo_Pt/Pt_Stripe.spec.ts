import { test, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';
import {
    clickElementByText,
    search,
    ClickRandomProduct,
    clickElementByTextWithPopUp,
    waitForCheckoutReady,
} from '../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../helpers/Checkout/General_Checkout';

test('Pt_Stripe', async ({ page }) => {
    // 1️⃣ Open Menzzo.de
    await page.goto('https://www.menzzo.pt');

    // 2️⃣ Close cookies popup
    await clickElementByText(page, 'Aceite tudo');

    // 3️⃣ Search for "Bancos"
    await search(page, 'Bancos');

    // 4️⃣ Click on a random product
    await ClickRandomProduct(page);

    // 5️⃣ Wait for product page to load
    attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    attachment('Console Log', '✅ Product page loaded.', 'text/plain');

    // 6️⃣ Click "Adicionar ao carrinho"
    await clickElementByText(page, 'Adicionar ao carrinho');

    // 7️⃣ Click "Vai al tuo carrello e ordina"
    await clickElementByTextWithPopUp(page, 'Ver o carrinho e confirmar');

    // 8️⃣ Navigate to checkout
    try {
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
            clickElementByText(page, 'Finalizar compra', 5000, { debug: true }),
        ]);
    } catch (e) {
        attachment('Console Warn', "⚠️ 'Finalizar compra' click failed or timed out.", 'text/plain');
    }

    // Fallback: if not on checkout, try "Zur Kasse" (standard button)
    if (!page.url().includes('onestepcheckout')) {
        attachment('Console Log', "ℹ️ Not on checkout page yet. Trying 'Finalizar compra'...", 'text/plain');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
            clickElementByText(page, 'Finalizar compra', 10000).catch(() => attachment('Console Warn', "⚠️ 'Finalizar compra' also failed.", 'text/plain')),
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
        address: ['Av. Vasco da Gama 774'],
        postalCode: '4410-338',
        city: 'Arcozelo',
        //deliveryMethod: 'Home Delivery - At Room',
        paymentMethod: 'Stripe'
    };

    await performCheckout(checkoutPage, checkoutData);
    attachment('Console Log', '✅ Checkout performed successfully.', 'text/plain');

    // 9️⃣ Confirm navigation to payment method page
    attachment('Console Log', '⏳ Verifying navigation to Stripe...', 'text/plain');
    try {
        await expect(checkoutPage).toHaveURL(/stripe\.com/, { timeout: 60000 });
        attachment('Console Log', '✅ Successfully navigated to Stripe.', 'text/plain');
    } catch (e) {
        attachment('Console Error', `❌ Failed to navigate to Stripe. Current URL: ${checkoutPage.url()}`, 'text/plain');
        throw e;
    }
})