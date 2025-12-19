import { test, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';
import { waitForCheckoutReady, clickElementByText, ClickRandomProduct, closeFloatingMenus, clickAddToCart } from '../../helpers/utils';

export interface CheckoutData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string[];
  postalCode: string;
  city: string;
  country?: string;
}

test('add_to_cart_checkout', async ({ page }) => {
  // 1️⃣ Go to homepage
  await page.goto('https://www.menzzo.fr/', { waitUntil: 'domcontentloaded' });
  attachment('Console Log', '✅ Homepage loaded.', 'text/plain');

  // Validate Cookies
  await clickElementByText(page, "Accepter et continuer");
  attachment('Console Log', '✅ Cookies accepted.', 'text/plain');

  // Select category
  await clickElementByText(page, "fauteuils");
  attachment('Console Log', '✅ Category selected.', 'text/plain');

  await closeFloatingMenus(page);

  // 2️⃣ Click on random product
  await ClickRandomProduct(page);
  attachment('Console Log', '✅ Random product selected.', 'text/plain');

  // Wait for product page to load
  attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  attachment('Console Log', '✅ Product page loaded.', 'text/plain');

  // 3️⃣ Add to cart
  await clickAddToCart(page);

  // 4️⃣ Go to cart
  await clickElementByText(page, "Voir le panier & commander");
  attachment('Console Log', '🚀 Proceeded to cart.', 'text/plain');

  // 5️⃣ Proceed to checkout
  await page.waitForTimeout(1000);
  attachment('Console Log', '🚀 Proceeded to onestepCheckout.', 'text/plain');

  // Wait for navigation or visible checkout container
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => { }),
    clickElementByText(page, "Valider mon panier", 10000, { debug: true })
  ]);

  /*page.context().on('page', async newPage => {
    attachment('Console Log', `🆕 New page detected: ${await newPage.url()}`, 'text/plain');
  });*/

  attachment('Console Log', '✅ Navigation to checkout complete. Waiting for OneStepCheckout...', 'text/plain');

  attachment('Console Log', '✅ Checkout page detected.', 'text/plain');

  // 6️⃣ Wait for checkout form readiness
  let checkoutPage = page;

  try {
    await waitForCheckoutReady(page);
  } catch (err) {
    if (String(err).includes('Target page') || String(err).includes('closed')) {
      attachment('Console Warn', '⚠️ Detected checkout reload or new tab — recovering...', 'text/plain');
      // Look for a new checkout page in the context
      const allPages = page.context().pages();
      for (const p of allPages) {
        const url = p.url();
        if (/onestepcheckout/i.test(url)) {
          checkoutPage = p;
          //  attachment('Console Log', `🔄 Switched to new checkout page: ${url}`, 'text/plain');
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
  }


});
