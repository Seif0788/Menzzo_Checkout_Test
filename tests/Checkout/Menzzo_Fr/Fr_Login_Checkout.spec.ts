import { test, expect } from '@playwright/test';
import { attachment, severity } from 'allure-js-commons';
import { clickElementByText, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady, clickAndWaitForNavigation, login, selectCategory } from '../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../helpers/Checkout/General_Checkout';
import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';
import { selectRandomCategory } from '../../../helpers/Category_page/Global_Checking';
import { Stripe_Payment } from '../../../helpers/Checkout/Payment_menthod';

//---- 1. Load categories from CSV -----
function loadCategoriesFromCSV(filePath: string): string[] {
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`CSV file not found at: ${absolutePath}`);
    }
    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    const parsed = Papa.parse(fileContent, { header: true });
    //Assuming CSV has a column named "Category"
    return parsed.data.map((row: any) => row.Category).filter(Boolean);
}

test('Login_Checkout_fr', async ({ page }) => {
    test.setTimeout(300000); // Increased timeout to 5 minutes

    severity('critical');

    //Open Menzzo.fr
    await page.goto('https://www.menzzo.fr');

    //Close cookies popup;
    await clickElementByText(page, "Accepter et continuer");

    //Login to a symple account
    await login(page, 'alt.du-co0kxq82@yopmail.com', 'Et1saHcXmCOMD1');

    await selectRandomCategory(page);

    //Click in the random product
    await ClickRandomProduct(page);

    // Wait for product page to load
    attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
    await page.waitForLoadState('domcontentloaded');

    //Add 5 second wait
    await page.waitForTimeout(5000);

    // Wait for "Add to cart" button to confirm PDP is loaded
    await expect(page.locator('button[type="submit"][title*="Ajouter"], button.tocart, #product-addtocart-button').first()).toBeVisible({ timeout: 60000 });
    attachment('Console Log', '✅ Product page loaded.', 'text/plain');

    //Click in "Ajouter au panier"
    await clickElementByText(page, "Ajouter au panier");

    //Click in "Voir le panier & commander"
    await clickElementByTextWithPopUp(page, "Voir le panier & commander");

    // Use robust navigation helper
    await clickAndWaitForNavigation(page, "Valider mon panier", /onestepcheckout/);

    attachment('Console Log', '✅ Navigation to checkout complete. Waiting for OneStepCheckout...', 'text/plain');

    // 6️⃣ Wait for checkout form readiness with recovery logic
    let checkoutPage = page;

    try {
        await waitForCheckoutReady(page);
    } catch (err) {
        await page.screenshot({ path: 'WaitForCheckoutReady.png' }).catch(() => { });
        if (String(err).includes('Target page') || String(err).includes('closed')) {
            attachment('Console Warn', '⚠️ Detected checkout reload or new tab — recovering...', 'text/plain');
            // Look for a new checkout page in the context
            const allPages = page.context().pages();
            let recovered = false;
            for (const p of allPages) {
                const url = p.url();
                if (/onestepcheckout/i.test(url)) {
                    checkoutPage = p;
                    attachment('Console Log', `🔄 Switched to new checkout page: ${url}`, 'text/plain');
                    recovered = true;
                    break;
                }
            }
            if (recovered) {
                // Retry with the new page reference
                await waitForCheckoutReady(checkoutPage);
            } else {
                throw new Error("Could not recover checkout page context.");
            }
        } else {
            throw err;
        }
    }

    // 7️⃣ Fill checkout data
    const checkoutData: CheckoutData = {
        //phone: '123456',
        //address: ['10 Rue Exemple'],
        //postalCode: '75001',
        //city: 'Paris',
        deliveryMethod: 'Home Delivery - At Room',
        paymentMethod: 'Stripe'
    };

    await performCheckout(checkoutPage, checkoutData);
    attachment('Console Log', '✅ Checkout performed successfully.', 'text/plain');

    // 1️⃣1️⃣ Confirm navigation to payment method page
    await Stripe_Payment(page);

})
