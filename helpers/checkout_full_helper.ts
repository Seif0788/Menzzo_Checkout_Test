import { Page, expect } from '@playwright/test';
import { dismissOverlays } from './utils';

const paymentMethodMap: Record<string, string> = {
  Stripe: '#stripe_payments_checkout',
  Scalapay: '#scalapay',
  SeQura: 'input[id^="sequra_"]',
  Klarna: '#klarna_pay_later',
};

const deliveryMethodMap: Record<string, string> = {
  'Home Delivery - Classic': 'input[type="radio"][value$="_classic"]',
  'Home Delivery - At Room': 'input[type="radio"][value$="_etage"]',
  Retrait: 'input[type="radio"][value$="_retrait"]',
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface CheckoutData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string[];
  postalCode: string;
  city: string;
  country?: string;
  deliveryMethod?: 'Retrait' | 'Home Delivery - Classic' | 'Home Delivery - At Room';
  paymentMethod?: keyof typeof paymentMethodMap;
  language?: 'FR' | 'DE' | 'IT'; // Added language field
}

// Generic retry helper
async function retryAction(action: () => Promise<boolean>, retries = 10, delay = 500) {
  for (let i = 0; i < retries; i++) {
    const success = await action().catch(() => false);
    if (success) return true;
    await sleep(delay);
  }
  return false;
}

// -------------------------
// Wait for checkout ready
// -------------------------
export async function waitForCheckoutReady(page: Page, timeout = 120000) {
  console.log('⏳ Waiting for OneStepCheckout to initialize...');
  const start = Date.now();
  const retryInterval = 500;

  while (Date.now() - start < timeout) {
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      let checkoutElement = page.locator('#checkout');

      // Check in frames if needed
      let frameWithCheckout = null;
      for(const frame of page.frames()){
        const count = await frame.locator('#checkout').count();
        if (count > 0){
          frameWithCheckout = frame;
          break;
        }
      }
      if (frameWithCheckout){
        checkoutElement = frameWithCheckout.locator('#checkout');
      } 
      // Check key fields and methods
      const emailVisible = await checkoutElement.locator('#customer-email').isVisible().catch(() => false);
      const nameVisible = await checkoutElement.locator('input[data-placeholder="Prénom"], input[name="lastname"]').first().isVisible().catch(() => false);

      const shippingReady = await checkoutElement.locator('input.radio-ax-shipping').count().catch(() => 0);
      const paymentReady = await checkoutElement.locator('input[name^="payment[method]"]').count().catch(() => 0);

      if ((emailVisible || nameVisible) && shippingReady > 0 && paymentReady > 0) {
        console.log('✅ Checkout is ready for interaction.');
        return;
      }
      await sleep(retryInterval);
    } catch (e) {}
    await sleep(retryInterval);
  }

  throw new Error(`❌ Checkout did not become ready within ${timeout}ms`);
}

