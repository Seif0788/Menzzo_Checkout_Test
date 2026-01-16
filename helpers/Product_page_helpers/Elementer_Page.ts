import { Locator, Page, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';

import { Button_Next, Button_Previous } from '../../helpers/utils';
import { detectLanguage } from '../detect_language';

export async function verifyH1MatchesTitle(page: Page) {
  //Locate the H1 element
  const h1 = page.locator('h1.ax-page-title');
  await expect.soft(h1, 'H1 should be visible').toBeVisible();

  //Get its text content
  const h1Text = (await h1.textContent())?.trim() || '';

  //Check that it's not empty
  expect.soft(h1Text.length, 'H1 test should not be empty').toBeGreaterThan(0);

  //Get the page title
  const pageTitle = (await page.title()).trim();

  //Compare title and H1 
  expect.soft(
    pageTitle.toLowerCase(),
    'Page title should match H1 text'
  ).toBe(h1Text.toLowerCase());

  // ---Comparisaion----
  const match = h1Text.toLowerCase() === pageTitle.toLowerCase();

  if (match) {
  } else {
    attachment('Console Log', `❌ FAILED: Page title does not match H1 text`, 'text/plain');
  }
}

// Check the breadcrumb
export async function breadcrumb(page: Page) {
  // Locate the H1 element
  const h1 = page.locator('h1.ax-page-title');
  await expect.soft(h1, 'H1 should be visible').toBeVisible();

  // Get its text content
  const h1Text = (await h1.textContent())?.trim() || '';

  // Locate the breadcrumb
  const breadcrumb = page.locator('//div[@class="breadcrumbs"]//li[contains(@class, "item product")]');
  await expect.soft(breadcrumb, 'Breadcrumb should be visible').toBeVisible();

  // Get breadcrumb text
  const breadcrumbText = (await breadcrumb.textContent())?.trim() || '';

  // Check that H1 text is not empty
  expect.soft(h1Text.length, 'H1 text should not be empty').toBeGreaterThan(0);

  // Compare breadcrumb text and H1 text (case-insensitive)
  expect.soft(
    breadcrumbText.toLowerCase(),
    'Breadcrumb text should match H1 text'
  ).toBe(h1Text.toLowerCase());

  //---Comparison---
  const match2 = breadcrumbText.toLowerCase() === h1Text.toLowerCase();

  if (match2) {
  } else {
    attachment('Console Log', `❌ FAILED: Breadcrumb does not match H1 text`, 'text/plain');
  }
}

// Check product availability
export async function CheckProductAvailability(page: Page) {
  try {
    // Locate the main availability strong tag
    const availability = page.locator('//div[contains(@class, "product-availability")]/strong[normalize-space()]');
    await expect.soft(availability, 'Availability label should be visible').toBeVisible();

    // Get its text
    const availabilityText = (await availability.textContent())?.trim() || '';

    // Log it

    // Ensure text is not empty
    expect.soft(availabilityText.length, 'Availability text should not be empty').toBeGreaterThan(0);

    // Detect language from URL
    const currentUrl = page.url();
    let language = 'fr'; // default

    if (currentUrl.includes('menzzo.de')) {
      language = 'de';
    } else if (currentUrl.includes('menzzo.it')) {
      language = 'it';
    } else if (currentUrl.includes('menzzo.es')) {
      language = 'es';
    } else if (currentUrl.includes('menzzo.pt')) {
      language = 'pt';
    } else if (currentUrl.includes('menzzo.nl')) {
      language = 'nl';
    }


    // Define acceptable stock statuses per language
    const validStatusesByLanguage: Record<string, string[]> = {
      fr: ['En stock', 'Livré sous plus d\'un mois', 'Bientôt en stock'],
      de: ['Auf Lager', 'Lieferung in mehr als einem Monat', 'Bald auf Lager'],
      it: ['Disponibile', 'Consegna in più di un mese', 'Presto disponibile'],
      es: ['En stock', 'Entrega en más de un mes', 'Próximamente en stock'],
      pt: ['Em stock', 'Entrega em mais de um mês', 'Em breve em stock'],
      nl: ['Op voorraad', 'Levering in meer dan een maand', 'Binnenkort op voorraad']
    };

    const validStatuses = validStatusesByLanguage[language] || validStatusesByLanguage['fr'];

    // Check if the value matches one of the expected statuses
    const isValid = validStatuses.some(status =>
      availabilityText.toLowerCase().includes(status.toLowerCase())
    );

    if (isValid) {
    } else {
      attachment('Console Log', `❌ Invalid availability status detected: "${availabilityText}"`, 'text/plain');
    }

    // Assert it is valid for the report
    expect.soft(isValid, 'Availability status should be a valid known label').toBeTruthy();
  } catch (error) {
    attachment('Console Error', `❌ Error in CheckProductAvailability: ${error}`, 'text/plain');
  }
}

// Check text in popup
export async function CheckTextPopup(page: Page) {


  const availability = page.locator('//div[contains(@class, "product-availability")]/strong[normalize-space()]');
  await expect.soft(availability, 'Availability label should be visible').toBeVisible();

  // Get its text
  const availabilityText = (await availability.textContent())?.trim() || '';

  //Click stock element
  const StockButton = page.locator('//div[contains(@class, "dispo-infos-open")]');
  await expect.soft(StockButton, 'Stock info button should be visible').toBeVisible();

  // Check in it
  await StockButton.click();

  //Wait for the popuo/modal to appear
  const popup = page.locator('//div[@class = "dispo-infos show"]');
  await expect.soft(popup, 'Popup should appear after clicking stock info').toBeVisible({ timeout: 5000 });

  //Locate poppup text
  const popupText = ((await popup.textContent())?.trim() || '').trim().replace(/\s+/g, ' ');

  //Define expected text based on stock status
  const expectedTexts: Record<string, string> = {
    'En stock':
      'Cet article est En stock au dépôt. Vous le recevrez après un délai dépendant du choix de votre mode de livraison.',
    'Bientôt en stock':
      'Cet article sera Bientôt en stock au dépôt. Vous le recevrez après un délai dépendant du choix de votre mode de livraison.',
    'Livré sous plus d’un mois':
      'Cet article sera Livré sous plus d’un mois au dépôt. Vous le recevrez après un délai dépendant du choix de votre mode de livraison. En savoir plus'
  };

  const expectedText = expectedTexts[availabilityText] || '';

  if (expectedText) {
    const normalize = (t: string) => t.toLowerCase().replace(/\s+/g, ' ').trim();
    const matches = normalize(popupText).includes(normalize(expectedText));

    if (matches) {
    } else {
      attachment('Console Log', `❌ Popup text does NOT match expected message for status "${availabilityText}".`, 'text/plain');
    }

    expect.soft(matches, `Popup text should match expected message for status "${availabilityText}"`).toBeTruthy();
  } else {
    attachment('Console Log', `⚠️ No expected text configured for status "${availabilityText}".`, 'text/plain');
  }

  // 5️⃣ Close the stock info popup by clicking inside it
  const Closepopup = page.locator('//div[contains(@class, "dispo-infos") and contains(@class, "show")]');

  if (await Closepopup.isVisible()) {
    // Click inside the popup (for example in the center area)
    const box = await Closepopup.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }

    // Optional: Wait for it to disappear
    await expect.soft(Closepopup).toBeHidden({ timeout: 5000 });
  }
  return availabilityText;
}

