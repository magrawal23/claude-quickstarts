const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting verification test...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'verify-s11-1-loaded.png', fullPage: true });
    console.log('✅ App loaded successfully');

    // Test basic message sending
    console.log('Testing message send...');
    await page.waitForSelector('textarea', { timeout: 5000 });
    await page.type('textarea', 'Hello, test message');
    await page.screenshot({ path: 'verify-s11-2-typed.png' });

    await page.click('button[type="submit"]');
    await page.screenshot({ path: 'verify-s11-3-sent.png' });

    console.log('Waiting for response...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'verify-s11-4-response.png', fullPage: true });

    console.log('✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (page) {
      await page.screenshot({ path: 'verify-s11-error.png', fullPage: true });
    }
  } finally {
    await browser.close();
  }
})();
