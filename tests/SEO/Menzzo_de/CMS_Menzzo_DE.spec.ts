import { test, expect } from '@playwright/test';
import { clickElementByText } from '../../../helpers/utils';
import fs from 'fs';
import Papa from 'papaparse';
import { detect } from 'langdetect';

const csvfile = './data/CMS.csv';

// --- Load CSV (contains only CMS URL keys) ---
interface CMSRow {
    CMS: string;
}

function loadCSV(): CMSRow[] {
    let content = fs.readFileSync(csvfile, 'utf-8');
    content = content.replace(/"/g, '');
    return Papa.parse<CMSRow>(content, { header: true }).data.filter(p => p.CMS);
}

const CMS_PAGES = loadCSV();

// --- Helper function to detect language ---
function detectLanguage(text: string): string {
    if (!text || text.trim().length === 0) return 'unknown';
    try {
        const result = detect(text);
        // detect() returns an array of LanguageDetectionResult objects
        // Extract the language code from the first (most confident) result
        if (result && result.length > 0) {
            return result[0].lang;
        }
        return 'unknown';
    } catch (error) {
        return 'unknown';
    }
}

// --- Playwright tests ---
test.describe(`SEO check on ALL CMS pages (${CMS_PAGES.length} pages)`, () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('https://www.menzzo.de/');
        await clickElementByText(page, "Alle akzeptieren");
    });

    // 🔥 One test per CMS Page
    for (const row of CMS_PAGES) {

        test(`SEO Test CMS: ${row.CMS}`, async ({ page }) => {

            const url = `https://www.menzzo.de/${row.CMS}`;
            console.log(`Testing CMS page: ${url}`);

            await page.goto(url);

            // --- Extract H1, Title, and Meta Description ---
            const h1 = await page.locator('h1').innerText().catch(() => '');
            const title = await page.title().catch(() => '');
            const description = await page.locator('meta[name="description"]').getAttribute('content').catch(() => '');

            // --- Detect languages ---
            const h1Lang = detectLanguage(h1);
            const titleLang = detectLanguage(title);
            const descLang = detectLanguage(description || '');

            // --- Log results ---
            console.log('🌐 SEO Language Check:');
            console.log('─────────────────────────────');
            console.log(`📌 H1 text        : "${h1}"`);
            console.log(`📌 Page Title     : "${title}"`);
            console.log(`📌 Meta Description: "${description}"`);
            console.log(`🌍 H1 language    : ${h1Lang}`);
            console.log(`🌍 Title language : ${titleLang}`);
            console.log(`🌍 Description lang : ${descLang}`);
            console.log('─────────────────────────────');

            // Optional: Assert that all languages match
            if (h1Lang !== descLang || titleLang !== descLang) {
                console.warn('❌ Language mismatch detected!');
            } else {
                console.log('✅ Language match detected.');
            }
        });
    }
});
