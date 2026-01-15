import { test, Page } from '@playwright/test';
import { attachment } from 'allure-js-commons';
import { clickElementByText } from '../../helpers/utils';
import fs from 'fs';
import Papa from 'papaparse';
import { CheckCategoryName, verifyCategoryTitle, CheckProductCount, countProducts, loadAllProducts } from '../../helpers/Category_page/Global_Checking';

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
    attachment('Console Log', `✅ Selected category: ${categoryName}`, 'text/plain');
}


test('Category testing', async ({ page }) => {
    // --- Open menzzo.fr ---
    await page.goto('https://www.menzzo.fr');
    attachment('Console Log', "🚪 Menzzo.fr was opened", 'text/plain');

    // --- Close Cookies popup ---
    await clickElementByText(page, "Accepter et continuer");
    attachment('Console Log', "✅ Cookies was closed", 'text/plain');

    // --- Load categories from CSV ---
    const categories = loadCategoriesFromCSV('data/Category.csv');

    // --- Click a random category ---
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    await selectCategory(page, randomCategory);
    attachment('Console Log', `🔹 Selected category: ${randomCategory}`, 'text/plain');

    // --- Check the category name on page ---
    await CheckCategoryName(page, randomCategory);

    await verifyCategoryTitle(page);

    //--- Found the product contity in the category ---
    await CheckProductCount(page);

    //--- Scroll down and count the category products ---
    await loadAllProducts(page);
    //await countProducts(page);
});
