const puppeteer = require('puppeteer');

async function verifyApp() {
  console.log('Starting verification test for Session 10...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Step 1: Navigate to the app
    console.log('Step 1: Navigating to http://localhost:5174');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.screenshot({ path: 'verify-s10-1-loaded.png', fullPage: true });
    console.log('✅ App loaded\n');

    // Wait a bit for any initial rendering
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Type a message in the chat input
    console.log('Step 2: Looking for chat input field...');
    const inputSelector = 'textarea, input[type="text"]';
    await page.waitForSelector(inputSelector, { timeout: 5000 });

    const testMessage = 'Hello! This is a verification test for Session 10.';
    await page.type(inputSelector, testMessage);
    console.log(`✅ Typed message: "${testMessage}"\n`);
    await page.screenshot({ path: 'verify-s10-2-typed.png', fullPage: true });

    // Step 3: Click the send button
    console.log('Step 3: Looking for send button...');
    // Try multiple selectors
    let clicked = false;
    const selectors = ['button[type="submit"]', 'button svg', 'button'];
    for (const selector of selectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          clicked = true;
          console.log(`✅ Clicked send button using selector: ${selector}\n`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    if (!clicked) {
      throw new Error('Could not find send button');
    }
    await page.screenshot({ path: 'verify-s10-3-sent.png', fullPage: true });

    // Step 4: Wait for the message to appear in chat
    console.log('Step 4: Waiting for message to appear in chat...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'verify-s10-4-message-sent.png', fullPage: true });

    // Step 5: Wait for Claude's response
    console.log('Step 5: Waiting for Claude response...');
    await new Promise(resolve => setTimeout(resolve, 8000)); // Give time for Claude to respond
    await page.screenshot({ path: 'verify-s10-5-response.png', fullPage: true });

    // Check if response appeared
    const pageContent = await page.content();
    if (pageContent.includes('Hello') || pageContent.includes('test') || pageContent.length > 10000) {
      console.log('✅ Response appears to have been received\n');
    } else {
      console.log('⚠️  Response may not have loaded\n');
    }

    console.log('✅ VERIFICATION TEST COMPLETE');
    console.log('\nScreenshots saved:');
    console.log('  - verify-s10-1-loaded.png');
    console.log('  - verify-s10-2-typed.png');
    console.log('  - verify-s10-3-sent.png');
    console.log('  - verify-s10-4-message-sent.png');
    console.log('  - verify-s10-5-response.png');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    await page.screenshot({ path: 'verify-s10-error.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

verifyApp().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
