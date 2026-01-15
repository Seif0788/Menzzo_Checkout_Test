import { Page, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';

export async function checkFeaturedProducts(
    page: Page,
    options?: {
        sectionSelector?: string;
        maxProductsToCheck?: number;
    }
) {
    const sectionSelector = options?.sectionSelector ?? '#section-top';
    const maxProducts = options?.maxProductsToCheck ?? 10;

    console.log('\n▶ Check "Les produits à la Une" section');

    const section = page.locator(sectionSelector);
    await expect(section).toBeVisible();
    await section.scrollIntoViewIfNeeded();
    console.log('✅ Section is visible');

    attachment(
        'Section visibility',
        '✅ "Les produits à la Une" section is visible',
        'text/plain'
    );

    /* ---------------------------
       Section title
    --------------------------- */
    const title = await section.locator('h2').innerText();
    console.log(`📝 Section title: ${title}`);

    attachment('Section title', title, 'text/plain');

    expect(title).toMatch(/produits à la une/i);

    /* ---------------------------
       Product cards
    --------------------------- */
    const products = section.locator('.carousel-cell');
    const productCount = await products.count();

    console.log(`📦 Number of products found: ${productCount}`);
    attachment(
        'Product count',
        `Found ${productCount} products in slider`,
        'text/plain'
    );

    expect(productCount).toBeGreaterThan(0);

    /* ---------------------------
       Check first N products
    --------------------------- */
    const limit = Math.min(productCount, maxProducts);

    for (let i = 0; i < limit; i++) {
        console.log(`\n▶ Checking product ${i + 1}`);

        const product = products.nth(i);

        /* ---------------------------
           Check image, name, URL, screenshot
        --------------------------- */
        await checkProduct(product, i);

        // After checking the first product(s), click "Previous" button once
        if (i === 0) { // click only once after first check
            const prevButton = page.locator(
                'button.flickity-prev-next-button.previous:not([disabled])'
            );
            const isPrevVisible = await prevButton.count();

            if (isPrevVisible) {
                console.log('⬅️ Clicking "Previous" button to scroll slider');
                await prevButton.first().click();
                await page.waitForTimeout(1000); // small wait for slider to animate

                // Re-check images of the first N products again after clicking
                console.log('🔄 Re-checking products after clicking "Previous" button');
                for (let j = 0; j < limit; j++) {
                    const productRecheck = products.nth(j);
                    await checkProduct(productRecheck, j);
                }
            } else {
                console.log('⚠️ "Previous" button not visible or disabled');
            }
        }
    }

    /* ---------------------------
       Section screenshot
    --------------------------- */
    console.log('📸 Taking section screenshot');
    const sectionShot = await section.screenshot();
    attachment(
        'Featured products section screenshot',
        sectionShot,
        'image/png'
    );

    console.log('✅ Featured products section check completed\n');
}


async function checkProduct(product: any, index: number) {
    /* Image presence */
    const hasImage = (await product.locator('img, picture').count()) > 0;
    const imageMsg = hasImage
        ? `✅ Product ${index + 1}: image found`
        : `❌ Product ${index + 1}: image missing`;
    console.log(imageMsg);
    attachment(`Product ${index + 1} – image presence`, imageMsg, 'text/plain');

    if (hasImage) {
        const img = product.locator('img').first();
        const isLoaded = await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0);
        const loadedMsg = isLoaded
            ? `✅ Product ${index + 1}: image loaded`
            : `⚠️ Product ${index + 1}: image not loaded`;
        console.log(loadedMsg);
        attachment(`Product ${index + 1} – image loaded`, loadedMsg, 'text/plain');
    }

    /* Product name */
    let name = '';
    try {
        // Try the standard class first
        name = await product.locator('.product-name').innerText({ timeout: 1000 });
        console.log(`🏷 Product name: ${name}`);
        attachment(`Product ${index + 1} – name`, name, 'text/plain');
    } catch (e) {
        // Fallback: try to get text from the first anchor tag
        try {
            const link = product.locator('a');
            name = (await link.innerText({ timeout: 1000 })).trim();

            if (name.length > 0) {
                console.log(`🏷 Product name (from link): ${name}`);
                attachment(`Product ${index + 1} – name`, name, 'text/plain');
            } else {
                throw new Error('Link text is empty');
            }
        } catch (e2) {
            console.log(`❌ Product ${index + 1}: name missing`);
        }
    }

    /* Product URL */
    try {
        const href = await product.locator('a[href]').first().getAttribute('href');
        const linkMsg = href ? `🔗 ${href}` : '❌ Product link missing';
        console.log(linkMsg);
        attachment(`Product ${index + 1} – URL`, linkMsg, 'text/plain');
        expect(href).toBeTruthy();
    } catch (e) {
        console.log(`❌ Product ${index + 1}: link missing`);
    }

    /* Screenshot per product */
    try {
        const productShot = await product.screenshot();
        attachment(`Product ${index + 1} – screenshot`, productShot, 'image/png');
    } catch (e) {
        console.log(`❌ Product ${index + 1}: screenshot missing`);
    }
}

