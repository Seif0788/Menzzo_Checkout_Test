import { ElementHandle, Page, expect } from '@playwright/test';

const paymentMethodMap: Record<string, string> = {
  Stripe: '#stripe_payments_checkout',
  Scalapay: '#scalapay',
  SeQura: 'input[id^="sequra_"]',
  Klarna: '#klarna_pay_later',
};



const deliveryMethodMap: Record<string, string> = {
  'Home Delivery - Classic': 'input.radio-ax-shipping[value$="_classic"]',
  'Home Delivery - At Room': 'input.radio-ax-shipping[value$="_etage"]',
  Retrait: 'input.radio-ax-shipping[value$="_retrait"]',
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

// -------------------------------
// Language-specific selectors
// -------------------------------
const languageSelectors = {
  firstName: {
    fr: 'input[data-placeholder="Prénom"]',
    de: 'input[data-placeholder="Vorname"]',
    nl: 'input[data-placeholder="Voornaam"]',
    it: 'input[data-placeholder="Nome"]',
    es: 'input[data-placeholder="Nombre"]',
    pt: 'input[data-placeholder="Nome"]',
  },
  lastName: {
    fr: 'input[data-placeholder="Nom"]',
    de: 'input[data-placeholder="Nachname"]',
    nl: 'input[data-placeholder="Achternaam"]',
    it: 'input[data-placeholder="Cognome"]',
    es: 'input[data-placeholder="Apellidos"]',
    pt: 'input[data-placeholder="Sobrenome"]',
  },
  city: {
    fr: 'input[data-placeholder="Ville"]',
    de: 'input[data-placeholder="Stadt"]',
    nl: 'input[data-placeholder="Plaatsnaam"]',
    it: 'input[data-placeholder="Città"]',
    es: 'input[data-placeholder="Ciudad"]',
    pt: 'input[data-placeholder="Cidade"]',
  },
  postalCode: {
    fr: 'input[data-placeholder="Code postal"]',
    de: 'input[data-placeholder="Postleitzahl"]',
    nl: 'input[data-placeholder="Postcode"]',
    it: 'input[data-placeholder="CAP"]',
    es: 'input[data-placeholder="Código Postal"]',
    pt: 'input[data-placeholder="Código Postal"]',
  },
  continueButton: {
    fr: /continuer/i,
    de: /weiter/i,
    nl: /doorgaan/i,
    it: /continua/i,
    es: /continuar/i,
    pt: /continuar/i,
  },

  phoneLabel: {
    fr: ['input[data-placeholder="Téléphone"]', 'input[data-placeholder="Telephone"]'],
    de: 'input[data-placeholder="Telephone"]',
    nl: 'input[data-placeholder="Telephone"]',
    it: 'input[data-placeholder="Telephone"]',
    es: 'input[data-placeholder="Telephone"]',
    pt: 'input[data-placeholder="Telephone"]',
    default: 'input[data-placeholder="Telephone"]',
  },
};

export async function performCheckout(page: Page, data: CheckoutData) {
  await page.waitForSelector('#checkout', { state: 'visible', timeout: 20000 });

  // -------------------------------
  // Detect page language safely
  // -------------------------------
  const htmlLangRaw = (await page.getAttribute('html', 'lang'))?.toLowerCase() || 'fr';
  const supportedLangs = ['fr', 'de', 'nl', 'it', 'es', 'pt'] as const;
  type LangType = (typeof supportedLangs)[number];

  const lang: LangType = supportedLangs.includes(htmlLangRaw as LangType)
    ? (htmlLangRaw as LangType)
    : 'fr'; // fallback to French

  console.log('🌐 Page language detected:', lang);

  // -------------------------------
  // Fill address dynamically
  // -------------------------------
  await page.locator('#customer-email').fill(data.email);
  await page.locator(languageSelectors.firstName[lang]).first().fill(data.firstName);
  await page.locator(languageSelectors.lastName[lang]).first().fill(data.lastName);

  for (let i = 0; i < data.address.length; i++) {
    const streetInput = page.locator(`input[name="street[${i}]"].google-auto-complete`).first();
    await streetInput.fill(data.address[i]);
  }

  const cityLocator = page.locator(languageSelectors.city[lang]).first();
  await cityLocator.waitFor({ state: 'visible', timeout: 15000 });
  await cityLocator.fill(data.city);

  const postalLocator = page.locator(languageSelectors.postalCode[lang]).first();
  await postalLocator.waitFor({ state: 'visible', timeout: 15000 });
  await postalLocator.fill(data.postalCode);

  // Convert array to Playwright multiple selector string
  const phoneSelector = Array.isArray(languageSelectors.phoneLabel[lang])
    ? languageSelectors.phoneLabel[lang].join(',')
    : languageSelectors.phoneLabel[lang];
  const phoneLocator = page.locator(phoneSelector).first();
  await phoneLocator.waitFor({ state: 'visible', timeout: 15000 });
  await phoneLocator.fill(data.phone);
  // -------------------------------
  // Select delivery method
  // -------------------------------
  if (data.deliveryMethod) {
    const valueSuffix = deliveryMethodMap[data.deliveryMethod];
    if (!valueSuffix) throw new Error(`Unknown delivery method: ${data.deliveryMethod}`);

    const radioLocator = page.locator(valueSuffix).first();

    const success = await retryAction(async () => {
      if (await radioLocator.isVisible()) {
        await radioLocator.scrollIntoViewIfNeeded();
        await radioLocator.click({ force: true });
        return await radioLocator.isChecked();
      }
      return false;
    }, 15, 300);

    console.log(`✅ Selected delivery method: ${data.deliveryMethod}`);
  }

  // -------------------------------
  // Select payment method
  // -------------------------------
  if (data.paymentMethod) {
    const selector = paymentMethodMap[data.paymentMethod];
    const methodRadio = page.locator(selector).first();

    const success = await retryAction(async () => {
      if (await methodRadio.count() === 0) return false;

      const isVisible = await methodRadio.isVisible();

      if (isVisible) {
        await methodRadio.scrollIntoViewIfNeeded();
      }

      try {
        await methodRadio.click({ force: true });
      } catch (e) {
        return false;
      }

      // If we clicked a label, check the associated input
      const tagName = await methodRadio.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'label') {
        const forAttr = await methodRadio.getAttribute('for');
        if (forAttr) {
          const input = page.locator(`#${forAttr}`);
          return await input.isChecked();
        }
      }

      return await methodRadio.isChecked();
    }, 15, 300);

    if (!success) throw new Error(`❌ Failed to select payment method "${data.paymentMethod}"`);
    console.log(`✅ Selected payment method: ${data.paymentMethod}`);
    await sleep(2000); // Wait for any scripts to run after selection
  }

  // -------------------------------
  // Click continue button
  // -------------------------------
  const continueBtn = page.getByRole('button', { name: languageSelectors.continueButton[lang] }).first();
  if (await continueBtn.count()) {
    await retryAction(async () => {
      if (await continueBtn.isVisible()) {
        await continueBtn.click({ force: true });
        return true;
      }
      return false;
    }, 10, 500);
  }

  // -------------------------------
  // Accept terms checkbox
  // -------------------------------
  console.log('🔍 Checking for terms checkbox...');
  const agreementLocator = 'input[name^="agreement"]';

  let agreementFound = false;
  try {
    await page.waitForSelector(agreementLocator, { state: 'attached', timeout: 5000 });
    agreementFound = true;
  } catch (e) {
    console.log('ℹ️ Agreement checkbox not found (timeout). Skipping.');
  }

  if (agreementFound) {
    let agreementCheckbox: ElementHandle<HTMLInputElement> | null = null;

    for (let i = 0; i < 10; i++) {
      const checkboxes = await page.$$(agreementLocator);
      for (const cb of checkboxes) {
        if (await cb.isVisible() && !(await cb.isDisabled())) {
          agreementCheckbox = cb as ElementHandle<HTMLInputElement>;
          console.log(`✅ Found visible & enabled checkbox (attempt ${i + 1})`);
          break;
        }
      }
      if (agreementCheckbox) break;
      await sleep(1000);
    }

    if (agreementCheckbox) {
      const successCheckbox = await retryAction(async () => {
        await agreementCheckbox!.scrollIntoViewIfNeeded();
        if (!(await agreementCheckbox!.isChecked())) {
          await agreementCheckbox!.click({ force: true });
          await sleep(500);
        }
        return await agreementCheckbox!.isChecked();
      }, 15, 1000);

      if (!successCheckbox) {
        console.warn(`⚠️ Failed to check the terms checkbox despite finding it.`);
      } else {
        console.log('✅ Terms checkbox checked.');
      }
    } else {
      console.log('⚠️ Agreement checkbox present in DOM but none visible/enabled. Skipping.');
    }
  }

  // -------------------------------
  // Confirm order / Pay button
  // -------------------------------
  console.log('🔍 Looking for pay button...');
  const payBtn = page.locator('button.action.primary.checkout:visible').first();

  const clickedPay = await retryAction(async () => {
    if (await payBtn.isVisible() && await payBtn.isEnabled()) {
      await payBtn.scrollIntoViewIfNeeded();
      await payBtn.click({ force: true });
      return true;
    }
    return false;
  }, 30, 1000);

  if (!clickedPay) throw new Error('❌ Pay button not clickable or not found');

  console.log(`✅ Clicked pay button, waiting for ${data.paymentMethod} redirect...`);
}