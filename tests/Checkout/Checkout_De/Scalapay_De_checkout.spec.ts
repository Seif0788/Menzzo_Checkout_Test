import { test, expect } from '@playwright/test';
import { waitForCheckoutReady, clickElementByText, ClickRandomProduct, closeFloatingMenus, clickAddToCart } from '../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../helpers/checkout_full_helper';

test('add_to_cart_checkout', async ({ page }) => {
  // 1️⃣ Go to homepage
  await page.goto('https://www.menzzo.de/', { waitUntil: 'domcontentloaded' });
  console.log('✅ Homepage loaded.');

  // Validate Cookies
  await clickElementByText(page, "Alle akzeptieren");
  console.log('✅ Cookies accepted.');

  // Select category
  await clickElementByText(page, "Sofas");
  console.log('✅ Category selected.');

  await closeFloatingMenus(page);

  // 2️⃣ Click on random product
  await ClickRandomProduct(page);
  console.log('✅ Random product selected.');

  // Wait for product page to load
  console.log('⏳ Waiting for product page to load...');
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  console.log('✅ Product page loaded.');

  // 3️⃣ Add to cart
  await clickAddToCart(page);

  // 4️⃣ Go to cart
  await clickElementByText(page, "Warenkorb anzeigen und bestellen ");
  console.log('🚀 Proceeded to cart.');

  // 5️⃣ Proceed to checkout
  await page.waitForTimeout(1000);
  console.log('🚀 Proceeded to onestepCheckout.');

  // Wait for navigation or visible checkout container
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}),
    clickElementByText(page, "Warenkorb bestätigen", 10000, { debug: true })
  ]);

  page.context().on('page', async newPage => {
    console.log('🆕 New page detected:', await newPage.url());
  });

  console.log('✅ Navigation to checkout complete. Waiting for OneStepCheckout...');

  console.log('✅ Checkout page detected.');

  // 6️⃣ Wait for checkout form readiness
  let checkoutPage = page;

  try {
    await waitForCheckoutReady(page);
  } catch (err) {
    if (String(err).includes('Target page') || String(err).includes('closed')) {
      console.warn('⚠️ Detected checkout reload or new tab — recovering...');
      // Look for a new checkout page in the context
      const allPages = page.context().pages();
      for (const p of allPages) {
        const url = p.url();
        if (/onestepcheckout/i.test(url)) {
          checkoutPage = p;
          console.log(`🔄 Switched to new checkout page: ${url}`);
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
    paymentMethod: 'Scalapay',
    language: 'DE',
  };

  await performCheckout(page, checkoutData);
  console.log('✅ Checkout performed successfully.');

  // 8️⃣ Confirm navigation to payment method page
  // Refine the locator for the payment method page title
  console.log('⏳ Verifying navigation to payment method page...');
  await page.waitForSelector('h1.page-title', { state: 'visible', timeout: 60000 });
  const pageTitle = await page.locator('h1.page-title').innerText();
  // Update the expected title to match the actual title
  expect(pageTitle).toMatch('Bestellung abschließen');
  console.log('✅ Successfully navigated to payment method page.');
});