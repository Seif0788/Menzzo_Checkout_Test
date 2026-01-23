import { test, expect, Page } from '@playwright/test';
import { attachment, severity } from 'allure-js-commons';
import { clickElementByText, search, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady, clickAndWaitForNavigation } from '../../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../../helpers/Checkout/General_Checkout';
import { Klarna_Payment } from '../../../../helpers/Checkout/Payment_menthod';

test('Klarna_Be_Fr', async ({ page }) => {
    severity('critical');
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

    attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    attachment('Console Log', '✅ Product page loaded.', 'text/plain');

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
            attachment('Console Log', `⏳ Attempt ${attempt}: Navigating to checkout...`, 'text/plain');
            await clickAndWaitForNavigation(page, "Valider mon panier");

            // Wait for checkout readiness
            await waitForCheckoutReady(checkoutPage);
            attachment('Console Log', '✅ Checkout form ready.', 'text/plain');
            success = true;
            break;
        } catch (err) {
            await page.screenshot({ path: 'WaitForCheckoutReady.png' }).catch(() => { });
            attachment('Console Warn', `⚠️ Attempt ${attempt} failed: ${err}`, 'text/plain');
            // Check for new tab / reload
            const allPages = page.context().pages();
            for (const p of allPages) {
                const url = p.url();
                if (/onestepcheckout/i.test(url)) {
                    checkoutPage = p;
                    attachment('Console Log', `🔄 Switched to new checkout page: ${url}`, 'text/plain');
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

    await performCheckout(checkoutPage, checkoutData);
    attachment('Console Log', '✅ Checkout performed successfully.', 'text/plain');

    await Klarna_Payment(page);

});
