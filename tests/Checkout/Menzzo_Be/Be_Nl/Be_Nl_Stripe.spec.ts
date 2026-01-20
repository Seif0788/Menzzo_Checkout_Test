import { test, expect } from '@playwright/test';
import { attachment, severity } from 'allure-js-commons';
import {
    clickElementByText,
    search_nl,
    ClickRandomProduct,
    clickElementByTextWithPopUp,
    waitForCheckoutReady,
    clickAndWaitForCheckout_NL,
} from '../../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../../helpers/Checkout/General_Checkout';
import { Stripe_Payment } from '../../../../helpers/Checkout/Payment_menthod';

test('Be_Nl_Stripe', async ({ page }) => {
    severity('blocker');
    test.setTimeout(180000);
    try {
        // 1️⃣ Open Menzzo.nl
        await page.goto('https://nl.menzzo.be');

        // 2️⃣ Close cookies popup
        await clickElementByText(page, 'Accepteer alles');

        // 3️⃣ Search for "Roger"
        await search_nl(page, 'Roger');

        // 4️⃣ Click on a random product
        await ClickRandomProduct(page);

        // 5️⃣ Wait for product page to load
        attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
        await page.waitForLoadState('networkidle', { timeout: 60000 });
        attachment('Console Log', '✅ Product page loaded.', 'text/plain');

        // 6️⃣ Click "In Winkelwagen"
        await clickElementByText(page, 'In Winkelwagen');

        // 7️⃣ Click "Zie winkelwagen"
        await clickElementByTextWithPopUp(page, 'Zie winkelwagen');

        // 8️⃣ Navigate to checkout using robust helper
        await clickAndWaitForCheckout_NL(page, "Bevestig mijn winkelwagen");

        attachment('Console Log', '✅ Navigation to checkout complete. Waiting for OneStepCheckout...', 'text/plain');

        let checkoutPage = page;

        // 9️⃣ Wait for checkout form readiness
        try {
            await waitForCheckoutReady(page);
        } catch (err) {
            await page.screenshot({ path: 'WaitForCheckoutReady.png' }).catch(() => { });
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
            paymentMethod: 'Stripe'
        };

        await performCheckout(checkoutPage, checkoutData);
        attachment('Console Log', '✅ Checkout performed successfully.', 'text/plain');

        // 1️⃣1️⃣ Confirm navigation to payment method page
        await Stripe_Payment(page);
    } catch (error) {
        attachment('Console Error', `❌ Test failed with error: ${error}`, 'text/plain');
        throw error;
    }
});