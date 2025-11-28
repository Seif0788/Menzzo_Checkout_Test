import { test, expect } from '@playwright/test';
import { clickElementByText, search, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady, clickAndWaitForNavigation } from '../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../helpers/Checkout/General_Checkout';

test('SeQura_Fr', async ({ page }) => {
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
  console.log('⏳ Waiting for product page to load...');
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  console.log('✅ Product page loaded.');

  //Click in "Ajouter au panier"
  await clickElementByText(page, "Ajouter au panier");

  //Click in "Voir le panier & commander"
  await clickElementByTextWithPopUp(page, "Voir le panier & commander");

  // Use robust navigation helper
  await clickAndWaitForNavigation(page, "Valider mon panier", /onestepcheckout/);

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
          //  console.log(`🔄 Switched to new checkout page: ${url}`);
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
    paymentMethod: 'SeQura'
  };

  await performCheckout(checkoutPage, checkoutData);
  console.log('✅ Checkout performed successfully.');

  // 9️⃣ Confirm navigation to payment method page
  // Refine the locator for the payment method page title
  console.log('⏳ Verifying navigation to payment method page...');
  await checkoutPage.waitForSelector('h1.page-title', { state: 'visible', timeout: 60000 });
  const pageTitle = await checkoutPage.locator('h1.page-title').innerText();
  expect(pageTitle).toMatch(/Finaliser la commande/i);
  console.log('✅ Successfully navigated to payment method page.');

  // Wait for SeQura payment page to load
  console.log('⏳ Wait for SeQura Widget to load...');

  // Wait for any navigation or page changes after clicking pay
  await checkoutPage.waitForLoadState('networkidle', { timeout: 60000 });
  console.log('✅ Page loaded after payment selection.');


});