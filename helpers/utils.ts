import { Page, expect, Locator, Frame} from '@playwright/test';

// Navigate to URL and verify title
export async function gotopageAndVerifyTitle(page: Page, url: string, titleText: string, timeout:number = 20000) {
  await page.goto(url);
  await expect(page).toHaveTitle(titleText);
}

// Click element by text

/**
 * Try to click an element that contains exactly the provided text (robust against punctuation/whitespace).
 * Tries multiple strategies:
 *  - getByRole('button'|'link') with exact match (case-insensitive)
 *  - getByText exact
 *  - text= locator (Playwright text engine)
 *  - XPath normalized exact match
 *  - clickable ancestor (a | button | [role=button])
 *  - Evaluated click fallback
 * Also searches inside frames if not found in main page.
 *
 * Returns the Locator that was clicked (from the frame/page context where it was clicked).
 */
export async function clickElementByText(
  page: Page,
  text: string,
  timeout: number = 50000,
  opts: { debug?: boolean } = {}
): Promise<Locator> {
  const start = Date.now();
  const perTryTimeout = 2000;
  const perClickTimeout = 5000;
  const debug = !!opts.debug;

  function timeLeft() {
    return Math.max(0, timeout - (Date.now() - start));
  }

  function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Build a safe XPath literal for arbitrary text (handles both quotes)
  function xpathLiteral(s: string) {
    if (!s.includes('"')) return `"${s}"`;
    if (!s.includes("'")) return `'${s}'`;
    // contains both quotes -> use concat() trick
    const parts = s.split('"');
    return 'concat(' + parts.map((p, i) => {
      const piece = `"${p}"`;
      return i === parts.length - 1 ? piece : `${piece}, '\"', `;
    }).join('') + ')';
  }

  // Helper to attempt clicking a Locator
  async function tryClick(locator: Locator) {
    try {
      await locator.first().waitFor({ state: 'visible', timeout: Math.min(perTryTimeout, timeLeft()) });
      await locator.first().scrollIntoViewIfNeeded();
      await locator.first().click({ timeout: Math.min(perClickTimeout, timeLeft()) });
      return locator.first();
    } catch (err) {
      return null;
    }
  }

  // Helper to try clicking the ancestor clickable element of the given Locator
  async function tryClickAncestor(el: Locator) {
    try {
      // try nearest ancestor link/button or element with role=button
      const anc = el.locator('xpath=ancestor::a[1]');
      if (await anc.count()) {
        await anc.first().waitFor({ state: 'visible', timeout: Math.min(perTryTimeout, timeLeft()) });
        await anc.first().click({ timeout: Math.min(perClickTimeout, timeLeft()) });
        return anc.first();
      }
      const ancBtn = el.locator('xpath=ancestor::button[1]');
      if (await ancBtn.count()) {
        await ancBtn.first().waitFor({ state: 'visible', timeout: Math.min(perTryTimeout, timeLeft()) });
        await ancBtn.first().click({ timeout: Math.min(perClickTimeout, timeLeft()) });
        return ancBtn.first();
      }
      const ancRole = el.locator('xpath=ancestor::*[@role="button"][1]');
      if (await ancRole.count()) {
        await ancRole.first().waitFor({ state: 'visible', timeout: Math.min(perTryTimeout, timeLeft()) });
        await ancRole.first().click({ timeout: Math.min(perClickTimeout, timeLeft()) });
        return ancRole.first();
      }
    } catch {
      // ignore
    }
    return null;
  }

  // Try a locator in the main page context
  async function tryStrategiesOn(pageContext: Page | any): Promise<Locator | null> {
    // 1) button by role (exact, case-insensitive)
    try {
      const roleBtn = pageContext.getByRole?.('button', { name: new RegExp(`^${escapeRegExp(text)}$`, 'i') });
      if (roleBtn) {
        const clicked = await tryClick(roleBtn);
        if (clicked) return clicked;
      }
    } catch {}

    // 2) link by role
    try {
      const roleLink = pageContext.getByRole?.('link', { name: new RegExp(`^${escapeRegExp(text)}$`, 'i') });
      if (roleLink) {
        const clicked = await tryClick(roleLink);
        if (clicked) return clicked;
      }
    } catch {}

    // 3) exact getByText
    try {
      const byTextExact = pageContext.getByText?.(text, { exact: true });
      if (byTextExact) {
        const clicked = await tryClick(byTextExact);
        if (clicked) return clicked;
      }
    } catch {}

    // 4) Playwright text selector (handles many edge cases, including punctuation / accents)
    try {
      const textLoc = pageContext.locator(`text=${JSON.stringify(text)}`);
      if (await textLoc.count()) {
        const clicked = await tryClick(textLoc);
        if (clicked) return clicked;
        // try clickable ancestor
        const ancClicked = await tryClickAncestor(textLoc);
        if (ancClicked) return ancClicked;
      }
    } catch {}

    // 5) XPath normalized exact match (strip commas and NBSPs, normalize whitespace)
    try {
      const cleaned = text.replace(/\u00A0/g, ' ').replace(/[,]/g, '').trim();
      const xpath = `xpath=//*[normalize-space(translate(normalize-space(string(.)), ',\u00A0', '')) = ${xpathLiteral(cleaned)}]`;
      const xpathLoc = pageContext.locator(xpath);
      if (await xpathLoc.count()) {
        const clicked = await tryClick(xpathLoc);
        if (clicked) return clicked;
        const ancClicked = await tryClickAncestor(xpathLoc);
        if (ancClicked) return ancClicked;
      }
    } catch {}

    // 6) XPath contains fallback (partial match)
    try {
      const partial = text.trim().replace(/\s+/g, ' ');
      const xpathContains = `xpath=//*[contains(normalize-space(string(.)), ${xpathLiteral(partial)})]`;
      const xpathContainsLoc = pageContext.locator(xpathContains);
      if (await xpathContainsLoc.count()) {
        const clicked = await tryClick(xpathContainsLoc);
        if (clicked) return clicked;
        const ancClicked = await tryClickAncestor(xpathContainsLoc);
        if (ancClicked) return ancClicked;
      }
    } catch {}

    return null;
  }

  // 1) Try in main page
  const mainResult = await tryStrategiesOn(page);
  if (mainResult) {
    if (debug) console.log('clickElementByText: clicked in main page context:', text);
    return mainResult;
  }

  // 2) Try in each frame (cookie banners and third-party popups commonly live inside frames)
  for (const frame of page.frames()) {
    // skip main frame (already tried)
    if (frame === page.mainFrame()) continue;
    try {
      const res = await tryStrategiesOn(frame);
      if (res) {
        if (debug) console.log('clickElementByText: clicked in frame:', frame.url(), text);
        return res;
      }
    } catch {}
  }

  // 3) Fallback: collect debug info for developer
  if (debug) {
    // Gather debug HTML of top matches in main page (if any)
    try {
      const samples = [];
      const candidateSelectors = [
        `text=${JSON.stringify(text)}`,
        `xpath=//*[contains(normalize-space(string(.)), ${xpathLiteral(text.trim())})]`
      ];
      for (const sel of candidateSelectors) {
        try {
          const loc = page.locator(sel);
          const n = await loc.count();
          for (let i = 0; i < Math.min(n, 5); i++) {
            const html = await loc.nth(i).evaluate((nEl) => (nEl as HTMLElement).outerHTML);
            samples.push({ selector: sel, index: i, html });
          }
        } catch {}
      }
      console.log('clickElementByText debug samples:', samples);
    } catch (e) {
      console.warn('clickElementByText debug failed:', e);
    }
  }

  // 4) Last resort: attempt to find and click via document query and dispatchEvent (best effort)
  try {
    const ok = await page.evaluate((needle) => {
      function norm(s: string) {
        return s?.replace(/\u00A0/g, ' ').replace(/[,]/g, '').replace(/\s+/g, ' ').trim();
      }
      const el = Array.from(document.querySelectorAll('*')).find(n => norm(n.textContent || '') === norm(needle));
      if (!el) return false;
      try { (el as HTMLElement).click(); } catch {}
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }, text);
    if (ok) {
      // small wait to ensure UI reacts
      await page.waitForTimeout(150);
      // return a best-effort locator (first match)
      const fallback = page.locator(`text=${JSON.stringify(text)}`).first();
      return fallback;
    }
  } catch {}

  throw new Error(`clickElementByText: could not find/click element with text "${text}" within ${timeout} ms`);
}

