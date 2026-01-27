import { test, Page, expect } from '@playwright/test';
import { attachment } from 'allure-js-commons';
import { clickElementByText } from '../../../../helpers/utils';
import { Check_Account_Icon } from '../../../../helpers/Home_page/Header';
import { Check_Facebook_Login } from '../../../../helpers/Social_Login_Helper/Facebook_Login';

test('Facebook_Social_Login', async ({ page }) => {
    //---Open menzzo.fr
    await page.goto('https://www.menzzo.fr')
    attachment('Open Website', "menzzo.fr opened successfully", 'text/plain')

    //---Close Cookies popup
    await clickElementByText(page, 'Accepter et continuer')
    attachment('Cookies popup was closed', "Cookies popup closed successfully", 'text/plain')

    //---Click on the account icon
    const account_icon = await Check_Account_Icon(page)
    if (account_icon !== 'Me connecter') {
        attachment('Account Icon', `❌ Account Icon mismatch. Expected: Me connecter, Found: ${account_icon}`, 'text/plain')
        throw new Error(`❌ Account Icon mismatch. Expected: Me connecter`)
    } else {
        attachment('Account Icon', `✅ Account Icon matches the expected Icon: Me connecter`, 'text/plain')
    }
    const account_Icon = page.locator('li.header-account-login a.account-label span.text').first();
    await account_Icon.click()
    attachment('Account icon was clicked', "Account icon clicked successfully", 'text/plain')

    //---Click on the Facebook login button
    await Check_Facebook_Login(page)
    attachment('Facebook login button was clicked', "Facebook login button clicked successfully", 'text/plain')
})