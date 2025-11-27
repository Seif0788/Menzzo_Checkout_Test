import {Page, expect} from '@playwright/test';


export async function Cart_Header(page:Page) {
    const CartBtn = page.locator('//div[@class ="minicart-header"]');
    await expect.soft(CartBtn, "Cart button should be exist").toBeVisible();

    CartBtn.click();
    
}