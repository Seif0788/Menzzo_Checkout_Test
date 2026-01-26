import { test, expect } from '@playwright/test';
import { attachment, description } from 'allure-js-commons';
import { clickElementByText, ensurePageIsOpen } from '../../../../helpers/utils';
import { Description, InfoTable, CheckTitleLanguage } from '../../../../helpers/Product_page_helpers/Elementer_Page';
import { detectLanguage } from '../../../../helpers/detect_language';
import fs from 'fs';
import Papa from 'papaparse';

// Expected language for this test suite
const EXPECTED_LANGUAGE = 'fr';


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

const ALL_PRODUCTS = loadProductsFromCSV('data/Maouro_Product.csv');

if (ALL_PRODUCTS.length === 0) {
    throw new Error("❌ No products loaded! Check the CSV file path and headers (expected 'entity_id', 'sku').");
}

// Limit the number of iterations
const MAX_ITERATIONS = 30;
const productsToProcess = ALL_PRODUCTS.slice(0, MAX_ITERATIONS);

// ---Test suite ---
test.describe('Maouro_Fr_Be', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('https://www.menzzo.be');
        attachment('Open Menzzo.be', "🚪 Menzzo.be was opened", 'text/plain');

        try {
            await clickElementByText(page, "Accepter tout");
            attachment('Close Cookies', "✅ Cookies was closed", 'text/plain');
        } catch (error) {
            attachment('Cookies not found or already closed', "⚠️ Cookie banner not found or already closed", 'text/plain');
        }
    });

    for (const product of productsToProcess) {
        test(`Product page validation | SKU: ${product.sku} | ID=${product.entity_id}`, async ({ page }) => {
            test.setTimeout(12000);
            page = await ensurePageIsOpen(page, page.context());

            const url = `https://www.menzzo.be/catalog/product/view/id/${product.entity_id}`;
            attachment('Console Log', `🔹 Navigating to product: ${product.sku} (ID: ${product.entity_id}) -> ${url}`, 'text/plain');

            const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            if (response && response.status() >= 400) {
                test.skip(true, `Checking product, ${product.sku}`);
            }

            const productFormExists = await page
                .waitForSelector('form[data-product-sku]', { state: 'attached', timeout: 5000 })
                .then(() => true)
                .catch(() => false);

            if (!productFormExists) {
                test.skip(true, `Product not available on fr.menzzo.be`);
            }

            const pageSKU = await page.getAttribute('form[data-product-sku]', 'data-product-sku');

            expect(pageSKU, 'SKU must exist').toBeTruthy();
            expect(pageSKU!.toLowerCase()).toBe(product.sku.toLowerCase());

            // Language checks
            const h1text = (await page.locator('h1.ax-page-title').textContent())?.trim() || '';
            const titleText = await page.title();
            const h1lang = detectLanguage(h1text);
            const titleLang = detectLanguage(titleText);

            expect.soft(h1lang === EXPECTED_LANGUAGE, 'H1 text should not be empty').toBeTruthy();
            expect.soft(titleLang === EXPECTED_LANGUAGE, 'Title should not be empty').toBeTruthy();

            await CheckTitleLanguage(page);

            await Description(page);

            await InfoTable(page);
        });
    }
    test.afterEach(async ({ page }) => {
        await page.close();
    });
})
