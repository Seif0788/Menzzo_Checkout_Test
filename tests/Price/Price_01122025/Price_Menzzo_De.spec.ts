import { test, expect, Page } from '@playwright/test';
import { allure } from "allure-playwright";
import { clickElementByText, clickAndReturnProduct, ClickRandomProduct, search } from '../../../helpers/utils';
import { getProductPrice, getLowPrice } from '../../../helpers/Product_page_helpers/Elementer_Page';
import fs from 'fs';
import Papa from 'papaparse';

const csvfile = './data/Price_Update.csv';

// --- 1. Define CSV row type ---
interface ProductCSV {
    Special_Price: string;
    SKU: string;
    Price: string;
    LP30: string;
    id: string;
}

// --- 2. Load CSV into typed JSON ---
function loadCSV(): ProductCSV[] {
    let content = fs.readFileSync(csvfile, 'utf-8');
    content = content.replace(/"/g, '');
    return Papa.parse<ProductCSV>(content, { header: true }).data;
}

const Price_Update = loadCSV();

// --- Choose how many random tests to run ---
const TEST_COUNT = 220;

// --- Set a specific product ID to test (leave empty for random) ---
const SPECIFIC_PRODUCT_ID = ''; // Example: '90375' or leave empty ''

test.describe(`Price check (random SKUs x${TEST_COUNT})`, () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('https://www.menzzo.de/');
        await clickElementByText(page, "Alle akzeptieren");
    });

    for (let i = 1; i <= TEST_COUNT; i++) {

        test(`DE_Random SKU test #${i}`, async ({ page }) => {

            // Pick a product: specific ID if set, otherwise random
            let randomProduct;

            if (SPECIFIC_PRODUCT_ID) {
                // Find product by specific ID
                randomProduct = Price_Update.find(p => String(p.id) === String(SPECIFIC_PRODUCT_ID));
                if (!randomProduct) {
                    throw new Error(`Product with ID ${SPECIFIC_PRODUCT_ID} not found in CSV`);
                }
                allure.attachment('Console Log', `🎯 Test #${i} → Specific ID selected: ${randomProduct.SKU}, ID: ${randomProduct.id}`, 'text/plain');
            } else {
                // Pick a random product that has a valid ID
                do {
                    randomProduct = Price_Update[Math.floor(Math.random() * Price_Update.length)];
                } while (!randomProduct.id || randomProduct.id === '#N/A');
                allure.attachment('Console Log', `🎯 Test #${i} → Random SKU selected: ${randomProduct.SKU}, ID: ${randomProduct.id}`, 'text/plain');
            }

            const expectedPrice = parseFloat(randomProduct.Price);

            // Navigate directly to the product page
            await page.goto(`https://menzzo.de/catalog/product/view/id/${randomProduct.id}`);

            // Get the price
            const productPrice = await getProductPrice(page);
            allure.attachment('Console Log', `💶 Price for SKU ${randomProduct.SKU}: ${productPrice}`, 'text/plain');

            // Compare price before assertion
            if (productPrice !== expectedPrice) {
                allure.attachment('Console Error', `❌ PRICE MISMATCH for SKU ${randomProduct.SKU}\nExpected: ${expectedPrice}\nFound:    ${productPrice}`, 'text/plain');
            } else {
                allure.attachment('Console Log', `✅ Price is correct for SKU ${randomProduct.SKU}`, 'text/plain');
            }

            // Final assertion (keeps Playwright validation)
            expect(productPrice).toBe(expectedPrice);

            // Check LP30 (Low Price) only if it exists in CSV
            if (randomProduct.LP30 && randomProduct.LP30.trim() !== '') {
                const expectedLP30 = parseFloat(randomProduct.LP30);

                // Get the Low price
                const LowproductPrice = await getLowPrice(page);
                allure.attachment('Console Log', `💶 Low Price for SKU ${randomProduct.SKU}: ${LowproductPrice}`, 'text/plain');

                // Compare price before assertion
                if (LowproductPrice !== expectedLP30) {
                    allure.attachment('Console Error', `❌ LOW PRICE MISMATCH for SKU ${randomProduct.SKU}\nExpected: ${expectedLP30}\nFound:    ${LowproductPrice}`, 'text/plain');
                } else {
                    allure.attachment('Console Log', `✅ Low Price is correct for SKU ${randomProduct.SKU}`, 'text/plain');
                }

                // Final assertion (keeps Playwright validation)
                expect(LowproductPrice).toBe(expectedLP30);
            } else {
                allure.attachment('Console Log', `⏭️  Skipping LP30 check for SKU ${randomProduct.SKU} (no LP30 value in CSV)`, 'text/plain');
            }

        });
    }
});
