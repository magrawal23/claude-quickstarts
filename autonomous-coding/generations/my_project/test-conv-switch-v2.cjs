const puppeteer = require('puppeteer');

async function testConversationSwitching() {
  console.log('Testing conversation switching functionality (v2)...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Step 1: Navigate to the app
    console.log('Step 1: Navigating to app...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'test-sw2-1-loaded.png', fullPage: true });
    console.log('✅ App loaded\n');

    // Step 2: Create first conversation (Conversation A)
    console.log('Step 2: Creating Conversation A...');
    await page.click('button'); // Click New Chat (first button)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send message in Conversation A
    console.log('Step 3: Sending message in Conversation A...');
    await page.type('textarea', 'This is conversation A about quantum physics');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.click('button[type="submit"]');
    console.log('✅ Sent message in Conversation A');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 8000));
    await page.screenshot({ path: 'test-sw2-2-conv-a.png', fullPage: true });
    console.log('✅ Conversation A complete\n');

    // Step 4: Create second conversation (Conversation B)
    console.log('Step 4: Creating Conversation B...');
    await page.click('button'); // Click New Chat again
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send message in Conversation B
    console.log('Step 5: Sending message in Conversation B...');
    await page.type('textarea', 'This is conversation B about Italian cooking');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.click('button[type="submit"]');
    console.log('✅ Sent message in Conversation B');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 8000));
    await page.screenshot({ path: 'test-sw2-3-conv-b.png', fullPage: true });
    console.log('✅ Conversation B complete\n');

    // Step 6: Find and click on Conversation A in the sidebar
    console.log('Step 6: Switching to Conversation A...');

    // Get all conversation items in sidebar using XPath or text search
    const conversationButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map((btn, index) => ({
        index,
        text: btn.innerText,
        classes: btn.className
      }));
    });

    console.log('Found buttons:', JSON.stringify(conversationButtons.slice(0, 15), null, 2));

    // Find the button that contains text from Conversation A
    // Look for a button in the sidebar that might contain our conversation
    const convASelector = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      // Find sidebar buttons (they have specific styling)
      const sidebarButtons = buttons.filter(btn =>
        btn.className.includes('hover:bg-gray-200') ||
        btn.className.includes('dark:hover:bg-gray-700')
      );
      // Return the second one (should be Conversation A, as B is first/newest)
      return sidebarButtons[1];
    });

    if (convASelector) {
      await convASelector.click();
      console.log('✅ Clicked on Conversation A');
    } else {
      console.log('❌ Could not find Conversation A button');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'test-sw2-4-back-to-a.png', fullPage: true });

    // Check content
    const content1 = await page.evaluate(() => document.body.innerText);
    const hasQuantum = content1.includes('quantum') || content1.includes('physics');
    console.log(`  Contains quantum/physics: ${hasQuantum}`);

    if (hasQuantum) {
      console.log('✅ Conversation A loaded successfully\n');
    } else {
      console.log('❌ Conversation A may not have loaded\n');
    }

    // Step 7: Switch to Conversation B
    console.log('Step 7: Switching to Conversation B...');
    const convBSelector = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const sidebarButtons = buttons.filter(btn =>
        btn.className.includes('hover:bg-gray-200') ||
        btn.className.includes('dark:hover:bg-gray-700')
      );
      // Return the first one (should be Conversation B, the newest)
      return sidebarButtons[0];
    });

    if (convBSelector) {
      await convBSelector.click();
      console.log('✅ Clicked on Conversation B');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'test-sw2-5-back-to-b.png', fullPage: true });

    const content2 = await page.evaluate(() => document.body.innerText);
    const hasCooking = content2.includes('cooking') || content2.includes('Italian');
    console.log(`  Contains cooking/Italian: ${hasCooking}`);

    if (hasCooking) {
      console.log('✅ Conversation B loaded successfully\n');
    } else {
      console.log('❌ Conversation B may not have loaded\n');
    }

    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    if (hasQuantum && hasCooking) {
      console.log('✅✅✅ CONVERSATION SWITCHING WORKS PERFECTLY! ✅✅✅');
    } else {
      console.log('❌ Conversation switching may have issues');
    }

    console.log('\nScreenshots saved:');
    console.log('  - test-sw2-1-loaded.png');
    console.log('  - test-sw2-2-conv-a.png');
    console.log('  - test-sw2-3-conv-b.png');
    console.log('  - test-sw2-4-back-to-a.png');
    console.log('  - test-sw2-5-back-to-b.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'test-sw2-error.png', fullPage: true });
    throw error;
  } finally {
    console.log('\nBrowser will stay open for 5 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testConversationSwitching().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