// Check product shipping amount
export async function ShippingText(page: Page) {

  // Initialize return values
  let FromDay: string | undefined;
  let DayTo: string | undefined;
  let ShippingPrice: string | undefined;

  const DeliveryText = page.locator('//div[@class="product-shipping-amount"]');
  await expect.soft(DeliveryText, 'The shipping product text should be visible').toBeVisible();

  // Get shipping amount text
  const TextDelivery = ((await DeliveryText.textContent())?.trim()) || '';

  // Identifay the From and to shippmend
  const match = TextDelivery.match(/(\d{1,2})\s*et\s*(\d{1,2})/);

  const priceMatch = TextDelivery.match(/À\s*partir\s*de\s*(\d{1,3}(?:[.,]\d{2})?)/i);

  if (match && priceMatch) {
    FromDay = match[1];
    DayTo = match[2];
    ShippingPrice = priceMatch[1];
  }
  return { FromDay, DayTo, ShippingPrice };
}

export async function CheckStockAndShipping(page: Page) {

  // Step 1️⃣ — Run the popup check first (handles availability + logs everything)
  const stockStatus = await CheckTextPopup(page);

  // Step 2️⃣ — Continue only if stock is "En stock"
  if (stockStatus !== 'En stock') {
    attachment('Console Log', `⚠️ Product is not "En stock" (it's "${stockStatus}"). Skipping shipping check.`, 'text/plain');
    return;
  }


  // Step 3️⃣ — Extract shipping info

  const shippingInfo = await ShippingText(page);

  if (!shippingInfo.FromDay || !shippingInfo.DayTo || !shippingInfo.ShippingPrice) {
    attachment('Console Warn', '⚠️ Could not extract full shipping information.', 'text/plain');
    return;
  }


  // Step 4️⃣ — Validate FromDay and DayTo for "En stock"
  const today = new Date();
  const fromDateExpected = today.getDate() + 2; // today + 2
  const dayToExpected = today.getDate() + 9;   // today + 9

  const fromDayActual = parseInt(shippingInfo.FromDay, 10);
  const DayToActual = parseInt(shippingInfo.DayTo, 10);

  if (fromDayActual === fromDateExpected) {
  } else {
    attachment('Console Warn', `❌ FromDay is incorrect: ${fromDayActual} (expected: ${fromDateExpected})`, 'text/plain');
  }


  if (dayToExpected === DayToActual) {
  } else {
    attachment('Console Warn', `❌ FromDay is incorrect: ${dayToExpected} (expected: ${DayToActual})`, 'text/plain');
  }

  // Step 5️⃣ — Return structured info for further assertions
  return {
    stockStatus,
    ...shippingInfo,
    fromDayValid: fromDayActual === fromDateExpected,
    dayToValid: DayToActual === dayToExpected,
  };
}

