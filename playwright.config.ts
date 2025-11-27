import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.(spec|test)\.ts$/,
  timeout: 120000,
  reporter: [['list'], ['allure-playwright']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  fullyParallel: false,

  // == Projects: each runs in parallel ==
  projects: [
    {
      name: 'Checkout_API_Suites',
      testDir: './tests/Checkout/Checkout_API',
      workers: 1,
      //retries: 1,
      use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'FR Checkoutsuite',
      testDir: './tests/Checkout/Checkout_Test/Menzzo_Fr',
      workers: 1,
      retries: 3,
      use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'DE_Checkoutsuite',
      testDir: './tests/Checkout/Checkout_Test/Menzzo_De',
      workers: 1,
      retries: 3,
      use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'IT_Checkoutsuite',
      testDir: './tests/Checkout/Checkout_Test/Menzzo_It',
      workers: 1,
      retries: 3,
      use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'NL_Checkoutsuite',
      testDir: './tests/Checkout/Checkout_Test/Menzzo_Nl',
      workers: 1,
      retries: 3,
      use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'AT_Checkoutsuite',
      testDir: './tests/Checkout/Checkout_Test/Menzzo_At',
      workers: 1,
      retries: 3,
      use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'BE_Checkoutsuite',
      testDir: './tests/Checkout/Checkout_Test/Menzzo_Be',
      workers: 1,
      retries: 3,
      use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'ES_Checkoutsuite',
      testDir: './tests/Checkout/Checkout_Test/Menzzo_Es',
      workers: 1,
      retries: 3,
      use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'PT_Checkoutsuite',
      testDir: './tests/Checkout/Checkout_Test/Menzzo_Pt',
      workers: 1,
      retries: 3,
      use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'Global_Checkoutsuite',
      testDir: './tests/Checkout/Checkout_Test',
      workers: 4,
      retries: 3,
      use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'delivery_methods',
      testDir: './tests/Delivery_Method',
      workers: 1,
    },
    {
      name: 'Homepage',
      testMatch: /Homepage_.*\.spec\.ts/,
      use: {
        headless: false
      }
    },
    {
      name: 'Product_page',
      testDir: './tests/Product_Page',
      use: {
        headless: false,
      }
    },
    {
      name: 'Search_Tests',
      testDir: './tests',
      testMatch: /Search_.*\.spec\.ts/,
      use: {
        headless: false,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      }
    },
    {
      name: 'examples',
      testDir: './tests-examples',
    },
    {
      name: "Menzzo_Checkout_Fr",
      testDir: './tests/Checkout/Checkout_Test',
      use: {
        headless: false,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure'
      }
    },
    {
      name: 'FR_Checkout2',
      testDir: './tests/Checkout/Checkout_Test/Menzzo_Fr',
      workers: 1,
      retries: 1,
      use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ],
        },
      },
    },
  ],
});
