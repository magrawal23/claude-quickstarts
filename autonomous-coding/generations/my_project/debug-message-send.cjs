const puppeteer = require('puppeteer');

async function debugMessageSend() {
  console.log('Starting debug test for message sending...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Capture console logs and errors
    const consoleLogs = [];
    const consoleErrors = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log('BROWSER LOG:', text);
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.toString());
      console.error('BROWSER ERROR:', error.toString());
    });

    page.on('requestfailed', request => {
      console.error('REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    // Step 1: Navigate to the app
    console.log('Step 1: Navigating to http://localhost:5174');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.screenshot({ path: 'debug-1-loaded.png', fullPage: true });
    console.log('✅ App loaded\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Type a message
    console.log('Step 2: Looking for chat input and typing message...');
    const inputSelector = 'textarea';
    await page.waitForSelector(inputSelector, { timeout: 5000 });

    const testMessage = 'Test message for debugging';
    await page.type(inputSelector, testMessage);
    console.log(`✅ Typed message: "${testMessage}"\n`);
    await page.screenshot({ path: 'debug-2-typed.png', fullPage: true });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 3: Click the send button and monitor network
    console.log('Step 3: Clicking send button and monitoring network...');

    // Monitor network requests
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });

    page.on('response', async response => {
      const url = response.url();
      const status = response.status();
      console.log(`RESPONSE: ${status} ${url}`);

      if (url.includes('/api/')) {
        try {
          const text = await response.text();
          console.log(`  Body: ${text.substring(0, 200)}`);
        } catch (e) {
          // Stream or already consumed
        }
      }
    });

    const sendButton = await page.$('button[type="submit"]');
    if (sendButton) {
      await sendButton.click();
      console.log('✅ Clicked send button\n');
    } else {
      console.log('❌ Could not find send button\n');
    }

    await page.screenshot({ path: 'debug-3-sent.png', fullPage: true });

    // Wait and observe
    console.log('Step 4: Waiting to observe behavior...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.screenshot({ path: 'debug-4-after-wait.png', fullPage: true });

    // Check page content
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== PAGE TEXT (first 500 chars) ===');
    console.log(bodyText.substring(0, 500));
    console.log('\n=== END PAGE TEXT ===\n');

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Console Logs: ${consoleLogs.length}`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Network Requests: ${networkRequests.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n=== ERRORS ===');
      consoleErrors.forEach(err => console.log(err));
    }

    console.log('\n✅ DEBUG TEST COMPLETE');

  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
    throw error;
  } finally {
    // Keep browser open for inspection
    console.log('\nBrowser will stay open for 10 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

debugMessageSend().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