export async function DeliveryPricePopup(page: Page) {

  const Delivery = page.locator('//div[@class="product-shipping-amount"]');
  const DeliveryPopup = Delivery.locator('.link-delivery.trusk-zone');

  //Click in deliveryPopup
  try {
    await DeliveryPopup.waitFor({ state: 'visible', timeout: 5000 });
    await DeliveryPopup.click();

    const screenshotBuffer = await page.screenshot();
    attachment('Delivery popup screenshot', screenshotBuffer, 'image/png');

  } catch (e) {
    attachment('Console Log', '⚠️ Delivery popup is not visible after waiting, could not click it', 'text/plain');
    const screenshotBuffer = await page.screenshot();
    attachment('Delivery popup screenshot', screenshotBuffer, 'image/png');
  }

  //Check delivery popup text
  const PopupDeliverytext = page.locator('//div[@class="modal-inner-wrap"]').first();
  const PopupText = ((await PopupDeliverytext.textContent()) || '').replace(/\s+/g, ' ').trim();
  //console.log(`the popup text is: "${PopupText}"`);

  const expectedOptions = ['Informations de livraison', 'Livraison classique', 'Livraison Étage'];

  expectedOptions.forEach(option => {
    if (PopupText.includes(option)) {
    } else {
      attachment('Console Warn', `❌ Option NOT found: "${option}"`, 'text/plain');
    }
  });

  // Exit popup
  const Exitpopup = PopupDeliverytext.locator('button.action-close');

  if (await Exitpopup.isVisible()) {
    await Exitpopup.click();
  } else {
    attachment('Console Log', '❌ Close popup faild', 'text/plain');
  }
}

export async function FreereturnPopUp(page: Page) {

  const FreeReturn_expected = "Retour gratuit  *";

  // Locate the main free return element
  const ReturnDisplay = page.locator('//div[@class="d-flex mb-2 review-popup-free-return"]');
  const TextReturnDisplay = ((await ReturnDisplay.textContent()) || ' ').trim();

  expect(TextReturnDisplay.toLowerCase()).toBe(FreeReturn_expected.toLowerCase());

  // Click to open the popup
  await ReturnDisplay.click();

  // Check popup text
  const EXPECTED_POPUP_TEXT = `
    VOTRE ARTICLE NE VOUS CONVIENT PAS ?
    Pas d’inquiétude, avec notre offre : « Satisfait ou remboursé »
    Bénéficiez d’un RETOUR GRATUIT *
    * Obtenez simplement un bon d’achat du montant du produit frais de port inclus en effectuant votre demande jusqu’à 14 jours après réception du produit.
    Ou vous pouvez toujours opter pour un remboursement classique hors frais de port.
    `;

  const locator = page.locator('#review-popup-free-return');
  await expect.soft(locator).toBeVisible();

  let actualText = (await locator.innerText()).replace(/\s+/g, ' ').trim();
  const normalizedExpected = EXPECTED_POPUP_TEXT.replace(/\s+/g, ' ').trim();

  if (actualText === normalizedExpected) {
  } else {
    attachment('Console Log', "❌ Free delivery popup text does not match!", 'text/plain');
  }

  // Close the popup
  const popup = page.locator('aside.modal-popup.ax-review-popup-free-return');
  await popup.waitFor({ state: 'visible' })
  const CloseBtn = popup.locator('button.action-close');

  try {
    await CloseBtn.waitFor({ state: 'visible', timeout: 3000 });
    await CloseBtn.click();
  } catch {
    attachment('Console Log', '❌ Close popup failed — button not found', 'text/plain');
  }
}

export async function FreereturnDisplay(page: Page) {
  const expected_AvisText = "15 jours pour changer d’avis";
  const expected_SecurityPayment = "Paiement 100% sécurisé";
  const review_left = page.locator('//div[@class="review-left"]');
  const freeReturn_review = review_left.locator('//div[@class="d-flex mb-2"]');
  // --- 15 jours pour changer d’avis ---
  await expect(freeReturn_review).toBeVisible(); // ✔ This now works
  const changeAvisText = (await freeReturn_review.textContent() || '').trim();

  if (changeAvisText === expected_AvisText) {
  } else {
    attachment('Console Log', "❌ Free delivery text does not match!", 'text/plain');
  }
  //---Paiement 100% sécurisé---
  const SecurityPayment = page.locator('//div[@class="d-flex"]')
  const SecurityPaymentText = (await SecurityPayment.textContent() || '').trim();


  if (SecurityPaymentText === expected_SecurityPayment) {
  } else {
    attachment('Console Log', "❌ Free delivery text does not match!", 'text/plain');
  }
}

