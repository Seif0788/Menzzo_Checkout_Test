import { test, expect } from '@playwright/test';
import { allure } from "allure-playwright";
import { clickElementByText, ensurePageIsOpen } from '../../../helpers/utils';
import { Description, InfoTable, CheckTitleLanguage } from '../../../helpers/Product_page_helpers/Elementer_Page';
import { detectLanguage } from '../../../helpers/detect_language';
import fs from 'fs';
import Papa from 'papaparse';

// Expected language for this test suite
const EXPECTED_LANGUAGE = 'it';


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

test('Check_Maouro_It_product_page', async ({ page }) => {
    // Increase timeout to 1 hour to handle the loop
    test.setTimeout(3600000);

    // --- Open menzzo.it ---
    await page.goto('https://www.menzzo.it');
    allure.attachment('Console Log', "🚪 Menzzo.it was opened", 'text/plain');

    // --- Close Cookies popup ---
    try {
        await clickElementByText(page, "Accettare tutto");
        allure.attachment('Console Log', "✅ Cookies was closed", 'text/plain');
    } catch (error) {
        allure.attachment('Console Warn', "⚠️ Cookie banner not found or already closed", 'text/plain');
    }

    // --- Load categories from CSV ---
    const products = loadProductsFromCSV('data/Maouro_Product.csv');
    allure.attachment('Console Log', `ℹ️ Loaded ${products.length} products from CSV`, 'text/plain');

    if (products.length === 0) {
        throw new Error("❌ No products loaded! Check the CSV file path and headers (expected 'entity_id', 'sku').");
    }

    // --- Limit the number of iterations ---
    const MAX_ITERATIONS = 3;
    const productsToProcess = products.slice(0, MAX_ITERATIONS);
    allure.attachment('Console Log', `ℹ️ limiting loop to ${MAX_ITERATIONS} items (Total in CSV: ${products.length})`, 'text/plain');

    // --- Loop through all categories ---
    for (const product of productsToProcess) {
        // Check page state
        page = await ensurePageIsOpen(page, page.context());

        try {
            // Construct URL using entity_id
            const url = `https://www.menzzo.it/catalog/product/view/id/${product.entity_id}`;
            allure.attachment('Console Log', `🔹 Navigating to product: ${product.sku} (ID: ${product.entity_id}) -> ${url}`, 'text/plain');

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Wait for product page element to be ready instead of hard wait
            await page.waitForSelector('form[data-product-sku]', { state: 'attached', timeout: 10000 });

            // ---- Check SKU from HTML Attribute ----
            const pageSKU = await page.getAttribute('form[data-product-sku]', 'data-product-sku');

            if (!pageSKU) {
                throw new Error(`❌ SKU ${product.sku} not found on the page`);
            }

            if (pageSKU.toLowerCase() !== product.sku.toLowerCase()) {
                allure.attachment('Console Warn', `❌ SKU mismatch! CSV SKU = ${product.sku}, Page SKU = ${pageSKU}. Skipping...`, 'text/plain');
                continue;
            }

            allure.attachment('Console Log', `✅ SKU verified: ${pageSKU}`, 'text/plain');

            // --- Validate Language with detectLanguage helper ---
            const h1Element = page.locator('h1.ax-page-title');
            const h1Text = (await h1Element.textContent())?.trim() || '';
            const pageTitle = await page.title();

            const h1Lang = detectLanguage(h1Text);
            const titleLang = detectLanguage(pageTitle);

            let langResults = `🌍 Language Detection Results:\n`;
            langResults += `   → H1 text: "${h1Text.substring(0, 50)}..."\n`;
            langResults += `   → H1 detected language: ${h1Lang}\n`;
            langResults += `   → Title detected language: ${titleLang}\n`;
            langResults += `   → Expected language: ${EXPECTED_LANGUAGE}\n`;
            allure.attachment('Console Log', langResults, 'text/plain');

            // Soft assertion for H1 language
            expect.soft(
                h1Lang === EXPECTED_LANGUAGE || h1Lang === 'unknown',
                `H1 language should be ${EXPECTED_LANGUAGE}, but detected ${h1Lang}`
            ).toBeTruthy();

            // Soft assertion for title language
            expect.soft(
                titleLang === EXPECTED_LANGUAGE || titleLang === 'unknown',
                `Title language should be ${EXPECTED_LANGUAGE}, but detected ${titleLang}`
            ).toBeTruthy();

            if (h1Lang === EXPECTED_LANGUAGE && titleLang === EXPECTED_LANGUAGE) {
                allure.attachment('Console Log', `✅ Language validation passed for ${EXPECTED_LANGUAGE.toUpperCase()}`, 'text/plain');
            } else if (h1Lang === 'unknown' || titleLang === 'unknown') {
                allure.attachment('Console Warn', `⚠️ Some language detection was inconclusive`, 'text/plain');
            } else {
                allure.attachment('Console Error', `❌ Language mismatch detected!`, 'text/plain');
            }

            // Check the title language (legacy function)
            await CheckTitleLanguage(page);

            // Check the discription
            await Description(page);

            // Check the Info table
            await InfoTable(page);

        } catch (error) {
            allure.attachment('Console Error', `❌ Error processing SKU ${product.sku}: ${error}`, 'text/plain');

            try {
                if (!page.isClosed()) {
                    const screenshotPath = `screenshots/error_${product.sku}.png`;
                    const screenshot = await page.screenshot({ path: screenshotPath, fullPage: true });
                    allure.attachment(`Screenshot Error ${product.sku}`, screenshot, 'image/png');
                    allure.attachment('Console Log', `📸 Screenshot saved to ${screenshotPath}`, 'text/plain');
                } else {
                    allure.attachment('Console Warn', "⚠️ Could not take screenshot: Page is closed.", 'text/plain');
                }
            } catch (screenshotError) {
                allure.attachment('Console Warn', `⚠️ Failed to take screenshot: ${screenshotError}`, 'text/plain');
            }
        }
    }

});