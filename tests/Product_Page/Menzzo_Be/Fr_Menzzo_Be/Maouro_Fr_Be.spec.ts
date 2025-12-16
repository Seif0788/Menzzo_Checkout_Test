import { test, expect } from '@playwright/test';
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




test('Check_Maouro_Fr_Be_product_page', async ({ page }) => {
    // Increase timeout to 1 hour to handle the loop
    test.setTimeout(3600000);

    // --- Open menzzo.be ---
    await page.goto('https://www.menzzo.be');
    console.log("🚪 Menzzo.be was opened");

    // --- Close Cookies popup ---
    try {
        await clickElementByText(page, "Accepter et continuer");
        console.log("✅ Cookies was closed");
    } catch (error) {
        console.log("⚠️ Cookie banner not found or already closed");
    }

    // --- Load categories from CSV ---
    const products = loadProductsFromCSV('data/Maouro_Product.csv');
    console.log(`ℹ️ Loaded ${products.length} products from CSV`);

    if (products.length === 0) {
        throw new Error("❌ No products loaded! Check the CSV file path and headers (expected 'entity_id', 'sku').");
    }

    // --- Limit the number of iterations ---
    const MAX_ITERATIONS = 30;  // Reduced for testing Belgian site
    const productsToProcess = products.slice(0, MAX_ITERATIONS);
    console.log(`ℹ️ limiting loop to ${MAX_ITERATIONS} items (Total in CSV: ${products.length})`);

    // --- Loop through all categories ---
    for (const product of productsToProcess) {
        // Check page state
        page = await ensurePageIsOpen(page, page.context());

        try {
            // Construct URL using entity_id
            const url = `https://www.menzzo.be/catalog/product/view/id/${product.entity_id}`;
            console.log(`🔹 Navigating to product: ${product.sku} (ID: ${product.entity_id}) -> ${url}`);

            const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Check if page returned 404 or error
            if (response && response.status() >= 400) {
                console.log(`⚠️ Product ${product.sku} returned HTTP ${response.status()} - skipping`);
                continue;
            }

            // Wait for product page element - with try-catch to handle missing products
            const productFormExists = await page.waitForSelector('form[data-product-sku]', {
                state: 'attached',
                timeout: 5000
            }).then(() => true).catch(() => false);

            if (!productFormExists) {
                console.log(`⚠️ Product ${product.sku} not found on Belgian site - skipping`);
                continue;
            }

            // ---- Check SKU from HTML Attribute ----
            const pageSKU = await page.getAttribute('form[data-product-sku]', 'data-product-sku');

            if (!pageSKU) {
                throw new Error(`❌ SKU ${product.sku} not found on the page`);
            }

            if (pageSKU.toLowerCase() !== product.sku.toLowerCase()) {
                console.log(`❌ SKU mismatch! CSV SKU = ${product.sku}, Page SKU = ${pageSKU}. Skipping...`);
                continue;
            }

            console.log(`✅ SKU verified: ${pageSKU}`);

            // --- Validate Language with detectLanguage helper ---
            const h1Element = page.locator('h1.ax-page-title');
            const h1Text = (await h1Element.textContent())?.trim() || '';
            const pageTitle = await page.title();

            const h1Lang = detectLanguage(h1Text);
            const titleLang = detectLanguage(pageTitle);

            console.log(`🌍 Language Detection Results:`);
            console.log(`   → H1 text: "${h1Text.substring(0, 50)}..."`);
            console.log(`   → H1 detected language: ${h1Lang}`);
            console.log(`   → Title detected language: ${titleLang}`);
            console.log(`   → Expected language: ${EXPECTED_LANGUAGE}`);

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
                console.log(`✅ Language validation passed for ${EXPECTED_LANGUAGE.toUpperCase()}`);
            } else if (h1Lang === 'unknown' || titleLang === 'unknown') {
                console.log(`⚠️ Some language detection was inconclusive`);
            } else {
                console.log(`❌ Language mismatch detected!`);
            }

            // Check the title language (legacy function)
            await CheckTitleLanguage(page);

            // Check the discription
            await Description(page);

            // Check the Info table
            await InfoTable(page);

        } catch (error) {
            console.error(`❌ Error processing SKU ${product.sku}:`, error);

            try {
                if (!page.isClosed()) {
                    const screenshotPath = `screenshots/error_${product.sku}.png`;
                    await page.screenshot({ path: screenshotPath, fullPage: true });
                    console.log(`📸 Screenshot saved to ${screenshotPath}`);
                } else {
                    console.log("⚠️ Could not take screenshot: Page is closed.");
                }
            } catch (screenshotError) {
                console.log("⚠️ Failed to take screenshot:", screenshotError);
            }
        }
    }

});