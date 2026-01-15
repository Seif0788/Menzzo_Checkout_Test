import { Page, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';

export async function checkClockBanner(page: Page) {
    const timerBox = page.locator('.timerbox');
    const timerText = await timerBox.innerText();

    console.log(timerText);

}

export async function BannerText(page: Page) {
    const promoWrapper = page.locator('.promo-wrapper');
    const promoText = await promoWrapper.innerText();

    console.log(promoText);

} 
