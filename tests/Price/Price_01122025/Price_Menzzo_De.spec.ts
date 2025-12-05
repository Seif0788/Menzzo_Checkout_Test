import { test, expect, Page } from '@playwright/test';
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
                console.log(`🎯 Test #${i} → Specific ID selected: ${randomProduct.SKU}, ID: ${randomProduct.id}`);
            } else {
                // Pick a random product that has a valid ID
                do {
                    randomProduct = Price_Update[Math.floor(Math.random() * Price_Update.length)];
                } while (!randomProduct.id || randomProduct.id === '#N/A');
                console.log(`🎯 Test #${i} → Random SKU selected: ${randomProduct.SKU}, ID: ${randomProduct.id}`);
            }

            const expectedPrice = parseFloat(randomProduct.Price);

            // Navigate directly to the product page
            await page.goto(`https://menzzo.de/catalog/product/view/id/${randomProduct.id}`);

            // Get the price
            const productPrice = await getProductPrice(page);
            console.log(`💶 Price for SKU ${randomProduct.SKU}: ${productPrice}`);

            // Compare price before assertion
            if (productPrice !== expectedPrice) {
                console.log(`❌ PRICE MISMATCH for SKU ${randomProduct.SKU}`);
                console.log(`   Expected: ${expectedPrice}`);
                console.log(`   Found:    ${productPrice}`);
            } else {
                console.log(`✅ Price is correct for SKU ${randomProduct.SKU}`);
            }

            // Final assertion (keeps Playwright validation)
            expect(productPrice).toBe(expectedPrice);

            // Check LP30 (Low Price) only if it exists in CSV
            if (randomProduct.LP30 && randomProduct.LP30.trim() !== '') {
                const expectedLP30 = parseFloat(randomProduct.LP30);

                // Get the Low price
                const LowproductPrice = await getLowPrice(page);
                console.log(`💶 Low Price for SKU ${randomProduct.SKU}: ${LowproductPrice}`);

                // Compare price before assertion
                if (LowproductPrice !== expectedLP30) {
                    console.log(`❌ LOW PRICE MISMATCH for SKU ${randomProduct.SKU}`);
                    console.log(`   Expected: ${expectedLP30}`);
                    console.log(`   Found:    ${LowproductPrice}`);
                } else {
                    console.log(`✅ Low Price is correct for SKU ${randomProduct.SKU}`);
                }

                // Final assertion (keeps Playwright validation)
                expect(LowproductPrice).toBe(expectedLP30);
            } else {
                console.log(`⏭️  Skipping LP30 check for SKU ${randomProduct.SKU} (no LP30 value in CSV)`);
            }

        });
    }
});
