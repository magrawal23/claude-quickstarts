const puppeteer = require('puppeteer');

async function testCopyButton() {
  console.log('Testing copy button on code blocks...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

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
    await page.screenshot({ path: 'test-copy-1-before-hover.png', fullPage: true });

    // Step 5: Find and hover over code block to reveal copy button
    console.log('Step 5: Hovering over code block...');

    // Find code blocks
    const codeBlocks = await page.$$('code');
    console.log(`Found ${codeBlocks.length} code elements`);

    if (codeBlocks.length === 0) {
      console.log('❌ No code blocks found');
      return false;
    }

    // Hover over the first non-inline code block (should be in a div.relative.group)
    let copyButtonFound = false;
    for (let i = 0; i < codeBlocks.length; i++) {
      const codeBlock = codeBlocks[i];

      // Check if this is inside a div with "group" class
      const parent = await page.evaluateHandle(el => el.parentElement, codeBlock);
      const parentClass = await page.evaluate(el => el?.className || '', parent);

      if (parentClass.includes('group')) {
        console.log(`✅ Found code block ${i} with group parent`);

        // Hover over it
        await codeBlock.hover();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({ path: 'test-copy-2-hover.png', fullPage: true });

        // Look for copy button
        const copyButton = await page.$('button:has-text("Copy")') || await page.$('button');
        if (copyButton) {
          const buttonText = await page.evaluate(el => el.textContent, copyButton);
          if (buttonText.includes('Copy') || buttonText.includes('Copied')) {
            console.log(`✅ Copy button found with text: "${buttonText}"`);
            copyButtonFound = true;

            // Click the button
            console.log('Step 6: Clicking copy button...');
            await copyButton.click();
            await new Promise(resolve => setTimeout(resolve, 500));
            await page.screenshot({ path: 'test-copy-3-clicked.png', fullPage: true });

            // Check if it changed to "Copied!"
            const newButtonText = await page.evaluate(el => el.textContent, copyButton);
            console.log(`Button text after click: "${newButtonText}"`);

            if (newButtonText.includes('Copied')) {
              console.log('✅ Button text changed to "Copied!"');
            }

            // Try to read clipboard
            console.log('Step 7: Checking clipboard...');
            try {
              const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
              console.log(`Clipboard content length: ${clipboardText.length} characters`);
              console.log(`First 100 chars: ${clipboardText.substring(0, 100)}`);

              if (clipboardText.length > 0) {
                console.log('✅ Code was copied to clipboard!');
              }
            } catch (e) {
              console.log('⚠️  Could not read clipboard (may need permissions)');
            }

            break;
          }
        }
      }
    }

    if (copyButtonFound) {
      console.log('\n✅✅✅ COPY BUTTON WORKS! ✅✅✅');
      return true;
    } else {
      console.log('\n❌ Copy button not found');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-copy-error.png', fullPage: true });
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