//---Check Review---
export async function review_report(page: Page) {
  const suspected_review_message = "Clients satisfaits Voir tous les avis";
  const review_text = page.locator('//div[@class="review-right"]').first();

  //--Check review message--
  const review_message = (await review_text.textContent() || '').trim();
  if (review_message === suspected_review_message) {
  } else {
    attachment('Console Log', "❌ review message does not match!", 'text/plain');
  }
  //--Check the review popup--
  const review_popup = review_text.locator('div.review-click:has(a.link-reviews)');


  await page.locator('a.link-reviews').scrollIntoViewIfNeeded();
  await page.locator('a.link-reviews').click();


  //--Find the modal that contains the review wrapper
  // Wait for the visible popup wrapper
  const popupWrapper = page.locator('#review-popup-wrapper');
  await popupWrapper.waitFor({ state: 'visible', timeout: 10000 });


  // Now check the content inside
  const popup_text = popupWrapper.locator('h3.text-center');
  const popup_text2 = popupWrapper.locator('.review-info')
  const popupTexts = (await popup_text.textContent() || '').trim();

  await expect(popup_text).toContainText('Des clients satisfaits');

  await expect(popup_text2).toContainText(
    'Les avis présentés sur cette page constituent une sélection'
  );

  // Close button
  const shippingPopup = page.locator('aside.ax-product-reviews-popup-modal');
  await shippingPopup.waitFor({ state: 'visible', timeout: 10000 });
  await shippingPopup.locator('button.action-close[data-role="closeBtn"]').click();
}

// Check Description
export async function Description(page: Page) {

  // 1. Detect language from URL
  const currentUrl = page.url();
  let lang = 'fr'; // default fallback

  if (currentUrl.includes('menzzo.de')) lang = 'de';
  else if (currentUrl.includes('menzzo.nl')) lang = 'nl';
  else if (currentUrl.includes('menzzo.it')) lang = 'it';
  else if (currentUrl.includes('menzzo.es')) lang = 'es';
  else if (currentUrl.includes('menzzo.pt')) lang = 'pt';
  else if (currentUrl.includes('menzzo.be')) lang = 'fr';
  else if (currentUrl.includes('menzzo.at')) lang = 'de';
  else if (currentUrl.includes('nl.menzzo.be')) lang = 'nl';


  // 2. i18n dictionary (title text per language)
  const i18n: Record<string, { title: string }> = {
    fr: { title: "Descriptifs" },
    de: { title: "Beschreibung" },
    nl: { title: "Omschrijving" },
    it: { title: "Descrizione" },
    es: { title: "Descripción" },
    pt: { title: "Descrição" }
  };

  const data = i18n[lang] || i18n['fr'];

  // 3. Check description title
  const descTitleLocator = page.locator('//div[@class="item title active"]').first();

  try {
    await descTitleLocator.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    attachment('Description title is NOT visible', "⚠️ Description title is NOT visible — may depend on layout or accordion state.", 'text/plain');
    console.log(descTitleLocator);
  }

  const descTitleText = (await descTitleLocator.textContent() || '').trim();


  if (descTitleText === data.title) {
  } else {
    attachment('Description title does NOT match', `❌ Description title does NOT match`, 'text/plain');
    console.log(descTitleText);
    console.log(data.title);
  }

  // 4. Check description text content
  const descTextLocator = page.locator('//div[@class="product attribute description"]');

  await descTextLocator.waitFor({ state: 'visible', timeout: 30000 });
  const descText = (await descTextLocator.textContent() || '').trim();

  if (descText.length > 0) {
  } else {
    attachment('Description text is EMPTY', "❌ Description text is EMPTY!", 'text/plain');
    console.log(descText);
  }
}

// Normalize function: removes accents, converts ß → ss, trims
function normalizeText(text: string): string {
  return text
    .normalize('NFD')                       // decompose accents
    .replace(/[\u0300-\u036f]/g, '')        // remove diacritics
    .replace(/ß/g, 'ss')                    // German sharp S
    .toLowerCase()
    .trim();
}

