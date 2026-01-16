import { test, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';
import { clickElementByText } from '../../../../helpers/utils';
import { getProductPrice, getLowPrice, Tag } from '../../../../helpers/Product_page_helpers/Elementer_Page';
import fs from 'fs';
import Papa from 'papaparse';

const csvfile = './data/Solde_Hiver_2026_Maouro.csv';

// --- 1. Define CSV row type ---
interface ProductCSV {
    Special_Price: string;
    SKU: string;
    Price: string;
    id: string;
}

// --- 2. Load CSV into typed JSON ---
function loadCSV(): ProductCSV[] {
    const content = fs.readFileSync(csvfile, 'utf-8').replace(/"/g, '');
    const parsed = Papa.parse<ProductCSV>(content, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';'
    }).data;
    // Filter out empty or invalid rows
    return parsed.filter((row: ProductCSV) => row.SKU && row.Price && row.id && row.id !== '#N/A');
}

const Price_Update = loadCSV();

test.describe(`Solde Maouro_It (All products from CSV)`, () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('https://www.menzzo.it/');
        await clickElementByText(page, "Accettare tutto");
    });

    for (const product of Price_Update) {

        test(`Test SKU: ${product.SKU}, ID: ${product.id}`, async ({ page }) => {
            const parseCSVPrice = (val: string) => parseFloat(val.replace(',', '.').replace(/\s/g, ''));
            const expectedSalePrice = parseCSVPrice(product.Special_Price);
            const expectedOriginalPrice = parseCSVPrice(product.Price);

            if (isNaN(expectedSalePrice) || isNaN(expectedOriginalPrice)) {
                test.skip(true, `Invalid prices in CSV for SKU ${product.SKU}`);
                return;
            }

            // Navigate directly to the product page
            await page.goto(`https://menzzo.it/catalog/product/view/id/${product.id}`);

            // Check product availability
            const unavailableMessage = page.locator('.message.notice:has-text("non è più disponibile"), .message.notice:has-text("no longer available")');
            if (await unavailableMessage.isVisible()) {
                attachment('Console Warn', `⚠️ Product ${product.SKU} (ID: ${product.id}) is no longer available. skipping test.`, 'text/plain');
                test.skip(true, `Product ${product.SKU} is unavailable`);
                return;
            }

            //Check tag
            const promoTagText = await Tag(page);
            attachment('Check tag', `Tag for SKU ${product.SKU}: ${promoTagText}`, 'text/plain');
            expect.soft(promoTagText, `Expected a sale tag for SKU ${product.SKU}`).toMatch(/SALDI|PROMO/i);

            // Get the final price (Sale price)
            const productPrice = await getProductPrice(page);
            attachment('Console Log', `💶 Sale Price for SKU ${product.SKU}: ${productPrice}`, 'text/plain');

            // Compare sale price before assertion
            if (productPrice !== expectedSalePrice) {
                attachment('Console Error', `❌ SALE PRICE MISMATCH for SKU ${product.SKU}\nExpected: ${expectedSalePrice}\nFound:    ${productPrice}`, 'text/plain');
            } else {
                attachment('Console Log', `✅ Sale Price is correct for SKU ${product.SKU}`, 'text/plain');
            }

            // Final assertion (keeps Playwright validation)
            expect(productPrice, `Sale price mismatch for SKU ${product.SKU}`).toBe(expectedSalePrice);

            // Get the original price (crossed out)
            const oldPrice = await getLowPrice(page);
            attachment('Console Log', `💶 Original Price for SKU ${product.SKU}: ${oldPrice}`, 'text/plain');

            // Compare original price before assertion
            if (oldPrice !== expectedOriginalPrice) {
                attachment('Console Error', `❌ ORIGINAL PRICE MISMATCH for SKU ${product.SKU}\nExpected: ${expectedOriginalPrice}\nFound:    ${oldPrice}`, 'text/plain');
            } else {
                attachment('Console Log', `✅ Original Price is correct for SKU ${product.SKU}`, 'text/plain');
            }

            // Final assertion for original price
            expect(oldPrice, `Original price mismatch for SKU ${product.SKU}`).toBe(expectedOriginalPrice);

        });
    }
});
