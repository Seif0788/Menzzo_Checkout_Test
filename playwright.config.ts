import { defineConfig, devices } from '@playwright/test';

// Shared use options for checkout suites
const checkoutUseOptions = {
  headless: true,
  viewport: { width: 1280, height: 720 },
  ignoreHTTPSErrors: true,
  screenshot: 'only-on-failure' as const,
  video: 'retain-on-failure' as const,
  trace: 'retain-on-failure' as const,
};


export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.(spec|test)\.ts$/,
  timeout: 120000,

  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  fullyParallel: false,

  projects: [
    // === Checkout Suites ===
    {
      name: 'FR_Checkoutsuite',
      testDir: './tests/Checkout/Menzzo_Fr',
      workers: 1,
      retries: 3,
      use: { ...checkoutUseOptions, headless: true },
    },
    {
      name: 'Clean_FR_Cart',
      testDir: './tests/Card_Page/Menzzo_Fr',
      workers: 1,
      retries: 3,
      use: { ...checkoutUseOptions, headless: true },
    },
    {
      name: 'DE_Checkoutsuite',
      testDir: './tests/Checkout/Menzzo_De',
      workers: 1,
      retries: 3,
      use: checkoutUseOptions,
    },
    {
      name: 'IT_Checkoutsuite',
      testDir: './tests/Checkout/Menzzo_It',
      workers: 1,
      retries: 3,
      use: checkoutUseOptions,
    },
    {
      name: 'NL_Checkoutsuite',
      testDir: './tests/Checkout/Menzzo_Nl',
      workers: 1,
      retries: 3,
      use: checkoutUseOptions,
    },
    {
      name: 'AT_Checkoutsuite',
      testDir: './tests/Checkout/Menzzo_At',
      workers: 1,
      retries: 3,
      use: checkoutUseOptions,
    },
    {
      name: 'BE_Checkoutsuite',
      testDir: './tests/Checkout/Menzzo_Be',
      workers: 1,
      retries: 3,
      use: checkoutUseOptions,
    },
    {
      name: 'ES_Checkoutsuite',
      testDir: './tests/Checkout/Menzzo_Es',
      workers: 1,
      retries: 3,
      use: checkoutUseOptions,
    },
    {
      name: 'PT_Checkoutsuite',
      testDir: './tests/Checkout/Menzzo_Pt',
      workers: 1,
      retries: 3,
      use: checkoutUseOptions,
    },
    {
      name: 'Global_Checkoutsuite',
      testDir: './tests/Checkout/',
      testMatch: '**/Menzzo_*/[!.]*.spec.ts',
      workers: 2,
      retries: 3,
      use: {
        ...checkoutUseOptions,
        screenshot: 'only-on-failure',
        video: 'off',
        trace: 'on'
      },
    },
    {
      name: 'SeQura',
      testDir: './tests/Checkout/',
      testMatch: '**/*_SeQura*.spec.ts',
      workers: 3,
      retries: 3,
      use: {
        ...checkoutUseOptions,
        screenshot: 'only-on-failure',
        video: 'off',
        trace: 'on'
      },
    },
    {
      name: 'Pre_test',
      testDir: './tests/Pre_test/',
      workers: 1,
      use: {
        ...checkoutUseOptions,
        screenshot: 'only-on-failure',
        video: 'off',
        trace: 'on',
        headless: false,
      },
    },
    // === Feature Tests ===
    {
      name: 'Delivery_Methods',
      testDir: './tests/Delivery_Method',
      workers: 1,
    },
    {
      name: 'Homepage',
      testMatch: /Homepage_.*\.spec\.ts/,
      use: { ...checkoutUseOptions, headless: true },
    },
    {
      name: 'Product_Page',
      testDir: './tests/Product_Page',
      use: {
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'Product_Price',
      testDir: './tests/Price/Price_01122025',
      use: {
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'Solde_Hiver_2026',
      testDir: './tests/Price/Solde_07012026',
      workers: 3,
      use: {
        headless: true,
        screenshot: 'only-on-failure',
        video: 'off',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'Solde_Hiver_2026_Fr',
      testDir: './tests/Price/Solde_07012026/Menzzo_Fr',
      workers: 3,
      use: {
        headless: true,
        screenshot: 'only-on-failure',
        video: 'off',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'Maouro_Product_Tests',
      workers: 4,
      testDir: './tests/Product_Page',
      testMatch: '**/Maouro_*.spec.ts',
      use: {
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'Search_Tests',
      testDir: './tests',
      testMatch: /Search_.*\.spec\.ts/,
      use: checkoutUseOptions,
    },
    {
      name: 'Menu_Tests',
      testDir: './tests/Menu',
      testMatch: /Menu_.*\.spec\.ts/,
      use: checkoutUseOptions,
    },
    {
      name: 'Category_Tests',
      testDir: './tests/Category_Page',
      testMatch: /Category_.*\.spec\.ts/,
      use: {
        ...checkoutUseOptions,
        headless: false,
      },
    },
    {
      name: 'SEO_Tests',
      testDir: './tests/SEO',
      use: checkoutUseOptions,
    },
    {
      name: 'Login_Tests',
      testDir: './tests/Login',
      use: {
        headless: false,
        screenshot: 'off',
        video: 'off',
        trace: 'off',
      },
    },

    {
      name: 'Menzzo2test',
      testDir: './tests/Menzzo2test',
      use: {
        headless: true,
      },
    },

  ],
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['allure-playwright'],
  ],
});