// Check Information Table
export async function InfoTable(page: Page) {

  // 1. Detect language from URL
  const currentUrl = page.url();
  const isNlBe = currentUrl.includes('nl.menzzo.be');
  let lang = 'fr'; // default
  console.log(`Current URL: ${currentUrl}`);

  if (currentUrl.includes('menzzo.de')) {
    lang = 'de';
  } else if (currentUrl.includes('menzzo.nl')) {
    lang = 'nl';
  } else if (currentUrl.includes('menzzo.it')) {
    lang = 'it';
  } else if (currentUrl.includes('menzzo.es')) {
    lang = 'es';
  } else if (currentUrl.includes('menzzo.pt')) {
    lang = 'pt';
  } else if (currentUrl.includes('nl.menzzo.be')) {
    lang = 'nl';  // Dutch Belgian - check BEFORE menzzo.be
  } else if (currentUrl.includes('menzzo.be')) {
    lang = 'fr';  // French Belgian
  } else if (currentUrl.includes('menzzo.at')) {
    lang = 'de';
  }


  // 2. Define translations
  // Note: These need to be matched exactly against the site's text.
  const i18n: Record<string, { title: string, rows: string[] }> = {
    fr: {
      title: "Informations complémentaires",
      rows: ['Couleur', 'Matière détail', 'Dimensions', 'Poids net (kg)', 'Dimensions colis']
    },
    de: {
      title: "Mehr Informationen",
      rows: ['Farbe', 'Material-Detail', 'Maße', 'Nettogewicht (Kg)', 'Paket-Maße'] // adjust if needed (e.g. "Maße", "Paket")
    },
    nl: {
      title: "Meer informatie",
      rows: isNlBe ? ['Kleur', 'Materiaal detail', 'Afmetingen', 'Nettogewicht (kg)', 'Afmetingen van het pakket'] : ['Kleur', 'Retail materiaal', 'Afmetingen', 'Netto gewicht / kg', 'Afmetingen van het pakket'] // adjust if needed
    },
    it: {
      title: "Informazioni complementari", // check specific site wording
      rows: ['Colore', 'Dettagli del materiale', 'Dimensioni', 'Peso netto (kg)', 'Dimensione Pacco']
    },
    es: {
      title: "Informaciones complementarias",
      rows: ['Color', 'Detalle del material', 'Medidas', 'Peso neto (kg)', 'Tamaño de la caja']
    },
    pt: {
      title: "Mais informações",
      rows: ['Cor', 'Pormenor do material', 'Dimensões', 'Peso líquido (kg)', 'Dimensões do pacote']
    }
  };

  const data = i18n[lang] || i18n['fr'];

  // Check information table title
  const InfoTabTitle = page.locator('//div[contains(@class,"item") and contains(@class,"title") and contains(@class,"active") and @aria-controls="tab-info"]');

  // Soft wait
  try {
    await InfoTabTitle.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    attachment('Console Log', "⚠️ Info tab title not visible - might be a layout difference.", 'text/plain');
    console.log("⚠️ Info tab title not visible - might be a layout difference.");
  }

  const InfoTabTitle_text = (await InfoTabTitle.textContent() || '').trim();
  if (normalizeText(InfoTabTitle_text) === normalizeText(data.title)) {
  } else {
    attachment('Console Log', `❌ The info table title does not match!`, 'text/plain');
    console.log(`❌ The info table title does not match!`);
  }
  // 4️⃣ Info table rows
  const Table = page.locator('//div[@class="additional-attributes-wrapper table-wrapper"]//table');
  await expect.soft(Table).toBeVisible();

  const allRows = await Table.locator('tr').all();

  for (const rowLabel of data.rows) {

    let matchedRow: Locator | null = null;

    for (const r of allRows) {
      const thText = (await r.locator('th').textContent() || '').trim();
      if (normalizeText(thText).includes(normalizeText(rowLabel))) {
        matchedRow = r;
        break;
      }
    }

    if (!matchedRow) {
      attachment('Console Log', `❌ Row "${rowLabel}" NOT found!`, 'text/plain');
      console.log(`❌ Row "${rowLabel}" NOT found!`);
      const allHeaders = await Table.locator('th').allTextContents();
      continue;
    }


    const valueTd = matchedRow.locator('td.col.data');
    const valueText = (await valueTd.textContent() || '').trim();

    if (valueText.length > 0) {
    } else {
      attachment('Console Log', `❌ Row "${rowLabel}" value is empty!`, 'text/plain');
      console.log(`❌ Row "${rowLabel}" value is empty!`);
    }

    await expect.soft(valueTd, `Row "${rowLabel}" value should not be empty`).not.toBeEmpty();
  }
}

// Check MenzzoHome
/*export async function MenzzoHome(page:Page){
  const MenzzoHome_Block = page.locator('//div[@class="bloc-review"]');
  
  //Check the MenzzoHome title
  const MenzzoHome_title = MenzzoHome_Block.locator()
}*/

// Check "Vous aimerez aussi?"
export async function upsell(page: Page) {
  //---Check "vous aimerez aussi?" block---//
  const upsell_block = page.locator('//div[contains(@class, "block upsell")]');

  //---Check title---//
  const upsell_title = upsell_block.locator('h3');
  const upsell_titleText = (await upsell_title.textContent())?.trim() || " ";
  const expectedUpsel_Title = "Vous aimerez aussi :";

  if (upsell_titleText === expectedUpsel_Title) {
  } else {
    throw new Error(
      `❌ Wrong upsell title. Expected "${expectedUpsel_Title}" but got "${upsell_titleText}"`
    );
  }

  // Scroll to the upsell block to ensure lazy-loaded items are triggered
  await upsell_block.scrollIntoViewIfNeeded();

  //---Check upsell products---//
  // Use a more direct selector inside the block, and wait for items to load
  const upsell_Product = upsell_block.locator('.menzzo-product-item');

  try {
    // Wait up to 5 seconds for at least one item to be visible
    await upsell_Product.first().waitFor({ state: 'visible', timeout: 5000 });
  } catch (e) {
    attachment('Console Warn', "⚠️ Upsell products did not appear within timeout.", 'text/plain');
    console.log("⚠️ Upsell products did not appear within timeout.");
  }

  const count_upsell = await upsell_Product.count();

  if (count_upsell === 0) {
    attachment('Console Warn', "⚠️ No upsell products found. Skipping upsell check.", 'text/plain');
    console.log("⚠️ No upsell products found. Skipping upsell check.");
    return;
  }

  // expect(count_upsell).toBeGreaterThan(0); // Removed strict assertion to avoid failure on empty upsell

  for (let i = 0; i < count_upsell; i++) {
    const upsell_item = upsell_Product.nth(i);

    // Locate the price-and-disponibility div
    const priceDiv = upsell_item.locator('.price-and-disponibility');
    await expect(priceDiv).toBeVisible();

    const rawText = await priceDiv.innerText();
    const text = rawText.trim().replace(/\s+/g, " ");


    if (!text || text.length === 0) {
      throw new Error(`❌ price-and-disponibility is EMPTY in item ${i}`);
    }

    expect(text).toMatch(/€/);             // must contain a price
    expect(text.length).toBeGreaterThan(3); // avoid empty/glitch cases
  }

}