// -------------------------
// Perform full checkout
// -------------------------
export async function performCheckout(page: Page, data: CheckoutData) {
  // Ensure the language property is set at the start of the function
  if (!data.language) {
    console.warn('⚠️ Language not provided. Defaulting to Italian (IT).');
    data.language = 'IT';
  }

  // Debugging: Log the language being used
  console.log(`🌍 Using language: ${data.language}`);

  await page.waitForSelector('#checkout', { state: 'visible', timeout: 20000 });

  await page.locator('#customer-email').fill(data.email);

  // Update the first name locator to handle the Italian site
  const firstNameLocator = data.language === 'DE'
    ? 'input[data-placeholder="Vorname"]:visible' // German placeholder
    : data.language === 'FR'
    ? 'textbox[aria-label="Prénom*"]:visible' // French placeholder
    : data.language === 'IT'
    ? 'input[data-placeholder="Nome"]:visible' // Italian placeholder
    : 'input[data-placeholder="Nome"]:visible,input[data-placeholder="Vorname"]:visible,input[data-placeholder="Prénom"]:visible'; // Default to Italian

  // Debugging: Log the updated locator
  console.log(`Updated firstNameLocator: ${firstNameLocator}`);

  // Retry logic to handle dynamic content delays
  const maxRetries = 15; // Increased retries
  const retryInterval = 1000; // 1 second interval

  const success = await retryAction(async () => {
    const isVisible = await page.locator(firstNameLocator).isVisible();
    console.log(`Retrying visibility check for ${firstNameLocator}. Visible: ${isVisible}`);

    // Check for blocking elements
    const boundingBox = await page.locator(firstNameLocator).boundingBox();
    if (boundingBox) {
      const overlays = await page.locator('div[style*="z-index"]:visible').count();
      console.log(`Bounding box: ${JSON.stringify(boundingBox)}, Overlays count: ${overlays}`);
    } else {
      console.log(`Bounding box not available for ${firstNameLocator}`);
    }

    return isVisible;
  }, maxRetries, retryInterval);

  if (!success) {
    throw new Error(`Field ${firstNameLocator} did not become visible after ${maxRetries} retries.`);
  }

  console.log('✅ First name field is visible.');

  // Debugging: Log the language and locator being used
  console.log(`Language: ${data.language}`);
  console.log(`Using firstNameLocator: ${firstNameLocator}`);

  // Dismiss overlays before interacting with the first name field
  await dismissOverlays(page);

  await page.locator(firstNameLocator).first().fill(data.firstName);
  await page.locator('input[name="lastname"]').first().fill(data.lastName);

  for (let i = 0; i < data.address.length; i++) {
    await page.locator(`input[name="street[${i}]"].google-auto-complete`).first().fill(data.address[i]);
  }

  await page.fill('input[name="postcode"]', data.postalCode);

  // Update the city locator to handle the Italian site
  const cityLocator = data.language === 'DE'
    ? 'input[data-placeholder="Stadt"]' // German placeholder
    : data.language === 'FR'
    ? 'input[data-placeholder="Ville"]' // French placeholder
    : 'input[data-placeholder="Città"]'; // Default to Italian

  await page.locator(cityLocator).first().fill(data.city);
  await page.fill('input[name="telephone"]', data.phone);

  // Select delivery method
  if (data.deliveryMethod) {
    if (data.language === 'DE' || data.language === 'IT') {
      // Automatically select the single available delivery method
      const singleDeliveryRadio = page.locator('input.radio-ax-shipping').first();
      const success = await retryAction(async () => {
        if (await singleDeliveryRadio.isVisible()) {
          await singleDeliveryRadio.click({ force: true });
          return await singleDeliveryRadio.isChecked();
        }
        return false;
      }, 15, 300);
      if (!success) throw new Error(`❌ Failed to select the single available delivery method for ${data.language}`);
      console.log(`✅ Automatically selected the single available delivery method for ${data.language}`);
    } else {
      // Determine the correct suffix for the delivery method based on language
      const deliverySuffixMap = {
        FR: { Retrait: 'retrait', 'Home Delivery - Classic': 'classique', 'Home Delivery - At Room': 'etage' },
        DE: { Retrait: 'abholung', 'Home Delivery - Classic': 'klassisch', 'Home Delivery - At Room': 'zimmer' },
        IT: { Retrait: 'ritiro', 'Home Delivery - Classic': 'standard', 'Home Delivery - At Room': 'camera' } // Refined suffix for Italian delivery methods
      };

      // Debugging: Log the refined suffix mapping
      console.log('🚧 Refined deliverySuffixMap:', deliverySuffixMap);

      // Ensure the language is defined and valid before accessing the map
      if (!data.language || !Object.keys(deliverySuffixMap).includes(data.language)) {
        throw new Error(`❌ Unsupported or missing language "${data.language}"`);
      }

      const suffix = deliverySuffixMap[data.language as keyof typeof deliverySuffixMap][data.deliveryMethod];
      if (!suffix) {
        throw new Error(`❌ Unsupported delivery method "${data.deliveryMethod}" for language "${data.language}"`);
      }

      const groupNames = await page.locator('input.radio-ax-shipping').evaluateAll(els => Array.from(new Set(els.map(e => e.getAttribute('name')))));
      for (const name of groupNames) {
        if (!name) continue;
        const radio = page.locator(`input[name="${name}"][value$="_${suffix}"]`).first();
        const success = await retryAction(async () => {
          if (await radio.isVisible()) {
            await radio.click({ force: true });
            return await radio.isChecked();
          }
          return false;
        }, 15, 300);
        if (!success) throw new Error(`❌ Failed to select delivery "${data.deliveryMethod}" for ${name}`);
      }
    }
  }

  // Select payment method
  if (data.paymentMethod) {
    const selector = paymentMethodMap[data.paymentMethod];
    const radio = page.locator(selector).first();
    const success = await retryAction(async () => {
      if (await radio.isVisible()) {
        await radio.click({ force: true });
        return await radio.isChecked();
      }
      return false;
    }, 15, 300);
    if (!success) throw new Error(`❌ Failed to select payment "${data.paymentMethod}"`);
  }

 // -------------------------------
  // Accept terms
  // -------------------------------

  const CurrentUrl = page.url();
  const isDeStore = CurrentUrl.includes('.de')
  const isItStore = CurrentUrl.includes('.it')

  if(!isDeStore && !isItStore){
  // Only accept terms on non-DE stores (e.g., .fr, .es, etc.)
  const termsCheckbox = page.locator('#co-place-order-agreement input[name="agreement[1]"]');
  if (!(await termsCheckbox.isChecked().catch(() => false))) {
    await termsCheckbox.click({ force: true }).catch(() => {});
  } else {
    if (isDeStore) {
        console.log('✅ Terms accepted successfully (DE store).');
    } else if (isItStore) {
          console.log('✅ Terms accepted successfully (IT store).');
    } else {
    console.log('⚠️ Skipped terms acceptance for non-DE/IT store.');
    }
  }
  // Confirm order
  console.log('🔍 Looking for pay button...');

  await sleep(20000); // Wait for 2 seconds to ensure button is loaded

  // === Map language to pay button text ===
const payButtonTextMap: Record<string, RegExp> = {
  FR: /Payer ma commande/i,
  DE: /Bestellung abschließen/i,
  IT: /Paga il mio ordine/i,
};

// Pick the right regex (fallback to /pay/i if not found)
const buttonLabel =
  data.language && payButtonTextMap[data.language]
    ? payButtonTextMap[data.language]
    : /pay/i;

console.log(`🔍 Looking for visible pay button for language: ${data.language}...`);

const payButtons = page.getByRole('button', { name: buttonLabel });

const clickedPay = await retryAction(async () => {
  const count = await payButtons.count();
  console.log(`🧩 Found ${count} matching pay buttons`);

  for (let i = 0; i < count; i++) {
    const btn = payButtons.nth(i);
    const isVisible = await btn.isVisible().catch(() => false);
    const isEnabled = await btn.isEnabled().catch(() => false);

    if (isVisible && isEnabled) {
      console.log(`✅ Found visible pay button [${i}] — clicking it...`);
      await btn.scrollIntoViewIfNeeded();
      await btn.click({ force: true });
      return true;
    }
  }

  console.log('⏳ No visible pay button yet, retrying...');
  return false;
}, 15, 1000);

if (!clickedPay) throw new Error('❌ No visible pay button found or clickable');

console.log(`✅ Clicked pay button, waiting for ${data.paymentMethod} redirect...`);
  }
}