export async function BestSellers(
    page: Page,
    options?: {
        sectionSelector?: string;
        maxProductsToCheck?: number;
    }
): Promise<{ ctaText: string; ctaUrl: string }> {
    const sectionSelector = options?.sectionSelector ?? '#best-sellers';
    const maxProducts = options?.maxProductsToCheck ?? 10;

    console.log('\n▶ Check "Best sellers" section');

    const section = page.locator(sectionSelector);
    await expect(section).toBeVisible();
    await section.scrollIntoViewIfNeeded();
    console.log('✅ Section is visible');

    attachment(
        'Section visibility',
        '✅ "Best sellers" section is visible',
        'text/plain'
    );

    /* ---------------------------
       Section title
    --------------------------- */
    const title = await section.locator('h2').innerText();
    console.log(`📝 Section title: ${title}`);

    attachment('Section title', title, 'text/plain');

    expect(title).toMatch(/Les Best Sellers du moment/i);

    /* ---------------------------
       Product cards
    --------------------------- */
    const products = section.locator('.carousel-cell');
    const productCount = await products.count();

    console.log(`📦 Number of products found: ${productCount}`);
    attachment(
        'Product count',
        `Found ${productCount} products in slider`,
        'text/plain'
    );

    expect(productCount).toBeGreaterThan(0);

    /* ---------------------------
       Check first N products
    --------------------------- */
    const limit = Math.min(productCount, maxProducts);

    for (let i = 0; i < limit; i++) {
        console.log(`\n▶ Checking product ${i + 1}`);

        const product = products.nth(i);

        /* ---------------------------
           Check image, name, URL, screenshot
        --------------------------- */
        await checkProduct(product, i);
    }

    /* ---------------------------
       Section screenshot
    --------------------------- */
    console.log('📸 Taking section screenshot');
    const sectionShot = await section.screenshot();
    attachment(
        'Featured products section screenshot',
        sectionShot,
        'image/png'
    );

    console.log('✅ Featured products section check completed\n');

    /* -------------------------------------
      Check the "Best sellers" button
   ------------------------------------- */
    // Use a more robust selector that checks for the link with "best-sellers" in href
    const bestSellersButton = section.locator('a[href*="best-sellers"]').first();
    await expect(bestSellersButton, '❌ Best sellers CTA is not visible').toBeVisible();
    console.log('✅ Best sellers button is visible');

    attachment(
        'Best sellers button visibility',
        '✅ Best sellers button is visible',
        'text/plain'
    );

    //Check text
    const ctaText = (await bestSellersButton.innerText()).trim();
    console.log(`🏷 Best sellers CTA text: ${ctaText}`);

    // Allow French text as well
    expect(ctaText, `❌ Unexpected CTA text: ${ctaText}`).toMatch(/Best sellers|Voir toutes les meilleures ventes/i);
    attachment('Best sellers CTA text', ctaText, 'text/plain');

    //Check URL
    const ctaUrl = await bestSellersButton.getAttribute('href');
    console.log(`🔗 Best sellers CTA URL: ${ctaUrl}`);

    expect(ctaUrl, '❌ Best sellers CTA URL is missing').toBeTruthy();
    attachment('Best sellers CTA URL', ctaUrl ?? '', 'text/plain');
    return {
        ctaText,
        ctaUrl: ctaUrl ?? '',
    };
}

