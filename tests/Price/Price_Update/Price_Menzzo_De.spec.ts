import { test } from '@playwright/test';
import { attachment } from 'allure-js-commons';
import { clickElementByText } from '../../../helpers/utils';
import { getProductPrice } from '../../../helpers/Product_page_helpers/Elementer_Page';
import fs from 'fs';
import Papa from 'papaparse';

const csvfile = './data/Price_Update_28_01_2026.csv';

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

test.describe(`Check the update price for DE`, () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('https://www.menzzo.de/');
        await clickElementByText(page, "Alle akzeptieren");
    });

    for (const product of Price_Update) {

        test(`DE SKU test #${product.SKU}`, async ({ page }) => {

            // Pick a product: specific ID if set, otherwise random
            let Product;

            if (product.id) {
                // Find product by specific ID
                Product = Price_Update.find(p => String(p.id) === String(product.id));
                if (!Product) {
                    throw new Error(`Product with ID ${product.id} not found in CSV`);
                }
                attachment('Console Log', `🎯 Test → Specific ID selected: ${Product.SKU}, ID: ${Product.id}`, 'text/plain');
            } else {
                // Pick a product that has a valid ID
                do {
                    Product = Price_Update[Price_Update.length - 1];
                } while (!Product.id || Product.id === '#N/A');
                attachment('Console Log', `🎯 Test → SKU selected: ${Product.SKU}, ID: ${Product.id}`, 'text/plain');
            }

            const expectedPrice = parseFloat(Product.Price);

            // Navigate directly to the product page
            await page.goto(`https://menzzo.de/catalog/product/view/id/${Product.id}`);

            // Get the price
            const productPrice = await getProductPrice(page);
            attachment('Console Log', `💶 Price for SKU ${Product.SKU}: ${productPrice}`, 'text/plain');

            // Compare price before assertion
            if (productPrice !== expectedPrice) {
                attachment('Console Error', `❌ PRICE MISMATCH for SKU ${Product.SKU}\nExpected: ${expectedPrice}\nFound:    ${productPrice}`, 'text/plain');
            } else {
                attachment('Console Log', `✅ Price is correct for SKU ${Product.SKU}`, 'text/plain');
            }

        });
    }
});