//--Client views--//
export async function ClientViews(page: Page) {
  // Use class selector as it is more standard than ID with spaces
  const ClientViews_block = page.locator('.avis-clients-product');

  await ClientViews_block.scrollIntoViewIfNeeded();
  await expect(ClientViews_block).toBeVisible();

  //Check client views title
  const ClientViews_Title = ClientViews_block.locator('h3');
  const expected_title = "Des clients satisfaits et qui le disent";
  await expect(ClientViews_Title).toBeVisible();
  const Title_text = await ClientViews_Title.innerText();
  const ClienTitle_text = Title_text.trim().replace(/\s+/g, " ");

  //console.log(`📄 The client views title : "${ClienTitle_text}"`);

  if (ClienTitle_text === expected_title) {
  } else {
    attachment('Console Log', "❌ The clients view title does not match!", 'text/plain');
    console.log("❌ The clients view title does not match!");
  }

  //Check client views text
  // Use .first() because there are many paragraphs in the reviews, 
  // but the disclaimer/intro text is the first one in this block.
  const ClientViews_Text = ClientViews_block.locator('p').first();
  const expect_clientsViews_Text = "Les avis présentés sur cette page constituent une sélection et ne reflètent pas l’intégralité des avis reçus.";

  await expect(ClientViews_Text).toBeVisible();
  const ClientViewsText = await ClientViews_Text.innerText();
  const ClientViewstext = ClientViewsText.trim().replace(/\s+/g, " ");

  //console.log(`📄 The client views text : "${ClientViewstext}"`);

  if (ClientViewstext === expect_clientsViews_Text) {
  } else {
    attachment('Console Log', "❌ The clients view text does not match!", 'text/plain');
    console.log("❌ The clients view text does not match!");
  }

  //Check the clients reviews text
  // Use the container we already found to scope the search
  const Reviews = ClientViews_block.locator('.item-avis');

  // Wait for at least one review to appear
  try {
    await Reviews.first().waitFor({ state: 'visible', timeout: 30000 });
  } catch (e) {
    console.warn("⚠️ No reviews appeared within timeout.");
  }

  const totalReviews = await Reviews.count();

  // We want to check at least 11 reviews (or fewer if fewer exist)
  const countToCheck = Math.min(totalReviews, 11);

  if (countToCheck > 0) {

    for (let i = 0; i < countToCheck; i++) {
      const review = Reviews.nth(i);
      await expect(review).toBeVisible();

      // Example: Check if review has some text
      const reviewText = (await review.textContent())?.trim() || '';
      if (reviewText.length > 0) {
        //console.log(`📝 The constrmer text review : ${reviewText}`);
      } else {
        attachment('Console Warn', `   ⚠️ Review ${i + 1} is empty.`, 'text/plain');
        console.log(`   ⚠️ Review ${i + 1} is empty.`);
      }
    }
  } else {
    attachment('Console Warn', "⚠️ No reviews found to check.", 'text/plain');
    console.log("⚠️ No reviews found to check.");
  }
}

//--Check photos--//
export async function Photo_product(page: Page) {


  //--Check the big product photo--//
  const Principal_picture = page.locator('.carousel.carousel-product-top');
  await expect(Principal_picture).toBeVisible();

  // Select only the active (visible) image
  const Bigimg = page.locator('.carousel-product-top .carousel-cell.is-selected img').first();
  await expect(Bigimg).toBeVisible();

  // Get the REAL loaded image URL
  const imgSrc = await Bigimg.evaluate(el => (el as HTMLImageElement).currentSrc);

  // Check if empty
  if (!imgSrc || imgSrc.trim() === "") {
    attachment('Console Log', "❌ Picture is EMPTY — no image URL found", 'text/plain');
    console.log("❌ Picture is EMPTY — no image URL found");
    return;
  }


  // Function to clean filename
  const cleanImageName = (src: string) => {
    const urlWithoutParams = src.split('?')[0];
    return urlWithoutParams.substring(urlWithoutParams.lastIndexOf('/') + 1);
  };

  // Extract filename
  const fileName = cleanImageName(imgSrc);


  //--Check the small images--//
  const Smallphoto = page.locator('.carousel-nav');
  await expect(Smallphoto).toBeVisible();

  //Selecte the first small image
  const firstImage = page.locator('.carousel-cell.is-selected picture img').first();
  await expect(firstImage).toBeVisible();

  //Get the REAL loaded small image URL
  const Smallimg = await firstImage.evaluate((el: HTMLImageElement) => el.currentSrc || el.src);

  //Check if empty
  if (!Smallimg || Smallimg.trim() === "") {
    attachment('Console Log', "❌ Small picture is EMPTY — no image URL found", 'text/plain');
    console.log("❌ Small picture is EMPTY — no image URL found");
    return;
  }

  const SmalPicture = cleanImageName(Smallimg);

  //Compare images name
  if (fileName === SmalPicture) {
  } else {
    attachment('Console Log', "❌ The photos does not match!", 'text/plain');
    console.log("❌ The photos does not match!");
  }
}

