import { test } from '@playwright/test';
import { attachment, severity } from 'allure-js-commons';
import { clickElementByText, search, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady, clickAndWaitForNavigation } from '../../../../helpers/utils';
import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';
import { Check_Facebook_Login } from '../../../../helpers/Social_Login_Helper/Facebook_Login';
import { getRandomProduct } from '../../../../helpers/csvReader';

//---- 1. Load product id and sku from CSV -----
interface ProductRow {
    entity_id: string;
    sku: string;
}

//---- 1. Load products from CSV -----
function loadProductsFromCSV(filePath: string): ProductRow[] {
    const fileComent = fs.readFileSync(filePath, 'utf-8');
    const parsed = Papa.parse(fileComent, { header: true });
    return parsed.data
        .map((row: any) => ({
            entity_id: row.entity_id,
            sku: row.sku
        }))
        .filter((p: ProductRow) => p.entity_id && p.sku);
}

test('Facebook_SocialLogin_Checkout', async ({ page }) => {
    test.setTimeout(180000);

    severity('blocker');

    // 1️⃣ Open Menzzo.fr
    await page.goto('https://www.menzzo.fr');

    // 2️⃣ Close cookies popup;
    await clickElementByText(page, "Accepter et continuer");

    // --- Load categories from CSV ---
    const products = loadProductsFromCSV('data/All_product.csv');

    if (products.length === 0) {
        throw new Error('No products found');
    }
    const product = getRandomProduct(products);

    attachment(
        'Random Product Selected',
        `entity_id=${product.entity_id} | sku=${product.sku}`,
        'text/plain'
    );


    // 3️⃣ Search for product
    await page.goto(`https://www.menzzo.fr/catalog/product/view/id/${product.entity_id}`);
    // 6️⃣ Click in "Ajouter au panier"
    await clickElementByText(page, "Ajouter au panier");

    // 7️⃣ Click in "Voir le panier & commander"
    await clickElementByTextWithPopUp(page, "Voir le panier & commander");

    // Use robust navigation helper
    await clickAndWaitForNavigation(page, "Valider mon panier", /onestepcheckout/);

    attachment('Console Log', '✅ Navigation to checkout complete. Waiting for OneStepCheckout...', 'text/plain');

    attachment('Console Log', '✅ Checkout page detected.', 'text/plain');

    // 8️⃣ Wait for checkout form readiness
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
                    //  attachment('Console Log', `🔄 Switched to new checkout page: ${url}`, 'text/plain');
                    break;
                }
            }
            // Retry with the new page reference
            await waitForCheckoutReady(checkoutPage);
        } else {
            throw err;
        }
    }
    attachment('Console Log', `ℹ️ Loaded ${products.length} products from CSV`, 'text/plain');

    await Check_Facebook_Login(checkoutPage);
})
