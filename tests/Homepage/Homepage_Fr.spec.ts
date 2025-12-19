import { test, expect } from '@playwright/test';
import { allure } from "allure-playwright";
import { Check_logo, Check_Search_Bar, Check_wishlist, Check_blog, Check_Showroom, Check_Contact, Check_Account_Icon, Check_mini_cart } from '../../helpers/Home_page/Header';
import { clickElementByText } from '../../helpers/utils';

test('Menzzo.fr homepage', async ({ page }) => {

    // Expected data
    const Expected_URL = 'https://www.menzzo.fr/';
    const Expected_Search_Placeholder = 'Que cherchez-vous ?';
    const Expected_Wishlist_URL = 'https://www.menzzo.fr/wish-list/';
    const Expected_Blog_URL = 'https://www.menzzo.fr/blog.html';
    const Expected_Showroom_URL = 'https://www.menzzo.fr/showroom/';
    const Expected_Contact_Number = '01 43 75 11 18';
    const Expected_Account_Icon = 'Me connecter';
    const Expected_miniCart = 'Mon panier';
    const Expected_miniCart_URL = 'https://www.menzzo.fr/checkout/cart/';

    // Navigate to homepage
    await page.goto('https://www.menzzo.fr/');
    await clickElementByText(page, "Accepter et continuer");

    // Check the main logo
    const logoURL = await Check_logo(page);
    if (logoURL !== Expected_URL) {
        allure.attachment('Logo URL', `❌ Logo URL mismatch. Expected: ${Expected_URL}, Found: ${logoURL}`, 'text/plain');
        throw new Error(`❌ Logo URL mismatch. Expected: ${Expected_URL}`);
    } else {
        allure.attachment('Logo URL', `✅ Logo URL matches the expected URL: ${Expected_URL}`, 'text/plain');
    }

    // Check the search bar
    const searchPlaceholder = await Check_Search_Bar(page);
    if (searchPlaceholder !== Expected_Search_Placeholder) {
        allure.attachment('Search Bar', `❌ Placeholder mismatch. Expected: ${Expected_Search_Placeholder}, Found: ${searchPlaceholder}`, 'text/plain');
        throw new Error(`❌ Search bar placeholder mismatch. Expected: ${Expected_Search_Placeholder}`);
    } else {
        allure.attachment('Search Bar', `✅ Placeholder matches the expected text: ${Expected_Search_Placeholder}`, 'text/plain');
    }

    // Check wishlist
    const wishlistURL = await Check_wishlist(page);
    if (wishlistURL !== Expected_Wishlist_URL) {
        allure.attachment('Wishlist URL', `❌ Wishlist URL mismatch. Expected: ${Expected_Wishlist_URL}, Found: ${wishlistURL}`, 'text/plain');
        throw new Error(`❌ Wishlist URL mismatch. Expected: ${Expected_Wishlist_URL}`);
    } else {
        allure.attachment('Wishlist URL', `✅ Wishlist URL matches the expected URL: ${Expected_Wishlist_URL}`, 'text/plain');
    }

    // Check blog link
    const blogURL = await Check_blog(page);
    if (blogURL !== Expected_Blog_URL) {
        allure.attachment('Blog URL', `❌ Blog URL mismatch. Expected: ${Expected_Blog_URL}, Found: ${blogURL}`, 'text/plain');
        throw new Error(`❌ Blog URL mismatch. Expected: ${Expected_Blog_URL}`);
    } else {
        allure.attachment('Blog URL', `✅ Blog URL matches the expected URL: ${Expected_Blog_URL}`, 'text/plain');
    }

    // Check showroom link
    const showroomURL = await Check_Showroom(page);
    if (showroomURL !== Expected_Showroom_URL) {
        allure.attachment('Showroom URL', `❌ Showroom URL mismatch. Expected: ${Expected_Showroom_URL}, Found: ${showroomURL}`, 'text/plain');
        throw new Error(`❌ Showroom URL mismatch. Expected: ${Expected_Showroom_URL}`);
    } else {
        allure.attachment('Showroom URL', `✅ Showroom URL matches the expected URL: ${Expected_Showroom_URL}`, 'text/plain');
    }

    // Check contact number
    const contactNumber = await Check_Contact(page);
    if (contactNumber !== Expected_Contact_Number) {
        allure.attachment('Contact Number', `❌ Contact number mismatch. Expected: ${Expected_Contact_Number}, Found: ${contactNumber}`, 'text/plain');
        throw new Error(`❌ Contact number mismatch. Expected: ${Expected_Contact_Number}`);
    } else {
        allure.attachment('Contact Number', `✅ Contact number matches the expected number: ${Expected_Contact_Number}`, 'text/plain');
    }

    // Check Account Icon
    const account = await Check_Account_Icon(page);
    if (account !== Expected_Account_Icon) {
        allure.attachment('Account Icon', `❌ Account Icon mismatch. Expected: ${Expected_Account_Icon}, Found: ${account}`, 'text/plain');
        throw new Error(`❌ Account Icon mismatch. Expected: ${Expected_Account_Icon}`);
    } else {
        allure.attachment('Account Icon', `✅ Account Icon matches the expected Icon: ${Expected_Account_Icon}`, 'text/plain');
    }

    // Check mini cart
    const miniCart = await Check_mini_cart(page);
    if (miniCart !== Expected_miniCart) {
        allure.attachment('Mini Cart', `❌ Mini Cart mismatch. Expected: ${Expected_miniCart}, Found: ${miniCart}`, 'text/plain');
        throw new Error(`❌ Mini Cart mismatch. Expected: ${Expected_miniCart}`);
    } else {
        allure.attachment('Mini Cart', `✅ Mini Cart matches the expected Cart: ${Expected_miniCart}`, 'text/plain');
    }

});
