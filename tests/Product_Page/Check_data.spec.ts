import { test } from '@playwright/test';
import { clickElementByText, search, ClickRandomProduct, CheckTimeBox, Button_Previous, Button_Next } from '../../helpers/utils';
import { verifyH1MatchesTitle, breadcrumb, CheckProductAvailability, CheckStockAndShipping, DeliveryPricePopup, FreereturnDisplay, FreereturnPopUp, review_report, Description, InfoTable, upsell, ClientViews, Photo_product, CountPhoto } from '../../helpers/Product_page_helpers/Elementer_Page';

test('Check_product_page', async ({ page }) => {

    await page.goto('https://www.menzzo.fr');

    await clickElementByText(page, "Accepter et continuer");
    console.log('✅ Cookies accepted.');

    await search(page, "Chaise")

    await ClickRandomProduct(page);
    console.log('✅ Random product selected.');

    //Check that the title contains "product_name"
    await verifyH1MatchesTitle(page);

    // Check that the breadcrumb it's correct
    await breadcrumb(page);

    // Check the time box
    await CheckTimeBox(page);

    // Check the tag
    await CheckProductAvailability(page);

    // Check the date from and to for In stock products
    await CheckStockAndShipping(page);

    // Check the delivery popup
    await DeliveryPricePopup(page);

    // Check the Free return dispaly
    await FreereturnDisplay(page);

    // Check the Free return popup
    await FreereturnPopUp(page);

    // Check the review
    await review_report(page);

    // Check the discription
    await Description(page);

    // Check the Info table
    await InfoTable(page);

    // Check the upsell
    await upsell(page);

    // Check the client reviews
    await ClientViews(page);

    // Count real number of pictures
const totalPhotos = await CountPhoto(page);

// Loop through each photo
for (let i = 0; i < totalPhotos; i++) {

    console.log(`🖼 Checking photo ${i + 1} / ${totalPhotos}`);

    // Check the big photo
    await Photo_product(page);

    // If not last photo → click Next
    if (i < totalPhotos - 1) {
        await Button_Next(page);
    }
}

// OPTIONAL: Go back to first image
for (let i = 0; i < totalPhotos - 1; i++) {
    await Button_Previous(page);

    // Check the big photo
    await Photo_product(page);
}
});