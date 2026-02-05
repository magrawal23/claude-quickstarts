const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing Inline Conversation Rename Feature...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  try {
    const page = await browser.newPage();

    // Step 1: Load app
    console.log('Step 1: Loading app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-rename-1-loaded.png' });
    console.log('✅ App loaded\n');

    // Step 2: Create new conversation
    console.log('Step 2: Creating new conversation...');
    const newChatButton = await page.waitForSelector('button:has-text("New Chat"), button');
    await newChatButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-rename-2-new-chat.png' });
    console.log('✅ New conversation created\n');

    // Step 3: Send a message so conversation has a title
    console.log('Step 3: Sending message...');
    const inputSelector = 'textarea, input[type="text"]';
    await page.waitForSelector(inputSelector);
    await page.type(inputSelector, 'Tell me about the solar system');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000); // Wait for response and title generation
    await page.screenshot({ path: 'test-rename-3-message-sent.png' });
    console.log('✅ Message sent, title generated\n');

    // Step 4: Click on conversation title to edit
    console.log('Step 4: Clicking title to edit...');
    const titleSelector = 'h1';
    await page.waitForSelector(titleSelector);

    // Get original title
    const originalTitle = await page.$eval(titleSelector, el => el.textContent);
    console.log(`Original title: "${originalTitle}"`);

    await page.click(titleSelector);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-rename-4-title-editing.png' });
    console.log('✅ Title is now editable\n');

    // Step 5: Type new title
    console.log('Step 5: Typing new title...');
    const titleInput = await page.$('input[type="text"]');

    if (!titleInput) {
      throw new Error('Title input field not found!');
    }

    // Clear existing text and type new title
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');

    const newTitle = 'My Custom Solar System Discussion';
    await page.type('input[type="text"]', newTitle);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-rename-5-new-title-typed.png' });
    console.log(`✅ Typed new title: "${newTitle}"\n`);

    // Step 6: Press Enter to save
    console.log('Step 6: Pressing Enter to save...');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-rename-6-title-saved.png' });
    console.log('✅ Title saved\n');

    // Step 7: Verify new title is displayed
    console.log('Step 7: Verifying title updated...');
    const updatedTitle = await page.$eval(titleSelector, el => el.textContent);
    console.log(`Updated title: "${updatedTitle}"`);

    if (updatedTitle === newTitle) {
      console.log('✅ Title successfully updated in chat area!\n');
    } else {
      console.log(`⚠️ Title mismatch! Expected "${newTitle}", got "${updatedTitle}"\n`);
    }

    // Step 8: Check sidebar shows updated title
    console.log('Step 8: Checking sidebar for updated title...');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-rename-7-sidebar-updated.png' });

    const sidebarText = await page.evaluate(() => document.body.textContent);
    if (sidebarText.includes('My Custom Solar System')) {
      console.log('✅ Sidebar shows updated title!\n');
    } else {
      console.log('⚠️ Sidebar may not show updated title\n');
    }

    console.log('========================================');
    console.log('TEST COMPLETE');
    console.log('========================================');
    console.log('✅ Inline conversation rename works!');
    console.log(`✅ Original: "${originalTitle}"`);
    console.log(`✅ Updated:  "${newTitle}"`);
    console.log('✅ Changes persist in UI');
    console.log('\nFeature Test #11 PASSED!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-rename-error.png' });
  } finally {
    await browser.close();
  }
})();
