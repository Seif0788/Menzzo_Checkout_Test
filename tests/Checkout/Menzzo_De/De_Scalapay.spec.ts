import { test, expect, Page } from '@playwright/test';
import { attachment } from 'allure-js-commons';
import { clickElementByText, search, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady } from '../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../helpers/Checkout/General_Checkout';
import { Scalapay_Payment } from '../../../helpers/Checkout/Payment_menthod';

test('De_Scalapay', async ({ page }) => {
  // 1️⃣ Open Menzzo.de
  await page.goto('https://www.menzzo.de');

  // 2️⃣ Close cookies popup
  await clickElementByText(page, 'Alle akzeptieren');

  // 3️⃣ Search for "Sofa"
  await search(page, 'Sofa');

  // 4️⃣ Click on a random product
  await ClickRandomProduct(page);

  // 5️⃣ Wait for product page to load
  attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  attachment('Console Log', '✅ Product page loaded.', 'text/plain');

  // 6️⃣ Click "In den Warenkorb"
  await clickElementByText(page, 'In den Warenkorb');

  // 7️⃣ Click "Warenkorb anzeigen und bestellen"
  await clickElementByTextWithPopUp(page, 'Warenkorb anzeigen und bestellen');

  // 8️⃣ Navigate to checkout
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
      clickElementByText(page, 'Warenkorb bestätigen', 5000, { debug: true }),
    ]);
  } catch (e) {
    attachment('Console Warn', "⚠️ 'Warenkorb bestätigen' click failed or timed out.", 'text/plain');
  }

  // Fallback: if not on checkout, try "Zur Kasse" (standard button)
  if (!page.url().includes('onestepcheckout')) {
    attachment('Console Log', "ℹ️ Not on checkout page yet. Trying 'Zur Kasse'...", 'text/plain');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
      clickElementByText(page, 'Zur Kasse', 10000).catch(() => attachment('Console Warn', "⚠️ 'Zur Kasse' also failed.", 'text/plain')),
    ]);
  }
  attachment('Console Log', '✅ Navigation to checkout complete. Waiting for OneStepCheckout...', 'text/plain');

  let checkoutPage = page;

  // 9️⃣ Wait for checkout form readiness
  try {
    await waitForCheckoutReady(page);
  } catch (err) {
    if (String(err).includes('Target page') || String(err).includes('closed')) {
      attachment('Console Warn', '⚠️ Detected checkout reload or new tab — recovering...', 'text/plain');
      const allPages = page.context().pages();
      for (const p of allPages) {
        if (/onestepcheckout/i.test(p.url())) {
          checkoutPage = p;
          attachment('Console Log', `🔄 Switched to new checkout page: ${checkoutPage.url()}`, 'text/plain');
          break;
        }
      }
      await waitForCheckoutReady(checkoutPage);
    } else {
      throw err;
    }
  }

  // 10️⃣ Fill checkout data
  const checkoutData: CheckoutData = {
    firstName: 'Seif',
    lastName: 'Taj',
    email: 'seif@axelites.com',
    phone: '123456',
    address: ['Am Ausbesserungswerk 8'],
    postalCode: '80939',
    city: 'München',
    //deliveryMethod: 'Home Delivery - At Room',
    paymentMethod: 'Scalapay',
  };

  await performCheckout(checkoutPage, checkoutData);
  attachment('Console Log', '✅ Checkout performed successfully.', 'text/plain');

  await Scalapay_Payment(checkoutPage);
});
