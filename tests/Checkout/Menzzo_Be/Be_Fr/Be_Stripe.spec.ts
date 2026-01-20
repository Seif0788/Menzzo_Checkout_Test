import { test, expect } from '@playwright/test';
import { attachment, severity } from 'allure-js-commons';
import { clickElementByText, search, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady, clickAndWaitForNavigation } from '../../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../../helpers/Checkout/General_Checkout';
import { Stripe_Payment } from '../../../../helpers/Checkout/Payment_menthod';

test('Strip_Be_Fr', async ({ page }) => {
    severity('blocker');
    test.setTimeout(180000);

    //Open Menzzo.be
    await page.goto('https://www.menzzo.be');

    //Close cookies popup;
    await clickElementByText(page, "Accepter tout");

    //Wright "Table" in the search bar
    await search(page, "Table");

    //Click in the rundem product
    await ClickRandomProduct(page);

    // Wait for product page to load
    attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    attachment('Console Log', '✅ Product page loaded.', 'text/plain');

    //Click in "Ajouter au panier"
    await clickElementByText(page, "Ajouter au panier");

    //Click in "Voir le panier & commander"
    await clickElementByTextWithPopUp(page, "Voir le panier & commander");

    // Use robust navigation helper
    await clickAndWaitForNavigation(page, "Valider mon panier", /onestepcheckout/);

    attachment('Console Log', '✅ Navigation to checkout complete. Waiting for OneStepCheckout...', 'text/plain');

    attachment('Console Log', '✅ Checkout page detected.', 'text/plain');

    // 6️⃣ Wait for checkout form readiness
    let checkoutPage = page;

    try {
        await waitForCheckoutReady(page);
    } catch (err) {
        await page.screenshot({ path: 'WaitForCheckoutReady.png' }).catch(() => { });
        if (String(err).includes('Target page') || String(err).includes('closed')) {
            attachment('Console Warn', '⚠️ Detected checkout reload or new tab — recovering...', 'text/plain');
            // Look for a new checkout page in the context
            const allPages = page.context().pages();
            for (const p of allPages) {
                const url = p.url();
                if (/onestepcheckout/i.test(url)) {
                    checkoutPage = p;
                    //  console.log(`🔄 Switched to new checkout page: ${url}`);
                    break;
                }
            }
            // Retry with the new page reference
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
        address: ['Lippelostraat 44'],
        postalCode: '1840',
        city: 'Londerzeel',
        deliveryMethod: 'Home Delivery - At Room',
        paymentMethod: 'Stripe'
    };

    await performCheckout(checkoutPage, checkoutData);
    attachment('Console Log', '✅ Checkout performed successfully.', 'text/plain');

    // 11️⃣ Confirm navigation to payment method page
    await Stripe_Payment(page);
})