const puppeteer = require('puppeteer');

async function testConversationSwitching() {
  console.log('Testing conversation switching functionality...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Step 1: Navigate to the app
    console.log('Step 1: Navigating to app...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'test-switch-1-loaded.png', fullPage: true });
    console.log('✅ App loaded\n');

    // Step 2: Create first conversation (Conversation A)
    console.log('Step 2: Creating Conversation A...');
    const newChatButton = await page.$('button');
    if (newChatButton) {
      await newChatButton.click();
      console.log('✅ Clicked New Chat button');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send message in Conversation A
    console.log('Step 3: Sending message in Conversation A...');
    const textarea = await page.$('textarea');
    const messageA = 'This is conversation A about quantum physics';
    await textarea.type(messageA);
    await new Promise(resolve => setTimeout(resolve, 500));

    const sendButton = await page.$('button[type="submit"]');
    await sendButton.click();
    console.log(`✅ Sent message: "${messageA}"`);

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 8000));
    await page.screenshot({ path: 'test-switch-2-conv-a.png', fullPage: true });
    console.log('✅ Conversation A complete\n');

    // Step 4: Create second conversation (Conversation B)
    console.log('Step 4: Creating Conversation B...');
    const newChatButton2 = await page.$('button');
    if (newChatButton2) {
      await newChatButton2.click();
      console.log('✅ Clicked New Chat button for Conversation B');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send message in Conversation B
    console.log('Step 5: Sending message in Conversation B...');
    const textarea2 = await page.$('textarea');
    const messageB = 'This is conversation B about cooking recipes';
    await textarea2.type(messageB);
    await new Promise(resolve => setTimeout(resolve, 500));

    const sendButton2 = await page.$('button[type="submit"]');
    await sendButton2.click();
    console.log(`✅ Sent message: "${messageB}"`);

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 8000));
    await page.screenshot({ path: 'test-switch-3-conv-b.png', fullPage: true });
    console.log('✅ Conversation B complete\n');

    // Step 6: Switch back to Conversation A
    console.log('Step 6: Switching back to Conversation A...');

    // Find and click the first conversation in the sidebar (should be Conversation A)
    // We need to find the conversation by looking for the text "quantum"
    const pageContent = await page.content();
    console.log('Looking for conversations in sidebar...');

    // Click on a conversation that contains "quantum" or is older
    const conversations = await page.$$('.cursor-pointer'); // Assuming conversations are clickable
    if (conversations.length >= 2) {
      // Click the second one (index 1) which should be Conversation A (older one)
      await conversations[1].click();
      console.log('✅ Clicked on Conversation A in sidebar');
    } else {
      console.log('⚠️  Could not find enough conversations in sidebar');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'test-switch-4-back-to-a.png', fullPage: true });

    // Verify Conversation A content is loaded
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('quantum')) {
      console.log('✅ Conversation A loaded successfully (contains "quantum")\n');
    } else {
      console.log('❌ Conversation A may not have loaded (no "quantum" text found)\n');
    }

    // Step 7: Switch to Conversation B
    console.log('Step 7: Switching to Conversation B...');
    const conversations2 = await page.$$('.cursor-pointer');
    if (conversations2.length >= 1) {
      // Click the first one (index 0) which should be Conversation B (newest)
      await conversations2[0].click();
      console.log('✅ Clicked on Conversation B in sidebar');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'test-switch-5-back-to-b.png', fullPage: true });

    // Verify Conversation B content is loaded
    const bodyText2 = await page.evaluate(() => document.body.innerText);
    if (bodyText2.includes('cooking') || bodyText2.includes('recipes')) {
      console.log('✅ Conversation B loaded successfully (contains "cooking" or "recipes")\n');
    } else {
      console.log('❌ Conversation B may not have loaded (no cooking/recipes text found)\n');
    }

    console.log('\n✅ CONVERSATION SWITCHING TEST COMPLETE');
    console.log('\nScreenshots saved:');
    console.log('  - test-switch-1-loaded.png');
    console.log('  - test-switch-2-conv-a.png');
    console.log('  - test-switch-3-conv-b.png');
    console.log('  - test-switch-4-back-to-a.png');
    console.log('  - test-switch-5-back-to-b.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-switch-error.png', fullPage: true });
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
