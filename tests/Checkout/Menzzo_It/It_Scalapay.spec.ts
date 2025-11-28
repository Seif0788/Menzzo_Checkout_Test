import { test, expect, Page } from '@playwright/test';
import {
  clickElementByText,
  search,
  ClickRandomProduct,
  clickElementByTextWithPopUp,
  waitForCheckoutReady,
} from '../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../helpers/Checkout/General_Checkout';

test('It_Scalapay', async ({ page }) => {
  // 1️⃣ Open Menzzo.de
  await page.goto('https://www.menzzo.it');

  // 2️⃣ Close cookies popup
  await clickElementByText(page, 'Accettare tutto');

  // 3️⃣ Search for "Tavolino"
  await search(page, 'Tavolino');

  // 4️⃣ Click on a random product
  await ClickRandomProduct(page);

  // 5️⃣ Wait for product page to load
  console.log('⏳ Waiting for product page to load...');
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  console.log('✅ Product page loaded.');

  // 6️⃣ Click "Aggiungi al Carrello"
  await clickElementByText(page, 'Aggiungi al Carrello');

  // 7️⃣ Click "Vai al tuo carrello e ordina"
  await clickElementByTextWithPopUp(page, 'Vai al tuo carrello e ordina');

  // 8️⃣ Navigate to checkout
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
      clickElementByText(page, 'Conferma il tuo carrello', 5000, { debug: true }),
    ]);
  } catch (e) {
    console.log("⚠️ 'Conferma il tuo carrello' click failed or timed out.");
  }

  // Fallback: if not on checkout, try "Zur Kasse" (standard button)
  if (!page.url().includes('onestepcheckout')) {
    console.log("ℹ️ Not on checkout page yet. Trying 'ordine'...");
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
      clickElementByText(page, 'ordine', 10000).catch(() => console.log("⚠️ 'ordine' also failed.")),
    ]);
  }
  console.log('✅ Navigation to checkout complete. Waiting for OneStepCheckout...');

  let checkoutPage = page;

  // 9️⃣ Wait for checkout form readiness
  try {
    await waitForCheckoutReady(page);
  } catch (err) {
    if (String(err).includes('Target page') || String(err).includes('closed')) {
      console.warn('⚠️ Detected checkout reload or new tab — recovering...');
      const allPages = page.context().pages();
      for (const p of allPages) {
        if (/onestepcheckout/i.test(p.url())) {
          checkoutPage = p;
          console.log(`🔄 Switched to new checkout page: ${checkoutPage.url()}`);
          break;
        }
      }
      await waitForCheckoutReady(checkoutPage);
    } else {
      throw err;
    }
  }

  // 7️⃣ Fill checkout data
  const checkoutData: CheckoutData = {
    firstName: 'Seif',
    lastName: 'Taj',
    email: 'seif@axelites.com',
    phone: '123456',
    address: ['Via dei Barbieri, 7'],
    postalCode: '58100',
    city: 'Grosseto',
    //deliveryMethod: 'Home Delivery - At Room',
    paymentMethod: 'Scalapay'
  };

  await performCheckout(checkoutPage, checkoutData);
    console.log('✅ Checkout performed successfully.');
  
    // 9️⃣ Confirm navigation to payment method page
    // Refine the locator for the payment method page title
    console.log('⏳ Verifying navigation to payment method page...');
    await checkoutPage.waitForSelector('h1.page-title', { state: 'visible', timeout: 60000 });
    const pageTitle = await checkoutPage.locator('h1.page-title').innerText();
    expect(pageTitle).toMatch(/Completa l'ordine online/i);
    console.log('✅ Successfully navigated to payment method page.');
  
    //Validate Scalapay login page opened
    try {
      console.log("⏳ Waiting for Scalapay popup or redirect...");
  
      const popupOrRedirect = await Promise.race([
        page.waitForEvent('popup', { timeout: 60000 }).then(p => ({ type: 'popup', page: p })),
        page.waitForURL(/portal\.scalapay\.com/, { timeout: 60000, waitUntil: 'domcontentloaded' }).then(() => ({ type: 'redirect', page: page }))
      ]);
  
      if (popupOrRedirect.type === 'popup') {
        const popup = popupOrRedirect.page as Page;
        await popup.waitForLoadState();
        await expect(popup).toHaveURL(/portal\.scalapay\.com/);
        console.log("✅ Scalapay popup detected!");
      } else {
        console.log("✅ Scalapay redirect successful!");
      }
    } catch (err) {
      console.error("❌ Scalapay redirect/popup FAILED!");
      console.error("⚠️ Current URL:", page.url());
      console.error("⚠️ Error:", err);
      throw err;
    }
})