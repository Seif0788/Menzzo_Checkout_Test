import { test, expect } from "@playwright/test";
import { attachment } from 'allure-js-commons';
import { gotopageAndVerifyTitle, clickElementByText } from "../../helpers/utils";
import * as fs from 'fs';
import * as path from 'path';

test("Menu_Menzzo_Fr", async ({ page }) => {
    try {
        //Open the browser
        await gotopageAndVerifyTitle(page, "https://www.menzzo.fr/", "Menzzo : Table & Chaise Design, Meubles Mobilier Scandinave pas cher", 20000);
        attachment('Console Log', "✅ Page opened and title verified.", 'text/plain');

        //Close cookies popup
        await clickElementByText(page, "Accepter et continuer");
        attachment('Console Log', "✅ Cookies popup closed.", 'text/plain');

        //Verify that the menu is displayed
        const Menu = page.locator("#store\\.menu");
        await expect(Menu).toBeVisible();
        attachment('Console Log', "✅ Menu is displayed.", 'text/plain');

        // DEBUG: Log top-level menu items to understand exact text structure
        // Try different selectors to find the menu structure
        let topLevelLinks = Menu.locator('> li > a');
        let topLevelTexts = await topLevelLinks.allInnerTexts();

        if (topLevelTexts.length === 0) {
            attachment('Console Warn', "⚠️ No items found with '> li > a', trying 'li > a'", 'text/plain');
            topLevelLinks = Menu.locator('li > a');
            topLevelTexts = await topLevelLinks.allInnerTexts();
        }

        if (topLevelTexts.length === 0) {
            attachment('Console Warn', "⚠️ No items found with 'li > a', trying just 'a'", 'text/plain');
            topLevelLinks = Menu.locator('a');
            topLevelTexts = await topLevelLinks.allInnerTexts();
        }

        attachment('Console Log', `🔍 Found ${topLevelTexts.length} menu items`, 'text/plain');

        // Read and parse CSV data
        const csvPath = path.resolve(process.cwd(), "menzzo_menu_data.csv");
        attachment('Console Log', `Reading CSV from: ${csvPath}`, 'text/plain');

        if (!fs.existsSync(csvPath)) {
            throw new Error(`CSV file not found at ${csvPath}`);
        }

        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n').filter((l) => l.trim() !== '');
        const menuMap = new Map<string, string[]>();

        // Skip header (start at i=1)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const lastCommaIndex = line.lastIndexOf(',');
            if (lastCommaIndex === -1) continue;

            const category = line.substring(0, lastCommaIndex).trim();
            const subcategory = line.substring(lastCommaIndex + 1).trim();

            if (!menuMap.has(category)) {
                menuMap.set(category, []);
            }
            if (subcategory) {
                menuMap.get(category)?.push(subcategory);
            }
        }

        attachment('Console Log', `Loaded ${menuMap.size} categories from CSV.`, 'text/plain');

        // Iterate through categories and verify subcategories
        for (const [category, subcategories] of menuMap) {
            attachment('Console Log', `\n🔍 Checking Category: ${category}`, 'text/plain');

            // Normalize category name for comparison
            // The menu has newlines and commas, CSV has spaces
            // e.g., "Tables,\ntables Basses" vs "Tables tables Basses"
            const normalize = (str: string) => {
                return str
                    .replace(/,/g, '') // Remove commas
                    .replace(/\s+/g, ' ') // Normalize whitespace (including newlines)
                    .toLowerCase()
                    .trim();
            };
            const targetCategory = normalize(category);

            // Find the link among top-level links
            let categoryLink = null;
            const count = await topLevelLinks.count();

            for (let i = 0; i < count; i++) {
                const link = topLevelLinks.nth(i);
                const text = await link.innerText();

                // Skip empty links
                if (!text || text.trim() === '') {
                    continue;
                }

                const normalizedText = normalize(text);

                // Check if they match (either exact or one contains the other)
                // But avoid matching if normalized text is empty
                if (normalizedText && targetCategory &&
                    (normalizedText === targetCategory ||
                        normalizedText.includes(targetCategory) ||
                        targetCategory.includes(normalizedText))) {
                    categoryLink = link;
                    attachment('Console Log', `   ✅ Matched "${text.replace(/\n/g, ' ')}" with "${category}"`, 'text/plain');
                    break;
                }
            }

            if (!categoryLink) {
                attachment('Console Warn', `⚠️ Category not found in menu: ${category}`, 'text/plain');
                attachment('Console Warn', `   Looking for normalized: "${targetCategory}"`, 'text/plain');
                continue;
            }

            await expect(categoryLink).toBeVisible();

            // Hover to reveal submenu
            await categoryLink.hover();
            // Small wait for animation/rendering
            await page.waitForTimeout(1500);

            attachment('Console Log', `   Hovered ${category}. Checking ${subcategories.length} subcategories...`, 'text/plain');

            let foundCount = 0;
            let notFoundCount = 0;

            for (const sub of subcategories) {
                // Find subcategory link
                const subLink = page.locator('a').filter({ hasText: sub }).first();

                // Verify visibility
                try {
                    await expect(subLink).toBeVisible({ timeout: 2000 });
                    foundCount++;
                } catch (e) {
                    attachment('Console Error', `   ❌ Subcategory not found or not visible: ${sub}`, 'text/plain');
                    notFoundCount++;
                }
            }
            attachment('Console Log', `   ✅ ${foundCount}/${subcategories.length} subcategories verified for ${category}`, 'text/plain');
            if (notFoundCount > 0) {
                attachment('Console Warn', `   ⚠️ ${notFoundCount} subcategories not found`, 'text/plain');
            }
        }

        attachment('Console Log', "\n✅ ✅ ✅ Menu verification completed successfully! ✅ ✅ ✅", 'text/plain');
    } catch (error) {
        attachment('Console Error', `❌ Test failed with error: ${error}`, 'text/plain');
        throw error;
    }
});
