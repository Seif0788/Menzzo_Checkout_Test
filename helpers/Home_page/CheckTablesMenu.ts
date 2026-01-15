import { Page, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';

export async function checkTablesMenuCategories(
    page: Page,
    categories: string[]
) {
    for (const category of categories) {
        const categoryLocator = page.locator('ul#ui-id-1 span', {
            hasText: category,
        });

        try {
            await expect(categoryLocator.first()).toBeVisible({ timeout: 5000 });

            attachment(
                'Menu Category Found',
                `✅ Category visible: ${category}`,
                'text/plain'
            );
        } catch {
            attachment(
                'Menu Category Missing',
                `❌ Category NOT found: ${category}`,
                'text/plain'
            );
            throw new Error(`Category not found in Tables menu: ${category}`);
        }
    }
}
