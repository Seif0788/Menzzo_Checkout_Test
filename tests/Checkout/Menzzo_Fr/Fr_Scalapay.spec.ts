import { test, expect, Page } from '@playwright/test';
import { allure } from "allure-playwright";
import { clickElementByText, search, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady } from '../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../helpers/Checkout/General_Checkout';

test('Scalapay_Fr', async ({ page }) => {
  test.setTimeout(180000);

  //Open Menzzo.fr
  await page.goto('https://www.menzzo.fr');

  //Close cookies popup;
  await clickElementByText(page, "Accepter et continuer");

  //Wright "Table" in the search bar
  await search(page, "Table");

  //Click in the rundem product
  await ClickRandomProduct(page);

  // Wait for product page to load
  allure.attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  allure.attachment('Console Log', '✅ Product page loaded.', 'text/plain');

  //Click in "Ajouter au panier"
  await clickElementByText(page, "Ajouter au panier");

  //Click in "Voir le panier & commander"
  await clickElementByTextWithPopUp(page, "Voir le panier & commander");

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => { }),
    clickElementByText(page, "Valider mon panier", 10000, { debug: true })
  ]);
  allure.attachment('Console Log', '✅ Navigation to checkout complete. Waiting for OneStepCheckout...', 'text/plain');

  allure.attachment('Console Log', '✅ Checkout page detected.', 'text/plain');

  // 6️⃣ Wait for checkout form readiness
  let checkoutPage = page;

  try {
    await waitForCheckoutReady(page);
  } catch (err) {
    if (String(err).includes('Target page') || String(err).includes('closed')) {
      allure.attachment('Console Warn', '⚠️ Detected checkout reload or new tab — recovering...', 'text/plain');
      // Look for a new checkout page in the context
      const allPages = page.context().pages();
      for (const p of allPages) {
        const url = p.url();
        if (/onestepcheckout/i.test(url)) {
          checkoutPage = p;
          //  allure.attachment('Console Log', `🔄 Switched to new checkout page: ${url}`, 'text/plain');
          break;
        }
      }
      // Retry with the new page reference
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
    address: ['10 Rue Exemple'],
    postalCode: '75001',
    city: 'Paris',
    deliveryMethod: 'Home Delivery - At Room',
    paymentMethod: 'Scalapay'
  };

  await performCheckout(checkoutPage, checkoutData);
  allure.attachment('Console Log', '✅ Checkout performed successfully.', 'text/plain');

  // 9️⃣ Confirm navigation to payment method page
  // Refine the locator for the payment method page title
  allure.attachment('Console Log', '⏳ Verifying navigation to payment method page...', 'text/plain');
  await checkoutPage.waitForSelector('h1.page-title', { state: 'visible', timeout: 60000 });
  const pageTitle = await checkoutPage.locator('h1.page-title').innerText();
  expect(pageTitle).toMatch(/Finaliser la commande/i);
  allure.attachment('Console Log', '✅ Successfully navigated to payment method page.', 'text/plain');

  //Validate Scalapay login page opened
  try {
    allure.attachment('Console Log', "⏳ Waiting for Scalapay popup or redirect...", 'text/plain');

    const popupOrRedirect = await Promise.race([
      page.waitForEvent('popup', { timeout: 60000 }).then(p => ({ type: 'popup', page: p })),
      page.waitForURL(/portal\.scalapay\.com/, { timeout: 60000, waitUntil: 'domcontentloaded' }).then(() => ({ type: 'redirect', page: page }))
    ]);

    if (popupOrRedirect.type === 'popup') {
      const popup = popupOrRedirect.page as Page;
      await popup.waitForLoadState();
      await expect(popup).toHaveURL(/portal\.scalapay\.com/);
      allure.attachment('Console Log', "✅ Scalapay popup detected!", 'text/plain');
    } else {
      allure.attachment('Console Log', "✅ Scalapay redirect successful!", 'text/plain');
    }
  } catch (err) {
    allure.attachment('Console Error', "❌ Scalapay redirect/popup FAILED!", 'text/plain');
    allure.attachment('Console Error', `⚠️ Current URL: ${page.url()}`, 'text/plain');
    allure.attachment('Console Error', `⚠️ Error: ${err}`, 'text/plain');
    throw err;
  }

})