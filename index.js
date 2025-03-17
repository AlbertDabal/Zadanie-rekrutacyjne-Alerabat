import puppeteer from "puppeteer";
import { listCodeData } from "./listCodeData.js";
import fs from "fs/promises";

const saveToFile = async (filename, content) => {
  try {
    await fs.writeFile(filename, content + "\n", "utf8");
    console.log("Save to file:", filename);
  } catch (error) {
    console.error("Error saving to file:", error);
  }
};

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto("https://dev-shop-integration.alerabat.com/");

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  const validCodes = [];

  for (const code of listCodeData) {
    // Enter code in the input
    await page
      .locator("input")
      .filter((input) => input.placeholder === "Wpisz kod rabatowy")
      .fill(code);

    // Press the Apply button
    await page
      .locator("button")
      .filter((button) => button.innerText === "Zastosuj")
      .click();

    //  Check if the code is correct
    const errorSelector = "text/Nieprawidłowy kod rabatowy";
    const successSelector = "text/Zastosowano kod rabatowy";

    try {
      // Wait for the text to appear on the page
      await Promise.race([
        page.waitForSelector(errorSelector),
        page.waitForSelector(successSelector),
      ]);

      // Get the texts if the elements appear
      const errorTitle = await page
        .$eval(errorSelector, (el) => el.textContent)
        .catch(() => null);
      const successTitle = await page
        .$eval(successSelector, (el) => el.textContent)
        .catch(() => null);

      if (errorTitle) {
        console.log("Error:", errorTitle);
      } else if (successTitle) {
        console.log("Success:", successTitle);

        validCodes.push(code);
      } else {
        console.log("No text was found");
      }
    } catch (error) {
      console.log("None of the elements were found: " + error.message);
    }

    await page
      .locator("input")
      .filter((input) => input.placeholder === "Wpisz kod rabatowy")
      .fill("");
  }

  await saveToFile("valid_codes.txt", validCodes);

  // Close browser.
  await browser.close();
})();
