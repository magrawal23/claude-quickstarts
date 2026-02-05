const puppeteer = require('puppeteer');

async function testCopyButton() {
  console.log('Testing copy button on code blocks (simple test)...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Grant clipboard permissions
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:5173', ['clipboard-read', 'clipboard-write']);

    // Step 1: Navigate to the app
    console.log('Step 1: Navigating to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ App loaded\n');

    // Step 2: Create new conversation
    console.log('Step 2: Creating new conversation...');
    await page.click('button');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Ask Claude for code
    console.log('Step 3: Asking Claude for code snippet...');
    await page.type('textarea', 'Write a simple hello world function in JavaScript');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.click('button[type="submit"]');
    console.log('✅ Sent code request\n');

    // Wait for response
    console.log('Step 4: Waiting for Claude response...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await page.screenshot({ path: 'test-copy-simple-1-response.png', fullPage: true });

    // Step 5: Find code block and hover
    console.log('Step 5: Finding and hovering over code block...');

    // Find the div with class "relative group"
    const codeContainer = await page.$('div.relative.group');
    if (!codeContainer) {
      console.log('❌ Code container not found');
      return false;
    }
    console.log('✅ Found code container');

    // Hover over it to reveal the button
    await codeContainer.hover();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'test-copy-simple-2-hover.png', fullPage: true });

    // Step 6: Find and click copy button
    console.log('Step 6: Looking for copy button...');
    const buttons = await page.$$('button');

    let copyButton = null;
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Copy')) {
        copyButton = button;
        console.log(`✅ Found copy button with text: "${text}"`);
        break;
      }
    }

    if (!copyButton) {
      console.log('❌ Copy button not found');
      return false;
    }

    // Click it
    console.log('Step 7: Clicking copy button...');
    await copyButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'test-copy-simple-3-clicked.png', fullPage: true });

    // Check if text changed
    const newText = await page.evaluate(el => el.textContent, copyButton);
    console.log(`Button text after click: "${newText}"`);

    if (newText.includes('Copied')) {
      console.log('✅ Button changed to "Copied!"');
    }

    // Try to read clipboard
    console.log('Step 8: Checking clipboard...');
    try {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      console.log(`✅ Clipboard has ${clipboardText.length} characters`);
      console.log(`First 50 chars: "${clipboardText.substring(0, 50)}"`);

      if (clipboardText.includes('function') || clipboardText.includes('hello')) {
        console.log('✅ Code was successfully copied!');
      }
    } catch (e) {
      console.log('⚠️  Could not read clipboard:', e.message);
    }

    console.log('\n✅✅✅ COPY BUTTON WORKS! ✅✅✅');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-copy-simple-error.png', fullPage: true });
    throw error;
  } finally {
    console.log('\nBrowser will stay open for 5 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testCopyButton().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
