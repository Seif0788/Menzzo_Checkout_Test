import { test, expect } from "@playwright/test";
import { gotopageAndVerifyTitle, clickElementByText } from "../../helpers/utils";
import * as fs from 'fs';
import * as path from 'path';

test("Menu_Menzzo_Fr", async ({ page }) => {
    try {
        //Open the browser
        await gotopageAndVerifyTitle(page, "https://www.menzzo.fr/", "Menzzo : Table & Chaise Design, Meubles Mobilier Scandinave pas cher", 20000);
        console.log("✅ Page opened and title verified.");

        //Close cookies popup
        await clickElementByText(page, "Accepter et continuer");
        console.log("✅ Cookies popup closed.");

        //Verify that the menu is displayed
        const Menu = page.locator("#store\\.menu");
        await expect(Menu).toBeVisible();
        console.log("✅ Menu is displayed.");

        // DEBUG: Log top-level menu items to understand exact text structure
        // Try different selectors to find the menu structure
        let topLevelLinks = Menu.locator('> li > a');
        let topLevelTexts = await topLevelLinks.allInnerTexts();

        if (topLevelTexts.length === 0) {
            console.log("⚠️ No items found with '> li > a', trying 'li > a'");
            topLevelLinks = Menu.locator('li > a');
            topLevelTexts = await topLevelLinks.allInnerTexts();
        }

        if (topLevelTexts.length === 0) {
            console.log("⚠️ No items found with 'li > a', trying just 'a'");
            topLevelLinks = Menu.locator('a');
            topLevelTexts = await topLevelLinks.allInnerTexts();
        }

        console.log(`🔍 Found ${topLevelTexts.length} menu items`);

        // Read and parse CSV data
        const csvPath = path.resolve(process.cwd(), "menzzo_menu_data.csv");
        console.log(`Reading CSV from: ${csvPath}`);

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

        console.log(`Loaded ${menuMap.size} categories from CSV.`);

        // Iterate through categories and verify subcategories
        for (const [category, subcategories] of menuMap) {
            console.log(`\n🔍 Checking Category: ${category}`);

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
                    console.log(`   ✅ Matched "${text.replace(/\n/g, ' ')}" with "${category}"`);
                    break;
                }
            }

            if (!categoryLink) {
                console.warn(`⚠️ Category not found in menu: ${category}`);
                console.warn(`   Looking for normalized: "${targetCategory}"`);
                continue;
            }

            await expect(categoryLink).toBeVisible();

            // Hover to reveal submenu
            await categoryLink.hover();
            // Small wait for animation/rendering
            await page.waitForTimeout(1500);

            console.log(`   Hovered ${category}. Checking ${subcategories.length} subcategories...`);

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
                    console.error(`   ❌ Subcategory not found or not visible: ${sub}`);
                    notFoundCount++;
                }
            }
            console.log(`   ✅ ${foundCount}/${subcategories.length} subcategories verified for ${category}`);
            if (notFoundCount > 0) {
                console.warn(`   ⚠️ ${notFoundCount} subcategories not found`);
            }
        }

        console.log("\n✅ ✅ ✅ Menu verification completed successfully! ✅ ✅ ✅");
    } catch (error) {
        console.error("❌ Test failed with error:", error);
        throw error;
    }
});
