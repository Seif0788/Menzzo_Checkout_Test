import { Page, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';

export async function Check_menu(page: Page, categories: string[]) {
    for (const category of categories) {
        const menuLink = page.locator('ul#ui-id-1 span', {
            hasText: category
        }).first();
        try {
            await expect(menuLink.first()).toBeVisible({ timeout: 5000 });
            attachment('Menu Link', `✅ Menu Link matches the expected text: ${category}`, 'text/plain');
            console.log(`✅ Menu Link matches the expected text: ${category}`)
        } catch (error) {
            attachment('Menu Link', `❌ Menu Link does not match the expected text: ${category}`, 'text/plain');
            console.log(`❌ Menu Link does not match the expected text: ${category}`)
            throw error;
        }
    }
}
