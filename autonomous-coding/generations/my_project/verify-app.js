// Verification test for Claude.ai Clone frontend
import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting browser automation test...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  try {
    console.log('✓ Browser launched');
    console.log('✓ Navigating to http://localhost:5173...\n');

    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    console.log('✓ Page loaded successfully!\n');

    // Take screenshot
    await page.screenshot({ path: 'verification-screenshot.png', fullPage: true });
    console.log('✓ Screenshot saved: verification-screenshot.png\n');

    // Check page structure
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText.substring(0, 200),
        hasSidebar: !!document.querySelector('.sidebar, aside, nav, [class*="sidebar"]'),
        hasChatArea: !!document.querySelector('.chat, main, [class*="chat"]'),
        hasInput: !!document.querySelector('input, textarea'),
        hasButtons: document.querySelectorAll('button').length,
        bodyClasses: document.body.className,
        rootId: document.getElementById('root') ? 'exists' : 'missing'
      };
    });

    console.log('=== PAGE INFORMATION ===');
    console.log('Title:', pageInfo.title);
    console.log('Root element:', pageInfo.rootId);
    console.log('Body classes:', pageInfo.bodyClasses || 'none');
    console.log('Has sidebar:', pageInfo.hasSidebar);
    console.log('Has chat area:', pageInfo.hasChatArea);
    console.log('Has input field:', pageInfo.hasInput);
    console.log('Number of buttons:', pageInfo.hasButtons);
    console.log('\nBody text preview:');
    console.log(pageInfo.bodyText);
    console.log('\n=== CONSOLE MESSAGES ===');
    if (consoleMessages.length > 0) {
      consoleMessages.forEach(msg => console.log(msg));
    } else {
      console.log('(no console messages)');
    }

    console.log('\n=== ERRORS ===');
    if (errors.length > 0) {
      console.log('❌ ERRORS DETECTED:');
      errors.forEach(err => console.log('  -', err));
      process.exit(1);
    } else {
      console.log('✓ No errors detected');
    }

    console.log('\n=== VERIFICATION RESULT ===');
    if (pageInfo.rootId === 'exists') {
      console.log('✓ Frontend is loading correctly!');
    } else {
      console.log('❌ Root element missing - React may not be mounting');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
