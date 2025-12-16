import { test, Page, expect } from '@playwright/test';
import { clickElementByText, search, ClickRandomProduct, CheckTimeBox } from '../../helpers/utils';
import { verifyH1MatchesTitle, breadcrumb, CheckProductAvailability, CheckStockAndShipping, DeliveryPricePopup, FreereturnDisplay, FreereturnPopUp, review_report, Description, InfoTable, upsell, ClientViews, getProductPrice, Check_Image, OtherColor } from '../../helpers/Product_page_helpers/Elementer_Page';
import { detectLanguage } from '../../helpers/detect_language';
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
    console.log(`✅ Selected category: ${categoryName}`);
}


test('Check_product_page', async ({ page }) => {
    // --- Open menzzo.fr ---
    await page.goto('https://menzzo2test.trydev.ovh/');
    console.log("🚪 Menzzo.fr was opened");

    // --- Close Cookies popup ---
    await clickElementByText(page, "Accepter et continuer");
    console.log("✅ Cookies was closed");

    //Wright "Table" in the search bar
    await search(page, "Table");

    //Click in the rundem product
    await ClickRandomProduct(page);

    console.log('✅ Random product selected.');

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