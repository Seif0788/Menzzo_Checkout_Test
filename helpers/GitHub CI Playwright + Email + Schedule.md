You are an expert in DevOps, CI/CD automation, and Playwright test orchestration.

I need you to generate a complete and production-ready GitHub Actions workflow YAML file for Playwright.

CONTEXT:
- My project contains multiple Playwright test suites.
- It runs using the command: `npx playwright test`
- I also use Allure reports (`allure-playwright`)
- I want this workflow to run automatically every 2 hours.
- After each run, I want an email notification with the following:
    • Execution status (success / failure)
    • Number of tests passed / failed
    • Link to download the Allure report artifact
- The email can be sent via the GitHub Action “dawidd6/action-send-mail”.
- The SMTP configuration must be variables/secrets:
      SMTP_SERVER = smtp.gmail.com
      SMTP_PORT = 465
      MAIL_USERNAME = ${{ secrets.MAIL_USERNAME }}
      MAIL_PASSWORD = ${{ secrets.MAIL_PASSWORD }}
      MAIL_TO = myEmail@example.com

REQUIREMENTS:
1. Create a `.github/workflows/playwright-cron.yml` file.
2. Trigger:
     - schedule: every 2 hours (cron)
     - manual dispatch
3. Steps must include:
     - Checkout repo
     - Install Node
     - Install dependencies
     - Install Playwright with dependencies
     - Run tests
     - Generate Allure report
     - Upload Allure results as artifact
     - Send email with summary and link to artifact
4. Email body should include:
     - “Playwright Scheduled Run Finished”
     - date + time
     - Test statistics parsed from Playwright JSON output
     - Status emoji: “🟢 Success” or “🔴 Failure”

5. Produce the full runnable YAML with no placeholders except secrets.
6. Do not simplify anything: write the full real YAML.
7. Ensure the solution is ready to paste into GitHub.

Generate only the final YAML workflow file.