// Search function
export async function search(page: Page, productName: string) {
  const searchInput = page.locator('input[placeholder="Que cherchez-vous ?"]');
  await expect(searchInput).toBeVisible();

  await searchInput.fill(productName);
  const searchPopup = page.locator('div.row.container-search');
  await expect(searchPopup).toBeVisible({ timeout: 10000 });

  await page.keyboard.press('Enter');

  const results = page.locator('span[data-ui-id="page-title-wrapper"]');
  const expectedRegex = new RegExp(`Résultats de recherche pour : ['"]?${productName}['"]?`, 'i');
  const resultsText = await results.first().innerText();
  if (!expectedRegex.test(resultsText)) {
    throw new Error(`Search result mismatch. Got "${resultsText}", expected "${productName}"`);
  }
}

// Login function (optional if needed)
export async function login(page: Page, username: string, password: string) {
  const loginButton = page.getByText('Me connecter').first();
  if (await loginButton.count() > 0) await loginButton.click();

  await page.fill('input[name="login[username]"]', username);
  await page.fill('input[name="login[password]"]', password);
  await page.click('button[name="send"]');

  const accountLocator = page.locator('a.account-label span.text', { hasText: 'Compte' }).first();
  await accountLocator.waitFor({ state: 'visible', timeout: 10000 });
  await expect(accountLocator).toBeVisible();
}

