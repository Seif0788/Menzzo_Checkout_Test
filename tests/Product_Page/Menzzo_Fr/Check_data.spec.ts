import { test, Page, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';
import { clickElementByText, search, ClickRandomProduct, CheckTimeBox, ensurePageIsOpen } from '../../../helpers/utils';
import { verifyH1MatchesTitle, breadcrumb, CheckProductAvailability, CheckStockAndShipping, DeliveryPricePopup, FreereturnDisplay, FreereturnPopUp, review_report, Description, InfoTable, upsell, ClientViews, getProductPrice, Check_Image, OtherColor } from '../../../helpers/Product_page_helpers/Elementer_Page';
import { detectLanguage } from '../../../helpers/detect_language';
import fs from 'fs';
import Papa from 'papaparse';

// Expected language for this test suite
const EXPECTED_LANGUAGE = 'fr';

//---CSV types -----
interface ProductRow {
    entity_id: string;
    sku: string;
}

// --- Load product from CSV ---
function loadProductFromCSV(filePath: string): ProductRow[] {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = Papa.parse(fileContent, { header: true });

    return parsed.data
        .map((row: any) => ({
            entity_id: row.entity_id,
            sku: row.sku,
        }))
        .filter((p: ProductRow) => p.entity_id && p.sku);
}

function seededShuffle<T>(array: T[], seed: number): T[] {
    let result = [...array];
    let random = seed;

    for (let i = result.length - 1; i > 0; i--) {
        random = (random * 9301 + 49297) % 233280;
        const j = Math.floor((random / 233280) * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

// --- Load product from CSV ---
const products = loadProductFromCSV('data/All_product.csv');

if (products.length === 0) {
    throw new Error("❌ No products loaded! Check the CSV file path and headers (expected 'entity_id', 'sku').");
}

// Limit the number of iterations
const MAX_ITERATIONS = 3;
const SEED = process.env.PLAYWRIGHT_SEED
    ? Number(process.env.PLAYWRIGHT_SEED)
    : 123456;

const shuffleProduct = seededShuffle(products, SEED);

const productsToProcess = shuffleProduct.slice(0, MAX_ITERATIONS);

test.beforeAll(() => {
    console.log('PLAYWRIGHT_SEED =', SEED);
});

test.describe('Check_product_page', () => {
    test.describe.configure({ retries: 0 });

    test.beforeEach(async ({ page }) => {
        // --- Open menzzo.fr ---
        await page.goto('https://www.menzzo.fr');
        attachment('Console Log', "🚪 Menzzo.fr was opened", 'text/plain');

        // --- Close Cookies popup ---
        await clickElementByText(page, "Accepter et continuer");
        attachment('Console Log', "✅ Cookies was closed", 'text/plain');
    })

    for (const product of productsToProcess) {
        test(`Product page validation | SKU: ${product.sku} | ID=${product.entity_id}`, async ({ page }) => {
            test.setTimeout(60000);
            page = await ensurePageIsOpen(page, page.context());

            // --- Navigate to product page ---
            const url = `https://www.menzzo.fr/catalog/product/view/id/${product.entity_id}`;
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
                test.skip(true, `Product not available on menzzo.fr`);
            }

            const pageSKU = await page.getAttribute('form[data-product-sku]', 'data-product-sku');

            expect(pageSKU, 'SKU must exist').toBeTruthy();
            expect(pageSKU!.toLowerCase()).toBe(product.sku.toLowerCase())

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
            attachment('Console Log', langResults, 'text/plain');

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
                attachment('Console Log', `✅ Language validation passed for ${EXPECTED_LANGUAGE.toUpperCase()}`, 'text/plain');
            } else if (h1Lang === 'unknown' || titleLang === 'unknown') {
                attachment('Console Warn', `⚠️ Some language detection was inconclusive`, 'text/plain');
            } else {
                attachment('Console Error', `❌ Language mismatch detected!`, 'text/plain');
            }

            //Check that the title contains "product_name"
            await verifyH1MatchesTitle(page);

            //Check the price of the pridut
            await getProductPrice(page);

            // Check that the breadcrumb it's correct
            await breadcrumb(page);

            // Check the time box
            await CheckTimeBox(page);

            // Check the tag
            await CheckProductAvailability(page);

            // Check the date from and to for In stock products
            await CheckStockAndShipping(page);

            // Check the delivery popup
            await DeliveryPricePopup(page);

            // Check the Free return dispaly
            await FreereturnDisplay(page);

            // Check the Free return popup
            await FreereturnPopUp(page);

            // Check the review
            await review_report(page);

            // Check the discription
            await Description(page);

            // Check the Info table
            await InfoTable(page);

            // Check the upsell
            await upsell(page);

            // Check the client reviews
            await ClientViews(page);

            //Check images
            await Check_Image(page);

            //Check color assocation
            await OtherColor(page);
        });
    }
    test.afterEach(async ({ page }) => {
        await page.close();
    });
});
