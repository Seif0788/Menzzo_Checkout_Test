import { Page, expect, Locator } from '@playwright/test';

//--Checking the category Name
export async function CheckCategoryName(page: Page, CategoryName: string) {
    const CategoryNameLocator = page.locator('.category-description');
    await expect(CategoryNameLocator).toBeVisible();

    // Get text and normalize for comparison
    const actualText = await CategoryNameLocator.innerText();
    const normalizedActual = actualText.trim().toLowerCase();
    const normalizedExpected = CategoryName.trim().toLowerCase();

    console.log(`DEBUG: Actual: "${actualText.trim()}", Expected: "${CategoryName}"`);

    // Check if the expected text is contained in the actual text (case-insensitive)
    expect(normalizedActual).toContain(normalizedExpected);
    console.log(`✅ Category Name matches: ${CategoryName}`);
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
        console.log(`✅ SUCCESS: Page title matches H1 text`);
        console.log(`   H1: "${h1Text}"`);
        console.log(`   pageTitle: "${pageTitle}"`);
    } else {
        console.log(`❌ FAILED: Page title does not match H1 text`);
        console.log(`   H1: "${h1Text}"`);
        console.log(`   pageTitle: "${pageTitle}"`);
    }
}

export async function CheckProductCount(page: Page) {
    const productCount = page.locator('span.ais-Stats-text.small');
    await expect(productCount).toBeVisible();

    const countText = (await productCount.textContent())?.trim() || '';

    const match = countText.match(/\d+/);
    const countNumber = match ? parseInt(match[0], 10) : 0;

    console.log(`🔹 Number of products found: ${countNumber}`);
    return countNumber;
}

export async function loadAllProducts(page: Page) {
    const loadMoreButton = page.locator('button.ais-InfiniteHits-loadMore');
    let clickCount = 0;

    while (await loadMoreButton.isVisible()) {

        const buttonClass = await loadMoreButton.getAttribute('class');
        if (buttonClass?.includes('ais-InfiniteHits-loadMore--disabled')) {
            console.log('🔹 Button disabled → all products loaded');
            break;
        }

        const beforeCount = await page.locator('li.ais-InfiniteHits-item').count();

        console.log(`⬇️ Clicking Load More (click ${clickCount + 1}) - Current products: ${beforeCount}`);

        await loadMoreButton.scrollIntoViewIfNeeded();
        await loadMoreButton.click();

        // Wait for potential new products (max 4 seconds)
        await page.waitForTimeout(4000);

        const afterCount = await page.locator('li.ais-InfiniteHits-item').count();
        console.log(`🔍 Products before: ${beforeCount}, after: ${afterCount}`);

        // If number did not increase → nothing else to load
        if (afterCount <= beforeCount) {
            console.log("🔹 No new products loaded → reached the last page.");
            break;
        }

        clickCount++;
    }

    console.log(`✔️ All products loaded after ${clickCount} clicks`);
}


export async function countProducts(page: Page): Promise<number> {
    await page.waitForTimeout(500); // small DOM settle delay

    const selector =
        'li.ais-InfiniteHits-item.d-flex.flex-column.search-result-card.mb-1.me-1';

    const items = page.locator(selector);
    const count = await items.count();

    console.log(`🔹 Total products displayed: ${count}`);

    return count;
}

