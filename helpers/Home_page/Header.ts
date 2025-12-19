import { Page, expect } from '@playwright/test';
import { allure } from "allure-playwright";

export async function Check_logo(page: Page) {
    // Wait for the logo to be visible
    const logo = page.locator('a.logo').first();

    //Check visibility
    await expect(logo).toBeVisible({ timeout: 10000 });


    //Get the URL (href) of the logo link
    const URL_Logo = await logo.getAttribute('href');
    return URL_Logo;
}

export async function Check_Search_Bar(page: Page) {

    const searchBar = page.locator('#searchbox').first();
    await expect(searchBar).toBeAttached();

    const placeholderText = await searchBar.locator('input[type="search"]').getAttribute('placeholder');
    return placeholderText;

}

export async function Check_wishlist(page: Page) {

    const rightHeader = page.locator('div.ax-header-right').first();
    const wishlistIcon = rightHeader.locator('li.wishlist-header').first();
    await expect(wishlistIcon).toBeVisible();
    const wishlistlink = wishlistIcon.locator('a.wishlist-link').first();
    const wishlistURL = await wishlistlink.getAttribute('href');
    return wishlistURL;

}

export async function Check_blog(page: Page) {

    const rightHeader = page.locator('div.ax-header-right').first();
    const blogIcon = rightHeader.locator('li.blog-link').first();
    await expect(blogIcon).toBeVisible();
    const bloglink = blogIcon.locator('a').first();
    const blogURL = await bloglink.getAttribute('href');
    return blogURL;

}

export async function Check_Showroom(page: Page) {

    const rightHeader = page.locator('div.ax-header-right').first();
    const showroomIcon = rightHeader.locator('li.showroom-link').first();
    await expect(showroomIcon).toBeVisible();
    const showroomlink = showroomIcon.locator('a').first();
    const showroomURL = await showroomlink.getAttribute('href');
    return showroomURL;

}

export async function Check_Contact(page: Page) {

    const rightHeader = page.locator('div.ax-header-right').first();
    const contactIcon = rightHeader.locator('li.phone-link').first();
    await expect(contactIcon).toBeVisible();
    const contactlink = contactIcon.locator('div.phone-number-hidden').first();
    const contact = await contactlink.textContent();
    const contactNumber = contact?.trim() || '';
    return contactNumber;

}

export async function Check_Account(page: Page) {

    const rightHeader = page.locator('div.ax-header-right').first();
    const accountIcon = rightHeader.locator('li.header-account-login account-links authorization-link login').first();
    await expect(accountIcon).toBeVisible();
    const accountlink = accountIcon.locator('a').first();
    const accountURL = await accountlink.getAttribute('href');
    return accountURL;
}

export async function Check_Account_Icon(page: Page) {
    const account_Icon = page.locator('li.header-account-login a.account-label span.text').first();

    await expect(account_Icon).toBeVisible();

    const account_Icon_text = await account_Icon.textContent();
    return account_Icon_text?.trim() ?? '';
}

export async function Check_mini_cart(page: Page) {
    const miniCartLink = page.locator('a.action.showcart').first();
    await miniCartLink.waitFor({ state: 'visible' });
    const miniCartLinkHref = await miniCartLink.getAttribute('href');

    const miniCartLinkText = await miniCartLink.locator('span.text').first().textContent();

    allure.attachment('Console Log', `Mini Cart Link Text: ${miniCartLinkText}`, 'text/plain');
    allure.attachment('Console Log', `Mini Cart Link Href: ${miniCartLinkHref}`, 'text/plain');

    return miniCartLinkText?.trim() ?? '';
    return miniCartLinkHref;
}   