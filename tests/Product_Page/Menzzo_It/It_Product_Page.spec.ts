import { test, expect } from '@playwright/test';
import { allure } from "allure-playwright";
import { clickElementByText, search, ClickRandomProduct, CheckTimeBox, Button_Previous, Button_Next } from '../../../helpers/utils';
import { verifyH1MatchesTitle, breadcrumb, CheckProductAvailability, CheckStockAndShipping, DeliveryPricePopup, FreereturnDisplay, FreereturnPopUp, review_report, Description, InfoTable, upsell, ClientViews, Photo_product, CountPhoto } from '../../../helpers/Product_page_helpers/Elementer_Page';
import { detectLanguage } from '../../../helpers/detect_language';

// Expected language for this test suite
const EXPECTED_LANGUAGE = 'it';

test('Check_product_page', async ({ page }) => {

    await page.goto('https://www.menzzo.it');

    await clickElementByText(page, "Accettare tutto");
    allure.attachment('Console Log', '✅ Cookies accepted.', 'text/plain');

    await search(page, "Tavolino")

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

    // Count real number of pictures
    const totalPhotos = await CountPhoto(page);

    // Loop through each photo
    for (let i = 0; i < totalPhotos; i++) {

        allure.attachment('Console Log', `🖼 Checking photo ${i + 1} / ${totalPhotos}`, 'text/plain');

        // Check the big photo
        await Photo_product(page);

        // If not last photo → click Next
        if (i < totalPhotos - 1) {
            await Button_Next(page);
        }
    }

    // OPTIONAL: Go back to first image
    for (let i = 0; i < totalPhotos - 1; i++) {
        await Button_Previous(page);

        // Check the big photo
        await Photo_product(page);
    }
});