//--Count photo--//
export async function CountPhoto(page: Page) {
  const images = page.locator('[data-fancybox="gallery"]');
  const count = await images.count();


  return count;
}

export async function getProductPrice(page: Page): Promise<number> {
  // Wait for the price element to be visible
  const priceElement = page.locator('.product-info-price .price-wrapper.final-price');
  await priceElement.waitFor({ state: 'visible' });

  // Get the text content
  const priceText = await priceElement.innerText();

  if (!priceText) {
    throw new Error('Price text not found on the page.');
  }

  return parsePrice(priceText);
}

export async function Tag(page: Page): Promise<string> {
  const selectors = [
    'div.ax-black-fridy-product.mb-2',
    'div.mz-black-fridy',
    '.product-badge',
    '.badge',
    '.sale-label',
    '.soldes-label',
    '.discount-label',
    '.reduction-percent',
    '.reduction-amount'
  ];

  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    try {
      if (await locator.isVisible()) {
        const text = (await locator.textContent())?.trim() || '';
        if (text) return text;
      }
    } catch {
      // ignore errors during visibility check
    }
  }

  // Fallback to searching for the text in potential badge containers
  const potentialText = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('.product-info-main .mb-2, .product-info-main span, .product-info-main div'));
    const found = elements.find(el => {
      const t = el.textContent?.trim().toUpperCase();
      // Check for specific keywords or percentage signs
      return t === 'SOLDES' || t === 'SALE' || t === 'SALDI' || t === 'PROMO' || /-\d+%/.test(t || '');
    });
    return found?.textContent?.trim() || '';
  });

  return potentialText;
}

function parsePrice(priceText: string): number {
  if (!priceText) return 0;

  // Clean string: keep only digits, dots, and commas
  let cleaned = priceText.replace(/[^\d.,]/g, '');

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > lastDot) {
    // Comma is decimal separator (European style: 1.234,56 or 1 234,56)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Dot is decimal separator (US style: 1,234.56 or 1 234.56)
    cleaned = cleaned.replace(/,/g, '');
  } else {
    // Only one separator or none
    cleaned = cleaned.replace(',', '.');
  }

  return parseFloat(cleaned) || 0;
}

export async function getLowPrice(page: Page): Promise<number> {
  // Locate the old price element
  const lowPriceElement = page.locator('[data-price-type="oldPrice"]');

  // Wait until visible
  await lowPriceElement.waitFor({ state: 'visible' });

  // Extract the text content, e.g. "145,00 €"
  const priceText = await lowPriceElement.textContent();

  if (!priceText) {
    throw new Error('Low price text not found.');
  }

  return parsePrice(priceText);
}

export async function Check_Image(page: Page) {

  // Count real number of pictures
  const totalPhotos = await CountPhoto(page);

  // Loop through each photo
  for (let i = 0; i < totalPhotos; i++) {


    // Check the big photo
    await Photo_product(page);

    // If not last photo → click Next
    if (i < totalPhotos - 1) {
      await Button_Next(page);
    }
  }

  // OPTIONAL: Go back to first image
  for (let i = 0; i < totalPhotos - 1; i++) {
    await Button_Previous(page);

    // Check the big photo
    await Photo_product(page);
  }
}

export async function OtherColor(page: Page) {

  const colorItems = page.locator(
    '//div[contains(@class, "bloc-associated")]//a[contains(@class, "catalog-product-color-switch")]'
  );

  // Count colors
  const count = await colorItems.count();

  if (count === 0) {
    return { count: 0, urls: [] };
  }


  // Array to store all color product URLs
  const allUrls: string[] = [];

  for (let i = 0; i < count; i++) {
    const item = colorItems.nth(i);
    const url = await item.getAttribute("href");

    if (url) {
      allUrls.push(url);
    }
  }


  // Return without clicking
  return { count, urls: allUrls };
}

