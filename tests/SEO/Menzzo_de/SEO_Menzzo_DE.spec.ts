import { test, expect, Page } from '@playwright/test';
import { attachment } from 'allure-js-commons';
import { clickElementByText, ClickRandomProduct, search } from '../../../helpers/utils';
import { SEO_Title, SEO_Description } from '../../../helpers/Product_page_helpers/Elementer_Page';
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
const TEST_COUNT = 1;

// --- Set a specific product ID to test (leave empty for random) ---
const SPECIFIC_PRODUCT_ID = ''; // Example: '90375' or leave empty ''

test.describe(`SEO check (random SKUs x${TEST_COUNT})`, () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('https://www.menzzo.de/');
        await clickElementByText(page, "Alle akzeptieren");
    });

    for (let i = 1; i <= TEST_COUNT; i++) {

        test(`DE_Random SKU test #${i}`, async ({ page }) => {

            let productID = SPECIFIC_PRODUCT_ID;
            let productSKU = 'SPECIFIC';

            if (!productID) {
                if (Price_Update.length === 0) throw new Error("CSV is empty");
                const randomIndex = Math.floor(Math.random() * Price_Update.length);
                const randomProduct = Price_Update[randomIndex];
                productID = randomProduct.id;
                productSKU = randomProduct.SKU;
                attachment('Console Log', `Testing Random Product: ID=${productID}, SKU=${productSKU}`, 'text/plain');
            } else {
                attachment('Console Log', `Testing Specific Product: ID=${productID}`, 'text/plain');
            }

            // Navigate directly to the product page using the ID
            await page.goto(`https://www.menzzo.de/catalog/product/view/id/${productID}`);

            //Check that the title contains "product_name"
            await SEO_Title(page);

            await SEO_Description(page);

        });
    }
});
