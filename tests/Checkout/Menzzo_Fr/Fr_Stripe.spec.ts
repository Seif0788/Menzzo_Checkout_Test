import { test, expect } from '@playwright/test';
import { allure } from "allure-playwright";
import { clickElementByText, search, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady, clickAndWaitForNavigation } from '../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../helpers/Checkout/General_Checkout';

test('Strip_Fr', async ({ page }) => {
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

  // Use robust navigation helper
  await clickAndWaitForNavigation(page, "Valider mon panier", /onestepcheckout/);

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
    paymentMethod: 'Stripe'
  };

  await performCheckout(checkoutPage, checkoutData);
  allure.attachment('Console Log', '✅ Checkout performed successfully.', 'text/plain');

  // 9️⃣ Confirm navigation to payment method page
  allure.attachment('Console Log', '⏳ Verifying navigation to Stripe...', 'text/plain');
  try {
    await expect(checkoutPage).toHaveURL(/stripe\.com/, { timeout: 60000 });
    allure.attachment('Console Log', '✅ Successfully navigated to Stripe.', 'text/plain');
  } catch (e) {
    allure.attachment('Console Error', `❌ Failed to navigate to Stripe. Current URL: ${checkoutPage.url()}`, 'text/plain');
    throw e;
  }
})