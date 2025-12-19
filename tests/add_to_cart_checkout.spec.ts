import { test, expect } from '@playwright/test';
import { allure } from "allure-playwright";
import { waitForCheckoutReady, clickElementByText, ClickRandomProduct, closeFloatingMenus, clickAddToCart } from '../helpers/utils';
import { performCheckout, CheckoutData } from '../helpers/checkout_full_helper';

test('add_to_cart_checkout', async ({ page }) => {
  // 1️⃣ Go to homepage
  await page.goto('https://www.menzzo.fr/', { waitUntil: 'domcontentloaded' });
  allure.attachment('Console Log', '✅ Homepage loaded.', 'text/plain');

  // Validate Cookies
  await clickElementByText(page, "Accepter et continuer");
  allure.attachment('Console Log', '✅ Cookies accepted.', 'text/plain');

  // Select category
  await clickElementByText(page, "fauteuils");
  allure.attachment('Console Log', '✅ Category selected.', 'text/plain');

  await closeFloatingMenus(page);

  // 2️⃣ Click on random product
  await ClickRandomProduct(page);
  allure.attachment('Console Log', '✅ Random product selected.', 'text/plain');

  // Wait for product page to load
  allure.attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  allure.attachment('Console Log', '✅ Product page loaded.', 'text/plain');

  // 3️⃣ Add to cart
  await clickAddToCart(page);

  // 4️⃣ Go to cart
  await clickElementByText(page, "Voir le panier & commander");
  allure.attachment('Console Log', '🚀 Proceeded to cart.', 'text/plain');

  // 5️⃣ Proceed to checkout
  await page.waitForTimeout(1000);
  allure.attachment('Console Log', '🚀 Proceeded to onestepCheckout.', 'text/plain');

  // Wait for navigation or visible checkout container
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => { }),
    clickElementByText(page, "Valider mon panier", 10000, { debug: true })
  ]);

  page.context().on('page', async newPage => {
    allure.attachment('Console Log', `🆕 New page detected: ${await newPage.url()}`, 'text/plain');
  });

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
          allure.attachment('Console Log', `🔄 Switched to new checkout page: ${url}`, 'text/plain');
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
    paymentMethod: 'Klarna'
  };

  await performCheckout(page, checkoutData);
  allure.attachment('Console Log', '✅ Checkout performed successfully.', 'text/plain');

  // 8️⃣ Confirm navigation to payment method page
  // Refine the locator for the payment method page title
  allure.attachment('Console Log', '⏳ Verifying navigation to payment method page...', 'text/plain');
  await page.waitForSelector('h1.page-title', { state: 'visible', timeout: 60000 });
  const pageTitle = await page.locator('h1.page-title').innerText();
  expect(pageTitle).toMatch(/Finaliser la commande/i);
  allure.attachment('Console Log', '✅ Successfully navigated to payment method page.', 'text/plain');
});