export async function ReviewSection(page: Page, options?: {
    Review_title?: string;
    VideoTitle?: string;
}) {

    console.log('\n▶ Check "Reviews" section');
    const ReviewSection = page.locator('#review-section');
    await expect(ReviewSection).toBeVisible();
    await ReviewSection.scrollIntoViewIfNeeded();
    console.log('✅ Section is visible');

    attachment(
        'Section visibility',
        '✅ "Reviews" section is visible',
        'text/plain'
    );

    /* ---------------------------
       Section title
    --------------------------- */
    const Review_title = await ReviewSection.locator('h2').innerText();
    console.log(`📝 Section title: ${Review_title}`);

    attachment('Section title', Review_title, 'text/plain');

    /* ---------------------------
       Product cards
    --------------------------- */
    const reviews = ReviewSection.locator('.infinite-item');
    const reviewscount = await reviews.count();

    console.log(`📦 Number of products found: ${reviewscount}`);
    attachment(
        'Reviews count',
        `Found ${reviewscount} reviews in slider`,
        'text/plain'
    );

    expect(reviewscount).toBeGreaterThan(0);

    /* ---------------------------
       Section screenshot
    --------------------------- */
    console.log('📸 Taking section screenshot');
    const sectionShot = await ReviewSection.screenshot();
    attachment(
        'Reviews section screenshot',
        sectionShot,
        'image/png'
    );
    console.log('✅ Reviews section check completed\n');
    console.log(`📝 Section title: ${Review_title}`);

    /*----------------------------
       Check Témoinignages video
    --------------------------- */
    const videoSection = ReviewSection.locator('.review-video');
    await expect(videoSection).toBeVisible();
    console.log('✅ Témoinignages video is visible');
    attachment(
        'Témoinignages video visibility',
        '✅ Témoinignages video is visible',
        'text/plain'
    );
    const videolinkButton = videoSection.locator('a[aria-label="Voir tout"]');
    const videoUrl = await videolinkButton.getAttribute('href');
    console.log(`🔗 Témoinignages video URL: ${videoUrl}`);
    attachment('Témoinignages video URL', videoUrl ?? '', 'text/plain');
    const videoUrlTitle = await videolinkButton.innerText();
    console.log(`🏷 Témoinignages video URL title: ${videoUrlTitle}`);
    attachment('Témoinignages video URL title', videoUrlTitle, 'text/plain');
    const VideoTitle = (await videoSection.locator('h3').innerText()).trim();
    console.log(`📝 Section title: ${VideoTitle}`);
    attachment('Section title', VideoTitle, 'text/plain');

    return { VideoTitle, Review_title, videoUrl: videoUrl ?? '', videoUrlTitle: videoUrlTitle.trim() };
}

export async function checkInfiniteReviews(page: Page) {
    const reviewSection = page.locator('#review');
    const scrollContainer = reviewSection.locator('.infinite-review');
    const reviewItems = reviewSection.locator('li.infinite-item');

    // 1️⃣ Initial count
    const initialCount = await reviewItems.count();
    expect(initialCount).toBeGreaterThan(0);

    // 2️⃣ Scroll inside the container
    await scrollContainer.evaluate(async (el) => {
        el.scrollTop = el.scrollHeight;
    });

    // Optional: repeat scroll to be safe
    await page.waitForTimeout(1000);

    await scrollContainer.evaluate(async (el) => {
        el.scrollTop = el.scrollHeight;
    });

    // 3️⃣ Wait for new items to load
    await page.waitForTimeout(2000);

    // 4️⃣ Final count
    const finalCount = await reviewItems.count();

    // 5️⃣ Validation: count must be at least double
    expect(finalCount).toBeGreaterThanOrEqual(initialCount * 2);
}