export async function ClickRandomProduct(page:Page, timeout: number = 30000) {

  //Wait for the product list container to appear
  await page.waitForSelector('li.ais-InfiniteHits-item', {state: 'visible', timeout});

  const products = page.locator('li.ais-InfiniteHits-item');
  
  await expect(products.first()).toBeVisible({timeout});

  const count = await products.count();
  if (count === 0){
    throw new Error(`No product in this category page`);
  }

  const randomIndex = Math.floor(Math.random()*count);
  const product = products.nth(randomIndex);

  await product.scrollIntoViewIfNeeded({timeout});
  await page.waitForTimeout(500);

  await product.click({timeout});

  console.log(`Clicked on random product [${randomIndex}]/${count}`);

  return product;
}

export async function clickElementByTextWithPopUp (page:Page, mainText: string, popupText?: string, timeout: number = 10000){
  //Click the main button
  const mainButton = page.getByText(mainText, {exact: true});
  await mainButton.click();

  if(popupText){
    const popupButton = page.getByText(popupText, {exact: true});

    await popupButton.waitFor({state: 'visible', timeout});

    await popupButton.scrollIntoViewIfNeeded();

    await popupButton.click();
  }
}



// Wait to upload the page

export async function waitForPageLoad(page: Page, timeout: number = 30000) {
  const states: ('domcontentloaded' | 'load' | 'networkidle')[] = ['domcontentloaded', 'load'];

  for (const state of states) {
    try {
      await page.waitForLoadState(state, { timeout });
    } catch (e: any) {
      if (e.message.includes('Target page, context or browser has been closed')) {
        console.warn(`[waitForPageLoad] Page closed before ${state} state`);
        return; // exit gracefully
      }
      throw e;
    }
  }

  // On some pages (like onestepcheckout), network requests never stop
  if (!page.url().includes('onestepcheckout')) {
    try {
      await page.waitForLoadState('networkidle', { timeout });
    } catch {
      console.warn(`[waitForPageLoad] Skipped networkidle on ${page.url()}`);
    }
  }
}

/**
 * Wait for OneStepCheckout to be ready for interaction.
 * Handles AJAX delays, slow rendering, and optional iframes.
 */
