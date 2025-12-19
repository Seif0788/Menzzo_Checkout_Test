import { Page, expect, Locator } from '@playwright/test';
import { selectCategory } from '../utils';
import { attachment } from 'allure-js-commons';
import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';

//--Checking the category Name
export async function CheckCategoryName(page: Page, CategoryName: string) {
    const CategoryNameLocator = page.locator('.category-description');
    await expect(CategoryNameLocator).toBeVisible();

    // Get text and normalize for comparison
    const actualText = await CategoryNameLocator.innerText();
    const normalizedActual = actualText.trim().toLowerCase();
    const normalizedExpected = CategoryName.trim().toLowerCase();

    attachment('Console Log', `DEBUG: Actual: "${actualText.trim()}", Expected: "${CategoryName}"`, 'text/plain');

    // Check if the expected text is contained in the actual text (case-insensitive)
    expect(normalizedActual).toContain(normalizedExpected);
    attachment('Console Log', `✅ Category Name matches: ${CategoryName}`, 'text/plain');
}

export async function verifyCategoryTitle(page: Page) {
    //Locate the H1 element
    const h1 = page.locator('.category-description');
    await expect.soft(h1, '.category-description').toBeVisible();

    //Get its text content
    const h1Text = (await h1.textContent())?.trim() || '';

    //Check that it's not empty
    expect.soft(h1Text.length, 'Category title should not be empty').toBeGreaterThan(0);

    //Get the page title
    let pageTitle = (await page.title()).trim();

    // Remmove "- Menzzo" suffix if present
    pageTitle = pageTitle.replace(/\s*-\s*menzzo$/i, '').trim();

    //Compare title and H1 
    expect.soft(
        pageTitle.toLowerCase(),
        'Page title should match H1 text'
    ).toBe(h1Text.toLowerCase());

    // ---Comparisaion----
    const match = h1Text.toLowerCase() === pageTitle.toLowerCase();

    if (match) {
        attachment('Console Log', `✅ SUCCESS: Page title matches H1 text`, 'text/plain');
        attachment('Console Log', `   H1: "${h1Text}"`, 'text/plain');
        attachment('Console Log', `   pageTitle: "${pageTitle}"`, 'text/plain');
    } else {
        attachment('Console Log', `❌ FAILED: Page title does not match H1 text`, 'text/plain');
        attachment('Console Log', `   H1: "${h1Text}"`, 'text/plain');
        attachment('Console Log', `   pageTitle: "${pageTitle}"`, 'text/plain');
    }
}

export async function CheckProductCount(page: Page) {
    const productCount = page.locator('span.ais-Stats-text.small');
    await expect(productCount).toBeVisible();

    const countText = (await productCount.textContent())?.trim() || '';

    const match = countText.match(/\d+/);
    const countNumber = match ? parseInt(match[0], 10) : 0;

    attachment('Console Log', `🔹 Number of products found: ${countNumber}`, 'text/plain');
    return countNumber;
}

export async function loadAllProducts(page: Page) {
    const loadMoreButton = page.locator('button.ais-InfiniteHits-loadMore');
    let clickCount = 0;

    while (await loadMoreButton.isVisible()) {

        const buttonClass = await loadMoreButton.getAttribute('class');
        if (buttonClass?.includes('ais-InfiniteHits-loadMore--disabled')) {
            attachment('Console Log', '🔹 Button disabled → all products loaded', 'text/plain');
            break;
        }

        const beforeCount = await page.locator('li.ais-InfiniteHits-item').count();

        attachment('Console Log', `⬇️ Clicking Load More (click ${clickCount + 1}) - Current products: ${beforeCount}`, 'text/plain');

        await loadMoreButton.scrollIntoViewIfNeeded();
        await loadMoreButton.click();

        // Wait for potential new products (max 4 seconds)
        await page.waitForTimeout(4000);

        const afterCount = await page.locator('li.ais-InfiniteHits-item').count();
        attachment('Console Log', `🔍 Products before: ${beforeCount}, after: ${afterCount}`, 'text/plain');

        // If number did not increase → nothing else to load
        if (afterCount <= beforeCount) {
            attachment('Console Log', "🔹 No new products loaded → reached the last page.", 'text/plain');
            break;
        }

        clickCount++;
    }

    attachment('Console Log', `✔️ All products loaded after ${clickCount} clicks`, 'text/plain');
}


export async function countProducts(page: Page): Promise<number> {
    await page.waitForTimeout(500); // small DOM settle delay

    const selector =
        'li.ais-InfiniteHits-item.d-flex.flex-column.search-result-card.mb-1.me-1';

    const items = page.locator(selector);
    const count = await items.count();

    attachment('Console Log', `🔹 Total products displayed: ${count}`, 'text/plain');

    return count;
}

export async function selectRandomCategory(page: Page) {

    //---- 1. Load categories from CSV -----
    function loadCategoriesFromCSV(filePath: string): string[] {
        const absolutePath = path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`CSV file not found at: ${absolutePath}`);
        }
        const fileContent = fs.readFileSync(absolutePath, 'utf-8');
        const parsed = Papa.parse(fileContent, { header: true });
        //Assuming CSV has a column named "Category"
        return parsed.data.map((row: any) => row.Category).filter(Boolean);
    }

    // --- Load categories from CSV ---
    const categories = loadCategoriesFromCSV('data/Category.csv');

    //Select category
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    await selectCategory(page, randomCategory);
    attachment('Console Log', `🔹 Selected category: ${randomCategory}`, 'text/plain');
}



