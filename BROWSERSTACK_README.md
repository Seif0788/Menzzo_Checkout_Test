# BrowserStack Integration Guide

This project is integrated with BrowserStack for cross-browser and mobile device testing.

## Prerequisites

1. **BrowserStack Account**: You need a BrowserStack account with Automate access
2. **Credentials**: Your `userName` and `accessKey` are configured in `browserstack.yml`

## Configuration

The `browserstack.yml` file contains all BrowserStack settings:

- **Project Name**: Menzzo Playwright Tests
- **Mobile Devices**: iPhone 16, iPhone 15 Pro, Samsung Galaxy S22 Ultra, Samsung Galaxy S24
- **Desktop Browsers**: Chrome (Windows 11), Safari (macOS Sonoma)
- **Parallel Tests**: 2 tests per platform

## How to Run Tests on BrowserStack

### 1. Run ALL tests on BrowserStack mobile devices

```bash
npm run browserstack
```

This will run your entire test suite across all configured platforms (mobile + desktop).

### 2. Run tests for a specific mobile project

```bash
npm run browserstack:mobile
```

This runs tests only for the `Mobile_iPhone_13` project configuration.

### 3. Run SEO tests on BrowserStack

```bash
npm run browserstack:seo
```

This runs only the SEO tests in the `tests/SEO` directory.

### 4. Run specific test files

```bash
npx browserstack-node-sdk playwright test tests/Checkout/Checkout_Test/Menzzo_Fr/Fr_Stripe.spec.ts
```

### 5. Run tests with specific grep pattern

```bash
npx browserstack-node-sdk playwright test --grep "checkout"
```

## Viewing Test Results

After tests complete, you can view results in two places:

1. **BrowserStack Dashboard**: Visit [https://automate.browserstack.com](https://automate.browserstack.com)
   - View test videos, screenshots, logs
   - See pass/fail status
   - Debug failed tests

2. **Local Terminal**: Test results are also displayed in your terminal

## Available Mobile Devices

The following mobile devices are configured in `browserstack.yml`:

| Device | OS Version | Browser |
|--------|------------|---------|
| iPhone 16 | iOS 18.6 | Safari |
| iPhone 15 Pro | iOS 18 | Safari |
| Samsung Galaxy S22 Ultra | Android 12.0 | Chrome |
| Samsung Galaxy S24 | Android 14.0 | Chrome |

## Customizing Device Configuration

To add more devices or change configurations, edit `browserstack.yml`:

```yaml
platforms:
  - browserName: safari
    osVersion: 18.6
    deviceName: iPhone 16
  
  - browserName: chrome
    osVersion: 12.0
    deviceName: Samsung Galaxy S22 Ultra
```

[View available devices](https://www.browserstack.com/list-of-browsers-and-platforms/automate)

## Environment Variables (Alternative to hardcoded credentials)

Instead of hardcoding credentials in `browserstack.yml`, you can use environment variables:

```bash
# Windows PowerShell
$env:BROWSERSTACK_USERNAME="your_username"
$env:BROWSERSTACK_ACCESS_KEY="your_access_key"
npm run browserstack

# Windows CMD
set BROWSERSTACK_USERNAME=your_username
set BROWSERSTACK_ACCESS_KEY=your_access_key
npm run browserstack
```

Then remove the `userName` and `accessKey` lines from `browserstack.yml`.

## Debugging Features

The configuration includes:

- **debug: true** - Captures screenshots for every Selenium command
- **networkLogs: true** - Captures HAR logs for network debugging
- **consoleLogs: errors** - Captures browser console errors

## Best Practices

1. **Start Small**: Test on 1-2 devices first before running on all platforms
2. **Use Parallel Tests**: Set `parallelsPerPlatform` to speed up execution
3. **Monitor Usage**: Check your BrowserStack plan limits
4. **Review Failed Tests**: Use BrowserStack dashboard to debug failures with video/logs

## Troubleshooting

### Issue: "BrowserStack credentials not found"
**Solution**: Verify `userName` and `accessKey` in `browserstack.yml` or set environment variables

### Issue: "Test timeout on mobile devices"
**Solution**: Increase timeout in your test files or `playwright.config.ts` as mobile can be slower

### Issue: "Cannot connect to BrowserStack"
**Solution**: Check your internet connection and firewall settings

## Support

- **BrowserStack Docs**: https://www.browserstack.com/docs/automate/playwright
- **Playwright Docs**: https://playwright.dev/
