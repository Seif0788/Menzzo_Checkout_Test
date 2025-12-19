import { test, Page, expect } from '@playwright/test';
import { allure } from "allure-playwright";
import { clickElementByText, search, ClickRandomProduct, CheckTimeBox } from '../../../helpers/utils';
import { verifyH1MatchesTitle, breadcrumb, CheckProductAvailability, CheckStockAndShipping, DeliveryPricePopup, FreereturnDisplay, FreereturnPopUp, review_report, Description, InfoTable, upsell, ClientViews, getProductPrice, Check_Image, OtherColor } from '../../../helpers/Product_page_helpers/Elementer_Page';
import { detectLanguage } from '../../../helpers/detect_language';
import fs from 'fs';
import Papa from 'papaparse';

// Expected language for this test suite
const EXPECTED_LANGUAGE = 'fr';


//---- 1. Load categories from CSV -----
function loadCategoriesFromCSV(filePath: string): string[] {
    const fileComent = fs.readFileSync(filePath, 'utf-8');
    const parsed = Papa.parse(fileComent, { header: true });
    //Assuming CSV has a column named "Categroy"
    return parsed.data.map((row: any) => row.Category).filter(Boolean);
}

//----2. Function to select category ---
async function selectCategory(page: Page, categoryName: string) {
    await clickElementByText(page, categoryName);
    allure.attachment('Console Log', `✅ Selected category: ${categoryName}`, 'text/plain');
}


test('Check_product_page', async ({ page }) => {
    // --- Open menzzo.fr ---
    await page.goto('https://www.menzzo.fr');
    allure.attachment('Console Log', "🚪 Menzzo.fr was opened", 'text/plain');

    // --- Close Cookies popup ---
    await clickElementByText(page, "Accepter et continuer");
    allure.attachment('Console Log', "✅ Cookies was closed", 'text/plain');

    // --- Load categories from CSV ---
    const categories = loadCategoriesFromCSV('data/Category.csv');

    // --- Click a random category ---
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    await selectCategory(page, randomCategory);
    allure.attachment('Console Log', `🔹 Selected category: ${randomCategory}`, 'text/plain');

    await ClickRandomProduct(page);
    allure.attachment('Console Log', '✅ Random product selected.', 'text/plain');

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