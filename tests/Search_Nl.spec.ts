import { test } from "@playwright/test";
import { clickElementByText, search_nl } from "../helpers/utils";

test("Search_Nl", async ({ page }) => {
    await page.goto("https://www.menzzo.nl");
    await clickElementByText(page, "Accepteer alles");
    await search_nl(page, "Roger");
});
