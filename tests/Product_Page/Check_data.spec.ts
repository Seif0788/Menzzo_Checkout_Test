import { test, Page } from '@playwright/test';
import { clickElementByText, search, ClickRandomProduct, CheckTimeBox } from '../../helpers/utils';
import { verifyH1MatchesTitle, breadcrumb, CheckProductAvailability, CheckStockAndShipping, DeliveryPricePopup, FreereturnDisplay, FreereturnPopUp, review_report, Description, InfoTable, upsell, ClientViews, getProductPrice, Check_Image, OtherColor } from '../../helpers/Product_page_helpers/Elementer_Page';
import fs from 'fs';
import Papa from 'papaparse';


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
    await page.goto('https://www.menzzo.fr');
    console.log("🚪 Menzzo.fr was opened");

    // --- Close Cookies popup ---
    await clickElementByText(page, "Accepter et continuer");
    console.log("✅ Cookies was closed");

    // --- Load categories from CSV ---
    const categories = loadCategoriesFromCSV('data/Category.csv');

    // --- Click a random category ---
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    await selectCategory(page, randomCategory);
    console.log(`🔹 Selected category: ${randomCategory}`);

    await ClickRandomProduct(page);
    console.log('✅ Random product selected.');

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