export async function waitForCheckoutReady(page: Page, timeout = 180000) {
  console.log('⏳ Waiting for OneStepCheckout to initialize...');
  const start = Date.now();
  let retries = 0;

  while (Date.now() - start < timeout) {
    try {
      // Ensure the page context is valid
      if (page.isClosed()) {
        console.error('❌ Page context is closed. Attempting recovery...');
        const allPages = page.context().pages();
        for (const p of allPages) {
          if (/onestepcheckout/i.test(p.url())) {
            console.log(`🔄 Switched to new checkout page: ${p.url()}`);
            page = p;
            break;
          }
        }
        if (page.isClosed()) {
          throw new Error('❌ Unable to recover from page closure.');
        }
      }

      // Ensure we're on the checkout page
      if (!page.url().includes('onestepcheckout')) {
        console.log('❌ Not on the checkout page. Current URL:', page.url());
        throw new Error('❌ Not on the checkout page.');
      }

      console.log(`🔄 Current URL: ${page.url()}`);
      console.log(`🔄 Retry ${retries}: Checking for #checkout container visibility...`);

      // Debugging: Log the state of the #checkout container
      const checkoutExists = await page.locator('#checkout').count();
      //console.log(`🔍 #checkout container exists: ${checkoutExists > 0}`);

      // Debugging: Log all visible elements on the page
      const visibleElements = await page.locator('*').evaluateAll(elements =>
        elements.map(el => el.outerHTML)
      );
      //console.log(`🔍 Visible elements on the page during retry ${retries}:`, visibleElements);

      // Temporarily increase timeout for debugging
      const extendedTimeout = timeout + 60000; // Add 1 minute
      //console.log(`⏳ Temporarily increased timeout to ${extendedTimeout}ms for debugging.`);

      // Check for the presence of the checkout container
      const checkoutContainer = page.locator('#checkout');
      if (await checkoutContainer.isVisible({ timeout: 5000 })) {
        console.log('✅ Checkout container is visible.');
        return;
      }

      // Retry logic
      retries++;
      console.warn(`⚠️ Retry ${retries}: Checkout not ready yet. Retrying...`);
      await page.waitForTimeout(3000);
    } catch (error: any) {
      console.error(`⚠️ Error during checkout readiness check: ${error.message}`);
      await page.waitForTimeout(3000);
    }
  }

  throw new Error(`❌ Checkout did not become ready within ${timeout}ms`);
}

/**
 * Safely clicks the first visible "Add to Cart" button.
 */
export async function clickAddToCart(page: Page) {
  const addToCartBtn = page.locator(
    'button[type="submit"][title*="Ajouter"], button.action.tocart'
  );

  await addToCartBtn.first().waitFor({ state: 'visible', timeout: 50000 });

  const maxRetries = 5;
  const interval = 500;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const btn = addToCartBtn.first();
      if (await btn.isVisible()) {
        await btn.click({ force: true });
        console.log('🧺 Product added to cart.');
        return;
      }
    } catch (e) {
      console.warn(`⚠️ Retry ${i + 1}/${maxRetries} failed:`, e);
    }
    await page.waitForTimeout(interval);
  }

  throw new Error('❌ Could not click Add to Cart button after multiple attempts');
}

// Closes any open menu or overlay that blocks clicks
export async function closeFloatingMenus(page: Page) {
  await page.keyboard.press('Escape').catch(() => {});
  // Click somewhere neutral (like the top banner or body)
  await page.mouse.move(5, 5);
  await page.mouse.click(5, 5).catch(() => {});
  await page.waitForTimeout(300);
}

// Dismiss potential overlays or modals
export async function dismissOverlays(page: Page) {
  const overlaySelectors = [
    'div.overlay', // Example overlay selector
    'div.modal',   // Example modal selector
  ];

  for (const selector of overlaySelectors) {
    const overlay = page.locator(selector);
    if (await overlay.isVisible()) {
      console.log(`Dismissing overlay: ${selector}`);
      await overlay.click({ force: true });
    }
  }
}

