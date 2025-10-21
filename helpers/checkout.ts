import { ElementHandle, Page, expect } from '@playwright/test';

const paymentMethodMap: Record<string, string> = {
  Stripe: '#stripe_payments_checkout',
  Scalapay: '#scalapay',
  SeQura: 'input[id^="sequra_"]',
  Klarna: '#klarna_pay_later',
};

const deliveryMethodMap: Record<string, string> = {
  'Home Delivery - Classic': 'classic',
  'Home Delivery - At Room': 'etage',
  Retrait: 'retrait',
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
  paymentMethod?: keyof typeof paymentMethodMap;
  deliveryMethod?: keyof typeof deliveryMethodMap;
}

async function retryAction(action: () => Promise<boolean>, retries = 10, delay = 500) {
  for (let i = 0; i < retries; i++) {
    const success = await action().catch(() => false);
    if (success) return true;
    await sleep(delay);
  }
  return false;
}

export async function performCheckout(page: Page, data: CheckoutData) {
  await page.waitForSelector('#checkout', { state: 'visible', timeout: 20000 });

  // -------------------------------
  // Fill address
  // -------------------------------
  const emailInput = page.locator('#customer-email');
  await expect(emailInput).toBeEditable({ timeout: 15000 });
  await emailInput.fill(data.email);

  await page.locator('input[data-placeholder="Prénom"], input[data-placeholder="Vorname"]').first().fill(data.firstName);
  await page.locator('input[name="lastname"], input[name="nachname"]').first().fill(data.lastName);

  for (let i = 0; i < data.address.length; i++) {
    const streetInput = page.locator(`input[name="street[${i}]"].google-auto-complete`).first();
    await streetInput.fill(data.address[i]);
  }
  await page.getByRole('textbox', { name: /Ville\*/i }).fill(data.city);
  await page.getByRole('spinbutton', { name: /Code postal\*/i }).fill(data.postalCode);
  await page.getByRole('spinbutton', { name: /Numéro de téléphone\*/i }).fill(data.phone);

  // -------------------------------
  // Select delivery method (stable via value)
  // -------------------------------
  if (data.deliveryMethod) {
    const valueSuffix = deliveryMethodMap[data.deliveryMethod];
    const radioLocator = page.locator(`input[type="radio"][value$="_${valueSuffix}"]`);

    // Capture visible delivery options for debugging
    const visibleOptions = await page.locator('input[type="radio"][name*="shipping_method"]').evaluateAll((els) =>
    els
        .filter((el): el is HTMLInputElement => el instanceof HTMLInputElement && el.offsetParent !== null)
        .map((el) => ({
          value: el.getAttribute('value'),
          checked: (el as HTMLInputElement).checked,
        }))
    );
    console.log('🔍 Visible delivery options:', visibleOptions);

    const success = await retryAction(async () => {
      const element = await radioLocator.first();
      if (await element.isVisible()) {
        await element.scrollIntoViewIfNeeded();
        await element.click({ force: true });
        return await element.isChecked();
      }
      return false;
    }, 15, 300);

    if (!success) throw new Error(`❌ Failed to select delivery method "${data.deliveryMethod}"`);
    console.log(`✅ Selected delivery method: ${data.deliveryMethod}`);
  }

  // -------------------------------
  // Select payment method
  // -------------------------------
  if (data.paymentMethod) {
    const selector = paymentMethodMap[data.paymentMethod];
    const methodRadio = page.locator(selector).first();

    const success = await retryAction(async () => {
      if (await methodRadio.isVisible()) {
        await methodRadio.scrollIntoViewIfNeeded();
        await methodRadio.click({ force: true });
        return await methodRadio.isChecked();
      }
      return false;
    }, 15, 300);

    if (!success) throw new Error(`❌ Failed to select payment method "${data.paymentMethod}"`);
    console.log(`✅ Selected payment method: ${data.paymentMethod}`);
  }

  // -------------------------------
  // Click "Continuer" if present
  // -------------------------------
  const continuerBtn = page.getByRole('button', { name: /continuer/i }).first();
  if (await continuerBtn.count()) {
    await retryAction(async () => {
      if (await continuerBtn.isVisible()) {
        await continuerBtn.click({ force: true });
        return true;
      }
      return false;
    }, 10, 500);
  }

  // -------------------------------
// Accept terms and verify checkbox
// -------------------------------
console.log('🔍 Checking and accepting terms...');

const agreementLocator = 'input[name="agreement[1]"]';

// Wait for any checkbox element to appear
await page.waitForSelector(agreementLocator, { state: 'attached', timeout: 20000 });

// Find visible & enabled checkbox with retry loop (returns element)
let agreementCheckbox: ElementHandle<HTMLInputElement> | null = null;

for (let i = 0; i < 30; i++) {
  const checkboxes = await page.$$(agreementLocator);
  for (const cb of checkboxes) {
    const isVisible = await cb.isVisible();
    const isDisabled = await cb.isDisabled();
    if (isVisible && !isDisabled) {
      agreementCheckbox = cb as ElementHandle<HTMLInputElement>;
      console.log(`✅ Found visible & enabled checkbox (attempt ${i + 1})`);
      break;
    }
  }
  if (agreementCheckbox) break;
  await sleep(1000);
}

if (!agreementCheckbox) {
  const allStates = await page.$$eval(agreementLocator, (els) =>
    els.map(el => ({
      id: el.id,
      visible: (el instanceof HTMLElement) ? (el.offsetParent !== null) : false,
      disabled: (el as HTMLInputElement).disabled,
    }))
  );
  console.error('❌ No visible checkbox found. States:', allStates);
  throw new Error('Agreement checkbox did not appear visible/enabled.');
}

// Try to check the checkbox (this uses retryAction because it returns boolean)
const success = await retryAction(async () => {
  await agreementCheckbox!.scrollIntoViewIfNeeded();
  if (!(await agreementCheckbox!.isChecked())) {
    await agreementCheckbox!.click({ force: true });
    await sleep(500);
  }
  return await agreementCheckbox!.isChecked();
}, 15, 1000);

if (!success) {
  const currentUrl = page.url();
  throw new Error(`❌ Failed to check the terms checkbox. Current URL: ${currentUrl}`);
}

console.log('✅ Terms checkbox checked.');

  // -------------------------------
  // Confirm order / Pay
  // -------------------------------
  console.log('🔍 Looking for pay button...');
  const payBtn = page.getByRole('button', { name: /Payer ma commande/i }).first();

  const clickedPay = await retryAction(async () => {
    const isVisible = await payBtn.isVisible();
    const isEnabled = await payBtn.isEnabled();
    if (isVisible && isEnabled) {
      await payBtn.scrollIntoViewIfNeeded();
      await payBtn.click({ force: true });
      return true;
    }
    return false;
  }, 15, 1000);

  if (!clickedPay) throw new Error('❌ Pay button not clickable or not found');

  console.log(`✅ Clicked pay button, waiting for ${data.paymentMethod} redirect...`);

}
