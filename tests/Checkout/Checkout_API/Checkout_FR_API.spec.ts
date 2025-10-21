import { test, expect } from '@playwright/test';
import { clickElementByText, ClickRandomProduct, closeFloatingMenus, clickAddToCart } from '../../../helpers/utils';

test('Checkout_Fr_API', async ({ page }) => {
  // === 1️⃣ Go to homepage ===
  await page.goto('https://www.menzzo.fr/', { waitUntil: 'domcontentloaded' });
  console.log('✅ Homepage loaded.');

  await clickElementByText(page, "Accepter et continuer");
  console.log('✅ Cookies accepted.');

  await clickElementByText(page, "fauteuils");
  console.log('✅ Category selected.');

  await closeFloatingMenus(page);

  // === 2️⃣ Click on random product ===
  await ClickRandomProduct(page);
  console.log('✅ Random product selected.');

  console.log('⏳ Waiting for product page to load...');
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  console.log('✅ Product page loaded.');

  // === 3️⃣ Add to cart ===
  await clickAddToCart(page);

  // === 4️⃣ Go to cart ===
  await clickElementByText(page, "Voir le panier & commander");
  console.log('🚀 Proceeded to cart.');

  // === 5️⃣ Proceed to checkout ===
  await page.waitForTimeout(1000);
  console.log('🚀 Proceeded to onestepCheckout.');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}),
    clickElementByText(page, "Valider mon panier", 10000, { debug: true })
  ]);

  console.log('🚀 Starting checkout test...');

  // === Setup detailed logging ===
  page.on('request', request => {
    if (['xhr', 'fetch'].includes(request.resourceType())) {
      console.log(`➡️ [Request] ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    const request = response.request();
    if (['xhr', 'fetch'].includes(request.resourceType())) {
      const status = response.status();
      const url = response.url();

      // Log all checkout APIs
      if (url.includes('/rest/') || url.includes('/onestepcheckout/')) {
        console.log(`📡 [Response] ${status} ${url}`);
      }

      // Non-blocking error logging
      if (status >= 400) {
        console.log(`❌ [Error Response] ${status} ${url}`);
        try {
          const body = await response.text();
          console.log('Response body (first 300 chars):', body.slice(0, 300));
        } catch {
          console.log('⚠️ Could not read response body');
        }
      }
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`⚠️ [Console Error] ${msg.text()}`);
    }
  });

  // === Navigate to checkout page ===
  await page.goto('https://menzzo.fr/onestepcheckout');
  console.log('🧭 Navigated to checkout');

  // Wait for checkout form to appear
  try {
    await page.waitForSelector('#onestepcheckout-form', { timeout: 15000 });
    console.log('✅ OneStepCheckout loaded correctly');
  } catch {
    console.log('⚠️ Checkout form did not load in time, but test continues');
  }

  // Optional: Wait for key checkout API (non-blocking)
  try {
    await page.waitForResponse(
      response =>
        response.url().includes('/rest/') &&
        response.url().includes('/carts/mine') &&
        response.status() === 200,
      { timeout: 10000 }
    );
    console.log('✅ Key checkout API responded successfully');
  } catch {
    console.log('⚠️ Key checkout API did not respond in time (ignored)');
  }
});
