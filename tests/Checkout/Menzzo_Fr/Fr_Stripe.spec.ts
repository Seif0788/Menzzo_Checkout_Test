import { test, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';
import { clickElementByText, search, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady, clickAndWaitForNavigation } from '../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../helpers/Checkout/General_Checkout';
import { Stripe_Payment } from '../../../helpers/Checkout/Payment_menthod';

test('Strip_Fr', async ({ page }) => {
  test.setTimeout(180000);

  // 1️⃣ Open Menzzo.fr
  await page.goto('https://www.menzzo.fr');

  // 2️⃣ Close cookies popup;
  await clickElementByText(page, "Accepter et continuer");

  // 3️⃣ Wright "Table" in the search bar
  await search(page, "Table");

  // 4️⃣ Click in the rundem product
  await ClickRandomProduct(page);

  // 5️⃣ Wait for product page to load
  attachment('Console Log', '⏳ Waiting for product page to load...', 'text/plain');
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  attachment('Console Log', '✅ Product page loaded.', 'text/plain');

  // 6️⃣ Click in "Ajouter au panier"
  await clickElementByText(page, "Ajouter au panier");

  // 7️⃣ Click in "Voir le panier & commander"
  await clickElementByTextWithPopUp(page, "Voir le panier & commander");

  // Use robust navigation helper
  await clickAndWaitForNavigation(page, "Valider mon panier", /onestepcheckout/);

  attachment('Console Log', '✅ Navigation to checkout complete. Waiting for OneStepCheckout...', 'text/plain');

  attachment('Console Log', '✅ Checkout page detected.', 'text/plain');

  // 8️⃣ Wait for checkout form readiness
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

  // 9 Fill checkout data
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

  // 10 Perform checkout
  await performCheckout(checkoutPage, checkoutData);
  attachment('Console Log', '✅ Checkout performed successfully.', 'text/plain');

  // 11 Confirm navigation to payment method page
  await Stripe_Payment(page);
})