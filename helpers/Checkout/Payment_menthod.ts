import { Page, expect } from "@playwright/test";
import { attachment } from "allure-js-commons";

export async function detect_Store(page: Page) {
    // 1. Detect language from URL
    const currentUrl = page.url();
    let lang = 'fr'; // default fallback

    if (currentUrl.includes('menzzo.de')) lang = 'de';
    else if (currentUrl.includes('menzzo.nl')) lang = 'nl';
    else if (currentUrl.includes('menzzo.it')) lang = 'it';
    else if (currentUrl.includes('menzzo.es')) lang = 'es';
    else if (currentUrl.includes('menzzo.pt')) lang = 'pt';
    else if (currentUrl.includes('menzzo.be')) lang = 'fr';
    else if (currentUrl.includes('menzzo.at')) lang = 'de';
    else if (currentUrl.includes('nl.menzzo.be')) lang = 'nl';


    // 2. i18n dictionary (title text per language)
    const i18n: Record<string, { title: string }> = {
        fr: { title: "Finaliser la commande" },
        de: { title: "Bestellung abschließen" },
        nl: { title: "Rond de bestelling af" },
        it: { title: "Completa l'ordine online" },
        es: { title: "Finalizar el pedido" },
        pt: { title: "Finalizar o pedido" }
    };

    const data = i18n[lang] || i18n['fr'];
    // 9️⃣ Confirm navigation to payment method page
    // Refine the locator for the payment method page title
    attachment('Console Log', '⏳ Verifying navigation to payment method page...', 'text/plain');
    await page.waitForSelector('h1.page-title', { state: 'visible', timeout: 60000 });
    const pageTitle = await page.locator('h1.page-title').innerText();
    expect(pageTitle).toMatch(data.title);
    attachment('Console Log', '✅ Successfully navigated to payment method page.', 'text/plain');
    return data.title;
}

export async function Stripe_Payment(page: Page) {
    // 9️⃣ Confirm navigation to payment method page
    attachment('Console Log', '⏳ Verifying navigation to Stripe...', 'text/plain');
    try {
        await expect(page).toHaveURL(/stripe\.com/, { timeout: 60000 });
        attachment('Console Log', '✅ Successfully navigated to Stripe.', 'text/plain');
    } catch (e) {
        attachment('Console Error', `❌ Failed to navigate to Stripe. Current URL: ${page.url()}`, 'text/plain');
        throw e;
    }
}

export async function Klanra_Payment(page: Page) {
    // 2️⃣ Wait for Klarna popup or redirect INSIDE the loop
    attachment('Console Log', '⏳ Waiting for Klarna popup or redirect...', 'text/plain');

    const popupOrRedirect = await Promise.race([
        page.waitForEvent('popup', { timeout: 60000 }).then(p => ({ type: 'popup', page: p })),
        page.waitForURL(/klarna\.com/, { timeout: 60000, waitUntil: 'domcontentloaded' }).then(() => ({ type: 'redirect', page: page }))
    ]);
    if (popupOrRedirect.type === 'popup') {
        const popup = popupOrRedirect.page as Page;
        await popup.waitForLoadState();
        await expect(popup).toHaveURL(/klarna\.com/);
        attachment('Console Log', "✅ Klarna popup detected!", 'text/plain');
    } else {
        attachment('Console Log', "✅ Klarna redirect detected!", 'text/plain');
    }
}

export async function Scalapay_Payment(page: Page) {

    const store = await detect_Store(page);
    // 9️⃣ Confirm navigation to payment method page
    // Refine the locator for the payment method page title
    attachment('Console Log', '⏳ Verifying navigation to payment method page...', 'text/plain');
    await page.waitForSelector('h1.page-title', { state: 'visible', timeout: 60000 });
    const pageTitle = await page.locator('h1.page-title').innerText();
    expect(pageTitle).toMatch(store);
    attachment('Console Log', '✅ Successfully navigated to payment method page.', 'text/plain');

    //Validate Scalapay login page opened
    try {
        attachment('Console Log', "⏳ Waiting for Scalapay popup or redirect...", 'text/plain');

        const popupOrRedirect = await Promise.race([
            page.waitForEvent('popup', { timeout: 60000 }).then(p => ({ type: 'popup', page: p })),
            page.waitForURL(/portal(\.integration)?\.scalapay\.com/, { timeout: 60000, waitUntil: 'domcontentloaded' }).then(() => ({ type: 'redirect', page: page }))
        ]);

        if (popupOrRedirect.type === 'popup') {
            const popup = popupOrRedirect.page as Page;
            await popup.waitForLoadState();
            await expect(popup).toHaveURL(/portal(\.integration)?\.scalapay\.com/);
            attachment('Console Log', "✅ Scalapay popup detected!", 'text/plain');
        } else {
            attachment('Console Log', "✅ Scalapay redirect successful!", 'text/plain');
        }
    } catch (err) {
        attachment('Console Error', "❌ Scalapay redirect/popup FAILED!", 'text/plain');
        attachment('Console Error', `⚠️ Current URL: ${page.url()}`, 'text/plain');
        attachment('Console Error', `⚠️ Error: ${err}`, 'text/plain');
        throw err;
    }
}

export async function SeQura_Payment(page: Page) {
    const store = await detect_Store(page);
    // 9️⃣ Confirm navigation to payment method page
    // Refine the locator for the payment method page title
    attachment('Console Log', '⏳ Verifying navigation to payment method page...', 'text/plain');
    await page.waitForSelector('h1.page-title', { state: 'visible', timeout: 60000 });
    const pageTitle = await page.locator('h1.page-title').innerText();
    expect(pageTitle).toMatch(store);
    attachment('Console Log', '✅ Successfully navigated to payment method page.', 'text/plain');

    // Wait for SeQura payment page to load
    attachment('Console Log', '⏳ Wait for SeQura Widget to load...', 'text/plain');
    const iframe = page.locator('iframe[src*="sequra"]');
    await iframe.waitFor({ state: 'visible', timeout: 60000 });
    attachment('Console Log', '✅ Page loaded after payment selection.', 'text/plain');
}