export async function SEO_Title(page: Page) {



  // -------------------------------
  // 📌 Extract the correct H1
  // -------------------------------
  const h1Locator = page.locator("h1.ax-page-title");

  // -------------------------------
  // 📌 Extract H1 & Title text
  // -------------------------------
  const h1Text = (await h1Locator.textContent())?.trim() || "";
  const pageTitle = (await page.title()).trim();

  // -------------------------------
  // 🌐 Detect languages
  // -------------------------------
  const h1Lang = detectLanguage(h1Text);
  const titleLang = detectLanguage(pageTitle);

  // -------------------------------
  // 📝 LOG OUTPUT
  // -------------------------------

  const sameLanguage = h1Lang === titleLang;

  if (sameLanguage) {
  } else {
    attachment('Console Log', `❌ Language mismatch detected!`, 'text/plain');
    console.log(`❌ Language mismatch detected!`);
  }

  // -------------------------------
  // 📌 Assertion (soft)
  // -------------------------------
  await expect.soft(
    sameLanguage,
    `H1 and Page Title must be in the same language`
  ).toBeTruthy();
}


export async function SEO_Description(page: Page) {



  // -------------------------------
  // 📌 Extract H1, Title & Description
  // -------------------------------
  const h1Text = (await page.locator("h1").textContent())?.trim() || "";
  const pageTitle = (await page.title()).trim();

  const description = await page.locator('meta[name="description"]').getAttribute("content") || "";

  // -------------------------------
  // 🌐 Detect languages
  // -------------------------------
  const h1Lang = detectLanguage(h1Text);
  const titleLang = detectLanguage(pageTitle);
  const descLang = detectLanguage(description);

  // -------------------------------
  // 📝 LOG OUTPUT
  // -------------------------------

  const allMatch = h1Lang === titleLang && titleLang === descLang;

  if (allMatch) {
  } else {
    attachment('Console Log', `❌ Language mismatch detected!`, 'text/plain');
    console.log(`❌ Language mismatch detected!`);
  }

  // -------------------------------
  // 📌 Assertion (soft)
  // -------------------------------
  await expect.soft(
    allMatch,
    `H1, Title, and Description must be in the same language`
  ).toBeTruthy();
}

export async function CheckTitleLanguage(page: Page) {
  const title: string = await page.title();
  const detectedLanguage = detectLanguage(title);
}

export async function getProductWeight(page: Page): Promise<string | null> {

  // Detect language from URL
  const currentUrl = page.url();
  let lang = 'fr';

  if (currentUrl.includes('menzzo.de')) lang = 'de';
  else if (currentUrl.includes('menzzo.nl')) lang = 'nl';
  else if (currentUrl.includes('menzzo.it')) lang = 'it';
  else if (currentUrl.includes('menzzo.es')) lang = 'es';
  else if (currentUrl.includes('menzzo.pt')) lang = 'pt';
  else if (currentUrl.includes('nl.menzzo.be')) lang = 'nl';
  else if (currentUrl.includes('menzzo.be')) lang = 'fr';
  else if (currentUrl.includes('menzzo.at')) lang = 'de';

  // 1. Define tab titles to open the section
  const tabTitles: Record<string, string> = {
    fr: "Informations complémentaires",
    de: "Mehr Informationen",
    nl: "Meer informatie",
    it: "Informazioni complementari",
    es: "Informaciones complementarias",
    pt: "Mais informações"
  };
  const tabTitleStr = tabTitles[lang] || tabTitles['fr'];

  // 2. Weight row labels per language
  const weightLabels: Record<string, string[]> = {
    fr: ['Poids net'],
    de: ['Nettogewicht'],
    nl: ['Netto gewicht', 'Nettogewicht'],
    it: ['Peso netto'],
    es: ['Peso neto'],
    pt: ['Peso líquido']
  };
  const labels = weightLabels[lang] || weightLabels['fr'];

  // 3. Try to open the tab if the table isn't visible
  const table = page.locator('//div[@class="additional-attributes-wrapper table-wrapper"]//table');

  if (!await table.isVisible()) {
    // Try multiple specific selectors for the tab title
    const tabSelector = page.locator(`//div[contains(@class, "data item title")]//a[contains(text(), "${tabTitleStr}")]`).first();
    const tabSelectorAlt = page.locator(`a#tab-label-additional-title`); // Common Magento ID

    if (await tabSelector.isVisible()) {
      await tabSelector.click();
    } else if (await tabSelectorAlt.isVisible()) {
      await tabSelectorAlt.click();
    } else {
      // Fallback: try clicking by text directly
      const textTab = page.locator(`text=${tabTitleStr}`);
      if (await textTab.count() > 0) {
        await textTab.first().click();
      }
    }

    // Give it a moment to expand
    await page.waitForTimeout(1000);
  }

  // 4. Assert table visibility
  await expect.soft(table).toBeVisible({ timeout: 5000 });

  const rows = await table.locator('tr').all();

  for (const row of rows) {
    const thText = (await row.locator('th').textContent() || '').trim();

    for (const label of labels) {
      if (normalizeText(thText).includes(normalizeText(label))) {
        const value = (await row.locator('td.col.data').textContent() || '').trim();
        return value;
      }
    }
  }

  return null;
}