import { test, expect } from '@playwright/test';
import { clickElementByText, ClickRandomProduct, clickElementByTextWithPopUp, waitForCheckoutReady, clickAndWaitForNavigation, login, selectCategory } from '../../../helpers/utils';
import { performCheckout, CheckoutData } from '../../../helpers/Checkout/General_Checkout';
import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';
import { selectRandomCategory } from '../../../helpers/Category_page/Global_Checking';

//---- 1. Load categories from CSV -----
function loadCategoriesFromCSV(filePath: string): string[] {
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`CSV file not found at: ${absolutePath}`);
    }
    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    const parsed = Papa.parse(fileContent, { header: true });
    //Assuming CSV has a column named "Category"
    return parsed.data.map((row: any) => row.Category).filter(Boolean);
}

test('Clean_Login_Checkout_fr', async ({ page }) => {
    test.setTimeout(300000); // Increased timeout to 5 minutes

    //Open Menzzo.fr
    await page.goto('https://www.menzzo.fr');

    //Close cookies popup;
    await clickElementByText(page, "Accepter et continuer");

    //Login to a symple account
    await login(page, 'alt.du-co0kxq82@yopmail.com', 'Et1saHcXmCOMD1');

    //Select the card page
    await page.goto('https://www.menzzo.fr/checkout/cart/');

    //Delete the product from the cart
    await clickElementByText(page, "Supprimer l’élément");

})
