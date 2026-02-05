import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Capture errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    console.log('Page loaded successfully!');

    // Take screenshot
    await page.screenshot({
      path: 'frontend-verification.png',
      fullPage: true
    });
    console.log('Screenshot saved to frontend-verification.png');

    // Check for key UI elements
    const uiElements = await page.evaluate(() => {
      const results = {};

      // Look for common UI elements
      results.hasSidebar = !!document.querySelector('[class*="sidebar"], aside, nav');
      results.hasChatArea = !!document.querySelector('[class*="chat"], [class*="message"], main');
      results.hasInputField = !!document.querySelector('input[type="text"], textarea');
      results.hasButton = !!document.querySelector('button');

      // Get page title
      results.pageTitle = document.title;

      // Check for any text content
      results.hasContent = document.body.innerText.length > 0;

      return results;
    });

    console.log('\nUI Elements Found:');
    console.log(JSON.stringify(uiElements, null, 2));

    // Log console messages
    if (consoleMessages.length > 0) {
      console.log('\nConsole Messages:');
      consoleMessages.forEach(msg => {
        console.log(`  [${msg.type}] ${msg.text}`);
      });
    } else {
      console.log('\nNo console messages captured.');
    }

    // Log errors
    if (pageErrors.length > 0) {
      console.log('\nPage Errors:');
      pageErrors.forEach(err => {
        console.log(`  ERROR: ${err}`);
      });
    } else {
      console.log('\nNo page errors detected.');
    }

  } catch (error) {
    console.error('Error during verification:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
