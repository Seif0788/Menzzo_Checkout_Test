import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.(spec|test)\.ts$/,
  timeout: 120000,
  reporter: [['list'], ['allure-playwright']],
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
      testDir: './tests/Checkout/Checkout_FR',
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
      name: 'DE Checkoutsuite',
      testDir: './tests/Checkout/Checkout_DE',
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
      name: 'IT Checkoutsuite',
      testDir: './tests/Checkout/Checkout_IT',
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
    { name: 'api', testDir: './tests/Checkout/Checkout_API'},
    { name: 'ui', testDir: './tests/Checkout/Checkout_fr' },
  ],
});
